"""
Job ViewSet — full CRUD with status transitions, document management,
server-side pagination, search/filtering, and audit trail.

Permission: IsAdminOrOperations by default.
            Finance (IsAnyRole) can read: list, retrieve, audit_trail, list_documents.
Audit:      AuditLogMixin auto-logs CREATE/UPDATE; status transitions and
            document operations log to JobAuditTrail directly.
Pagination: 20 per page (page_size_query_param allows override up to 100).
"""

import logging
import uuid
from datetime import timedelta

from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from core.audit import AuditLogMixin
from core.permissions import IsAdminOrOperations, IsAnyRole

from .models import Job, JobAuditTrail, JobDocument, JobStatus
from .serializers import (
    JobAuditTrailSerializer,
    JobDocumentSerializer,
    JobListSerializer,
    JobSerializer,
    StatusTransitionSerializer,
)
from .storage import StorageError, get_presigned_url, upload_document

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Status transition constants
# ---------------------------------------------------------------------------

#: Ordered list of forward-progression statuses (terminal statuses excluded)
_STATUS_ORDER = [
    JobStatus.DRAFT,
    JobStatus.PENDING,
    JobStatus.IN_PROGRESS,
    JobStatus.CUSTOMS,
    JobStatus.DELIVERED,
    JobStatus.CLOSED,
]

#: Allowed transitions map: current_status -> list of valid next statuses
_ALLOWED_TRANSITIONS: dict[str, list[str]] = {
    JobStatus.DRAFT: [JobStatus.PENDING, JobStatus.CANCELLED],
    JobStatus.PENDING: [JobStatus.IN_PROGRESS, JobStatus.CANCELLED],
    JobStatus.IN_PROGRESS: [JobStatus.CUSTOMS, JobStatus.CANCELLED],
    JobStatus.CUSTOMS: [JobStatus.DELIVERED, JobStatus.CANCELLED],
    JobStatus.DELIVERED: [JobStatus.CLOSED, JobStatus.CANCELLED],
    JobStatus.CLOSED: [],
    JobStatus.CANCELLED: [],
}

#: Allowed ordering fields — prefix with "-" for descending
_ALLOWED_ORDERING = {
    "job_number",
    "-job_number",
    "created_at",
    "-created_at",
    "status",
    "-status",
    "customer__company_name",
    "-customer__company_name",
    "total_cost",
    "-total_cost",
}


# ---------------------------------------------------------------------------
# Pagination
# ---------------------------------------------------------------------------


class JobPagination(PageNumberPagination):
    """Server-side pagination for job list — 20 records per page by default."""

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


# ---------------------------------------------------------------------------
# ViewSet
# ---------------------------------------------------------------------------


