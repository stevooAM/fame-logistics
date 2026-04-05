import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("core", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Customer",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("company_name", models.CharField(max_length=200)),
                ("customer_type", models.CharField(
                    choices=[("Company", "Company"), ("Individual", "Individual")],
                    default="Company",
                    max_length=20,
                )),
                ("contact_person", models.CharField(blank=True, max_length=150)),
                ("email", models.EmailField(blank=True, max_length=254)),
                ("phone", models.CharField(blank=True, max_length=50)),
                ("tin", models.CharField(blank=True, db_index=True, max_length=50)),
                ("address", models.TextField(blank=True)),
                ("is_active", models.BooleanField(default=True)),
                ("notes", models.TextField(blank=True)),
            ],
            options={"ordering": ["company_name"], "abstract": False},
        ),
        migrations.AddIndex(
            model_name="customer",
            index=models.Index(fields=["tin"], name="customers_c_tin_idx"),
        ),
        migrations.AddIndex(
            model_name="customer",
            index=models.Index(fields=["company_name"], name="customers_c_company_idx"),
        ),
        migrations.AddIndex(
            model_name="customer",
            index=models.Index(fields=["customer_type"], name="customers_c_type_idx"),
        ),
        migrations.AddIndex(
            model_name="customer",
            index=models.Index(fields=["is_active"], name="customers_c_active_idx"),
        ),
    ]
