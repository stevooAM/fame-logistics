---
phase: 09-reports
plan: 01
subsystem: api
tags: [django, orm, reports, aggregation, postgresql]

# Dependency graph
requires:
  - phase: 05-jobs
    provides: Job model with JobStatus/JobType choices and total_cost field
  - phase: 07-accounts
    provides: Invoice/Payment models with issue_date, amount, currency FK, CANCELLED constant
  - phase: 04-customers
    provides: Customer model with company_name and id fields
provides:
  - reports Django app package (backend/reports/__init__.py, apps.py)
  - customer_activity_query: per-customer job count + value breakdown by status
  - job_status_query: (status, job_type) aggregation with count and total_cost
  - revenue_query: monthly period rows and per-customer rows with invoiced/paid/outstanding
affects:
  - 09-02 (API views that will wire these query functions to HTTP endpoints)
  - 09-03 (export views that will call the same query functions)
  - 09-04 (frontend reports pages that consume the JSON output shape)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Report query functions return list-of-dicts (not querysets) for JSON/openpyxl compatibility"
    - "Monetary values serialised as strings (str(Decimal)) to avoid float precision issues"
    - "Query-only Django app with no models, no migrations, no admin"

key-files:
  created:
    - backend/reports/__init__.py
    - backend/reports/apps.py
    - backend/reports/queries.py
  modified:
    - backend/config/settings.py

key-decisions:
  - "Job value field is total_cost (not cost) — corrected from plan template to match actual Job model"
  - "customer_activity_query uses created_at__date range on Job; revenue_query uses issue_date range on Invoice"
  - "revenue_query payment lookup per month filters via invoice__in on the already-filtered invoice queryset — consistent month/year scoping"
  - "All three functions return plain Python dicts, not DRF serializers — reusable across API views and export views"

patterns-established:
  - "Query-helper module pattern: backend/reports/queries.py centralises aggregation logic, mirrors _build_balance_rows() from 07-03"
  - "Optional filter params (customer_id, currency_code) default to None; None skips the filter entirely"

# Metrics
duration: 2min
completed: 2026-04-18
---

# Phase 9 Plan 01: Reports Query Layer Summary

**Three ORM query functions (customer_activity, job_status, revenue) centralised in a new reports Django app, returning JSON-serialisable plain dicts with all monetary values as strings**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-18T12:23:11Z
- **Completed:** 2026-04-18T12:25:36Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Created `reports` Django app package with `ReportsConfig` and registered in INSTALLED_APPS
- Implemented `customer_activity_query` with per-customer job count and per-status breakdown (draft/pending/in_progress/customs/delivered/closed/cancelled)
- Implemented `job_status_query` grouping by (status, job_type) pairs with count and total_cost aggregation
- Implemented `revenue_query` with monthly TruncMonth period rows and per-customer breakdown, each section including invoiced/paid/outstanding totals

## Task Commits

Each task was committed atomically:

1. **Task 1: Create reports Django app scaffold** - `433547d` (feat)
2. **Task 2: Implement report query functions** - `f9cf8d1` (feat)

**Plan metadata:** (see final commit below)

## Files Created/Modified

- `backend/reports/__init__.py` - Empty package file
- `backend/reports/apps.py` - ReportsConfig app configuration
- `backend/reports/queries.py` - customer_activity_query, job_status_query, revenue_query
- `backend/config/settings.py` - Added "reports" to INSTALLED_APPS after "accounts"

## Decisions Made

- **total_cost field name:** Plan template used `cost` but the actual Job model field is `total_cost`. Updated both `customer_activity_query` and `job_status_query` to use `total_cost`. This is a correction, not a deviation from intent.
- **No models, no migrations:** reports app is query-only — all data sourced from existing jobs, customers, and accounts apps.
- **Revenue CANCELLED exclusion:** Uses `Invoice.CANCELLED` class constant (string `"CANCELLED"`) matching the accounts model pattern.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected Job cost field name from `cost` to `total_cost`**

- **Found during:** Task 2 (implement query functions)
- **Issue:** Plan template referenced `cost` field on Job model but actual model defines `total_cost`
- **Fix:** Used `total_cost` in Sum() aggregations in both customer_activity_query and job_status_query
- **Files modified:** backend/reports/queries.py
- **Verification:** AST parse passes; field name confirmed by reading backend/jobs/models.py
- **Committed in:** f9cf8d1 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — wrong field name in plan template)
**Impact on plan:** Essential correctness fix. No scope creep.

## Issues Encountered

None — apart from the field name correction above, execution was straightforward.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `customer_activity_query`, `job_status_query`, and `revenue_query` are ready to be imported by 09-02 API views
- All functions return plain dicts — no serializer wrapping needed before JSON response
- `revenue_query` returns nested dict with `period_rows`/`period_totals`/`customer_rows`/`customer_totals` — 09-02 view can pass through directly
- No blockers for 09-02

---
*Phase: 09-reports*
*Completed: 2026-04-18*

## Self-Check: PASSED
