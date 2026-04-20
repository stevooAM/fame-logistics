from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone

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


def generate_job_number() -> str:
    """
    Generate the next job number in FMS-{YEAR}-{SEQUENCE:05d} format.

    Uses select_for_update() via a transaction-safe query to avoid race
    conditions when multiple jobs are created concurrently. The caller is
    responsible for wrapping this in an atomic block if needed.
    """
    year = timezone.now().year
    prefix = f"FMS-{year}-"

    # Lock the latest row for the current year to prevent concurrent duplicates.
    latest = (
        Job.objects.select_for_update()
        .filter(job_number__startswith=prefix)
        .order_by("-job_number")
        .first()
    )

    if latest is None:
        sequence = 1
    else:
        try:
            sequence = int(latest.job_number.split("-")[-1]) + 1
        except (ValueError, IndexError):
            sequence = 1

    return f"{prefix}{sequence:05d}"


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

    # Fields added in 0002
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_jobs",
    )
    eta = models.DateField(null=True, blank=True)
    delivery_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["job_number"], name="jobs_job_number_idx"),
            models.Index(fields=["status"], name="jobs_job_status_idx"),
            models.Index(fields=["job_type"], name="jobs_job_type_idx"),
            models.Index(fields=["customer"], name="jobs_job_customer_idx"),
            models.Index(fields=["created_at"], name="jobs_job_created_idx"),
            models.Index(fields=["assigned_to"], name="jobs_job_assigned_idx"),
            models.Index(fields=["eta"], name="jobs_job_eta_idx"),
            models.Index(fields=["delivery_date"], name="jobs_job_delivery_idx"),
        ]

    def save(self, *args, **kwargs):
        """Auto-assign a job number on first save when none is provided."""
        if not self.pk and not self.job_number:
            self.job_number = generate_job_number()
        super().save(*args, **kwargs)

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
            models.Index(fields=["job"], name="jobs_jobaud_job_idx"),
            models.Index(fields=["created_at"], name="jobs_jobaud_created_idx"),
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
