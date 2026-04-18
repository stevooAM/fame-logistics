from django.urls import path
from .views import CustomerActivityView, JobStatusView, RevenueView

urlpatterns = [
    path("customer-activity/", CustomerActivityView.as_view(), name="report_customer_activity"),
    path("job-status/", JobStatusView.as_view(), name="report_job_status"),
    path("revenue/", RevenueView.as_view(), name="report_revenue"),
]
