---
phase: 07-accounts-finance
verified: 2026-04-17T23:49:52Z
status: gaps_found
score: 4/5 must-haves verified
gaps:
  - truth: "Financial data (invoices, payments, balances) can be exported to Excel with current filter/period applied"
    status: failed
    reason: "Invoice export to Excel is not wired in the frontend. The backend export_invoices action exists at /api/accounts/invoices/export/ but there is no corresponding function in accounts-api.ts and no export button in InvoiceToolbar.tsx or InvoiceTable.tsx."
    artifacts:
      - path: "frontend/src/lib/accounts-api.ts"
        issue: "No exportInvoices/exportInvoicesBlob function defined"
      - path: "frontend/src/app/(dashboard)/accounts/components/InvoiceToolbar.tsx"
        issue: "No Export button or export handler present"
    missing:
      - "exportInvoicesBlob(filters, format) function in accounts-api.ts calling /api/accounts/invoices/export/"
      - "Export dropdown button in InvoiceToolbar with xlsx/csv options"
      - "Handler in accounts page or InvoiceToolbar that calls exportInvoicesBlob and triggers browser download"
---

# Phase 7: Accounts & Finance Verification Report

**Phase Goal:** Finance staff can generate invoices for approved jobs, record incoming payments, see outstanding balances per customer, and export financial data to Excel — with monthly and quarterly period summaries available.
**Verified:** 2026-04-17T23:49:52Z
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Finance staff can generate an invoice for any approved job and the invoice appears linked to that job and customer | VERIFIED | `GenerateInvoiceDialog.tsx` calls `generateInvoice()` from `accounts-api.ts`; API POSTs to `/api/accounts/invoices/generate/`; backend `generate` action enforces job approval; `accounts/page.tsx` wires dialog to table refresh |
| 2 | A payment can be recorded against an invoice — the outstanding balance updates | VERIFIED | `RecordPaymentDialog.tsx` calls `recordPayment()` from `accounts-api.ts`; API POSTs to `/api/accounts/payments/`; `InvoiceDetailDrawer` surfaces the dialog |
| 3 | Customer outstanding balances view shows correct balance (invoiced minus paid) per customer | VERIFIED | `BalancesTable.tsx` fetches from `fetchBalances()`; renders `balance` column with red styling (`text-red-600 font-semibold`) when `balance > 0`; `CustomerBalanceDetail.tsx` uses `company_name`, `phone_number`, `paid_total` per contract |
| 4 | Monthly and quarterly financial period summaries aggregate income and payment data correctly | VERIFIED | `summaries-api.ts` uses `date_from`/`date_to` params (NOT `start_date`/`end_date`); `SummaryToolbar.tsx` passes `date_from`/`date_to` only; `SummaryTable.tsx` renders `outstanding` column (NOT `balance`); `summary/page.tsx` includes `AccountsTabs` |
| 5 | Financial data can be exported to Excel with current filter/period applied | FAILED | Balances export and summary export are wired. Invoice export is NOT — no `exportInvoicesBlob` in `accounts-api.ts`, no export button in `InvoiceToolbar.tsx` |

