"""
Cookie-based JWT authentication backend.

Reads the access token from the HttpOnly ``access_token`` cookie instead of
the Authorization header.  This is registered as the DEFAULT_AUTHENTICATION_CLASSES
in settings so every DRF view uses it automatically.

Falls back gracefully when the cookie is absent (unauthenticated request).
"""

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class CookieJWTAuthentication(JWTAuthentication):
    """
    Subclass of SimpleJWT's JWTAuthentication that reads the access token
    from the ``access_token`` HttpOnly cookie rather than the Authorization header.
    """

    ACCESS_TOKEN_COOKIE = "access_token"

    def authenticate(self, request):
        raw_token = request.COOKIES.get(self.ACCESS_TOKEN_COOKIE)
        if raw_token is None:
            return None  # No cookie — treat as anonymous

        try:
            validated_token = self.get_validated_token(raw_token)
        except (InvalidToken, TokenError):
            return None  # Invalid/expired cookie — treat as anonymous (middleware/view handles 401)

        return self.get_user(validated_token), validated_token
