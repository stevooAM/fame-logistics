---
phase: 06-approval-workflow
plan: 05
subsystem: ui
tags: [next.js, react, approval-workflow, rbac, tabbed-layout, filterable-table]

# Dependency graph
requires:
  - phase: 06-02
    provides: ApprovalHistory API endpoint at /api/approvals/history/ with IsAdmin permission
  - phase: 06-04
    provides: ApprovalQueue component and approvals-api.ts client foundation
provides:
  - Admin-only ApprovalHistory component with action/date filter bar
  - fetchApprovalHistory(filters) API function in approvals-api.ts
  - Tabbed /approvals page (Pending Queue + History tabs) with role-gated History tab
affects:
  - 07-accounts-finance (role-gating pattern for admin-only UI sections)
  - future audit/reporting phases (ApprovalHistory filter UI as reference pattern)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dual role enforcement: UI-side isAdmin check + API-side IsAdmin permission guard"
    - "Explicit Apply filter button (not debounced) for filter bar consistency"
    - "Draft filters pattern: controlled inputs held in draftFilters state, committed on Apply click"

key-files:
  created:
    - frontend/src/app/(dashboard)/approvals/components/ApprovalHistory.tsx
  modified:
    - frontend/src/lib/approvals-api.ts
    - frontend/src/app/(dashboard)/approvals/page.tsx

key-decisions:
  - "Admin-only History tab uses UI-side isAdmin check (role.name.toLowerCase() === 'admin') + API-side IsAdmin permission — dual enforcement"
  - "ApprovalHistory table renders job_number as plain text (no job FK id in history serializer — link enhancement deferred)"
  - "History filter Apply button is explicit (not debounced on-change) — consistent with reporting pattern"

patterns-established:
  - "Draft-filter pattern: draftFilters state holds controlled input values; fetchApprovalHistory called only on Apply click"
  - "Admin-only UI sections: conditional render behind isAdmin = user?.role?.name?.toLowerCase() === 'admin'"

# Metrics
duration: 15min
completed: 2026-04-17
---

# Phase 6 Plan 05: Approval History UI Summary

**Admin-only tabbed /approvals page with filterable ApprovalHistory table (action badge + date range filters) gated by dual UI + API role enforcement**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-17
- **Completed:** 2026-04-17
- **Tasks:** 2 auto + 1 human-verify checkpoint
- **Files modified:** 3

## Accomplishments

- Built ApprovalHistory component (209 lines) with action badge (green/red/gray), actor name, comment, date columns and a filter bar with Action dropdown, Date From/To inputs, and explicit Apply button
- Extended approvals-api.ts with ApprovalHistoryEntry and HistoryFilters interfaces plus fetchApprovalHistory() function
- Refactored /approvals page.tsx into a tabbed layout — Pending Queue tab always visible, History tab conditionally rendered for Admin users only via dual UI + API enforcement

## Task Commits

Each task was committed atomically:

1. **Task 1: Add fetchApprovalHistory to API client and build ApprovalHistory component** - `0e341ae` (feat)
2. **Task 2: Update /approvals page with tabbed layout and role-gated history** - `17815cc` (feat)

**Plan metadata:** (to be committed — `docs(06-05): complete approval-history-ui plan`)

## Files Created/Modified

- `frontend/src/app/(dashboard)/approvals/components/ApprovalHistory.tsx` — Admin-only history table with action/date filters, loading skeletons, empty state, error banner (209 lines)
- `frontend/src/lib/approvals-api.ts` — Appended ApprovalHistoryEntry interface, HistoryFilters interface, fetchApprovalHistory() function (73 lines total)
- `frontend/src/app/(dashboard)/approvals/page.tsx` — Rewritten as tabbed layout; History tab gated behind isAdmin check (52 lines)

## Decisions Made

- **Dual role enforcement:** History tab uses `user?.role?.name?.toLowerCase() === "admin"` for UI-side gate; the /api/approvals/history/ endpoint retains its API-side IsAdmin permission from 06-02. Both layers enforce independently — consistent with RBAC-02 pattern.
- **job_number as plain text:** The ApprovalHistory serializer returns job_number as a string but does not include the job's integer PK. Job Number column renders as plain text; link-to-job-detail can be added when the serializer is extended.
- **Explicit Apply button:** Filter form uses a draft state pattern — controlled inputs update draftFilters; API call fires only on Apply click. This matches the explicit-filter UX established in reporting (not debounced on-change).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 6 complete: all 5 APR requirements (APR-01 through APR-05) satisfied across plans 06-01 through 06-05
- Ready for Phase 7: Accounts & Finance
- ApprovalHistory filter bar pattern (draft state + explicit Apply) is available as a reference for any finance/reporting filter UIs in Phase 7

---
*Phase: 06-approval-workflow*
*Completed: 2026-04-17*

## Self-Check: PASSED
