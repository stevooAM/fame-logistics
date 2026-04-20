---
phase: 06-approval-workflow
plan: "01"
subsystem: approvals
tags: [django, approvals, migrations, admin, constraints]

dependency-graph:
  requires:
    - 01-07  # approvals app scaffolded
    - 05-01  # Job model (FK target)
  provides:
    - ApprovalQueue model with uniqueness enforcement
    - ApprovalHistory model verified production-ready
    - Migration 0002 with conditional UniqueConstraint
    - Django admin registration for both models
  affects:
    - 06-02  # API layer builds on these models

tech-stack:
  added: []
  patterns:
    - Conditional UniqueConstraint (partial index) for PENDING status enforcement
    - is_pending property for readable status checks

key-files:
  created:
    - backend/approvals/migrations/0002_add_indexes_and_constraints.py
  modified:
    - backend/approvals/models.py
    - backend/approvals/admin.py

decisions:
  - "[06-01]: UniqueConstraint on job filtered by status=PENDING — allows multiple historical approvals per job, prevents duplicate pending"
  - "[06-01]: is_pending property on ApprovalQueue uses class constant (self.PENDING) not string literal"
  - "[06-01]: Migration written manually — Docker CLI not available in execution environment"

metrics:
  duration: "<1 min"
  completed: "2026-04-17"
---

# Phase 6 Plan 1: Approval Model Audit Summary

**One-liner:** ApprovalQueue extended with conditional UniqueConstraint preventing duplicate PENDING approvals per job, migration 0002 created, Django admin updated with readonly_fields and search.

## What Was Built

Audited the existing `ApprovalQueue` and `ApprovalHistory` models from Phase 1 scaffolding and confirmed all required fields were present. Extended `ApprovalQueue.Meta` with a conditional `UniqueConstraint` that enforces at most one PENDING approval per job at the database level, while allowing multiple historical (APPROVED/REJECTED) entries per job.

Added an `is_pending` convenience property. Created migration `0002_add_indexes_and_constraints.py` with the `AddConstraint` operation. Updated both admin classes with `readonly_fields`, `search_fields`, and improved `list_display`.

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Audit and extend ApprovalQueue and ApprovalHistory models | 168e9f0 | backend/approvals/models.py |
| 2 | Create migration 0002 and update admin | d782c43 | backend/approvals/migrations/0002_add_indexes_and_constraints.py, backend/approvals/admin.py |

## Decisions Made

1. **Conditional UniqueConstraint** — `UniqueConstraint(fields=["job"], condition=Q(status="PENDING"))` maps to a PostgreSQL partial index. This allows a job to have many historical approval records but only one active pending request at a time.

2. **is_pending uses class constant** — `self.status == self.PENDING` preferred over `self.status == "PENDING"` to guard against typos and match the existing pattern in the model.

3. **Migration written manually** — Docker CLI unavailable in execution environment; migration file follows Django's standard `AddConstraint` operation pattern.

## Deviations from Plan

None — plan executed exactly as written.

## Next Phase Readiness

- All ApprovalQueue fields present and verified
- Uniqueness constraint in place — API layer (06-02) can rely on IntegrityError to catch duplicate pending submissions
- Admin registered for development visibility and manual testing

## Self-Check: PASSED
