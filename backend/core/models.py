import uuid

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone


class TimeStampedModel(models.Model):
    """Abstract base model with created_at and updated_at timestamps."""

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Role(TimeStampedModel):
    """User roles for RBAC — exactly 3 roles: Admin, Operations, Finance."""

    ADMIN = "Admin"
    OPERATIONS = "Operations"
    FINANCE = "Finance"

    ROLE_CHOICES = [
        (ADMIN, "Admin"),
        (OPERATIONS, "Operations"),
        (FINANCE, "Finance"),
    ]

    name = models.CharField(max_length=50, unique=True, choices=ROLE_CHOICES)
    description = models.TextField(blank=True)

    def __str__(self) -> str:
        return self.name

    class Meta:
        ordering = ["name"]


class UserProfile(TimeStampedModel):
    """Extended profile for Django auth.User."""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    phone = models.CharField(max_length=50, blank=True)
    department = models.CharField(max_length=100, blank=True)
    is_force_password_change = models.BooleanField(default=False)

    def __str__(self) -> str:
        return f"{self.user.username} ({self.role})"


class AuditLog(models.Model):
    """System-wide audit log for all CRUD operations."""

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(
        max_length=20,
        choices=[
            ("CREATE", "Create"),
            ("UPDATE", "Update"),
            ("DELETE", "Delete"),
            ("LOGIN", "Login"),
            ("LOGOUT", "Logout"),
            ("IMPERSONATE", "Impersonate"),
        ],
    )
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=50, blank=True)
    object_repr = models.CharField(max_length=200, blank=True)
    changes = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["model_name"]),
            models.Index(fields=["timestamp"]),
        ]

    def __str__(self) -> str:
        return f"{self.action} on {self.model_name} by {self.user} at {self.timestamp}"


class PasswordResetToken(models.Model):
    """Single-use token for self-service password reset."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="password_reset_tokens")
    token = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    def is_valid(self) -> bool:
        """Return True if the token has not been used and has not expired."""
        return not self.is_used and self.expires_at > timezone.now()

    def __str__(self) -> str:
        return f"PasswordResetToken for {self.user.username} (used={self.is_used})"

    class Meta:
        ordering = ["-expires_at"]
        indexes = [
            models.Index(fields=["token"]),
            models.Index(fields=["user"]),
        ]
