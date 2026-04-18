# Phase 08: Dashboard - Research

**Researched:** 2026-04-18
**Domain:** Next.js App Router dashboard (read-only aggregation layer) + Django DRF summary endpoint
**Confidence:** HIGH — all findings sourced from live codebase; no speculative claims

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**KPI Cards**
- Four KPI cards: Active Jobs, Pending Approvals, Outstanding Invoice Total (GHS), New Customers This Month
- Finance role sees 3 cards only — Pending Approvals card is hidden (not actionable for Finance)
- Outstanding Invoice Total formatted as `GHS 12,450.00` (always GHS, no multi-currency)
- Cards are clickable drill-downs — each navigates to the relevant filtered list
- Cards auto-refresh every 30 seconds (same interval as the approval badge polling already in the app)

**Activity Feed**
- Starts with 10 most recent entries; "Load more" button fetches older entries (no hard cap)
- Covers all system events: job status changes, submissions, approvals/rejections, invoice/payment events, customer creates, user admin actions
- Feed is role-filtered: Finance sees finance events; Operations sees job/customer events; Admin sees everything
- Feed auto-refreshes on the same 30s cycle as KPI cards (single polling call)
- Entry layout: Claude's Discretion — must include actor name, action description, timestamp

**Quick Actions — Layout**
- Page order: KPI cards → Quick Actions → Activity Feed

**Quick Actions — Operations & Admin**
- Three shortcuts: Create Job, Add Customer, View Approvals
- Admin additionally gets a second panel: Manage Users, View Audit Log

**Quick Actions — Finance**
- Three shortcuts: Generate Invoice, Record Payment, View Balances

**Quick Action Button Colour**
- Claude's Discretion — follow existing button colour conventions (teal for standard, amber for high-priority CTAs)

### Claude's Discretion
- Activity feed entry layout (single-line vs two-line) — must include actor, action, timestamp
- Quick action button colours — follow established codebase conventions
- Loading skeleton / empty state design for feed and cards
- Exact polling implementation (whether one shared interval or two)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

## Summary

Phase 08 is a **pure read/display layer** sitting on top of Phases 2–7. No new data models are required beyond the existing Job, ApprovalQueue, Invoice, Customer, AuditLog, JobAuditTrail, and ApprovalHistory models. The work splits cleanly into two parts:

1. **Backend (08-01):** A single new Django view at `GET /api/dashboard/` that returns all KPI numbers and a paginated/role-filtered activity feed in one call. An optional `GET /api/dashboard/activity/` endpoint handles "Load more" with offset pagination. Both are `IsAnyRole`-gated and the role-filtering logic lives on the server.

2. **Frontend (08-02):** Replace the placeholder `app/(dashboard)/page.tsx` with a real dashboard. A single `useDashboard` hook drives a 30-second polling interval (shared with the existing `useApprovalBadge` pattern) and owns all data-fetching state. The UI composes: `KpiCards`, `QuickActions`, and `ActivityFeed` components — all Client Components because they poll.

**Primary recommendation:** Write one combined `GET /api/dashboard/` endpoint that returns `{ kpis: {...}, feed: { results: [...], count: int } }`. This keeps the frontend poll to a single HTTP request per 30-second tick, consistent with how `useApprovalBadge` already works.

---

## Standard Stack

All libraries already installed — no new dependencies required.

### Core (already present)
| Library | Purpose | Where used already |
|---------|---------|-------------------|
| Next.js 14 App Router | Page routing, RSC/Client split | `app/(dashboard)/` layout |
| React (hooks) | `useEffect`, `useRef`, `useState`, `useCallback` | `use-approval-badge.ts` exact pattern |
| `apiFetch` from `@/lib/api` | Authenticated API calls, 401 retry, cookie credentials | All existing feature hooks |
| `useAuth` from `@/providers/auth-provider` | User + role from context | Approvals page, InvoiceToolbar |
| `useRouter` from `next/navigation` | KPI card drill-down navigation | Jobs, Accounts pages |
| Tailwind CSS + inline style tokens | Styling | All components |
| Django DRF `APIView` + `IsAnyRole` | New dashboard view | Pattern from AuditLogListView |
| `django.db.models.Q`, `Count`, `Sum` | Aggregation queries | Already used in accounts/views.py |

