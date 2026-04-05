"""
Core serializers — custom JWT token with RBAC role claims + auth endpoint serializers.
"""
from rest_framework import serializers
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


# ---------------------------------------------------------------------------
# Auth endpoint serializers
# ---------------------------------------------------------------------------


class LoginSerializer(serializers.Serializer):
    """Credentials for login endpoint."""

    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    remember_me = serializers.BooleanField(default=False, required=False)


class PasswordResetRequestSerializer(serializers.Serializer):
    """Email address for password-reset request."""

    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Token + new password for password-reset confirmation."""

    token = serializers.UUIDField()
    new_password = serializers.CharField(write_only=True, min_length=8)


class PasswordChangeSerializer(serializers.Serializer):
    """Old and new passwords for authenticated password change."""

    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)


class RoleSerializer(serializers.Serializer):
    """Minimal role representation embedded in user profile."""

    id = serializers.IntegerField()
    name = serializers.CharField()


class UserProfileSerializer(serializers.Serializer):
    """Current user profile — returned by GET /api/auth/me/."""

    id = serializers.IntegerField(source="user.id")
    username = serializers.CharField(source="user.username")
    email = serializers.EmailField(source="user.email")
    first_name = serializers.CharField(source="user.first_name")
    last_name = serializers.CharField(source="user.last_name")
    role = serializers.SerializerMethodField()
    is_force_password_change = serializers.BooleanField()

    def get_role(self, obj):
        if obj.role:
            return RoleSerializer(obj.role).data
        return None

    class Meta:
        # Not a ModelSerializer, but declaring the source model for clarity
        pass
