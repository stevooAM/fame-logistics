---
phase: 02-authentication-rbac
plan: "03"
subsystem: auth
tags: [jwt, django, httponly-cookies, rate-limiting, redis, password-reset, rbac]

# Dependency graph
requires:
  - phase: 02-01
    provides: CustomTokenObtainPairSerializer with role/profile claims, UserProfile model, BCrypt hasher
  - phase: 02-02
    provides: ImpersonationMiddleware, AuditLog IMPERSONATE action, RBAC permissions
provides:
  - POST /api/auth/login/ — cookie-based JWT login with AuditLog
  - POST /api/auth/logout/ — refresh token blacklist + cookie clearing
  - POST /api/auth/refresh/ — access token rotation from cookie
  - GET /api/auth/me/ — current user profile with role
  - POST /api/auth/password-reset/request/ — self-service reset token (silent success)
  - POST /api/auth/password-reset/confirm/ — UUID token validation + password set
  - POST /api/auth/password-change/ — authenticated password change (force-reset flow)
  - Redis-backed login rate limiting: 10 attempts / 15 min per IP
  - CookieJWTAuthentication: reads JWT from HttpOnly cookie for all DRF views
affects: [02-04, 02-05, frontend-auth-wiring, phase-3-onwards]

# Tech tracking
tech-stack:
  added:
    - django.core.cache.backends.redis.RedisCache (Django built-in, no new package)
  patterns:
    - HttpOnly cookie JWT storage (never localStorage) — XSS protection
    - Silent success on password-reset-request — email enumeration prevention
    - Generic 401 on login failure — credential enumeration prevention
    - Per-IP Redis counter with TTL for rate limiting (no cleanup tasks needed)
    - CookieJWTAuthentication subclass of SimpleJWT for transparent cookie auth

key-files:
  created:
    - backend/core/authentication.py
    - backend/core/utils.py
    - backend/core/migrations/0004_password_reset_token.py
  modified:
    - backend/core/views.py
    - backend/core/serializers.py
    - backend/core/models.py
    - backend/core/urls.py
    - backend/core/middleware.py
    - backend/config/urls.py
    - backend/config/settings.py

key-decisions:
  - "CookieJWTAuthentication replaces header-based JWT auth — all DRF views now read from HttpOnly cookie"
  - "LoginRateLimitMiddleware positioned after ImpersonationMiddleware so impersonation header is already resolved"
  - "RefreshView performs full refresh token rotation (blacklists old, issues new) matching ROTATE_REFRESH_TOKENS=True"
  - "PasswordResetToken model uses UUID primary token field with db_index for O(1) lookup"

patterns-established:
  - "Silent success pattern: password-reset-request always returns 200 to prevent email enumeration"
  - "Cookie flags: HttpOnly=True, Secure=(not DEBUG), SameSite=Lax, Path=/ — used consistently across all cookie writes"
  - "AuditLog written on LOGIN and LOGOUT with IP from get_client_ip() helper"
  - "Force-password-change flag cleared on both password-reset-confirm and password-change paths"

# Metrics
duration: 3min
completed: 2026-04-05
---

# Phase 2 Plan 03: Auth API Endpoints Summary

**7 HttpOnly-cookie JWT auth endpoints with Redis-backed brute-force rate limiting and self-service password reset**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-05T11:46:21Z
- **Completed:** 2026-04-05T11:49:20Z
- **Tasks:** 2
- **Files modified:** 9 (7 modified, 2 created, 1 new migration)

## Accomplishments

- Full cookie-based JWT auth: login sets access+refresh as HttpOnly cookies, logout blacklists and clears them, refresh rotates both tokens
- Self-service password reset: request (silent/safe) + confirm (UUID token, 1hr TTL, force-change flag cleared)
- Authenticated password change endpoint for the forced-reset flow
- Redis-backed login rate limiter: 10 failed attempts per IP per 15 minutes (429 response)
- CookieJWTAuthentication backend registered globally — all DRF views authenticate from cookie transparently

