from django.db import models

from core.models import TimeStampedModel
from setup.models import Currency, Port


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
    tin = models.CharField(max_length=50, blank=False, db_index=True)
    address = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)

    # Phase 4 additions
    business_type = models.CharField(max_length=50, blank=True)
    preferred_port = models.ForeignKey(
        Port,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="customers",
    )
    currency_preference = models.ForeignKey(
        Currency,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="customers",
    )
    credit_terms = models.CharField(max_length=50, blank=True)

    class Meta:
        ordering = ["company_name"]
        indexes = [
            models.Index(fields=["tin"], name="customers_c_tin_idx"),
            models.Index(fields=["company_name"], name="customers_c_company_idx"),
            models.Index(fields=["customer_type"], name="customers_c_type_idx"),
            models.Index(fields=["is_active"], name="customers_c_active_idx"),
            models.Index(fields=["business_type"], name="customers_c_btype_idx"),
        ]

    def __str__(self) -> str:
        return self.company_name
