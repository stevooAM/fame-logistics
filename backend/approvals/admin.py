from django.contrib import admin
from .models import ApprovalQueue, ApprovalHistory


@admin.register(ApprovalQueue)
class ApprovalQueueAdmin(admin.ModelAdmin):
    list_display = ["job", "submitted_by", "status", "reviewed_by", "reviewed_at"]
    list_filter = ["status"]


@admin.register(ApprovalHistory)
class ApprovalHistoryAdmin(admin.ModelAdmin):
    list_display = ["approval", "action", "actor", "created_at"]
    list_filter = ["action"]
