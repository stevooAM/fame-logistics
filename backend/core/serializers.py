"""
Core serializers — custom JWT token with RBAC role claims + auth endpoint serializers
+ user management serializers (list, create, update, change-password).
"""
import re
import secrets
import string

from django.contrib.auth.models import User

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

from core.models import AuditLog, Role, UserProfile


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


# ---------------------------------------------------------------------------
# User management serializers
# ---------------------------------------------------------------------------

def _generate_temp_password() -> str:
    """
    Generate a 12-character random temporary password containing at least one
    uppercase letter, one lowercase letter, one digit, and one special character.
    """
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    # Guarantee at least one of each required character class
    required = [
        secrets.choice(string.ascii_uppercase),
        secrets.choice(string.ascii_lowercase),
        secrets.choice(string.digits),
        secrets.choice("!@#$%^&*"),
    ]
    # Fill remaining 8 characters from full alphabet
    rest = [secrets.choice(alphabet) for _ in range(8)]
    password_chars = required + rest
    secrets.SystemRandom().shuffle(password_chars)
    return "".join(password_chars)


class UserListSerializer(serializers.Serializer):
    """
    Read-only serializer for listing users.
    Source: UserProfile (with user + role select_related).
    """

    id = serializers.IntegerField(source="user.id")
    username = serializers.CharField(source="user.username")
    email = serializers.EmailField(source="user.email")
    first_name = serializers.CharField(source="user.first_name")
    last_name = serializers.CharField(source="user.last_name")
    role = serializers.SerializerMethodField()
    phone = serializers.CharField()
    department = serializers.CharField()
    is_active = serializers.BooleanField(source="user.is_active")
    is_force_password_change = serializers.BooleanField()
    date_joined = serializers.DateTimeField(source="user.date_joined")
    last_login = serializers.DateTimeField(source="user.last_login")

    def get_role(self, obj):
        if obj.role:
            return RoleSerializer(obj.role).data
        return None


class UserCreateSerializer(serializers.Serializer):
    """
    Write serializer for creating a new user.
    Returns user data + a one-time temp_password field.
    """

    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    role_id = serializers.IntegerField()
    phone = serializers.CharField(max_length=50, required=False, allow_blank=True, default="")
    department = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_role_id(self, value):
        if not Role.objects.filter(id=value).exists():
            raise serializers.ValidationError("Invalid role_id — no matching role found.")
        return value

    def create(self, validated_data):
        role_id = validated_data.pop("role_id")
        phone = validated_data.pop("phone", "")
        department = validated_data.pop("department", "")

        temp_password = _generate_temp_password()

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
            password=temp_password,
        )

        role = Role.objects.get(id=role_id)
        UserProfile.objects.create(
            user=user,
            role=role,
            phone=phone,
            department=department,
            is_active=True,
            is_force_password_change=True,
        )

        return {"user": user, "temp_password": temp_password}


class UserUpdateSerializer(serializers.Serializer):
    """
    Partial-update serializer for editing an existing user.
    Username is read-only after creation.
    """

    email = serializers.EmailField(required=False)
    first_name = serializers.CharField(max_length=150, required=False)
    last_name = serializers.CharField(max_length=150, required=False)
    role_id = serializers.IntegerField(required=False)
    phone = serializers.CharField(max_length=50, required=False, allow_blank=True)
    department = serializers.CharField(max_length=100, required=False, allow_blank=True)

    def __init__(self, *args, **kwargs):
        # Accept user instance for email uniqueness check
        self.instance_user = kwargs.pop("instance_user", None)
        super().__init__(*args, **kwargs)

    def validate_email(self, value):
        qs = User.objects.filter(email=value)
        if self.instance_user:
            qs = qs.exclude(pk=self.instance_user.pk)
        if qs.exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_role_id(self, value):
        if not Role.objects.filter(id=value).exists():
            raise serializers.ValidationError("Invalid role_id — no matching role found.")
        return value


class UserDeactivateSerializer(serializers.Serializer):
    """
    Action serializer for deactivating a user.
    No input fields needed — it is a POST action endpoint.
    """
    pass


# ---------------------------------------------------------------------------
# Audit log serializer
# ---------------------------------------------------------------------------


class AuditLogSerializer(serializers.ModelSerializer):
    """
    Read-only serializer for AuditLog entries.

    The user field returns the username string (or "System" if the user FK is
    null) rather than a nested object — keeps the API response flat and
    avoids leaking deleted-user IDs.
    """

    user = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "user",
            "action",
            "model_name",
            "object_id",
            "object_repr",
            "changes",
            "ip_address",
            "timestamp",
        ]
        read_only_fields = fields

    def get_user(self, obj) -> str:
        if obj.user is None:
            return "System"
        return obj.user.username


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for POST /api/users/change-password/.
    Validates current password and enforces new password strength rules.
    """

    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate_current_password(self, value):
        request = self.context.get("request")
        if request and not request.user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate_new_password(self, value):
        # Minimum 8 characters
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        # At least one uppercase letter
        if not re.search(r"[A-Z]", value):
            raise serializers.ValidationError("Password must contain at least one uppercase letter.")
        # At least one lowercase letter
        if not re.search(r"[a-z]", value):
            raise serializers.ValidationError("Password must contain at least one lowercase letter.")
        # At least one digit
        if not re.search(r"\d", value):
            raise serializers.ValidationError("Password must contain at least one digit.")
        return value

    def validate(self, attrs):
        new_password = attrs.get("new_password", "")
        confirm_password = attrs.get("confirm_password", "")
        current_password = attrs.get("current_password", "")

        if new_password != confirm_password:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})

        if new_password == current_password:
            raise serializers.ValidationError({"new_password": "New password must differ from current password."})

        return attrs
