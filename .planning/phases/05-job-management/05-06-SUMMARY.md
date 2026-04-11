---
phase: 05-job-management
plan: 06
subsystem: ui
tags: [nextjs, react, typescript, jobs, status-workflow, documents, audit-trail, rbac]

# Dependency graph
requires:
  - phase: 05-03
    provides: Job API with status transition, document, and audit trail endpoints
  - phase: 05-04
    provides: StatusBadge component and JobTable patterns
  - phase: 05-05
    provides: JobFormDialog for edit mode reuse

provides:
  - Job detail page at /jobs/{id} with all job fields in two-column layout
  - StatusTransitionDropdown with role-aware forward/backward transitions
  - ConfirmStatusDialog requiring confirmation on every transition
  - DocumentPanel with multipart upload and presigned download links
  - AuditTrailTimeline showing all status changes, uploads, and deletes

affects: [06-invoicing, 07-reporting, 10-production]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Multipart upload via raw fetch (not apiFetch) to preserve FormData boundary"
    - "ReadField display component mirrors inputStyle pattern from JobFormDialog"
    - "Fixed-inset overlay dropdown pattern (same as 04-07 export dropdown)"
    - "Vertical CSS timeline with left-border line and dot markers"

key-files:
  created:
    - frontend/src/app/(dashboard)/jobs/[id]/page.tsx
    - frontend/src/app/(dashboard)/jobs/[id]/components/StatusTransitionDropdown.tsx
    - frontend/src/app/(dashboard)/jobs/[id]/components/ConfirmStatusDialog.tsx
    - frontend/src/app/(dashboard)/jobs/[id]/components/DocumentPanel.tsx
    - frontend/src/app/(dashboard)/jobs/[id]/components/AuditTrailTimeline.tsx
    - frontend/src/app/(dashboard)/jobs/[id]/components/JobDetailHeader.tsx
  modified: []

key-decisions:
  - "Multipart upload uses raw fetch with credentials:include (not apiFetch which sets Content-Type: json)"
  - "Finance role sees status badge only — no dropdown trigger (view-only enforcement in UI)"
  - "Admin backward transitions labelled 'Reverse' inline in same dropdown (no separate UI element)"
  - "AuditTrailTimeline renders entries newest-first via client-side sort"
  - "useAuth import path is @/providers/auth-provider (not @/context/AuthContext)"
  - "Document delete uses inline confirm (Yes/No buttons) rather than modal to avoid z-index nesting"

patterns-established:
  - "ReadField: read-only display field using inputStyle class — use in all future detail pages"
  - "Multipart upload pattern: raw fetch + credentials:include + silent refresh retry"

# Metrics
duration: 4min
completed: 2026-04-11
---

# Phase 5 Plan 06: Job Detail Page Summary

**Complete /jobs/{id} detail page with role-aware status dropdown, multipart document upload panel, and vertical audit trail timeline covering JOB-06, JOB-07, JOB-08, JOB-10, JOB-11**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-11T04:08:29Z
- **Completed:** 2026-04-11T04:12:47Z
- **Tasks:** 2
- **Files created:** 6

## Accomplishments

- StatusTransitionDropdown + ConfirmStatusDialog: every transition requires confirmation; Finance role gets badge-only view; Admin gets backward "Reverse" options; 403 shown as inline error
- DocumentPanel: multipart file upload with document type picker; full document list with presigned download links; hover-revealed delete with inline confirmation; 20-doc limit warning
- AuditTrailTimeline: vertical CSS timeline (left border + teal dots) with STATUS_CHANGE, DOCUMENT_UPLOADED, DOCUMENT_DELETED, CREATED, UPDATED action rendering; newest-first sort
- page.tsx: two-column layout (field sections left, status/docs/audit right); Edit button opens JobFormDialog in edit mode; loading skeleton; not-found state

## Task Commits

1. **Task 1: Status transition dropdown and confirmation dialog** - `7b60620` (feat)
2. **Task 2: Document panel, audit trail, header, and detail page** - `2ac2adb` (feat)

**Plan metadata:** *(this docs commit)*

## Files Created/Modified

- `frontend/src/app/(dashboard)/jobs/[id]/page.tsx` - Job detail page, two-column layout, all sections
- `frontend/src/app/(dashboard)/jobs/[id]/components/StatusTransitionDropdown.tsx` - Role-aware status dropdown with ConfirmStatusDialog integration
- `frontend/src/app/(dashboard)/jobs/[id]/components/ConfirmStatusDialog.tsx` - Fixed overlay confirmation modal with loading spinner
- `frontend/src/app/(dashboard)/jobs/[id]/components/DocumentPanel.tsx` - Upload, list, download, delete for job documents
- `frontend/src/app/(dashboard)/jobs/[id]/components/AuditTrailTimeline.tsx` - Vertical CSS timeline with action-type rendering
- `frontend/src/app/(dashboard)/jobs/[id]/components/JobDetailHeader.tsx` - Job number title, customer link, type badge, back nav

## Decisions Made

- **Multipart upload uses raw fetch**: `apiFetch` sets `Content-Type: application/json` which would corrupt FormData. Used raw `fetch` with `credentials: "include"` plus manual 401 silent-refresh retry.
- **Finance view-only**: Finance role sees status badge without dropdown trigger — enforcement in UI layer, backend still validates permissions independently.
- **Admin backward transitions**: Rendered inline in the same dropdown as forward transitions, labelled "Reverse" — keeps UI compact, avoids separate reversal modal.
- **`useAuth` from `@/providers/auth-provider`**: Project does not use `@/context/AuthContext` — the auth hook is exported from `auth-provider.tsx`.
- **Document delete inline confirm**: Inline Yes/No buttons on the row avoid z-index stacking problems with the modal.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed wrong AuthContext import path**

- **Found during:** Task 2 (page.tsx TypeScript check)
- **Issue:** Plan specified `@/context/AuthContext` but the project exports `useAuth` from `@/providers/auth-provider`
- **Fix:** Updated import to `@/providers/auth-provider`
- **Files modified:** `frontend/src/app/(dashboard)/jobs/[id]/page.tsx`
- **Verification:** `tsc --noEmit` passes with no errors in new files
- **Committed in:** `2ac2adb` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Single import path fix. No scope creep.

## Issues Encountered

None beyond the import path fix above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Job detail page complete — all JOB-06 through JOB-11 UI requirements met
- Phase 5 is now fully complete (plans 01–06 done)
- Phase 6 (Invoicing) can begin; it will need the job.id, job.customer, and job.total_cost fields available from the Job API

---
*Phase: 05-job-management*
*Completed: 2026-04-11*

## Self-Check: PASSED