**Score: 4/5 truths verified**

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `backend/accounts/models.py` | Invoice + Payment models with `generate_invoice_number()`, `outstanding_for_customer()` | VERIFIED | Both functions confirmed present |
| `backend/accounts/views.py` | InvoiceViewSet with generate, balances, balance_detail, summary, export_invoices, export_balances actions | VERIFIED | All 6 actions confirmed in router registration and as `@action` decorators |
| `backend/accounts/serializers.py` | `CustomerBalanceSerializer`, `PeriodSummaryResponseSerializer` | VERIFIED | Both classes confirmed at lines 268 and 299 |
| `frontend/src/lib/accounts-api.ts` | `fetchInvoices`, `generateInvoice`, `recordPayment` | VERIFIED | All three functions present; missing `exportInvoicesBlob` |
| `frontend/src/lib/balances-api.ts` | `fetchBalances`, `fetchBalanceDetail` | VERIFIED | Both present; `exportBalancesBlob` also present |
| `frontend/src/lib/summaries-api.ts` | `fetchPeriodSummary` with `date_from`/`date_to` params, `outstanding` field | VERIFIED | Uses `date_from`/`date_to` exclusively; `PeriodSummaryRow` has `outstanding` field |
| `frontend/src/app/(dashboard)/accounts/page.tsx` | AccountsTabs, InvoiceTable, GenerateInvoiceDialog, InvoiceDetailDrawer | VERIFIED | All four imported and rendered |
| `frontend/src/app/(dashboard)/accounts/balances/page.tsx` | Exists | VERIFIED | Present |
| `frontend/src/app/(dashboard)/accounts/balances/components/BalancesTable.tsx` | Exists, balance column with red styling | VERIFIED | `text-red-600 font-semibold` applied when `balance > 0` |
| `frontend/src/app/(dashboard)/accounts/balances/[customerId]/components/CustomerBalanceDetail.tsx` | Uses `company_name`, `phone_number`, `paid_total` | VERIFIED | All three fields used in render |
| `frontend/src/app/(dashboard)/accounts/summary/page.tsx` | Exists, contains AccountsTabs | VERIFIED | Both confirmed |
| `frontend/src/app/(dashboard)/accounts/summary/components/SummaryTable.tsx` | Uses `outstanding` column (not `balance`) | VERIFIED | `row.outstanding` and `totals.outstanding` used throughout |
| `frontend/src/app/(dashboard)/accounts/summary/components/SummaryToolbar.tsx` | Uses `date_from`/`date_to` (not `start_date`/`end_date`) | VERIFIED | Only `date_from`/`date_to` in params; comment explicitly warns against `start_date`/`end_date` |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `GenerateInvoiceDialog.tsx` | `/api/accounts/invoices/generate/` | `generateInvoice()` in `accounts-api.ts` | WIRED | Import confirmed, `await generateInvoice(...)` called in submit handler |
| `RecordPaymentDialog.tsx` | `/api/accounts/payments/` | `recordPayment()` in `accounts-api.ts` | WIRED | Import confirmed, `await recordPayment(...)` called in submit handler |
| `BalancesTable.tsx` | `/api/accounts/balances/` | `fetchBalances()` in `balances-api.ts` | WIRED | Import confirmed, used in data fetch |
| `BalancesToolbar.tsx` | `/api/accounts/balances/export/` | `exportBalancesBlob()` in `balances-api.ts` | WIRED | Import confirmed, blob download triggered on button click |
| `SummaryToolbar.tsx` | `/api/accounts/summary/export/` | `apiFetchBlob()` directly | WIRED | `apiFetchBlob` imported, called with `date_from`/`date_to` params |
| `InvoiceToolbar.tsx` | `/api/accounts/invoices/export/` | (missing) | NOT WIRED | No export function in `accounts-api.ts`; no export button in toolbar |
| `summaries-api.ts` | backend `summary` action | `date_from`/`date_to` query params | WIRED | Params match backend contract exactly |

---

## Contract Verification

| Contract | Required | Actual | Pass |
|----------|----------|--------|------|
| `summaries-api.ts` uses `date_from` | MUST contain "date_from" | Contains `date_from` | YES |
| `summaries-api.ts` uses `date_to` | MUST contain "date_to" | Contains `date_to` | YES |
| `summaries-api.ts` no `start_date` | MUST NOT contain | Only in comment as warning | YES |
| `summaries-api.ts` no `end_date` | MUST NOT contain | Only in comment as warning | YES |
| `SummaryToolbar.tsx` no `start_date`/`end_date` | MUST NOT contain | Not present | YES |
| `SummaryTable.tsx` uses `outstanding` | MUST contain "outstanding" column | `row.outstanding`, `totals.outstanding` | YES |
| `CustomerBalanceDetail.tsx` uses `phone_number` | MUST contain | `customer.phone_number` | YES |
| `CustomerBalanceDetail.tsx` uses `company_name` | MUST contain | `customer.company_name` | YES |
| `CustomerBalanceDetail.tsx` uses `paid_total` | MUST contain | `paid_total` destructured and rendered | YES |

---

## Anti-Patterns Found

None detected that constitute blockers. The `InvoiceToolbar` is a clean component — the invoice export omission is structural (missing feature), not a stub or placeholder.

---

## Gaps Summary

One gap blocks full goal achievement: **invoice export to Excel is not implemented in the frontend.**

The backend exposes `GET /api/accounts/invoices/export/?format=xlsx|csv` via the `export_invoices` action. The balances export and period summary export are both fully wired (frontend function + UI button + blob download). The same pattern was not applied to invoices.

Specifically missing:
1. An `exportInvoicesBlob(filters, format)` function in `frontend/src/lib/accounts-api.ts` that calls `/api/accounts/invoices/export/`
2. An Export dropdown button in `InvoiceToolbar.tsx` (matching the pattern in `BalancesToolbar.tsx`)
3. A blob download handler that passes current invoice filters (status, date range, search) to the export endpoint

All other success criteria are fully met.

---

*Verified: 2026-04-17T23:49:52Z*
*Verifier: Claude (gsd-verifier)*
