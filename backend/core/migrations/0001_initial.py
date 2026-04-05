# Generated migration for core app models
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Role",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("name", models.CharField(
                    choices=[
                        ("Admin", "Admin"),
                        ("Manager", "Manager"),
                        ("Operations", "Operations"),
                        ("Finance", "Finance"),
                        ("Viewer", "Viewer"),
                    ],
                    max_length=50,
                    unique=True,
                )),
                ("description", models.TextField(blank=True)),
            ],
            options={"ordering": ["name"], "abstract": False},
        ),
        migrations.CreateModel(
            name="UserProfile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("is_active", models.BooleanField(default=True)),
                ("phone", models.CharField(blank=True, max_length=50)),
                ("department", models.CharField(blank=True, max_length=100)),
                ("role", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="core.role")),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="profile", to=settings.AUTH_USER_MODEL)),
            ],
            options={"abstract": False},
        ),
        migrations.CreateModel(
            name="AuditLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("action", models.CharField(
                    choices=[
                        ("CREATE", "Create"),
                        ("UPDATE", "Update"),
                        ("DELETE", "Delete"),
                        ("LOGIN", "Login"),
                        ("LOGOUT", "Logout"),
                    ],
                    max_length=20,
                )),
                ("model_name", models.CharField(max_length=100)),
                ("object_id", models.CharField(blank=True, max_length=50)),
                ("object_repr", models.CharField(blank=True, max_length=200)),
                ("changes", models.JSONField(blank=True, default=dict)),
                ("ip_address", models.GenericIPAddressField(blank=True, null=True)),
                ("timestamp", models.DateTimeField(auto_now_add=True)),
                ("user", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-timestamp"]},
        ),
        migrations.AddIndex(
            model_name="auditlog",
            index=models.Index(fields=["user"], name="core_audito_user_id_idx"),
        ),
        migrations.AddIndex(
            model_name="auditlog",
            index=models.Index(fields=["model_name"], name="core_audito_model_n_idx"),
        ),
        migrations.AddIndex(
            model_name="auditlog",
            index=models.Index(fields=["timestamp"], name="core_audito_timesta_idx"),
        ),
    ]
