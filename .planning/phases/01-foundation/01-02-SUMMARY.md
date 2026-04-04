---
phase: 01-foundation
plan: 02
subsystem: api
tags: [django, drf, celery, redis, jwt, cors, postgresql, pytest]

# Dependency graph
requires:
  - phase: 01-01
    provides: monorepo structure, Docker Compose, backend Dockerfile and requirements.txt stub
provides:
  - Django 5 project with config package (settings, urls, wsgi, asgi, celery)
  - DRF configured with JWT authentication and page-number pagination
  - Celery app wired to Redis broker via REDIS_URL env var
  - Health-check endpoint at /api/health/ (AllowAny, returns DB+Redis status)
  - create_default_admin management command reading from env vars
  - pytest.ini for Django-aware test discovery
affects:
  - 01-03 (Next.js frontend will call /api/health/ to verify backend)
  - 01-04 (database migrations depend on DATABASES config in settings.py)
  - 01-05 (models.py stub in core app ready for population)
  - all backend plans (DRF REST_FRAMEWORK config is the base for all API views)

# Tech tracking
tech-stack:
  added:
    - django>=5.0,<6.0
    - djangorestframework>=3.15,<4.0
    - djangorestframework-simplejwt>=5.3,<6.0
    - django-cors-headers>=4.3,<5.0
    - celery[redis]>=5.3,<6.0
    - redis>=5.0,<6.0
    - psycopg2-binary>=2.9,<3.0
    - python-dotenv>=1.0,<2.0
    - gunicorn>=21.2,<23.0
    - pytest>=8.0,<9.0
    - pytest-django>=4.8,<5.0
    - ruff>=0.4,<1.0
  patterns:
    - Django config package pattern (settings at config/settings.py, not project root)
    - Celery app created in config/celery.py, imported into config/__init__.py for worker discovery
    - Health check with AllowAny permission — only public endpoint in the API
    - Management command pattern for bootstrapping env-driven superuser

key-files:
  created:
    - backend/manage.py
    - backend/config/__init__.py
    - backend/config/settings.py
    - backend/config/urls.py
    - backend/config/wsgi.py
    - backend/config/asgi.py
    - backend/config/celery.py
    - backend/core/__init__.py
    - backend/core/apps.py
    - backend/core/views.py
    - backend/core/urls.py
    - backend/core/tests.py
    - backend/core/models.py
    - backend/core/management/__init__.py
    - backend/core/management/commands/__init__.py
    - backend/core/management/commands/create_default_admin.py
    - backend/pytest.ini
  modified:
    - backend/requirements.txt (pinned version ranges added)
    - backend/Dockerfile (--no-install-recommends added, WORKDIR moved before RUN)

key-decisions:
  - "config/ package name chosen over project_name/ — settings at backend/config/settings.py avoids naming collision with app modules"
  - "Health check uses AllowAny — the only unauthenticated endpoint; all others default to IsAuthenticated"
  - "ACCESS_TOKEN_LIFETIME=15min, REFRESH_TOKEN_LIFETIME=7d with ROTATE_REFRESH_TOKENS=True"
  - "CELERY_BROKER_URL and CELERY_RESULT_BACKEND both read from REDIS_URL env var"
  - "create_default_admin silently skips if env vars are absent — safe for dev and CI"

patterns-established:
  - "AllowAny pattern: decorate monitoring/public endpoints with @permission_classes([AllowAny])"
  - "Env-var bootstrap pattern: management commands read DJANGO_SUPERUSER_* env vars for idempotent admin creation"
  - "Config namespace pattern: all Celery settings prefixed CELERY_ so app.config_from_object works cleanly"

# Metrics
duration: 2min
completed: 2026-04-04
---

# Phase 1 Plan 02: Django Backend Setup Summary

**Django 5 project with DRF+JWT auth, Celery/Redis async tasks, /api/health/ endpoint, and env-driven admin bootstrap command**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-04T23:46:28Z
- **Completed:** 2026-04-04T23:48:40Z
- **Tasks:** 2
- **Files modified:** 18

## Accomplishments

- Django 5 project initialized with `config` package pattern — settings, URLs, WSGI, ASGI, and Celery all in `backend/config/`
- DRF configured with JWT authentication (SimpleJWT), CORS headers, and server-side pagination (PAGE_SIZE=20)
- Celery app wired to Redis broker via `REDIS_URL` env var with autodiscover_tasks enabled
- `/api/health/` endpoint returning JSON with service name, version, and live DB+Redis connectivity status
- `create_default_admin` management command creates a superuser from `DJANGO_SUPERUSER_*` env vars, idempotent on re-run
- pytest.ini configured for `DJANGO_SETTINGS_MODULE` — tests runnable via `pytest` in `backend/`

## Task Commits

Each task was committed atomically:

1. **Task 1: Django project and core configuration** - `b6fff16` (feat)
2. **Task 2: Core app with health-check and admin bootstrap** - `c16a015` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified

- `backend/manage.py` - Entry point with dotenv load before Django setup
- `backend/config/__init__.py` - Imports Celery app for worker autodiscovery
- `backend/config/settings.py` - All Django settings: DRF, JWT, CORS, Celery, Database
- `backend/config/celery.py` - Celery app instance, config from Django settings namespace
- `backend/config/urls.py` - Root URL config: admin, core API, JWT token endpoints
- `backend/config/wsgi.py` - WSGI application entry
- `backend/config/asgi.py` - ASGI application entry
- `backend/core/views.py` - health_check view with DB+Redis probe
- `backend/core/urls.py` - URL pattern for /health/
- `backend/core/management/commands/create_default_admin.py` - Superuser bootstrap command
- `backend/core/tests.py` - Smoke tests for health endpoint and admin command
- `backend/requirements.txt` - Pinned version ranges for all dependencies
- `backend/pytest.ini` - Django test settings configuration

## Decisions Made

- `config/` package name chosen over a project-named directory — avoids naming collision with app modules and keeps settings at a predictable path
- `AllowAny` permission on health check only — all other DRF views inherit `IsAuthenticated` as default
- `ACCESS_TOKEN_LIFETIME=15min` with `REFRESH_TOKEN_LIFETIME=7d` and `ROTATE_REFRESH_TOKENS=True` — short-lived access tokens with rolling refresh
- `CELERY_BROKER_URL` and `CELERY_RESULT_BACKEND` both point to `REDIS_URL` env var — single Redis instance for broker and results in dev
- `create_default_admin` skips silently if env vars absent — safe for CI environments without DJANGO_SUPERUSER_* set

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. Docker Compose from Plan 01-01 provides all services (db, redis, backend).

## Next Phase Readiness

- Django backend is fully configured and ready for Plan 01-03 (Next.js frontend scaffolding)
- All URL patterns, DRF config, and auth endpoints in place for subsequent API plans
- `core/models.py` placeholder ready for Plan 01-05 (domain models)
- No blockers for Phase 1 continuation

---
*Phase: 01-foundation*
*Completed: 2026-04-04*

## Self-Check: PASSED
