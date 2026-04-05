---
phase: 02-authentication-rbac
plan: 02
subsystem: auth
tags: [drf, permissions, rbac, middleware, impersonation, django, auditlog]

# Dependency graph
requires:
  - phase: 02-authentication-rbac
    plan: 01
    provides: UserProfile.role FK, AuditLog model, Role model with 3 roles

provides:
  - DRF permission classes (HasRole base + 6 concrete classes) for server-side RBAC
  - Admin impersonation via X-Impersonate-User header with AuditLog tracking
  - Permission matrix documenting which class applies to each endpoint

affects:
  - All API views (every view will import from core/permissions.py)
  - 02-03 and beyond (auth views, customer views, job views)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "permission_classes = [IsAdminOrOperations] — standard DRF view protection pattern"
    - "HasRole.allowed_roles — subclass list controls which roles pass"
    - "request.user.profile.role.name — server-side role lookup, never JWT claims"
    - "request._original_user — audit trail pattern for impersonation"

key-files:
  created:
    - backend/core/permissions.py
    - backend/core/middleware.py
  modified:
    - backend/config/settings.py

key-decisions:
  - "Role checked from UserProfile.role.name (database), not from JWT claims — RBAC-02 compliance"
  - "Non-Admin impersonation header silently ignored — no capability disclosure"
  - "ImpersonationMiddleware placed after AuthenticationMiddleware to ensure request.user exists"

patterns-established:
  - "RBAC pattern: import permission class from core.permissions, assign to view's permission_classes"
  - "Impersonation audit: request._original_user always preserved for downstream audit logging"

# Metrics
duration: 2min
completed: 2026-04-05
---

# Phase 2 Plan 2: RBAC Permission Classes and Impersonation Middleware Summary

**HasRole-based DRF permission classes enforce 3-role RBAC server-side, with Admin impersonation via X-Impersonate-User header logged to AuditLog.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-05T11:41:19Z
- **Completed:** 2026-04-05T11:43:36Z
- **Tasks:** 2 completed
- **Files modified:** 3

## Accomplishments

- 6 DRF permission classes (HasRole base + IsAdmin, IsOperations, IsFinance, IsAdminOrOperations, IsAdminOrFinance, IsAnyRole) — all check UserProfile.role.name from the database
- ImpersonationMiddleware: Admin-only header-based user swap, silent for non-Admin, 404 for unknown target
- Full audit trail: impersonation events written to AuditLog with original user and IP; registered in settings after AuthenticationMiddleware

## Task Commits

Each task was committed atomically:

1. **Task 1: DRF permission classes for role-based access** - `3509a02` (feat)
2. **Task 2: Admin impersonation middleware** - `2a9629b` (feat)

## Files Created/Modified

- `backend/core/permissions.py` — HasRole base class + 6 concrete permission classes with permission matrix docstring
- `backend/core/middleware.py` — ImpersonationMiddleware: header detection, Admin check, user swap, AuditLog write
- `backend/config/settings.py` — ImpersonationMiddleware registered after AuthenticationMiddleware

## Decisions Made

- Role checked from `request.user.profile.role.name` (database), not JWT token claims — satisfies RBAC-02 server-side enforcement requirement
- Non-Admin requests with X-Impersonate-User header are silently ignored — no disclosure of impersonation capability to non-Admin users
- ImpersonationMiddleware placed immediately after AuthenticationMiddleware (position 7 in stack) so `request.user` is populated before impersonation logic runs

## Deviations from Plan

None — plan executed exactly as written.

The AuditLog.action "IMPERSONATE" choice and migration 0003 were already created by plan 02-01 (the prior plan in this phase), so no duplicate work was needed. Task 2 commit focused on the middleware and settings only.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Permission classes are ready to import into any DRF view via `permission_classes = [IsAdminOrOperations]`
- Impersonation is fully operational — Admin users can send X-Impersonate-User header to act as any user
- Plan 02-03 (auth views: login/logout/refresh/me) can now use these permission classes immediately

---
*Phase: 02-authentication-rbac*
*Completed: 2026-04-05*
