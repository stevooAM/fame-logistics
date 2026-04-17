# Roadmap: Fame Freight Management System (FMS)

## Overview

This roadmap rebuilds the Fame Logistics freight management system from a legacy ASP.NET/jQuery stack to a modern Next.js 14 + Django 5 full-stack application. Ten phases move from bare infrastructure through authentication, customer data migration, job lifecycle, approval workflows, financial accounts, reporting, and production hardening — each phase delivering a coherent, verifiable capability that builds directly on the previous.

## Milestones

- [ ] **v1.0 Launch** — Phases 1–10 (target: production deployment)

## Phases

- [x] **Phase 1: Foundation** — Project scaffold, Docker, PostgreSQL, CI/CD, design system *(completed 2026-04-05)*
- [x] **Phase 2: Authentication & RBAC** — Login, session management, role enforcement *(completed 2026-04-05)*
- [x] **Phase 3: Administration & Lookup Setup** — User admin, audit log, lookup tables, company profile *(completed 2026-04-06)*
- [x] **Phase 4: Customer Management** — Customer CRUD, AG Grid list, data seed, Excel export *(completed 2026-04-10)*
- [x] **Phase 5: Job Management** — Job creation, workflow statuses, document attachments *(completed 2026-04-11)*
- [ ] **Phase 6: Approval Workflow** — Approval queue, approve/reject actions, history
- [ ] **Phase 7: Accounts & Finance** — Invoice generation, payment recording, financial summaries
- [ ] **Phase 8: Dashboard** — KPI cards, activity feed, quick-action shortcuts
- [ ] **Phase 9: Reports** — Customer, job status, and revenue reports with PDF/Excel export
- [ ] **Phase 10: Security Hardening & Launch** — Security hardening, performance validation, production deploy

---

## Phase Details

### Phase 1: Foundation

**Goal**: The monorepo exists, both services start cleanly in Docker, the database schema is applied, the design system renders in a browser, and CI/CD passes a build.

**Depends on**: Nothing (first phase)

**Requirements**: *(Infrastructure phase — no functional requirements mapped here; all SEC and PERF requirements are hardened in Phase 10)*

**Success Criteria** (what must be TRUE):
1. `docker compose up` starts the Next.js frontend and Django backend with no errors and both health-check endpoints return 200
2. The login page renders in a browser with the correct teal/amber/dark-navy design system colours (`#1F7A8C`, `#F89C1C`, `#2B3E50`)
3. PostgreSQL migrations apply cleanly and the database schema accepts a test write/read cycle
4. GitHub Actions CI pipeline runs linting, type-checking, and test stubs on every push to `main`
5. The shadcn/ui component library, AG Grid, and Tailwind CSS are wired and a sample table renders correctly

**Plans:** 7 plans

Plans:
- [ ] 01-01-PLAN.md — Monorepo structure, Docker Compose, environment config
- [ ] 01-02-PLAN.md — Django project setup (DRF, Celery, health-check, admin bootstrap)
- [ ] 01-03-PLAN.md — Next.js 14 setup (TypeScript, Tailwind, shadcn/ui, AG Grid)
- [ ] 01-04-PLAN.md — Login page design, sidebar shell, navigation, AG Grid demo
- [ ] 01-05-PLAN.md — Core, customers, and jobs models (base schema)
- [ ] 01-06-PLAN.md — GitHub Actions CI/CD pipeline, full stack integration verification
- [ ] 01-07-PLAN.md — Approvals, accounts, setup models, seed fixtures

---

### Phase 2: Authentication & RBAC

**Goal**: Staff can log in with a username and password, maintain a session across navigation, and be shown only the modules their role permits — all enforced server-side.

**Depends on**: Phase 1

**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, RBAC-01, RBAC-02, RBAC-03, RBAC-04

