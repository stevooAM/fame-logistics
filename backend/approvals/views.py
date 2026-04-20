from datetime import date, timedelta

from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from core.permissions import IsAdmin, IsAdminOrOperations
from jobs.models import JobAuditTrail, JobStatus
from .models import ApprovalHistory, ApprovalQueue
from .serializers import (
    ApprovalActionSerializer,
    ApprovalHistorySerializer,
    ApprovalQueueSerializer,
)


class ApprovalViewSet(ListModelMixin, RetrieveModelMixin, GenericViewSet):
    permission_classes = [IsAdminOrOperations]
    serializer_class = ApprovalQueueSerializer

    def get_queryset(self):
        return (
            ApprovalQueue.objects.filter(status=ApprovalQueue.PENDING)
            .select_related(
                "job",
                "job__customer",
                "submitted_by",
                "submitted_by__profile",
            )
            .order_by("-created_at")
        )

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        approval = self.get_object()
        if not approval.is_pending:
            return Response({"detail": "Already actioned."}, status=400)

        ser = ApprovalActionSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        comment = ser.validated_data.get("reason", "")

        approval.status = ApprovalQueue.APPROVED
        approval.reviewed_by = request.user
        approval.reviewed_at = timezone.now()
        approval.save(update_fields=["status", "reviewed_by", "reviewed_at", "updated_at"])

        job = approval.job
        old_status = job.status
        job.status = JobStatus.IN_PROGRESS
        job.save(update_fields=["status", "updated_at"])

        ApprovalHistory.objects.create(
            approval=approval,
            action=ApprovalHistory.APPROVED,
            actor=request.user,
            comment=comment,
        )

        JobAuditTrail.objects.create(
            job=job,
            user=request.user,
            action="STATUS_CHANGE",
            old_value=old_status,
            new_value=JobStatus.IN_PROGRESS,
        )

        return Response(ApprovalQueueSerializer(approval).data, status=200)

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        approval = self.get_object()
        if not approval.is_pending:
            return Response({"detail": "Already actioned."}, status=400)

        ser = ApprovalActionSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        reason = ser.validated_data.get("reason", "").strip()
        if not reason:
            return Response({"reason": ["A rejection reason is required."]}, status=400)

        approval.status = ApprovalQueue.REJECTED
        approval.reviewed_by = request.user
        approval.reviewed_at = timezone.now()
        approval.rejection_reason = reason
        approval.save(
            update_fields=["status", "reviewed_by", "reviewed_at", "rejection_reason", "updated_at"]
        )

        job = approval.job
        old_status = job.status
        job.status = JobStatus.DRAFT
        job.save(update_fields=["status", "updated_at"])

        ApprovalHistory.objects.create(
            approval=approval,
            action=ApprovalHistory.REJECTED,
            actor=request.user,
            comment=reason,
        )

        JobAuditTrail.objects.create(
            job=job,
            user=request.user,
            action="STATUS_CHANGE",
            old_value=old_status,
            new_value=JobStatus.DRAFT,
        )

        return Response(ApprovalQueueSerializer(approval).data, status=200)

    @action(
        detail=False,
        methods=["get"],
        url_path="history",
        permission_classes=[IsAdmin],
    )
    def history(self, request):
        qs = ApprovalHistory.objects.select_related(
            "approval__job", "actor", "actor__profile"
        ).order_by("-created_at")

        job_number = request.query_params.get("job_number", "").strip()
        if job_number:
            qs = qs.filter(approval__job__job_number__icontains=job_number)

        date_from = request.query_params.get("date_from", "")
        date_to = request.query_params.get("date_to", "")
        if date_from:
            try:
                qs = qs.filter(created_at__date__gte=date.fromisoformat(date_from))
            except ValueError:
                pass
        if date_to:
            try:
                qs = qs.filter(
                    created_at__lt=date.fromisoformat(date_to) + timedelta(days=1)
                )
            except ValueError:
                pass

        action_filter = request.query_params.get("action", "").upper()
        if action_filter in [
            ApprovalHistory.SUBMITTED,
            ApprovalHistory.APPROVED,
            ApprovalHistory.REJECTED,
        ]:
            qs = qs.filter(action=action_filter)

        return Response(ApprovalHistorySerializer(qs, many=True).data)

    @action(detail=False, methods=["get"], url_path="pending-count")
    def pending_count(self, request):
        count = ApprovalQueue.objects.filter(status=ApprovalQueue.PENDING).count()
        return Response({"count": count})
