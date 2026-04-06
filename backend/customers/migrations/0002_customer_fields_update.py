import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("customers", "0001_initial"),
        ("setup", "0002_add_sort_order_and_code_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="customer",
            name="business_type",
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AddField(
            model_name="customer",
            name="preferred_port",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="customers",
                to="setup.port",
            ),
        ),
        migrations.AddField(
            model_name="customer",
            name="currency_preference",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="customers",
                to="setup.currency",
            ),
        ),
        migrations.AddField(
            model_name="customer",
            name="credit_terms",
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AlterField(
            model_name="customer",
            name="tin",
            field=models.CharField(db_index=True, max_length=50),
        ),
        migrations.AddIndex(
            model_name="customer",
            index=models.Index(fields=["business_type"], name="customers_c_btype_idx"),
        ),
    ]
