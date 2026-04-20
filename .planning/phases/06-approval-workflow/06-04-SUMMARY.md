---
phase: 06-approval-workflow
plan: 04
subsystem: ui
tags: [react, next.js, approvals, modal, tailwind, apiFetch]

# Dependency graph
requires:
  - phase: 06-approval-workflow
    provides: approve/reject API endpoints (06-02), sidebar badge counter (06-03)
  - phase: 05-job-management
    provides: job detail page and audit trail (05-06)
provides:
  - Functional /approvals page listing PENDING approval queue items
  - ApprovalQueue component with inline approve and reject actions
  - RejectModal with mandatory reason textarea and inline validation
  - approvals-api.ts client (fetchPendingApprovals, approveApproval, rejectApproval)
affects:
  - 06-05 (any future approval-related work)
  - 07-invoicing (may reference job approval state)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Optimistic row removal on approve/reject — remove from local state on success, restore on API error"
    - "Blocking modal pattern (no backdrop dismiss) — consistent with SessionWarningDialog from 02-05"
    - "Inline API client module per feature domain (approvals-api.ts mirroring jobs-api.ts pattern)"

key-files:
  created:
    - frontend/src/lib/approvals-api.ts
    - frontend/src/app/(dashboard)/approvals/components/ApprovalQueue.tsx
    - frontend/src/app/(dashboard)/approvals/components/RejectModal.tsx
  modified:
    - frontend/src/app/(dashboard)/approvals/page.tsx

key-decisions:
  - "job.id not serialized in ApprovalQueueSerializer — job_number rendered as teal text, not a clickable link"
  - "RejectModal blocks backdrop click — consistent with SessionWarningDialog pattern from 02-05"

patterns-established:
  - "Approval queue uses optimistic removal: filter item from local state on success, re-add on error"
  - "Feature-scoped API clients: lib/approvals-api.ts matches lib/jobs-api.ts domain isolation pattern"

# Metrics
duration: ~15min
completed: 2026-04-17
---

# Phase 6 Plan 04: Approval Queue UI Summary

**Functional /approvals page with ApprovalQueue table, optimistic approve/reject actions, and RejectModal with mandatory inline-validated reason textarea**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-17T08:07:00Z
- **Completed:** 2026-04-17T08:09:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Approval queue renders at /approvals with Job Number, Customer, Type, Submitted By, Submitted Date, and Actions columns
- Approve button optimistically removes the row from local state on success; errors restore the item with a banner
- Reject button opens RejectModal; submitting without text shows inline validation error; submitting with text calls reject API and removes the row
- Empty state ("No pending approvals — the queue is clear.") and loading skeleton rows (3 × animate-pulse) implemented
- approvals-api.ts provides `fetchPendingApprovals`, `approveApproval`, and `rejectApproval` using the standard `apiFetch` client

## Task Commits

Each task was committed atomically:

1. **Task 1: Create approvals API client and ApprovalQueue list component** - `4d4aefa` (feat)
2. **Task 2: Build RejectModal with mandatory reason validation** - `9f1973c` (feat)

## Files Created/Modified

- `frontend/src/lib/approvals-api.ts` — API client: fetchPendingApprovals, approveApproval, rejectApproval using apiFetch
- `frontend/src/app/(dashboard)/approvals/components/ApprovalQueue.tsx` — Table list with loading/empty/error states and approve/reject actions; integrates RejectModal
- `frontend/src/app/(dashboard)/approvals/components/RejectModal.tsx` — Blocking modal dialog with mandatory reason textarea, inline validation, and loading state
- `frontend/src/app/(dashboard)/approvals/page.tsx` — Updated from stub: renders page heading and ApprovalQueue component

## Decisions Made

1. **job.id not serialized** — The `ApprovalQueueSerializer` on the backend does not include `job.id` in the nested job object. As a result, job numbers in the queue table are rendered as styled teal text (matching the design intent) rather than `<Link href="/jobs/{id}">` elements. To add navigation, the serializer would need to include `id` in the nested job representation.

2. **RejectModal blocks backdrop click** — The modal overlay does not dismiss on background click; the `handleClose` guard returns early while submitting. This is consistent with the `SessionWarningDialog` blocking pattern established in 02-05: critical destructive actions must require explicit user intent (Cancel or Reject Job).

## Deviations from Plan

### Auto-noted Issues

**1. [Observation] job.id not available in ApprovalQueueSerializer**
- **Found during:** Task 1 (ApprovalQueue component)
- **Issue:** The `PendingApproval.job` interface includes `id: number`, but the backend serializer only exposes `job_number`, `customer_name`, `job_type`, and `eta` — not `job.id`. Rendering `<Link href="/jobs/{id}">` would produce `/jobs/undefined`.
- **Fix:** Rendered job_number as a teal-coloured `<span>` instead of a Next.js `<Link>`. No backend change made during this plan (architectural concern — see below).
- **Files modified:** frontend/src/app/(dashboard)/approvals/components/ApprovalQueue.tsx
- **Committed in:** 4d4aefa (Task 1 commit)
- **Rule applied:** Rule 4 awareness — serializer change is a backend contract modification. Documented rather than auto-fixed; resolved by rendering as text for now.

---

**Total deviations:** 1 observed (handled inline as text render, no backend change)
**Impact on plan:** Minimal — job numbers display correctly as teal text. Adding link navigation requires `job.id` in the serializer (future task if needed).

## Issues Encountered

None — both tasks executed cleanly. TypeScript compiled without errors.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- /approvals is fully functional for Admin and Operations roles
- Finance role excluded via RBAC (server-side 403)
- If job-number-to-detail linking is required in the queue, add `id` to the nested job serializer in 06-02 backend
- Phase 6 plan 04 complete; plan 05 (if any) can proceed

---
*Phase: 06-approval-workflow*
*Completed: 2026-04-17*

## Self-Check: PASSED
