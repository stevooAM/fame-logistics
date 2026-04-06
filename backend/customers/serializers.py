"""
Serializers for the Customer model.

Two serializers are provided:
  - CustomerListSerializer: lighter payload for AG Grid list view
  - CustomerSerializer: full payload for create/edit/detail operations

FK fields (preferred_port, currency_preference) support:
  - Write: integer PK
  - Read: nested {id, name, code} objects via to_representation override
"""

from rest_framework import serializers

from .models import Customer


class CustomerListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for list view.

    Returns flat fields plus denormalised port name and currency code
    to avoid N+1 join overhead in the AG Grid list.
    """

    preferred_port_name = serializers.SerializerMethodField()
    currency_preference_code = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = [
            "id",
            "company_name",
            "tin",
            "contact_person",
            "phone",
            "email",
            "business_type",
            "credit_terms",
            "customer_type",
            "is_active",
            "preferred_port_name",
            "currency_preference_code",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_preferred_port_name(self, obj) -> str | None:
        """Return port.name or None when no port is set."""
        if obj.preferred_port_id is not None:
            return obj.preferred_port.name if obj.preferred_port else None
        return None

    def get_currency_preference_code(self, obj) -> str | None:
        """Return currency.code or None when no currency is set."""
        if obj.currency_preference_id is not None:
            return obj.currency_preference.code if obj.currency_preference else None
        return None


class CustomerSerializer(serializers.ModelSerializer):
    """
    Full serializer for customer create/edit/detail operations.

    Write:  preferred_port and currency_preference accept integer PKs.
    Read:   to_representation injects nested objects with {id, name, code}
            as preferred_port_detail and currency_preference_detail.
    """

    class Meta:
        model = Customer
        fields = [
            "id",
            "company_name",
            "customer_type",
            "contact_person",
            "email",
            "phone",
            "tin",
            "address",
            "is_active",
            "notes",
            "business_type",
            "preferred_port",
            "currency_preference",
            "credit_terms",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
        extra_kwargs = {
            "preferred_port": {"allow_null": True, "required": False},
            "currency_preference": {"allow_null": True, "required": False},
        }

    def to_representation(self, instance):
        """
        Augment the default representation with nested FK detail objects.

        preferred_port_detail and currency_preference_detail are appended
        after the standard field serialisation so that write fields
        (preferred_port, currency_preference) remain integer PKs for API
        consumers that POST/PATCH.
        """
        data = super().to_representation(instance)

        # Nested port detail
        port = instance.preferred_port
        if port is not None:
            data["preferred_port_detail"] = {
                "id": port.id,
                "name": port.name,
                "code": getattr(port, "code", None),
            }
        else:
            data["preferred_port_detail"] = None

        # Nested currency detail
        currency = instance.currency_preference
        if currency is not None:
            data["currency_preference_detail"] = {
                "id": currency.id,
                "name": currency.name,
                "code": getattr(currency, "code", None),
            }
        else:
            data["currency_preference_detail"] = None

        return data
