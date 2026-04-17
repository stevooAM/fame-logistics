from decimal import Decimal

from django.contrib.auth.models import User
from django.db import models, transaction
from django.db.models import Sum
from django.utils import timezone

from core.models import TimeStampedModel
from customers.models import Customer
from jobs.models import Job


def generate_invoice_number() -> str:
    """
    Generate the next invoice number in INV-{YEAR}-{SEQUENCE:05d} format.

    Uses select_for_update() via a transaction-safe query to avoid race
    conditions when multiple invoices are created concurrently. The caller is
    responsible for wrapping this in an atomic block if needed.
    """
    year = timezone.now().year
    prefix = f"INV-{year}-"

    # Lock the latest row for the current year to prevent concurrent duplicates.
    latest = (
        Invoice.objects.select_for_update()
        .filter(invoice_number__startswith=prefix)
        .order_by("-invoice_number")
        .first()
    )

    if latest is None:
        sequence = 1
    else:
        try:
            sequence = int(latest.invoice_number.split("-")[-1]) + 1
        except (ValueError, IndexError):
            sequence = 1

    return f"{prefix}{sequence:05d}"


class InvoiceQuerySet(models.QuerySet):
    def outstanding_for_customer(self, customer_id: int) -> dict:
        """
        Return aggregated invoiced/paid/balance Decimals for a given customer.

        Returns a dict: {"invoiced": Decimal, "paid": Decimal, "balance": Decimal}
        """
        invoices = self.filter(customer_id=customer_id)

        invoiced = invoices.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")

        paid = (
            Payment.objects.filter(invoice__customer_id=customer_id).aggregate(
                total=Sum("amount")
            )["total"]
            or Decimal("0.00")
        )

        return {
            "invoiced": invoiced,
            "paid": paid,
            "balance": invoiced - paid,
        }


class Invoice(TimeStampedModel):
    DRAFT = "DRAFT"
    SENT = "SENT"
    PAID = "PAID"
    PARTIAL = "PARTIAL"
    OVERDUE = "OVERDUE"
    CANCELLED = "CANCELLED"

    STATUS_CHOICES = [
        (DRAFT, "Draft"),
        (SENT, "Sent"),
        (PAID, "Paid"),
        (PARTIAL, "Partial"),
        (OVERDUE, "Overdue"),
        (CANCELLED, "Cancelled"),
    ]

    invoice_number = models.CharField(max_length=20, unique=True, db_index=True)
    job = models.ForeignKey(Job, on_delete=models.PROTECT, related_name="invoices")
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name="invoices")
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    currency = models.ForeignKey(
        "setup.Currency", on_delete=models.SET_NULL, null=True, blank=True
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=DRAFT)
    issue_date = models.DateField()
    due_date = models.DateField()
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True
    )

    objects = InvoiceQuerySet.as_manager()

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["invoice_number"], name="accounts_in_number_idx"),
            models.Index(fields=["status"], name="accounts_in_status_idx"),
            models.Index(fields=["customer"], name="accounts_in_custome_idx"),
            models.Index(fields=["issue_date"], name="accounts_in_issue_d_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.invoice_number} — {self.customer}"

    def save(self, *args, **kwargs):
        if not self.pk and not self.invoice_number:
            with transaction.atomic():
                self.invoice_number = generate_invoice_number()
                super().save(*args, **kwargs)
        else:
            super().save(*args, **kwargs)

    # --- Balance helpers ---

    def invoiced_total(self) -> Decimal:
        """Return the invoice amount as Decimal."""
        return Decimal(self.amount)

    def paid_total(self) -> Decimal:
        """Return the sum of all related Payment amounts."""
        result = self.payments.aggregate(total=Sum("amount"))["total"]
        return result if result is not None else Decimal("0.00")

    def balance(self) -> Decimal:
        """Return the outstanding balance (invoiced_total - paid_total)."""
        return self.invoiced_total() - self.paid_total()


class Payment(TimeStampedModel):
    invoice = models.ForeignKey(Invoice, on_delete=models.PROTECT, related_name="payments")
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    payment_date = models.DateField(db_index=True)
    payment_method = models.CharField(max_length=50, blank=True)
    reference = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    class Meta:
        ordering = ["-payment_date"]
        indexes = [
            models.Index(fields=["payment_date"], name="accounts_pay_date_idx"),
            models.Index(fields=["recorded_by"], name="accounts_pay_recorded_idx"),
        ]

    def __str__(self) -> str:
        return f"Payment {self.amount} for {self.invoice.invoice_number}"
