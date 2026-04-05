"""
Management command: seed_roles

Ensures exactly 3 Role records exist: Admin, Operations, Finance.
Safe to run multiple times (idempotent).
"""
from django.core.management.base import BaseCommand

from core.models import Role

REQUIRED_ROLES = ["Admin", "Operations", "Finance"]


class Command(BaseCommand):
    help = "Seed the database with the 3 required roles: Admin, Operations, Finance"

    def handle(self, *args, **options):
        created_count = 0
        for role_name in REQUIRED_ROLES:
            _, created = Role.objects.get_or_create(name=role_name)
            if created:
                created_count += 1

        # Remove any roles outside the required set
        deleted_count, _ = Role.objects.exclude(name__in=REQUIRED_ROLES).delete()

        self.stdout.write(
            self.style.SUCCESS(
                f"Roles seeded: Admin, Operations, Finance "
                f"({created_count} created, {deleted_count} removed)"
            )
        )
