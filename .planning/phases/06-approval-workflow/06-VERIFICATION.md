---
phase: 06-approval-workflow
verified: 2026-04-17T12:00:00Z
status: human_needed
score: 5/5 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 4/5
  gaps_closed:
    - "Rejecting a job requires a mandatory rejection reason; the originating staff member can see the rejection reason on the job record"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Log in as Operations, submit a job for approval, note the sidebar badge count. Approve or reject it from the Approvals page. Observe the badge within 30 seconds."
    expected: "The badge count decrements after the next 30-second polling cycle without any page reload."
    why_human: "Polling timing and UI re-render with live data cannot be verified statically."
  - test: "Reject a job with a reason. Navigate to that job's detail page as the originating staff member."
    expected: "An amber callout appears at the top of the job detail page showing the rejection reason text."
    why_human: "Conditional render based on job.status === 'DRAFT' and non-empty rejection_reason requires a live session with real data flowing through the API."
  - test: "Log in as Operations. Navigate to /approvals. Observe the tab bar."
    expected: "The History tab is absent. Only the Pending Queue tab is visible."
    why_human: "Role-conditional rendering requires a live session to verify."
  - test: "Reject a job. Observe the queue table immediately after."
    expected: "The rejected job disappears from the queue without a page refresh."
    why_human: "Optimistic state removal requires a live interaction to verify correctness."
---

# Phase 6: Approval Workflow Verification Report

**Phase Goal:** Managers and Admins can see a live queue of jobs awaiting approval, approve or reject them with a reason, and view the full approval history — while the sidebar badge shows the pending count at all times.
**Verified:** 2026-04-17
**Status:** human_needed
**Re-verification:** Yes — after gap closure (plan 06-06)

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Sidebar badge shows correct pending count and updates without page refresh | VERIFIED | `useApprovalBadge` hook (48 lines, no stubs) imported in `sidebar-nav.tsx`; polls `/api/approvals/pending-count/` every 30 s; `pending_count` action exists at views.py:154 |
| 2 | Approver can view all jobs awaiting approval with key details inline | VERIFIED | `ApprovalQueue.tsx` (165 lines) fetches on mount; `ApprovalViewSet.get_queryset()` filters `status=PENDING`; table renders inline job details |
| 3 | Approving a job updates status, records approver + timestamp, removes from queue | VERIFIED | views.py:46-65 sets `reviewed_by`, `reviewed_at`, writes `ApprovalHistory` record and `JobAuditTrail` STATUS_CHANGE; frontend filters item from state |
| 4 | Rejecting requires mandatory reason; originating staff can see reason on job record | VERIFIED | `RejectModal` validates blank reason; views.py:84-89 stores `rejection_reason` in `ApprovalQueue`; `JobSerializer.get_rejection_reason()` (serializers.py:135-144) queries `ApprovalQueue` for latest rejected entry; `RejectionCallout` renders at jobs/[id]/page.tsx:216-218 when `job.status === "DRAFT"` and `job.rejection_reason` is non-empty |
| 5 | Admin can view full approval history with approver, timestamp, reason | VERIFIED | `history` action at views.py:118 guarded by `IsAdmin`; `ApprovalHistory.tsx` (209 lines) fetches `fetchApprovalHistory` on mount with filters; `isAdmin` gate at approvals/page.tsx:38,49 |

**Score:** 5/5 truths verified

---

## Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `backend/approvals/models.py` | VERIFIED | `ApprovalQueue` and `ApprovalHistory` models; `rejection_reason = models.TextField(blank=True)` present |
| `backend/approvals/views.py` | VERIFIED | 157 lines; `list`, `approve`, `reject`, `history`, `pending_count` actions substantive; `IsAdminOrOperations` on viewset, `IsAdmin` on history action |
| `backend/approvals/serializers.py` | VERIFIED | `ApprovalQueueSerializer`, `ApprovalHistorySerializer`, `ApprovalActionSerializer` |
| `backend/jobs/serializers.py` | VERIFIED | `JobSerializer.get_rejection_reason()` (lines 135-144) — `SerializerMethodField` queries `ApprovalQueue.objects.filter(status=ApprovalQueue.REJECTED).order_by("-created_at").values_list("rejection_reason", flat=True).first()`; `rejection_reason` in `Meta.fields` and `read_only_fields` |
| `frontend/src/types/job.ts` | VERIFIED | `Job` interface includes `rejection_reason: string \| null` at line 37 |
| `frontend/src/app/(dashboard)/jobs/[id]/page.tsx` | VERIFIED | `RejectionCallout` component defined at lines 64-97; rendered conditionally at lines 215-218: `{job.status === "DRAFT" && job.rejection_reason && (<RejectionCallout reason={job.rejection_reason} />)}` |
| `frontend/src/hooks/use-approval-badge.ts` | VERIFIED | 48 lines; polls every 30 s; `enabled` guard; clean teardown |
| `frontend/src/components/layout/sidebar-nav.tsx` | VERIFIED | Imports and invokes `useApprovalBadge`; renders badge |
| `frontend/src/app/(dashboard)/approvals/components/ApprovalQueue.tsx` | VERIFIED | 165 lines; fetches on mount; Approve/Reject buttons wired; optimistic state removal |
| `frontend/src/app/(dashboard)/approvals/components/RejectModal.tsx` | VERIFIED | Client-side blank-reason validation; calls `onConfirm(trimmed)` |
| `frontend/src/app/(dashboard)/approvals/components/ApprovalHistory.tsx` | VERIFIED | 209 lines; filterable by action, date range, job number; calls `fetchApprovalHistory` |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `SidebarNav` | `useApprovalBadge` | import + call | WIRED | Hook imported in sidebar-nav.tsx |
| `useApprovalBadge` | `/api/approvals/pending-count/` | `apiFetch` in setInterval | WIRED | 30 s interval, immediate first fetch |
| `/api/approvals/pending-count/` | `ApprovalQueue.objects.filter(status=PENDING).count()` | Django view | WIRED | views.py:154 |
| `ApprovalQueue` component | `/api/approvals/` | `fetchPendingApprovals` in `useEffect` | WIRED | Fetches on mount |
| `reject` action | `ApprovalQueue.rejection_reason` | model field save | WIRED | views.py:87 stores reason |
| `JobSerializer` | `ApprovalQueue.rejection_reason` | `get_rejection_reason()` SerializerMethodField | WIRED | serializers.py:135-144 queries latest REJECTED entry |
| Job detail API response | `Job.rejection_reason` frontend type | `rejection_reason` in Meta.fields | WIRED | Type and serializer field aligned |
| `RejectionCallout` | `job.rejection_reason` state | conditional render in page.tsx:216 | WIRED | Renders when status=DRAFT and reason non-empty |
| `ApprovalHistory` component | `/api/approvals/history/` | `fetchApprovalHistory` in `useEffect` | WIRED | Loads on mount |
| `history` action | `IsAdmin` permission class | `permission_classes=[IsAdmin]` decorator | WIRED | views.py:118 |

