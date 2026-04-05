from django.contrib import admin
from .models import Invoice, Payment


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ["invoice_number", "customer", "amount", "status", "issue_date", "due_date"]
    list_filter = ["status"]
    search_fields = ["invoice_number", "customer__company_name"]


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ["invoice", "amount", "payment_date", "payment_method", "reference"]
