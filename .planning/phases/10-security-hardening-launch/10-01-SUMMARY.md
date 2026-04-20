---
phase: 10-security-hardening-launch
plan: 01
subsystem: infra
tags: [django, security, https, hsts, cors, csrf, production-hardening]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Django settings.py baseline and docker-compose config
  - phase: 02-authentication-rbac
    provides: CookieJWTAuthentication and middleware stack
provides:
  - Production-safe Django settings (DEBUG=False default, HTTPS enforcement, HSTS, secure cookies)
  - Conditional Django admin registration gated by DJANGO_ADMIN_ENABLED env flag
  - Documented .env.example covering every production secret and flag
affects:
  - 10-security-hardening-launch (subsequent plans in this phase build on these defaults)
  - deployment (hosting config must supply DJANGO_ALLOWED_HOSTS, CSRF_TRUSTED_ORIGINS, CORS_ALLOWED_ORIGINS, DJANGO_SECRET_KEY)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Production guard: if not DEBUG block activates HTTPS/HSTS/cookie hardening"
    - "RuntimeError startup guard: insecure SECRET_KEY and missing CORS config abort launch"
    - "Conditional URL registration: admin path gated via getattr(settings, DJANGO_ADMIN_ENABLED)"

key-files:
  created: []
  modified:
    - backend/config/settings.py
    - backend/config/urls.py
    - .env.example

key-decisions:
  - "DEBUG defaults to False — opt-in for dev via DJANGO_DEBUG=True, never accidentally on in prod"
  - "ALLOWED_HOSTS empty-string default in prod; auto-filled to localhost/127.0.0.1/backend when DEBUG=True"
  - "CSRF_COOKIE_HTTPONLY=False — frontend must read CSRF token for DRF session auth"
  - "CORS_ALLOWED_ORIGINS guard raises RuntimeError (not silent failure) — prevents accidental open-CORS deploy"
  - "DJANGO_ADMIN_ENABLED defaults to True in dev, False in prod — explicit opt-in required for admin on prod"
  - "BrowsableAPIRenderer excluded from DRF DEFAULT_RENDERER_CLASSES in prod — reduces attack surface"

patterns-established:
  - "Startup guard pattern: raise RuntimeError() in settings.py blocks misconfigured prod launch"
  - "Env-or-default pattern: smart defaults safe for prod, convenience defaults for dev"

# Metrics
duration: 8min
completed: 2026-04-18
---

# Phase 10 Plan 01: Django Production Hardening Summary

**Production-safe Django settings with HTTPS/HSTS enforcement, secure cookies, CORS/CSRF guards, conditional admin, and documented .env.example — no dev workflow breakage.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-18T15:05:09Z
- **Completed:** 2026-04-18T15:13:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Django `DEBUG` default flipped to `False` — production is hardened by default, dev requires explicit opt-in
- Full HTTPS/HSTS block active when `DEBUG=False`: `SECURE_SSL_REDIRECT`, `SECURE_HSTS_SECONDS=31536000` with subdomains and preload, `SECURE_PROXY_SSL_HEADER`, secure session and CSRF cookies, `X_FRAME_OPTIONS=DENY`, `SECURE_REFERRER_POLICY`
- Startup RuntimeError guards block launch when `SECRET_KEY` is insecure default or `CORS_ALLOWED_ORIGINS` is unset in production
- DRF `BrowsableAPIRenderer` stripped from renderer classes when `DEBUG=False`
- Django admin conditionally registered via `DJANGO_ADMIN_ENABLED` env flag (default `False` in prod)
- `.env.example` expanded to document every production variable with inline guidance

## Task Commits

Each task was committed atomically:

1. **Task 1: Harden Django settings for production** - `20c084e` (feat)
2. **Task 2: Gate Django admin and update env example** - `5ce6054` (feat)

**Plan metadata:** (docs: complete plan — see below)

## Files Created/Modified

- `backend/config/settings.py` — Production hardening block, smart ALLOWED_HOSTS, CSRF_TRUSTED_ORIGINS, DJANGO_ADMIN_ENABLED, DRF renderer guard, CORS startup guard
- `backend/config/urls.py` — Conditional admin URL registration via `getattr(settings, "DJANGO_ADMIN_ENABLED", False)`
- `.env.example` — Comprehensive production-ready template with all secrets documented

## Decisions Made

- `DEBUG` defaults to `False` — production safety over dev convenience; dev must explicitly set `DJANGO_DEBUG=True`
- `ALLOWED_HOSTS` uses smart default: empty in prod (must be supplied), auto-filled for dev when not set
- `CSRF_COOKIE_HTTPONLY=False` — intentional; frontend JavaScript must read the CSRF token for DRF SessionAuth to work correctly
- `CORS_ALLOWED_ORIGINS` guard uses `RuntimeError` not a warning — silent misconfiguration is more dangerous than a hard startup failure
- `DJANGO_ADMIN_ENABLED` environment flag defaults to `True` when `DEBUG=True` (dev convenience) and `False` when `DEBUG=False` (prod safe default)
- `BrowsableAPIRenderer` removed in prod — reduces information exposure and attack surface area

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. The `.env.example` documents what operators must populate at deploy time.

## Next Phase Readiness

- Production hardening baseline complete; all SEC-01 and SEC-07 requirements satisfied
- Deployment environment must supply: `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS`, `CORS_ALLOWED_ORIGINS`
- Ready for next plan in Phase 10 (rate limiting, security headers middleware, or SSL Labs verification)

---
*Phase: 10-security-hardening-launch*
*Completed: 2026-04-18*

## Self-Check: PASSED
