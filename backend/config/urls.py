from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("core.urls")),
    path("api/setup/", include("setup.urls")),
    path("api/customers/", include("customers.urls")),
    path("api/jobs/", include("jobs.urls")),
    path("api/approvals/", include("approvals.urls")),
    path("api/accounts/", include("accounts.urls")),
]
