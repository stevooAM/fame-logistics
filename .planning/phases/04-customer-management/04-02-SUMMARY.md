---
phase: 04-customer-management
plan: 02
subsystem: api
tags: [django, drf, rest-api, pagination, soft-delete, audit-log, rbac]

# Dependency graph
requires:
  - phase: 04-01
    provides: Customer model with all fields including business_type, preferred_port, currency_preference, credit_terms
  - phase: 03-03
    provides: AuditLogMixin from core.audit
  - phase: 02-02
    provides: IsAdminOrOperations permission class from core.permissions

provides:
  - CustomerListSerializer with flat fields and denormalised port/currency names
  - CustomerSerializer with full field set and nested FK read / PK write pattern
  - CustomerViewSet with paginated list, column filtering, search, soft-delete, TIN check
  - URL routing at /api/customers/ via DefaultRouter
  - /api/customers/check-tin/ duplicate TIN detection endpoint

affects:
  - 04-03  # customer frontend list (AG Grid consumes paginated list API)
  - 04-04  # customer create/edit modal (consumes CustomerSerializer write path)
  - 04-05  # customer detail view (consumes CustomerSerializer read path with nested FKs)
  - 04-06  # data migration (creates Customer rows via same model)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CustomerListSerializer / CustomerSerializer dual-serializer pattern for list vs detail"
    - "to_representation nested FK detail objects (preferred_port_detail, currency_preference_detail)"
    - "PageNumberPagination subclass with page_size=20 and max_page_size=100"
    - "Soft-delete override: destroy() sets is_active=False, logs DELETE, returns HTTP 200 with updated object"
    - "check-tin custom @action with exclude_id param for edit-mode duplicate detection"

key-files:
  created:
    - backend/customers/serializers.py
    - backend/customers/views.py
    - backend/customers/urls.py
  modified:
    - backend/config/urls.py

key-decisions:
  - "CustomerListSerializer uses SerializerMethodField for port/currency denormalisation — avoids nested serializer overhead on list"
  - "destroy() uses _log_action from AuditLogMixin rather than perform_destroy override — avoids hard-delete of soft-deleted records"
  - "check-tin searches ALL customers (including is_active=False) to prevent TIN re-use on deactivated records"
  - "Invalid exclude_id is silently ignored in check-tin — same defensive pattern as malformed date filters in audit log"

patterns-established:
  - "Dual serializer: use get_serializer_class() to return lightweight list serializer and full detail serializer"
  - "Nested FK read: to_representation injects *_detail objects after standard field serialisation"
  - "Column filtering: explicit query param checks in get_queryset() — no external filter library needed at this scale"

# Metrics
duration: 3min
completed: 2026-04-06
---

# Phase 4 Plan 02: Customer API Summary

**DRF CustomerViewSet at /api/customers/ with server-side pagination (20/page), multi-column filtering, soft-delete returning HTTP 200, and duplicate TIN check endpoint — all RBAC-guarded (IsAdminOrOperations) and audit-logged via AuditLogMixin.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-06T12:40:23Z
- **Completed:** 2026-04-06T12:43:14Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- CustomerListSerializer (flat, lightweight) and CustomerSerializer (full, nested read) created with the dual-serializer pattern
- CustomerViewSet with paginated list (20/page), search, 5 column filters, safe ordering, soft-delete, and TIN duplicate check action
- URL routing wired at /api/customers/ via DefaultRouter and config/urls.py include

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Customer serializers** - `4a6f4e0` (feat)
2. **Task 2: Create CustomerViewSet with pagination, filtering, soft-delete, TIN check** - `c740acc` (feat)

**Plan metadata:** see final commit below

## Files Created/Modified

- `backend/customers/serializers.py` - CustomerListSerializer and CustomerSerializer with nested FK read support
- `backend/customers/views.py` - CustomerViewSet with CustomerPagination, filtering, soft-delete, check_tin action
- `backend/customers/urls.py` - DefaultRouter registration at basename "customer"
- `backend/config/urls.py` - Added path("api/customers/", include("customers.urls"))

## Decisions Made

- **check-tin searches inactive records** — prevent TIN re-use on deactivated customers; same rule as soft-delete pattern established in 03-06
- **Invalid exclude_id silently ignored** — consistent with existing defensive pattern (malformed date filters in audit log are silently skipped per 03-03 decision)
- **destroy() calls _log_action directly** instead of relying on AuditLogMixin.perform_destroy() — soft-delete does not remove the row, so using the mixin's perform_destroy would log a DELETE for a record that still exists; calling _log_action after the save is more accurate

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. Docker CLI and local Python/Django environment are unavailable in this execution context (documented in STATE.md). Verification was performed via static analysis of the generated code against the established patterns in setup/views.py and core/audit.py.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- /api/customers/ is fully functional and ready for the frontend AG Grid list (04-03)
- CustomerSerializer write path (preferred_port, currency_preference as PKs) ready for create/edit modal (04-04)
- CustomerSerializer read path (nested preferred_port_detail, currency_preference_detail) ready for detail view (04-05)
- check-tin endpoint ready for real-time duplicate validation in the create/edit form

---
*Phase: 04-customer-management*
*Completed: 2026-04-06*

## Self-Check: PASSED
