---
phase: 10-security-hardening-launch
plan: 04
subsystem: api
tags: [performance, orm, postgresql, pagination, n+1, indexes, django-rest-framework]

requires:
  - phase: 05-jobs
    provides: JobViewSet, Job model, JobAuditTrail
  - phase: 04-customers
    provides: CustomerViewSet, Customer model
  - phase: 07-invoicing
    provides: InvoiceViewSet, PaymentViewSet, accounts models
  - phase: 06-approvals
    provides: ApprovalViewSet, ApprovalHistory model

provides:
  - PERF-AUDIT.md documenting all AG Grid feeder endpoints
  - N+1 analysis with select_related/prefetch coverage per ViewSet
  - Index coverage table for all main models
  - PERF-02 pagination confirmation (all main ViewSets use explicit pagination)
  - 1 launch blocker identified (unbounded ApprovalHistory endpoint)
  - 5 pre-launch recommendations (2 missing indexes, 1 pagination gap, 1 serializer note, 1 static delivery gap)

affects: [10-05-plan, 10-06-plan, production-deploy]

tech-stack:
  added: []
  patterns:
    - "Audit-first: read-only codebase inspection producing structured findings before any fixes"
    - "N+1 verification: cross-reference SerializerMethodField traversals against ViewSet get_queryset select_related/prefetch"

key-files:
  created:
    - .planning/phases/10-security-hardening-launch/10-04-PERF-AUDIT.md
  modified: []

key-decisions:
  - "ApprovalHistory.history action is an unbounded queryset — classified as BLOCKER for launch"
  - "InvoiceListSerializer paid_total/balance are safe — list queryset has prefetch_related('payments')"
  - "WhiteNoise not installed — static delivery requires Nginx or WhiteNoise before production"
  - "All main ViewSets (Customer, Job, Invoice, Payment) use explicit pagination classes; no pagination_class=None found"

patterns-established:
  - "PERF audit format: List Endpoints table + Index Coverage table + Pagination section + Findings (BLOCKERS/RECOMMENDATIONS/DEFERRED)"

duration: 12min
completed: 2026-04-18
---

# Phase 10 Plan 04: Performance Audit Summary

**Read-only ORM and index audit identifying 1 launch blocker (unbounded ApprovalHistory endpoint) and 5 pre-launch recommendations including 2 missing model indexes and absent WhiteNoise static delivery.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-04-18T15:05:59Z
- **Completed:** 2026-04-18T15:17:59Z
- **Tasks:** 1 (audit + write)
- **Files modified:** 1

## Accomplishments

- Audited all 6 AG Grid feeder ViewSets for N+1 risks — 5 rated LOW risk, 1 (ApprovalViewSet) rated MED due to missing explicit pagination
- Confirmed PERF-02: CustomerPagination, JobPagination, and AccountsPagination all enforce page_size=20/max=100; no `pagination_class=None` found
- Identified `ApprovalHistory.history` action as a BLOCKER: returns unbounded queryset with no paginator
- Identified 2 missing indexes (`ApprovalHistory.action`, `ApprovalHistory.created_at`) and 1 potentially missing index (`Customer.created_at`)
- Confirmed WhiteNoise is absent from requirements.txt and MIDDLEWARE — static delivery requires explicit configuration before launch

## Task Commits

1. **Audit: performance audit pass** - `176adf2` (docs)

**Plan metadata:** *(this summary commit)*

## Files Created/Modified

- `.planning/phases/10-security-hardening-launch/10-04-PERF-AUDIT.md` — Full performance audit with endpoint table, index coverage table, pagination analysis, and prioritised findings

## Decisions Made

- ApprovalHistory history action classified as BLOCKER (not recommendation) because the lack of pagination + date-range filtering means a single unfiltered call returns all history rows forever — this is a correctness/reliability issue, not a cosmetic one
- InvoiceListSerializer `paid_total`/`balance` SMFs were carefully verified as N+1-safe due to the list queryset's `prefetch_related("payments")`; documented as Medium risk only if the serializer is reused without the prefetch
- Customer.created_at missing index elevated to recommendation (not deferred) because reports module already queries customers by date range

## Deviations from Plan

None — plan executed exactly as written. All grep commands ran successfully; no source files were modified.

## Issues Encountered

None.

## User Setup Required

None — audit is read-only. Findings require developer action in subsequent plans.

## Next Phase Readiness

- **10-05 (Security hardening):** Ready to proceed in parallel. No performance finding blocks security work.
- **Before launch:** The 1 BLOCKER (unbounded ApprovalHistory) should be fixed in 10-05 or 10-06 (either plan that touches the approvals app).
- **Before production deploy:** WhiteNoise installation or Nginx static configuration required.
- **Recommended migrations to add:** `ApprovalHistory` action + created_at indexes; optionally `Customer.created_at` index.

---
*Phase: 10-security-hardening-launch*
*Completed: 2026-04-18*

## Self-Check: PASSED
