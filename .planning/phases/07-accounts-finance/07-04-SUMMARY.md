---
phase: 07-accounts-finance
plan: 04
subsystem: ui
tags: [react, ag-grid, react-hook-form, zod, typescript, accounts, invoices, payments]

requires:
  - phase: 07-02
    provides: "Invoice + Payment REST API endpoints (/api/accounts/invoices/, /api/accounts/invoices/generate/, /api/accounts/payments/)"
  - phase: 05-04
    provides: "JobTable / JobToolbar / JobFormDialog patterns, AG Grid setup, ApiFetch client"

provides:
  - "Invoice management UI at /accounts with AG Grid list, toolbar, and status badges"
  - "GenerateInvoiceDialog with approved-job picker and DRF field error mapping"
  - "InvoiceDetailDrawer showing balance summary + payment history"
  - "RecordPaymentDialog with overpayment 400 inline on Amount field"
  - "AccountsTabs linking Invoices / Outstanding Balances / Period Summary"
  - "?invoice={id} deep-link support for drawer auto-open"
  - "Operations role read-only gating (no Generate Invoice, no Record Payment)"

affects:
  - 07-05-balances-ui
  - 07-06-summary-ui

tech-stack:
  added: []
  patterns:
    - "Fixed inset-0 overlay used for both blocking modals (GenerateInvoiceDialog, RecordPaymentDialog) and non-blocking drawer (InvoiceDetailDrawer with backdrop-dismiss)"
    - "fetchApprovedJobs filters client-side by eligible status set (IN_PROGRESS, CUSTOMS, DELIVERED, CLOSED) until server-side filter is available"
    - "AbortController on filter/refreshTrigger changes in InvoiceTable mirrors JobTable pattern"
    - "refreshTrigger counter in parent page bumped after payment recorded — triggers grid re-fetch without full page reload"
    - "useAuth().user.role.name.toLowerCase() for role checks in toolbar and drawer (consistent with 02-06 decision)"

key-files:
  created:
    - frontend/src/types/account.ts
    - frontend/src/lib/accounts-api.ts
    - frontend/src/app/(dashboard)/accounts/components/AccountsTabs.tsx
    - frontend/src/app/(dashboard)/accounts/components/StatusBadge.tsx
    - frontend/src/app/(dashboard)/accounts/components/InvoiceTable.tsx
    - frontend/src/app/(dashboard)/accounts/components/InvoiceToolbar.tsx
    - frontend/src/app/(dashboard)/accounts/components/GenerateInvoiceDialog.tsx
    - frontend/src/app/(dashboard)/accounts/components/RecordPaymentDialog.tsx
    - frontend/src/app/(dashboard)/accounts/components/InvoiceDetailDrawer.tsx
  modified:
    - frontend/src/app/(dashboard)/accounts/page.tsx

key-decisions:
  - "InvoiceDetailDrawer uses backdrop-dismiss (safe viewer); GenerateInvoiceDialog and RecordPaymentDialog block backdrop (destructive create actions) — consistent with RejectModal / SessionWarningDialog precedent"
  - "Generate Invoice button uses amber #F89C1C (primary CTA) not teal — differentiates action type from navigation; Record Payment in drawer uses teal"
  - "fetchApprovedJobs filters by eligible statuses client-side — API does not have a server-side approved-jobs filter; backend enforces correctness at generate-time regardless"
  - "InvoiceTable uses fetchInvoices() from accounts-api.ts (not raw apiFetch) — enforces accounts-api as single source of truth per plan constraint"

patterns-established:
  - "Invoice/Payment components: accounts-api.ts functions only, never raw apiFetch in components"
  - "StatusBadge at accounts/components/StatusBadge.tsx is distinct from jobs/components/StatusBadge.tsx — separate to avoid coupling"

duration: 5min
completed: 2026-04-17
---

# Phase 7 Plan 4: Invoice Management UI Summary

