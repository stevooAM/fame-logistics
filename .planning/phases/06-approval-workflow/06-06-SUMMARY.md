---
phase: 06-approval-workflow
plan: 06
subsystem: ui
tags: [django, drf, react, typescript, approvals]

requires:
  - phase: 06-approval-workflow
    provides: ApprovalQueue model with rejection_reason field (from 06-01/06-02)
provides:
  - JobSerializer exposes rejection_reason from ApprovalQueue for rejected jobs
  - Job detail page renders amber rejection callout for DRAFT jobs with rejection history
affects: [phase-7-accounts, job-detail-ui]

tech-stack:
  added: []
  patterns:
    - SerializerMethodField for cross-app data (jobs reads from approvals without FK on Job)
    - Inline functional component for conditional UI callouts

key-files:
  created: []
  modified:
    - backend/jobs/serializers.py
    - frontend/src/types/job.ts
    - frontend/src/app/(dashboard)/jobs/[id]/page.tsx

key-decisions:
  - "rejection_reason only in JobSerializer (detail), not JobListSerializer — avoids N+1 on grid"
  - "SerializerMethodField queries approval_requests reverse relation with filter(status=REJECTED).order_by('-created_at').first()"
  - "Callout renders only for DRAFT+non-empty rejection_reason — no callout for non-rejected DRAFTs or approved jobs"

patterns-established:
  - "Cross-app read via SerializerMethodField: job serializer queries approvals without adding FK to Job model"

duration: 5min
completed: 2026-04-17
---

# Phase 6 Plan 06: Rejection Reason Gap Closure Summary

**JobSerializer exposes rejection_reason from ApprovalQueue; job detail page renders amber callout for DRAFT jobs rejected by approvers**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-17T00:00:00Z (approximate)
- **Completed:** 2026-04-17T00:05:00Z (approximate)
- **Tasks:** 2 auto + 1 checkpoint verified
- **Files modified:** 3

## Accomplishments

- Added `rejection_reason` SerializerMethodField to `JobSerializer` — queries `ApprovalQueue.approval_requests` reverse relation for the most recent REJECTED entry
- Extended `Job` TypeScript interface with `rejection_reason: string | null`
- Rendered amber `RejectionCallout` component on job detail page conditioned on `status === "DRAFT"` and non-empty `rejection_reason`

## Task Commits

1. **Task 1: Add rejection_reason SerializerMethodField to JobSerializer** - `0dd2275` (feat)
2. **Task 2: Add rejection_reason to Job type and render callout** - `edcc49e` (feat)
3. **Task 3: Checkpoint verified** - N/A (human approved)

## Files Created/Modified

- `backend/jobs/serializers.py` — Added `rejection_reason` SerializerMethodField and `get_rejection_reason()` method to `JobSerializer`
- `frontend/src/types/job.ts` — Added `rejection_reason: string | null` to `Job` interface
- `frontend/src/app/(dashboard)/jobs/[id]/page.tsx` — Added `RejectionCallout` component and conditional render after job header

## Decisions Made

- `rejection_reason` field kept out of `JobListSerializer` to avoid N+1 queries on the AG Grid list view (one extra query is acceptable on the detail view for a single object)
- Used `approval_requests.filter(status=REJECTED).order_by('-created_at').values_list('rejection_reason', flat=True).first()` to query the reverse relation — minimizes data transfer
- Callout conditioned on both `status === "DRAFT"` AND `rejection_reason` being non-empty — ensures no empty UI element for non-rejected DRAFTs

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

APR-04 gap closed. Phase 6 is now fully complete. Ready for Phase 7: Accounts & Finance.

---
*Phase: 06-approval-workflow*
*Completed: 2026-04-17*

## Self-Check: PASSED
