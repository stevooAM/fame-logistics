"""
URL configuration for the customers app.

Mounted at /api/customers/ from config/urls.py.

Routes registered:
  GET    /api/customers/          — list (paginated + filtered)
  POST   /api/customers/          — create
  GET    /api/customers/{id}/     — retrieve
  PUT    /api/customers/{id}/     — full update
  PATCH  /api/customers/{id}/     — partial update
  DELETE /api/customers/{id}/     — soft-delete (returns 200)
  GET    /api/customers/check-tin/ — duplicate TIN check
"""

from rest_framework.routers import DefaultRouter

from .views import CustomerViewSet

router = DefaultRouter()
router.register("", CustomerViewSet, basename="customer")

urlpatterns = router.urls
