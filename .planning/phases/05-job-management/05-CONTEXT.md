# Phase 5: Job Management - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Operations staff can create a freight job linked to a customer, track it through its full status lifecycle (Draft → Pending → In Progress → Customs → Delivered → Closed), attach shipping documents, and find any job by number, customer, or status. Approval queue population (Phase 6), invoice generation (Phase 7), and reporting (Phase 9) are out of scope.

</domain>

<decisions>
## Implementation Decisions

### Status Lifecycle & Role Permissions
- Operations and Admin roles can advance job statuses; Finance is view-only
- Status reversal is Admin-only — Operations cannot move a job backwards
- "Submit for Approval" is a status transition in the status dropdown (not a separate button) — it slots naturally into the lifecycle flow to Phase 6's approval queue
- Every status change requires a confirmation dialog (no exceptions)
- Status transitions are recorded in the audit trail with acting user and timestamp (per roadmap success criteria)

### Document Attachments
- Any file type accepted — no restriction
- Maximum 20 files per job
- Document type/category is required on upload — uses the lookup table system (Document Types from Phase 3 Setup)
- Document display on job detail: Claude's discretion — standard list format is fine
- Cloud storage target: Cloudflare R2 or AWS S3 (per roadmap plan 05-04)

### Job List Columns & Search
- Default AG Grid columns: Job Number, Customer Name, Status Badge, Job Type / Cargo Description, ETA, Delivery Date
- Default sort: newest first (created date descending)
- Filter/search controls: job number search, customer name search, status filter, date range (created date), port/location filter, job type filter, assigned staff filter
- Server-side pagination (consistent with all other AG Grid tables in the system)

### Job Form Fields
- Most fields required: customer (required), cargo description (required), BL number (required), container number (required), weight (required), volume (required), cost (required); notes optional
- Customer picker: Claude's discretion — use the standard picker pattern established in the project (searchable dropdown)
- Assigned staff: optional field — a job can be created unassigned and assigned later
- Job detail editing: mixed pattern — simple fields editable inline; documents and status use their dedicated controls (document panel + status dropdown)
- Job number auto-generated on creation: format `FMS-{YEAR}-{SEQUENCE}` (e.g., `FMS-2026-00001`)

### Claude's Discretion
- Customer picker implementation detail (searchable dropdown assumed from project patterns)
- Document list display format on detail view
- Loading skeleton and error state design
- Exact field grouping layout within the create/edit form

</decisions>

<specifics>
## Specific Ideas

- Status dropdown is the single control for all lifecycle transitions including submit-for-approval — keeps the UI consistent and avoids scattered action buttons
- Confirmation on every status change is intentional — freight jobs are high-stakes; accidental transitions have real-world consequences
- Document categories must come from the existing Document Types lookup table (Phase 3) — no hardcoded list

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-job-management*
*Context gathered: 2026-04-10*
