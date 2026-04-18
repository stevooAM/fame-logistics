# Phase 10 Performance Audit

**Date:** 2026-04-18
**Scope:** PERF-01 (page speed / ORM hot paths), PERF-02 (server-side pagination)

---

## List Endpoints (AG Grid feeders)

| File:line | Model | select_related | prefetch_related | Pagination | N+1 risk |
|-----------|-------|----------------|------------------|------------|----------|
| customers/views.py:60 | Customer | preferred_port, currency_preference | — | CustomerPagination (20, max 100) | LOW — `preferred_port_name` / `currency_preference_code` SMFs check `_id` sentinel before accessing object; select_related covers traversal |
| jobs/views.py:96 | Job | customer, assigned_to, created_by | — | JobPagination (20, max 100) | LOW — `customer_name` / `assigned_to_name` SMFs check `_id` sentinel; all three FKs select_related |
| accounts/views.py:98 | Invoice | customer, job, currency, created_by | payments | AccountsPagination (20, max 100) | LOW — `paid_total` / `balance` SMFs call `obj.payments.aggregate()` which hits prefetch cache; `customer_name` / `job_number` SMFs use select_related |
| accounts/views.py:743 | Payment | invoice, invoice__customer, recorded_by | — | AccountsPagination (20, max 100) | LOW — `recorded_by_name` SMF traverses select_related FK |
| approvals/views.py:19 | ApprovalQueue | job, job__customer, submitted_by, submitted_by__profile | — | None (unbounded list — see BLOCKERS) | MED — list is filtered to PENDING only (expected small set); no pagination class set |
| setup/views.py:100–124 | Port / CargoType / Currency / DocumentType | — | — | Default DRF PageNumberPagination (20) | LOW — lookup tables are tiny (<200 rows); no SMFs with FK traversal |

---

## Index Coverage

| Model.field | Filter/Sort usage | Indexed? | Action |
|-------------|-------------------|----------|--------|
| Customer.tin | Exact filter (`check-tin`), icontains search | YES (`db_index=True` + explicit `customers_c_tin_idx`) | none |
| Customer.company_name | icontains filter, default ordering | YES (`customers_c_company_idx`) | none |
| Customer.customer_type | Exact filter | YES (`customers_c_type_idx`) | none |
| Customer.is_active | Soft-delete gate on every list | YES (`customers_c_active_idx`) | none |
| Customer.business_type | icontains filter | YES (`customers_c_btype_idx`) | none |
| Customer.created_at | TimeStampedModel (sort candidate) | NO explicit index | ADD INDEX — used for ordering in reports/queries |
| Job.job_number | Unique lookup, icontains search, generate_job_number prefix scan | YES (`db_index=True` + `jobs_job_number_idx`) | none |
| Job.status | Exact filter | YES (`jobs_job_status_idx`) | none |
| Job.job_type | Exact filter | YES (`jobs_job_type_idx`) | none |
| Job.customer (FK) | Exact filter, FK join | YES (Django auto FK + `jobs_job_customer_idx`) | none |
| Job.assigned_to (FK) | Exact filter | YES (`jobs_job_assigned_idx`) | none |
| Job.created_at | Date range filter, default ordering | YES (`jobs_job_created_idx`) | none |
| Job.eta | Sort candidate | YES (`jobs_job_eta_idx`) | none |
| Job.delivery_date | Sort candidate | YES (`jobs_job_delivery_idx`) | none |
| Invoice.invoice_number | Unique lookup, icontains search | YES (`db_index=True` + `accounts_in_number_idx`) | none |
| Invoice.status | Exact filter | YES (`accounts_in_status_idx`) | none |
| Invoice.customer (FK) | Exact filter, FK join | YES (Django auto FK + `accounts_in_custome_idx`) | none |
| Invoice.issue_date | Date range filter, ordering | YES (`accounts_in_issue_d_idx`) | none |
| Invoice.job (FK) | Exact filter, FK join | YES (Django auto FK index) | none |
| Payment.payment_date | Ordering, date range in reports | YES (`db_index=True` + `accounts_pay_date_idx`) | none |
| Payment.invoice (FK) | Exact filter | YES (Django auto FK index) | none |
| Payment.recorded_by (FK) | FK join | YES (`accounts_pay_recorded_idx`) | none |
| ApprovalQueue.status | Core filter (`filter(status=PENDING)`) | YES (explicit index) | none |
| ApprovalQueue.job (FK) | FK join, UniqueConstraint | YES (Django auto FK index) | none |
| ApprovalHistory.action | `action_filter` exact filter in history view | NO explicit index | ADD INDEX — filtered on every history list call |
| ApprovalHistory.approval (FK) | FK join | YES (Django auto FK index) | none |
| ApprovalHistory.created_at | Default ordering, date range filter | NO explicit index | ADD INDEX — date range filter used on every history list |

---

## Pagination (PERF-02)

**Default:** `PageNumberPagination` / `PAGE_SIZE=20` via `settings.REST_FRAMEWORK`.

**Custom pagination classes (all consistent with 20/max-100 policy):**

| ViewSet | Class | page_size | max_page_size |
|---------|-------|-----------|---------------|
| CustomerViewSet | CustomerPagination | 20 | 100 |
| JobViewSet | JobPagination | 20 | 100 |
| InvoiceViewSet | AccountsPagination | 20 | 100 |
| PaymentViewSet | AccountsPagination | 20 | 100 |

**Overrides with `pagination_class = None`:** None found.

**EXCEPTION — ApprovalViewSet (approvals/views.py:19):**

`ApprovalViewSet` inherits from `ListModelMixin + GenericViewSet` and does NOT set `pagination_class`. It will fall through to the DRF default (`PageNumberPagination`, PAGE_SIZE=20) because the global default is set. However, this view is filtered to `status=PENDING` only, which is typically a small result set. Still, the absence of an explicit pagination class (and no `max_page_size` cap) is a risk at scale and should be addressed.

