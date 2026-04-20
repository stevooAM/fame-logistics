---
phase: 05-job-management
plan: 02
subsystem: infra
tags: [boto3, s3, cloudflare-r2, cloud-storage, django-settings, docker]

# Dependency graph
requires:
  - phase: 05-job-management/05-01
    provides: jobs app scaffold and Job model foundation
provides:
  - boto3 dependency in requirements.txt
  - AWS/R2 settings block in Django config with env-var fallbacks
  - jobs/storage.py with upload_document, delete_document, get_presigned_url, StorageError
  - Docker Compose env var pass-through for AWS credentials
affects:
  - 05-03 (Job API — document attachment upload endpoint)
  - 05-04 and later plans that handle document download/delete

# Tech tracking
tech-stack:
  added: [boto3>=1.34]
  patterns:
    - "Cloud storage access via module-level cached boto3 client"
    - "StorageError wraps botocore exceptions — callers never see boto3-specific types"
    - "Graceful degradation: missing AWS_ACCESS_KEY_ID emits a warning, does not crash app"

key-files:
  created:
    - backend/jobs/storage.py
  modified:
    - backend/requirements.txt
    - backend/config/settings.py
    - docker-compose.yml

key-decisions:
  - "Cached _s3_client at module level — boto3 client creation is not free; one client per process"
  - "delete_document logs errors without raising — deletion failure must never block a job record update"
  - "get_presigned_url uses settings.AWS_PRESIGNED_URL_EXPIRY as default (3600 s) — presigned URL lifetime is configurable via env"
  - "AWS_S3_ENDPOINT_URL passed as None when blank — boto3 routes to AWS S3 by default; setting to '' would break client init"

patterns-established:
  - "StorageError pattern: all callers catch StorageError, never botocore exceptions directly"
  - "Storage key is returned from upload_document (not a URL) — presigned URLs are generated on demand"

# Metrics
duration: 2min
completed: 2026-04-11
---

# Phase 5 Plan 02: Cloud Storage Integration Summary

**boto3 S3/R2 utility layer for job document attachments — upload, delete, and presigned URL generation with graceful credential-missing degradation**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-11T03:50:35Z
- **Completed:** 2026-04-11T03:52:43Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Added boto3 dependency and full AWS_* settings block to Django config, all driven by environment variables with sensible defaults
- Created `jobs/storage.py` — self-contained storage utility providing `upload_document`, `delete_document`, `get_presigned_url`, and `StorageError`
- Wired AWS credentials into docker-compose.yml with empty-string defaults so the stack starts cleanly without R2 credentials in development

## Task Commits

Each task was committed atomically:

1. **Task 1: Add boto3 dependency and AWS settings** - `72be33a` (chore)
2. **Task 2: Create cloud storage utility module** - `06da11d` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `backend/jobs/storage.py` - Upload, delete, presigned URL helpers + StorageError
- `backend/requirements.txt` - Added boto3>=1.34,<2.0
- `backend/config/settings.py` - AWS_* settings block with env var fallbacks
- `docker-compose.yml` - AWS env var pass-through to backend service

## Decisions Made

- **Cached S3 client:** `_get_s3_client()` caches at module level — boto3 client construction involves DNS resolution and is not free per-call.
- **delete_document is non-raising:** Deletion failure should never abort a job record update; errors are logged only.
- **Key, not URL, returned from upload:** Presigned URLs are short-lived; callers generate them on demand via `get_presigned_url`.
- **`endpoint_url=None` when blank:** Passing an empty string to boto3 endpoint_url causes a client error; the `or None` guard routes to AWS S3 when no custom endpoint is set.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

External services require manual configuration. Cloudflare R2 credentials must be set before document upload endpoints (Plan 03) are exercised:

| Environment Variable | Source |
|---|---|
| `AWS_ACCESS_KEY_ID` | Cloudflare Dashboard → R2 → Manage R2 API Tokens → Create API Token |
| `AWS_SECRET_ACCESS_KEY` | Cloudflare Dashboard → R2 → Manage R2 API Tokens → Create API Token |
| `AWS_S3_ENDPOINT_URL` | Cloudflare Dashboard → R2 → bucket overview → S3 API endpoint |
| `AWS_STORAGE_BUCKET_NAME` | Name of the R2 bucket (default: `fms-documents`) |

The application starts and operates without these credentials; only document upload/download endpoints will return errors.

## Next Phase Readiness

- `jobs/storage.py` is fully self-contained and ready to be imported by Plan 03 upload endpoints
- `upload_document`, `delete_document`, and `get_presigned_url` are the only symbols Plan 03 needs
- No blockers for Plan 03

---
*Phase: 05-job-management*
*Completed: 2026-04-11*
