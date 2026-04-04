from django.conf import settings
from django.db import connection
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    """Health check endpoint for service monitoring."""
    db_ok = False
    redis_ok = False

    # Check database
    try:
        connection.ensure_connection()
        db_ok = True
    except Exception:
        pass

    # Check Redis
    try:
        import redis

        r = redis.from_url(settings.CELERY_BROKER_URL)
        r.ping()
        redis_ok = True
    except Exception:
        pass

    return Response(
        {
            "status": "healthy",
            "service": "fame-fms-backend",
            "version": "0.1.0",
            "database": db_ok,
            "redis": redis_ok,
        }
    )
