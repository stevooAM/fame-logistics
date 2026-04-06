# Requirements: Fame Freight Management System (FMS)

**Defined:** 2026-04-04
**Core Value:** Operations staff can create, track, and approve freight jobs end-to-end — from customer onboarding to invoice generation — with full audit trails and role-based access control.

---

## v1 Requirements

### Authentication & Session Management

- [x] **AUTH-01**: User can log in with username and password via login form
- [x] **AUTH-02**: Unauthenticated requests redirect to /login
- [x] **AUTH-03**: Session persists across page navigation without re-login (JWT + refresh token)
- [x] **AUTH-04**: Logout terminates session and redirects to login
- [x] **AUTH-05**: Failed login shows error without revealing which field is wrong
- [x] **AUTH-06**: Session times out after configurable idle period (default 30 min)
- [x] **AUTH-07**: Password reset flow (admin-reset or email-based)

### Role-Based Access Control

- [x] **RBAC-01**: Three roles defined — Admin, Operations, Finance
- [x] **RBAC-02**: Role permissions enforced server-side (not just UI-level)
- [x] **RBAC-03**: Admin can create, edit, and deactivate users; assign roles
- [x] **RBAC-04**: Module access restricted per role per RBAC matrix in PRD section 10

### Customer Management

- [ ] **CUST-01**: Paginated customer master list (AG Grid, 20 per page, configurable)
- [ ] **CUST-02**: Filter customers by any column using inline column filters
- [ ] **CUST-03**: Add new customer via inline row entry or modal form
- [ ] **CUST-04**: Edit existing customer — inline cell editing or edit modal
- [ ] **CUST-05**: Delete customer with confirmation dialog (soft delete — is_active=false)
- [ ] **CUST-06**: Save and Cancel batch changes (table-level action buttons)
- [ ] **CUST-07**: Customer type validated as Company or Individual
- [ ] **CUST-08**: TIN field supports prefix formats: C, P, G, Q, GHA, EUROPE
- [ ] **CUST-09**: Phone field accepts mixed local (02xx, 05xx) and international (+233, +44, +1) formats
- [ ] **CUST-10**: Customer record links to their associated jobs
- [ ] **CUST-11**: Duplicate TIN detection and warning on save
- [ ] **CUST-12**: Export customer list to Excel/CSV
- [ ] **CUST-13**: 197 existing customer records seeded from fame_logistic_customers.xlsx on first deploy

### Job Management

- [ ] **JOB-01**: Create freight job linked to a customer
- [ ] **JOB-02**: Auto-generate unique job number on creation (e.g., FMS-2026-00001)
- [ ] **JOB-03**: Job type: Import / Export / Transit / Local
- [ ] **JOB-04**: Job fields: Origin, Destination, Cargo Description, Bill of Lading, Container Number, Weight (kg), Volume (CBM), Total Cost, Notes
- [ ] **JOB-05**: List all jobs in filterable, paginated AG Grid table
- [ ] **JOB-06**: Full job detail single-record view
- [ ] **JOB-07**: Job status workflow: Draft → Pending → In Progress → Customs → Delivered → Closed / Cancelled
- [ ] **JOB-08**: Submit job for approval — triggers Approval queue entry
- [ ] **JOB-09**: Search jobs by job number, customer, status, date range
- [ ] **JOB-10**: Job audit trail — all state changes recorded with user and timestamp
- [ ] **JOB-11**: Attach documents to job (Bill of Lading, manifests, invoices) via cloud storage

### Approval Workflow

- [ ] **APR-01**: Approval queue badge counter on sidebar nav (live pending count)
- [ ] **APR-02**: List all items pending approval for current approver
- [ ] **APR-03**: Approve action — sets status, records approver and timestamp
- [ ] **APR-04**: Reject action — requires mandatory rejection reason; notifies originator
- [ ] **APR-05**: Approval history viewable by admins

### Accounts & Finance

- [ ] **ACC-01**: Generate invoice for a completed/approved job
- [ ] **ACC-02**: Record payments against invoices
- [ ] **ACC-03**: View outstanding balances per customer
- [ ] **ACC-04**: Monthly and quarterly financial period summaries
- [ ] **ACC-05**: Export financial data to Excel

### Reports

- [ ] **RPT-01**: Customer activity report — jobs per customer in date range
- [ ] **RPT-02**: Job status report — jobs by status, type, date range
- [ ] **RPT-03**: Revenue report — income by period and customer
- [ ] **RPT-04**: All reports exportable to PDF and Excel
- [ ] **RPT-05**: Date range filter on all reports

