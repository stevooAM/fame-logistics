---
phase: 07-accounts-finance
plan: 01
subsystem: database
tags: [django, models, invoice, payment, decimal, aggregation, migration, indexes]

# Dependency graph
requires:
  - phase: 05-job-management
    provides: Job model and generate_job_number() pattern used as template
  - phase: 04-customer-management
    provides: Customer model FK target for Invoice.customer
provides:
  - Race-safe generate_invoice_number() producing INV-{YEAR}-{SEQ:05d}
  - Invoice.save() auto-assigns invoice_number when blank
  - Invoice.invoiced_total(), paid_total(), balance() Decimal helpers
  - InvoiceQuerySet.outstanding_for_customer(id) aggregation returning invoiced/paid/balance dict
  - Payment Meta.indexes for payment_date and recorded_by
  - Migration 0002 adding AlterField + two AddIndex operations
affects:
  - 07-02 (invoice API endpoints - builds on balance helpers)
  - 07-03 (payment recording API - uses Payment model with indexes)
  - 07-04 (outstanding balance views - uses outstanding_for_customer)
  - 07-05 (monthly/quarterly summaries - uses payment_date index)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "generate_invoice_number() mirrors generate_job_number() — module-level with select_for_update()"
    - "QuerySet custom manager via Model.objects = CustomQuerySet.as_manager()"
    - "Decimal aggregation via Sum() with Decimal('0.00') fallback for None results"

key-files:
  created:
    - backend/accounts/migrations/0002_accounts_finance_extensions.py
  modified:
    - backend/accounts/models.py
    - backend/accounts/admin.py

key-decisions:
  - "generate_invoice_number() is module-level (not classmethod) to mirror jobs pattern and avoid forward-reference issues"
  - "InvoiceQuerySet.outstanding_for_customer() uses Payment.objects.filter(invoice__customer_id=...) for cross-model aggregation"
  - "Migration 0002 written manually — Docker CLI not available in execution environment"
  - "boto3 installed in local venv to run manage.py check/makemigrations verification; not a project dependency change"

patterns-established:
  - "Invoice auto-numbering: INV-{YEAR}-{SEQ:05d} via save() override checking not self.pk and not self.invoice_number"
  - "Balance helpers: invoiced_total() returns self.amount, paid_total() aggregates payments, balance() = invoiced - paid"
  - "Customer aggregation: outstanding_for_customer(id) returns dict with invoiced/paid/balance Decimals"

# Metrics
duration: 3min
completed: 2026-04-17
---

# Phase 7 Plan 01: Accounts & Finance Model Extensions Summary

**Race-safe INV-{YEAR}-{SEQ:05d} invoice auto-numbering, Decimal balance helpers (invoiced_total/paid_total/balance), customer-level aggregation queryset, and Payment indexes added to Django accounts app**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-17T12:59:55Z
- **Completed:** 2026-04-17T13:03:09Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Extended `backend/accounts/models.py` with `generate_invoice_number()`, `Invoice.save()` override, three balance helpers, and `InvoiceQuerySet` with `outstanding_for_customer()`
- Added `Payment.Meta.indexes` for `payment_date` and `recorded_by` used by downstream aggregation queries
- Created migration `0002_accounts_finance_extensions.py` with `AlterField` + two `AddIndex` operations; `makemigrations --check` confirms no further changes needed

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend Invoice and Payment models with auto-numbering and balance helpers** - `dd272a2` (feat)
2. **Task 2: Create migration 0002 for Payment indexes** - `10538d7` (feat)

**Plan metadata:** _(committed with SUMMARY/STATE below)_

## Files Created/Modified
- `backend/accounts/models.py` - generate_invoice_number(), InvoiceQuerySet, Invoice balance helpers, Payment indexes
- `backend/accounts/admin.py` - InvoiceAdmin balance_display column, PaymentAdmin recorded_by column
- `backend/accounts/migrations/0002_accounts_finance_extensions.py` - AlterField + two AddIndex for Payment

## Decisions Made
- `generate_invoice_number()` placed at module level (not classmethod) — matches `generate_job_number()` from jobs/models.py, avoids forward-reference issues with `Invoice` class not yet defined at point of function definition
- `outstanding_for_customer()` uses `Payment.objects.filter(invoice__customer_id=...)` cross-model query rather than traversing via invoice queryset — yields a single DB round-trip aggregation
- Migration 0002 written manually per project pattern (Docker CLI not available in execution environment)

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
- `manage.py check accounts` initially failed due to missing `boto3` in local venv (pre-existing environment issue — boto3 used in `jobs/storage.py` which is included in URL routing, pulling it into the check scope). Installed boto3 into local venv to complete verification. This is not a project dependency change; the Docker container already has boto3.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- All model helpers ready for 07-02 (invoice CRUD API) and 07-03 (payment recording API)
- `outstanding_for_customer()` ready for 07-04 outstanding balance views
- `payment_date` index ready for 07-05 monthly/quarterly summary queries
- Migration 0002 must be applied (`manage.py migrate`) before any accounts API endpoints are used

---
*Phase: 07-accounts-finance*
*Completed: 2026-04-17*
