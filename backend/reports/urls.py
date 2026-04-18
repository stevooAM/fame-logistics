from django.urls import path

from .views import (
    CustomerActivityExportView,
    CustomerActivityView,
    JobStatusExportView,
    JobStatusView,
    RevenueExportView,
    RevenueView,
)

urlpatterns = [
    path("customer-activity/", CustomerActivityView.as_view(), name="report_customer_activity"),
    path("customer-activity/export/", CustomerActivityExportView.as_view(), name="report_customer_activity_export"),
    path("job-status/", JobStatusView.as_view(), name="report_job_status"),
    path("job-status/export/", JobStatusExportView.as_view(), name="report_job_status_export"),
    path("revenue/", RevenueView.as_view(), name="report_revenue"),
    path("revenue/export/", RevenueExportView.as_view(), name="report_revenue_export"),
]
