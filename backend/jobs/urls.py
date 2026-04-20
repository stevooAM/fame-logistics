"""
URL configuration for the jobs app.

Registers JobViewSet with the DefaultRouter at the root path, producing:

  /api/jobs/                          list, create
  /api/jobs/{id}/                     retrieve, update, partial_update
  /api/jobs/{id}/transition/          status transition (PATCH)
  /api/jobs/{id}/audit-trail/         audit trail (GET)
  /api/jobs/{id}/documents/upload/    document upload (POST)
  /api/jobs/{id}/documents/           list documents (GET)
  /api/jobs/{id}/documents/{doc_id}/  delete document (DELETE)
"""

from rest_framework.routers import DefaultRouter

from .views import JobViewSet

router = DefaultRouter()
router.register("", JobViewSet, basename="job")

urlpatterns = router.urls
