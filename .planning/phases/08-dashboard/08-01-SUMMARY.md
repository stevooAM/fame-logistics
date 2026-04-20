---
phase: 08-dashboard
plan: "01"
subsystem: api
tags: [django, drf, dashboard, kpi, audit-log, pagination, rbac]

# Dependency graph
requires:
  - phase: 07-accounts-finance
    provides: Invoice and Payment models used for net-balance KPI calculation
  - phase: 06-approvals
    provides: ApprovalQueue model used for pending_approvals KPI
  - phase: 05-jobs
    provides: Job model with status choices used for active_jobs KPI
  - phase: 04-customers
    provides: Customer model with created_at used for new_customers_this_month KPI
  - phase: 03-audit-users-setup
    provides: AuditLog model used for role-filtered activity feed
  - phase: 02-authentication-rbac
    provides: IsAnyRole permission class and UserProfile.role.name RBAC pattern
provides:
  - GET /api/dashboard/ endpoint returning {kpis, feed} for Admin, Operations, Finance roles
  - GET /api/dashboard/activity/ endpoint for paginated Load More feed
  - Role-filtered AuditLog feed (Admin: all, Finance: Invoice+Payment, Operations: Job+Customer+ApprovalQueue)
  - Net-balance outstanding_invoice_total KPI (invoiced minus payments, returned as string)
  - pending_approvals KPI null for Finance role
affects:
  - 08-02 (dashboard UI — consumes these endpoints)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "_build_feed module-level helper shared by DashboardView and DashboardActivityView"
    - "Role branching on request.user.profile.role.name (database authoritative — RBAC-02)"
    - "Net balance via Python-level Decimal arithmetic over two aggregation queries"
    - "Pagination envelope: {count, next, previous, results} consistent with DRF-style cursor"

key-files:
  created:
    - backend/core/dashboard_views.py
  modified:
    - backend/core/urls.py

key-decisions:
  - "outstanding_invoice_total is net balance (invoiced minus paid) across non-PAID, non-CANCELLED invoices — not gross invoice sum"
  - "pending_approvals returns null (not 0) for Finance role — Finance cannot act on approvals so the count must not be surfaced"
  - "Feed role-filter implemented in _build_feed helper shared by both views — single source of truth for filtering logic"
  - "DashboardActivityView clamps limit to 1..100 to prevent runaway queries"
  - "outstanding_invoice_total serialised as string (e.g. '12450.00') — frontend formats as 'GHS 12,450.00'"

patterns-established:
  - "Dashboard KPI aggregation: all four metrics computed in a single GET handler without serializer classes"
  - "Activity feed link resolution via _resolve_link() dict mapping — add new model_name keys here as models grow"

# Metrics
duration: 3min
completed: 2026-04-18
---

# Phase 8 Plan 01: Dashboard Backend API Summary

**Role-filtered dashboard API delivering four KPI aggregations and a paginated AuditLog feed via GET /api/dashboard/ and GET /api/dashboard/activity/**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-18T08:17:18Z
- **Completed:** 2026-04-18T08:19:49Z
- **Tasks:** 2/2
- **Files modified:** 2

## Accomplishments

- DashboardView aggregates active_jobs, pending_approvals (null for Finance), outstanding_invoice_total (net balance), and new_customers_this_month in one request
- DashboardActivityView provides Load More pagination via ?offset and ?limit query params
- Role-based AuditLog filtering correctly scopes feed entries per role (Admin sees all; Finance sees Invoice+Payment; Operations sees Job+Customer+ApprovalQueue)
- Both routes wired into core/urls.py without touching existing patterns

## Task Commits

1. **Task 1: DashboardView — KPI aggregation and first-page feed** - `c9aac9f` (feat)
2. **Task 2: Wire dashboard routes into core/urls.py** - `bb4b760` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `backend/core/dashboard_views.py` — DashboardView and DashboardActivityView APIViews with _build_feed and _resolve_link helpers
- `backend/core/urls.py` — Added import + two new URL patterns: dashboard/ and dashboard/activity/

## Decisions Made

- `outstanding_invoice_total` uses net balance (invoiced minus paid) rather than gross to accurately reflect what is actually owed; returned as string for JSON serialisation
- `pending_approvals` is `null` (not `0`) for the Finance role — surfacing a count Finance cannot act on would be misleading
- `_build_feed` is a module-level function rather than a method so both view classes share identical filtering and serialisation logic
- `DashboardActivityView` clamps `limit` to `1..100` range to prevent runaway aggregation queries from clients passing large values
- Feed `link` field uses a simple dict mapping keyed on `model_name`; default is `None` for unknown model names — forward-compatible

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- `python manage.py check` could not run in the local environment (Celery not installed outside Docker). Verified correctness via `ast.parse()` syntax check and symbol-existence check against each model file instead. All seven imported symbols (Invoice, Payment, ApprovalQueue, AuditLog, Customer, Job, IsAnyRole) confirmed present in their source modules.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `GET /api/dashboard/` and `GET /api/dashboard/activity/` are ready for consumption by the dashboard UI (08-02)
- Feed `link` values match the frontend route conventions already established (e.g. `/jobs/{id}`, `/customers/{id}`, `/approvals`, `/accounts`)
- No blockers

---
*Phase: 08-dashboard*
*Completed: 2026-04-18*

## Self-Check: PASSED
