"""Custom password validators for Fame FMS."""
import re

from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


class UppercaseValidator:
    """Require at least one uppercase letter in the password."""

    def validate(self, password, user=None):
        if not re.search(r"[A-Z]", password):
            raise ValidationError(
                _("The password must contain at least one uppercase letter (A-Z)."),
                code="password_no_uppercase",
            )

    def get_help_text(self):
        return _("Your password must contain at least one uppercase letter.")


class NumberValidator:
    """Require at least one numeric digit in the password."""

    def validate(self, password, user=None):
        if not re.search(r"\d", password):
            raise ValidationError(
                _("The password must contain at least one number (0-9)."),
                code="password_no_number",
            )

    def get_help_text(self):
        return _("Your password must contain at least one number.")
