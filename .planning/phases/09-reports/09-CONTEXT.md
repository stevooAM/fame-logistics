# Phase 9: Reports - Context

**Gathered:** 2026-04-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Three configurable reports — customer activity, job status, and revenue — that Operations, Finance, and Manager staff can generate for any date range and export to both PDF and Excel. Report configuration (which columns appear, how they're computed) is fixed; this phase does not add report scheduling, saved report templates, or charting beyond what already exists in Accounts.

</domain>

<decisions>
## Implementation Decisions

### Customer Activity Report
- Row structure: summary row per customer (job count, total value by status) with expandable drilldown showing individual jobs — not a flat list of all jobs
- This gives a high-level overview by default with per-customer detail on demand

### Job Status Report
- Filter: always shows all statuses — no per-status filter (user decision: "No — always all statuses")
- Grouping approach: Claude's discretion — pick the grouping (by status with counts/value) that makes most operational sense

### Revenue Report
- Two sections: period summary at the top (totals by month/quarter), then a per-customer breakdown table below
- Currency filter: yes — a currency dropdown so Finance can isolate revenue by currency (e.g., GHS vs USD)

### Totals Footer
- Claude's discretion — add totals footer rows where they make analytical sense (revenue report certainly; others where counts/values are meaningful)

### Run Trigger
- Explicit "Run Report" button — user sets date range and filters, then clicks Run
- Consistent with the period summary pattern in Accounts (Phase 7)

### Job Status Filter
- No status multi-select filter — the report always shows all statuses for the selected period; grouping makes the breakdown clear

### Claude's Discretion
- Report navigation structure (tabs vs sidebar entries vs hub page) — pick what fits existing nav patterns; Accounts uses tabs, so tabs on a single /reports page is the likely fit
- Date range presets — whether to include This Month / Last Month / This Quarter shortcuts alongside the custom date picker
- Export button placement — position consistently with existing export patterns (Accounts, Customers)
- PDF branding — whether to include company logo/name/address in the header
- PDF page footer — page numbers, generated date, or both
- PDF orientation — portrait or landscape per report based on column count
- Applied filters display in PDF — whether to show a metadata line (period, currency) below the report title
- Customer filter on activity report — whether to include a customer picker to scope the report to one customer
- Excel export filter behavior — whether Excel respects the same filters as the PDF or exports all data

</decisions>

<specifics>
## Specific Ideas

- The revenue report structure (period summary + customer table) mirrors what Accounts already shows in Phase 7 — reuse that mental model
- The explicit Run button pattern is already established in Phase 7 period summary; stay consistent

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 09-reports*
*Context gathered: 2026-04-18*
