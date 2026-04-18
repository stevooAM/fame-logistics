# Phase 8: Dashboard - Context

**Gathered:** 2026-04-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a home-page dashboard that any logged-in staff member lands on and immediately sees the current state of operations: KPI cards, a recent activity feed, and quick-action shortcuts. No new data is created here — this is a read/display layer aggregating data from Phases 2–7 (jobs, approvals, invoices, customers, users). Creating or editing records happens in their respective modules; the dashboard surfaces and links to them.

</domain>

<decisions>
## Implementation Decisions

### KPI Cards
- Four KPI cards confirmed: Active Jobs, Pending Approvals, Outstanding Invoice Total (GHS), New Customers This Month
- Finance role sees 3 cards only — Pending Approvals card is hidden (not actionable for Finance)
- Outstanding Invoice Total formatted as `GHS 12,450.00` (always GHS, no multi-currency)
- Cards are clickable drill-downs — each navigates to the relevant filtered list (e.g. Active Jobs → Jobs list filtered to active statuses)
- Cards auto-refresh every 30 seconds (same interval as the approval badge polling already in the app)

### Activity Feed
- Starts with 10 most recent entries; "Load more" button fetches older entries (no hard cap)
- Covers **all system events**: job status changes, submissions, approvals/rejections, invoice/payment events, customer creates, user admin actions
- Feed is **role-filtered**: Finance sees finance events (invoices, payments); Operations sees job/customer events; Admin sees everything
- Feed auto-refreshes on the same 30s cycle as KPI cards (single polling call)
- Entry layout: Claude's Discretion — must include actor name, action description, and timestamp per roadmap requirement

### Quick Actions — Layout
- Page order (top to bottom): KPI cards → Quick Actions → Activity Feed

### Quick Actions — Operations & Admin
- Three shortcuts: **Create Job**, **Add Customer**, **View Approvals**
- Admin additionally gets a second panel: **Manage Users**, **View Audit Log**

### Quick Actions — Finance
- Three shortcuts: **Generate Invoice**, **Record Payment**, **View Balances**

### Quick Action Button Colour
- Claude's Discretion — follow existing button colour conventions in the codebase (teal for standard actions, amber for high-priority CTAs as established in 07-04)

### Claude's Discretion
- Activity feed entry layout (single-line vs two-line) — must include actor, action, timestamp
- Quick action button colours — follow established codebase conventions
- Loading skeleton / empty state design for feed and cards
- Exact polling implementation (whether one shared interval or two)

</decisions>

<specifics>
## Specific Ideas

- Auto-refresh cadence should match the existing 30s approval badge pattern from Phase 6 (useApprovalBadge) — reuse the same interval mechanism if possible
- Finance quick actions mirror the two most common Finance workflows: Generate Invoice (amber CTA in 07-04) and Record Payment (teal in 07-04)
- Admin shortcuts panel is an extra section below the standard quick actions, not a replacement

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 08-dashboard*
*Context gathered: 2026-04-18*