**Success Criteria** (what must be TRUE):
1. A staff member can log in at `/login`, navigate multiple pages without being asked to log in again, and log out cleanly back to `/login`
2. An unauthenticated request to any protected URL is redirected to `/login` — including direct URL entry
3. A failed login attempt shows a generic "Invalid credentials" error without indicating which field is wrong
4. An idle session (30 min default) expires and the user is redirected to `/login` on next interaction
5. A user assigned the Finance role cannot access Customers or Jobs pages — enforced at the API layer (returns 403), not just hidden in the UI

**Plans:** 6 plans

Plans:
- [ ] 02-01-PLAN.md — Django auth backend: 3-role model, bcrypt hashing, custom JWT claims, password validators
- [ ] 02-02-PLAN.md — RBAC permissions: DRF permission classes, admin impersonation middleware
- [ ] 02-03-PLAN.md — Auth API endpoints: login, logout, refresh, password reset, rate limiting
- [ ] 02-04-PLAN.md — Login UI wiring: split layout, remember me, loading state, error handling
- [ ] 02-05-PLAN.md — Session management: idle timeout hook, warning dialog, token auto-refresh
- [ ] 02-06-PLAN.md — Frontend RBAC: auth provider, route guards, sidebar role filtering, logout

---

### Phase 3: Administration & Lookup Setup

**Goal**: An Admin can manage users and roles, view the audit log, and configure all lookup tables (ports, cargo types, currencies, document types, company profile) so that downstream modules have valid reference data to work with.

**Depends on**: Phase 2

**Requirements**: ADMIN-01, ADMIN-02, ADMIN-03, SETUP-01, SETUP-02, SETUP-03, SETUP-04, SETUP-05

**Success Criteria** (what must be TRUE):
1. An Admin can create a new user, assign a role, deactivate the user, and see those changes reflected immediately in the user list
2. The audit log viewer shows every CRUD action with the acting user, timestamp, IP address, and action type — and is filterable
3. An Admin can view and terminate any active session from the session management panel
4. All five lookup tables (ports/locations, cargo types, currencies, document types, company profile) are editable through the admin UI and changes persist on page reload
5. Lookup values added here appear in downstream dropdowns (e.g., Port dropdown in Job creation)

**Plans:** 7 plans

Plans:
- [ ] 03-01-PLAN.md — User management API: CRUD endpoints, role assignment, temp password, deactivation with session invalidation
- [ ] 03-02-PLAN.md — User management UI: AG Grid list, create/edit modal, role selector, deactivate action, temp password display
- [ ] 03-03-PLAN.md — Audit log infrastructure: AuditLogMixin, log_audit utility, filterable audit log API endpoint
- [ ] 03-04-PLAN.md — Audit log viewer UI: filterable AG Grid table (by user, date range, action type, module)
- [ ] 03-05-PLAN.md — Session management: active session list API, terminate session action, admin UI panel
- [ ] 03-06-PLAN.md — Lookup table CRUD APIs: model updates (sort_order/code), ViewSets, seed command, dropdown endpoint
- [ ] 03-07-PLAN.md — Lookup table admin UI (tabbed), company profile settings form with logo upload, admin hub page

---

### Phase 4: Customer Management

**Goal**: Operations staff can view, add, edit, and delete customer records in a fast, filterable AG Grid list — and the 197 existing customers from the Excel export are already present on first load.

**Depends on**: Phase 3 (lookup tables must exist for reference data; RBAC must guard customer endpoints)

**Requirements**: CUST-01, CUST-02, CUST-03, CUST-04, CUST-05, CUST-06, CUST-07, CUST-08, CUST-09, CUST-10, CUST-11, CUST-12, CUST-13

**Success Criteria** (what must be TRUE):
1. The customer list loads in under 1 second with server-side pagination (20 rows/page default), and column filters return results in under 500ms
2. A new customer can be added via inline row entry or a modal form and appears in the list immediately after saving
3. An existing customer can be edited inline or via modal; a soft-deleted customer disappears from the list but its jobs remain intact
4. Saving a customer with a duplicate TIN shows a warning before proceeding; phone and TIN fields accept all valid local and international formats
5. The database already contains the 197 migrated customer records when the system is first deployed — no manual entry required
6. The customer list can be exported to Excel/CSV with current filters applied

