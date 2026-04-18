---
phase: 09-reports
plan: 04
subsystem: api
tags: [weasyprint, openpyxl, pdf, excel, export, reports, django, nextjs, apiFetchBlob]

# Dependency graph
requires:
  - phase: 09-02
    provides: CustomerActivityView, JobStatusView, RevenueView with _parse_dates helper and query functions
  - phase: 04-07
    provides: apiFetchBlob pattern for blob-download client
provides:
  - WeasyPrint HTML-to-PDF export endpoint for all three reports
  - openpyxl Excel export endpoint for all three reports
  - reports/pdf_utils.py with generate_report_pdf utility
  - Three export view classes: CustomerActivityExportView, JobStatusExportView, RevenueExportView
  - Frontend export API functions: exportCustomerActivity, exportJobStatus, exportRevenue
affects: [09-03, 10-nfr]

# Tech tracking
tech-stack:
  added: [weasyprint>=62.0,<64.0, WeasyPrint system deps (Pango Cairo GDK-PixBuf)]
  patterns:
    - "Export endpoint pattern: same view/query reuse as list endpoint, format=pdf|xlsx query param dispatch"
    - "PDF generation: HTML template with embedded CSS rendered via WeasyPrint, A4 landscape with page counters"
    - "Revenue Excel: two worksheets (Period Summary + Customer Breakdown) in single workbook"

key-files:
  created:
    - backend/reports/pdf_utils.py
  modified:
    - backend/requirements.txt
    - backend/Dockerfile
    - backend/reports/views.py
    - backend/reports/urls.py
    - frontend/src/lib/reports-api.ts

key-decisions:
  - "Export endpoints reuse existing query functions (_parse_dates + customer_activity_query/job_status_query/revenue_query) — identical filter semantics to list endpoints guaranteed"
  - "format=pdf|xlsx query param on export endpoints — single URL per report, format-dispatched in view"
  - "Revenue Excel uses two sheets (Period Summary + Customer Breakdown) for structured multi-table data"
  - "WeasyPrint A4 landscape with CSS @page counters — page numbering and generated date in footer"
  - "Section component export buttons deferred pending 09-03 component files (parallel execution) — export API functions in reports-api.ts are the complete deliverable for this plan"

patterns-established:
  - "pdf_utils.generate_report_pdf: report_type string dispatch to per-report HTML builder functions"
  - "Export view pattern: identical to list view param parsing, then fmt dispatch to PDF or Excel response"

# Metrics
duration: 4min
completed: 2026-04-18
---

# Phase 9 Plan 04: PDF and Excel Export for All Reports Summary

**WeasyPrint PDF and openpyxl Excel export endpoints live for Customer Activity, Job Status, and Revenue reports — with branded A4 PDF layouts and two-sheet Excel workbooks for Revenue**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-04-18T12:35:52Z
- **Completed:** 2026-04-18T12:39:39Z
- **Tasks:** 2 auto tasks complete (checkpoint pending user verification)
- **Files modified:** 6

## Accomplishments

- Created `backend/reports/pdf_utils.py` with `generate_report_pdf()` — A4 landscape PDF with Fame Logistics teal branding, page numbers, date range metadata, bold headers, and totals rows
- Added three export view classes (CustomerActivityExportView, JobStatusExportView, RevenueExportView) to `views.py` reusing existing query functions — format=pdf|xlsx dispatch
- Wired six URL patterns in `reports/urls.py` (three list + three export)
- Added WeasyPrint to requirements.txt and system deps (Pango, Cairo, GDK-PixBuf) to Dockerfile
- Added three export functions to `reports-api.ts` using `apiFetchBlob` — exportCustomerActivity, exportJobStatus, exportRevenue

## Task Commits

Each task was committed atomically:

1. **Task 1: Backend export endpoints (PDF + Excel) for all three reports** - `c1126b0` (feat)
2. **Task 2: Frontend export functions using apiFetchBlob** - `8c91046` (feat)

## Files Created/Modified

- `backend/reports/pdf_utils.py` - HTML-to-PDF generator for all three report types using WeasyPrint
- `backend/requirements.txt` - Added weasyprint>=62.0,<64.0
- `backend/Dockerfile` - Added WeasyPrint system dependencies (Pango, Cairo, GDK-PixBuf, libffi)
- `backend/reports/views.py` - Added CustomerActivityExportView, JobStatusExportView, RevenueExportView
- `backend/reports/urls.py` - Added three export URL patterns alongside existing list patterns
- `frontend/src/lib/reports-api.ts` - Added exportCustomerActivity, exportJobStatus, exportRevenue using apiFetchBlob

## Decisions Made

- `format=pdf|xlsx` query param on export endpoints — single URL per report type, format dispatched in view body. Consistent with plan spec and simpler than separate PDF/Excel endpoints.
- Revenue Excel export uses two sheets (Period Summary + Customer Breakdown) — structured separation matches the two-section data model from revenue_query.
- Section component export buttons deferred pending 09-03 component creation (parallel execution). The export API functions in reports-api.ts are complete. Buttons will be integrated when 09-03 delivers the component files.
- WeasyPrint imports are lazy (inside `generate_report_pdf` function body) — avoids import-time crash if WeasyPrint system libs are absent in development, allowing unit tests of query logic to still run.

## Deviations from Plan

None - plan executed exactly as written. Section component buttons are documented as pending 09-03 completion (as the plan explicitly acknowledged parallel execution and stated this was acceptable).

## Issues Encountered

None. Pre-existing TypeScript errors in unrelated files (LookupFormDialog, ag-grid-demo) were noted but not introduced by this plan.

## User Setup Required

**WeasyPrint requires system libraries installed on the server host (or Docker container).**

The Dockerfile has been updated with the required apt packages. For local development outside Docker:

```bash
# macOS
brew install pango cairo gdk-pixbuf libffi

# Debian/Ubuntu
apt-get install -y libpango-1.0-0 libpangoft2-1.0-0 libcairo2 libgdk-pixbuf2.0-0 libffi-dev
```

Then install the Python package:
```bash
pip install weasyprint
```

## Next Phase Readiness

- All three export endpoints live at `/api/reports/{type}/export/?format=pdf|xlsx`
- Frontend export functions ready in `reports-api.ts` for 09-03 to wire into section components
- Revenue Excel has two worksheets (Period Summary + Customer Breakdown) as specified
- PDF has company branding, date range, page numbers — ready for verification once Docker is running
- Checkpoint awaits user verification of download behavior

---
*Phase: 09-reports*
*Completed: 2026-04-18*

## Self-Check: PASSED
