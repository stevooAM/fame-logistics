---
phase: 02-authentication-rbac
verified: 2026-04-05T12:01:09Z
status: gaps_found
score: 4/5 must-haves verified
gaps:
  - truth: "A user assigned the Finance role cannot access Customers or Jobs pages — enforced at the API layer (returns 403), not just hidden in the UI"
    status: failed
    reason: "Permission classes are defined in core/permissions.py but no API endpoints for /customers/ or /jobs/ exist yet. customers/ and jobs/ apps have no views.py, no URLs registered, and no routes in config/urls.py. The RBAC permission classes are orphaned — they cannot enforce 403 on a request when no endpoint accepts that request."
    artifacts:
      - path: "backend/core/permissions.py"
        issue: "File exists and is substantive — 6 permission classes correctly implemented. But grep across the entire backend shows only this file and core/views.py reference permission_classes; no downstream app imports them."
      - path: "backend/customers/"
        issue: "App directory exists with models.py (39 lines) and admin.py but no views.py, no urls.py, and no URL registration in config/urls.py. No API surface to protect."
      - path: "backend/jobs/"
        issue: "App directory exists with models.py (97 lines) and admin.py but no views.py, no urls.py, and no URL registration in config/urls.py. No API surface to protect."
    missing:
      - "customers/views.py with a view that declares permission_classes = [IsAdminOrOperations]"
      - "jobs/views.py with a view that declares permission_classes = [IsAdminOrOperations]"
      - "URL patterns for /api/customers/ and /api/jobs/ registered in config/urls.py or customers/urls.py"
      - "A request to /api/customers/ or /api/jobs/ by a Finance user must return HTTP 403 (not 404)"
---

# Phase 2: Authentication & RBAC Verification Report

**Phase Goal:** Staff can log in with a username and password, maintain a session across navigation, and be shown only the modules their role permits — all enforced server-side.
**Verified:** 2026-04-05T12:01:09Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | A staff member can log in at /login, navigate multiple pages without being asked to log in again, and log out cleanly back to /login | VERIFIED | LoginView sets HttpOnly access_token + refresh_token cookies on POST /api/auth/login/. CookieJWTAuthentication reads the cookie on every request. AuthProvider calls getMe() on mount; on success, subsequent navigation stays authenticated. logout() calls POST /api/auth/logout/ which blacklists the refresh token, clears cookies, then redirects window.location.href="/login". |
| 2 | An unauthenticated request to any protected URL is redirected to /login — including direct URL entry | VERIFIED | frontend/src/middleware.ts is substantive edge middleware. It checks for the access_token cookie; if absent it calls NextResponse.redirect to /login. Matcher covers all paths except /login, /forgot-password, /reset-password, /_next, /favicon.ico, /api. The DRF backend's DEFAULT_AUTHENTICATION_CLASSES is CookieJWTAuthentication and DEFAULT_PERMISSION_CLASSES is IsAuthenticated, so unauthenticated API calls also return 401. |
| 3 | A failed login attempt shows a generic "Invalid credentials" error without indicating which field is wrong | VERIFIED | LoginView lines 139, 147, 150 return {"error": "Invalid credentials"} with HTTP 401 for all failure cases: invalid serializer, wrong credentials, and inactive user — identical message in all three branches. Frontend getErrorMessage() maps 401 to "Invalid credentials. Please try again." — no field-specific disclosure. |
| 4 | An idle session (30 min default) expires and the user is redirected to /login on next interaction | VERIFIED | useIdleTimeout hook (use-idle-timeout.ts, 139 lines) fires onTimeout after 30 min of inactivity. AuthProvider wires onTimeout to logoutRef.current(), which calls authLogout() from auth.ts, which calls POST /api/auth/logout/ then sets window.location.href="/login". The hook is mounted in AuthProvider which wraps the entire dashboard layout. setupTokenRefresh() (13-min proactive refresh) is also wired in AuthProvider's useEffect, preventing premature expiry during active sessions. SessionWarningDialog fires at 28 min with explicit Stay/Logout choice. |
| 5 | A user assigned the Finance role cannot access Customers or Jobs pages — enforced at the API layer (returns 403), not just hidden in the UI | FAILED | The permission classes (IsAdminOrOperations, IsAdminOrFinance, etc.) are correctly implemented in core/permissions.py and check UserProfile.role.name from the database. The sidebar navigation correctly hides Customers/Jobs from Finance users via filterNavByRole(). However, no API endpoints for /api/customers/ or /api/jobs/ exist — customers/ and jobs/ apps have no views.py and no URLs are registered. There is no API surface for the permission classes to guard. A Finance user who bypasses the UI would receive a 404 (route not found) rather than a 403 (forbidden). The server-side 403 enforcement required by this truth cannot be tested or confirmed because the protected endpoints do not exist yet. |

