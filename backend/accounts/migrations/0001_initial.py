import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("customers", "0001_initial"),
        ("jobs", "0001_initial"),
        ("setup", "0001_initial"),
        ("core", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Invoice",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("invoice_number", models.CharField(db_index=True, max_length=20, unique=True)),
                ("amount", models.DecimalField(decimal_places=2, max_digits=15)),
                ("status", models.CharField(
                    choices=[
                        ("DRAFT", "Draft"), ("SENT", "Sent"), ("PAID", "Paid"),
                        ("PARTIAL", "Partial"), ("OVERDUE", "Overdue"), ("CANCELLED", "Cancelled"),
                    ],
                    default="DRAFT",
                    max_length=20,
                )),
                ("issue_date", models.DateField()),
                ("due_date", models.DateField()),
                ("notes", models.TextField(blank=True)),
                ("created_by", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
                ("currency", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="setup.currency")),
                ("customer", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="invoices", to="customers.customer")),
                ("job", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="invoices", to="jobs.job")),
            ],
            options={"ordering": ["-created_at"], "abstract": False},
        ),
        migrations.CreateModel(
            name="Payment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("amount", models.DecimalField(decimal_places=2, max_digits=15)),
                ("payment_date", models.DateField()),
                ("payment_method", models.CharField(blank=True, max_length=50)),
                ("reference", models.CharField(blank=True, max_length=100)),
                ("notes", models.TextField(blank=True)),
                ("invoice", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="payments", to="accounts.invoice")),
                ("recorded_by", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-payment_date"], "abstract": False},
        ),
        migrations.AddIndex(
            model_name="invoice",
            index=models.Index(fields=["invoice_number"], name="accounts_in_number_idx"),
        ),
        migrations.AddIndex(
            model_name="invoice",
            index=models.Index(fields=["status"], name="accounts_in_status_idx"),
        ),
        migrations.AddIndex(
            model_name="invoice",
            index=models.Index(fields=["customer"], name="accounts_in_custome_idx"),
        ),
        migrations.AddIndex(
            model_name="invoice",
            index=models.Index(fields=["issue_date"], name="accounts_in_issue_d_idx"),
        ),
    ]
