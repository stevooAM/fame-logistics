from django.contrib import admin
from .models import ApprovalHistory, ApprovalQueue


@admin.register(ApprovalQueue)
class ApprovalQueueAdmin(admin.ModelAdmin):
    list_display = ["job", "status", "submitted_by", "reviewed_by", "reviewed_at", "created_at"]
    list_filter = ["status"]
    search_fields = ["job__job_number"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(ApprovalHistory)
class ApprovalHistoryAdmin(admin.ModelAdmin):
    list_display = ["approval", "action", "actor", "created_at"]
    list_filter = ["action"]
    readonly_fields = ["created_at", "updated_at"]
