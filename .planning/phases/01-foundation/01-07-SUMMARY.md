---
phase: 01-foundation
plan: 07
subsystem: database
tags: [django, postgresql, migrations, fixtures, models, approvals, accounts, setup]

# Dependency graph
requires:
  - phase: 01-05
    provides: core/customers/jobs models and TimeStampedModel base class
  - phase: 01-02
    provides: Django project config, settings.py, INSTALLED_APPS structure
provides:
  - setup app: Port, CargoType, Currency, DocumentType, CompanyProfile lookup models
  - approvals app: ApprovalQueue, ApprovalHistory workflow models
  - accounts app: Invoice, Payment financial models
  - manual migration files for all three apps with cross-app FK dependencies
  - seed fixtures: 5 roles, 7 ports, 5 cargo types, 3 currencies, 4 document types, 1 company profile, 3 dev customers
  - seed_dev_data management command (idempotent fixture loading)
  - model write/read cycle tests for Customer and Role
affects: [02-customers, 03-jobs, 05-approvals, 07-accounts, 08-reports, 01-08-api-endpoints]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Singleton CompanyProfile via save() override enforcing single record
    - Cross-app FK via string reference "setup.Currency" in accounts.Invoice
    - Idempotent seed command checking Role.objects.exists() before loading
    - Manual migration files with explicit cross-app dependencies array

key-files:
  created:
    - backend/setup/models.py
    - backend/setup/migrations/0001_initial.py
    - backend/approvals/models.py
    - backend/approvals/migrations/0001_initial.py
    - backend/accounts/models.py
    - backend/accounts/migrations/0001_initial.py
    - backend/fixtures/roles.json
    - backend/fixtures/lookup_data.json
    - backend/fixtures/dev_test_data.json
    - backend/core/management/commands/seed_dev_data.py
  modified:
    - backend/config/settings.py
    - backend/core/tests.py

key-decisions:
  - "accounts.Invoice.currency uses string FK 'setup.Currency' — lazy resolution avoids circular import"
  - "CompanyProfile singleton enforced in save() — no DB-level constraint needed, single profile is business rule"
  - "seed_dev_data is idempotent — checks Role.objects.exists() AND Customer.objects.exists() before loading, safe to re-run"
  - "Manual migrations written to match Django auto-generate output — Docker CLI not available in execution environment"
  - "Invoice uses on_delete=PROTECT for job and customer FKs — prevents accidental data loss for financial records"

patterns-established:
  - "Lookup tables (Port, CargoType, Currency, DocumentType) follow uniform is_active soft-delete pattern"
  - "Financial models (Invoice, Payment) use PROTECT on all FKs to prevent accidental deletion cascades"
  - "Approval workflow uses two-table pattern: ApprovalQueue (current state) + ApprovalHistory (audit trail)"

# Metrics
duration: 3min
completed: 2026-04-05
---

# Phase 1 Plan 7: Approvals, Accounts, and Setup Models Summary

**Nine lookup/workflow/financial models across three new Django apps (setup, approvals, accounts) with manual migrations, Ghana-specific seed fixtures, and idempotent seed_dev_data command**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-05T00:14:27Z
- **Completed:** 2026-04-05T00:17:34Z
- **Tasks:** 2
- **Files modified:** 21

## Accomplishments
- Full FMS schema complete: all models for all 10 phases now defined (combined with 01-05)
- setup app provides 5 lookup tables: Port (7 seeded), CargoType (5), Currency (3), DocumentType (4), CompanyProfile (1)
- approvals app provides ApprovalQueue + ApprovalHistory with status indexes and two-User FK pattern
- accounts app provides Invoice (6-status lifecycle) and Payment with PROTECT constraints for financial integrity
- Seed fixtures provide Ghana-specific dev data: Tema Port, GHS/USD/EUR currencies, Bill of Lading/Customs doc types
- seed_dev_data management command loads fixtures in dependency order (roles → lookup → dev customers)

## Task Commits

Each task was committed atomically:

1. **Task 1: Approvals, accounts, and setup app models** - `0dbdc75` (feat)
2. **Task 2: Seed fixtures and write/read verification** - `e2afbc3` (feat)

## Files Created/Modified
- `backend/setup/models.py` - Port, CargoType, Currency, DocumentType, CompanyProfile lookup models
- `backend/setup/migrations/0001_initial.py` - Migration with core dependency
- `backend/approvals/models.py` - ApprovalQueue and ApprovalHistory with status/user indexes
- `backend/approvals/migrations/0001_initial.py` - Migration with jobs and auth dependencies
- `backend/accounts/models.py` - Invoice (6-status) and Payment with setup.Currency FK
- `backend/accounts/migrations/0001_initial.py` - Migration with customers/jobs/setup dependencies
- `backend/fixtures/roles.json` - 5 RBAC roles (Admin, Manager, Operations, Finance, Viewer)
- `backend/fixtures/lookup_data.json` - 7 ports, 5 cargo types, 3 currencies, 4 document types, 1 company profile
- `backend/fixtures/dev_test_data.json` - 3 dev test customers
- `backend/core/management/commands/seed_dev_data.py` - Idempotent fixture loading command
- `backend/config/settings.py` - Added setup, approvals, accounts to INSTALLED_APPS
- `backend/core/tests.py` - Added customer write/read, soft delete, and role fixture tests

## Decisions Made
- `accounts.Invoice.currency` uses string FK `"setup.Currency"` to avoid circular import — lazy resolution at migration time
- `CompanyProfile.save()` enforces singleton pattern — business rule (one company per instance), no DB constraint needed
- `seed_dev_data` checks both `Role.objects.exists()` and `Customer.objects.exists()` before loading — guards against partial seeding states
- `Invoice.job` and `Invoice.customer` use `on_delete=PROTECT` — financial records must not cascade-delete when parent deleted
- Manual migration files written to match Django's auto-generate output format — Docker CLI unavailable in execution environment

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Complete FMS database schema defined: all models from all 10 phases exist
- Seed fixtures ready to load via `python manage.py seed_dev_data` after migrations applied
- JobDocument.document_type string FK to "setup.DocumentType" (set in 01-05) will resolve correctly now that setup app is installed
- Migrations apply in order: core -> customers -> jobs -> setup -> approvals -> accounts
- Ready for Phase 1 Plan 8 (API endpoints) or Phase 2 (customer management features)

---
*Phase: 01-foundation*
*Completed: 2026-04-05*

## Self-Check: PASSED