### Dashboard

- [ ] **DASH-01**: KPI cards: active jobs count, pending approvals count, outstanding invoices total, new customers this month
- [ ] **DASH-02**: Recent activity feed (last 10 jobs/approvals created)
- [ ] **DASH-03**: Quick-action shortcuts to create job, add customer

### Administration & Setup

- [x] **ADMIN-01**: User management — create, edit, deactivate users
- [x] **ADMIN-02**: Audit log viewer — all CRUD actions with user, timestamp, IP, action type
- [x] **ADMIN-03**: Session management — admin can view and terminate active sessions
- [x] **SETUP-01**: Port/location master list configuration
- [x] **SETUP-02**: Cargo type categories configuration
- [x] **SETUP-03**: Currency and exchange rate configuration
- [x] **SETUP-04**: Document type configuration
- [x] **SETUP-05**: Company profile settings (name, logo, contact info)

### Security & Non-Functional

- [ ] **SEC-01**: HTTPS only — enforce TLS 1.2+ with redirect from HTTP
- [ ] **SEC-02**: Passwords hashed with bcrypt (minimum 12 rounds)
- [ ] **SEC-03**: CSRF protection on all state-changing forms/endpoints
- [ ] **SEC-04**: SQL injection prevention — parameterized queries / ORM only
- [ ] **SEC-05**: XSS prevention — output encoding on all user-generated content
- [ ] **SEC-06**: Rate limiting — max 10 failed login attempts per IP per 15 minutes
- [ ] **SEC-07**: Session cookies — HttpOnly, Secure, SameSite=Lax
- [ ] **SEC-08**: Audit logging — all CRUD operations logged with user, timestamp, IP
- [ ] **SEC-09**: All fields validated server-side regardless of client-side validation
- [ ] **PERF-01**: Page load <2 seconds on 3G; customer list <1s; filter response <500ms
- [ ] **PERF-02**: Server-side pagination throughout — no client-side load-all

---

## v2 Requirements

### Notifications

- **NOTF-01**: Email notification to originator on approval/rejection
- **NOTF-02**: Email notification for password resets
- **NOTF-03**: In-app notification center for approval events

### Enhanced Security

- **SEC-10**: Two-factor authentication (TOTP)
- **SEC-11**: IP allowlist for admin-only access
- **SEC-12**: Automated penetration testing in CI/CD

### Client Portal

- **PORTAL-01**: Customer-facing read-only portal for shipment tracking by job number
- **PORTAL-02**: Customer portal login (separate from staff login)

### Mobile

