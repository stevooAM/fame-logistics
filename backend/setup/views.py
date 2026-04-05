"""
ViewSets and API views for Setup / Lookup CRUD.

Permission matrix:
  Admin-only CRUD:  Port, CargoType, Currency, DocumentType, CompanyProfile
  All roles read:   LookupDropdownView (/api/setup/dropdowns/)

Soft-delete: destroy() sets is_active=False instead of hard-deleting.
Audit logging: inline AuditLog.objects.create() calls (AuditLogMixin
from core.audit is not yet available at this phase).
"""

import logging

from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from core.models import AuditLog
from core.permissions import IsAdmin, IsAnyRole

from .models import CargoType, CompanyProfile, Currency, DocumentType, Port
from .serializers import (
    CargoTypeSerializer,
    CompanyProfileSerializer,
    CurrencySerializer,
    DocumentTypeSerializer,
    PortSerializer,
)

logger = logging.getLogger(__name__)


def _get_client_ip(request) -> str | None:
    """Extract client IP from request, honouring X-Forwarded-For."""
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def _log_audit(request, action: str, obj) -> None:
    """Create an AuditLog entry for the given CRUD action on obj."""
    try:
        AuditLog.objects.create(
            user=request.user if request.user.is_authenticated else None,
            action=action,
            model_name=obj.__class__.__name__,
            object_id=str(obj.pk),
            object_repr=str(obj),
            ip_address=_get_client_ip(request),
        )
    except Exception:
        logger.exception("Failed to write audit log for %s %s", action, obj)


# ---------------------------------------------------------------------------
# Base mixin for lookup viewsets
# ---------------------------------------------------------------------------

class LookupViewSetMixin:
    """
    Shared behaviour for all lookup table ViewSets:
      - Default queryset returns only active records.
      - ?include_inactive=true includes deactivated entries (admin UI).
      - destroy() soft-deletes by setting is_active=False.
      - Audit logs CREATE, UPDATE, DELETE actions.
    """

    def get_queryset(self):
        qs = self.queryset.all()
        if self.request.query_params.get("include_inactive", "").lower() == "true":
            return qs
        return qs.filter(is_active=True)

    def perform_create(self, serializer):
        obj = serializer.save()
        _log_audit(self.request, "CREATE", obj)

    def perform_update(self, serializer):
        obj = serializer.save()
        _log_audit(self.request, "UPDATE", obj)

    def destroy(self, request, *args, **kwargs):
        """Soft-delete: set is_active=False, return 200 with updated object."""
        instance = self.get_object()
        instance.is_active = False
        instance.save(update_fields=["is_active", "updated_at"])
        _log_audit(request, "DELETE", instance)
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Lookup ViewSets
# ---------------------------------------------------------------------------

class PortViewSet(LookupViewSetMixin, ModelViewSet):
    """CRUD for Port lookup table."""

    queryset = Port.objects.all()
    serializer_class = PortSerializer
    permission_classes = [IsAdmin]


class CargoTypeViewSet(LookupViewSetMixin, ModelViewSet):
    """CRUD for CargoType lookup table."""

    queryset = CargoType.objects.all()
    serializer_class = CargoTypeSerializer
    permission_classes = [IsAdmin]


class CurrencyViewSet(LookupViewSetMixin, ModelViewSet):
    """CRUD for Currency lookup table."""

    queryset = Currency.objects.all()
    serializer_class = CurrencySerializer
    permission_classes = [IsAdmin]


class DocumentTypeViewSet(LookupViewSetMixin, ModelViewSet):
    """CRUD for DocumentType lookup table."""

    queryset = DocumentType.objects.all()
    serializer_class = DocumentTypeSerializer
    permission_classes = [IsAdmin]


# ---------------------------------------------------------------------------
# Company Profile (singleton)
# ---------------------------------------------------------------------------

class CompanyProfileView(APIView):
    """
    Singleton company profile endpoint.

    GET  /api/setup/company-profile/ — fetch (creates with defaults if absent)
    PATCH /api/setup/company-profile/ — update

    Logo upload requires multipart/form-data.
    """

    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def _get_or_create_profile(self):
        profile, created = CompanyProfile.objects.get_or_create(
            pk=CompanyProfile.objects.values_list("pk", flat=True).first() or 1,
            defaults={"name": "Fame Logistics"},
        )
        if not profile.pk:
            # Fallback: if get_or_create didn't find/create, create fresh
            profile = CompanyProfile.objects.first()
            if not profile:
                profile = CompanyProfile.objects.create(name="Fame Logistics")
        return profile

    def get(self, request):
        profile = CompanyProfile.objects.first()
        if not profile:
            profile = CompanyProfile.objects.create(name="Fame Logistics")
        serializer = CompanyProfileSerializer(profile, context={"request": request})
        return Response(serializer.data)

    def patch(self, request):
        profile = CompanyProfile.objects.first()
        if not profile:
            profile = CompanyProfile.objects.create(name="Fame Logistics")

        serializer = CompanyProfileSerializer(
            profile,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        obj = serializer.save()
        _log_audit(request, "UPDATE", obj)
        return Response(serializer.data)


# ---------------------------------------------------------------------------
# Dropdown aggregation endpoint
# ---------------------------------------------------------------------------

class LookupDropdownView(APIView):
    """
    GET /api/setup/dropdowns/

    Returns all active lookup values in a single response, avoiding
    4 separate API calls when loading a form.

    Accessible by all roles (IsAnyRole).
    """

    permission_classes = [IsAnyRole]

    def get(self, request):
        data = {
            "ports": PortSerializer(
                Port.objects.filter(is_active=True), many=True
            ).data,
            "cargo_types": CargoTypeSerializer(
                CargoType.objects.filter(is_active=True), many=True
            ).data,
            "currencies": CurrencySerializer(
                Currency.objects.filter(is_active=True), many=True
            ).data,
            "document_types": DocumentTypeSerializer(
                DocumentType.objects.filter(is_active=True), many=True
            ).data,
        }
        return Response(data)
