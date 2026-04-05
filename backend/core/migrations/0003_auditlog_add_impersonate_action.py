"""
Migration: add IMPERSONATE choice to AuditLog.action field.

Required so ImpersonationMiddleware can write audit log entries with
action="IMPERSONATE" without hitting Django validation errors.
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0002_update_roles"),
    ]

    operations = [
        migrations.AlterField(
            model_name="auditlog",
            name="action",
            field=models.CharField(
                choices=[
                    ("CREATE", "Create"),
                    ("UPDATE", "Update"),
                    ("DELETE", "Delete"),
                    ("LOGIN", "Login"),
                    ("LOGOUT", "Logout"),
                    ("IMPERSONATE", "Impersonate"),
                ],
                max_length=20,
            ),
        ),
    ]
