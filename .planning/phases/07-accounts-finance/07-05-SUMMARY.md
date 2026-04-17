---
phase: 07-accounts-finance
plan: 05
subsystem: ui
tags: [react, ag-grid, typescript, accounts, balances, export]

requires:
  - phase: 07-03
    provides: /api/accounts/balances/ and /api/accounts/balances/{id}/ endpoints with locked field contracts
  - phase: 07-04
    provides: AccountsTabs, StatusBadge, apiFetchBlob pattern, accounts page shell

provides:
  - "Outstanding Balances UI at /accounts/balances — AG Grid per-customer balance table"
  - "Customer drill-down at /accounts/balances/[customerId] — invoices list (non-interactive v1)"
  - "balances-api.ts typed client (fetchBalances, fetchBalanceDetail, exportBalancesBlob)"

affects:
  - 07-06 (AccountsTabs wiring across sub-pages)
  - Phase 8 (invoice row drill-down deferred — /accounts?invoice={id} hook ready)

tech-stack:
  added: []
  patterns:
    - "BalancesSection.tsx as shared state owner pattern — toolbar + table share one client boundary"
    - "Client-side totals footer via reduce on current page rows (backend /api/accounts/balances/ returns no totals wrapper)"
    - "Fixed-inset overlay export dropdown pattern (mirrors 04-07)"

key-files:
  created:
    - frontend/src/lib/balances-api.ts
    - frontend/src/app/(dashboard)/accounts/balances/page.tsx
    - frontend/src/app/(dashboard)/accounts/balances/components/BalancesSection.tsx
    - frontend/src/app/(dashboard)/accounts/balances/components/BalancesTable.tsx
    - frontend/src/app/(dashboard)/accounts/balances/components/BalancesToolbar.tsx
    - frontend/src/app/(dashboard)/accounts/balances/[customerId]/page.tsx
    - frontend/src/app/(dashboard)/accounts/balances/[customerId]/components/CustomerBalanceDetail.tsx
  modified: []

key-decisions:
  - "Invoice rows NON-interactive in v1 — drill-down to /accounts?invoice={id} deferred to Phase 8"
  - "Totals footer computed client-side (backend /api/accounts/balances/ has no totals wrapper)"
  - "Fixed-inset overlay for export dropdown (not shadcn DropdownMenu — not available)"
  - "getSortModel() → getColumnState() fix (AG Grid v31+ API change)"

patterns-established:
  - "BalancesSection.tsx shared state pattern: parent holds filter state, toolbar + table are stateless receivers"
  - "Dynamic import with ssr:false on BalancesSection (AbortController + AG Grid are client-only)"

duration: ~10min
completed: 2026-04-17
---

# Phase 7 Plan 05: Outstanding Balances UI Summary

**Per-customer outstanding balance AG Grid with search/sort/export and a non-interactive invoice drill-down page — fulfilling ACC-03 and contributing to ACC-05**

## Performance

- **Duration:** ~10 min
- **Tasks:** 2 auto (+ human-verify checkpoint)
- **Files modified:** 7

## Accomplishments

- AG Grid balances list at `/accounts/balances` — 50 rows/page, server-side search and ordering, balance column red for non-zero values, client-side totals footer, currency-code column per customer
- Customer drill-down at `/accounts/balances/[customerId]` — company_name, email, phone_number, TIN header card + totals card + plain HTML invoice table (all field names locked to 07-03 contract: `paid_total`, `amount`, `balance`, `company_name`, `phone_number`)
- Invoice rows intentionally non-interactive (v1) — click-through to `/accounts?invoice={id}` drawer deferred to Phase 8
- `balances-api.ts` typed client with `fetchBalances`, `fetchBalanceDetail`, `exportBalancesBlob` — all types mirror 07-03 backend contract exactly

## Task Commits

1. **Task 1: balances-api + list page** - `822cc90` (feat)
2. **Task 2: customer drill-down page** - `bce64a9` (feat)

## Files Created/Modified

- `frontend/src/lib/balances-api.ts` — CustomerBalance, CustomerBalanceDetailResponse, BalanceInvoice types + fetch functions
- `frontend/src/app/(dashboard)/accounts/balances/page.tsx` — server component dynamically importing BalancesSection
- `frontend/src/app/(dashboard)/accounts/balances/components/BalancesSection.tsx` — client state wrapper
- `frontend/src/app/(dashboard)/accounts/balances/components/BalancesTable.tsx` — AG Grid with fmtCurrency, AbortController, totals footer
- `frontend/src/app/(dashboard)/accounts/balances/components/BalancesToolbar.tsx` — search + export dropdown
- `frontend/src/app/(dashboard)/accounts/balances/[customerId]/page.tsx` — drill-down route
- `frontend/src/app/(dashboard)/accounts/balances/[customerId]/components/CustomerBalanceDetail.tsx` — customer info + invoice table

## Decisions Made

- Invoice rows non-interactive (plain `<tr>`) — Phase 8 enhancement; the `?invoice=` deep-link handler in 07-04 is already live
- Totals footer computed client-side because `/api/accounts/balances/` returns paginated results only (no totals wrapper from backend)
- Fixed-inset overlay export dropdown (consistent with 04-07 pattern)

## Deviations from Plan

**[Rule 1 - Bug] Fixed `getSortModel` → `getColumnState`**
- Found during: Task 1 tsc verification
- Issue: AG Grid v31+ removed `getSortModel()` from `GridApi`; must use `api.getColumnState()` filtering for columns with `sort != null`
- Fix: Updated column sort handler inline before commit
- Impact: No behavior change, fixes compile error

## Issues Encountered

None.

## User Setup Required

None.

## Next Phase Readiness

- Outstanding Balances UI complete — ACC-03 fulfilled
- Excel export for balances live — ACC-05 partially fulfilled (invoice export was 07-04, balance export is here, summary export is 07-06)
- Invoice row click-through deferred to Phase 8 (the 07-04 `?invoice=` handler is ready)

---
*Phase: 07-accounts-finance*
*Completed: 2026-04-17*

## Self-Check: PASSED
