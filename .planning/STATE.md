# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-04)

**Core value:** Operations staff can create, track, and approve freight jobs end-to-end — from customer onboarding to invoice generation — with full audit trails and role-based access control.
**Current focus:** Phase 4 — Customer Management

## Current Position

Phase: 4 of 10 (Customer Management)
Plan: 0 of 7 in current phase
Status: Phase 3 complete — ready to plan Phase 4
Last activity: 2026-04-06 — Completed Phase 3 (Administration & Lookup Setup), all 7 plans verified

Progress: [███░░░░░░░] ~40% (22/~57 plans estimated complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 9
- Average duration: ~3 min
- Total execution time: ~23 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 7/7 | ~21 min | ~3 min |
| 02-authentication-rbac | 6/7 | ~4 min | ~1 min |

*Updated after each plan completion*

## Accumulated Context

### Decisions

- [Init]: Next.js 14 App Router + Django 5 + PostgreSQL 16 stack confirmed
- [Init]: AG Grid Community chosen to match original system's data grid behaviour
- [Init]: Server-side pagination mandated from day 1 for 10K+ customer / 50K+ job scalability
- [Init]: 197 existing customer records will be seeded via migration script (Phase 4)
- [Init]: All SEC/PERF non-functional requirements consolidated to Phase 10
- [01-01]: python:3.12-slim Django container, node:20-alpine Next.js container
- [01-01]: Health check gating: backend depends_on db+redis with condition: service_healthy
- [01-02]: Django config/ package pattern; DRF + SimpleJWT + Celery configured
- [01-03]: Next.js 14 App Router; shadcn/ui components created manually (npx unavailable in exec env)
- [01-04]: Login page uses React Hook Form + Zod (stubbed — Phase 2 wires to auth API)
- [01-04]: Sidebar filterNavByRole() stubbed — Phase 2 activates with real user roles
- [01-05]: All 6 migration files created manually (Docker CLI not available in execution environment)
- [01-06]: Vercel setup deferred by user — can connect at any time via vercel.com/new
- [Phase 1 fix]: docker-compose.yml healthcheck blocks added to backend and frontend services post-verification
- [02-01]: Role model locked to 3 roles: Admin, Operations, Finance (Manager/Viewer removed permanently)
- [02-01]: BCryptSHA256PasswordHasher set as primary hasher; existing PBKDF2 hashes auto-upgrade on next login
- [02-01]: JWT access token carries role/username/email/full_name/is_force_password_change claims — token structure final
- [02-01]: TOKEN_OBTAIN_SERIALIZER global override used instead of per-view override for consistency
- [02-02]: Role checked from UserProfile.role.name (database), not JWT claims — RBAC-02 server-side enforcement
- [02-02]: Non-Admin X-Impersonate-User requests silently ignored — no capability disclosure
- [02-02]: ImpersonationMiddleware positioned after AuthenticationMiddleware in MIDDLEWARE stack
- [02-03]: CookieJWTAuthentication replaces header-based JWTAuthentication — all DRF views now read JWT from HttpOnly cookie
- [02-03]: LoginRateLimitMiddleware positioned after ImpersonationMiddleware — 10 failed attempts/IP/15min → 429
- [02-03]: RefreshView performs full refresh token rotation (blacklists old, issues new)
- [02-03]: PasswordResetToken model uses UUID token field with 1-hour TTL for self-service reset
- [02-04]: apiFetch<T> is the standard frontend client — all feature modules must use it
- [02-04]: login() uses raw fetch (not apiFetch) to avoid 401-retry on wrong credentials
- [02-04]: rememberMe sends X-Remember-Me: true header; backend honours with 7-day TTL
- [02-05]: Activity throttled to 30s intervals in useIdleTimeout — avoids timer churn during active use
- [02-05]: SessionWarningDialog blocks Escape/backdrop — user must explicitly choose Stay or Logout
- [02-05]: setupTokenRefresh interval is 13 min (proactive refresh before 15-min access token expiry)
- [02-06]: UserProfile.role is {id, name} object — role comparisons use user.role.name.toLowerCase()
- [02-06]: middleware.ts cookie name is access_token — must stay in sync with backend cookie name
- [02-06]: AuthProvider loading spinner shown before routing guard — prevents dashboard flash
- [02-06]: Sidebar role comparisons: filterNavByRole(navItems, lowercasedRole)
- [03-01]: ChangePasswordSerializer validates current_password via serializer context request — keeps view thin
- [03-01]: change-password URL must precede <int:pk> pattern in urls.py — Django top-down URL resolution
- [03-01]: Deactivation blacklists all OutstandingToken rows via get_or_create(BlacklistedToken) — immediate session invalidation
- [03-01]: UserListSerializer sources is_active from user.is_active (Django User), not UserProfile.is_active
- [03-06]: CargoType.code and DocumentType.code are null=True unique — blank="" would violate UNIQUE; NULL values are exempt
- [03-06]: Lookup soft-delete returns HTTP 200 with updated object (not 204) for frontend list-state update without re-fetch
- [03-06]: LookupDropdownView uses IsAnyRole — all staff roles need dropdown values to populate form fields
- [03-06]: AuditLog logged inline via AuditLog.objects.create() in setup/views.py (AuditLogMixin from 03-03 not yet available)
- [03-03]: AuditLogMixin.perform_destroy() inlines AuditLog.objects.create() — instance.pk becomes None after deletion so the helper can't use the model instance
- [03-03]: date_to filter adds timedelta(days=1) and uses timestamp__lt for inclusive end-of-day matching
- [03-03]: Malformed date filter params are silently ignored — returns unfiltered results rather than 400 error

### Pending Todos

None.

### Blockers/Concerns

- [Phase 4]: Excel file `fame_logistic_customers.xlsx` must be available at migration time — confirm location before Phase 4 planning
- [Phase 10]: Production hosting target (Railway vs Render vs VPS) not yet decided
- [Note]: Docker CLI not available in execution environment — runtime container verification deferred to developer machine
- [Note]: Vercel integration not yet connected — deferred by user

## Session Continuity

Last session: 2026-04-06
Stopped at: Completed Phase 3 — all 7 plans executed, verified, approved
Resume file: None