**Plans:** 8 plans

Plans:
- [ ] 04-01-PLAN.md — Customer model update: add business_type, preferred_port FK, currency_preference FK, credit_terms + migration
- [ ] 04-02-PLAN.md — Customer API: serializers, ViewSet with pagination/filtering/soft-delete/TIN check, URL wiring
- [ ] 04-03-PLAN.md — Customer data seed: openpyxl management command to import 197 records from Excel
- [ ] 04-04-PLAN.md — Customer AG Grid list UI: paginated table, column filters, search, kebab actions
- [ ] 04-05-PLAN.md — Customer create/edit: modal form (React Hook Form + Zod), inline editing, TIN duplicate warning
- [ ] 04-06-PLAN.md — Customer detail page: two-column layout, inline-editable info, linked jobs placeholder
- [ ] 04-07-PLAN.md — Excel/CSV export: backend endpoint + frontend download trigger
- [ ] 04-08-PLAN.md — Gap closure: Docker entrypoint wiring migrate + seed_customers on first deploy

---

### Phase 5: Job Management

**Goal**: Operations staff can create a freight job linked to a customer, track it through its full status lifecycle, attach shipping documents, and find any job by number, customer, or status.

**Depends on**: Phase 4 (customers must exist to link jobs)

**Requirements**: JOB-01, JOB-02, JOB-03, JOB-04, JOB-05, JOB-06, JOB-07, JOB-08, JOB-09, JOB-10, JOB-11

**Success Criteria** (what must be TRUE):
1. A new job is created with a unique auto-generated number (e.g., `FMS-2026-00001`), linked to a customer, and immediately visible in the jobs list
2. A job advances through its status lifecycle (Draft → Pending → In Progress → Customs → Delivered → Closed) — and each transition is recorded in the audit trail with the acting user and timestamp
3. The full job detail view shows all fields (BL, container, weight, volume, cargo description, cost, notes) along with attached documents
4. Submitting a job for approval creates an entry in the Approval queue (Phase 6) — the submit action is only available to authorised roles
5. Searching by job number, customer name, status, or date range returns correct results in the paginated AG Grid within 500ms

**Plans:** 6 plans

Plans:
- [ ] 05-01-PLAN.md — Job model update: add assigned_to, eta, delivery_date fields + auto-number generation + migration
- [ ] 05-02-PLAN.md — Cloud storage integration: boto3, R2/S3 config, upload/download/presigned URL utilities
- [ ] 05-03-PLAN.md — Job API: serializers, ViewSet with CRUD, status transitions, document endpoints, pagination/search
- [ ] 05-04-PLAN.md — Job list UI: AG Grid with search/filter controls, status badges, server-side pagination
- [ ] 05-05-PLAN.md — Job create/edit form: all fields, customer picker, Zod validation
- [ ] 05-06-PLAN.md — Job detail view: field summary, status transition dropdown, document panel, audit trail timeline

---

### Phase 6: Approval Workflow

**Goal**: Managers and Admins can see a live queue of jobs awaiting approval, approve or reject them with a reason, and view the full approval history — while the sidebar badge shows the pending count at all times.

**Depends on**: Phase 5 (jobs must be submittable for approval)

**Requirements**: APR-01, APR-02, APR-03, APR-04, APR-05

**Success Criteria** (what must be TRUE):
1. The sidebar navigation badge shows the correct count of pending approvals and updates without a page refresh when a new job is submitted
2. An approver can view the list of all jobs awaiting their approval with key details visible inline
3. Approving a job updates its status, records the approver name and timestamp, and removes it from the queue
4. Rejecting a job requires a mandatory rejection reason; the originating staff member can see the rejection reason on the job record
5. An Admin can view the full approval history log — all approvals and rejections with approver, timestamp, and reason

**Plans:** 6 plans

