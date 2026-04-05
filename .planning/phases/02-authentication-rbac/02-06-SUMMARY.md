---
phase: 02-authentication-rbac
plan: "06"
subsystem: auth
tags: [react-context, nextjs-middleware, rbac, sidebar, session-management]

requires:
  - phase: 02-04
    provides: apiFetch client, login/logout/getMe functions in auth.ts and api.ts
  - phase: 02-05
    provides: useIdleTimeout hook and SessionWarningDialog component

provides:
  - AuthProvider React context (user, loading, logout, refreshUser)
  - useAuth() hook for consuming auth context in any client component
  - Next.js edge middleware redirecting unauthenticated requests to /login
  - Sidebar nav filtered by real user role (admin/operations/finance)
  - Sidebar user section showing real name, role badge, and working logout
  - Session warning dialog wired to idle timeout and token refresh

affects:
  - All future frontend feature modules that use useAuth() or apiFetch
  - Phase 03 (customers) — sidebar nav will show/hide Customers per role
  - Phase 05 (finance/accounts) — Finance role sidebar restricted to Accounts/Reports/Dashboard

tech-stack:
  added: []
  patterns:
    - "AuthProvider wraps dashboard layout — all dashboard child components can call useAuth()"
    - "Role comparisons always lowercase: user.role.name.toLowerCase()"
    - "Sidebar role filtering: filterNavByRole(navItems, userRole) in sidebar-nav"

key-files:
  created:
    - frontend/src/providers/auth-provider.tsx
    - frontend/src/middleware.ts
  modified:
    - frontend/src/app/(dashboard)/layout.tsx
    - frontend/src/lib/auth.ts
    - frontend/src/lib/navigation.ts
    - frontend/src/components/layout/sidebar-nav.tsx
    - frontend/src/components/layout/sidebar-user.tsx

key-decisions:
  - "UserProfile.role typed as {id, name} object — matches backend UserProfileSerializer output"
  - "middleware.ts cookie name is access_token — must match backend cookie set on login"
  - "Sidebar role comparison lowercases role.name so 'Admin' matches 'admin' in roles array"
  - "AuthProvider loading state shows full-screen spinner before routing guard can act"

patterns-established:
  - "useAuth(): standard hook for any client component needing user/role/logout"
  - "filterNavByRole(navItems, lowercasedRole): activated with real role from auth context"

duration: 2min
completed: 2026-04-05
---

# Phase 2 Plan 06: Frontend RBAC Wiring Summary

**React AuthProvider with edge middleware, role-filtered sidebar nav, real user info in sidebar, and session warning wired to idle timeout**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-05T11:55:37Z
- **Completed:** 2026-04-05T11:57:37Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- AuthProvider context providing user profile, loading state, logout, and refreshUser to entire dashboard
- Next.js edge middleware redirecting all unauthenticated requests to /login at the edge (no server round-trip)
- Sidebar navigation now filtered by real user role — Finance users cannot see Customers or Jobs
- Sidebar user section shows actual name, role badge, and a working logout button
- Session warning dialog wired to idle timeout: pops at 28 min, "Stay Logged In" refreshes token and resets timers

## Task Commits

1. **Task 1: AuthProvider context, Next.js middleware, route protection** - `a33fab7` (feat)
2. **Task 2: Sidebar RBAC — role-filtered nav, real user info, working logout** - `f7f0337` (feat)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified

- `frontend/src/providers/auth-provider.tsx` - AuthProvider component and useAuth() hook
- `frontend/src/middleware.ts` - Next.js edge middleware, protects all non-public routes
- `frontend/src/app/(dashboard)/layout.tsx` - Wraps dashboard children with AuthProvider
- `frontend/src/lib/auth.ts` - Fixed UserProfile type (role is object, not string)
- `frontend/src/lib/navigation.ts` - Updated to 3-role matrix, removed manager/viewer
- `frontend/src/components/layout/sidebar-nav.tsx` - Uses useAuth() for role-based filtering
- `frontend/src/components/layout/sidebar-user.tsx` - Shows real user data, wires logout

## Decisions Made

- **UserProfile.role typed as `{id, name}`** — backend `UserProfileSerializer` returns role as a nested object (not a flat string). Fixed the type in `auth.ts` to match; role comparison uses `user.role.name.toLowerCase()`.
- **middleware.ts cookie name is `access_token`** — must match the cookie name the backend sets on login. This is a hard dependency between plans 02-03 and this plan.
- **AuthProvider shows full-screen spinner during load** — prevents dashboard flash before user is verified; edge middleware handles truly unauthenticated users before React loads.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed UserProfile type: role is an object, not a string**

- **Found during:** Task 1 (AuthProvider creation)
- **Issue:** `auth.ts` typed `role` as `string`, but backend's `UserProfileSerializer` returns `role: { id, name }` (as confirmed by `RoleSerializer`). TypeScript would accept it but runtime `.role.name` access would fail silently.
- **Fix:** Added `UserRole` interface `{ id: number; name: string }`, updated `UserProfile.role` to `UserRole | null`, added `first_name` and `last_name` fields to match the actual API response shape.
- **Files modified:** `frontend/src/lib/auth.ts`
- **Verification:** `UserProfile` now matches `UserProfileSerializer` fields exactly
- **Committed in:** `a33fab7` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — type mismatch)
**Impact on plan:** Essential correction. Without it, `user.role.name` would throw a runtime TypeError and sidebar role filtering would break entirely.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Auth context fully wired — all Phase 3+ feature modules can call `useAuth()` to get the current user and role
- Edge middleware is active — unauthenticated deep-links redirect to `/login` immediately
- Sidebar RBAC working — Finance users will automatically see only Dashboard, Accounts, and Reports when Phase 3 routes are added
- Concern: middleware cookie name (`access_token`) must stay in sync with backend — document this as a cross-plan constraint

---
*Phase: 02-authentication-rbac*
*Completed: 2026-04-05*

## Self-Check: PASSED
