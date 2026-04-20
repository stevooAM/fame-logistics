"""
Django management command to seed customer data from an Excel file.

Usage:
    python manage.py seed_customers
    python manage.py seed_customers --file /path/to/customers.xlsx

The command reads fame_logistic_customers.xlsx and upserts all records into
the Customer table. It is idempotent — safe to re-run.
"""

import logging
import os
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction

logger = logging.getLogger(__name__)

# Maps normalised header names (lower, stripped) to Customer model field names.
# Add aliases here if the Excel file uses different column names across versions.
COLUMN_MAP = {
    "company name": "company_name",
    "company_name": "company_name",
    "tin": "tin",
    "contact person": "contact_person",
    "contact_person": "contact_person",
    "phone": "phone",
    "email": "email",
    "address": "address",
    "customer type": "customer_type",
    "customer_type": "customer_type",
    "type": "customer_type",
    "business type": "business_type",
    "business_type": "business_type",
    "credit terms": "credit_terms",
    "credit_terms": "credit_terms",
    "notes": "notes",
}

VALID_CUSTOMER_TYPES = {"Company", "Individual"}
DEFAULT_CUSTOMER_TYPE = "Company"

# Placeholder TIN used when a row has no TIN value.
# Must be unique per company so we can still upsert by company_name when TIN absent.
MISSING_TIN_PLACEHOLDER = "__NO_TIN__"


class Command(BaseCommand):
    help = "Seed customer records from fame_logistic_customers.xlsx."

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            dest="file_path",
            default=None,
            help=(
                "Path to the Excel file. Defaults to "
                "BASE_DIR/fame_logistic_customers.xlsx or "
                "BASE_DIR/data/fame_logistic_customers.xlsx."
            ),
        )

    def handle(self, *args, **options):
        file_path = self._resolve_file_path(options["file_path"])
        if file_path is None:
            return  # Warning already printed; exit 0.

        self.stdout.write(f"Reading customer data from: {file_path}")

        try:
            import openpyxl  # noqa: PLC0415 — imported late so missing dep is clear
        except ImportError:
            self.stderr.write(
                "openpyxl is not installed. Run: pip install 'openpyxl>=3.1,<4.0'"
            )
            return

        wb = openpyxl.load_workbook(str(file_path), read_only=True, data_only=True)
        ws = wb.worksheets[0]

        rows = list(ws.iter_rows(values_only=True))
        wb.close()

        if not rows:
            self.stdout.write(self.style.WARNING("Excel file is empty. Nothing to seed."))
            return

        header_row = rows[0]
        col_index = self._build_col_index(header_row)

        if "company_name" not in col_index:
            self.stderr.write(
                "Could not find a 'company_name' / 'Company Name' column in the Excel "
                "headers. Please check the file format."
            )
            return

        created_count = 0
        updated_count = 0
        skipped_count = 0
        total = 0

        with transaction.atomic():
            from customers.models import Customer  # noqa: PLC0415

            for row_num, row in enumerate(rows[1:], start=2):
                total += 1
                record = self._extract_record(row, col_index, row_num)
                if record is None:
                    skipped_count += 1
                    continue

                tin = record.get("tin", "").strip()
                company_name = record.get("company_name", "").strip()

                if tin:
                    # Idempotent upsert keyed on TIN.
                    defaults = {k: v for k, v in record.items() if k != "tin"}
                    defaults["company_name"] = company_name
                    obj, new = Customer.objects.update_or_create(
                        tin=tin,
                        defaults=defaults,
                    )
                else:
                    # No TIN — upsert keyed on company_name with a stable placeholder.
                    placeholder_tin = f"{MISSING_TIN_PLACEHOLDER}{company_name}"[:50]
                    defaults = {k: v for k, v in record.items() if k != "company_name"}
                    defaults["tin"] = placeholder_tin
                    obj, new = Customer.objects.update_or_create(
                        company_name=company_name,
                        defaults=defaults,
                    )

                if new:
                    created_count += 1
                else:
                    updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {created_count} new customers, updated {updated_count} existing, "
                f"skipped {skipped_count} invalid rows (total: {total} rows processed)."
            )
        )

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _resolve_file_path(self, provided_path: str | None) -> Path | None:
        """Return a Path to the Excel file, or None if not found."""
        if provided_path is not None:
            p = Path(provided_path)
            if p.exists():
                return p
            self.stdout.write(
                self.style.WARNING(
                    f"Excel file not found at {p}. "
                    "Skipping customer seed. Place the file and re-run."
                )
            )
            return None

        base = Path(settings.BASE_DIR)
        candidates = [
            base / "fame_logistic_customers.xlsx",
            base / "data" / "fame_logistic_customers.xlsx",
        ]
        for candidate in candidates:
            if candidate.exists():
                return candidate

        self.stdout.write(
            self.style.WARNING(
                f"Excel file not found at {candidates[0]} or {candidates[1]}. "
                "Skipping customer seed. Place the file and re-run."
            )
        )
        return None

    def _build_col_index(self, header_row) -> dict[str, int]:
        """Return a mapping of model field name -> column index."""
        index: dict[str, int] = {}
        for col_idx, cell in enumerate(header_row):
            if cell is None:
                continue
            normalised = str(cell).strip().lower()
            field_name = COLUMN_MAP.get(normalised)
            if field_name is None:
                logger.debug("Unrecognised column '%s' at index %d — skipping.", cell, col_idx)
                continue
            if field_name not in index:
                index[field_name] = col_idx
        return index

    def _extract_record(self, row, col_index: dict[str, int], row_num: int) -> dict | None:
        """Extract and validate a row into a dict of model fields.

        Returns None if the row should be skipped.
        """
        def get_cell(field: str) -> str:
            idx = col_index.get(field)
            if idx is None or idx >= len(row):
                return ""
            val = row[idx]
            return str(val).strip() if val is not None else ""

        company_name = get_cell("company_name")
        if not company_name:
            # Fall back to contact_person (common in this dataset for individual contacts)
            company_name = get_cell("contact_person")
        if not company_name:
            logger.warning("Row %d: missing company_name — skipping.", row_num)
            self.stdout.write(
                self.style.WARNING(f"Row {row_num}: missing company_name — skipping.")
            )
            return None

        customer_type = get_cell("customer_type")
        if customer_type and customer_type not in VALID_CUSTOMER_TYPES:
            logger.debug(
                "Row %d: unrecognised customer_type '%s' — defaulting to 'Company'.",
                row_num,
                customer_type,
            )
            customer_type = DEFAULT_CUSTOMER_TYPE
        elif not customer_type:
            customer_type = DEFAULT_CUSTOMER_TYPE

        return {
            "company_name": company_name,
            "tin": get_cell("tin"),
            "contact_person": get_cell("contact_person"),
            "phone": get_cell("phone"),
            "email": get_cell("email"),
            "address": get_cell("address"),
            "customer_type": customer_type,
            "business_type": get_cell("business_type"),
            "credit_terms": get_cell("credit_terms"),
            "notes": get_cell("notes"),
        }
