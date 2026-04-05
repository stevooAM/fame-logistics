from django.contrib import admin

from .models import Job, JobAuditTrail, JobDocument


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ["job_number", "customer", "job_type", "status", "created_at"]
    list_filter = ["job_type", "status"]
    search_fields = ["job_number", "customer__company_name", "bill_of_lading"]


@admin.register(JobAuditTrail)
class JobAuditTrailAdmin(admin.ModelAdmin):
    list_display = ["job", "user", "action", "created_at"]
    list_filter = ["action"]


@admin.register(JobDocument)
class JobDocumentAdmin(admin.ModelAdmin):
    list_display = ["job", "file_name", "document_type", "uploaded_by", "created_at"]
