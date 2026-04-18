---
phase: 10-security-hardening-launch
plan: 05
subsystem: infra
tags: [railway, render, nginx, vercel, gunicorn, docker, postgresql, django, database-url]

# Dependency graph
requires:
  - phase: 10-01
    provides: Production security hardening in Django settings (DEBUG, ALLOWED_HOSTS, CORS, HSTS)
  - phase: 10-02
    provides: Security headers middleware and CSP configuration
provides:
  - DATABASE_URL parsing support in Django settings (stdlib only, no new deps)
  - DJANGO_RUN_MIGRATIONS_ON_START and DJANGO_RUN_COLLECTSTATIC_ON_START toggle vars
  - deploy/railway.toml for Railway PaaS deployment
  - deploy/render.yaml Blueprint for Render PaaS deployment
  - deploy/Procfile for Heroku-style web + worker processes
  - deploy/nginx.example.conf for VPS/Ubuntu with TLS, HSTS, security headers
  - frontend/vercel.json with Next.js security headers (HSTS, X-Frame-Options, etc.)
  - deploy/README.md with step-by-step guides for all three hosting options
affects: [10-06, 10-07, production-launch]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "DATABASE_URL pattern: stdlib urllib.parse for PaaS URL, POSTGRES_* fallback for Docker dev"
    - "Gunicorn start command: migrate + collectstatic + gunicorn in single shell command"
    - "Deploy configs co-located in deploy/ directory at repo root"

key-files:
  created:
    - deploy/railway.toml
    - deploy/render.yaml
    - deploy/Procfile
    - deploy/nginx.example.conf
    - deploy/README.md
    - frontend/vercel.json
  modified:
    - backend/config/settings.py

key-decisions:
  - "DATABASE_URL parsed with urllib.parse (stdlib) — no new dependency (dj-database-url not needed)"
  - "CONN_MAX_AGE=60 added for PaaS connections to reduce connection overhead"
  - "sslmode defaults to require for DATABASE_URL path — PaaS Postgres requires SSL"
  - "Railway recommended as default (lowest complexity) over Render or VPS"
  - "Vercel security headers applied to all routes via source: /(.*) pattern"

patterns-established:
  - "Deploy directory: all hosting configs co-located in deploy/ at repo root"
  - "PaaS start command pattern: migrate → collectstatic → gunicorn (inline, no entrypoint needed)"

# Metrics
duration: 4min
completed: 2026-04-18
---

# Phase 10 Plan 05: Production Infrastructure Summary

**DATABASE_URL support added to Django settings via stdlib urllib.parse; Railway/Render/Nginx/Vercel production configs created covering all three hosting paths with gunicorn, TLS, and security headers**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-18T15:14:20Z
- **Completed:** 2026-04-18T15:17:50Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- Django settings now parse `DATABASE_URL` (Railway/Render/Heroku pattern) using `urllib.parse` from stdlib — zero new dependencies added
- Production deploy configs cover all three hosting options: Railway (toml), Render (YAML blueprint), VPS (Nginx + Procfile)
- Frontend `vercel.json` adds HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, and Permissions-Policy to all routes
- `deploy/README.md` provides complete step-by-step instructions for each hosting path including customer seeding

## Task Commits

Each task was committed atomically:

1. **Task 1: Add DATABASE_URL support to Django settings** - `cecdee6` (feat)
2. **Task 2: Railway, Render, Procfile, Nginx, Vercel configs** - `08743f3` (feat)
3. **Task 3: Deploy README** - `bafe4f7` (docs)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `backend/config/settings.py` - Added DATABASE_URL parsing block (urllib.parse, no new deps) + 2 start-time toggle vars
- `deploy/railway.toml` - Railway Dockerfile build config with gunicorn start command and health check
- `deploy/render.yaml` - Render Blueprint: web service + Redis + Postgres 16, env var wiring
- `deploy/Procfile` - web (gunicorn) + worker (celery) for Heroku-style PaaS
- `deploy/nginx.example.conf` - TLS 1.2/1.3, HSTS preload, security headers, static file serving, proxy to gunicorn
- `deploy/README.md` - Step-by-step deploy guide for Railway, Render, VPS, and Vercel frontend
- `frontend/vercel.json` - Next.js Vercel config with 5 security response headers applied to all routes

## Decisions Made

- **DATABASE_URL via stdlib**: Used `urllib.parse` (Python stdlib) instead of `dj-database-url` to avoid a new dependency. Identical URL parsing behaviour.
- **CONN_MAX_AGE=60**: Added for PaaS path — persistent connections reduce per-request overhead on managed Postgres.
- **sslmode=require default**: PaaS providers enforce SSL on managed Postgres; `DATABASE_SSLMODE` env var allows override (e.g., `disable` for local testing with DATABASE_URL).
- **Railway as recommended default**: Lowest operational complexity (auto-injects DATABASE_URL and REDIS_URL, auto-detects railway.toml).
- **Vercel headers via `/(.*)`**: Applies security headers to every route including API calls, static assets, and pages.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required for the config files themselves. Actual deployment requires choosing a hosting provider and setting env vars (documented in `deploy/README.md`).

## Next Phase Readiness

- All three hosting paths have working configs ready to use
- Developer picks Railway vs Render vs VPS and follows `deploy/README.md`
- Blocker from 10-04 still pending: ApprovalHistory endpoint needs pagination before launch
- `deploy/README.md` post-deploy checklist references plan 10-07 for SSL Labs + Lighthouse verification

---
*Phase: 10-security-hardening-launch*
*Completed: 2026-04-18*

## Self-Check: PASSED
