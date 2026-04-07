---
phase: 04-customer-management
plan: 07
subsystem: api, ui
tags: [django, drf, openpyxl, csv, nextjs, typescript, export, file-download]

requires:
  - phase: 04-02
    provides: CustomerViewSet with filtering/get_queryset
  - phase: 04-04
    provides: CustomerToolbar placeholder Export button and CustomerFilters state

provides:
  - GET /api/customers/export/ returning .xlsx with openpyxl (default)
  - GET /api/customers/export/?format=csv returning .csv
  - apiFetchBlob utility in frontend/src/lib/api.ts
  - Export dropdown in CustomerToolbar with Excel/CSV options
  - Browser file download triggered from customers/page.tsx with active filter params

affects: [future phases using file download patterns, any module needing blob fetch]

tech-stack:
  added: []
  patterns:
    - "apiFetchBlob: blob download variant of apiFetch — same auth/credential/refresh-retry pattern"
    - "Export action on ViewSet: @action reuses get_queryset() for filter parity, skips pagination"
    - "Custom dropdown via relative div + fixed overlay — no shadcn DropdownMenu needed"

key-files:
  created: []
  modified:
    - backend/customers/views.py
    - frontend/src/lib/api.ts
    - frontend/src/app/(dashboard)/customers/components/CustomerToolbar.tsx
    - frontend/src/app/(dashboard)/customers/page.tsx

key-decisions:
  - "Export action reuses get_queryset() unchanged — guarantees identical filter semantics to list endpoint"
  - "No audit log on export — it is a read-only operation"
  - "openpyxl.styles.Font(bold=True) applied to header row; column widths set per column"
  - "apiFetchBlob mirrors apiFetch exactly (skipRefresh, silentRefresh retry, redirectToLogin) but returns Blob"
  - "Custom dropdown built with fixed inset-0 overlay for click-outside dismiss — shadcn DropdownMenu not available"
  - "Export button props renamed onExport -> onExportExcel + onExportCsv for explicitness"

patterns-established:
  - "apiFetchBlob pattern: use for any future binary download endpoint"
  - "ViewSet export action pattern: @action(detail=False) + reuse get_queryset() + skip pagination"

duration: 5min
completed: 2026-04-07
---

# Phase 4 Plan 7: Customer Export (XLSX/CSV) Summary

**openpyxl XLSX and CSV export endpoint on CustomerViewSet wired to a dropdown Export button in the customers toolbar, with apiFetchBlob utility preserving HttpOnly cookie auth**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-07T11:08:52Z
- **Completed:** 2026-04-07T11:14:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Django export action at `GET /api/customers/export/` supports `?format=xlsx` (default) and `?format=csv`
- Export reuses `get_queryset()` for identical filter behaviour as the list endpoint; pagination bypassed for full data export
- `apiFetchBlob` utility added to `frontend/src/lib/api.ts` — same credentials/refresh/redirect logic as `apiFetch` but returns `Blob`
- Export button upgraded from placeholder to dropdown with "Export Excel (.xlsx)" and "Export CSV (.csv)" options
- `handleExport()` in `customers/page.tsx` builds URL from active filter state and triggers browser file download via `createObjectURL`

## Task Commits

1. **Task 1: Add export action to CustomerViewSet** - `94676d6` (feat)
2. **Task 2: Create apiFetchBlob utility and wire Export button** - `6af0d1a` (feat)

## Files Created/Modified

- `backend/customers/views.py` - Added `export_customers` action with openpyxl XLSX and csv.writer CSV generation
- `frontend/src/lib/api.ts` - Added `apiFetchBlob` utility function
- `frontend/src/app/(dashboard)/customers/components/CustomerToolbar.tsx` - Export dropdown with Excel/CSV options, custom click-outside dismiss
- `frontend/src/app/(dashboard)/customers/page.tsx` - `handleExport()` handler wired to toolbar, uses `apiFetchBlob` with current filter params

## Decisions Made

- Export action reuses `get_queryset()` unchanged — guarantees identical filter semantics to the list endpoint without code duplication
- No audit log on export — read-only operation; logging exports would pollute the audit trail
- `apiFetchBlob` mirrors `apiFetch` exactly including the silent-refresh-retry-on-401 path and `redirectToLogin` fallback
- Custom dropdown built with a `fixed inset-0` overlay div for click-outside dismiss — `shadcn/ui` DropdownMenu component was not available in the project
- Export button props renamed from `onExport` to `onExportExcel` + `onExportCsv` for explicitness at call sites

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `shadcn/ui` DropdownMenu component was not available (only badge, button, dialog, input, table exist). Built a custom dropdown inline using a relative container and a fixed-position click-outside overlay. No functional difference.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Export flow complete for CUST-12
- `apiFetchBlob` utility is ready for any future file-download endpoint (invoices, reports, etc.)
- No blockers for remaining Phase 4 plans

---
*Phase: 04-customer-management*
*Completed: 2026-04-07*

## Self-Check: PASSED
