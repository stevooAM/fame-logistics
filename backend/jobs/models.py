from django.contrib.auth.models import User
from django.db import models

from core.models import TimeStampedModel
from customers.models import Customer


class JobStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    PENDING = "PENDING", "Pending"
    IN_PROGRESS = "IN_PROGRESS", "In Progress"
    CUSTOMS = "CUSTOMS", "Customs"
    DELIVERED = "DELIVERED", "Delivered"
    CLOSED = "CLOSED", "Closed"
    CANCELLED = "CANCELLED", "Cancelled"


class JobType(models.TextChoices):
    IMPORT = "IMPORT", "Import"
    EXPORT = "EXPORT", "Export"
    TRANSIT = "TRANSIT", "Transit"
    LOCAL = "LOCAL", "Local"


class Job(TimeStampedModel):
    """Freight job record."""

    job_number = models.CharField(max_length=20, unique=True, db_index=True)
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name="jobs")
    job_type = models.CharField(max_length=20, choices=JobType.choices)
    status = models.CharField(max_length=20, choices=JobStatus.choices, default=JobStatus.DRAFT)
    origin = models.CharField(max_length=200, blank=True)
    destination = models.CharField(max_length=200, blank=True)
    cargo_description = models.TextField(blank=True)
    bill_of_lading = models.CharField(max_length=100, blank=True)
    container_number = models.CharField(max_length=50, blank=True)
    weight_kg = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    volume_cbm = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    total_cost = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="created_jobs"
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["job_number"]),
            models.Index(fields=["status"]),
            models.Index(fields=["job_type"]),
            models.Index(fields=["customer"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.job_number} — {self.customer}"


class JobAuditTrail(TimeStampedModel):
    """Audit trail for job status changes and actions."""

    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="audit_trail")
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=100)
    old_value = models.CharField(max_length=200, blank=True)
    new_value = models.CharField(max_length=200, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["job"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.job.job_number}: {self.action}"


class JobDocument(TimeStampedModel):
    """Document attachments for jobs (stored in cloud storage)."""

    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="documents")
    document_type = models.ForeignKey(
        "setup.DocumentType", on_delete=models.SET_NULL, null=True, blank=True
    )
    file_name = models.CharField(max_length=255)
    file_url = models.URLField()
    file_size = models.PositiveIntegerField(null=True, blank=True)
    uploaded_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.job.job_number}: {self.file_name}"
