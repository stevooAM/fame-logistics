from django.contrib import admin
from .models import Port, CargoType, Currency, DocumentType, CompanyProfile


@admin.register(Port)
class PortAdmin(admin.ModelAdmin):
    list_display = ["name", "code", "country", "sort_order", "is_active"]
    list_filter = ["is_active", "country"]
    search_fields = ["name", "code"]
    ordering = ["sort_order", "name"]


@admin.register(CargoType)
class CargoTypeAdmin(admin.ModelAdmin):
    list_display = ["name", "code", "sort_order", "is_active"]
    ordering = ["sort_order", "name"]


@admin.register(Currency)
class CurrencyAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "symbol", "exchange_rate", "sort_order", "is_default", "is_active"]
    ordering = ["sort_order", "code"]


@admin.register(DocumentType)
class DocumentTypeAdmin(admin.ModelAdmin):
    list_display = ["name", "code", "sort_order", "is_active"]
    ordering = ["sort_order", "name"]


@admin.register(CompanyProfile)
class CompanyProfileAdmin(admin.ModelAdmin):
    list_display = ["name", "email", "phone", "website", "registration_number"]
