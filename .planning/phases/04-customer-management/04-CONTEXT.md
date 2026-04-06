# Phase 4: Customer Management - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Operations staff can view, add, edit, and delete customer records in a fast, filterable AG Grid list. The 197 existing customers from the Excel export are already present on first load. Includes Excel/CSV export with current filters applied.

Job creation, approval workflow, and financial records are separate phases. This phase establishes the customer data foundation that downstream phases link to.

</domain>

<decisions>
## Implementation Decisions

### Customer fields
- Company name (required)
- TIN — Tax Identification Number (required, unique with duplicate warning)
- Contact person name, phone number(s), email address
- Address / location (physical or mailing)
- Business type / category (e.g. importer, exporter, freight agent)
- Preferred port / location (from ports lookup table)
- Currency preference (from currencies lookup table)
- Credit terms / payment terms (e.g. net 30, prepaid)
- Notes — free text remarks field

### Excel migration
- Keep the Excel column structure as-is — column names map directly to DB fields
- Migration script reads `fame_logistic_customers.xlsx`, validates, seeds to PostgreSQL
- All 197 records must be present on first deploy — no manual entry required

### AG Grid list layout
- Visible columns: Company name, TIN, Contact person + phone, Business type, Credit terms
- Default sort: Company name A–Z
- Row actions via kebab menu (⋮) — contains: Edit (inline), View Detail, Delete (soft)
- Row click navigation: Claude's Discretion

### Create/edit interaction pattern
- **Create**: Both inline (blank row at top of grid) and modal form are available — user chooses
- **Edit**: Inline cell editing directly in the AG Grid row
- **Duplicate TIN**: Warning dialog before save — "A customer with this TIN already exists: [Name]. Proceed anyway?" — staff can still proceed
- **Post-save behavior**: Claude's Discretion

### Customer detail view
- Layout: Two-column — left: all customer info fields, right: linked jobs list
- Linked jobs panel: shows job numbers/status; Claude's Discretion on whether a "Create Job" shortcut is included
- Editing on detail view: inline editing directly on the page (no modal needed)
- Page vs drawer: Claude's Discretion (separate page `/customers/[id]` recommended given two-column layout)

### Claude's Discretion
- Row click behavior (navigate to detail or require explicit action)
- Post-save behavior after create/edit (close modal + refresh list, or navigate to detail)
- Whether linked jobs panel includes a "Create Job for this Customer" shortcut
- Detail view routing — separate page vs side drawer
- Loading skeleton design, empty states, error handling

</decisions>

<specifics>
## Specific Ideas

- Linked jobs panel on detail view should resemble the two-column layout mockup: company info left, job list right with job numbers and a "View all jobs" link if overflow
- Inline cell editing in the AG Grid is the preferred edit UX (similar to spreadsheet editing)
- Duplicate TIN warning should name the existing customer so staff can decide whether to proceed or navigate to the existing record

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-customer-management*
*Context gathered: 2026-04-06*
