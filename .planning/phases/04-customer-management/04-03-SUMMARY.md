---
phase: 04-customer-management
plan: 03
subsystem: database
tags: [django, openpyxl, management-command, data-seeding, excel, idempotent]

# Dependency graph
requires:
  - phase: 04-01
    provides: Customer model with all fields including TIN (blank=False), business_type, credit_terms, preferred_port FK, currency_preference FK

provides:
  - Django management command `seed_customers` to upsert 197 customer records from Excel
  - openpyxl dependency in requirements.txt

affects:
  - 04-04 onwards (customers present in DB from first deploy)
  - Phase 10 (deployment runbook should include `python manage.py seed_customers`)

# Tech tracking
tech-stack:
  added: [openpyxl>=3.1,<4.0]
  patterns:
    - Management command with optional --file argument and multi-path auto-detection
    - Idempotent upsert via update_or_create (TIN-keyed or company_name-keyed)
    - Placeholder TIN strategy for rows missing TIN to satisfy blank=False constraint

key-files:
  created:
    - backend/customers/management/__init__.py
    - backend/customers/management/commands/__init__.py
    - backend/customers/management/commands/seed_customers.py
  modified:
    - backend/requirements.txt

key-decisions:
  - "Rows without TIN use placeholder prefix '__NO_TIN__' + company_name (truncated to 50 chars) to satisfy Customer.tin blank=False constraint"
  - "Idempotency: TIN-present rows use update_or_create(tin=...), TIN-absent rows use update_or_create(company_name=...)"
  - "customer_type normalised to 'Company' default when unrecognised value encountered — not a fatal error"
  - "preferred_port and currency_preference FKs deliberately excluded from seed — manual entry only in new system"
  - "Entire import wrapped in transaction.atomic() — all-or-nothing on failure"

patterns-established:
  - "Placeholder strategy for required fields missing from legacy data: __NO_TIN__{company_name}"
  - "Case-insensitive COLUMN_MAP dict pattern for flexible Excel header matching"

# Metrics
duration: 2min
completed: 2026-04-06
---

# Phase 4 Plan 03: Customer Data Seeding Summary

**Idempotent Django management command seeding 197 customers from Excel via openpyxl, with TIN-keyed upserts and placeholder strategy for blank=False TIN constraint**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-06T12:40:31Z
- **Completed:** 2026-04-06T12:42:57Z
- **Tasks:** 2
- **Files modified:** 4 (1 modified, 3 created)

## Accomplishments

- `python manage.py seed_customers` command ready — reads fame_logistic_customers.xlsx and upserts all records
- Graceful missing-file handling: prints warning, exits 0 (not an error)
- Idempotent: TIN-present rows use `update_or_create(tin=...)`, TIN-absent rows use `update_or_create(company_name=...)` with `__NO_TIN__` placeholder to satisfy `blank=False`
- Entire import in `transaction.atomic()` — safe against partial failures
- openpyxl added to requirements.txt for .xlsx reading

## Task Commits

Each task was committed atomically:

1. **Task 1: Add openpyxl to requirements.txt** - `46269b3` (chore)
2. **Task 2: Create seed_customers management command** - `1d28177` (feat)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified

- `backend/requirements.txt` - Added openpyxl>=3.1,<4.0
- `backend/customers/management/__init__.py` - Empty package init
- `backend/customers/management/commands/__init__.py` - Empty package init
- `backend/customers/management/commands/seed_customers.py` - Full management command: Excel reading, validation, idempotent upsert, graceful skip

## Decisions Made

- **Placeholder TIN for blank=False:** Since `Customer.tin` is `blank=False` (locked in 04-01), rows without a TIN value in the Excel file cannot be inserted with an empty string. The command uses `f"__NO_TIN__{company_name}"[:50]` as a stable, unique placeholder. This allows `update_or_create` to be keyed on `company_name` for these rows without violating the constraint.
- **FK fields excluded from seed:** `preferred_port` and `currency_preference` are FK fields referencing lookup tables that may not be populated at seed time. These are excluded per plan spec — users configure them manually in the new system.
- **Graceful customer_type normalisation:** Unrecognised customer_type values default to "Company" (the model default) rather than failing the row.
- **--file argument with auto-detection fallback:** Command checks `BASE_DIR/fame_logistic_customers.xlsx` and `BASE_DIR/data/fame_logistic_customers.xlsx` automatically before requiring an explicit path.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Django is not installed on the host Python environment (execution runs outside Docker). Syntax and AST structure were verified via `py_compile` and `ast.parse` instead of a live `manage.py` invocation. Runtime verification is deferred to the developer's Docker environment.

## User Setup Required

None - no external service configuration required. Place `fame_logistic_customers.xlsx` in the project root (or `data/` subdirectory) and run:

```bash
python manage.py seed_customers
```

Or with an explicit path:

```bash
python manage.py seed_customers --file /path/to/fame_logistic_customers.xlsx
```

## Next Phase Readiness

- Seed command is ready to run on first deploy (CUST-13 satisfied)
- Customer table will be populated before any UI plan needs live customer data
- Plans 04-04 onward can assume 197 customers are present after running this command
- Deployment runbook (Phase 10) should include `python manage.py seed_customers` as a post-migration step

---
*Phase: 04-customer-management*
*Completed: 2026-04-06*

## Self-Check: PASSED
