from django.contrib.auth.models import User
from django.db import models
from core.models import TimeStampedModel
from customers.models import Customer
from jobs.models import Job


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

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["invoice_number"]),
            models.Index(fields=["status"]),
            models.Index(fields=["customer"]),
            models.Index(fields=["issue_date"]),
        ]

    def __str__(self) -> str:
        return f"{self.invoice_number} — {self.customer}"


class Payment(TimeStampedModel):
    invoice = models.ForeignKey(Invoice, on_delete=models.PROTECT, related_name="payments")
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    payment_date = models.DateField()
    payment_method = models.CharField(max_length=50, blank=True)
    reference = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    class Meta:
        ordering = ["-payment_date"]

    def __str__(self) -> str:
        return f"Payment {self.amount} for {self.invoice.invoice_number}"