class JobViewSet(AuditLogMixin, ModelViewSet):
    """
    Full CRUD ViewSet for freight job records.

    list:             paginated, filtered, sortable
    retrieve:         single job with nested FK detail
    create:           creates job with auto job_number, audit-logs
    update/partial:   update and audit-logs
    destroy:          405 — deletion is not permitted (use CANCELLED status)
    transition:       PATCH /{id}/transition/ — role-based status transitions
    audit_trail:      GET /{id}/audit-trail/ — paginated audit entries
    upload_document:  POST /{id}/documents/upload/ — multipart file upload
    list_documents:   GET /{id}/documents/ — all docs with presigned URLs
    delete_document:  DELETE /{id}/documents/{doc_id}/ — remove a document
    """

    permission_classes = [IsAdminOrOperations]
    pagination_class = JobPagination

    def get_permissions(self):
        """
        Override permissions per action.

        Finance role (IsAnyRole) can read jobs and documents.
        All write/mutation actions require IsAdminOrOperations.
        """
        read_only_actions = {"list", "retrieve", "audit_trail", "list_documents"}
        if self.action in read_only_actions:
            return [IsAnyRole()]
        return [IsAdminOrOperations()]

    def get_queryset(self):
        """
        Build and filter the base queryset with select_related for FK joins.

        Supports:
          search          OR across job_number, customer company name, cargo
                          description, bill_of_lading, container_number
          status          exact match on JobStatus
          job_type        exact match on JobType
          customer_id     exact FK match
          customer_name   icontains on customer__company_name
          assigned_to     exact FK match
          date_from       created_at >= date
          date_to         created_at < date + 1 day (inclusive)
          ordering        allowed column (with optional - prefix)
        """
        qs = (
            Job.objects.select_related("customer", "assigned_to", "created_by")
            .all()
            .order_by("-created_at")
        )

        params = self.request.query_params

        # ---- Search --------------------------------------------------------
        search = params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(job_number__icontains=search)
                | Q(customer__company_name__icontains=search)
                | Q(cargo_description__icontains=search)
                | Q(bill_of_lading__icontains=search)
                | Q(container_number__icontains=search)
            )

        # ---- Exact filters -------------------------------------------------
        job_status = params.get("status", "").strip()
        if job_status:
            qs = qs.filter(status=job_status)

        job_type = params.get("job_type", "").strip()
        if job_type:
            qs = qs.filter(job_type=job_type)

        customer_id = params.get("customer_id", "").strip()
        if customer_id:
            try:
                qs = qs.filter(customer_id=int(customer_id))
            except (ValueError, TypeError):
                pass  # Malformed param — silently ignore

        customer_name = params.get("customer_name", "").strip()
        if customer_name:
            qs = qs.filter(customer__company_name__icontains=customer_name)

        assigned_to = params.get("assigned_to", "").strip()
        if assigned_to:
            try:
                qs = qs.filter(assigned_to_id=int(assigned_to))
            except (ValueError, TypeError):
                pass  # Malformed param — silently ignore

        # ---- Date range filters --------------------------------------------
        date_from = params.get("date_from", "").strip()
        if date_from:
            try:
                qs = qs.filter(created_at__date__gte=date_from)
            except (ValueError, TypeError):
                pass  # Malformed date — silently ignore

        date_to = params.get("date_to", "").strip()
        if date_to:
            try:
                # Add one day and use __lt for inclusive end-of-day matching
                from datetime import date as date_type

                end_date = date_type.fromisoformat(date_to) + timedelta(days=1)
                qs = qs.filter(created_at__lt=end_date)
            except (ValueError, TypeError):
                pass  # Malformed date — silently ignore

        # ---- Ordering ------------------------------------------------------
        ordering = params.get("ordering", "").strip()
        if ordering in _ALLOWED_ORDERING:
            qs = qs.order_by(ordering)

        return qs

    def get_serializer_class(self):
        """Use lighter ListSerializer for list action; full serializer elsewhere."""
        if self.action == "list":
            return JobListSerializer
        return JobSerializer

    # -----------------------------------------------------------------------
    # Create override
    # -----------------------------------------------------------------------

    def perform_create(self, serializer):
        """
        Save the job with created_by set to the current user.

        Overrides AuditLogMixin.perform_create to avoid double-logging —
        the mixin's perform_create would call _log_action automatically,
        but we need to also create the JobAuditTrail entry, so we bypass
        the mixin and call ModelViewSet.perform_create directly.
        """
        # Bypass AuditLogMixin.perform_create to prevent double-logging.
        # Call serializer.save() directly with created_by so the field is set.
        serializer.save(created_by=self.request.user)
        job = serializer.instance
        self._log_action(self.request, "CREATE", job)
        JobAuditTrail.objects.create(
            job=job,
            user=self.request.user,
            action="CREATED",
            old_value="",
            new_value=job.status,
        )

    # -----------------------------------------------------------------------
    # Destroy override — hard deletion not permitted
    # -----------------------------------------------------------------------

    def destroy(self, request, *args, **kwargs):
        """Return 405 — jobs must use CANCELLED status instead of deletion."""
        return Response(
            {"detail": "Job deletion is not permitted. Use status CANCELLED instead."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    # -----------------------------------------------------------------------
    # Custom action: status transition
    # -----------------------------------------------------------------------

    @action(detail=True, methods=["patch"], url_path="transition")
    def transition_status(self, request, pk=None):
        """
        PATCH /api/jobs/{id}/transition/

        Transitions a job to a new status following the allowed transitions
        map. Reversal (moving backwards in the status order) requires Admin.

        Request body:
          { "new_status": "PENDING", "reason": "optional note" }

        Returns the updated Job (JobSerializer).
        """
        job = self.get_object()
        serializer = StatusTransitionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        new_status = serializer.validated_data["new_status"]
        reason = serializer.validated_data.get("reason", "")
        old_status = job.status

        # Validate the transition is allowed
        allowed = _ALLOWED_TRANSITIONS.get(old_status, [])
        if new_status not in allowed:
            return Response(
                {
                    "detail": f"Cannot transition from {old_status} to {new_status}.",
                    "allowed_transitions": allowed,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check for reversal (moving backwards in status order)
        is_reversal = (
            new_status in _STATUS_ORDER
            and old_status in _STATUS_ORDER
            and _STATUS_ORDER.index(new_status) < _STATUS_ORDER.index(old_status)
        )
        if is_reversal:
            try:
                role_name = request.user.profile.role.name
            except AttributeError:
                role_name = ""
            if role_name != "Admin":
                return Response(
                    {"detail": "Status reversal is restricted to Admin users."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        # Apply transition
        job.status = new_status
        job.save(update_fields=["status", "updated_at"])

        # Log to job audit trail
        JobAuditTrail.objects.create(
            job=job,
            user=request.user,
            action="STATUS_CHANGED",
            old_value=old_status,
            new_value=new_status,
        )

        # Log to central audit log
        self._log_action(
            request,
            "UPDATE",
            job,
            description=f"Status transition: {old_status} → {new_status}. {reason}".strip(
                ". "
            ),
        )

        output_serializer = JobSerializer(job, context={"request": request})
        return Response(output_serializer.data, status=status.HTTP_200_OK)

    # -----------------------------------------------------------------------
    # Custom action: audit trail
    # -----------------------------------------------------------------------

    @action(detail=True, methods=["get"], url_path="audit-trail")
    def audit_trail(self, request, pk=None):
        """
        GET /api/jobs/{id}/audit-trail/

        Returns a paginated list of JobAuditTrail entries for this job,
        ordered by most-recent first.

        Permission: IsAnyRole (Finance can view).
        """
        job = self.get_object()
        trail_qs = JobAuditTrail.objects.filter(job=job).select_related("user").order_by(
            "-created_at"
        )

        paginator = JobPagination()
        page = paginator.paginate_queryset(trail_qs, request)
        if page is not None:
            serializer = JobAuditTrailSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = JobAuditTrailSerializer(trail_qs, many=True)
        return Response(serializer.data)

    # -----------------------------------------------------------------------
    # Custom action: upload document
    # -----------------------------------------------------------------------

    @action(detail=True, methods=["post"], url_path="documents/upload")
    def upload_document(self, request, pk=None):
        """
        POST /api/jobs/{id}/documents/upload/

        Accepts multipart/form-data with:
          file          — the file to upload
          document_type — integer PK of a DocumentType

        Enforces a maximum of 20 documents per job.
        Returns the created JobDocument (JobDocumentSerializer), status 201.

        On StorageError: returns 500.
        """
        job = self.get_object()

        # Max 20 documents per job
        existing_count = JobDocument.objects.filter(job=job).count()
        if existing_count >= 20:
            return Response(
                {"detail": "Maximum of 20 documents per job has been reached."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            return Response(
                {"detail": "No file provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        document_type_id = request.data.get("document_type")

        # Generate a unique storage key
        unique_id = uuid.uuid4().hex
        original_name = uploaded_file.name or "document"
        key = f"jobs/{job.id}/documents/{unique_id}_{original_name}"

        try:
            storage_key = upload_document(uploaded_file, key)
        except StorageError as exc:
            logger.exception("Document upload failed for job %s: %s", job.pk, exc)
            return Response(
                {"detail": "Document upload to cloud storage failed."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Create JobDocument record
        doc = JobDocument.objects.create(
            job=job,
            document_type_id=document_type_id if document_type_id else None,
            file_name=original_name,
            file_url=storage_key,
            file_size=uploaded_file.size,
            uploaded_by=request.user,
        )

        # Audit trail
        JobAuditTrail.objects.create(
            job=job,
            user=request.user,
            action="DOCUMENT_UPLOADED",
            old_value="",
            new_value=original_name,
        )

        serializer = JobDocumentSerializer(doc, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    # -----------------------------------------------------------------------
    # Custom action: list documents
    # -----------------------------------------------------------------------

    @action(detail=True, methods=["get"], url_path="documents")
    def list_documents(self, request, pk=None):
        """
        GET /api/jobs/{id}/documents/

        Returns all documents for this job with presigned download URLs
        injected into each record.

        Permission: IsAnyRole.
        """
        job = self.get_object()
        docs = (
            JobDocument.objects.filter(job=job)
            .select_related("document_type", "uploaded_by")
            .order_by("-created_at")
        )

        serializer = JobDocumentSerializer(docs, many=True, context={"request": request})
        data = serializer.data

        # Inject presigned URLs for each document
        for item, doc in zip(data, docs):
            try:
                item["presigned_url"] = get_presigned_url(doc.file_url)
            except StorageError:
                item["presigned_url"] = None

        return Response(data)

    # -----------------------------------------------------------------------
    # Custom action: delete document
    # -----------------------------------------------------------------------

    @action(
        detail=True,
        methods=["delete"],
        url_path=r"documents/(?P<doc_id>[0-9]+)",
    )
    def delete_document(self, request, pk=None, doc_id=None):
        """
        DELETE /api/jobs/{id}/documents/{doc_id}/

        Removes a specific document from a job. Calls storage.delete_document()
        (non-raising on failure) then deletes the DB record.

        Permission: IsAdminOrOperations.
        """
        job = self.get_object()

        try:
            doc = JobDocument.objects.get(pk=doc_id, job=job)
        except JobDocument.DoesNotExist:
            return Response(
                {"detail": "Document not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        file_name = doc.file_name
        storage_key = doc.file_url

        # Delete from cloud storage (non-raising)
        from .storage import delete_document as _delete_storage_doc

        _delete_storage_doc(storage_key)

        # Delete DB record
        doc.delete()

        # Audit trail
        JobAuditTrail.objects.create(
            job=job,
            user=request.user,
            action="DOCUMENT_DELETED",
            old_value=file_name,
            new_value="",
        )

        return Response(status=status.HTTP_204_NO_CONTENT)
