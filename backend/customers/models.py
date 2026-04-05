from django.db import models

from core.models import TimeStampedModel


class Customer(TimeStampedModel):
    """Customer master record."""

    COMPANY = "Company"
    INDIVIDUAL = "Individual"

    CUSTOMER_TYPE_CHOICES = [
        (COMPANY, "Company"),
        (INDIVIDUAL, "Individual"),
    ]

    company_name = models.CharField(max_length=200)
    customer_type = models.CharField(
        max_length=20, choices=CUSTOMER_TYPE_CHOICES, default=COMPANY
    )
    contact_person = models.CharField(max_length=150, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    tin = models.CharField(max_length=50, blank=True, db_index=True)
    address = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["company_name"]
        indexes = [
            models.Index(fields=["tin"]),
            models.Index(fields=["company_name"]),
            models.Index(fields=["customer_type"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self) -> str:
        return self.company_name
