from django.contrib import admin

from .models import AuditLog, Role, UserProfile


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ["name", "description"]


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "role", "is_active", "phone", "department"]
    list_filter = ["role", "is_active"]


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ["user", "action", "model_name", "object_repr", "timestamp"]
    list_filter = ["action", "model_name"]
    readonly_fields = ["user", "action", "model_name", "object_id", "object_repr", "changes", "ip_address", "timestamp"]
