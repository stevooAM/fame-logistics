# Phase 1: Foundation - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Scaffold the monorepo, get both services running in Docker, apply the full database schema, render the design system shell in a browser, and pass a CI/CD build. This phase delivers the infrastructure every subsequent phase builds on — no user-facing features beyond the login page and sidebar shell.

</domain>

<decisions>
## Implementation Decisions

### Sidebar navigation structure
- All final nav items present from day 1: Dashboard, Customers, Jobs, Approvals, Accounts, Reports, Admin
- Items pointing to placeholder pages until their respective phases are built
- Icon + label collapsible sidebar — toggle between full labels and icon-only mode
- User name, role badge, and logout button at the bottom of the sidebar
- Sidebar is role-aware from the start — nav items filtered by role even before Phase 2 fully wires RBAC (stub the filtering logic so Phase 2 can activate it)

### Database schema scope
- All 10 phases worth of models defined in Phase 1 — full upfront schema covering every entity (User, Role, Customer, Job, Invoice, Payment, ApprovalQueue, etc.)
- Later phases add behaviour, not new models
- Indexes added alongside each model as it is defined: FK indexes and common filter columns
- Seed fixture scaffold: empty fixture files per model + a handful of dev-only test rows so the UI is never blank during development

### Default admin bootstrap
- Django management command (`create_default_admin`) creates a superuser from env vars on first run
- Useful for local dev, CI, and initial deployment

### Design system completeness
- Tokens defined: typography scale (h1–caption), spacing scale (4/8/12/16/24/32px as Tailwind config), border radius presets, elevation shadows for cards/modals
- shadcn/ui components configured and verified: Button, Input, Table, Modal, Badge
- AG Grid: one live demo table with 5–10 hardcoded mock rows — confirms library is wired and column features work
- Login page: fully designed with brand colours (`#1F7A8C` teal, `#F89C1C` amber, `#2B3E50` dark navy), company logo placeholder, and form — not a placeholder

### CI/CD gate strictness
- Required checks (all must pass to merge): ESLint + Ruff lint, tsc --noEmit typecheck, Django pytest smoke suite, Next.js build
- All four checks are blocking — no merging broken code
- Real PostgreSQL 16 service container in CI — no SQLite divergence
- Vercel preview deploy triggered on every PR for visual frontend verification

### Claude's Discretion
- Exact folder/file naming conventions within the monorepo
- Django app structure (number of apps, naming)
- Celery and Redis configuration details
- DRF base config and health-check endpoint implementation
- Exact column set and data in the AG Grid demo table

</decisions>

<specifics>
## Specific Ideas

- Sidebar role-aware filtering should be stubbed (not omitted) so Phase 2 only needs to activate it, not rebuild it
- The login page must visually match the brand colours in Phase 1 — this is a success criterion
- CI must use real Postgres — this was an explicit decision to avoid mock/prod divergence (lesson from prior projects)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-04-04*
