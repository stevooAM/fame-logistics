---
phase: 02-authentication-rbac
plan: 05
subsystem: auth
tags: [react, nextjs, hooks, idle-timeout, session-management, jwt-refresh, dialog, shadcn]

# Dependency graph
requires:
  - phase: 02-03
    provides: JWT HttpOnly cookie auth + /api/auth/refresh/ endpoint used by setupTokenRefresh
  - phase: 02-04
    provides: base api.ts with apiFetch — setupTokenRefresh appended to this file

provides:
  - useIdleTimeout hook: 30-min idle tracking with 28-min warning threshold
  - SessionWarningDialog: teal "Stay Logged In" / "Log Out" modal
  - setupTokenRefresh(): 13-min proactive JWT refresh interval

affects: [02-06, 02-07, frontend root layout / auth provider integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useRef for stable callback refs in long-lived hooks (avoids effect re-runs)"
    - "Throttled activity detection (30s) to reduce timer churn during active usage"
    - "Interval-based proactive token refresh (13 min) separate from reactive retry on 401"

key-files:
  created:
    - frontend/src/hooks/use-idle-timeout.ts
    - frontend/src/components/auth/session-warning-dialog.tsx
  modified:
    - frontend/src/lib/api.ts

key-decisions:
  - "Activity throttled to 30s intervals — avoids unnecessary timer resets while typing"
  - "Warning fires at 28 min (timeoutMs - warningMs = 30 - 2), timeout at 30 min"
  - "Dialog blocks Escape/backdrop dismiss — user must make explicit Stay/Logout choice"
  - "setupTokenRefresh interval set to 13 min (JWT access token expiry assumed 15 min)"
  - "Stable callback refs via useRef prevent useEffect re-registration on every render"

patterns-established:
  - "Hook returns { resetTimers, isWarning } — caller wires dialog open state to isWarning"
  - "onTimeout/onWarning injected as deps — separation of concerns, hook stays generic"

# Metrics
duration: 1min
completed: 2026-04-05
---

# Phase 2 Plan 05: Session Management Summary

**React idle-timeout hook (30 min) with 2-min warning dialog and proactive JWT refresh every 13 minutes**

## Performance

- **Duration:** 1 min
- **Started:** 2026-04-05T11:52:23Z
- **Completed:** 2026-04-05T11:53:35Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- `useIdleTimeout` hook tracking mousemove, mousedown, keydown, scroll, touchstart with 30-second activity throttle
- Warning callback fires at 28 minutes; timeout callback fires at 30 minutes of inactivity
- `SessionWarningDialog` modal with "Stay Logged In" (teal #1F7A8C) and "Log Out" buttons; blocks accidental dismiss
- `setupTokenRefresh()` appended to existing api.ts — proactive 13-minute refresh interval with cleanup fn

## Task Commits

Each task was committed atomically:

1. **Task 1: Idle timeout hook with activity tracking** - `7481d5b` (feat)
2. **Task 2: Session warning dialog and token auto-refresh** - `24c2c91` (feat)

**Plan metadata:** _(committed after this summary)_

## Files Created/Modified

- `frontend/src/hooks/use-idle-timeout.ts` — useIdleTimeout hook; tracks activity events, manages warning + timeout timers
- `frontend/src/components/auth/session-warning-dialog.tsx` — SessionWarningDialog modal for impending session expiry
- `frontend/src/lib/api.ts` — setupTokenRefresh() appended; 13-min background JWT refresh interval

## Decisions Made

- Activity throttled to once per 30 seconds — avoids re-scheduling timers while the user is actively typing or scrolling
- Warning fires at `timeoutMs - warningMs` (28 min default), full timeout at `timeoutMs` (30 min default)
- Dialog prevents Escape key and backdrop click from closing it — user must explicitly choose "Stay Logged In" or "Log Out"
- setupTokenRefresh interval is 13 minutes, intentionally less than the assumed 15-minute access token TTL
- Stable `useRef` wrappers for `onTimeout`/`onWarning`/`onActivity` callbacks prevent unnecessary effect re-registration

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None. Plan 02-04 had already run and created the base `api.ts`; `setupTokenRefresh` was safely appended without overwriting existing content.

## User Setup Required

None — no external service configuration required. The hook and dialog are wired together by the consuming auth provider (Phase 2 plan 06 or 07).

## Next Phase Readiness

- `useIdleTimeout` and `SessionWarningDialog` are ready to be composed inside an auth provider or root layout component
- `setupTokenRefresh` needs to be called once in the auth provider `useEffect` on mount
- The "Stay Logged In" handler should call `resetTimers()` after a successful `silentRefresh` / token refresh API call
- The "Log Out" handler should call the logout API endpoint then redirect to `/login`

---
*Phase: 02-authentication-rbac*
*Completed: 2026-04-05*

## Self-Check: PASSED
