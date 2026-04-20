---
phase: 06-approval-workflow
plan: 02
subsystem: api
tags: [django, drf, approvals, rbac, audit-trail, rest-api]

requires:
  - phase: 06-01
    provides: ApprovalQueue and ApprovalHistory models with migrations
  - phase: 05-01
    provides: JobStatus choices and JobAuditTrail model
  - phase: 02-02
    provides: IsAdmin, IsAdminOrOperations permission classes

provides:
  - REST API at /api/approvals/ for pending queue, approve, reject, history, pending-count
  - RBAC-enforced approval workflow (IsAdminOrOperations for queue/actions, IsAdmin for history)
  - Status transitions: PENDING→IN_PROGRESS on approve, PENDING→DRAFT on reject
  - Dual audit trail: ApprovalHistory entry + JobAuditTrail STATUS_CHANGE entry per action

affects:
  - 06-03 (approval queue frontend page)
  - 06-04 (approve/reject action UI)
  - 06-05 (approval history page)

tech-stack:
  added: []
  patterns:
    - SerializerMethodField for nested/derived values in read-only serializers
    - ListModelMixin + RetrieveModelMixin + GenericViewSet (no write mixin on base viewset)
    - Per-action permission_classes override on history endpoint
    - Date filter with timedelta(days=1) + __lt for inclusive end-of-day (established in 03-03)

key-files:
  created:
    - backend/approvals/serializers.py
    - backend/approvals/views.py
    - backend/approvals/urls.py
  modified:
    - backend/config/urls.py

key-decisions:
  - "pending_count uses IsAdminOrOperations (base permission) — sidebar badge visible to Operations, not Finance"
  - "history endpoint overrides to IsAdmin — full audit trail restricted to admins only"
  - "reject action validates non-empty reason in view (not serializer) — aligns with approve/reject asymmetry"

patterns-established:
  - "Approval action pattern: check is_pending → validate serializer → update approval → update job → create history + audit trail"

duration: 2min
completed: 2026-04-17
---

# Phase 6 Plan 02: Approval API Summary

**Full approval workflow REST API with pending queue, approve/reject actions, history filtering, and sidebar badge count — all RBAC-enforced using server-side role checks**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-17T08:02:24Z
- **Completed:** 2026-04-17T08:04:43Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Three serializers covering pending queue display, history display, and action input
- ApprovalViewSet with 6 endpoints: list, retrieve, approve, reject, history, pending-count
- Both approve and reject write dual audit records (ApprovalHistory + JobAuditTrail STATUS_CHANGE)
- URL routing wired into config/urls.py at /api/approvals/

## Task Commits

Each task was committed atomically:

1. **Task 1: Create approval serializers** - `777be1e` (feat)
2. **Task 2: Create ApprovalViewSet and wire URLs** - `d432e47` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `backend/approvals/serializers.py` - ApprovalQueueSerializer, ApprovalHistorySerializer, ApprovalActionSerializer
- `backend/approvals/views.py` - ApprovalViewSet with all 6 endpoints
- `backend/approvals/urls.py` - DefaultRouter registration for ApprovalViewSet
- `backend/config/urls.py` - Added path("api/approvals/", include("approvals.urls"))

## Decisions Made

- `pending_count` inherits the viewset's `IsAdminOrOperations` permission (no override needed) — Operations staff need the badge count to know when to act
- `history` action overrides to `IsAdmin` — full audit trail is an admin-only view per the permission matrix in `core/permissions.py`
- Rejection reason validation happens in the view (after serializer validation) rather than in the serializer, matching the plan specification and keeping the serializer symmetric between approve and reject

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- /api/approvals/ is fully operational and ready for frontend consumption
- Plan 06-03: Approval queue list page can use GET /api/approvals/
- Plan 06-04: Approve/reject modals POST to /api/approvals/{id}/approve/ and /api/approvals/{id}/reject/
- Plan 06-05: History page uses GET /api/approvals/history/ with job_number/date_from/date_to/action filters
- Sidebar badge: GET /api/approvals/pending-count/ returns {"count": N}

---
*Phase: 06-approval-workflow*
*Completed: 2026-04-17*
