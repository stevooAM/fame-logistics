"""
DRF Permission Classes for Fame FMS RBAC Enforcement
=====================================================

All permission checks use server-side UserProfile.role lookup — NOT JWT claims.
This satisfies requirement RBAC-02: authoritative role source is the database.

Permission Matrix
-----------------
  Endpoint          Permission Class        Allowed Roles
  ────────────────────────────────────────────────────────
  Dashboard         IsAnyRole               Admin, Operations, Finance
  Customers         IsAdminOrOperations     Admin, Operations
  Jobs              IsAdminOrOperations     Admin, Operations
  Approvals         IsAdmin                 Admin only
  Accounts          IsAdminOrFinance        Admin, Finance
  Reports           IsAnyRole               Admin, Operations, Finance
  Admin Panel       IsAdmin                 Admin only
  User Management   IsAdmin                 Admin only

Usage
-----
  from core.permissions import IsAdminOrOperations

  class CustomerViewSet(ModelViewSet):
      permission_classes = [IsAdminOrOperations]
"""

import logging

from rest_framework.permissions import BasePermission

logger = logging.getLogger(__name__)


class HasRole(BasePermission):
    """
    Base permission class for role-based access control.

    Subclasses must define ``allowed_roles`` as a list of role name strings.
    The role is resolved from ``request.user.profile.role.name`` — the database
    is the authoritative source, not the JWT payload.

    Returns False (deny) when:
    - User is not authenticated
    - User has no associated UserProfile
    - UserProfile has no role assigned
    - User's role is not in ``allowed_roles``
    """

    allowed_roles: list[str] = []

    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False

        try:
            role_name = request.user.profile.role.name
        except AttributeError:
            # No profile or no role — deny access
            logger.warning(
                "Permission denied: user %s has no profile or role",
                getattr(request.user, "username", "<anonymous>"),
            )
            return False

        return role_name in self.allowed_roles


class IsAdmin(HasRole):
    """Grants access to Admin role only."""

    allowed_roles = ["Admin"]


class IsOperations(HasRole):
    """Grants access to Operations role only."""

    allowed_roles = ["Operations"]


class IsFinance(HasRole):
    """Grants access to Finance role only."""

    allowed_roles = ["Finance"]


class IsAdminOrOperations(HasRole):
    """Grants access to Admin and Operations roles."""

    allowed_roles = ["Admin", "Operations"]


class IsAdminOrFinance(HasRole):
    """Grants access to Admin and Finance roles."""

    allowed_roles = ["Admin", "Finance"]


class IsAnyRole(HasRole):
    """
    Grants access to any user who has an assigned role.

    This is effectively 'any authenticated staff member'. It still requires a
    UserProfile with a role — a bare Django user without a profile is denied.
    """

    allowed_roles = ["Admin", "Operations", "Finance"]
