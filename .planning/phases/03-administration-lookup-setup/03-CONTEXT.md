# Phase 3: Administration & Lookup Setup - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Admin-only tooling to manage users and roles, view system activity (audit log), control active sessions, and configure all reference data (ports/locations, cargo types, currencies, document types) plus company profile — the foundation downstream modules depend on for valid dropdown values and branding.

</domain>

<decisions>
## Implementation Decisions

### User creation flow
- Admin creates users with all 3 roles available (Admin, Operations, Finance) — any Admin can create another Admin
- Initial password: system auto-generates a temporary password shown to the Admin once at creation
- Forced password change on first login: YES — `is_force_password_change` flag (already in JWT schema from Phase 2) is set to true for new users; they see the change screen immediately after first login
- Deactivation: sessions are immediately invalidated when a user is deactivated — tokens stop working right away (not just on natural expiry)

### Audit log display
- Filters: by user (who acted), by date range, by action type (Create / Edit / Delete), by module (Customer, Job, User, Lookup, etc.)
- Per-row columns: acting user, timestamp, IP address, action type, module, record ID, human-readable description (e.g., "Updated customer: Acme Corp")
- Before/after field diffs are NOT shown — description text only
- Server-side pagination — same pattern as the customer list
- Access: Admin role only

### Lookup table editing
- Edit UX: modal form (consistent with the customer create/edit pattern already established)
- Deletion policy: deactivate only (no hard deletes) — deactivated values no longer appear in dropdowns but existing records that reference them are preserved
- Fields per lookup entry: Name, Code/abbreviation (e.g., "GHS", "TEMA"), Sort order (controls dropdown order)
- Pre-seeded defaults on first deploy:
  - Currencies: GHS, USD, GBP, EUR
  - Common cargo types: Claude decides sensible defaults for freight (e.g., General Cargo, Bulk, Containerized, Perishables, Hazardous)
  - Ports/locations, document types: start empty — Admin configures

### Company profile scope
- Fields (Claude's discretion on exact schema): company name, logo (file upload), address, phone, email, TIN/registration number
- Logo stored server-side; appears in sidebar header and on generated invoices/reports (PDF output)
- Company name also used in browser tab title
- Edit access: Admin role only

### Claude's Discretion
- Exact temp password generation algorithm (length, complexity)
- Logo file format/size validation and storage path
- Which specific cargo types are pre-seeded
- Exact AG Grid column widths and order for audit log and user list tables
- Session invalidation implementation (token blacklist vs `is_active=False` check)

</decisions>

<specifics>
## Specific Ideas

- Audit log should feel like a read-only system view — no actions available, just filterable data
- Lookup tables are simple config screens — five separate tables (ports/locations, cargo types, currencies, document types), each on its own tab or page within the lookup admin UI
- Company profile is a single settings form, not a list — one record per system

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-administration-lookup-setup*
*Context gathered: 2026-04-05*
