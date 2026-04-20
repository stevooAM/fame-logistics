---
phase: 05-job-management
plan: 03
subsystem: api
tags: [django, drf, rest-api, permissions, pagination, s3, audit-trail, serializers]

# Dependency graph
requires:
  - phase: 05-01
    provides: Job/JobAuditTrail/JobDocument models, JobStatus/JobType choices, generate_job_number
  - phase: 05-02
    provides: storage.py with upload_document, delete_document, get_presigned_url, StorageError
  - phase: 02-02
    provides: core.permissions (IsAdminOrOperations, IsAnyRole, IsAdmin)
  - phase: 03-03
    provides: core.audit (AuditLogMixin)
provides:
  - JobListSerializer — lightweight AG Grid payload
  - JobSerializer — full CRUD with validation and nested FK detail
  - JobDocumentSerializer — document attachment representation
  - StatusTransitionSerializer — status transition validation
  - JobAuditTrailSerializer — read-only audit trail
  - JobViewSet at /api/jobs/ with CRUD, status transitions, document upload/download, audit trail
  - ALLOWED_TRANSITIONS map with Admin-only reversal enforcement
  - Server-side pagination (20/page, max 100)
  - Search and filters (status, job_type, customer_id, customer_name, assigned_to, date range)
affects:
  - 05-04 (frontend job list)
  - 05-05 (frontend job create/edit form)
  - 05-06 (frontend job detail/status transitions)
  - 05-07 (document upload UI)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "JobViewSet follows CustomerViewSet pattern — AuditLogMixin + ModelViewSet, pagination class, get_queryset with filter composition"
    - "Double-log prevention: perform_create bypasses AuditLogMixin by calling serializer.save() directly then _log_action manually"
    - "Status transition action returns 400 with allowed_transitions list for frontend UX"
    - "Reversal detection uses ordered status list index comparison"
    - "Document list injects presigned_url from storage.get_presigned_url() after serialization"
    - "date_to uses date.fromisoformat() + timedelta(days=1) with __lt for inclusive end-of-day — same pattern as 03-03"

key-files:
  created:
    - backend/jobs/serializers.py
    - backend/jobs/views.py
    - backend/jobs/urls.py
  modified:
    - backend/config/urls.py

key-decisions:
  - "perform_create bypasses AuditLogMixin.perform_create — calls serializer.save(created_by=...) directly to avoid double audit log while still creating JobAuditTrail CREATED entry"
  - "delete_document returns 204 No Content (not 200) — document deletion has no response body"
  - "list_documents injects presigned_url per-document after DRF serialization, None on StorageError (non-fatal)"
  - "JobViewSet.get_permissions() uses action-based override: IsAnyRole for reads, IsAdminOrOperations for writes"
  - "Admin-only reversal check reads request.user.profile.role.name from DB (not JWT) — consistent with RBAC-02"

patterns-established:
  - "Pattern 1: Status transition actions return 400 with allowed_transitions list on invalid transition"
  - "Pattern 2: Custom list-style actions (audit_trail) use ViewSet's own pagination class directly via paginator.paginate_queryset()"
  - "Pattern 3: JobAuditTrail.objects.create() called inline on every mutation (status change, document add/remove, job create)"

# Metrics
duration: 6min
completed: 2026-04-11
---

# Phase 5 Plan 3: Job API Layer Summary

**Full Job CRUD API at /api/jobs/ with role-gated status transitions (ALLOWED_TRANSITIONS map, Admin-only reversal), document upload/download via presigned S3 URLs, server-side pagination/search/filtering, and per-operation JobAuditTrail entries**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-04-11T03:52:43Z
- **Completed:** 2026-04-11T03:58:14Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Five serializers covering list, full CRUD, document, status transition, and audit trail views
- JobViewSet with all required endpoints: CRUD, transition, audit-trail, documents upload/list/delete
- Role-based permission override: Finance can read, only Admin/Operations can write; Admin-only status reversal
- Status transition logic with ALLOWED_TRANSITIONS map, reversal detection via ordered status index, 400 with allowed_transitions on failure
- Document upload stores to S3 via storage.py, enforces 20-doc cap, generates presigned URLs on list
- Every mutation creates a JobAuditTrail entry

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Job serializers** - `19d75a5` (feat)
2. **Task 2: Create Job ViewSet with all endpoints** - `4e88e62` (feat)

**Plan metadata:** `19f42c3` (docs: complete plan)

## Files Created/Modified

- `backend/jobs/serializers.py` — Five serializers: JobListSerializer, JobSerializer, JobDocumentSerializer, StatusTransitionSerializer, JobAuditTrailSerializer
- `backend/jobs/views.py` — JobViewSet with 10 methods including 5 custom @actions
- `backend/jobs/urls.py` — DefaultRouter registration for JobViewSet
- `backend/config/urls.py` — Added `path("api/jobs/", include("jobs.urls"))`

## Decisions Made

- `perform_create` bypasses `AuditLogMixin.perform_create` by calling `serializer.save(created_by=request.user)` directly — avoids double-logging the CREATE action while still writing the JobAuditTrail CREATED entry
- `delete_document` returns 204 No Content — consistent with REST semantics for delete with no response body
- `list_documents` injects `presigned_url` into each serialized item post-serialization — presigned URL generation can fail silently (StorageError yields None), non-fatal
- Reversal check reads `request.user.profile.role.name` from the database — upholds RBAC-02 server-side enforcement, never trusts JWT claims

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Duplicate `perform_create` method definition (copy-paste during authoring) — removed the first draft copy immediately before committing.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Job API fully operational at `/api/jobs/` — frontend can start consuming it
- All endpoints required by JOB-01 through JOB-11 (backend side) are implemented
- Status transition rules are enforced server-side — frontend only needs to reflect allowed next states
- Document upload expects multipart/form-data with `file` and `document_type` (int PK)
- Presigned URLs expire per `AWS_PRESIGNED_URL_EXPIRY` setting (default 3600s) — frontend should not cache them long-term

---
*Phase: 05-job-management*
*Completed: 2026-04-11*
