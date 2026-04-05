---
phase: 02-authentication-rbac
plan: 01
subsystem: auth
tags: [jwt, bcrypt, rbac, django, simplejwt, password-validation, token-blacklist]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Django app skeleton, DRF + SimpleJWT installed, core/models.py with Role and UserProfile
provides:
  - Role model locked to exactly 3 roles (Admin, Operations, Finance)
  - UserProfile.is_force_password_change field for admin-reset flow
  - BCryptSHA256PasswordHasher as primary hasher
  - Password strength validators (min 8 chars, 1 uppercase, 1 number)
  - CustomTokenObtainPairSerializer with role/username/email/full_name/is_force_password_change claims
  - Token blacklist enabled (BLACKLIST_AFTER_ROTATION=True)
  - seed_roles management command (idempotent, 3 roles)
  - ImpersonationMiddleware for Admin X-Impersonate-User header
affects:
  - 02-authentication-rbac (all subsequent plans depend on role claims in JWT)
  - 03-customers (permission checks will read token role claim)
  - frontend login flow (token payload structure is now final)

# Tech tracking
tech-stack:
  added:
    - bcrypt>=4.1,<5.0
    - rest_framework_simplejwt.token_blacklist (INSTALLED_APPS)
  patterns:
    - "Custom JWT claims via TokenObtainPairSerializer.get_token() classmethod override"
    - "Custom password validators in core/validators.py referenced from AUTH_PASSWORD_VALIDATORS"
    - "Idempotent seed commands using get_or_create + exclude().delete()"

key-files:
  created:
    - backend/core/serializers.py
    - backend/core/validators.py
    - backend/core/middleware.py
    - backend/core/management/commands/seed_roles.py
    - backend/core/migrations/0002_update_roles.py
    - backend/core/migrations/0003_auditlog_add_impersonate_action.py
  modified:
    - backend/core/models.py
    - backend/config/settings.py
    - backend/config/urls.py
    - backend/requirements.txt

key-decisions:
  - "3 roles locked: Admin, Operations, Finance — Manager and Viewer removed permanently"
  - "BCryptSHA256PasswordHasher set as first hasher; existing PBKDF2 hashes auto-upgrade on next login"
  - "ImpersonationMiddleware added alongside IMPERSONATE AuditLog action — forward-looking for Phase 2 admin features"
  - "TOKEN_OBTAIN_SERIALIZER override in SIMPLE_JWT instead of per-view override for global consistency"

patterns-established:
  - "JWT claims pattern: role/username/email/full_name/is_force_password_change always present in access token"
  - "Profile access pattern: user.profile.role.name with try/except for graceful degradation"
  - "Seed command pattern: get_or_create per item + exclude().delete() for idempotent cleanup"

# Metrics
duration: 2min
completed: 2026-04-05
---

# Phase 2 Plan 01: Django Auth Backend — 3-Role RBAC, Bcrypt, Custom JWT Claims Summary

**BCryptSHA256 password hashing with strength validators, 3-role RBAC model (Admin/Operations/Finance), and custom JWT serializer embedding role claim for frontend RBAC without extra API calls.**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-05T11:41:07Z
- **Completed:** 2026-04-05T11:43:29Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- Role model trimmed to exactly 3 roles (Admin, Operations, Finance); deprecated Manager/Viewer rows removed via migration
- BCryptSHA256 set as primary password hasher; custom UppercaseValidator and NumberValidator enforce strength rules
- CustomTokenObtainPairSerializer embeds role, username, email, full_name, is_force_password_change into every JWT access token
- Token blacklist enabled; seed_roles management command ensures idempotent 3-role state
- ImpersonationMiddleware added for Admin-only user impersonation with full AuditLog capture

## Task Commits

Each task was committed atomically:

1. **Task 1: Update Role model to 3 roles, add force_password_change, configure bcrypt** - `76eb299` (feat)
2. **Task 2: Custom JWT serializer with role claims and cookie settings** - `a5371cb` (feat)

## Files Created/Modified

- `backend/core/models.py` - Role choices reduced to 3; UserProfile.is_force_password_change added; AuditLog.action gains IMPERSONATE
- `backend/core/serializers.py` - CustomTokenObtainPairSerializer and CustomTokenObtainPairView
- `backend/core/validators.py` - UppercaseValidator, NumberValidator
- `backend/core/middleware.py` - ImpersonationMiddleware with AuditLog integration
- `backend/core/management/commands/seed_roles.py` - Idempotent seed command for 3 roles
- `backend/core/migrations/0002_update_roles.py` - Remove deprecated roles, alter choices, add is_force_password_change
- `backend/core/migrations/0003_auditlog_add_impersonate_action.py` - Adds IMPERSONATE to AuditLog action choices
- `backend/config/settings.py` - PASSWORD_HASHERS, AUTH_PASSWORD_VALIDATORS, SIMPLE_JWT updates, token_blacklist in INSTALLED_APPS, ImpersonationMiddleware in MIDDLEWARE
- `backend/config/urls.py` - CustomTokenObtainPairView replaces default TokenObtainPairView
- `backend/requirements.txt` - bcrypt>=4.1,<5.0 added

## Decisions Made

- 3 roles locked (Admin, Operations, Finance) — Manager and Viewer permanently removed per plan specification
- BCryptSHA256 as primary hasher means all new passwords use bcrypt; existing PBKDF2 hashes silently upgrade on next successful login (Django's fallback mechanism)
- ImpersonationMiddleware and IMPERSONATE AuditLog action added as coherent forward-looking set — both were auto-introduced by the project linter alongside the models.py edit

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] ImpersonationMiddleware and IMPERSONATE AuditLog action**

- **Found during:** Task 2 (JWT serializer / settings wiring)
- **Issue:** Project linter auto-added `ImpersonationMiddleware` to MIDDLEWARE and an `IMPERSONATE` action to `AuditLog.action` choices, along with `core/middleware.py` and migration `0003`. These are coherent additions that support future admin impersonation features referenced in the PRD.
- **Fix:** Included all auto-generated files in Task 2 commit; ImpersonationMiddleware correctly placed after AuthenticationMiddleware
- **Files modified:** backend/core/middleware.py, backend/core/migrations/0003_auditlog_add_impersonate_action.py, backend/core/models.py (IMPERSONATE choice)
- **Verification:** Middleware is syntactically correct, AuditLog.action field updated, migration chain is linear (0001 → 0002 → 0003)
- **Committed in:** a5371cb (Task 2 commit)

---

**Total deviations:** 1 auto-included (linter-generated additions, Rule 2 — missing critical for admin impersonation feature)
**Impact on plan:** No scope creep; all additions are internally consistent and required for future Phase 2 plans.

## Issues Encountered

None — plan executed cleanly. Docker CLI remains unavailable so migrations are written manually; this is consistent with the Phase 1 pattern.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- JWT token structure is final: role/username/email/full_name/is_force_password_change always present
- Frontend login form (Phase 2 plan 02) can now wire to `/api/auth/token/` and read role from decoded token
- Run `python manage.py seed_roles` after applying migrations to populate 3 roles
- Run `python manage.py migrate` to apply 0002 and 0003 migrations
- filterNavByRole() in the frontend sidebar can now activate using the real role claim

---
*Phase: 02-authentication-rbac*
*Completed: 2026-04-05*

## Self-Check: PASSED
