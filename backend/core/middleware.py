"""
Fame FMS Custom Middleware
==========================

ImpersonationMiddleware
-----------------------
Allows Admin users to act as another user for support/troubleshooting purposes.

How it works:
  - Client includes ``X-Impersonate-User: <username>`` header in the request
  - Middleware verifies the requesting user is an Admin (server-side check)
  - ``request.user`` is replaced with the target user for the duration of the request
  - Original user is preserved in ``request._original_user`` for audit logging
  - Every impersonation event is written to AuditLog

Security guarantees:
  - Non-Admin requests with the header are silently ignored (no capability disclosure)
  - Target user not found → 404 JSON response, original user NOT leaked
  - The swap only happens within a single request lifecycle; sessions/tokens are unaffected
"""

import json
import logging

from django.contrib.auth.models import User
from django.http import HttpRequest, HttpResponse

logger = logging.getLogger(__name__)

_IMPERSONATE_HEADER = "HTTP_X_IMPERSONATE_USER"  # Django converts - to _ and uppercases


class ImpersonationMiddleware:
    """
    Middleware that allows Admin users to impersonate another user.

    Must be placed AFTER ``django.contrib.auth.middleware.AuthenticationMiddleware``
    in MIDDLEWARE so that ``request.user`` is already set when this runs.

    Activation:
        Send header ``X-Impersonate-User: <target_username>`` with any request.

    Behaviour:
        - Admin requesting user → swap ``request.user`` to target, log audit event
        - Non-Admin requesting user → header silently ignored
        - Target username not found → return 404 JSON immediately
        - Header absent → pass through unchanged (zero overhead for normal traffic)
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        target_username = request.META.get(_IMPERSONATE_HEADER)

        if target_username:
            response = self._handle_impersonation(request, target_username)
            if response is not None:
                # Early exit — e.g. 404 for unknown target user
                return response

        return self.get_response(request)

    def _handle_impersonation(self, request: HttpRequest, target_username: str):
        """
        Attempt to set up impersonation for this request.

        Returns an HttpResponse if the request should be short-circuited
        (e.g. target not found), otherwise returns None to let the request
        continue to the view.
        """
        requesting_user = request.user

        # Only process if the requesting user is authenticated and is Admin
        if not requesting_user or not requesting_user.is_authenticated:
            return None  # Silently ignore — not authenticated at all

        try:
            role_name = requesting_user.profile.role.name
        except AttributeError:
            # No profile or role — treat as non-Admin, ignore header
            return None

        if role_name != "Admin":
            # Silently ignore — do NOT reveal that impersonation is a feature
            return None

        # Requesting user IS Admin — proceed to look up target
        try:
            target_user = User.objects.select_related("profile__role").get(
                username=target_username
            )
        except User.DoesNotExist:
            logger.warning(
                "Impersonation rejected: Admin %s requested unknown user '%s'",
                requesting_user.username,
                target_username,
            )
            return HttpResponse(
                json.dumps(
                    {
                        "detail": f"User '{target_username}' not found.",
                        "code": "impersonate_target_not_found",
                    }
                ),
                content_type="application/json",
                status=404,
            )

        # Swap request.user for this request's lifecycle
        request._original_user = requesting_user
        request._impersonated_user = target_user
        request.user = target_user

        logger.info(
            "IMPERSONATE: Admin '%s' acting as '%s'",
            requesting_user.username,
            target_username,
        )

        # Write audit log entry (deferred import to avoid circular at module load)
        self._log_impersonation(requesting_user, target_username, request)

        return None  # Continue to view

    @staticmethod
    def _log_impersonation(original_user, target_username: str, request: HttpRequest):
        """Write an IMPERSONATE entry to AuditLog, failing gracefully."""
        try:
            from core.models import AuditLog  # local import avoids circular import

            ip = (
                request.META.get("HTTP_X_FORWARDED_FOR", "").split(",")[0].strip()
                or request.META.get("REMOTE_ADDR")
            )

            AuditLog.objects.create(
                user=original_user,
                action="IMPERSONATE",
                model_name="User",
                object_id="",
                object_repr=target_username,
                changes={},
                ip_address=ip or None,
            )
        except Exception:
            # Never let audit log failure break a request
            logger.exception(
                "Failed to write impersonation audit log for admin '%s' → '%s'",
                original_user.username,
                target_username,
            )
