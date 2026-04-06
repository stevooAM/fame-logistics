---
phase: 03-administration-lookup-setup
plan: 05
subsystem: auth
tags: [django, simplejwt, token-blacklist, react, nextjs, admin-ui]

# Dependency graph
requires:
  - phase: 03-administration-lookup-setup
    plan: 01
    provides: JWT auth infrastructure, UserProfile model, IsAdmin permission, AuditLog model

provides:
  - ActiveSessionListView: GET /api/sessions/ lists non-blacklisted, non-expired tokens grouped by user
  - TerminateSessionView: POST /api/sessions/{token_id}/terminate/ blacklists all tokens for a user
  - ActiveSessionSerializer: serializes token_id, user_id, username, full_name, role, ip_address, created_at, expires_at
  - /admin/sessions page: session management panel with list and terminate action
  - SessionTable component: shadcn Table with terminate confirmation dialog

affects:
  - future security auditing phases
  - any phase adding session or token management

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Token blacklisting via rest_framework_simplejwt OutstandingToken/BlacklistedToken ORM queries"
    - "Terminate-all-sessions pattern: blacklist every outstanding token for a user, not just one"
    - "IP address sourced from AuditLog LOGIN entries rather than from token directly"
    - "shadcn Table for small admin datasets (not AG Grid)"
    - "Auto-refresh UI with setInterval every 30 seconds"

key-files:
  created:
    - frontend/src/types/session.ts
    - frontend/src/app/(dashboard)/admin/sessions/page.tsx
    - frontend/src/app/(dashboard)/admin/sessions/components/SessionTable.tsx
  modified:
    - backend/core/views.py
    - backend/core/serializers.py
    - backend/core/urls.py

key-decisions:
  - "Terminate all user sessions (not just the selected token) to prevent orphaned tokens remaining active"
  - "Group sessions by user with most recent token to avoid showing duplicate rows for the same person"
  - "IP address sourced from AuditLog LOGIN entries — not stored on OutstandingToken directly"
  - "Used shadcn Table instead of AG Grid for the session panel (small dataset, <50 rows expected)"
  - "No pagination on session list — active sessions expected to remain a small set"

patterns-established:
  - "Token blacklist pattern: exclude token IDs in BlacklistedToken from OutstandingToken queryset"
  - "Terminate audit: log action=DELETE, model_name=Session, object_repr=Terminated sessions for {username}"

# Metrics
duration: ~30min
completed: 2026-04-06
---

# Phase 3 Plan 05: Session Management Summary

**Django SimpleJWT token-blacklist session list and terminate API, plus a React admin panel at /admin/sessions with 30-second auto-refresh and per-user terminate-all action**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-04-06
- **Completed:** 2026-04-06
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- ActiveSessionListView queries OutstandingToken excluding blacklisted/expired entries, returning one row per user with IP sourced from AuditLog
- TerminateSessionView blacklists ALL outstanding tokens for the target user and writes an audit log entry
- Session management admin UI at /admin/sessions with shadcn Table, role badge, formatted timestamps, confirmation dialog, and 30-second auto-refresh

## Task Commits

Each task was committed atomically:

1. **Task 1: Session management API endpoints** - `727581a` (feat)
2. **Task 2: Session management UI** - `f6e6b5e` (feat) _(bundled with 03-07 lookup UI files in same commit)_

**Plan metadata:** _(this commit)_ (docs: complete plan)

## Files Created/Modified

- `backend/core/views.py` - Added ActiveSessionListView and TerminateSessionView
- `backend/core/serializers.py` - Added ActiveSessionSerializer
- `backend/core/urls.py` - Registered sessions/ and sessions/<int:token_id>/terminate/ routes
- `frontend/src/types/session.ts` - ActiveSession TypeScript interface
- `frontend/src/app/(dashboard)/admin/sessions/page.tsx` - Admin sessions page with 30s auto-refresh
- `frontend/src/app/(dashboard)/admin/sessions/components/SessionTable.tsx` - Table with terminate confirmation dialog

## Decisions Made

- Terminate-all-sessions on a single terminate call: blacklists every outstanding token for the user, not just the selected token_id. This prevents orphaned refresh tokens remaining valid.
- IP address is sourced from AuditLog LOGIN entries rather than stored on the token itself, since SimpleJWT's OutstandingToken has no IP field.
- shadcn Table chosen over AG Grid — session list is a small admin dataset with no need for grid features.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Session management API and UI are fully operational
- Admins can view all active sessions and force-terminate any user with immediate token invalidation
- Audit trail for terminations is captured in AuditLog
- Ready for any subsequent security or administration phases

## Self-Check: PASSED

All 6 key files verified present on disk. Task commits 727581a and f6e6b5e confirmed in git log.

---
*Phase: 03-administration-lookup-setup*
*Completed: 2026-04-06*
