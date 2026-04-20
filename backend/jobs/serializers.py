"""
Serializers for the Job model and related models.

Five serializers are provided:
  - JobListSerializer:       lightweight payload for AG Grid list view
  - JobSerializer:           full CRUD payload for create/edit/detail
  - JobDocumentSerializer:   document attachment representation
  - StatusTransitionSerializer: validates status transition requests
  - JobAuditTrailSerializer: read-only audit trail timeline
"""

from rest_framework import serializers

from approvals.models import ApprovalQueue
from .models import Job, JobAuditTrail, JobDocument, JobStatus


class JobListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for AG Grid list view.

    Returns flat fields plus denormalised customer name and assignee name
    to avoid N+1 join overhead in large grids.
    All fields are read-only.
    """

    customer_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = [
            "id",
            "job_number",
            "customer",
            "customer_name",
            "status",
            "job_type",
            "cargo_description",
            "eta",
            "delivery_date",
            "assigned_to",
            "assigned_to_name",
            "total_cost",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "job_number",
            "customer",
            "customer_name",
            "status",
            "job_type",
            "cargo_description",
            "eta",
            "delivery_date",
            "assigned_to",
            "assigned_to_name",
            "total_cost",
            "created_at",
        ]

    def get_customer_name(self, obj) -> str | None:
        """Return customer.company_name or None."""
        if obj.customer_id is not None:
            return obj.customer.company_name if obj.customer else None
        return None

    def get_assigned_to_name(self, obj) -> str | None:
        """Return assignee full name, falling back to username, or None."""
        if obj.assigned_to_id is not None and obj.assigned_to:
            full_name = obj.assigned_to.get_full_name()
            return full_name if full_name else obj.assigned_to.username
        return None


class JobSerializer(serializers.ModelSerializer):
    """
    Full serializer for job create/edit/detail operations.

    Write:  customer and assigned_to accept integer PKs.
    Read:   to_representation injects nested customer_detail and
            assigned_to_detail objects for rich detail views.
    """

    customer_name = serializers.SerializerMethodField(read_only=True)
    assigned_to_name = serializers.SerializerMethodField(read_only=True)
    rejection_reason = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Job
        fields = [
            "id",
            "job_number",
            "customer",
            "customer_name",
            "job_type",
            "status",
            "origin",
            "destination",
            "cargo_description",
            "bill_of_lading",
            "container_number",
            "weight_kg",
            "volume_cbm",
            "total_cost",
            "notes",
            "eta",
            "delivery_date",
            "assigned_to",
            "assigned_to_name",
            "created_by",
            "created_at",
            "updated_at",
            "rejection_reason",
        ]
        read_only_fields = ["id", "job_number", "created_at", "updated_at", "created_by", "rejection_reason"]
        extra_kwargs = {
            "assigned_to": {"allow_null": True, "required": False},
        }

    def get_customer_name(self, obj) -> str | None:
        """Return customer.company_name or None."""
        if obj.customer_id is not None:
            return obj.customer.company_name if obj.customer else None
        return None

    def get_assigned_to_name(self, obj) -> str | None:
        """Return assignee full name, falling back to username, or None."""
        if obj.assigned_to_id is not None and obj.assigned_to:
            full_name = obj.assigned_to.get_full_name()
            return full_name if full_name else obj.assigned_to.username
        return None

    def get_rejection_reason(self, obj) -> str | None:
        """Return the rejection reason from the most recent rejected ApprovalQueue entry."""
        latest = (
            obj.approval_requests
            .filter(status=ApprovalQueue.REJECTED)
            .order_by("-created_at")
            .values_list("rejection_reason", flat=True)
            .first()
        )
        return latest if latest else None

    def validate_cargo_description(self, value):
        """Cargo description must not be blank."""
        if not value or not value.strip():
            raise serializers.ValidationError("Cargo description is required.")
        return value

    def validate_bill_of_lading(self, value):
        """Bill of lading must not be blank."""
        if not value or not value.strip():
            raise serializers.ValidationError("Bill of lading is required.")
        return value

    def validate_container_number(self, value):
        """Container number must not be blank."""
        if not value or not value.strip():
            raise serializers.ValidationError("Container number is required.")
        return value

    def validate_weight_kg(self, value):
        """Weight must not be null."""
        if value is None:
            raise serializers.ValidationError("Weight (kg) is required.")
        return value

    def validate_volume_cbm(self, value):
        """Volume must not be null."""
        if value is None:
            raise serializers.ValidationError("Volume (CBM) is required.")
        return value

    def validate_total_cost(self, value):
        """Total cost must not be null."""
        if value is None:
            raise serializers.ValidationError("Total cost is required.")
        return value

    def to_representation(self, instance):
        """
        Augment with nested FK detail objects for rich detail views.

        Appends customer_detail and assigned_to_detail after standard
        field serialisation so write fields remain integer PKs for
        POST/PATCH consumers.
        """
        data = super().to_representation(instance)

        # Nested customer detail
        customer = instance.customer
        if customer is not None:
            data["customer_detail"] = {
                "id": customer.id,
                "company_name": customer.company_name,
            }
        else:
            data["customer_detail"] = None

        # Nested assigned_to detail
        assigned_to = instance.assigned_to
        if assigned_to is not None:
            data["assigned_to_detail"] = {
                "id": assigned_to.id,
                "username": assigned_to.username,
                "full_name": assigned_to.get_full_name(),
            }
        else:
            data["assigned_to_detail"] = None

        return data


class JobDocumentSerializer(serializers.ModelSerializer):
    """
    Serializer for job document attachments.

    Read:  document_type_name, uploaded_by_name are denormalised.
    Write: document_type accepts integer PK; file_url/file_size/uploaded_by
           are set by the upload view and are read-only here.
    """

    document_type_name = serializers.SerializerMethodField(read_only=True)
    uploaded_by_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = JobDocument
        fields = [
            "id",
            "job",
            "document_type",
            "document_type_name",
            "file_name",
            "file_url",
            "file_size",
            "uploaded_by",
            "uploaded_by_name",
            "created_at",
        ]
        read_only_fields = ["id", "job", "file_url", "file_size", "uploaded_by", "created_at"]

    def get_document_type_name(self, obj) -> str | None:
        """Return the document type name or None."""
        if obj.document_type_id is not None and obj.document_type:
            return getattr(obj.document_type, "name", None)
        return None

    def get_uploaded_by_name(self, obj) -> str | None:
        """Return uploader full name, falling back to username, or None."""
        if obj.uploaded_by_id is not None and obj.uploaded_by:
            full_name = obj.uploaded_by.get_full_name()
            return full_name if full_name else obj.uploaded_by.username
        return None


class StatusTransitionSerializer(serializers.Serializer):
    """
    Validates a status transition request.

    Fields:
      new_status: target JobStatus choice (required)
      reason:     optional free-text reason for the transition
    """

    new_status = serializers.ChoiceField(choices=JobStatus.choices)
    reason = serializers.CharField(required=False, allow_blank=True, default="")


class JobAuditTrailSerializer(serializers.ModelSerializer):
    """
    Read-only serializer for the job audit trail timeline.
    """

    user_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = JobAuditTrail
        fields = [
            "id",
            "action",
            "old_value",
            "new_value",
            "user",
            "user_name",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "action",
            "old_value",
            "new_value",
            "user",
            "user_name",
            "created_at",
        ]

    def get_user_name(self, obj) -> str | None:
        """Return the acting user's full name, falling back to username."""
        if obj.user_id is not None and obj.user:
            full_name = obj.user.get_full_name()
            return full_name if full_name else obj.user.username
        return None
