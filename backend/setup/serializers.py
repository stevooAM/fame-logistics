"""
Serializers for Setup / Lookup models.
"""

from rest_framework import serializers

from .models import CargoType, CompanyProfile, Currency, DocumentType, Port


class PortSerializer(serializers.ModelSerializer):
    class Meta:
        model = Port
        fields = "__all__"

    def validate(self, attrs):
        # Uniqueness checks that handle partial updates (PATCH)
        instance = self.instance
        name = attrs.get("name", getattr(instance, "name", None))
        code = attrs.get("code", getattr(instance, "code", None))

        qs_name = Port.objects.filter(name=name)
        qs_code = Port.objects.filter(code=code)
        if instance:
            qs_name = qs_name.exclude(pk=instance.pk)
            qs_code = qs_code.exclude(pk=instance.pk)

        if qs_name.exists():
            raise serializers.ValidationError({"name": "A port with this name already exists."})
        if qs_code.exists():
            raise serializers.ValidationError({"code": "A port with this code already exists."})

        return attrs


class CargoTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CargoType
        fields = "__all__"

    def validate(self, attrs):
        instance = self.instance
        name = attrs.get("name", getattr(instance, "name", None))
        code = attrs.get("code", getattr(instance, "code", None))

        qs_name = CargoType.objects.filter(name=name)
        if instance:
            qs_name = qs_name.exclude(pk=instance.pk)
        if qs_name.exists():
            raise serializers.ValidationError({"name": "A cargo type with this name already exists."})

        if code:
            qs_code = CargoType.objects.filter(code=code)
            if instance:
                qs_code = qs_code.exclude(pk=instance.pk)
            if qs_code.exists():
                raise serializers.ValidationError({"code": "A cargo type with this code already exists."})

        return attrs


class CurrencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Currency
        fields = "__all__"

    def validate(self, attrs):
        instance = self.instance
        code = attrs.get("code", getattr(instance, "code", None))

        qs_code = Currency.objects.filter(code=code)
        if instance:
            qs_code = qs_code.exclude(pk=instance.pk)
        if qs_code.exists():
            raise serializers.ValidationError({"code": "A currency with this code already exists."})

        return attrs


class DocumentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentType
        fields = "__all__"

    def validate(self, attrs):
        instance = self.instance
        name = attrs.get("name", getattr(instance, "name", None))
        code = attrs.get("code", getattr(instance, "code", None))

        qs_name = DocumentType.objects.filter(name=name)
        if instance:
            qs_name = qs_name.exclude(pk=instance.pk)
        if qs_name.exists():
            raise serializers.ValidationError({"name": "A document type with this name already exists."})

        if code:
            qs_code = DocumentType.objects.filter(code=code)
            if instance:
                qs_code = qs_code.exclude(pk=instance.pk)
            if qs_code.exists():
                raise serializers.ValidationError({"code": "A document type with this code already exists."})

        return attrs


class CompanyProfileSerializer(serializers.ModelSerializer):
    logo = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = CompanyProfile
        fields = "__all__"
