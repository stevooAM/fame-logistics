import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Add db_index=True to Payment.payment_date
        migrations.AlterField(
            model_name="payment",
            name="payment_date",
            field=models.DateField(db_index=True),
        ),
        # Add composite index for monthly/quarterly aggregation queries
        migrations.AddIndex(
            model_name="payment",
            index=models.Index(
                fields=["payment_date"], name="accounts_pay_date_idx"
            ),
        ),
        # Add index on recorded_by for staff-level payment reporting
        migrations.AddIndex(
            model_name="payment",
            index=models.Index(
                fields=["recorded_by"], name="accounts_pay_recorded_idx"
            ),
        ),
    ]
