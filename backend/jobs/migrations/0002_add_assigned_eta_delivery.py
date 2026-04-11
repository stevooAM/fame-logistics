import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("jobs", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="job",
            name="assigned_to",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="assigned_jobs",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="job",
            name="eta",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="job",
            name="delivery_date",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddIndex(
            model_name="job",
            index=models.Index(fields=["assigned_to"], name="jobs_job_assigned_idx"),
        ),
        migrations.AddIndex(
            model_name="job",
            index=models.Index(fields=["eta"], name="jobs_job_eta_idx"),
        ),
        migrations.AddIndex(
            model_name="job",
            index=models.Index(fields=["delivery_date"], name="jobs_job_delivery_idx"),
        ),
    ]