**AG Grid invoice list with generate/payment dialogs, balance drawer, approved-job picker, and Operations read-only gating wired against the 07-02 REST API**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-17T13:18:32Z
- **Completed:** 2026-04-17T13:23:09Z
- **Tasks:** 2 auto (checkpoint paused for human-verify)
- **Files modified:** 10

## Accomplishments

- Full invoice management surface at `/accounts`: AG Grid list, search/filter/date toolbar, status badges with per-status colour coding
- GenerateInvoiceDialog with debounced searchable approved-job picker, Zod validation, DRF error mapping per field
- InvoiceDetailDrawer: right panel with balance summary (Invoiced / Paid / Balance), payment history table, embedded RecordPaymentDialog
- RecordPaymentDialog maps overpayment API 400 → inline Amount field error
- `?invoice={id}` deep-link on mount; drawer close strips param via `router.replace`
- Operations role entirely read-only: Generate Invoice button hidden, Record Payment disabled

## Task Commits

1. **Task 1: Types, API client, AccountsTabs, StatusBadge, page shell** - `df20453` (feat)
2. **Task 2: InvoiceTable, InvoiceToolbar, GenerateInvoiceDialog, RecordPaymentDialog, InvoiceDetailDrawer** - `b321a63` (feat)

## Files Created/Modified

- `frontend/src/types/account.ts` - InvoiceStatus, Invoice, Payment, InvoiceListResponse, InvoiceFilters, GenerateInvoicePayload, RecordPaymentPayload, INVOICE_STATUS_CONFIG
- `frontend/src/lib/accounts-api.ts` - fetchInvoices, fetchInvoice, generateInvoice, recordPayment, fetchPayments, fetchApprovedJobs
- `frontend/src/app/(dashboard)/accounts/page.tsx` - Replaced stub with full shell: AccountsTabs, InvoiceToolbar, InvoiceTable, GenerateInvoiceDialog, InvoiceDetailDrawer + ?invoice= query param
- `frontend/src/app/(dashboard)/accounts/components/AccountsTabs.tsx` - Teal active border-b-2 tab strip for Invoices/Balances/Summary
- `frontend/src/app/(dashboard)/accounts/components/StatusBadge.tsx` - Badge for 6 InvoiceStatus values
- `frontend/src/app/(dashboard)/accounts/components/InvoiceTable.tsx` - AG Grid with balance-red, AbortController, server pagination
- `frontend/src/app/(dashboard)/accounts/components/InvoiceToolbar.tsx` - Search/status/date filters + amber Generate Invoice (hidden for Operations)
- `frontend/src/app/(dashboard)/accounts/components/GenerateInvoiceDialog.tsx` - RHF+Zod, approved-job picker combobox, field error mapping
- `frontend/src/app/(dashboard)/accounts/components/RecordPaymentDialog.tsx` - RHF+Zod, overpayment inline error
- `frontend/src/app/(dashboard)/accounts/components/InvoiceDetailDrawer.tsx` - Right-side panel, balance summary, payments table, RecordPaymentDialog embed

## Decisions Made

- **InvoiceDetailDrawer allows backdrop dismiss** (viewer, non-destructive) while GenerateInvoiceDialog and RecordPaymentDialog block backdrop (create actions) — consistent with project-wide modal pattern from 02-05/06-04
- **Generate Invoice button color = amber #F89C1C** to match the "primary CTA" convention; Record Payment in drawer uses teal #1F7A8C
- **fetchApprovedJobs filters client-side** by eligible status set — no server-side approved endpoint; backend enforces correctness at generate-time anyway

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `/accounts` Invoices tab fully functional against 07-02 API
- AccountsTabs already links to `/accounts/balances` and `/accounts/summary` — placeholder routes ready for 07-05 and 07-06 to implement
- `?invoice={id}` deep-link wired — 07-05 Outstanding Balances drill-down can navigate to `/accounts?invoice={id}` immediately

---
*Phase: 07-accounts-finance*
*Completed: 2026-04-17*

## Self-Check: PASSED
