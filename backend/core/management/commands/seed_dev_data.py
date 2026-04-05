import os

from django.core.management import call_command
from django.core.management.base import BaseCommand

from core.models import Role
from customers.models import Customer


class Command(BaseCommand):
    help = "Load seed fixtures for development and testing"

    def handle(self, *args, **options):
        # Check if data already exists (idempotent)
        if Role.objects.exists() and Customer.objects.exists():
            self.stdout.write(
                self.style.SUCCESS("Seed data already exists — skipping.")
            )
            return

        # Load fixtures in order (dependencies first)
        fixtures_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
            "fixtures",
        )

        self.stdout.write("Loading roles fixture...")
        call_command("loaddata", os.path.join(fixtures_dir, "roles.json"), verbosity=0)
        self.stdout.write(self.style.SUCCESS("Roles loaded"))

        self.stdout.write("Loading lookup data fixture...")
        call_command("loaddata", os.path.join(fixtures_dir, "lookup_data.json"), verbosity=0)
        self.stdout.write(self.style.SUCCESS("Lookup data loaded"))

        self.stdout.write("Loading dev test data fixture...")
        call_command("loaddata", os.path.join(fixtures_dir, "dev_test_data.json"), verbosity=0)
        self.stdout.write(self.style.SUCCESS("Dev test data loaded"))

        self.stdout.write(self.style.SUCCESS("Seed data loaded successfully."))
