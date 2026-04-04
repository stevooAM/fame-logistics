import pytest
from django.contrib.auth.models import User
from django.test import override_settings
from django.urls import reverse
from rest_framework.test import APIClient


@pytest.mark.django_db
def test_health_check_returns_200():
    """Health check endpoint returns 200 status."""
    client = APIClient()
    response = client.get("/api/health/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "fame-fms-backend"
    assert "database" in data
    assert "redis" in data


@pytest.mark.django_db
def test_create_default_admin_creates_superuser(monkeypatch):
    """create_default_admin management command creates a superuser from env vars."""
    monkeypatch.setenv("DJANGO_SUPERUSER_USERNAME", "testadmin")
    monkeypatch.setenv("DJANGO_SUPERUSER_EMAIL", "testadmin@test.com")
    monkeypatch.setenv("DJANGO_SUPERUSER_PASSWORD", "testpassword123")

    from django.core.management import call_command

    call_command("create_default_admin")

    user = User.objects.get(username="testadmin")
    assert user.is_superuser
    assert user.is_staff
    assert user.email == "testadmin@test.com"
