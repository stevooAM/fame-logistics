---
phase: 01-foundation
plan: "01"
subsystem: infra
tags: [docker, docker-compose, postgresql, redis, django, nextjs, monorepo]

# Dependency graph
requires: []
provides:
  - Monorepo root structure with backend/ and frontend/ directories
  - docker-compose.yml orchestrating PostgreSQL 16, Redis 7, Django, Next.js containers
  - Root .env.example documenting all environment variables
  - backend/Dockerfile using python:3.12-slim
  - frontend/Dockerfile using node:20-alpine
  - .gitignore covering Python, Node, env, IDE, OS, and Docker artifacts
affects:
  - 01-02 (Django project bootstraps into backend/)
  - 01-03 (Next.js project bootstraps into frontend/)
  - All subsequent plans (depend on monorepo layout and Docker services)

# Tech tracking
tech-stack:
  added:
    - postgres:16-alpine (PostgreSQL 16 via Docker)
    - redis:7-alpine (Redis 7 via Docker)
    - python:3.12-slim (Django container base)
    - node:20-alpine (Next.js container base)
    - django>=5.0
    - djangorestframework
    - djangorestframework-simplejwt
    - psycopg2-binary
    - celery[redis]
    - django-cors-headers
    - python-dotenv
    - ruff
    - pytest-django
    - gunicorn
  patterns:
    - Monorepo layout: backend/ and frontend/ as top-level peers
    - docker-compose.yml at root orchestrates all services
    - .env at root loaded by all services via env_file directive
    - Health checks on db and redis before backend starts (depends_on condition: service_healthy)
    - Volume mount ./backend:/app enables hot-reload without rebuild

key-files:
  created:
    - docker-compose.yml
    - .gitignore
    - .env.example
    - backend/Dockerfile
    - backend/requirements.txt
    - backend/.env.example
    - frontend/Dockerfile
    - frontend/package.json
    - frontend/.env.example
  modified: []

key-decisions:
  - "python:3.12-slim chosen as Django base image for smaller footprint with explicit psycopg2 system dep install"
  - "node:20-alpine chosen as Next.js base for minimal image size"
  - "Health checks on db and redis gates backend startup to prevent connection errors at boot"
  - "postgres_data named volume persists DB data across container restarts"
  - "/app/node_modules anonymous volume prevents host node_modules overriding container's installed modules"

patterns-established:
  - "Service health checks: db and redis have pg_isready and redis-cli ping checks; backend waits via condition: service_healthy"
  - "Env var layering: root .env.example documents all vars; backend and frontend each have their own .env.example scoped to their needs"
  - "Volume mounting: source code mounted as volume (./backend:/app) enabling live reload in dev"

# Metrics
duration: 2min
completed: 2026-04-04
---

# Phase 1 Plan 1: Monorepo Foundation Summary

**Docker Compose monorepo with postgres:16, redis:7, python:3.12-slim, and node:20-alpine containers wired with health-check-gated startup and shared .env convention**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-04T23:41:18Z
- **Completed:** 2026-04-04T23:43:12Z
- **Tasks:** 2
- **Files modified:** 9 created

## Accomplishments

- Monorepo root structure with backend/ and frontend/ directories created
- docker-compose.yml defines all 4 services with health checks and proper dependency ordering
- Environment variable convention established: root .env.example documents every variable needed by all services
- Backend Dockerfile with psycopg2 system deps and frontend Dockerfile with node:20-alpine ready for Plans 02 and 03

## Task Commits

Each task was committed atomically:

1. **Task 1: Monorepo structure and environment config** - `07b5c34` (chore)
2. **Task 2: Docker Compose and Dockerfiles** - `b00aa83` (chore)

**Plan metadata:** (pending docs commit)

## Files Created/Modified

- `docker-compose.yml` - Orchestrates db, redis, backend, frontend with health checks and volume mounts
- `.gitignore` - Covers Python, Node, .env, IDE, OS, and docker-compose.override.yml
- `.env.example` - Root env var template for all 4 services
- `backend/Dockerfile` - python:3.12-slim with libpq-dev/gcc for psycopg2, exposes 8000
- `backend/requirements.txt` - Django 5, DRF, simplejwt, celery, psycopg2-binary, ruff, pytest-django, gunicorn
- `backend/.env.example` - Backend-scoped env vars (DB, Redis, Django settings)
- `frontend/Dockerfile` - node:20-alpine, npm install, exposes 3000
- `frontend/package.json` - Placeholder with name, version, and npm run dev script
- `frontend/.env.example` - NEXT_PUBLIC_API_URL

## Decisions Made

- Used `python:3.12-slim` over `python:3.12` for smaller image; explicitly installed `libpq-dev gcc` for psycopg2 compilation
- `node:20-alpine` over `node:20` for minimal image size
- PostgreSQL and Redis both have healthchecks; backend's `depends_on` uses `condition: service_healthy` to gate startup
- `/app/node_modules` anonymous volume in frontend service prevents host bind mount from wiping container's installed modules

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Docker CLI is not installed in the execution environment. Structural validation of docker-compose.yml was performed using Python's yaml parsing to confirm all 4 services, build contexts, healthchecks, and volumes are correctly defined. Runtime verification (docker compose config, docker compose up db redis -d) will be confirmed when Docker is available on the developer machine.

## User Setup Required

None - no external service configuration required.

To run the infrastructure locally:
1. Ensure Docker Desktop is installed
2. `cp .env.example .env` (already done — .env exists)
3. `docker compose up db redis -d` to start PostgreSQL 16 and Redis 7
4. Verify with `docker compose ps` — both should show as healthy

## Next Phase Readiness

- Monorepo structure ready for Plan 02 (Django project bootstrap into backend/)
- Monorepo structure ready for Plan 03 (Next.js project bootstrap into frontend/)
- All environment variables documented and .env seeded from .env.example
- No blockers for next plans

---
*Phase: 01-foundation*
*Completed: 2026-04-04*

## Self-Check: PASSED
