"""
Management command: seed_lookups

Seeds default lookup values for currencies and cargo types.
Idempotent — skips records that already exist (matched by code/name).

Usage:
    python manage.py seed_lookups
"""

from django.core.management.base import BaseCommand

from setup.models import CargoType, CompanyProfile, Currency


CURRENCIES = [
    {
        "code": "GHS",
        "name": "Ghana Cedi",
        "symbol": "GH₵",
        "exchange_rate": 1,
        "is_default": True,
        "sort_order": 1,
    },
    {
        "code": "USD",
        "name": "US Dollar",
        "symbol": "$",
        "exchange_rate": 1,
        "is_default": False,
        "sort_order": 2,
    },
    {
        "code": "GBP",
        "name": "British Pound",
        "symbol": "£",
        "exchange_rate": 1,
        "is_default": False,
        "sort_order": 3,
    },
    {
        "code": "EUR",
        "name": "Euro",
        "symbol": "€",
        "exchange_rate": 1,
        "is_default": False,
        "sort_order": 4,
    },
]

CARGO_TYPES = [
    {"name": "General Cargo", "code": "GEN", "sort_order": 1},
    {"name": "Bulk Cargo", "code": "BLK", "sort_order": 2},
    {"name": "Containerized", "code": "CTN", "sort_order": 3},
    {"name": "Perishables", "code": "PER", "sort_order": 4},
    {"name": "Hazardous", "code": "HAZ", "sort_order": 5},
    {"name": "Vehicles", "code": "VEH", "sort_order": 6},
    {"name": "Liquid Bulk", "code": "LQD", "sort_order": 7},
]


class Command(BaseCommand):
    help = "Seed default lookup values (currencies, cargo types, company profile)."

    def handle(self, *args, **options):
        self._seed_currencies()
        self._seed_cargo_types()
        self._seed_company_profile()
        self.stdout.write(self.style.SUCCESS("Lookup seeding complete."))

    def _seed_currencies(self):
        created = 0
        for data in CURRENCIES:
            obj, was_created = Currency.objects.get_or_create(
                code=data["code"],
                defaults={
                    "name": data["name"],
                    "symbol": data["symbol"],
                    "exchange_rate": data["exchange_rate"],
                    "is_default": data["is_default"],
                    "sort_order": data["sort_order"],
                    "is_active": True,
                },
            )
            if was_created:
                created += 1
                self.stdout.write(f"  Created currency: {obj.code} ({obj.name})")
            else:
                self.stdout.write(f"  Skipped currency: {obj.code} (already exists)")
        self.stdout.write(self.style.SUCCESS(f"Currencies: {created} created, {len(CURRENCIES) - created} skipped."))

    def _seed_cargo_types(self):
        created = 0
        for data in CARGO_TYPES:
            obj, was_created = CargoType.objects.get_or_create(
                name=data["name"],
                defaults={
                    "code": data["code"],
                    "sort_order": data["sort_order"],
                    "is_active": True,
                },
            )
            if was_created:
                created += 1
                self.stdout.write(f"  Created cargo type: {obj.name} ({obj.code})")
            else:
                self.stdout.write(f"  Skipped cargo type: {obj.name} (already exists)")
        self.stdout.write(self.style.SUCCESS(f"Cargo types: {created} created, {len(CARGO_TYPES) - created} skipped."))

    def _seed_company_profile(self):
        if CompanyProfile.objects.exists():
            self.stdout.write("  Skipped company profile (already exists).")
        else:
            CompanyProfile.objects.create(name="Fame Logistics")
            self.stdout.write(self.style.SUCCESS("  Created company profile: Fame Logistics"))
