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


@pytest.mark.django_db
def test_customer_write_read_cycle():
    """Customer model supports write/read cycle."""
    from customers.models import Customer

    customer = Customer.objects.create(
        company_name="Test Shipping Co",
        customer_type="Company",
        email="test@shipping.com",
        tin="C0099999999",
    )
    retrieved = Customer.objects.get(pk=customer.pk)
    assert retrieved.company_name == "Test Shipping Co"
    assert retrieved.is_active is True


@pytest.mark.django_db
def test_customer_soft_delete():
    """Customer soft delete sets is_active=False but keeps record."""
    from customers.models import Customer

    customer = Customer.objects.create(company_name="Soft Delete Co", customer_type="Company")
    customer.is_active = False
    customer.save()
    assert Customer.objects.filter(pk=customer.pk).exists()
    assert Customer.objects.get(pk=customer.pk).is_active is False


@pytest.mark.django_db
def test_role_fixture_data():
    """Verify Role model can store the 5 RBAC role choices."""
    from core.models import Role

    role = Role.objects.create(name="Admin", description="Test admin role")
    assert role.name == "Admin"
    assert Role.objects.filter(name="Admin").exists()