### No new packages needed
The entire phase uses existing infrastructure. Lucide-react icons are already used in the sidebar nav — same icon set applies to quick-action buttons.

---

## Architecture Patterns

### Backend: One summary endpoint + one paginated feed endpoint

```
GET /api/dashboard/
  → { kpis: { active_jobs, pending_approvals, outstanding_invoice_total, new_customers_this_month },
      feed: { count, next, previous, results: [ActivityEntry...] } }

GET /api/dashboard/activity/?limit=10&offset=10
  → { count, next, previous, results: [ActivityEntry...] }
```

**Why one combined endpoint:** The 30-second poll needs both KPIs and the feed to refresh together. One call avoids two concurrent fetches on every tick. The "Load more" offset call is separate because it's user-triggered and does not need KPIs.

**ActivityEntry shape (server-rendered):**
```python
{
  "id": str,           # "{source_type}-{pk}" e.g. "job_audit-42"
  "source_type": str,  # "job_audit" | "approval" | "invoice" | "payment" | "customer" | "user_admin"
  "actor_name": str,   # full_name or username fallback
  "action": str,       # human-readable: "Changed status to IN_PROGRESS", "Approved FMS-2026-00012"
  "timestamp": str,    # ISO 8601 UTC
  "link": str | None,  # frontend path: "/jobs/42", "/accounts?invoice=7", None for admin events
}
```

**Role-filtering on the server (not the client):**
- Finance → query only Invoice and Payment events (from AuditLog where model_name in ["Invoice","Payment"])
- Operations → query only Job/JobAuditTrail and Customer events
- Admin → union of all sources

**Aggregation queries (all single-pass):**
```python
from django.db.models import Count, Sum, Q
from django.utils import timezone
from datetime import date

# Active Jobs: statuses that are "in flight"
ACTIVE_STATUSES = ["PENDING", "IN_PROGRESS", "CUSTOMS", "DELIVERED"]
active_jobs = Job.objects.filter(status__in=ACTIVE_STATUSES).count()

# Pending Approvals
pending_approvals = ApprovalQueue.objects.filter(status="PENDING").count()

# Outstanding Invoice Total: sum of (amount - paid) for non-CANCELLED, non-PAID
outstanding = (
    Invoice.objects.exclude(status__in=["PAID", "CANCELLED"])
    .aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
)
# Note: this is gross invoiced amount for outstanding invoices, not net-of-payments
# For true outstanding balance, use subquery. See Pitfall 3.

# New Customers This Month
today = date.today()
new_customers = Customer.objects.filter(
    created_at__year=today.year,
    created_at__month=today.month,
).count()
```

**Activity feed: UNION approach with Python sorting**

There is no single Django model covering all event types. The correct approach is to query each source model independently (within the role filter), collect results into a list, sort by timestamp descending, and slice to `limit`. For the initial 10 entries this is fast. For "Load more" the offset is applied after Python sort.

```python
# Pseudo-structure in the view
def get_feed(role, limit=10, offset=0):
    entries = []
    if role in ["Admin", "Operations"]:
        entries += list(JobAuditTrail.objects.select_related("user","job")
                        .order_by("-created_at")[:limit+offset+20])
        entries += list(ApprovalHistory.objects.select_related("actor","approval__job")
                        .order_by("-created_at")[:limit+offset+20])
        entries += list(Customer.objects.order_by("-created_at")[:limit+offset+5])
    if role in ["Admin", "Finance"]:
        entries += list(AuditLog.objects.filter(model_name__in=["Invoice","Payment"])
                        .select_related("user")
                        .order_by("-timestamp")[:limit+offset+20])
    if role == "Admin":
        entries += list(AuditLog.objects.filter(model_name__in=["User","UserProfile"])
                        .select_related("user")
                        .order_by("-timestamp")[:limit+offset+10])
    entries.sort(key=lambda e: e_timestamp(e), reverse=True)
    page = entries[offset : offset + limit]
    return serialize(page)
```

**Important:** The feed uses a unified serializer function, not individual model serializers, because it must produce a homogeneous ActivityEntry shape from heterogeneous models.

