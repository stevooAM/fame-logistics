from django.contrib import admin

from .models import Customer


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ["company_name", "customer_type", "contact_person", "email", "phone", "tin", "is_active"]
    list_filter = ["customer_type", "is_active"]
    search_fields = ["company_name", "contact_person", "email", "tin"]
