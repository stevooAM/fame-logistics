"""
Accounts ViewSets — Invoice and Payment REST API.

Endpoints:
  GET  /api/accounts/invoices/           paginated, filterable list
  GET  /api/accounts/invoices/{id}/      full detail with nested payments
  POST /api/accounts/invoices/generate/  create invoice for approved job
  GET  /api/accounts/payments/           paginated list (filterable by invoice/customer)
  POST /api/accounts/payments/           record a payment, recalculate invoice status
  GET  /api/accounts/payments/{id}/      single payment detail

Permissions:
  Finance + Admin: read and write all
  Operations:      read-only on invoices; no payment creation, no invoice generation
  Other roles:     403

Audit:
  All write operations create AuditLog entries via AuditLogMixin._log_action.
"""

import logging
from datetime import date as date_type
from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from approvals.models import ApprovalQueue
from core.audit import AuditLogMixin
from core.permissions import IsAdminOrFinance, IsAnyRole
from jobs.models import Job

from .models import Invoice, Payment
from .serializers import (
    GenerateInvoiceSerializer,
    InvoiceListSerializer,
    InvoiceSerializer,
    PaymentSerializer,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Pagination
# ---------------------------------------------------------------------------


class AccountsPagination(PageNumberPagination):
    """Server-side pagination for accounts lists — 20 records per page."""

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


# ---------------------------------------------------------------------------
# Allowed ordering fields
# ---------------------------------------------------------------------------

_INVOICE_ALLOWED_ORDERING = {
    "invoice_number",
    "-invoice_number",
    "created_at",
    "-created_at",
    "status",
    "-status",
    "issue_date",
    "-issue_date",
    "due_date",
    "-due_date",
    "amount",
    "-amount",
    "customer__company_name",
    "-customer__company_name",
}


# ---------------------------------------------------------------------------
# InvoiceViewSet
# ---------------------------------------------------------------------------


class InvoiceViewSet(AuditLogMixin, ModelViewSet):
    """
    Invoice CRUD with an explicit generate action.

    list:      paginated, filterable, sortable
    retrieve:  single invoice with nested customer/job/payments + computed balance
    generate:  POST /invoices/generate/ — enforces "job must be approved" rule
    destroy:   405 — use CANCELLED status instead
    """

    pagination_class = AccountsPagination

    def get_permissions(self):
        """
        Permission matrix:
          list / retrieve → IsAnyRole  (Finance, Admin, Operations can read)
          all writes       → IsAdminOrFinance  (Finance + Admin only)
        """
        read_only_actions = {"list", "retrieve"}
        if self.action in read_only_actions:
            return [IsAnyRole()]
        return [IsAdminOrFinance()]

    def get_serializer_class(self):
        """Lightweight ListSerializer for list; full InvoiceSerializer elsewhere."""
        if self.action == "list":
            return InvoiceListSerializer
        return InvoiceSerializer

    def get_queryset(self):
        """
        Build and filter the invoice queryset.

        Supports:
          search        OR across invoice_number, customer company name
          status        exact match on Invoice status
          customer_id   exact FK match
          job_id        exact FK match
          date_from     issue_date >= date
          date_to       issue_date <= date  (inclusive)
          ordering      allowed column (with optional - prefix)
        """
        qs = (
            Invoice.objects.select_related(
                "customer", "job", "currency", "created_by"
            )
            .prefetch_related("payments")
            .order_by("-created_at")
        )

        params = self.request.query_params

        # ---- Search --------------------------------------------------------
        search = params.get("search", "").strip()
        if search:
            from django.db.models import Q

            qs = qs.filter(
                Q(invoice_number__icontains=search)
                | Q(customer__company_name__icontains=search)
            )

        # ---- Exact filters -------------------------------------------------
        inv_status = params.get("status", "").strip()
        if inv_status:
            qs = qs.filter(status=inv_status)

        customer_id = params.get("customer_id", "").strip()
        if customer_id:
            try:
                qs = qs.filter(customer_id=int(customer_id))
            except (ValueError, TypeError):
                pass

        job_id = params.get("job_id", "").strip()
        if job_id:
            try:
                qs = qs.filter(job_id=int(job_id))
            except (ValueError, TypeError):
                pass

        # ---- Date range filters (on issue_date) ----------------------------
        date_from = params.get("date_from", "").strip()
        if date_from:
            try:
                qs = qs.filter(issue_date__gte=date_from)
            except (ValueError, TypeError):
                pass

        date_to = params.get("date_to", "").strip()
        if date_to:
            try:
                qs = qs.filter(issue_date__lte=date_to)
            except (ValueError, TypeError):
                pass

        # ---- Ordering ------------------------------------------------------
        ordering = params.get("ordering", "").strip()
        if ordering in _INVOICE_ALLOWED_ORDERING:
            qs = qs.order_by(ordering)

        return qs

    def destroy(self, request, *args, **kwargs):
        """Return 405 — invoices must use CANCELLED status instead of deletion."""
        return Response(
            {
                "detail": (
                    "Invoice deletion is not permitted. "
                    "Use status CANCELLED instead."
                )
            },
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def perform_create(self, serializer):
        """
        Save invoice with created_by set to the current user.

        Bypasses AuditLogMixin.perform_create to avoid double-logging —
        calls serializer.save() directly, then _log_action once.
        """
        serializer.save(created_by=self.request.user)
        self._log_action(self.request, "CREATE", serializer.instance)

    # -----------------------------------------------------------------------
    # Custom action: generate invoice for an approved job
    # -----------------------------------------------------------------------

    @action(detail=False, methods=["post"], url_path="generate")
    def generate(self, request):
        """
        POST /api/accounts/invoices/generate/

        Creates an Invoice in DRAFT status for a job that has at least one
        ApprovalQueue entry with status APPROVED.

        Request body:
          {
            "job_id":     <int>,
            "amount":     <decimal>,
            "currency_id": <int | null>,  (optional)
            "issue_date": <date | null>,   (optional — defaults to today)
            "due_date":   <date>,
            "notes":      <str>            (optional)
          }

        Returns 201 with the created Invoice (InvoiceSerializer).
        Returns 400 with {"detail": "Job has no approved approval entry"} if
        the job has never been approved.
        Returns 404 if the job_id does not exist.
        """
        serializer = GenerateInvoiceSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        job_id = data["job_id"]

        # --- Resolve job ---
        try:
            job = Job.objects.get(pk=job_id)
        except Job.DoesNotExist:
            return Response(
                {"detail": "Job not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # --- Enforce approval gate ---
        has_approved = ApprovalQueue.objects.filter(
            job_id=job_id, status=ApprovalQueue.APPROVED
        ).exists()
        if not has_approved:
            return Response(
                {"detail": "Job has no approved approval entry"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --- Create invoice atomically ---
        issue_date = data.get("issue_date") or timezone.now().date()

        with transaction.atomic():
            invoice = Invoice.objects.create(
                job=job,
                customer=job.customer,
                amount=data["amount"],
                currency_id=data.get("currency_id"),
                status=Invoice.DRAFT,
                issue_date=issue_date,
                due_date=data["due_date"],
                notes=data.get("notes", ""),
                created_by=request.user,
            )

        self._log_action(request, "CREATE", invoice)

        output_serializer = InvoiceSerializer(invoice, context={"request": request})
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# PaymentViewSet
# ---------------------------------------------------------------------------


class PaymentViewSet(AuditLogMixin, ModelViewSet):
    """
    Payment recording and retrieval.

    list:    paginated list (filterable by invoice_id, customer_id)
    create:  record payment → recalculate Invoice.status atomically
    retrieve: single payment detail

    PUT / PATCH / DELETE are disabled.
    """

    pagination_class = AccountsPagination
    # Restrict to safe HTTP methods — payments are immutable once recorded
    http_method_names = ["get", "post", "head", "options"]

    def get_permissions(self):
        """
        Permission matrix:
          list / retrieve → IsAnyRole        (all staff can read)
          create          → IsAdminOrFinance  (Finance + Admin only)
        """
        read_only_actions = {"list", "retrieve"}
        if self.action in read_only_actions:
            return [IsAnyRole()]
        return [IsAdminOrFinance()]

    def get_serializer_class(self):
        return PaymentSerializer

    def get_queryset(self):
        """
        Build and filter the payment queryset.

        Supports:
          invoice_id    exact FK match
          customer_id   filter through invoice__customer_id
        """
        qs = Payment.objects.select_related(
            "invoice", "invoice__customer", "recorded_by"
        ).order_by("-payment_date")

        params = self.request.query_params

        invoice_id = params.get("invoice_id", "").strip()
        if invoice_id:
            try:
                qs = qs.filter(invoice_id=int(invoice_id))
            except (ValueError, TypeError):
                pass

        customer_id = params.get("customer_id", "").strip()
        if customer_id:
            try:
                qs = qs.filter(invoice__customer_id=int(customer_id))
            except (ValueError, TypeError):
                pass

        return qs

    def perform_create(self, serializer):
        """
        Record a payment and atomically recalculate the parent invoice status.

        Status recalculation rules:
          balance == 0              → PAID
          0 < paid < invoiced       → PARTIAL
          otherwise (no payments yet, or data inconsistency) → SENT

        Bypasses AuditLogMixin.perform_create to avoid double-logging.
        """
        with transaction.atomic():
            payment = serializer.save(recorded_by=self.request.user)

            # Recalculate parent invoice status
            invoice = payment.invoice
            # Re-fetch inside the transaction to get accurate aggregates
            invoice.refresh_from_db()
            balance = invoice.balance()
            paid = invoice.paid_total()
            invoiced = invoice.invoiced_total()

            if balance == 0:
                new_status = Invoice.PAID
            elif 0 < paid < invoiced:
                new_status = Invoice.PARTIAL
            else:
                new_status = Invoice.SENT

            invoice.status = new_status
            invoice.save(update_fields=["status", "updated_at"])

        self._log_action(self.request, "CREATE", payment)
