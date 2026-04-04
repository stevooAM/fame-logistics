# Fame Freight Management System (FMS)

## What This Is

A modern, full-stack web application that digitizes the end-to-end operations of Fame Logistics — a Ghana-based international freight forwarding company. The system enables operations staff to manage customers, create and track freight shipments (import/export/transit), route jobs through an approval workflow, generate invoices, and produce operational and financial reports. It replaces the legacy ASP.NET/jQuery system at famelogistic.com with a secure, scalable rebuild using a modern stack.

## Core Value

Operations staff can create, track, and approve freight jobs end-to-end — from customer onboarding to invoice generation — with full audit trails and role-based access control.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Authentication & Security**
- [ ] Username/password login with JWT session management
- [ ] Role-based access control (Admin, Manager, Operations, Finance, Viewer) enforced server-side
- [ ] HTTPS-only, bcrypt password hashing, CSRF protection, audit logging of all CRUD actions

**Customer Module**
- [ ] Paginated, filterable customer master list (AG Grid, 20/page default)
- [ ] Add / Edit / Delete customers with inline or modal editing
- [ ] Customer fields: Company Name, Type (Company/Individual), Contact Person, Email, Phone, TIN, Address
- [ ] Seed database with 197 existing customer records from Excel export
- [ ] Link customers to their associated jobs

**Job Module**
- [ ] Create freight job linked to a customer (Import/Export/Transit/Local)
- [ ] Auto-generate unique job number on creation
- [ ] Full job detail view: Bill of Lading, Container No., Weight, Volume, Cargo Description, Cost
- [ ] Job status workflow: Draft → Pending → In Progress → Customs → Delivered → Closed
- [ ] Submit job to approval queue; job audit trail with timestamps

**Approval Module**
- [ ] Approval queue with badge counter on sidebar nav
- [ ] Approve / Reject actions with mandatory rejection reason
- [ ] Approval history viewable by admins

**Accounts Module**
- [ ] Generate and manage invoices linked to approved jobs
- [ ] Record payments against invoices; outstanding balance per customer
- [ ] Monthly/quarterly financial period summaries
- [ ] Export financial data to Excel

**Reports Module**
- [ ] Customer activity report (jobs per customer in date range)
- [ ] Job status report (by status, type, date range)
- [ ] Revenue report (income by period and customer)
- [ ] All reports exportable to PDF and Excel

**Administration & Setup**
- [ ] User management: create, edit, deactivate users; role assignment
- [ ] Audit log viewer (all user actions with user, timestamp, IP)
- [ ] Lookup tables: ports/locations, cargo types, currency config, document types
- [ ] Company profile configuration (name, logo, contact info)

**Dashboard**
- [ ] KPI overview: active jobs, pending approvals, outstanding invoices, recent activity

### Out of Scope

- Real-time chat between users — not a core logistics workflow need
- Mobile native app — web-first, responsive browser is sufficient
- OAuth / social login — username/password sufficient for internal staff tool
- Client-facing portal — system is for internal staff only (v1)
- Two-factor authentication — noted as enhancement, deferred to v2
- Video/image attachments beyond documents — not needed for freight docs

## Context

- **Source system**: famelogistic.com/DashBoard (live, ASP.NET MVC, built by EED Consult in 2022)
- **Current pain points**: HTTP-only (no HTTPS), no CSP, legacy jQuery/Bootstrap stack, shared hosting limitations
- **Existing data**: 197 customer records in Excel (from 267 total in live system); field structure confirmed from export
- **Geography**: Operations primarily in Ghana, West Africa; customers span Europe, Asia, Americas — hence international phone/TIN formats
- **Users**: Small internal team — freight ops staff, supervisors, finance, admin; estimated <50 users
- **Design system** (matching original): Primary teal `#1F7A8C`, accent amber `#F89C1C`, sidebar dark navy `#2B3E50`, background white `#FFFFFF`, text `#333333`

## Constraints

- **Tech Stack (Frontend)**: Next.js 14 App Router + TypeScript + Tailwind CSS + shadcn/ui + AG Grid Community (React) + React Hook Form + Zod + Zustand + Lucide React
- **Tech Stack (Backend)**: Django 5 + Python 3.12+ + Django REST Framework + djangorestframework-simplejwt + Celery + Redis
- **Database**: PostgreSQL 16 — must support 10,000+ customers, 50,000+ jobs without schema changes
- **Infrastructure**: Docker + Docker Compose; Vercel (frontend); Railway/Render or VPS (backend); Nginx reverse proxy; Let's Encrypt SSL; GitHub Actions CI/CD
- **File Storage**: Cloud storage (Cloudflare R2 or AWS S3) for document attachments — not local filesystem
- **Performance**: Page load <2s on 3G; customer list <1s with server-side pagination; filter response <500ms; 20+ concurrent users
- **Security**: HTTPS only, bcrypt/Argon2 hashing, CSRF tokens, parameterized queries only, XSS output encoding, rate limiting (10 failed logins/IP/15min), HttpOnly+Secure+SameSite cookies

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js 14 App Router (not Pages Router) | SSR for fast initial loads; modern DX; Vercel-native | — Pending |
| Django + DRF (not Node.js backend) | Batteries-included ORM; strong admin; familiar to Ghana dev ecosystem per PRD | — Pending |
| PostgreSQL over MySQL | Robust open-source; superior JSON support; better for complex reporting queries | — Pending |
| AG Grid Community (not DataTables) | Direct equivalent to original system; handles 267+ rows with filters/pagination natively | — Pending |
| Server-side pagination from day 1 | PRD explicit: must support 10K+ customers/50K+ jobs; client-side load-all would break | — Pending |
| Soft-delete customers (is_active flag) | Preserves referential integrity with historical jobs; audit safety | — Pending |
| JWT auth (not session-based) | Stateless; works across Next.js frontend + Django backend separation; refresh token rotation | — Pending |
| Seed DB from Excel export | 197 existing customers in fame_logistic_customers.xlsx must be migrated to PostgreSQL | — Pending |

---
*Last updated: 2026-04-04 after initialization from FameFMS_Technical_PRD.docx*
