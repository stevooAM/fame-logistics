---
phase: 05-job-management
plan: "01"
subsystem: database
tags: [django, postgresql, orm, migrations, models, job-management]

requires:
  - phase: 01-foundation
    provides: TimeStampedModel base class, core Django app structure
  - phase: 04-customer-management
    provides: Customer model that Job FKs to

provides:
  - Job model with complete field set (JOB-04) plus assigned_to, eta, delivery_date
  - generate_job_number() function producing FMS-{YEAR}-{SEQUENCE:05d} format (JOB-02)
  - Job.save() auto-number assignment on creation
  - Migration 0002 applying cleanly on top of 0001_initial

affects:
  - 05-02 (job API endpoints need the full model)
  - 05-03 (job list frontend references assigned_to, eta, delivery_date columns)
  - 05-04 (job form uses the new optional fields)

tech-stack:
  added: []
  patterns:
    - "Module-level generate_job_number() function uses select_for_update() for race-safe concurrent creation"
    - "Job.save() guards with 'not self.pk and not self.job_number' to allow explicit number override"
    - "Migration created manually (no Docker CLI in exec env) — established pattern from Phase 1"

key-files:
  created:
    - backend/jobs/migrations/0002_add_assigned_eta_delivery.py
  modified:
    - backend/jobs/models.py

key-decisions:
  - "generate_job_number() is a module-level function (not classmethod) so it can reference Job after class definition"
  - "select_for_update() used inside generate_job_number() to prevent duplicate sequence numbers under concurrent load"
  - "Job.save() checks both 'not self.pk' and 'not self.job_number' to allow explicit job number override in bulk imports"
  - "Sequence extraction uses split('-')[-1] to gracefully handle malformed job_number values without crashing"

patterns-established:
  - "FMS-{YEAR}-{SEQUENCE:05d}: canonical job number format for all job creation paths"
  - "Manual migration authoring: established in Phase 1, continued here for 0002"

duration: 4min
completed: 2026-04-11
---

# Phase 5 Plan 01: Job Model Fields and Auto-Number Generation Summary

**Django Job model extended with assigned_to (FK User), eta and delivery_date (DateFields), plus race-safe FMS-{YEAR}-{SEQUENCE:05d} auto-number generation via select_for_update()**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-04-11T03:47:00Z
- **Completed:** 2026-04-11T03:51:30Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added assigned_to ForeignKey (User, SET_NULL, optional), eta DateField, and delivery_date DateField to the Job model
- Implemented generate_job_number() with select_for_update() race protection returning FMS-YYYY-NNNNN strings
- Overrode Job.save() to auto-assign job_number on first save when none is provided
- Created migration 0002 manually (Docker CLI unavailable) with correct dependency chain, all three AddField and AddIndex operations

## Task Commits

Each task was committed atomically:

1. **Task 1: Add missing fields to Job model and implement auto-number generation** - `9811d46` (feat)
2. **Task 2: Create migration for new fields** - `35324c6` (feat)

**Plan metadata:** (to follow in docs commit)

## Files Created/Modified

- `backend/jobs/models.py` - Added assigned_to, eta, delivery_date fields; generate_job_number() function; save() override with auto-number logic; three new Meta indexes
- `backend/jobs/migrations/0002_add_assigned_eta_delivery.py` - Migration adding all three fields and their indexes, depending on 0001_initial

## Decisions Made

- `generate_job_number()` is a module-level function rather than a classmethod to avoid forward-reference issues (Job class not yet defined when function runs).
- `select_for_update()` locks the latest row for the current year prefix — prevents two concurrent saves generating the same sequence number without requiring a separate counter table.
- `Job.save()` checks `not self.pk and not self.job_number` (not just `not self.pk`) so bulk import tooling can supply an explicit job number without triggering auto-generation.
- Sequence extraction falls back to 1 on `ValueError/IndexError` rather than raising — defensive against malformed legacy rows.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Job model is fully specified and migration-ready for 05-02 (API endpoints)
- All AG Grid column fields (assigned_to, eta, delivery_date) now exist in the schema
- generate_job_number() is importable by serializers and views in the next plan
- Migration 0002 applies cleanly after 0001_initial; no pending blockers

---
*Phase: 05-job-management*
*Completed: 2026-04-11*

## Self-Check: PASSED
