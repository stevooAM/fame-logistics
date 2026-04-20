---
phase: 06
plan: 03
subsystem: sidebar-navigation
tags: [react, hooks, polling, sidebar, rbac]
requires: [06-01]
provides: [live-approval-badge-counter]
affects: [06-04, 06-05]
tech-stack:
  added: []
  patterns: [polling-hook-with-enabled-guard, badgeCount-injection-in-map]
key-files:
  created:
    - frontend/src/hooks/use-approval-badge.ts
  modified:
    - frontend/src/lib/navigation.ts
    - frontend/src/components/layout/sidebar-nav.tsx
decisions:
  - "useApprovalBadge enabled guard prevents Finance role from triggering a 403 on pending-count endpoint"
  - "badgeCount computed per-item inside map: /approvals uses live count, others fall back to static item.badge"
  - "Operations role added to Approvals nav item — oversight visibility from Phase 1 scaffold"
metrics:
  duration: ~2 min
  completed: 2026-04-17
---

# Phase 6 Plan 03: Sidebar Badge Counter Summary

**One-liner:** 30s polling hook + SidebarNav injection shows live pending approval count for admin and operations roles.

## What Was Done

Implemented a live approval badge counter in the sidebar. A new `useApprovalBadge` hook polls `/api/approvals/pending-count/` every 30 seconds and returns the current count. The `SidebarNav` component calls this hook with a `shouldPoll` guard so Finance role users (who would get a 403 from that endpoint) never trigger the request.

The Approvals nav item in `navigation.ts` was updated to include `"operations"` in its roles array, giving operations staff visibility into the approval queue.

## Task Commits

| Task | Name                                      | Commit  | Files                                   |
|------|-------------------------------------------|---------|-----------------------------------------|
| 1    | Create useApprovalBadge polling hook      | c38ce1f | frontend/src/hooks/use-approval-badge.ts |
| 2    | Update nav roles + inject live badge      | 77c217d | frontend/src/lib/navigation.ts, frontend/src/components/layout/sidebar-nav.tsx |

## Decisions Made

1. **enabled guard pattern** — `useApprovalBadge(enabled = true)` mirrors the `useIdleTimeout` throttle approach from 02-05. Passing `false` skips the `useEffect` body entirely, preventing Finance role users from polling an endpoint they cannot access.

2. **badgeCount injection in map** — Rather than mutating the `items` array or cloning NavItem objects, `badgeCount` is computed inline per iteration. This is the minimal-change approach that keeps all existing JSX structure intact.

3. **Operations added to Approvals nav** — Operations staff have oversight responsibility for jobs they create; surfacing the approval count in their sidebar completes the workflow loop without changing backend permissions.

## Deviations from Plan

None — plan executed exactly as written.

## Next Phase Readiness

- 06-04 (approval list page) and 06-05 (approval actions) can proceed — the sidebar badge will update automatically as jobs are approved/rejected.

## Self-Check: PASSED
