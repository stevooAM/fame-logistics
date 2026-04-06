"""
Audit log utilities for Fame FMS.

Provides:
  - AuditLogMixin: DRF mixin for auto-logging CRUD operations on ViewSets
  - log_audit(): Standalone function for manual audit logging in non-ViewSet views
"""

import logging

from core.models import AuditLog
from core.utils import get_client_ip

logger = logging.getLogger(__name__)


def log_audit(
    user,
    action: str,
    model_name: str,
    object_id,
    object_repr: str,
    ip_address,
    changes: dict | None = None,
) -> None:
    """
    Standalone function for manual audit logging.

    Use this in non-ViewSet views (e.g. user management) or wherever
    AuditLogMixin cannot be used.

    Args:
        user: Django auth.User instance (or None for system actions)
        action: One of CREATE, UPDATE, DELETE, LOGIN, LOGOUT, IMPERSONATE
        model_name: The model/entity being acted on (e.g. "User", "Customer")
        object_id: Primary key or identifier of the affected record
        object_repr: Human-readable string of the affected record
        ip_address: Client IP address string (may be None)
        changes: Optional dict describing what changed (old/new values)
    """
    try:
        AuditLog.objects.create(
            user=user,
            action=action,
            model_name=model_name,
            object_id=str(object_id) if object_id is not None else "",
            object_repr=str(object_repr)[:200],
            changes=changes or {},
            ip_address=ip_address,
        )
    except Exception:
        logger.exception(
            "Failed to write %s audit log for %s (id=%s)",
            action,
            model_name,
            object_id,
        )


class AuditLogMixin:
    """
    DRF mixin that auto-logs CREATE, UPDATE, and DELETE operations.

    Usage:
        class MyViewSet(AuditLogMixin, ModelViewSet):
            queryset = MyModel.objects.all()
            ...

    The mixin hooks into DRF's perform_create(), perform_update(), and
    perform_destroy() lifecycle methods. All three use _log_action() which
    wraps AuditLog creation in a try/except so audit failures never break
    the primary operation.
    """

    def _log_action(self, request, action: str, instance, description: str = "") -> None:
        """
        Create an AuditLog entry for the given action and instance.

        Args:
            request: DRF request object (provides user + IP)
            action: One of CREATE, UPDATE, DELETE
            instance: The model instance that was acted on
            description: Optional extra description stored in changes.description
        """
        changes = {"description": description} if description else {}
        log_audit(
            user=request.user if request.user.is_authenticated else None,
            action=action,
            model_name=instance.__class__.__name__,
            object_id=getattr(instance, "pk", ""),
            object_repr=str(instance),
            ip_address=get_client_ip(request),
            changes=changes,
        )

    def perform_create(self, serializer):
        """Call super then log the CREATE action."""
        super().perform_create(serializer)
        instance = serializer.instance
        self._log_action(self.request, "CREATE", instance)

    def perform_update(self, serializer):
        """Call super then log the UPDATE action."""
        super().perform_update(serializer)
        instance = serializer.instance
        self._log_action(self.request, "UPDATE", instance)

    def perform_destroy(self, instance):
        """Capture repr and pk BEFORE destroy, then log DELETE."""
        # Must capture before deletion — instance PK becomes None after delete
        object_id = getattr(instance, "pk", "")
        object_repr = str(instance)
        model_name = instance.__class__.__name__
        request = self.request

        super().perform_destroy(instance)

        try:
            AuditLog.objects.create(
                user=request.user if request.user.is_authenticated else None,
                action="DELETE",
                model_name=model_name,
                object_id=str(object_id),
                object_repr=object_repr[:200],
                changes={},
                ip_address=get_client_ip(request),
            )
        except Exception:
            logger.exception(
                "Failed to write DELETE audit log for %s (id=%s)",
                model_name,
                object_id,
            )