- **MOB-01**: Progressive Web App (PWA) manifest for mobile add-to-homescreen
- **MOB-02**: Mobile-optimized views for job status lookup

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time chat | Not a core logistics workflow; high complexity |
| Mobile native app (iOS/Android) | Web-first sufficient for internal staff |
| OAuth / social login | Username/password sufficient for closed internal tool |
| Video/image uploads beyond documents | Not needed for freight documentation |
| Public API / webhooks | Internal system only in v1 |
| Multi-company / multi-tenant | Single company deployment for Fame Logistics |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 2 — Authentication & RBAC | Complete |
| AUTH-02 | Phase 2 — Authentication & RBAC | Complete |
| AUTH-03 | Phase 2 — Authentication & RBAC | Complete |
| AUTH-04 | Phase 2 — Authentication & RBAC | Complete |
| AUTH-05 | Phase 2 — Authentication & RBAC | Complete |
| AUTH-06 | Phase 2 — Authentication & RBAC | Complete |
| AUTH-07 | Phase 2 — Authentication & RBAC | Complete |
| RBAC-01 | Phase 2 — Authentication & RBAC | Complete |
| RBAC-02 | Phase 2 — Authentication & RBAC | Complete |
| RBAC-03 | Phase 2 — Authentication & RBAC | Complete |
| RBAC-04 | Phase 2 — Authentication & RBAC | Complete |
| CUST-01 | Phase 4 — Customer Management | Pending |
| CUST-02 | Phase 4 — Customer Management | Pending |
| CUST-03 | Phase 4 — Customer Management | Pending |
| CUST-04 | Phase 4 — Customer Management | Pending |
| CUST-05 | Phase 4 — Customer Management | Pending |
| CUST-06 | Phase 4 — Customer Management | Pending |
| CUST-07 | Phase 4 — Customer Management | Pending |
| CUST-08 | Phase 4 — Customer Management | Pending |
| CUST-09 | Phase 4 — Customer Management | Pending |
| CUST-10 | Phase 4 — Customer Management | Pending |
| CUST-11 | Phase 4 — Customer Management | Pending |
| CUST-12 | Phase 4 — Customer Management | Pending |
| CUST-13 | Phase 4 — Customer Management | Pending |
| JOB-01 | Phase 5 — Job Management | Pending |
| JOB-02 | Phase 5 — Job Management | Pending |
| JOB-03 | Phase 5 — Job Management | Pending |
| JOB-04 | Phase 5 — Job Management | Pending |
| JOB-05 | Phase 5 — Job Management | Pending |
| JOB-06 | Phase 5 — Job Management | Pending |
| JOB-07 | Phase 5 — Job Management | Pending |
| JOB-08 | Phase 5 — Job Management | Pending |
| JOB-09 | Phase 5 — Job Management | Pending |
| JOB-10 | Phase 5 — Job Management | Pending |
| JOB-11 | Phase 5 — Job Management | Pending |
| APR-01 | Phase 6 — Approval Workflow | Pending |
| APR-02 | Phase 6 — Approval Workflow | Pending |
| APR-03 | Phase 6 — Approval Workflow | Pending |
| APR-04 | Phase 6 — Approval Workflow | Pending |
| APR-05 | Phase 6 — Approval Workflow | Pending |
| ACC-01 | Phase 7 — Accounts & Finance | Pending |
| ACC-02 | Phase 7 — Accounts & Finance | Pending |
| ACC-03 | Phase 7 — Accounts & Finance | Pending |
| ACC-04 | Phase 7 — Accounts & Finance | Pending |
| ACC-05 | Phase 7 — Accounts & Finance | Pending |
| RPT-01 | Phase 9 — Reports | Pending |
| RPT-02 | Phase 9 — Reports | Pending |
| RPT-03 | Phase 9 — Reports | Pending |
| RPT-04 | Phase 9 — Reports | Pending |
| RPT-05 | Phase 9 — Reports | Pending |
| DASH-01 | Phase 8 — Dashboard | Pending |
| DASH-02 | Phase 8 — Dashboard | Pending |
| DASH-03 | Phase 8 — Dashboard | Pending |
| ADMIN-01 | Phase 3 — Administration & Lookup Setup | Complete |
| ADMIN-02 | Phase 3 — Administration & Lookup Setup | Complete |
| ADMIN-03 | Phase 3 — Administration & Lookup Setup | Complete |
| SETUP-01 | Phase 3 — Administration & Lookup Setup | Complete |
| SETUP-02 | Phase 3 — Administration & Lookup Setup | Complete |
| SETUP-03 | Phase 3 — Administration & Lookup Setup | Complete |
| SETUP-04 | Phase 3 — Administration & Lookup Setup | Complete |
| SETUP-05 | Phase 3 — Administration & Lookup Setup | Complete |
| SEC-01 | Phase 10 — Security Hardening & Launch | Pending |
| SEC-02 | Phase 10 — Security Hardening & Launch | Pending |
| SEC-03 | Phase 10 — Security Hardening & Launch | Pending |
| SEC-04 | Phase 10 — Security Hardening & Launch | Pending |
| SEC-05 | Phase 10 — Security Hardening & Launch | Pending |
| SEC-06 | Phase 10 — Security Hardening & Launch | Pending |
| SEC-07 | Phase 10 — Security Hardening & Launch | Pending |
| SEC-08 | Phase 10 — Security Hardening & Launch | Pending |
| SEC-09 | Phase 10 — Security Hardening & Launch | Pending |
| PERF-01 | Phase 10 — Security Hardening & Launch | Pending |
| PERF-02 | Phase 10 — Security Hardening & Launch | Pending |

**Coverage:**
- v1 requirements: 72 total (note: original file stated 62; actual count from requirements list is 72)
- Mapped to phases: 72
- Unmapped: 0

**Phase 1 (Foundation) maps no functional requirements** — it is the infrastructure phase. All SEC/PERF non-functional requirements are consolidated in Phase 10 where they are verified and hardened for production.

---
*Requirements defined: 2026-04-04*
*Last updated: 2026-04-04 — Traceability updated to reflect ROADMAP.md phase structure (10 phases)*
