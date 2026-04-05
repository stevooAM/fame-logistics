---
phase: 02-authentication-rbac
plan: "04"
subsystem: auth
tags: [nextjs, react-hook-form, zod, jwt, cookies, lucide-react, typescript]

# Dependency graph
requires:
  - phase: 02-03
    provides: "Login endpoint POST /api/auth/login/ returning UserProfile with HttpOnly cookies"
  - phase: 01-04
    provides: "Stubbed login page with React Hook Form + Zod and shadcn/ui Button/Input"
provides:
  - "Wired login page with split branded layout, remember me, loading state, error handling"
  - "apiFetch<T> client with auto-retry on 401 via silent refresh"
  - "Auth utility functions: login(), logout(), refreshToken(), getMe()"
affects: [all-frontend-features, route-protection, sidebar-rbac]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "apiFetch<T>: typed fetch wrapper with credentials: include and silent 401 refresh"
    - "ApiError class: status + data for typed error handling in UI"
    - "Login form: React Hook Form + Zod with isSubmitting for loading state"
    - "Split layout: lg:flex left panel hidden on mobile, full form on right"

key-files:
  created:
    - frontend/src/lib/api.ts
    - frontend/src/lib/auth.ts
  modified:
    - frontend/src/app/login/page.tsx

key-decisions:
  - "apiFetch silently refreshes on 401 and retries once before redirecting to /login"
  - "login() uses raw fetch (not apiFetch) to avoid retry loop on credential failures"
  - "rememberMe sends X-Remember-Me: true header for 7-day session extension on backend"

patterns-established:
  - "ApiError: all HTTP errors throw ApiError with .status for typed error handling"
  - "Auth forms: use isSubmitting from React Hook Form for loading/disabled state"

# Metrics
duration: 1min
completed: 2026-04-05
---

# Phase 2 Plan 04: Login Page Wiring Summary

**Split-layout login page wired to /api/auth/login/ with HttpOnly cookie auth, remember me (X-Remember-Me header), Loader2 spinner, typed error messages, and apiFetch<T> client with silent token refresh**

## Performance

- **Duration:** 1 min
- **Started:** 2026-04-05T11:52:02Z
- **Completed:** 2026-04-05T11:53:21Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- `apiFetch<T>` wrapper with `credentials: 'include'`, auto `Content-Type`, and silent 401 → refresh → retry flow
- Auth utilities: `login()`, `logout()`, `refreshToken()`, `getMe()` with full TypeScript types
- Login page rewritten with split branded layout (dark navy left panel + white form right), remember me checkbox, Loader2 spinner, typed error handling (401/429/network), and "Forgot password?" link

## Task Commits

Each task was committed atomically:

1. **Task 1: API client and auth utility functions** - `25c0051` (feat)
2. **Task 2: Wire login page — split layout, remember me, loading state, error handling** - `bf19600` (feat)

**Plan metadata:** (see final commit below)

## Files Created/Modified

- `frontend/src/lib/api.ts` - apiFetch<T> wrapper, ApiError class, API_BASE_URL export
- `frontend/src/lib/auth.ts` - login(), logout(), refreshToken(), getMe(), UserProfile/LoginResponse types
- `frontend/src/app/login/page.tsx` - Full wired login page with split layout and all UX requirements

## Decisions Made

- `login()` uses raw `fetch` directly rather than `apiFetch` to avoid the 401-retry loop that would trigger on wrong credentials — the silent refresh path is for expired tokens, not failed logins
- `rememberMe: true` sends `X-Remember-Me: true` header; the backend LoginView is expected to honour this for 7-day token TTL (consistent with 02-03 architecture)
- `ApiError` class carries `.status` and `.data` fields so error-handling code in UI components can branch on HTTP status code cleanly

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Login flow is fully functional end-to-end: form → API → HttpOnly cookie → redirect
- `apiFetch<T>` is the standard client for all future API calls — use it in all feature modules
- `getMe()` is ready for use in layout/sidebar for role-based rendering
- `/forgot-password` route is linked but not yet implemented — needs a dedicated plan in Phase 2 (plan 05 or later)

---
*Phase: 02-authentication-rbac*
*Completed: 2026-04-05*

## Self-Check: PASSED
