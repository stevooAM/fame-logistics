---
phase: 04-customer-management
plan: 01
subsystem: database
tags: [django, postgresql, customer, fk, migration]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Django app scaffold and core TimeStampedModel base class
  - phase: 03-administration-lookup-setup
    provides: Port and Currency lookup models in setup app

provides:
  - Complete Customer Django model with 13 fields and FK relationships to Port and Currency
  - Migration 0002_customer_fields_update.py ready to apply

affects:
  - 04-02 (customer serializers and API views need these fields)
  - 04-03 (customer list UI needs business_type, preferred_port, currency_preference)
  - 04-04 (data seeding depends on this schema)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "FK to lookup tables uses SET_NULL, null=True, blank=True — preserving records if lookup deleted"
    - "business_type as free-text CharField — avoids choices lock-in for user-defined categories"
    - "Manual migration authoring — Docker CLI not available in execution environment"

key-files:
  created:
    - backend/customers/migrations/0002_customer_fields_update.py
  modified:
    - backend/customers/models.py

key-decisions:
  - "TIN field is required (blank=False) — locked user decision, cannot be blank in new records"
  - "business_type is free-text CharField, not choices — CONTEXT says 'e.g.' implying open-ended categories"
  - "preferred_port FK depends on setup.0002_add_sort_order_and_code_fields — the latest setup migration"
  - "Migration AlterField for tin omits blank=True to enforce blank=False at DB validation layer"

patterns-established:
  - "FK to setup lookup tables: on_delete=SET_NULL, null=True, blank=True, related_name plural of model"
  - "Model indexes defined in Meta.indexes with explicit name convention: customers_c_{field}_idx"

# Metrics
duration: 3min
completed: 2026-04-06
---

# Phase 4 Plan 01: Customer Model Fields Update Summary

**Customer Django model expanded from skeleton to full schema: 4 new fields (business_type, preferred_port FK, currency_preference FK, credit_terms), TIN made required, and business_type index added via manual migration.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-06T00:00:00Z
- **Completed:** 2026-04-06T00:03:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Updated Customer model with complete field set from CONTEXT.md decisions
- Established FK relationships from Customer to setup.Port and setup.Currency
- Enforced TIN as required (blank=False) — locked user decision
- Generated migration with correct dependency chain including setup app

## Task Commits

Each task was committed atomically:

1. **Task 1: Update Customer model with all fields and FK relationships** - `8935887` (feat)
2. **Task 2: Generate and verify the migration** - `e6c285c` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `backend/customers/models.py` - Complete Customer model with 13+ fields, imports Port/Currency from setup.models
- `backend/customers/migrations/0002_customer_fields_update.py` - Migration adding 4 fields, altering tin, adding index

## Decisions Made

- **TIN blank=False:** TIN is a required field per locked user decision. The existing model had blank=True; this was corrected. Historical data seeding must handle legacy rows without TIN separately (placeholder strategy documented in plan).
- **business_type as free-text:** CONTEXT uses "e.g." for examples (importer, exporter, freight agent) — this implies open-ended categories, not a fixed choices list.
- **Migration dependency on setup.0002:** The setup app has two migrations; the FK to Port and Currency requires the latest one (0002_add_sort_order_and_code_fields) which added sort_order and code fields to those models.
- **No management command changes:** No seed/management commands existed in the customers app at this point; the plan note about seed command graceful handling is deferred to 04-04 (data seeding plan).

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- Django not installed in local Python environment (project runs via Docker). Model and migration verification performed via AST parsing instead of Django runtime import. Runtime verification deferred to developer machine per established project pattern.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Customer model is complete and migration is ready to apply
- 04-02 (serializers and API views) can proceed immediately — all field names are final
- 04-04 (data seeding from Excel) should reference this schema; TIN placeholder strategy for legacy rows without TIN needs implementation in that plan

---
*Phase: 04-customer-management*
*Completed: 2026-04-06*

## Self-Check: PASSED