`ApprovalHistory` history action returns a raw `Response(serializer(qs, many=True).data)` — completely **unbounded**, no pagination applied. With 50K+ jobs over time this list will grow to thousands of rows and the response will OOM. **This is a BLOCKER.**

---

## Findings

### BLOCKERS (must fix before launch)

**1. ApprovalHistory history action — unbounded queryset (approvals/views.py:120–152)**

- **File:** `backend/approvals/views.py`, `history` action (line 120)
- **Issue:** `ApprovalHistorySerializer(qs, many=True).data` is returned with no paginator. All matching rows are serialised in a single response. With date filters this may be tolerable in early usage, but without filters the full table is returned.
- **Fix:** Apply the existing `JobPagination` (or a dedicated `ApprovalPagination`) to the history queryset. Add `self.paginate_queryset` / `get_paginated_response` wrappers.
- **Impact:** Without this fix, the history endpoint will cause timeout / memory pressure once the approval history grows beyond a few hundred rows.

---

### RECOMMENDATIONS (fix before Lighthouse)

**R-1. Add index on `ApprovalHistory.action`**

- **File:** `backend/approvals/models.py`
- **Issue:** `ApprovalHistory` has no `indexes` block. The history action filters on `action` (SUBMITTED / APPROVED / REJECTED) for every filtered list call.
- **Fix:** Add `models.Index(fields=["action"])` and `models.Index(fields=["created_at"])` to `ApprovalHistory.Meta`.
- **Migration required:** Yes (one `AddIndex` migration).

**R-2. Add index on `ApprovalHistory.created_at`**

- **File:** `backend/approvals/models.py`
- **Issue:** Date range filter `created_at__date__gte` / `created_at__lt` applied on every history list call; no index on `created_at`.
- **Fix:** Add `models.Index(fields=["created_at"])` to `ApprovalHistory.Meta` (can be combined with R-1 migration).
- **Migration required:** Yes (same migration as R-1).

**R-3. Add index on `Customer.created_at`**

- **File:** `backend/customers/models.py`
- **Issue:** `Customer` has no `created_at` index. Reports module (`reports/`) queries customers by date range; as the table grows to 10K+ rows, range scans will become costly.
- **Fix:** Add `models.Index(fields=["created_at"], name="customers_c_created_idx")` to `Customer.Meta.indexes`.
- **Migration required:** Yes (one `AddIndex` migration).

**R-4. Explicit pagination on `ApprovalViewSet`**

- **File:** `backend/approvals/views.py`
- **Issue:** `ApprovalViewSet` does not declare `pagination_class`. It falls through to the DRF global default (PAGE_SIZE=20), but this is implicit and the `max_page_size` cap is absent.
- **Fix:** Add `pagination_class = JobPagination` (or a shared `StandardPagination` with max_page_size=100) to `ApprovalViewSet`.
- **Risk without fix:** Medium — queue is PENDING-filtered (small set today), but explicit is better than implicit.

**R-5. `InvoiceListSerializer` — `paid_total` / `balance` use Python-level aggregate after prefetch**

- **File:** `backend/accounts/serializers.py:69–73`
- **Issue:** `obj.paid_total()` calls `self.payments.aggregate(total=Sum("amount"))`. When `payments` is prefetched (as it is in the list queryset), Django will execute the aggregate **in Python** over the prefetch cache — no extra SQL query. This is correct. However, if any code path calls the list serializer without `prefetch_related("payments")`, this silently falls back to N+1 (one SQL aggregate per invoice row).
- **Fix:** Document in the serializer that callers MUST prefetch `payments`. Optionally, use a Python-level sum over the prefetch cache (`sum(p.amount for p in obj.payments.all())`) to make the prefetch dependency explicit and avoid the aggregate fallback.
- **Risk without fix:** Low today (list queryset has prefetch), Medium if serializer is reused elsewhere.

---

### DEFERRED (post-launch)

- **Full-text search index on `cargo_description`** — current `icontains` on a `TextField` with 50K+ jobs will slow down. A `GinIndex` with `pg_trgm` extension would resolve this. Deferred until job volume warrants it.
- **Composite indexes** (e.g., `[customer, status]` on Job, `[customer, status]` on Invoice) — beneficial for the dashboard aggregation queries and reporting. Not blocking for launch.
- **`generate_job_number()` / `generate_invoice_number()` sequential scan** — both functions use `select_for_update()` + prefix filter on the number column, which has an index. At moderate concurrency this is fine; at high concurrency (>50 concurrent creates/sec) a DB sequence would be faster. Deferred.
- **AG Grid infinite-row model** — current implementation uses page-number pagination. If any grid is switched to infinite-scroll mode, the backend would benefit from cursor-based pagination (no OFFSET). Deferred.

---

## Static Delivery

WhiteNoise is **not installed** (`backend/requirements.txt` has no `whitenoise` entry; `MIDDLEWARE` has no `WhiteNoiseMiddleware`). `STATIC_ROOT = BASE_DIR / "staticfiles"` is configured but no serving mechanism beyond `runserver` is present.

**Before production deployment:**

- For Railway / Render / VPS with Nginx: configure Nginx to serve `/staticfiles/` directly and run `python manage.py collectstatic` in the deploy step.
- For Render with no Nginx (Python service only): install `whitenoise>=6` and add `whitenoise.middleware.WhiteNoiseMiddleware` immediately after `SecurityMiddleware` in `MIDDLEWARE`.
- The Next.js frontend is a separate service and serves its own static assets via the Node server or Vercel CDN — this item only applies to Django admin and DRF browsable API static files.
