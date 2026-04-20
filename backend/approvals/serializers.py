from rest_framework import serializers
from .models import ApprovalQueue, ApprovalHistory


class ApprovalQueueSerializer(serializers.ModelSerializer):
    job = serializers.SerializerMethodField()
    submitted_by = serializers.SerializerMethodField()

    class Meta:
        model = ApprovalQueue
        fields = ["id", "job", "submitted_by", "status", "created_at"]
        read_only_fields = ["id", "job", "submitted_by", "status", "created_at"]

    def get_job(self, obj):
        job = obj.job
        return {
            "job_number": job.job_number,
            "customer_name": job.customer.company_name if job.customer else None,
            "job_type": job.job_type,
            "eta": job.eta,
        }

    def get_submitted_by(self, obj):
        user = obj.submitted_by
        if user is None:
            return None
        full_name = ""
        try:
            full_name = user.profile.full_name
        except Exception:
            pass
        return {
            "username": user.username,
            "full_name": full_name,
        }


class ApprovalHistorySerializer(serializers.ModelSerializer):
    job_number = serializers.SerializerMethodField()
    actor = serializers.SerializerMethodField()

    class Meta:
        model = ApprovalHistory
        fields = ["id", "job_number", "action", "actor", "comment", "created_at"]
        read_only_fields = ["id", "job_number", "action", "actor", "comment", "created_at"]

    def get_job_number(self, obj):
        try:
            return obj.approval.job.job_number
        except Exception:
            return None

    def get_actor(self, obj):
        user = obj.actor
        if user is None:
            return None
        full_name = ""
        try:
            full_name = user.profile.full_name
        except Exception:
            pass
        return {
            "username": user.username,
            "full_name": full_name,
        }


class ApprovalActionSerializer(serializers.Serializer):
    reason = serializers.CharField(allow_blank=True, required=False, default="")