## Task Commits

1. **Task 1: Auth API views — login, logout, refresh, me, password reset** - `5af2de9` (feat)
2. **Task 2: Rate limiting middleware — 10 failed logins per IP per 15 minutes** - `9da3f34` (feat)

## Files Created/Modified

- `backend/core/views.py` — LoginView, LogoutView, RefreshView, MeView, PasswordResetRequestView, PasswordResetConfirmView, PasswordChangeView
- `backend/core/serializers.py` — Added LoginSerializer, PasswordResetRequestSerializer, PasswordResetConfirmSerializer, PasswordChangeSerializer, UserProfileSerializer, RoleSerializer
- `backend/core/models.py` — Added PasswordResetToken model with UUID token, expires_at, is_used
- `backend/core/migrations/0004_password_reset_token.py` — PasswordResetToken migration (manual, Docker CLI unavailable)
- `backend/core/urls.py` — All 7 auth URL patterns registered
- `backend/core/authentication.py` — CookieJWTAuthentication (reads JWT from HttpOnly cookie)
- `backend/core/utils.py` — get_client_ip() helper (X-Forwarded-For aware)
- `backend/core/middleware.py` — LoginRateLimitMiddleware appended
- `backend/config/urls.py` — Removed old SimpleJWT token endpoint (replaced by LoginView)
- `backend/config/settings.py` — CookieJWTAuthentication set as auth class, CACHES config added, LoginRateLimitMiddleware added to MIDDLEWARE

## Decisions Made

- **CookieJWTAuthentication instead of header auth:** DRF's default reads the `Authorization: Bearer` header. Since login now stores tokens in HttpOnly cookies, a custom authentication backend was needed. Subclassed `JWTAuthentication` to read from `access_token` cookie — zero impact on existing permission classes.
- **LoginRateLimitMiddleware after ImpersonationMiddleware:** Rate limiting must wrap the view response to detect 401 failures. Placed after ImpersonationMiddleware which needs `request.user` already set (ImpersonationMiddleware runs after AuthenticationMiddleware).
- **Full token rotation on refresh:** RefreshView blacklists the old refresh token and issues a fresh one, consistent with `ROTATE_REFRESH_TOKENS=True` in SIMPLE_JWT settings.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added CookieJWTAuthentication backend**

- **Found during:** Task 1 (LoginView implementation)
- **Issue:** Plan specified cookie-based JWT but DRF's default JWTAuthentication reads the Authorization header. Without a cookie authentication backend, all `IsAuthenticated` views would reject valid cookie-holding requests.
- **Fix:** Created `backend/core/authentication.py` with `CookieJWTAuthentication` subclassing SimpleJWT's `JWTAuthentication`. Updated `DEFAULT_AUTHENTICATION_CLASSES` in settings.
- **Files modified:** backend/core/authentication.py, backend/config/settings.py
- **Verification:** MeView and LogoutView use `IsAuthenticated` — both now work with cookie-sent access tokens.
- **Committed in:** `5af2de9` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Required for the cookie auth model to work end-to-end. No scope creep.

## Issues Encountered

None — all endpoints implemented as specified in the plan.

## User Setup Required

None - no external service configuration required beyond Redis (already in docker-compose).

## Next Phase Readiness

- All 7 auth endpoints ready for frontend wiring (Phase 2 plans 04+)
- Login form at /login can now call POST /api/auth/login/ with username/password/remember_me
- `GET /api/auth/me/` returns role — unblocks `filterNavByRole()` in the sidebar (stubbed in 01-04)
- Redis rate limiting active once containers restart with updated settings
- Blocker cleared: `[Phase 2]: Login form at /login is not wired to auth API`

## Self-Check: PASSED

---
*Phase: 02-authentication-rbac*
*Completed: 2026-04-05*
