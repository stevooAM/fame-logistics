"""
Report query functions for the Fame FMS reports module.

All functions accept date_from and date_to as date objects (datetime.date).
They return lists of plain dicts — JSON-serialisable and openpyxl-ready.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Optional

from django.db.models import Count, Q, Sum
from django.db.models.functions import TruncMonth

from accounts.models import Invoice, Payment
from customers.models import Customer
from jobs.models import Job, JobStatus, JobType


def customer_activity_query(
    date_from: date,
    date_to: date,
    customer_id: Optional[int] = None,
) -> list[dict]:
    """
    Customer activity report: one summary row per customer.

    Row shape:
      {
        customer_id: int,
        customer_name: str,
        total_jobs: int,
        total_value: str,       # Decimal as "0.00" string
        draft: int,
        pending: int,
        in_progress: int,
        customs: int,
        delivered: int,
        closed: int,
        cancelled: int,
      }

    Filters jobs on created_at date range (inclusive).
    Excludes customers with zero jobs in the range.
    """
    qs = Job.objects.filter(
        created_at__date__gte=date_from,
        created_at__date__lte=date_to,
    )
    if customer_id:
        qs = qs.filter(customer_id=customer_id)

    # Aggregate per-customer job counts and value
    customer_ids = qs.values_list("customer_id", flat=True).distinct()
    customers = Customer.objects.filter(id__in=customer_ids).order_by("company_name")

    rows = []
    for customer in customers:
        cjobs = qs.filter(customer=customer)

        total_value = cjobs.aggregate(
            total=Sum("total_cost", default=Decimal("0.00"))
        )["total"] or Decimal("0.00")

        counts = {s.value: 0 for s in JobStatus}
        for item in cjobs.values("status").annotate(n=Count("id")):
            counts[item["status"]] = item["n"]

        rows.append(
            {
                "customer_id": customer.id,
                "customer_name": customer.company_name,
                "total_jobs": cjobs.count(),
                "total_value": str(total_value),
                "draft": counts.get(JobStatus.DRAFT, 0),
                "pending": counts.get(JobStatus.PENDING, 0),
                "in_progress": counts.get(JobStatus.IN_PROGRESS, 0),
                "customs": counts.get(JobStatus.CUSTOMS, 0),
                "delivered": counts.get(JobStatus.DELIVERED, 0),
                "closed": counts.get(JobStatus.CLOSED, 0),
                "cancelled": counts.get(JobStatus.CANCELLED, 0),
            }
        )

    return rows


def job_status_query(date_from: date, date_to: date) -> list[dict]:
    """
    Job status report: one row per (status, job_type) combination.

    Always shows all status/type combinations (user decision: no per-status filter).

    Row shape:
      {
        status: str,
        status_label: str,
        job_type: str,
        job_type_label: str,
        count: int,
        total_value: str,   # Decimal as "0.00" string
      }

    Ordered by status then job_type for consistent grouping.
    Only rows with count > 0 are returned.
    """
    qs = (
        Job.objects.filter(
            created_at__date__gte=date_from,
            created_at__date__lte=date_to,
        )
        .values("status", "job_type")
        .annotate(count=Count("id"), total_value=Sum("total_cost", default=Decimal("0.00")))
        .order_by("status", "job_type")
    )

    status_labels = dict(JobStatus.choices)
    type_labels = dict(JobType.choices)

    rows = []
    for item in qs:
        if item["count"] == 0:
            continue
        rows.append(
            {
                "status": item["status"],
                "status_label": status_labels.get(item["status"], item["status"]),
                "job_type": item["job_type"],
                "job_type_label": type_labels.get(item["job_type"], item["job_type"]),
                "count": item["count"],
                "total_value": str(item["total_value"] or Decimal("0.00")),
            }
        )
    return rows


def revenue_query(
    date_from: date,
    date_to: date,
    currency_code: Optional[str] = None,
) -> dict:
    """
    Revenue report: period summary (monthly) + per-customer breakdown.

    currency_code: ISO code e.g. "GHS", "USD". None means all currencies combined.

    Returns:
      {
        "period_rows": [...],
        "period_totals": {...},
        "customer_rows": [...],
        "customer_totals": {...},
      }

    Filters Invoice on issue_date range (inclusive). Excludes CANCELLED invoices.
    Mirrors _build_balance_rows() prefetch pattern from Phase 7 (07-03).
    """
    inv_qs = Invoice.objects.filter(
        issue_date__gte=date_from,
        issue_date__lte=date_to,
    ).exclude(status=Invoice.CANCELLED)

    if currency_code:
        inv_qs = inv_qs.filter(currency__code=currency_code)

    # --- Period rows (monthly) ---
    period_agg = (
        inv_qs.annotate(month=TruncMonth("issue_date"))
        .values("month")
        .annotate(invoiced=Sum("amount", default=Decimal("0.00")))
        .order_by("month")
    )

    period_rows = []
    period_inv_total = Decimal("0.00")
    period_paid_total = Decimal("0.00")

    for item in period_agg:
        month_start = item["month"].date() if hasattr(item["month"], "date") else item["month"]
        inv_amount = item["invoiced"] or Decimal("0.00")

        paid_amount = (
            Payment.objects.filter(
                invoice__in=inv_qs.filter(
                    issue_date__month=month_start.month,
                    issue_date__year=month_start.year,
                )
            ).aggregate(total=Sum("amount", default=Decimal("0.00")))["total"]
            or Decimal("0.00")
        )

        outstanding = inv_amount - paid_amount
        period_inv_total += inv_amount
        period_paid_total += paid_amount

        period_rows.append(
            {
                "period_label": month_start.strftime("%b %Y"),
                "period_start": month_start.isoformat(),
                "invoiced": str(inv_amount),
                "paid": str(paid_amount),
                "outstanding": str(outstanding),
            }
        )

    period_outstanding_total = period_inv_total - period_paid_total

    # --- Per-customer rows ---
    customer_ids = inv_qs.values_list("customer_id", flat=True).distinct()
    customers = Customer.objects.filter(id__in=customer_ids).order_by("company_name")

    cust_rows = []
    cust_inv_total = Decimal("0.00")
    cust_paid_total = Decimal("0.00")

    for customer in customers:
        c_inv_qs = inv_qs.filter(customer=customer)
        inv_amount = c_inv_qs.aggregate(total=Sum("amount", default=Decimal("0.00")))["total"] or Decimal("0.00")
        paid_amount = (
            Payment.objects.filter(invoice__in=c_inv_qs).aggregate(
                total=Sum("amount", default=Decimal("0.00"))
            )["total"]
            or Decimal("0.00")
        )
        outstanding = inv_amount - paid_amount
        cust_inv_total += inv_amount
        cust_paid_total += paid_amount

        cust_rows.append(
            {
                "customer_id": customer.id,
                "customer_name": customer.company_name,
                "invoiced": str(inv_amount),
                "paid": str(paid_amount),
                "outstanding": str(outstanding),
            }
        )

    cust_outstanding_total = cust_inv_total - cust_paid_total

    return {
        "period_rows": period_rows,
        "period_totals": {
            "invoiced": str(period_inv_total),
            "paid": str(period_paid_total),
            "outstanding": str(period_outstanding_total),
        },
        "customer_rows": cust_rows,
        "customer_totals": {
            "invoiced": str(cust_inv_total),
            "paid": str(cust_paid_total),
            "outstanding": str(cust_outstanding_total),
        },
    }
