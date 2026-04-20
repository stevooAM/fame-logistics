from django.contrib.auth.models import User
from django.db import models
from core.models import TimeStampedModel
from jobs.models import Job


class ApprovalQueue(TimeStampedModel):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

    STATUS_CHOICES = [
        (PENDING, "Pending"),
        (APPROVED, "Approved"),
        (REJECTED, "Rejected"),
    ]

    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="approval_requests")
    submitted_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="submitted_approvals"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    reviewed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="reviewed_approvals"
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["submitted_by"]),
            models.Index(fields=["reviewed_by"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["job"],
                condition=models.Q(status="PENDING"),
                name="unique_pending_approval_per_job",
            )
        ]

    @property
    def is_pending(self) -> bool:
        return self.status == self.PENDING

    def __str__(self) -> str:
        return f"Approval for {self.job.job_number} — {self.status}"


class ApprovalHistory(TimeStampedModel):
    SUBMITTED = "SUBMITTED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

    ACTION_CHOICES = [
        (SUBMITTED, "Submitted"),
        (APPROVED, "Approved"),
        (REJECTED, "Rejected"),
    ]

    approval = models.ForeignKey(ApprovalQueue, on_delete=models.CASCADE, related_name="history")
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    comment = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.action} by {self.actor} on {self.approval}"
