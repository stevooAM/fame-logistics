# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-04)

**Core value:** Operations staff can create, track, and approve freight jobs end-to-end — from customer onboarding to invoice generation — with full audit trails and role-based access control.
**Current focus:** Phase 5 — Job Management

## Current Position

Phase: 5 of 10 (Job Management)
Plan: 5 of 6 in current phase (05-01, 05-02, 05-03, 05-04, 05-05 complete)
Status: In progress
Last activity: 2026-04-11 — Completed 05-05 (Job Form Dialog)

Progress: [█████░░░░░] ~60% (36/~57 plans estimated complete)

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
- [04-01]: TIN field is required (blank=False) — locked user decision; legacy data seeding must use placeholder strategy for rows without TIN
- [04-01]: business_type is free-text CharField (not choices) — CONTEXT uses "e.g." implying open-ended categories
- [04-01]: Customer FKs to setup.Port and setup.Currency use SET_NULL, null=True, blank=True — preserves customer record if lookup deleted
- [04-01]: Migration 0002 depends on setup.0002_add_sort_order_and_code_fields (latest setup migration)
- [04-02]: check-tin searches ALL customers (including is_active=False) to prevent TIN re-use on deactivated records
- [04-02]: invalid exclude_id in check-tin is silently ignored — consistent with malformed-param defensive pattern from 03-03
- [04-02]: destroy() calls _log_action directly (not perform_destroy) — soft-delete does not remove the row so AuditLogMixin.perform_destroy would be misleading
- [04-03]: Rows without TIN use placeholder "__NO_TIN__{company_name}"[:50] to satisfy Customer.tin blank=False — update_or_create keyed on company_name for these rows
- [04-03]: preferred_port and currency_preference excluded from seed command — FK fields populated manually in new system only
- [04-05]: TIN check network failure is non-blocking — form proceeds to save; backend enforces uniqueness as authoritative check
- [04-05]: FieldGroup helper component established as reusable section divider pattern for all future forms
- [04-05]: inputStyle() helper used over shadcn Input for fine-grained teal focus ring control in Naval Ledger forms
- [04-07]: apiFetchBlob is the standard blob-download client — same auth/refresh/redirect pattern as apiFetch but returns Blob
- [04-07]: Export action reuses get_queryset() unchanged — guarantees identical filter semantics to list endpoint
- [04-07]: No audit log on export — read-only operation; logging exports would pollute the audit trail
- [04-07]: Custom export dropdown built with fixed-inset overlay (shadcn DropdownMenu not available in project)
- [04-08]: entrypoint.sh uses #!/bin/sh (not bash) — python:3.12-slim base has sh, not bash
- [04-08]: exec runserver replaces shell process — PID 1 receives SIGTERM correctly
- [04-08]: seed_customers exits 0 on missing Excel file — set -e does not abort startup when file absent
- [04-08]: chmod +x applied inside Dockerfile RUN step — host filesystem execute bit not required
- [05-01]: generate_job_number() is module-level (not classmethod) to avoid forward-reference issues; uses select_for_update() for race-safe concurrent creation
- [05-01]: Job.save() checks both not self.pk and not self.job_number — allows explicit job number override in bulk imports
- [05-01]: FMS-{YEAR}-{SEQUENCE:05d} is the canonical job number format for all creation paths
- [05-02]: Cached _s3_client at module level — boto3 client construction is not free per-call
- [05-02]: delete_document logs errors without raising — deletion failure must never block a job record update
- [05-02]: upload_document returns storage key (not URL) — presigned URLs generated on demand via get_presigned_url
- [05-02]: AWS_S3_ENDPOINT_URL passed as None when blank — empty string would break boto3 client init; or None guard used
- [05-03]: perform_create bypasses AuditLogMixin.perform_create — calls serializer.save(created_by=...) directly to avoid double audit log while still creating JobAuditTrail CREATED entry
- [05-03]: delete_document returns 204 No Content — no response body for document deletion
- [05-03]: list_documents injects presigned_url per-document post-serialization; StorageError yields None (non-fatal)
- [05-03]: Admin-only reversal check reads request.user.profile.role.name from DB — upholds RBAC-02, no JWT claim trust
- [05-04]: customer_name typed as string | null in Job interface — matches actual 05-03 API serializer (linter-corrected)
- [05-04]: AbortController used in JobTable fetch — cancels stale in-flight requests when filters change rapidly
- [05-04]: View/Edit buttons (not kebab menu) for job row actions — plan preference for simpler UI confirmed
- [05-04]: StatusBadge is reusable — import from jobs/components/StatusBadge for job detail and form pages
- [05-05]: CustomerPicker uses Controller from react-hook-form to integrate custom onChange while keeping RHF validation flow
- [05-05]: DRF field errors mapped via fieldMap + setError for per-field inline display; fallback to apiError banner if no field keys match
- [05-05]: assigned_to uses simple select from /api/users/?page_size=100 — staff roster is small, no picker needed
- [05-05]: weight_kg, volume_cbm, total_cost stored as strings in Zod schema with refine() for parseFloat validation; parseFloat() applied on submit

### Pending Todos

None.

### Blockers/Concerns

- [Phase 4]: Excel file `fame_logistic_customers.xlsx` must be available at migration time — confirm location before Phase 4 planning
- [Phase 10]: Production hosting target (Railway vs Render vs VPS) not yet decided
- [Note]: Docker CLI not available in execution environment — runtime container verification deferred to developer machine
- [Note]: Vercel integration not yet connected — deferred by user

## Session Continuity

Last session: 2026-04-11T04:05:23Z
Stopped at: Completed 05-05-PLAN.md (Job Form Dialog)
Resume file: None