**Score:** 4/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `backend/core/views.py` | Login, logout, refresh, me, password-reset endpoints | VERIFIED | 484 lines, all 7 views fully implemented with real logic, HttpOnly cookies, AuditLog writes |
| `backend/core/authentication.py` | CookieJWTAuthentication reading from cookie | VERIFIED | 34 lines, subclasses JWTAuthentication, reads access_token cookie, returns (user, validated_token) |
| `backend/core/permissions.py` | RBAC permission classes for server-side enforcement | VERIFIED (orphaned) | 109 lines, 6 permission classes, checks UserProfile.role.name from DB — but not imported by any view other than its own definition |
| `backend/core/middleware.py` | LoginRateLimitMiddleware + ImpersonationMiddleware | VERIFIED | 239 lines, both middleware classes fully implemented and wired in settings.py MIDDLEWARE list |
| `backend/config/settings.py` | CookieJWTAuthentication as default auth, Redis cache, SimpleJWT config | VERIFIED | DEFAULT_AUTHENTICATION_CLASSES set, CACHES Redis configured, ACCESS_TOKEN_LIFETIME=15min, ROTATE_REFRESH_TOKENS=True |
| `backend/core/urls.py` | All 7 auth URL patterns | VERIFIED | All 7 patterns registered: login, logout, refresh, me, password-reset/request, password-reset/confirm, password-change |
| `frontend/src/app/login/page.tsx` | Wired login form with error handling and redirect | VERIFIED | 317 lines, React Hook Form + Zod, calls login() from auth.ts, handles 401/429/network errors distinctly, redirects to / on success |
| `frontend/src/lib/api.ts` | apiFetch<T> wrapper with silent 401 refresh | VERIFIED | 134 lines, credentials: include, 401 → silentRefresh → retry → redirectToLogin(), setupTokenRefresh() exported |
| `frontend/src/lib/auth.ts` | login/logout/refreshToken/getMe functions | VERIFIED | 98 lines, all 4 functions implemented, UserProfile typed with UserRole object, logout redirects to /login |
| `frontend/src/providers/auth-provider.tsx` | AuthProvider with useAuth hook | VERIFIED | 152 lines, provides user/loading/logout/refreshUser context, wires useIdleTimeout + setupTokenRefresh + SessionWarningDialog |
| `frontend/src/middleware.ts` | Next.js edge middleware for route protection | VERIFIED | 40 lines, checks access_token cookie, redirects unauthenticated to /login, correct matcher config |
| `frontend/src/hooks/use-idle-timeout.ts` | Idle timeout hook with 30-min default | VERIFIED | 139 lines, activity throttling, warning at 28 min, timeout at 30 min, stable useRef callbacks |
| `frontend/src/components/auth/session-warning-dialog.tsx` | Session warning modal | VERIFIED | 60 lines, blocks Escape and backdrop dismiss, Stay Logged In / Log Out buttons |
| `frontend/src/lib/navigation.ts` | 3-role nav items with filterNavByRole() | VERIFIED | 79 lines, Customers and Jobs have roles: ["admin", "operations"] — Finance excluded |
| `frontend/src/components/layout/sidebar-nav.tsx` | Sidebar using useAuth for role-filtered nav | VERIFIED | 74 lines, calls useAuth(), gets user.role.name.toLowerCase(), passes to filterNavByRole() |
| `backend/customers/views.py` | Customer API views with IsAdminOrOperations permission | MISSING | File does not exist — customers app has no views.py |
| `backend/jobs/views.py` | Jobs API views with IsAdminOrOperations permission | MISSING | File does not exist — jobs app has no views.py |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `login/page.tsx` | `POST /api/auth/login/` | `login()` in auth.ts | WIRED | login() calls fetch with credentials: include, page.tsx calls login() in onSubmit |
| `AuthProvider` | `GET /api/auth/me/` | `getMe()` in auth.ts → apiFetch | WIRED | loadUser() calls getMe() on mount; apiFetch sends cookie |
| `AuthProvider` | `/login` on logout | `authLogout()` → window.location.href | WIRED | logout() calls authLogout(), which sets window.location.href="/login" in finally block |
| `AuthProvider` | `useIdleTimeout` | `onTimeout` callback | WIRED | onTimeout wired to logoutRef.current() in AuthProvider; logoutRef kept in sync with logout function |
| `AuthProvider` | `setupTokenRefresh` | useEffect on mount | WIRED | setupTokenRefresh() called in useEffect([]) returning cleanup fn |
| `apiFetch` | `/api/auth/refresh/` on 401 | `silentRefresh()` | WIRED | response.status === 401 → silentRefresh() → retry → redirectToLogin() |
| `CookieJWTAuthentication` | `access_token` cookie | `request.COOKIES.get()` | WIRED | Cookie name "access_token" consistent between LoginView setter and CookieJWTAuthentication reader |
| `LoginRateLimitMiddleware` | Redis cache | `django.core.cache` | WIRED | cache.get/set/incr/delete calls present, Redis configured in CACHES setting |
| `core/permissions.py` (HasRole) | customer/job API views | `permission_classes = [IsAdminOrOperations]` | NOT WIRED | Permission classes defined but no customer/job API views exist to apply them to |
| `sidebar-nav.tsx` | `filterNavByRole()` | `useAuth()` + navigation.ts | WIRED | SidebarNav calls useAuth(), extracts role, passes to filterNavByRole() |
| `DashboardLayout` | `AuthProvider` | import + JSX wrapping | WIRED | DashboardLayout wraps children in `<AuthProvider>` |

