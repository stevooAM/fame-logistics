"""
Dashboard API Views
===================

Provides two endpoints:

- GET /api/dashboard/         — KPI aggregation + first page of activity feed
- GET /api/dashboard/activity/ — Paginated activity feed (Load More)

Both endpoints are protected by IsAnyRole: any authenticated staff member with
an assigned role (Admin, Operations, Finance) can access them.

Role-filtering on the feed:
  Admin      → all AuditLog entries
  Finance    → Invoice + Payment entries only
  Operations → Job + Customer + ApprovalQueue entries only

KPI notes:
  - pending_approvals is returned as null for the Finance role (Finance staff
    cannot act on approvals, so surfacing the count would be misleading)
  - outstanding_invoice_total is the NET balance: sum(invoice.amount) minus
    sum(payments) for all non-PAID, non-CANCELLED invoices, returned as a
    string for JSON serialisation (e.g. "12450.00")
  - active_jobs counts statuses PENDING, IN_PROGRESS, CUSTOMS, DELIVERED only
  - new_customers_this_month uses the calendar month of the current date
"""

from decimal import Decimal

from django.db.models import Sum
from django.utils import timezone
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Invoice, Payment
from approvals.models import ApprovalQueue
from core.models import AuditLog
from core.permissions import IsAnyRole
from customers.models import Customer
from jobs.models import Job


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _resolve_link(entry: AuditLog) -> str | None:
    """Return a frontend path for the given audit log entry, or None."""
    mapping = {
        "Job": f"/jobs/{entry.object_id}",
        "Customer": f"/customers/{entry.object_id}",
        "ApprovalQueue": "/approvals",
        "Invoice": "/accounts",
        "Payment": "/accounts",
    }
    return mapping.get(entry.model_name)


def _serialise_entry(entry: AuditLog) -> dict:
    """Serialise a single AuditLog instance to the feed result shape."""
    if entry.user:
        actor_name = entry.user.get_full_name() or entry.user.username
    else:
        actor_name = "System"

    return {
        "id": entry.pk,
        "source_type": entry.model_name,
        "actor_name": actor_name,
        "action": f"{entry.action} {entry.model_name} #{entry.object_id}",
        "timestamp": entry.timestamp.isoformat(),
        "link": _resolve_link(entry),
    }


def _build_feed(request: Request, offset: int, limit: int) -> dict:
    """
    Build a paginated feed dict for the given role.

    Role filtering:
      Admin      → no model_name filter
      Finance    → Invoice, Payment
      Operations → Job, Customer, ApprovalQueue
    """
    role = request.user.profile.role.name

    if role == "Admin":
        qs = AuditLog.objects.select_related("user").all()
    elif role == "Finance":
        qs = AuditLog.objects.select_related("user").filter(
            model_name__in=["Invoice", "Payment"]
        )
    else:  # Operations (and any future role defaults to narrowest set)
        qs = AuditLog.objects.select_related("user").filter(
            model_name__in=["Job", "Customer", "ApprovalQueue"]
        )

    total = qs.count()
    entries = qs[offset : offset + limit]

    next_url = (
        f"/api/dashboard/activity/?offset={offset + limit}&limit={limit}"
        if (offset + limit) < total
        else None
    )
    prev_url = (
        f"/api/dashboard/activity/?offset={max(0, offset - limit)}&limit={limit}"
        if offset > 0
        else None
    )

    return {
        "count": total,
        "next": next_url,
        "previous": prev_url,
        "results": [_serialise_entry(e) for e in entries],
    }


# ---------------------------------------------------------------------------
# Views
# ---------------------------------------------------------------------------


class DashboardView(APIView):
    """
    GET /api/dashboard/

    Returns aggregated KPI metrics and the first page of the role-filtered
    activity feed in a single response.

    Response shape:
    {
      "kpis": {
        "active_jobs": <int>,
        "pending_approvals": <int|null>,   // null for Finance role
        "outstanding_invoice_total": "<str>",
        "new_customers_this_month": <int>
      },
      "feed": {
        "count": <int>,
        "next": "<url|null>",
        "previous": null,
        "results": [...]
      }
    }
    """

    permission_classes = [IsAnyRole]

    def get(self, request: Request) -> Response:
        # --- KPI 1: active jobs ---
        active_jobs = Job.objects.filter(
            status__in=["PENDING", "IN_PROGRESS", "CUSTOMS", "DELIVERED"]
        ).count()

        # --- KPI 2: pending approvals (null for Finance) ---
        role = request.user.profile.role.name
        if role == "Finance":
            pending_approvals = None
        else:
            pending_approvals = ApprovalQueue.objects.filter(status="PENDING").count()

        # --- KPI 3: outstanding invoice total (net balance, as string) ---
        open_invoices = Invoice.objects.exclude(status__in=["PAID", "CANCELLED"])
        invoiced = open_invoices.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
        paid = (
            Payment.objects.filter(invoice__in=open_invoices).aggregate(
                total=Sum("amount")
            )["total"]
            or Decimal("0.00")
        )
        outstanding_invoice_total = str(invoiced - paid)

        # --- KPI 4: new customers this month ---
        today = timezone.now()
        new_customers_this_month = Customer.objects.filter(
            created_at__year=today.year,
            created_at__month=today.month,
        ).count()

        # --- Feed: first page ---
        feed = _build_feed(request, offset=0, limit=10)

        return Response(
            {
                "kpis": {
                    "active_jobs": active_jobs,
                    "pending_approvals": pending_approvals,
                    "outstanding_invoice_total": outstanding_invoice_total,
                    "new_customers_this_month": new_customers_this_month,
                },
                "feed": feed,
            }
        )


class DashboardActivityView(APIView):
    """
    GET /api/dashboard/activity/

    Returns a paginated page of the role-filtered activity feed.

    Query parameters:
      offset  — integer, default 0
      limit   — integer, default 10

    Used by the frontend "Load More" button on the dashboard activity section.
    """

    permission_classes = [IsAnyRole]

    def get(self, request: Request) -> Response:
        try:
            offset = int(request.query_params.get("offset", 0))
        except (TypeError, ValueError):
            offset = 0

        try:
            limit = int(request.query_params.get("limit", 10))
        except (TypeError, ValueError):
            limit = 10

        # Clamp to sensible bounds
        offset = max(0, offset)
        limit = max(1, min(100, limit))

        feed = _build_feed(request, offset=offset, limit=limit)
        return Response(feed)
