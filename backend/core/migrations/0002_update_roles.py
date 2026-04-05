"""
Migration: update Role choices to 3 roles, add is_force_password_change to UserProfile.

- Removes 'Manager' and 'Viewer' Role rows if they exist
- Alters Role.name choices to 3: Admin, Operations, Finance
- Adds UserProfile.is_force_password_change (BooleanField, default=False)
"""
from django.db import migrations, models


def remove_deprecated_roles(apps, schema_editor):
    Role = apps.get_model("core", "Role")
    Role.objects.filter(name__in=["Manager", "Viewer"]).delete()


def reverse_noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(remove_deprecated_roles, reverse_noop),
        migrations.AlterField(
            model_name="role",
            name="name",
            field=models.CharField(
                choices=[
                    ("Admin", "Admin"),
                    ("Operations", "Operations"),
                    ("Finance", "Finance"),
                ],
                max_length=50,
                unique=True,
            ),
        ),
        migrations.AddField(
            model_name="userprofile",
            name="is_force_password_change",
            field=models.BooleanField(default=False),
        ),
    ]
