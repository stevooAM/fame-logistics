from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("approvals", "0001_initial"),
    ]

    operations = [
        migrations.AddConstraint(
            model_name="approvalqueue",
            constraint=models.UniqueConstraint(
                condition=models.Q(status="PENDING"),
                fields=["job"],
                name="unique_pending_approval_per_job",
            ),
        ),
    ]