### Frontend: `useDashboard` hook following `useApprovalBadge` pattern exactly

```typescript
// Source: frontend/src/hooks/use-approval-badge.ts (existing pattern)
const POLL_INTERVAL_MS = 30_000;

export function useDashboard(role: string) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetch = async () => { /* apiFetch("/api/dashboard/") */ };
    fetch();
    intervalRef.current = setInterval(fetch, POLL_INTERVAL_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return { data, loading, error };
}
```

Key points:
- `role` is read from `useAuth()` in the component that calls the hook, then passed to the hook — the hook does not call `useAuth` directly (avoids coupling)
- The poll fires immediately on mount (same as `useApprovalBadge`)
- Errors are non-blocking: keep existing data displayed, show a subtle stale indicator

### Frontend: Component structure

```
app/(dashboard)/page.tsx            ← Client Component ("use client"), owns useDashboard
  ├── components/dashboard/
  │   ├── KpiCards.tsx              ← renders 3 or 4 cards based on role
  │   ├── KpiCard.tsx               ← single card: label, value, loading skeleton
  │   ├── QuickActions.tsx          ← role-branched action panels
  │   ├── ActivityFeed.tsx          ← list + "Load more" button
  │   └── ActivityEntry.tsx         ← single feed row: icon, actor, action, timestamp
  └── hooks/
      └── use-dashboard.ts
```

### Page layout (locked order: KPI → Quick Actions → Feed)

```tsx
// app/(dashboard)/page.tsx
<div className="flex flex-col gap-6 p-6">
  <KpiCards kpis={data?.kpis} loading={loading} role={role} />
  <QuickActions role={role} />
  <ActivityFeed
    initialEntries={data?.feed?.results}
    totalCount={data?.feed?.count}
    loading={loading}
  />
</div>
```

### KPI card drill-down navigation (from locked decisions)

```tsx
// KpiCard.tsx — uses useRouter from next/navigation
const router = useRouter();
<button onClick={() => router.push(href)} className="...">
  {/* card content */}
</button>
```

| Card | Destination |
|------|------------|
| Active Jobs | `/jobs?status=IN_PROGRESS` (or multi-status via comma or repeated param) |
| Pending Approvals | `/approvals` (queue tab is default) |
| Outstanding Invoice Total | `/accounts` (Invoices tab, no filter — all non-PAID) |
| New Customers This Month | `/customers` (no filter — list filtered server-side is out of scope) |

**Note on Jobs status filter:** The existing `JobFilters` type has `status?: JobStatus` (singular). Multiple statuses for "Active" (PENDING, IN_PROGRESS, CUSTOMS, DELIVERED) may need a `?status=IN_PROGRESS` simplification for v1, or the Jobs page must accept a comma-separated status param. Research this at plan time.

### Anti-Patterns to Avoid

- **Separate poll intervals for KPIs and feed:** The CONTEXT.md locks a single 30s cycle. Do not create two `setInterval` calls.
- **Client-side role-filtering of the feed:** Role filtering belongs in the Django view. The frontend receives only the entries appropriate for the user's role.
- **N+1 queries in the feed endpoint:** Each source model query must use `select_related` for actor/user fields to avoid per-row DB hits.
- **Using AG Grid for the activity feed:** The feed is a simple scrollable list, not a data grid. No AG Grid.
- **Calling `useAuth()` inside `useDashboard`:** Hooks that fetch data should receive `role` as a parameter, not reach into auth context themselves.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 30s polling interval | Custom debounce/throttle | Copy `useApprovalBadge` pattern exactly | Already battle-tested in the codebase, same interval constant |
| Role check in frontend | Custom RBAC logic | `user?.role?.name?.toLowerCase()` via `useAuth()` | Established pattern in ApprovalQueue, InvoiceToolbar |
| `apiFetch` for dashboard calls | Raw `fetch()` | `apiFetch` from `@/lib/api` | Handles 401 retry, cookie credentials, redirect to /login |
| Currency formatting | Custom formatter | `GHS ${value.toFixed(2)}` with `toLocaleString` | No i18n library needed — always GHS, no multi-currency |
| Relative time ("2 hours ago") | Custom time diff | `Intl.RelativeTimeFormat` or fixed `formatDistanceToNow` (if date-fns is present) | Check if date-fns exists in package.json before adding |
| Loading skeletons | Custom animation | Tailwind `animate-pulse` on `div` placeholders | Pattern used in existing components |

