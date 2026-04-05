from django.contrib import admin
from .models import Port, CargoType, Currency, DocumentType, CompanyProfile


@admin.register(Port)
class PortAdmin(admin.ModelAdmin):
    list_display = ["name", "code", "country", "is_active"]
    list_filter = ["is_active", "country"]
    search_fields = ["name", "code"]


@admin.register(CargoType)
class CargoTypeAdmin(admin.ModelAdmin):
    list_display = ["name", "is_active"]


@admin.register(Currency)
class CurrencyAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "symbol", "exchange_rate", "is_default", "is_active"]


@admin.register(DocumentType)
class DocumentTypeAdmin(admin.ModelAdmin):
    list_display = ["name", "is_active"]


@admin.register(CompanyProfile)
class CompanyProfileAdmin(admin.ModelAdmin):
    list_display = ["name", "email", "phone", "website"]
