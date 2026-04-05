"""
Fame FMS Custom Middleware
==========================

LoginRateLimitMiddleware
------------------------
Protects POST /api/auth/login/ against brute-force attacks.
- Tracks failed login attempts per IP address in Django cache (Redis)
- Blocks after LOGIN_RATE_LIMIT_MAX failures within LOGIN_RATE_LIMIT_WINDOW seconds
- Returns 429 with a descriptive error message when limit exceeded
- Clears counter on successful login
- Keys expire automatically via TTL — no manual cleanup needed

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
from django.core.cache import cache
from django.http import HttpRequest, HttpResponse, JsonResponse

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Rate limiting constants
# ---------------------------------------------------------------------------

LOGIN_RATE_LIMIT_MAX = 10      # Maximum failed attempts before block
LOGIN_RATE_LIMIT_WINDOW = 900  # Tracking window: 15 minutes (seconds)
LOGIN_PATH = "/api/auth/login/"


class LoginRateLimitMiddleware:
    """
    Middleware that blocks brute-force login attempts.

    Tracks failed POST /api/auth/login/ attempts per IP address in Redis cache.
    After LOGIN_RATE_LIMIT_MAX failures within LOGIN_RATE_LIMIT_WINDOW seconds,
    subsequent attempts receive a 429 response.

    Counter is cleared on successful login (201 or 200 response from LoginView).

    Must be placed BEFORE the view layer in MIDDLEWARE so it can inspect
    both the incoming request and the outgoing response.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        # Only apply rate limiting to POST /api/auth/login/
        if request.method != "POST" or request.path != LOGIN_PATH:
            return self.get_response(request)

        ip = self._get_ip(request)
        cache_key = f"login_attempts:{ip}"

        # Check current attempt count
        attempt_count = cache.get(cache_key, 0)
        if attempt_count >= LOGIN_RATE_LIMIT_MAX:
            logger.warning(
                "Login rate limit exceeded for IP %s (%d attempts)",
                ip,
                attempt_count,
            )
            return JsonResponse(
                {"error": "Too many login attempts. Please try again in 15 minutes."},
                status=429,
            )

        # Let the request through and observe the response
        response = self.get_response(request)

        if response.status_code == 401:
            # Failed login — increment counter with TTL on first failure
            if attempt_count == 0:
                cache.set(cache_key, 1, timeout=LOGIN_RATE_LIMIT_WINDOW)
            else:
                cache.incr(cache_key)
            logger.debug(
                "Failed login from IP %s — attempt %d/%d",
                ip,
                attempt_count + 1,
                LOGIN_RATE_LIMIT_MAX,
            )
        elif response.status_code == 200:
            # Successful login — reset counter
            cache.delete(cache_key)

        return response

    @staticmethod
    def _get_ip(request: HttpRequest) -> str:
        """Extract client IP (respects X-Forwarded-For)."""
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR", "")
        if x_forwarded_for:
            return x_forwarded_for.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR", "unknown")

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