---

## Common Pitfalls

### Pitfall 1: Finance role receives 403 on pending-count — same guard needed on dashboard
**What goes wrong:** `useApprovalBadge(enabled)` already has an `enabled` guard preventing Finance from calling `/approvals/pending-count/`. The dashboard KPI endpoint must also guard: the server must not return `pending_approvals` for Finance users, OR the frontend must not display the Pending Approvals card. Both are required.
**How to avoid:** The Django view should check role and either (a) omit `pending_approvals` from the KPI payload for Finance, or (b) return `null` for it. The frontend hides the card when `kpis.pending_approvals === null || role === "finance"`.
**Reference:** Phase 06-03 summary — `useApprovalBadge` uses `enabled` param pattern.

### Pitfall 2: Activity feed UNION is unsorted by default
**What goes wrong:** Concatenating QuerySet results from multiple models and relying on Python `list()` does not guarantee time ordering. Different models use different timestamp field names (`created_at` vs `timestamp` for AuditLog).
**How to avoid:** Normalize the timestamp field in the serializer helper before sorting. AuditLog uses `timestamp`, all others use `created_at`. The Python sort key function must branch on type.
**Warning signs:** Feed shows old entries intermixed with recent ones.

### Pitfall 3: Outstanding Invoice Total — gross vs net
**What goes wrong:** `Sum("amount")` on non-PAID invoices gives the gross invoiced amount, not the true outstanding balance (which is amount minus payments). The KPI label says "Outstanding" which implies net.
**How to avoid:** Either (a) use a subquery to subtract payments from each invoice, or (b) clarify with the user that "outstanding" means "not-fully-paid invoice total" (gross). The accounts/views.py `_build_balance_rows` helper already does the correct net calculation — replicate that approach.
**Recommended approach:** Use a subquery annotation. The existing `Invoice.balance()` instance method does this correctly but cannot be used in an aggregation directly. Use `Subquery(Payment.objects.filter(invoice=OuterRef("pk")).values("invoice").annotate(total=Sum("amount")).values("total"))` to annotate each invoice with its paid total, then subtract.

### Pitfall 4: "Load more" offset pagination doesn't work cleanly with Python-sorted UNION
**What goes wrong:** The "Load more" call at `offset=10` must re-run all source queries, re-merge, re-sort, and then slice `[10:20]`. This means fetching more rows from each source than needed.
**How to avoid:** For v1, fetch `offset + limit + buffer` rows from each source (e.g., `offset + limit + 20`) before the Python sort and slice. This is acceptable for a dashboard feed that is unlikely to exceed 100 entries in practice.
**Warning signs:** Feed shows duplicate entries or gaps when "Load more" is clicked.

### Pitfall 5: KPI cards flash to zero on every poll interval
**What goes wrong:** If the hook sets `loading=true` at the start of each poll, all cards blank out every 30 seconds.
**How to avoid:** Only set `loading=true` on the first fetch (when `data === null`). Subsequent polls update the data silently. This is the `useApprovalBadge` pattern — it never re-sets loading state after the first successful fetch.

### Pitfall 6: Quick action buttons navigate to pages some roles cannot access
**What goes wrong:** Finance quick action "View Balances" links to `/accounts` which is `["admin","finance"]` — fine. But if an Operations user sees a misconfigured button pointing to `/accounts`, they get a blank page or error.
**How to avoid:** The `QuickActions` component is role-branched: Finance sees the Finance panel, Operations/Admin see the Operations panel. Never show a single merged set of buttons.

---

## Code Examples

### Existing polling pattern to replicate (HIGH confidence — from codebase)

```typescript
// Source: frontend/src/hooks/use-approval-badge.ts
const POLL_INTERVAL_MS = 30_000;

export function useApprovalBadge(enabled = true): number {
  const [count, setCount] = useState<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchCount = async () => {
      try {
        const data = await apiFetch<PendingCountResponse>("/api/approvals/pending-count/");
        setCount(data.count);
      } catch {
        // Non-blocking — keep existing count on error
      }
    };

    fetchCount();
    intervalRef.current = setInterval(fetchCount, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, [enabled]);

  return count;
}
```

