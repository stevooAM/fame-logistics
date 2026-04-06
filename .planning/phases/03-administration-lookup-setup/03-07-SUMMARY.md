---
phase: 03-administration-lookup-setup
plan: 07
subsystem: ui
tags: [react, nextjs, shadcn, react-hook-form, zod, lookup-tables, company-profile, admin]

# Dependency graph
requires:
  - phase: 03-administration-lookup-setup
    plan: 06
    provides: Lookup table CRUD APIs at /api/setup/{ports,cargo-types,currencies,document-types}/ and company profile endpoint at /api/setup/company-profile/

provides:
  - Lookup table admin UI at /admin/lookups — 4-tab tabbed interface with add/edit/deactivate CRUD modal
  - Company profile settings form at /admin/settings — fields + logo upload via FormData PATCH
  - Admin hub landing page at /admin — navigation cards to all admin sub-sections
  - Shared TypeScript types for all lookup entities (LookupEntry, LookupConfig, LOOKUP_CONFIGS)

affects:
  - Any future phase that adds new lookup types (extend LOOKUP_CONFIGS array)
  - Shipment/job creation flows that consume lookup data (ports, cargo types, currencies, document types)
  - Company branding (logo rendered in invoices, documents)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Config-driven tabbed lookup UI — LOOKUP_CONFIGS array drives all 4 tabs from a single LookupTab component
    - FormData PATCH for multipart file upload — bypasses apiFetch JSON assumption, uses raw fetch with credentials:include
    - Soft-delete toggle via DELETE (deactivate) + PATCH is_active=true (reactivate) on lookup entries

key-files:
  created:
    - frontend/src/types/lookup.ts
    - frontend/src/app/(dashboard)/admin/lookups/page.tsx
    - frontend/src/app/(dashboard)/admin/lookups/components/LookupTab.tsx
    - frontend/src/app/(dashboard)/admin/lookups/components/LookupFormDialog.tsx
    - frontend/src/app/(dashboard)/admin/settings/page.tsx
    - frontend/src/app/(dashboard)/admin/settings/components/CompanyProfileForm.tsx
  modified:
    - frontend/src/app/(dashboard)/admin/page.tsx

key-decisions:
  - "Config-driven lookup UI: single LookupTab + LookupFormDialog component pair driven by LOOKUP_CONFIGS, avoiding per-type duplication"
  - "Logo upload uses raw fetch (not apiFetch) to avoid Content-Type override — browser must set multipart/form-data boundary automatically"
  - "Admin view fetches ?include_inactive=true to show all entries including deactivated ones"
  - "Deactivate uses DELETE verb (backend soft-deletes), reactivate uses PATCH with is_active=true"

patterns-established:
  - "Config-driven tabbed admin UI: define a config array, render a single reusable tab component per entry"
  - "FormData PATCH pattern: use raw fetch with credentials:include for any file upload endpoint"

# Metrics
duration: ~45min
completed: 2026-04-06
---

# Phase 3 Plan 07: Lookup Table Admin UI + Company Profile Summary

**Tabbed lookup admin UI (4 tables, full CRUD modal) + company profile settings form with logo upload + admin hub navigation page, all config-driven via LOOKUP_CONFIGS**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-04-06
- **Completed:** 2026-04-06
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Tabbed lookup table admin at /admin/lookups — single LookupTab component renders ports, cargo types, currencies, and document types from a config array, with add/edit/deactivate modal (LookupFormDialog)
- Company profile settings at /admin/settings — full form with name, email, phone, address, website, TIN, registration number, and logo upload with live preview using FormData PATCH
- Admin hub landing page at /admin — grid of navigation cards (Users, Audit Log, Sessions, Lookup Tables, Company Settings) replacing the prior placeholder

## Task Commits

Each task was committed atomically:

1. **Task 1: Lookup types, tabbed page, LookupTab, LookupFormDialog** - `f6e6b5e` (feat)
2. **Task 2: Company profile settings form and admin landing page** - `4e5070b` (feat)

## Files Created/Modified

- `frontend/src/types/lookup.ts` - LookupEntry interface, LookupConfig type, LOOKUP_CONFIGS constant for all 4 lookup tables
- `frontend/src/app/(dashboard)/admin/lookups/page.tsx` - Tabbed page hosting 4 LookupTab instances
- `frontend/src/app/(dashboard)/admin/lookups/components/LookupTab.tsx` - Reusable shadcn Table component with add/edit/deactivate actions, fetches with ?include_inactive=true
- `frontend/src/app/(dashboard)/admin/lookups/components/LookupFormDialog.tsx` - Create/edit modal using React Hook Form + Zod, handles extra fields per lookup type
- `frontend/src/app/(dashboard)/admin/settings/page.tsx` - Settings page wrapper rendering CompanyProfileForm
- `frontend/src/app/(dashboard)/admin/settings/components/CompanyProfileForm.tsx` - Company profile form with FormData-based logo upload and thumbnail preview
- `frontend/src/app/(dashboard)/admin/page.tsx` - Admin hub with 5 navigation cards (replaced prior placeholder)

## Decisions Made

- Config-driven approach: LOOKUP_CONFIGS drives tab labels, API paths, and extra form fields so adding a new lookup type only requires one array entry.
- Logo upload uses raw `fetch()` instead of `apiFetch` because Content-Type must not be set manually for multipart/form-data — the browser must inject the boundary itself.
- Admin lookup view uses `?include_inactive=true` query param so admins see all entries and can reactivate deactivated ones.
- Deactivate action calls DELETE (backend soft-deletes by overriding destroy); reactivate calls PATCH with `is_active: true`.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Admin lookup management is fully operational; pre-seeded lookup data (currencies, cargo types, ports, document types) is accessible and editable through the UI.
- Company profile endpoint is wired up; logo upload is ready for branding use in invoices and documents.
- Shipment and job creation flows can now consume the lookup tables from the backend via the same API paths.

---
*Phase: 03-administration-lookup-setup*
*Completed: 2026-04-06*

## Self-Check: PASSED
