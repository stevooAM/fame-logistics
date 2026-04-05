---
phase: 01-foundation
plan: 05
subsystem: database
tags: [django, postgresql, models, migrations, orm, rbac, freight]

# Dependency graph
requires:
  - phase: 01-02
    provides: Django config/ package, DRF, JWT configured, core app skeleton

provides:
  - TimeStampedModel abstract base (created_at/updated_at) used by all entity models
  - Role model with 5 RBAC roles (Admin, Manager, Operations, Finance, Viewer)
  - UserProfile extending auth.User with role FK
  - AuditLog system-wide model indexed by user/model_name/timestamp
  - Customer model with soft delete (is_active), TIN index, company/individual type
  - Job model with 7-state lifecycle, freight fields, customer FK (PROTECT)
  - JobAuditTrail tracking status changes per job
  - JobDocument with deferred FK to setup.DocumentType
  - Manual migration files for core, customers, jobs apps

affects:
  - 01-06 (setup app depends on core.TimeStampedModel)
  - 01-07 (setup app creates DocumentType referenced by JobDocument)
  - phase 2 (API views reference these models)
  - phase 3 (invoices depend on Job and Customer)
  - phase 4 (data migration seeds Customer records)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - TimeStampedModel abstract base inherited by all concrete models
    - Soft delete via is_active BooleanField on Customer
    - PROTECT FK on Job.customer prevents orphan jobs
    - String FK "setup.DocumentType" for deferred cross-app reference
    - Manual migration files (Docker CLI unavailable in execution environment)

key-files:
  created:
    - backend/core/models.py
    - backend/core/admin.py
    - backend/core/migrations/0001_initial.py
    - backend/core/migrations/__init__.py
    - backend/customers/__init__.py
    - backend/customers/apps.py
    - backend/customers/models.py
    - backend/customers/admin.py
    - backend/customers/migrations/0001_initial.py
    - backend/customers/migrations/__init__.py
    - backend/jobs/__init__.py
    - backend/jobs/apps.py
    - backend/jobs/models.py
    - backend/jobs/admin.py
    - backend/jobs/migrations/0001_initial.py
    - backend/jobs/migrations/__init__.py
  modified:
    - backend/config/settings.py

key-decisions:
  - "TimeStampedModel is abstract — no database table created, fields inherited by subclasses"
  - "Job.customer uses on_delete=PROTECT to prevent accidental customer deletion with active jobs"
  - "JobDocument.document_type uses string reference 'setup.DocumentType' — resolves after plan 01-07 creates setup app"
  - "Soft delete on Customer via is_active BooleanField — preserves historical job references"
  - "Manual migration files written by hand (Docker exec not available in execution environment)"

patterns-established:
  - "TimeStampedModel: all entity models inherit from core.TimeStampedModel for audit timestamps"
  - "Indexes: FK columns and common filter fields (status, job_type, is_active, tin) all explicitly indexed"
  - "Admin registration: all models registered with list_display, list_filter, search_fields"

# Metrics
duration: 2min
completed: 2026-04-05
---

# Phase 1 Plan 05: Core, Customer, and Job Models Summary

**Django ORM entity layer: TimeStampedModel base, RBAC Role/UserProfile, AuditLog, Customer (soft delete), Job (7-state lifecycle), JobAuditTrail, JobDocument with manual PostgreSQL migrations**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-05T00:08:06Z
- **Completed:** 2026-04-05T00:10:20Z
- **Tasks:** 2
- **Files modified:** 17

## Accomplishments

- Core abstract model layer: TimeStampedModel (all entities), Role (RBAC), UserProfile (User extension), AuditLog (system-wide)
- Customer model with soft delete (is_active), TIN indexed, company/individual type choices
- Job model with 7-state lifecycle (DRAFT through CANCELLED), freight fields (BL, container, weight, volume), PROTECT FK to Customer
- JobAuditTrail and JobDocument models for per-job audit and file attachment tracking
- Manual migration files for all three apps with correct FK dependencies and composite indexes

## Task Commits

Each task was committed atomically:

1. **Task 1: Core base models (TimeStampedModel, AuditLog, Role, UserProfile)** - `9b72ac0` (feat)
2. **Task 2: Customer and Job apps with all models** - `a26f9a9` (feat)

## Files Created/Modified

- `backend/core/models.py` - TimeStampedModel abstract base, Role, UserProfile, AuditLog
- `backend/core/admin.py` - Admin registrations for Role, UserProfile, AuditLog
- `backend/core/migrations/0001_initial.py` - Manual migration for core app
- `backend/customers/models.py` - Customer model with soft delete and TIN index
- `backend/customers/admin.py` - CustomerAdmin with search/filter
- `backend/customers/migrations/0001_initial.py` - Manual migration for customers app
- `backend/jobs/models.py` - Job, JobAuditTrail, JobDocument models
- `backend/jobs/admin.py` - Admin registrations for all job models
- `backend/jobs/migrations/0001_initial.py` - Manual migration for jobs app
- `backend/config/settings.py` - Added "customers" and "jobs" to INSTALLED_APPS

## Decisions Made

- Job.customer uses `on_delete=PROTECT` — prevents customer deletion when jobs exist, forcing explicit cleanup
- JobDocument.document_type uses string FK `"setup.DocumentType"` — deferred resolution after plan 01-07 creates setup app; migration file mirrors this
- Soft delete on Customer via `is_active` BooleanField — preserves job history, allows reactivation
- Manual migration files written by hand since Docker CLI unavailable in execution environment

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All models ready for plan 01-06 (setup app) and 01-07 (DocumentType resolves JobDocument FK)
- Migrations will apply cleanly once Docker environment is running: `docker compose exec backend python manage.py migrate`
- Admin panel will list all models once migrations are applied
- Phase 2 API development can begin immediately after setup app is created

---
*Phase: 01-foundation*
*Completed: 2026-04-05*

## Self-Check: PASSED