Plans:
- [ ] 06-01-PLAN.md — Approval model audit and extension: verify scaffolded models, add UniqueConstraint, migration 0002, admin registration
- [ ] 06-02-PLAN.md — Approval API: ApprovalViewSet with pending list, approve, reject, history, pending-count endpoints; RBAC enforcement
- [ ] 06-03-PLAN.md — Sidebar badge: useApprovalBadge polling hook (30s interval); SidebarNav integration; fix Approvals nav roles to include Operations
- [ ] 06-04-PLAN.md — Approval queue UI: pending list table, Approve/Reject buttons, RejectModal with mandatory reason validation
- [ ] 06-05-PLAN.md — Approval history UI: Admin-only tabbed History view with action/date filters
- [ ] 06-06-PLAN.md — Gap closure: surface rejection_reason to originating staff via JobSerializer field + job detail callout

---

### Phase 7: Accounts & Finance

**Goal**: Finance staff can generate invoices for approved jobs, record incoming payments, see outstanding balances per customer, and export financial data to Excel — with monthly and quarterly period summaries available.

**Depends on**: Phase 6 (invoices are generated against approved jobs)

**Requirements**: ACC-01, ACC-02, ACC-03, ACC-04, ACC-05

**Success Criteria** (what must be TRUE):
1. Finance staff can generate an invoice for any approved job and the invoice appears linked to that job and customer
2. A payment can be recorded against an invoice — the outstanding balance for that customer updates immediately
3. The customer outstanding balances view shows the correct balance (invoiced minus paid) per customer
4. Monthly and quarterly financial period summaries aggregate income and payment data correctly
5. Financial data (invoices, payments, balances) can be exported to Excel with current filter/period applied

**Plans**: TBD (4–6 plans)

Plans:
- [ ] 07-01: Invoice and Payment Django models — Invoice FK to Job, Payment FK to Invoice, balance calculation, migration
- [ ] 07-02: Accounts API endpoints — generate invoice, record payment, outstanding balances, period summaries, export
- [ ] 07-03: Invoice management UI — invoice list, create invoice form, payment recording panel (use `/frontend-design` skill)
- [ ] 07-04: Outstanding balances view — per-customer balance table with drill-down (use `/frontend-design` skill)
- [ ] 07-05: Financial period summaries UI — monthly/quarterly aggregation view with date range picker (use `/frontend-design` skill)
- [ ] 07-06: Excel export — financial data export endpoint and frontend trigger

---

### Phase 8: Dashboard

**Goal**: Any logged-in staff member landing on the home page immediately sees the current state of operations — active jobs, pending approvals, outstanding invoices, recent activity, and quick-action shortcuts — without navigating anywhere.

**Depends on**: Phase 7 (all modules must exist to aggregate data)

**Requirements**: DASH-01, DASH-02, DASH-03

**Success Criteria** (what must be TRUE):
1. The dashboard KPI cards show correct real-time counts for active jobs, pending approvals, outstanding invoice total, and new customers this month
2. The recent activity feed lists the last 10 job and approval events with actor name, action, and timestamp — and reflects the most recent state on page load
3. Clicking "Create Job" or "Add Customer" from the dashboard shortcut navigates to the correct creation form

**Plans**: TBD (2–3 plans)

Plans:
- [ ] 08-01: Dashboard API endpoint — aggregate KPI query (active jobs, pending approvals, outstanding invoices, new customers); recent activity feed query
- [ ] 08-02: Dashboard UI — KPI card grid, activity feed list, quick-action buttons (use `/frontend-design` skill)

---

### Phase 9: Reports

**Goal**: Operations, Finance, and Manager staff can generate three configurable reports — customer activity, job status, and revenue — filtered by date range and exportable to both PDF and Excel.

**Depends on**: Phase 7 (revenue data must exist; job and customer data must be populated)

**Requirements**: RPT-01, RPT-02, RPT-03, RPT-04, RPT-05

