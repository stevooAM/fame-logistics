from django.conf import settings
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("api/", include("core.urls")),
    path("api/setup/", include("setup.urls")),
    path("api/customers/", include("customers.urls")),
    path("api/jobs/", include("jobs.urls")),
    path("api/approvals/", include("approvals.urls")),
    path("api/accounts/", include("accounts.urls")),
    path("api/reports/", include("reports.urls")),
]

if getattr(settings, "DJANGO_ADMIN_ENABLED", False):
    urlpatterns.insert(0, path("admin/", admin.site.urls))
