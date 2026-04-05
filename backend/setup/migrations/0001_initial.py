from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("core", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Port",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("name", models.CharField(max_length=200, unique=True)),
                ("code", models.CharField(max_length=20, unique=True)),
                ("country", models.CharField(max_length=100)),
                ("is_active", models.BooleanField(default=True)),
            ],
            options={"ordering": ["name"], "abstract": False},
        ),
        migrations.CreateModel(
            name="CargoType",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("name", models.CharField(max_length=100, unique=True)),
                ("description", models.TextField(blank=True)),
                ("is_active", models.BooleanField(default=True)),
            ],
            options={"ordering": ["name"], "abstract": False},
        ),
        migrations.CreateModel(
            name="Currency",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("code", models.CharField(max_length=3, unique=True)),
                ("name", models.CharField(max_length=100)),
                ("symbol", models.CharField(max_length=5)),
                ("exchange_rate", models.DecimalField(decimal_places=6, default=1, max_digits=12)),
                ("is_default", models.BooleanField(default=False)),
                ("is_active", models.BooleanField(default=True)),
            ],
            options={"ordering": ["code"], "verbose_name_plural": "currencies", "abstract": False},
        ),
        migrations.CreateModel(
            name="DocumentType",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("name", models.CharField(max_length=100, unique=True)),
                ("description", models.TextField(blank=True)),
                ("is_active", models.BooleanField(default=True)),
            ],
            options={"ordering": ["name"], "abstract": False},
        ),
        migrations.CreateModel(
            name="CompanyProfile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("name", models.CharField(max_length=200)),
                ("logo_url", models.URLField(blank=True)),
                ("email", models.EmailField(blank=True, max_length=254)),
                ("phone", models.CharField(blank=True, max_length=50)),
                ("address", models.TextField(blank=True)),
                ("website", models.URLField(blank=True)),
                ("tin", models.CharField(blank=True, max_length=50)),
            ],
            options={"verbose_name": "Company Profile", "abstract": False},
        ),
    ]