### Role check pattern (HIGH confidence — from codebase)

```typescript
// Source: frontend/src/app/(dashboard)/approvals/page.tsx
const { user } = useAuth();
const isAdmin = user?.role?.name?.toLowerCase() === "admin";
const isFinance = user?.role?.name?.toLowerCase() === "finance";
const isOperations = user?.role?.name?.toLowerCase() === "operations";
```

### Teal primary button (HIGH confidence — from InvoiceToolbar.tsx)

```tsx
// Standard teal CTA — used for non-finance actions (Record Payment, etc.)
<button
  className="rounded-md px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
  style={{ backgroundColor: "#1F7A8C" }}
>
  Create Job
</button>
```

### Amber CTA button (HIGH confidence — from InvoiceToolbar.tsx)

```tsx
// Amber CTA — used for high-priority finance actions (Generate Invoice)
<button
  className="rounded-md px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
  style={{ backgroundColor: "#F89C1C" }}
>
  Generate Invoice
</button>
```

### Django aggregation endpoint pattern (HIGH confidence — from approvals/views.py)

```python
# Source: approvals/views.py - pending_count action (exact model for dashboard KPI endpoint)
@action(detail=False, methods=["get"], url_path="pending-count")
def pending_count(self, request):
    count = ApprovalQueue.objects.filter(status=ApprovalQueue.PENDING).count()
    return Response({"count": count})
```

### Tailwind loading skeleton pattern (HIGH confidence — Tailwind docs, used in project)

```tsx
// KPI card loading skeleton
<div className="animate-pulse">
  <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
  <div className="h-8 w-16 bg-gray-200 rounded" />
</div>
```

---

## Key Model Facts (verified from codebase)

| Model | App | Timestamp field | Actor field | Notes |
|-------|-----|----------------|------------|-------|
| `JobAuditTrail` | `jobs` | `created_at` | `user` (FK to User) | Covers status changes |
| `ApprovalHistory` | `approvals` | `created_at` | `actor` (FK to User) | Covers approvals/rejections |
| `AuditLog` | `core` | `timestamp` | `user` (FK to User) | Covers CREATE/UPDATE on Invoice, Payment, Customer, User |
| `Job` | `jobs` | `created_at` | `created_by` (FK to User) | Customer creates via AuditLog |
| `Customer` | `customers` | `created_at` | no actor field | Customer creates must come from AuditLog, not Customer directly |
| `Invoice` | `accounts` | `created_at` | `created_by` (FK to User) | Invoice creation via AuditLog |

**Customer creation events:** The `Customer` model has no `created_by` field. Customer creation events must be sourced from `AuditLog` where `model_name="Customer"` and `action="CREATE"`, not from the `Customer` model directly.

**Active job statuses:** The `JobStatus` choices are DRAFT, PENDING, IN_PROGRESS, CUSTOMS, DELIVERED, CLOSED, CANCELLED. "Active" for the KPI card means the job is in flight: `["PENDING", "IN_PROGRESS", "CUSTOMS", "DELIVERED"]`. DRAFT, CLOSED, and CANCELLED are excluded.

**UserProfile full name:** `User.get_full_name()` returns `first_name + " " + last_name`. Fall back to `User.username` when first_name is blank (common for admin users).

---

## Backend Implementation Plan (08-01)

### New files
- `backend/core/dashboard_views.py` — `DashboardView` (APIView, IsAnyRole)
- Add to `backend/core/urls.py`: `path("dashboard/", views.DashboardView.as_view(), name="dashboard")`

### No new migrations needed
Dashboard is read-only; no new models.

### DashboardView structure
```python
class DashboardView(APIView):
    permission_classes = [IsAnyRole]

    def get(self, request):
        role = request.user.profile.role.name  # "Admin" | "Operations" | "Finance"
        kpis = self._get_kpis(role)
        limit = int(request.query_params.get("limit", 10))
        offset = int(request.query_params.get("offset", 0))
        feed = self._get_feed(role, limit, offset)
        return Response({"kpis": kpis, "feed": feed})
```

---

