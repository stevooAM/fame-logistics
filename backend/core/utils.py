"""
Core utility helpers shared across views and middleware.
"""
from django.http import HttpRequest


def get_client_ip(request: HttpRequest) -> str | None:
    """
    Extract the real client IP address from the request.

    Respects X-Forwarded-For header (set by load balancers/proxies).
    Falls back to REMOTE_ADDR for direct connections.
    """
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if x_forwarded_for:
        # First IP in the chain is the original client
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")