---

## Requirements Coverage

| Requirement | Status | Blocking Issue |
|-------------|--------|----------------|
| APR-01 — Sidebar badge pending count | SATISFIED | Badge wired via polling hook |
| APR-02 — Approver can view pending queue | SATISFIED | Pending queue table with inline details |
| APR-03 — Approve records approver + timestamp | SATISFIED | `reviewed_by`, `reviewed_at`, audit trail written |
| APR-04 — Reject requires reason; staff sees it on job | SATISFIED | `get_rejection_reason()` surfaces reason via JobSerializer; `RejectionCallout` renders it on job detail page |
| APR-05 — Admin sees full history log | SATISFIED | History endpoint + UI with filters, Admin-only guard |

---

## Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `backend/approvals/views.py` (comment, line 15) | Permission matrix comment says "Approvals: IsAdmin only" but `ApprovalViewSet` uses `IsAdminOrOperations` | Info | Misleading comment only — code behaviour is correct |

No blocker stub patterns, placeholder text, empty handlers, or TODO comments found in any Phase 6 file (including 06-06 additions).

---

## Human Verification Required

### 1. Rejection reason callout visible to originating staff

**Test:** Log in as Operations. Create a job and submit it for approval. Log in as Admin or Operations in another session (or use the same account if Operations can approve). Reject the job with a specific reason (e.g. "Missing BL number"). Log back in as the originating staff member and navigate to the rejected job's detail page.
**Expected:** An amber callout appears directly below the page header reading "This job was returned for revision" with the rejection reason text beneath it. The callout does not appear if the job is in any status other than DRAFT.
**Why human:** The end-to-end flow — reject API storing reason → JobSerializer querying ApprovalQueue → API response → frontend rendering — can only be confirmed with a live session and real data. Static analysis confirms all links are wired but cannot substitute for a live round-trip.

### 2. Badge count decrement on approve/reject

**Test:** Log in as Operations, submit a job for approval, note the sidebar badge count. Approve or reject it from the Approvals page. Observe the badge within 30 seconds.
**Expected:** The badge count decrements after the next 30-second polling cycle without any page reload.
**Why human:** Polling timing and UI re-render with live data cannot be verified statically.

### 3. History tab Admin-only enforcement

**Test:** Log in as Operations. Navigate to `/approvals`. Observe the tab bar.
**Expected:** The History tab is absent. Only the Pending Queue tab is visible.
**Why human:** Role-conditional rendering requires a live session to verify.

### 4. Rejection clears from queue

**Test:** Reject a job. Observe the queue table immediately after.
**Expected:** The rejected job disappears from the queue without a page refresh.
**Why human:** Optimistic state removal requires a live interaction to verify the UI behaviour is correct.

---

## Re-verification Summary

**Gap closed (APR-04):** Plan 06-06 added three artifacts that together close the gap:

1. `backend/jobs/serializers.py` — `get_rejection_reason()` SerializerMethodField queries `ApprovalQueue` for the most recent entry with `status=REJECTED`, returns `rejection_reason` text or `None`. Field is present in `Meta.fields` and `read_only_fields`. Import of `ApprovalQueue` confirmed at line 14.

2. `frontend/src/types/job.ts` — `Job` interface now includes `rejection_reason: string | null` at line 37. Type is aligned with the API response shape.

3. `frontend/src/app/(dashboard)/jobs/[id]/page.tsx` — `RejectionCallout` component (lines 64-97) is a substantive amber alert using the project design tokens (`#F89C1C`, `#FFF8EC`, `#2B3E50`). It is rendered conditionally at lines 215-218 with the correct guard (`job.status === "DRAFT" && job.rejection_reason`).

No regressions detected in the 4 previously passing must-haves. All core approval artifacts remain substantive and wired.

All 5 automated checks pass. Status is `human_needed` pending live end-to-end verification of the rejection reason round-trip and the other interactive behaviours listed above.

---

*Verified: 2026-04-17*
*Verifier: Claude (gsd-verifier)*