## Frontend Implementation Plan (08-02)

### Files to create/replace
- `frontend/src/app/(dashboard)/page.tsx` — replace placeholder with real dashboard
- `frontend/src/hooks/use-dashboard.ts` — new polling hook
- `frontend/src/components/dashboard/KpiCards.tsx`
- `frontend/src/components/dashboard/KpiCard.tsx`
- `frontend/src/components/dashboard/QuickActions.tsx`
- `frontend/src/components/dashboard/ActivityFeed.tsx`
- `frontend/src/components/dashboard/ActivityEntry.tsx`
- `frontend/src/types/dashboard.ts` — TypeScript interfaces

### Note on /gsd:discuss-phase requirement
CONTEXT.md notes that 08-02 (Dashboard UI) should use the `/frontend-design` skill. The planner must invoke that skill when generating the 08-02 plan.

---

## Open Questions

1. **Multi-status KPI card drill-down for Active Jobs**
   - What we know: `JobFilters.status` is `JobStatus` (singular) in the current type definition
   - What's unclear: Does `/jobs?status=PENDING,IN_PROGRESS,...` work, or does the Jobs page need a multi-value status param?
   - Recommendation: For v1, link the Active Jobs card to `/jobs` (no filter) and add a note in the plan to revisit multi-status filtering. Or plan an update to `JobFilters` and the Jobs page toolbar to accept a `status[]` array.

2. **Outstanding Invoice Total — gross vs net**
   - What we know: The CONTEXT.md says "Outstanding Invoice Total (GHS)" without specifying gross vs net
   - What's unclear: Should this be `Sum of Invoice.amount where status NOT IN (PAID, CANCELLED)` (gross), or the true net balance after payments?
   - Recommendation: Use net (sum of `Invoice.balance()` per non-CANCELLED invoice) to match user expectation of "outstanding." This requires a payment subquery annotation. Plan for this explicitly.

3. **Date-fns availability for relative timestamps**
   - What we know: Not confirmed in `package.json` without reading it
   - What's unclear: Whether `formatDistanceToNow` from date-fns is available
   - Recommendation: Plan time — check `package.json`. If not present, use `Intl.RelativeTimeFormat` (native, no dependency). Do not add date-fns just for this.

---

## Sources

### Primary (HIGH confidence — live codebase)
- `frontend/src/hooks/use-approval-badge.ts` — exact polling pattern to replicate
- `frontend/src/providers/auth-provider.tsx` — `useAuth`, `UserProfile` shape, `role.name` access
- `frontend/src/lib/api.ts` — `apiFetch`, `ApiError`, `API_BASE_URL`
- `frontend/src/lib/navigation.ts` — role-to-route mapping, `filterNavByRole`
- `backend/core/permissions.py` — `IsAnyRole`, `IsAdminOrFinance`, `IsAdminOrOperations`
- `backend/jobs/models.py` — `Job`, `JobStatus`, `JobAuditTrail`
- `backend/accounts/models.py` — `Invoice`, `Payment`, `InvoiceQuerySet.outstanding_for_customer`
- `backend/approvals/models.py` — `ApprovalQueue`, `ApprovalHistory`
- `backend/core/models.py` — `AuditLog`, `UserProfile`, `Role`
- `backend/customers/models.py` — `Customer` (no `created_by` — customer events from AuditLog)
- `backend/core/urls.py` — existing URL structure, where to add dashboard route
- `frontend/src/app/(dashboard)/approvals/page.tsx` — role-check pattern
- `frontend/src/app/(dashboard)/accounts/components/InvoiceToolbar.tsx` — button colour conventions

### Secondary (MEDIUM confidence)
- Phase 06-03 context: Finance guard on approval badge is established precedent for dashboard KPI guard

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries, all existing
- Backend aggregation queries: HIGH — models fully read, query patterns verified against existing views
- Feed UNION pattern: MEDIUM — correct approach but SQL UNION vs Python union tradeoff should be evaluated at plan time
- Outstanding Total calculation: MEDIUM — gross vs net is an open question
- Frontend component structure: HIGH — follows established codebase patterns exactly

**Research date:** 2026-04-18
**Valid until:** 2026-05-18 (stable codebase, internal research)
