from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r"ports", views.PortViewSet, basename="port")
router.register(r"cargo-types", views.CargoTypeViewSet, basename="cargo-type")
router.register(r"currencies", views.CurrencyViewSet, basename="currency")
router.register(r"document-types", views.DocumentTypeViewSet, basename="document-type")

urlpatterns = [
    path("", include(router.urls)),
    path("company-profile/", views.CompanyProfileView.as_view(), name="company-profile"),
    path("dropdowns/", views.LookupDropdownView.as_view(), name="lookup-dropdowns"),
]
