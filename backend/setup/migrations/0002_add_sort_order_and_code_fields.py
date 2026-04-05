from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("setup", "0001_initial"),
    ]

    operations = [
        # Port — add sort_order, update ordering
        migrations.AddField(
            model_name="port",
            name="sort_order",
            field=models.IntegerField(default=0),
        ),
        migrations.AlterModelOptions(
            name="port",
            options={"ordering": ["sort_order", "name"]},
        ),

        # CargoType — add code and sort_order, update ordering
        migrations.AddField(
            model_name="cargotype",
            name="code",
            field=models.CharField(blank=True, null=True, default=None, max_length=20, unique=True),
        ),
        migrations.AddField(
            model_name="cargotype",
            name="sort_order",
            field=models.IntegerField(default=0),
        ),
        migrations.AlterModelOptions(
            name="cargotype",
            options={"ordering": ["sort_order", "name"]},
        ),

        # Currency — add sort_order, update ordering
        migrations.AddField(
            model_name="currency",
            name="sort_order",
            field=models.IntegerField(default=0),
        ),
        migrations.AlterModelOptions(
            name="currency",
            options={"ordering": ["sort_order", "code"], "verbose_name_plural": "currencies"},
        ),

        # DocumentType — add code and sort_order, update ordering
        migrations.AddField(
            model_name="documenttype",
            name="code",
            field=models.CharField(blank=True, null=True, default=None, max_length=20, unique=True),
        ),
        migrations.AddField(
            model_name="documenttype",
            name="sort_order",
            field=models.IntegerField(default=0),
        ),
        migrations.AlterModelOptions(
            name="documenttype",
            options={"ordering": ["sort_order", "name"]},
        ),

        # CompanyProfile — add registration_number and logo
        migrations.AddField(
            model_name="companyprofile",
            name="registration_number",
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name="companyprofile",
            name="logo",
            field=models.ImageField(blank=True, null=True, upload_to="company/"),
        ),
    ]
