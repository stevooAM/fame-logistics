---
phase: "04"
plan: "08"
name: "Docker Entrypoint Wiring"
subsystem: "infrastructure"
one-liner: "Shell entrypoint runs migrate + seed_customers + runserver on every container start"
tags: ["docker", "entrypoint", "seed", "migrations", "deployment"]

dependency-graph:
  requires:
    - "04-03"  # seed_customers management command
  provides:
    - "Automated database migration on container start"
    - "Automated customer seeding on container start"
    - "Gitignored data/ directory for Excel placement"
  affects:
    - "All future phases — container startup is now fully automated"

tech-stack:
  added: []
  patterns:
    - "Shell ENTRYPOINT pattern: set -e + migrate + seed + exec server"
    - "Gitkeep placeholder for tracked-but-contents-ignored directories"

key-files:
  created:
    - "backend/entrypoint.sh"
    - "backend/data/.gitkeep"
    - "backend/data/README.md"
  modified:
    - "backend/Dockerfile"
    - "docker-compose.yml"
    - ".gitignore"

decisions:
  - "[04-08]: entrypoint.sh uses #!/bin/sh (not bash) — python:3.12-slim base has sh, not bash"
  - "[04-08]: exec runserver replaces shell process — PID 1 receives SIGTERM correctly"
  - "[04-08]: seed_customers exits 0 on missing Excel file — set -e does not abort startup when file absent"
  - "[04-08]: chmod +x applied inside Dockerfile RUN step — host filesystem execute bit not required"

metrics:
  duration: "~2 min"
  completed: "2026-04-10"
  tasks_completed: 2
  tasks_total: 2
---

# Phase 04 Plan 08: Docker Entrypoint Wiring Summary

Shell entrypoint runs migrate + seed_customers + runserver on every container start.

## What Was Built

The seed_customers management command (04-03) was not invoked at container startup. This plan closes that gap by introducing a shell entrypoint script that orchestrates the full startup sequence: run migrations, seed customers from Excel if available, then exec the Django development server.

## Task Commits

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Create entrypoint.sh and wire into Dockerfile | 6a84192 | backend/entrypoint.sh, backend/Dockerfile |
| 2 | Update docker-compose.yml and protect Excel data | f2c7883 | docker-compose.yml, backend/data/.gitkeep, backend/data/README.md, .gitignore |

## Decisions Made

- `#!/bin/sh` used (not bash) — python:3.12-slim only ships sh
- `exec python manage.py runserver` replaces the shell process so PID 1 receives SIGTERM correctly
- `set -e` is safe here because seed_customers already exits 0 when the Excel file is absent — a missing file does not abort startup
- `chmod +x` is applied inside the Dockerfile RUN step; the host filesystem execute bit is not required and the local `test -x` check returns false as expected

## Verification Results

1. `ENTRYPOINT ["/entrypoint.sh"]` present in Dockerfile — confirmed
2. `CMD` line count in Dockerfile: 0 — confirmed
3. `command:` override in backend docker-compose service: 0 — confirmed
4. `backend/data/.gitkeep` and `backend/data/README.md` present — confirmed
5. `backend/data/*.xlsx` gitignore pattern present — confirmed
6. `chmod +x /entrypoint.sh` line in Dockerfile — confirmed

## Deviations from Plan

None — plan executed exactly as written.

## Next Phase Readiness

- Placing `fame_logistic_customers.xlsx` in `backend/data/` before `docker compose up` is now sufficient to seed all 197 customers automatically
- No blockers for remaining phases
- Phase 4 success criterion #5 (197 customer records on first deploy) is now satisfiable via data file placement

## Self-Check: PASSED
