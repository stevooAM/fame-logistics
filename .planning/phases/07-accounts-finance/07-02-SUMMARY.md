---
phase: 07-accounts-finance
plan: 02
subsystem: api
tags: [django, drf, invoices, payments, accounts, rbac, audit]

# Dependency graph
requires:
  - phase: 07-01
    provides: Invoice and Payment models with balance helpers, InvoiceQuerySet
  - phase: 06-approval-workflow
    provides: ApprovalQueue.APPROVED constant used in generate action
  - phase: 03-user-staff-management
    provides: AuditLogMixin, core/permissions.py permission classes
provides:
  - "GET /api/accounts/invoices/ — paginated, filterable invoice list"
  - "GET /api/accounts/invoices/{id}/ — full detail with nested payments + computed balance"
  - "POST /api/accounts/invoices/generate/ — creates DRAFT invoice for approved job"
  - "POST /api/accounts/payments/ — records payment, recalculates invoice status atomically"
  - "GET /api/accounts/payments/ — paginated payment list"
affects:
  - "07-04 (Invoice UI panel — calls /invoices/ and /invoices/generate/)"
  - "07-05 (Payment recording UI — calls /payments/)"
  - "07-06 (Finance dashboard — reads invoice/payment aggregates)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "InvoiceListSerializer + InvoiceSerializer split (lightweight list / full detail)"
    - "GenerateInvoiceSerializer: plain Serializer (not ModelSerializer) for action inputs"
    - "PaymentViewSet.http_method_names restricts to GET/POST only — immutable once recorded"
    - "perform_create bypasses AuditLogMixin.perform_create, calls _log_action once manually"
    - "generate action: ApprovalQueue.APPROVED gate + transaction.atomic wrapping Invoice.objects.create()"
    - "Payment.perform_create: recalculates Invoice.status inside same atomic block"

key-files:
  created:
    - backend/accounts/serializers.py
    - backend/accounts/views.py
    - backend/accounts/urls.py
  modified:
    - backend/config/urls.py

key-decisions:
  - "PaymentViewSet http_method_names = ['get', 'post', 'head', 'options'] — payments are immutable once recorded, no PUT/PATCH/DELETE"
  - "generate action uses detail=False with url_path='generate' — resolves to /invoices/generate/ (not /invoices/{id}/generate/)"
  - "Invoice.objects.create() inside transaction.atomic in generate — Invoice.save() already wraps generate_invoice_number in atomic, outer atomic is idempotent"
  - "Payment.perform_create calls invoice.refresh_from_db() before recalculating status — ensures accurate balance after payment insert"
  - "destroy() on InvoiceViewSet returns 405 — CANCELLED status is the deletion mechanism"
  - "IsAnyRole for reads (Operations reads invoices); IsAdminOrFinance for all writes — matches permission matrix"

patterns-established:
  - "Accounts API pattern: plain GenerateInvoiceSerializer for custom actions, ModelSerializer for CRUD"
  - "Atomic payment recording: save payment + recalculate parent invoice status in single transaction"

# Metrics
duration: 3min
completed: 2026-04-17
---

# Phase 7 Plan 02: Accounts API Serializers + ViewSets Summary

**Invoice and Payment REST API with approval-gated invoice generation, atomic payment recording with status recalculation, and role-based access control (IsAdminOrFinance writes, IsAnyRole reads)**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-17T13:05:23Z
- **Completed:** 2026-04-17T13:08:30Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Built 4 serializers: InvoiceListSerializer (computed balance), PaymentSerializer (amount validation), InvoiceSerializer (nested payments + FK detail), GenerateInvoiceSerializer
- Built InvoiceViewSet with generate action enforcing ApprovalQueue.APPROVED gate; destroy returns 405
- Built PaymentViewSet (GET/POST only) that atomically records payments and recalculates Invoice.status (PAID/PARTIAL/SENT)
- Wired DefaultRouter for both ViewSets and mounted at /api/accounts/ in config/urls.py

## Task Commits

Each task was committed atomically:

1. **Task 1: Build accounts serializers and Invoice/Payment ViewSets** - `198b5bf` (feat)
2. **Task 2: Wire URL routing and mount in config/urls.py** - `090f8b4` (feat)

**Plan metadata:** *(to be added in final commit)*

## Files Created/Modified

- `backend/accounts/serializers.py` — InvoiceListSerializer, PaymentSerializer, InvoiceSerializer, GenerateInvoiceSerializer
- `backend/accounts/views.py` — AccountsPagination, InvoiceViewSet (generate action), PaymentViewSet
- `backend/accounts/urls.py` — DefaultRouter wiring for invoices + payments
- `backend/config/urls.py` — Added `path("api/accounts/", include("accounts.urls"))` after approvals include

## Decisions Made

- `PaymentViewSet.http_method_names` restricts to `["get", "post", "head", "options"]` — payments are immutable once recorded, matching financial audit requirements
- `generate` action uses `detail=False` — resolves to `/invoices/generate/` not `/invoices/{id}/generate/`; no existing invoice needed to generate a new one
- `invoice.refresh_from_db()` called inside `perform_create` before recalculating status — ensures the aggregate query sees the just-inserted payment row within the same transaction
- `IsAnyRole` for list/retrieve on both ViewSets — Operations must be able to read invoices per the permission matrix
- `destroy()` returns 405 with descriptive message — consistent with JobViewSet pattern

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All endpoints that plans 07-04, 07-05, 07-06 depend on are now live:
  - `GET /api/accounts/invoices/` — invoice list panel
  - `POST /api/accounts/invoices/generate/` — generate invoice action
  - `POST /api/accounts/payments/` — record payment panel
- `manage.py check` passes with 0 issues
- URL resolution confirmed for all three primary endpoints

---
*Phase: 07-accounts-finance*
*Completed: 2026-04-17*

## Self-Check: PASSED
