from django.db import models
from core.models import TimeStampedModel


class Port(TimeStampedModel):
    name = models.CharField(max_length=200, unique=True)
    code = models.CharField(max_length=20, unique=True)
    country = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)

    def __str__(self) -> str:
        return f"{self.name} ({self.code})"

    class Meta:
        ordering = ["name"]


class CargoType(TimeStampedModel):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self) -> str:
        return self.name

    class Meta:
        ordering = ["name"]


class Currency(TimeStampedModel):
    code = models.CharField(max_length=3, unique=True)
    name = models.CharField(max_length=100)
    symbol = models.CharField(max_length=5)
    exchange_rate = models.DecimalField(max_digits=12, decimal_places=6, default=1)
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    def __str__(self) -> str:
        return f"{self.code} — {self.name}"

    class Meta:
        ordering = ["code"]
        verbose_name_plural = "currencies"


class DocumentType(TimeStampedModel):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self) -> str:
        return self.name

    class Meta:
        ordering = ["name"]


class CompanyProfile(TimeStampedModel):
    name = models.CharField(max_length=200)
    logo_url = models.URLField(blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)
    website = models.URLField(blank=True)
    tin = models.CharField(max_length=50, blank=True)

    def save(self, *args, **kwargs):
        """Enforce singleton: only one company profile allowed."""
        if not self.pk and CompanyProfile.objects.exists():
            existing = CompanyProfile.objects.first()
            self.pk = existing.pk
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.name

    class Meta:
        verbose_name = "Company Profile"
