import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("jobs", "0001_initial"),
        ("core", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="ApprovalQueue",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("status", models.CharField(
                    choices=[("PENDING", "Pending"), ("APPROVED", "Approved"), ("REJECTED", "Rejected")],
                    default="PENDING",
                    max_length=20,
                )),
                ("reviewed_at", models.DateTimeField(blank=True, null=True)),
                ("rejection_reason", models.TextField(blank=True)),
                ("job", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="approval_requests", to="jobs.job")),
                ("reviewed_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="reviewed_approvals", to=settings.AUTH_USER_MODEL)),
                ("submitted_by", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="submitted_approvals", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"], "abstract": False},
        ),
        migrations.CreateModel(
            name="ApprovalHistory",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("action", models.CharField(
                    choices=[("SUBMITTED", "Submitted"), ("APPROVED", "Approved"), ("REJECTED", "Rejected")],
                    max_length=20,
                )),
                ("comment", models.TextField(blank=True)),
                ("actor", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
                ("approval", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="history", to="approvals.approvalqueue")),
            ],
            options={"ordering": ["-created_at"], "abstract": False},
        ),
        migrations.AddIndex(
            model_name="approvalqueue",
            index=models.Index(fields=["status"], name="approvals_a_status_idx"),
        ),
        migrations.AddIndex(
            model_name="approvalqueue",
            index=models.Index(fields=["submitted_by"], name="approvals_a_submitt_idx"),
        ),
        migrations.AddIndex(
            model_name="approvalqueue",
            index=models.Index(fields=["reviewed_by"], name="approvals_a_reviewe_idx"),
        ),
    ]
