# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-04)

**Core value:** Operations staff can create, track, and approve freight jobs end-to-end — from customer onboarding to invoice generation — with full audit trails and role-based access control.
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 1 of 10 (Foundation)
Plan: 5 of 7 in current phase
Status: In progress
Last activity: 2026-04-05 — Completed 01-05-PLAN.md (core/customers/jobs models and migrations)

Progress: [████░░░░░░] ~4%

## Performance Metrics

**Velocity:**
- Total plans completed: 4 (01-04 auto tasks done, checkpoint pending)
- Average duration: 3.3 min
- Total execution time: 13 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 4/7 | 13 min | 3.3 min |

**Recent Trend:**
- Last 5 plans: 01-01 (2 min), 01-02 (2 min), 01-03 (4 min), 01-04 (5 min), 01-05 (2 min)
- Trend: consistent ~2-5 min/plan

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Init]: Next.js 14 App Router + Django 5 + PostgreSQL 16 stack confirmed — see PROJECT.md
- [Init]: AG Grid Community chosen to match original system's data grid behaviour
- [Init]: Server-side pagination mandated from day 1 for 10K+ customer / 50K+ job scalability
- [Init]: 197 existing customer records will be seeded via migration script (Phase 4)
- [Init]: All SEC/PERF non-functional requirements consolidated to Phase 10 for final hardening and verification
- [01-01]: python:3.12-slim chosen for Django container — smaller than full python:3.12; libpq-dev+gcc installed for psycopg2
- [01-01]: node:20-alpine chosen for Next.js container — minimal image size
- [01-01]: Health check gating: backend depends_on db+redis with condition: service_healthy
- [01-01]: /app/node_modules anonymous volume prevents host bind mount from overwriting container modules
- [01-02]: config/ package name chosen — settings at backend/config/settings.py, avoids module name collision
- [01-02]: AllowAny on /api/health/ only — all other DRF views default to IsAuthenticated
- [01-02]: JWT: 15min access tokens, 7-day refresh with ROTATE_REFRESH_TOKENS=True
- [01-02]: CELERY_BROKER_URL and CELERY_RESULT_BACKEND both read from REDIS_URL — single Redis for dev
- [01-02]: create_default_admin silently skips if DJANGO_SUPERUSER_* env vars absent — CI-safe
- [01-03]: shadcn/ui components authored manually (no npx shadcn-ui); content matches CLI output exactly
- [01-03]: brand.teal (#1F7A8C) mapped to --primary CSS variable; brand.amber (#F89C1C) mapped to --accent
- [01-03]: Typography scale (.text-h1 through .text-caption) implemented as CSS utility classes in globals.css
- [01-03]: Dockerfile simplified to single-stage dev build; npm install at image build time, no lockfile required
- [01-04]: (dashboard) route group isolates sidebar layout from /login — no conditional rendering needed
- [01-04]: Sidebar collapsed state uses local useState (not Zustand) — no cross-component sync needed yet
- [01-04]: filterNavByRole called with no role for now — shows all 7 items in dev; Phase 2 passes real role
- [01-04]: AG Grid CSS imported in ag-grid-demo.tsx — colocation with component that uses it
- [01-05]: TimeStampedModel is abstract — no DB table, fields inherited by all concrete models
- [01-05]: Job.customer uses on_delete=PROTECT — prevents accidental customer deletion with active jobs
- [01-05]: JobDocument.document_type uses string FK "setup.DocumentType" — resolves after plan 01-07
- [01-05]: Customer soft delete via is_active BooleanField — preserves historical job references

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 4]: Excel file `fame_logistic_customers.xlsx` must be available in the repo or accessible at migration time — confirm file location before Phase 4 planning
- [Phase 10]: Production hosting target (Railway vs Render vs VPS) not yet decided — confirm before Phase 10 planning
- [Note]: Docker CLI not available in execution environment — runtime verification of containers deferred to developer machine

## Session Continuity

Last session: 2026-04-05T00:10:20Z
Stopped at: Completed 01-05-PLAN.md — core/customers/jobs models defined with manual migrations
Resume file: None