### Requirements Coverage

| Requirement | Status | Blocking Issue |
|-------------|--------|----------------|
| Staff can authenticate with username + password | SATISFIED | — |
| Session persists across navigation (HttpOnly cookie) | SATISFIED | — |
| Unauthenticated requests redirected to /login | SATISFIED | Edge middleware + DRF default auth |
| Generic error on failed login (no credential enumeration) | SATISFIED | All 3 failure branches return identical "Invalid credentials" |
| 30-min idle session timeout with user redirect | SATISFIED | useIdleTimeout + AuthProvider + logout() chain complete |
| Rate limiting on login (10 attempts/15 min) | SATISFIED | LoginRateLimitMiddleware in Redis |
| Finance role cannot access Customers/Jobs — API layer 403 | BLOCKED | No API endpoints for customers/jobs exist; permission classes are orphaned |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `backend/core/permissions.py` | (whole file) | Defined but never imported | Warning | Permission classes are substantive and correct but currently dead code — no view imports them |
| `frontend/src/lib/auth.ts` | 79-90 | refreshToken() ignores response status | Info | Returns `true` even if the refresh request returns non-2xx (fetch succeeds but response.ok may be false). The AuthProvider's "Stay logged in" handler would incorrectly report success on a failed refresh. Not a blocker for session establishment but reduces reliability of the warning dialog flow. |

### Human Verification Required

None of the 4 verified truths require human testing to confirm — the code wiring can be traced structurally. The one gap (Truth #5) is a structural absence, not a visual or behavioral question.

### Gaps Summary

One gap blocks goal achievement. The phase goal states RBAC must be "enforced server-side" — specifically that a Finance user cannot access Customers or Jobs endpoints at the API layer. The permission infrastructure (HasRole, IsAdminOrOperations, IsAdminOrFinance) is fully implemented and correct. The sidebar correctly hides the nav items. But the API endpoints that would receive and reject Finance-role requests do not exist yet.

The customers and jobs Django apps contain only model definitions and admin.py stubs. There are no views, no URLs, and no routes in config/urls.py. A Finance user who constructs a direct HTTP request to /api/customers/ today receives a 404 (no route), not a 403 (forbidden by RBAC). The goal's server-side enforcement requirement is structurally unmet.

This gap is scoped: the permission class to use (IsAdminOrOperations) is already written and tested in its definition. Closing the gap requires creating the minimum viable views.py and urls.py for customers and jobs that declare that permission class — the actual model CRUD can be Phase 3 work.

---

_Verified: 2026-04-05T12:01:09Z_
_Verifier: Claude (gsd-verifier)_
