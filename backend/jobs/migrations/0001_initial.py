import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("customers", "0001_initial"),
        ("core", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Job",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("job_number", models.CharField(db_index=True, max_length=20, unique=True)),
                ("job_type", models.CharField(
                    choices=[("IMPORT", "Import"), ("EXPORT", "Export"), ("TRANSIT", "Transit"), ("LOCAL", "Local")],
                    max_length=20,
                )),
                ("status", models.CharField(
                    choices=[
                        ("DRAFT", "Draft"), ("PENDING", "Pending"), ("IN_PROGRESS", "In Progress"),
                        ("CUSTOMS", "Customs"), ("DELIVERED", "Delivered"), ("CLOSED", "Closed"), ("CANCELLED", "Cancelled"),
                    ],
                    default="DRAFT",
                    max_length=20,
                )),
                ("origin", models.CharField(blank=True, max_length=200)),
                ("destination", models.CharField(blank=True, max_length=200)),
                ("cargo_description", models.TextField(blank=True)),
                ("bill_of_lading", models.CharField(blank=True, max_length=100)),
                ("container_number", models.CharField(blank=True, max_length=50)),
                ("weight_kg", models.DecimalField(blank=True, decimal_places=3, max_digits=12, null=True)),
                ("volume_cbm", models.DecimalField(blank=True, decimal_places=3, max_digits=12, null=True)),
                ("total_cost", models.DecimalField(blank=True, decimal_places=2, max_digits=15, null=True)),
                ("notes", models.TextField(blank=True)),
                ("customer", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="jobs", to="customers.customer")),
                ("created_by", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="created_jobs", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"], "abstract": False},
        ),
        migrations.CreateModel(
            name="JobAuditTrail",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("action", models.CharField(max_length=100)),
                ("old_value", models.CharField(blank=True, max_length=200)),
                ("new_value", models.CharField(blank=True, max_length=200)),
                ("job", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="audit_trail", to="jobs.job")),
                ("user", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"], "abstract": False},
        ),
        migrations.CreateModel(
            name="JobDocument",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("file_name", models.CharField(max_length=255)),
                ("file_url", models.URLField()),
                ("file_size", models.PositiveIntegerField(blank=True, null=True)),
                ("document_type", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="setup.documenttype")),
                ("job", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="documents", to="jobs.job")),
                ("uploaded_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"], "abstract": False},
        ),
        migrations.AddIndex(
            model_name="job",
            index=models.Index(fields=["job_number"], name="jobs_job_number_idx"),
        ),
        migrations.AddIndex(
            model_name="job",
            index=models.Index(fields=["status"], name="jobs_job_status_idx"),
        ),
        migrations.AddIndex(
            model_name="job",
            index=models.Index(fields=["job_type"], name="jobs_job_type_idx"),
        ),
        migrations.AddIndex(
            model_name="job",
            index=models.Index(fields=["customer"], name="jobs_job_customer_idx"),
        ),
        migrations.AddIndex(
            model_name="job",
            index=models.Index(fields=["created_at"], name="jobs_job_created_idx"),
        ),
        migrations.AddIndex(
            model_name="jobaudittrail",
            index=models.Index(fields=["job"], name="jobs_jobaud_job_idx"),
        ),
        migrations.AddIndex(
            model_name="jobaudittrail",
            index=models.Index(fields=["created_at"], name="jobs_jobaud_created_idx"),
        ),
    ]
