---
phase: 07-accounts-finance
plan: 03
subsystem: api
tags: [django, drf, openpyxl, accounts, invoices, balances, export, reporting]

# Dependency graph
requires:
  - phase: 07-02
    provides: InvoiceViewSet, PaymentViewSet, InvoiceListSerializer, AccountsPagination
  - phase: 07-01
    provides: Invoice/Payment models with outstanding_for_customer() queryset method
  - phase: 04-customer-management
    provides: Customer model with currency_preference FK to setup.Currency

provides:
  - "GET /api/accounts/balances/ — paginated customer outstanding balances with currency_code"
  - "GET /api/accounts/balances/{customer_id}/ — per-customer aggregate + invoice list"
  - "GET /api/accounts/summary/?period=month|quarter — wrapped {rows, totals} period summaries"
  - "GET /api/accounts/invoices/export/ — XLSX/CSV invoice export honouring all filters"
  - "GET /api/accounts/balances/export/ — XLSX/CSV customer balance export with currency column"
  - "CustomerBalanceSerializer, PeriodSummaryRowSerializer, PeriodSummaryTotalsSerializer, PeriodSummaryResponseSerializer"

affects:
  - 07-05 (balance detail frontend page consumes balance_detail API contract)
  - 07-06 (summary frontend page and export toolbar consume summary + export contracts)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "_build_balance_rows() shared helper pattern: reused by both balances() and export_balances()"
    - "Prefetch-not-aggregate pattern: prefetch_related(invoices__payments) avoids JOIN-multiplication bug on multi-payment invoices"
    - "Wrapped response pattern: summary() returns {period, date_from, date_to, rows, totals} — frontend can render totals footer without client-side reduce"
    - "Decimal-to-float conversion in openpyxl rows (mirrors customers/views.py export pattern)"

key-files:
  created: []
  modified:
    - backend/accounts/serializers.py
    - backend/accounts/views.py

key-decisions:
  - "customer.phone (model field) exposed as phone_number in balance_detail API response — matches locked contract; model field name noted"
  - "currency_code defaults to GHS when customer.currency_preference is NULL — per checker-fix iteration 1"
  - "outstanding (not balance) is the canonical field name for period-summary aggregations"
  - "date_from/date_to are the only accepted date filter params — start_date/end_date not supported"
  - "No audit log on export actions — consistent with Phase 4 decision (read-only operations not logged)"
  - "CANCELLED invoices excluded from all aggregations (balances, summary, export)"

patterns-established:
  - "All reporting/export actions in read_only_actions set → IsAnyRole (Finance + Admin + Operations)"
  - "Export actions reuse get_queryset() unchanged — guaranteed identical filter semantics to list endpoint"

# Metrics
duration: 3min
completed: 2026-04-17
---

# Phase 7 Plan 03: Accounts Reporting & Export Endpoints Summary

**Outstanding-balance aggregation per customer (with currency_code), wrapped monthly/quarterly period summaries, and XLSX/CSV export for both invoices and balances — completing the Phase 7 backend API surface**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-17T13:11:50Z
- **Completed:** 2026-04-17T13:14:49Z
- **Tasks:** 2 (combined into 1 commit — both tasks interdependent)
- **Files modified:** 2

## Accomplishments

- Added 4 reporting serializers: `CustomerBalanceSerializer`, `PeriodSummaryRowSerializer`, `PeriodSummaryTotalsSerializer`, `PeriodSummaryResponseSerializer` — all use `outstanding` (not `balance`) as field name for period summaries per locked API contract
- Implemented `_build_balance_rows()` helper with `prefetch_related("invoices", "invoices__payments")` to avoid N+1 and JOIN-multiplication; each customer row includes `currency_code` (defaults to `"GHS"` if no preference set)
- Added 5 `@action` methods on `InvoiceViewSet`: `balances`, `balance_detail`, `summary`, `export_invoices`, `export_balances` — all gated with `IsAnyRole` via `get_permissions` update
- `summary()` returns wrapped `{period, date_from, date_to, rows, totals}` with up to 12 month / 8 quarter rows in chronological ascending order
- Export actions reuse `get_queryset()` / `_build_balance_rows()` for identical filter semantics to list endpoints; bold header row, appropriate column widths, Decimal→float conversion for openpyxl

## Task Commits

1. **Tasks 1+2: balances, summary, and export endpoints** - `088f00d` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified

- `backend/accounts/serializers.py` — Added `CustomerBalanceSerializer`, `PeriodSummaryRowSerializer`, `PeriodSummaryTotalsSerializer`, `PeriodSummaryResponseSerializer`
- `backend/accounts/views.py` — Added imports (csv, io, openpyxl, TruncMonth, TruncQuarter, etc.), updated `get_permissions`, added `_build_balance_rows()` helper and 5 `@action` methods

## Decisions Made

- **customer.phone vs phone_number:** The Customer model field is `phone` (not `phone_number`). The balance_detail API exposes it as `"phone_number"` in the response dict (key rename, not field rename) to match the locked contract. Future consumers must use `phone_number` from this endpoint.
- **currency_code default:** When `customer.currency_preference` is NULL, `currency_code` defaults to `"GHS"` — aligns with checker-fix iteration 1 lock.
- **outstanding field name:** Period summaries use `outstanding` (not `balance`) in both row items and totals — canonical name per locked API contract to avoid confusion with invoice-level `balance` field.
- **No audit log on exports:** Consistent with Phase 4 decision (`[04-07]`) that read-only operations are not logged.

## Deviations from Plan

None — plan executed exactly as written. The `customer.phone` / `phone_number` mapping was a noted implementation detail (not a deviation), resolved by renaming the dict key to match the locked API contract.

## Issues Encountered

- `manage.py check` not runnable in local exec environment (Docker CLI unavailable, project dependencies not installed locally). Verified correctness via Python AST syntax check + manual inspection of all @action methods, serializer classes, and import chains. This is consistent with the established pattern from Phases 1–7.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All backend contracts for 07-05 (balance detail frontend) and 07-06 (summary + export frontend) are locked and implemented
- `balance_detail` response: `customer.phone_number` maps from `customer.phone` model field
- `summary` response: `outstanding` field name, `date_from`/`date_to` params, wrapped shape
- `export_invoices`: `date_from`/`date_to` params filter on `issue_date` (via `get_queryset()`)
- Frontend plans 07-04, 07-05, 07-06 can proceed against these locked contracts

---
*Phase: 07-accounts-finance*
*Completed: 2026-04-17*

## Self-Check: PASSED
