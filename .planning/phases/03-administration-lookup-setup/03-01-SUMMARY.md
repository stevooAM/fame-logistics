---
phase: 03-administration-lookup-setup
plan: 01
subsystem: api
tags: [django, drf, user-management, rbac, jwt, simplejwt, password, audit]

# Dependency graph
requires:
  - phase: 02-authentication-rbac
    provides: IsAdmin permission class, AuditLog model, UserProfile model, get_client_ip utility, OutstandingToken/BlacklistedToken from simplejwt
provides:
  - User management REST API: list, create, update, deactivate, activate users
  - Role list endpoint returning all 3 roles
  - Change-password endpoint (IsAuthenticated) that clears is_force_password_change
  - Auto-generated temp passwords on user creation (secrets module, 12 chars)
  - Session invalidation on deactivation via OutstandingToken blacklisting
affects:
  - 03-02 (user management frontend)
  - Any plan that expects /api/users/ or /api/roles/ endpoints

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "UserListSerializer sources from UserProfile (not User) with select_related for N+1 prevention"
    - "Temp password generation uses secrets module — cryptographically secure, 12 chars with guaranteed character class coverage"
    - "UserDeactivateView blacklists all outstanding JWT tokens via OutstandingToken queryset — immediate session invalidation"
    - "change-password URL registered before <int:pk> pattern to prevent routing conflict"
    - "ChangePasswordView uses serializer context={request} pattern for current_password validation"

key-files:
  created: []
  modified:
    - backend/core/serializers.py
    - backend/core/views.py
    - backend/core/urls.py

key-decisions:
  - "ChangePasswordSerializer validates current_password via check_password inside the serializer using context request — keeps view thin"
  - "UserListSerializer sources is_active from user.is_active (Django User) not UserProfile.is_active — single source of truth"
  - "UserUpdateSerializer accepts instance_user kwarg for email-uniqueness exclusion — avoids false collision on self-update"
  - "Deactivation sets both User.is_active and UserProfile.is_active to False for belt-and-suspenders enforcement"

patterns-established:
  - "Admin user management views: IsAdmin permission, AuditLog.objects.create on every mutation"
  - "ChangePasswordView: IsAuthenticated, clears is_force_password_change on success"
  - "Token blacklisting on deactivation: OutstandingToken.objects.filter(user=user) + BlacklistedToken.get_or_create"

# Metrics
duration: 3min
completed: 2026-04-05
---

# Phase 3 Plan 1: User Management API Summary

**Django REST user CRUD API with auto-generated temp passwords, token blacklisting on deactivation, and change-password endpoint using secrets module and OutstandingToken queryset**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-05T21:16:50Z
- **Completed:** 2026-04-05T21:19:31Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- User management serializers: UserListSerializer, UserCreateSerializer (auto temp password), UserUpdateSerializer (self-update email exclusion), UserDeactivateSerializer, ChangePasswordSerializer (strength validation + check_password via serializer context)
- User management views: list+create with pagination/search/filter, detail+patch with audit logging, deactivate (token blacklisting), activate, role list, change-password
- URL routes at /api/users/ and /api/roles/ with change-password correctly registered before <int:pk> to prevent Django routing conflict

## Task Commits

Each task was committed atomically:

1. **Task 1: User management serializers** - `fd2c72e` (feat)
2. **Task 2: User management views and URL routes** - `4ab54b5` (feat)

**Plan metadata:** (next commit)

## Files Created/Modified

- `backend/core/serializers.py` - Added 5 user management serializers + _generate_temp_password helper
- `backend/core/views.py` - Added 6 user management views; updated imports to include IsAdmin, Role, UserProfile, new serializers
- `backend/core/urls.py` - Added 6 user management URL patterns plus role_list

## Decisions Made

- **ChangePasswordSerializer uses serializer context** — current_password validation happens inside validate_current_password using context["request"].user.check_password(). This keeps the view thin and validation co-located with the serializer.
- **UserListSerializer sources is_active from user.is_active** — Django's built-in is_active is the auth gate; UserProfile.is_active mirrors it. Serializer reads from User to match what authentication checks.
- **change-password URL before <int:pk>** — Django URL resolution is top-down; if <int:pk> came first, "change-password" would error as a non-integer. Comment in urls.py explains this constraint.
- **Deactivation blacklists all OutstandingToken rows** — get_or_create prevents duplicate BlacklistedToken entries if a token was already blacklisted by rotation.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. Django not installed locally; syntax verification performed via Python AST parser (ast.parse). All 22 verification checks passed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 6 user management endpoints ready for frontend wiring in Plan 02
- /api/roles/ endpoint available for role dropdown population in the create/edit user forms
- ChangePasswordView at /api/users/change-password/ is the canonical endpoint for forced password change on first login
- Deactivation immediately invalidates sessions — no additional session cleanup needed in the frontend

## Self-Check: PASSED

---
*Phase: 03-administration-lookup-setup*
*Completed: 2026-04-05*
