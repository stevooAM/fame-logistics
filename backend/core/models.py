from django.contrib.auth.models import User
from django.db import models


class TimeStampedModel(models.Model):
    """Abstract base model with created_at and updated_at timestamps."""

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Role(TimeStampedModel):
    """User roles for RBAC."""

    ADMIN = "Admin"
    MANAGER = "Manager"
    OPERATIONS = "Operations"
    FINANCE = "Finance"
    VIEWER = "Viewer"

    ROLE_CHOICES = [
        (ADMIN, "Admin"),
        (MANAGER, "Manager"),
        (OPERATIONS, "Operations"),
        (FINANCE, "Finance"),
        (VIEWER, "Viewer"),
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
