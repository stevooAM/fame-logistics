"""
Core serializers — custom JWT token with RBAC role claims.
"""
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Extends the default SimpleJWT serializer to embed user role and
    profile metadata into the JWT access token as custom claims.

    Extra claims added:
      - role: name of the user's Role (e.g. "Admin", "Operations", "Finance")
      - username: Django username
      - email: user email address
      - full_name: user's full name (first + last)
      - is_force_password_change: flag set by admin to force password reset
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Standard identity claims
        token["username"] = user.username
        token["email"] = user.email
        token["full_name"] = f"{user.first_name} {user.last_name}".strip()

        # RBAC role claim — read from UserProfile
        try:
            profile = user.profile
            token["role"] = profile.role.name if profile.role else None
            token["is_force_password_change"] = profile.is_force_password_change
        except Exception:
            # Profile does not exist — degrade gracefully
            token["role"] = None
            token["is_force_password_change"] = False

        return token


class CustomTokenObtainPairView(TokenObtainPairView):
    """View wired to CustomTokenObtainPairSerializer."""

    serializer_class = CustomTokenObtainPairSerializer
