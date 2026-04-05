---
phase: 03-administration-lookup-setup
plan: 06
subsystem: api
tags: [django, drf, rest-api, lookup-tables, seed-data, soft-delete, pillow]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Django project structure, core models (TimeStampedModel, AuditLog)
  - phase: 02-authentication-rbac
    provides: Permission classes (IsAdmin, IsAnyRole), authentication middleware

provides:
  - CRUD API endpoints for Port, CargoType, Currency, DocumentType under /api/setup/
  - Singleton CompanyProfile endpoint at /api/setup/company-profile/
  - Dropdown aggregation endpoint at /api/setup/dropdowns/
  - Pre-seeded defaults: GHS/USD/GBP/EUR currencies, 7 cargo types
  - Soft-delete behaviour on all lookup tables (is_active=False, no hard deletes)
  - Lookup model field additions: sort_order, code fields, migration 0002

affects:
  - 03-07-administration-ui (frontend lookup management pages consume these endpoints)
  - Phase 4+ (all modules needing Port/CargoType/Currency/DocumentType dropdowns)
  - Any module with form dropdowns (customer, job, invoice)

# Tech tracking
tech-stack:
  added: [Pillow>=10.0 (ImageField support for CompanyProfile.logo)]
  patterns:
    - LookupViewSetMixin for shared active-filter / soft-delete / audit-log behaviour
    - Singleton pattern enforced in CompanyProfile.save() + view fallback
    - Idempotent seed commands using get_or_create
    - Inline AuditLog.objects.create() (AuditLogMixin from 03-03 not yet available)

key-files:
  created:
    - backend/setup/serializers.py
    - backend/setup/views.py
    - backend/setup/urls.py
    - backend/setup/migrations/0002_add_sort_order_and_code_fields.py
    - backend/setup/management/commands/seed_lookups.py
    - backend/setup/management/__init__.py
    - backend/setup/management/commands/__init__.py
  modified:
    - backend/setup/models.py
    - backend/setup/admin.py
    - backend/config/urls.py
    - backend/requirements.txt

key-decisions:
  - "CargoType.code and DocumentType.code use null=True unique to avoid blank string uniqueness collision"
  - "Soft-delete returns HTTP 200 with updated object (not 204) for frontend to update list state"
  - "LookupDropdownView accessible by IsAnyRole — all staff need dropdown values to fill forms"
  - "AuditLog logged inline via AuditLog.objects.create() — AuditLogMixin deferred to 03-03"

patterns-established:
  - "LookupViewSetMixin: get_queryset filters is_active=True by default; ?include_inactive=true for admin UI"
  - "All lookup ViewSets use IsAdmin for write; LookupDropdownView uses IsAnyRole for read"
  - "Singleton models: CompanyProfile.save() enforces single record; view creates with defaults if absent"
  - "Seed commands: idempotent get_or_create keyed on natural identifier (code or name)"

# Metrics
duration: ~3min
completed: 2026-04-05
---

# Phase 3 Plan 06: Lookup Table CRUD APIs Summary

**DRF ViewSets for Port/CargoType/Currency/DocumentType with soft-delete, active-filter, audit logging, and a singleton CompanyProfile endpoint — plus seed_lookups command seeding GHS/USD/GBP/EUR and 7 cargo types**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-05T21:18:04Z
- **Completed:** 2026-04-05T21:21:15Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- All five lookup tables have full CRUD APIs registered under /api/setup/ via DRF DefaultRouter
- Soft-delete enforced across all lookup ViewSets — destroy() sets is_active=False and returns the updated object
- CompanyProfile singleton endpoint with multipart logo upload at /api/setup/company-profile/
- Dropdown aggregation endpoint at /api/setup/dropdowns/ returns all active lookups in one response
- Migration 0002 adds sort_order to all lookups and code (nullable unique) to CargoType/DocumentType
- seed_lookups management command seeds 4 currencies and 7 cargo types idempotently

## Task Commits

Each task was committed atomically:

1. **Task 1: Update lookup models and create migration** - `ee5ff55` (feat)
2. **Task 2: Lookup CRUD serializers, views, URLs, and seed command** - `b793ec8` (feat)

**Plan metadata:** _(final docs commit — see below)_

## Files Created/Modified

- `backend/setup/models.py` - Added sort_order, code fields; CompanyProfile registration_number + logo
- `backend/setup/migrations/0002_add_sort_order_and_code_fields.py` - Schema migration for new fields
- `backend/requirements.txt` - Added Pillow>=10.0 for ImageField support
- `backend/setup/serializers.py` - ModelSerializers for all 5 lookup models with uniqueness validation
- `backend/setup/views.py` - LookupViewSetMixin, 4 lookup ViewSets, CompanyProfileView, LookupDropdownView
- `backend/setup/urls.py` - DRF router + company-profile + dropdowns endpoints
- `backend/config/urls.py` - Added path("api/setup/", include("setup.urls"))
- `backend/setup/management/commands/seed_lookups.py` - Idempotent seed command
- `backend/setup/admin.py` - Updated to display sort_order and code fields

## Decisions Made

- **CargoType.code and DocumentType.code are null=True unique** — blank="" would violate UNIQUE constraint with multiple unseeded records; NULL values don't collide in PostgreSQL UNIQUE index
- **destroy() returns HTTP 200** — frontend can update list state from response; 204 (no content) would require a separate re-fetch
- **LookupDropdownView uses IsAnyRole** — Operations and Finance staff need dropdown values to populate form fields in their modules
- **AuditLog logged inline** — AuditLogMixin from plan 03-03 not yet available; inline AuditLog.objects.create() used as fallback per plan note

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Changed code fields to null=True for UNIQUE constraint compatibility**

- **Found during:** Task 1 (model updates)
- **Issue:** Plan specified `unique=True, blank=True, default=""` for CargoType.code and DocumentType.code. Multiple rows with blank string `""` would violate a UNIQUE constraint in PostgreSQL. NULL values are exempt from UNIQUE checks.
- **Fix:** Changed to `null=True, blank=True, default=None` so unseeded rows store NULL (no collision) while seeded rows store distinct codes
- **Files modified:** backend/setup/models.py, backend/setup/migrations/0002_add_sort_order_and_code_fields.py
- **Verification:** Migration file parses cleanly; seed command assigns non-null codes to all default entries
- **Committed in:** ee5ff55 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — data integrity)
**Impact on plan:** Essential fix for database correctness. No scope changes.

## Issues Encountered

None — plan executed smoothly with one inline bug fix.

## User Setup Required

None - no external service configuration required. Run `python manage.py seed_lookups` after applying migrations to populate default currencies and cargo types.

## Next Phase Readiness

- All lookup CRUD endpoints are ready for consumption by the admin lookup UI (Plan 03-07)
- Dropdown endpoint /api/setup/dropdowns/ is ready for downstream modules (Phase 4+)
- Migration 0002 must be applied before running seed_lookups
- When AuditLogMixin from plan 03-03 becomes available, inline audit calls in setup/views.py can be refactored

---
*Phase: 03-administration-lookup-setup*
*Completed: 2026-04-05*