**Success Criteria** (what must be TRUE):
1. The customer activity report shows jobs per customer for any selected date range and the data matches the jobs in the system
2. The job status report correctly groups jobs by status and type for the selected date range
3. The revenue report aggregates income by period and by customer and matches invoice/payment data in Accounts
4. Any report can be exported to PDF (formatted, print-ready) and Excel from the same page
5. All reports default to the current month but accept any custom date range via a date range picker

**Plans**: TBD (3–5 plans)

Plans:
- [ ] 09-01: Report query layer — optimised Django ORM queries for customer activity, job status, revenue aggregations
- [ ] 09-02: Report API endpoints — customer activity, job status, revenue; all accept date range + filter params
- [ ] 09-03: Report UI — date range picker, report tables, run/refresh button (use `/frontend-design` skill)
- [ ] 09-04: PDF and Excel export — server-side PDF generation (WeasyPrint or ReportLab), Excel export (openpyxl); download triggers from frontend

---

### Phase 10: Security Hardening & Launch

**Goal**: The application is verified secure and performant, all production infrastructure is live (HTTPS, Nginx, Vercel, Railway/Render), and the system is handed over for production use.

**Depends on**: Phase 9 (all features complete)

**Requirements**: SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-06, SEC-07, SEC-08, SEC-09, PERF-01, PERF-02

**Success Criteria** (what must be TRUE):
1. All HTTP traffic redirects to HTTPS (TLS 1.2+); the SSL certificate is valid and browser security headers pass an SSL Labs A-grade scan
2. A manual security checklist confirms: bcrypt 12-round hashing on all passwords, CSRF tokens on all state-changing endpoints, parameterized queries throughout, XSS output encoding on all user content, HttpOnly+Secure+SameSite cookies, rate limiting active on login endpoint
3. Page load on a throttled 3G connection is under 2 seconds for the dashboard; the customer list loads in under 1 second; column filter response is under 500ms — verified in browser DevTools
4. Server-side pagination is confirmed on all AG Grid tables — no endpoint returns an unbounded result set
5. The application is deployed and accessible at the production domain with all 197 customer records present and all modules functional

**Plans**: TBD (5–7 plans)

Plans:
- [ ] 10-01: Production infrastructure — Vercel (Next.js), Railway/Render (Django + Celery + Redis), PostgreSQL managed instance, Nginx reverse proxy config
- [ ] 10-02: SSL / HTTPS setup — Let's Encrypt cert, Nginx HTTP→HTTPS redirect, HSTS header, CSP header configuration
- [ ] 10-03: Security audit — review bcrypt config, CSRF middleware, parameterized queries, XSS output encoding, cookie flags, rate limiting
- [ ] 10-04: Performance audit — Lighthouse / DevTools 3G throttle test on dashboard and customer list; query profiling on slow endpoints; index review on PostgreSQL
- [ ] 10-05: Environment hardening — production `.env` secrets management, DEBUG=False, ALLOWED_HOSTS, CORS config, disable Django admin on prod
- [ ] 10-06: End-to-end smoke test — run full workflow (login → create customer → create job → approve → generate invoice → run report) in production
- [ ] 10-07: Launch — seed production database with 197 customers, final Go/No-Go check, DNS cutover

---

## Progress

**Execution Order:** Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 7/7 | ✓ Complete | 2026-04-05 |
| 2. Authentication & RBAC | 6/6 | ✓ Complete | 2026-04-05 |
| 3. Administration & Lookup Setup | 7/7 | ✓ Complete | 2026-04-06 |
| 4. Customer Management | 8/8 | ✓ Complete | 2026-04-10 |
| 5. Job Management | 6/6 | ✓ Complete | 2026-04-11 |
| 6. Approval Workflow | 5/6 | In progress (gap closure) | - |
| 7. Accounts & Finance | 0/6 | Not started | - |
| 8. Dashboard | 0/2 | Not started | - |
| 9. Reports | 0/4 | Not started | - |
| 10. Security Hardening & Launch | 0/7 | Not started | - |

**Total plans (estimated):** 56 plans across 10 phases

---

