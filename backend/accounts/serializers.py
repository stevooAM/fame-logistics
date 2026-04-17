"""
Serializers for the Accounts module (Invoice and Payment).

Four serializers are provided:
  - InvoiceListSerializer:   lightweight list payload for AG Grid (computed balance)
  - PaymentSerializer:       full payment representation with validation
  - InvoiceSerializer:       full detail with nested payments + FK detail objects
  - GenerateInvoiceSerializer: plain Serializer for the generate-invoice action
"""

from decimal import Decimal

from rest_framework import serializers

from .models import Invoice, Payment


class InvoiceListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for invoice list views (AG Grid).

    Returns flat fields plus denormalised customer_name, job_number,
    currency_code, and computed balance / paid_total fields.
    All fields are read-only.
    """

    customer_name = serializers.SerializerMethodField()
    job_number = serializers.SerializerMethodField()
    currency_code = serializers.SerializerMethodField()
    paid_total = serializers.SerializerMethodField()
    balance = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = [
            "id",
            "invoice_number",
            "customer",
            "customer_name",
            "job",
            "job_number",
            "amount",
            "currency",
            "currency_code",
            "status",
            "issue_date",
            "due_date",
            "paid_total",
            "balance",
            "created_at",
        ]
        read_only_fields = fields

    def get_customer_name(self, obj) -> str | None:
        if obj.customer_id is not None and obj.customer:
            return obj.customer.company_name
        return None

    def get_job_number(self, obj) -> str | None:
        if obj.job_id is not None and obj.job:
            return obj.job.job_number
        return None

    def get_currency_code(self, obj) -> str | None:
        if obj.currency_id is not None and obj.currency:
            return getattr(obj.currency, "code", None)
        return None

    def get_paid_total(self, obj) -> str:
        return str(obj.paid_total())

    def get_balance(self, obj) -> str:
        return str(obj.balance())


class PaymentSerializer(serializers.ModelSerializer):
    """
    Serializer for Payment records.

    Read:  recorded_by_name is denormalised for display.
    Write: validates amount > 0 and amount <= outstanding invoice balance.
    """

    recorded_by_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id",
            "invoice",
            "amount",
            "payment_date",
            "payment_method",
            "reference",
            "notes",
            "recorded_by",
            "recorded_by_name",
            "created_at",
        ]
        read_only_fields = ["id", "recorded_by", "created_at"]

    def get_recorded_by_name(self, obj) -> str | None:
        if obj.recorded_by_id is not None and obj.recorded_by:
            full_name = obj.recorded_by.get_full_name()
            return full_name if full_name else obj.recorded_by.username
        return None

    def validate_amount(self, value):
        """Amount must be positive."""
        if value is None or value <= Decimal("0"):
            raise serializers.ValidationError("Payment amount must be greater than zero.")
        return value

    def validate(self, attrs):
        """
        Cross-field validation: amount must not exceed the outstanding balance.

        Runs after individual field validation. The invoice may not be in
        attrs if the field was invalid — guard accordingly.
        """
        invoice = attrs.get("invoice")
        amount = attrs.get("amount")

        if invoice is not None and amount is not None:
            outstanding = invoice.balance()
            if amount > outstanding:
                raise serializers.ValidationError(
                    {
                        "amount": (
                            f"Payment amount ({amount}) exceeds the outstanding "
                            f"balance ({outstanding}) on invoice "
                            f"{invoice.invoice_number}."
                        )
                    }
                )

        return attrs


class InvoiceSerializer(serializers.ModelSerializer):
    """
    Full serializer for invoice detail and create operations.

    Read:   to_representation injects customer_detail, job_detail, and
            embedded payments list. Computed balance fields also included.
    Write:  customer and job accept integer PKs.
    """

    customer_name = serializers.SerializerMethodField(read_only=True)
    job_number = serializers.SerializerMethodField(read_only=True)
    currency_code = serializers.SerializerMethodField(read_only=True)
    paid_total = serializers.SerializerMethodField(read_only=True)
    balance = serializers.SerializerMethodField(read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Invoice
        fields = [
            "id",
            "invoice_number",
            "customer",
            "customer_name",
            "job",
            "job_number",
            "amount",
            "currency",
            "currency_code",
            "status",
            "issue_date",
            "due_date",
            "notes",
            "paid_total",
            "balance",
            "payments",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "invoice_number",
            "created_by",
            "created_at",
            "updated_at",
        ]

    def get_customer_name(self, obj) -> str | None:
        if obj.customer_id is not None and obj.customer:
            return obj.customer.company_name
        return None

    def get_job_number(self, obj) -> str | None:
        if obj.job_id is not None and obj.job:
            return obj.job.job_number
        return None

    def get_currency_code(self, obj) -> str | None:
        if obj.currency_id is not None and obj.currency:
            return getattr(obj.currency, "code", None)
        return None

    def get_paid_total(self, obj) -> str:
        return str(obj.paid_total())

    def get_balance(self, obj) -> str:
        return str(obj.balance())

    def to_representation(self, instance):
        """
        Augment with nested FK detail objects for rich detail views.

        Appends customer_detail and job_detail after standard field
        serialisation so write fields remain integer PKs for POST/PATCH.
        """
        data = super().to_representation(instance)

        # Nested customer detail
        customer = instance.customer
        if customer is not None:
            data["customer_detail"] = {
                "id": customer.id,
                "company_name": customer.company_name,
            }
        else:
            data["customer_detail"] = None

        # Nested job detail
        job = instance.job
        if job is not None:
            data["job_detail"] = {
                "id": job.id,
                "job_number": job.job_number,
                "status": job.status,
            }
        else:
            data["job_detail"] = None

        return data


class GenerateInvoiceSerializer(serializers.Serializer):
    """
    Plain Serializer for the generate-invoice action.

    Accepts the minimum inputs needed to create an Invoice for an approved job.
    invoice_number and status are set automatically by the view.
    """

    job_id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    currency_id = serializers.IntegerField(required=False, allow_null=True, default=None)
    issue_date = serializers.DateField(required=False, allow_null=True, default=None)
    due_date = serializers.DateField()
    notes = serializers.CharField(required=False, allow_blank=True, default="")

    def validate_amount(self, value):
        """Invoice amount must be positive."""
        if value is None or value <= Decimal("0"):
            raise serializers.ValidationError("Invoice amount must be greater than zero.")
        return value