## Requirement Coverage

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 2 | Pending |
| AUTH-02 | Phase 2 | Pending |
| AUTH-03 | Phase 2 | Pending |
| AUTH-04 | Phase 2 | Pending |
| AUTH-05 | Phase 2 | Pending |
| AUTH-06 | Phase 2 | Pending |
| AUTH-07 | Phase 2 | Pending |
| RBAC-01 | Phase 2 | Pending |
| RBAC-02 | Phase 2 | Pending |
| RBAC-03 | Phase 2 | Pending |
| RBAC-04 | Phase 2 | Pending |
| CUST-01 | Phase 4 | Pending |
| CUST-02 | Phase 4 | Pending |
| CUST-03 | Phase 4 | Pending |
| CUST-04 | Phase 4 | Pending |
| CUST-05 | Phase 4 | Pending |
| CUST-06 | Phase 4 | Pending |
| CUST-07 | Phase 4 | Pending |
| CUST-08 | Phase 4 | Pending |
| CUST-09 | Phase 4 | Pending |
| CUST-10 | Phase 4 | Pending |
| CUST-11 | Phase 4 | Pending |
| CUST-12 | Phase 4 | Pending |
| CUST-13 | Phase 4 | Pending |
| JOB-01 | Phase 5 | Pending |
| JOB-02 | Phase 5 | Pending |
| JOB-03 | Phase 5 | Pending |
| JOB-04 | Phase 5 | Pending |
| JOB-05 | Phase 5 | Pending |
| JOB-06 | Phase 5 | Pending |
| JOB-07 | Phase 5 | Pending |
| JOB-08 | Phase 5 | Pending |
| JOB-09 | Phase 5 | Pending |
| JOB-10 | Phase 5 | Pending |
| JOB-11 | Phase 5 | Pending |
| APR-01 | Phase 6 | Pending |
| APR-02 | Phase 6 | Pending |
| APR-03 | Phase 6 | Pending |
| APR-04 | Phase 6 | Pending |
| APR-05 | Phase 6 | Pending |
| ACC-01 | Phase 7 | Pending |
| ACC-02 | Phase 7 | Pending |
| ACC-03 | Phase 7 | Pending |
| ACC-04 | Phase 7 | Pending |
| ACC-05 | Phase 7 | Pending |
| RPT-01 | Phase 9 | Pending |
| RPT-02 | Phase 9 | Pending |
| RPT-03 | Phase 9 | Pending |
| RPT-04 | Phase 9 | Pending |
| RPT-05 | Phase 9 | Pending |
| DASH-01 | Phase 8 | Pending |
| DASH-02 | Phase 8 | Pending |
| DASH-03 | Phase 8 | Pending |
| ADMIN-01 | Phase 3 | Pending |
| ADMIN-02 | Phase 3 | Pending |
| ADMIN-03 | Phase 3 | Pending |
| SETUP-01 | Phase 3 | Pending |
| SETUP-02 | Phase 3 | Pending |
| SETUP-03 | Phase 3 | Pending |
| SETUP-04 | Phase 3 | Pending |
| SETUP-05 | Phase 3 | Pending |
| SEC-01 | Phase 10 | Pending |
| SEC-02 | Phase 10 | Pending |
| SEC-03 | Phase 10 | Pending |
| SEC-04 | Phase 10 | Pending |
| SEC-05 | Phase 10 | Pending |
| SEC-06 | Phase 10 | Pending |
| SEC-07 | Phase 10 | Pending |
| SEC-08 | Phase 10 | Pending |
| SEC-09 | Phase 10 | Pending |
| PERF-01 | Phase 10 | Pending |
| PERF-02 | Phase 10 | Pending |

**Coverage: 72/72 v1 requirements mapped. No orphans.**

> Note: REQUIREMENTS.md stated 62 requirements; actual count from file is 72 (AUTH-07, RBAC-04, and all SEC/PERF requirements were present in the file). Traceability updated to reflect actual count.

---
*Roadmap created: 2026-04-04*
*Depth: Comprehensive (8-12 phases)*
*Milestone: v1.0 Launch*
