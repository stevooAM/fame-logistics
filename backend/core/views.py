"""
Core views — health check + all auth API endpoints.

Auth endpoints use HttpOnly cookies for JWT storage (access + refresh tokens).
No tokens are ever returned in the response body — cookie-only for XSS protection.
"""

import logging

from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import connection
from django.utils import timezone
from datetime import timedelta
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from core.models import AuditLog, PasswordResetToken, Role, UserProfile
from core.permissions import IsAdmin
from core.serializers import (
    ChangePasswordSerializer,
    LoginSerializer,
    PasswordChangeSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RoleSerializer,
    UserCreateSerializer,
    UserListSerializer,
    UserProfileSerializer,
    UserUpdateSerializer,
)
from core.utils import get_client_ip

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Cookie constants
# ---------------------------------------------------------------------------

ACCESS_TOKEN_COOKIE = "access_token"
REFRESH_TOKEN_COOKIE = "refresh_token"

ACCESS_TOKEN_MAX_AGE = 900          # 15 minutes (seconds)
REFRESH_TOKEN_MAX_AGE = 604800      # 7 days (seconds)
REMEMBER_ME_ACCESS_MAX_AGE = 604800 # 7 days when remember_me=True


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str, remember_me: bool = False) -> None:
    """Set HttpOnly JWT cookies on the response."""
    secure = not settings.DEBUG
    access_max_age = REMEMBER_ME_ACCESS_MAX_AGE if remember_me else ACCESS_TOKEN_MAX_AGE

    response.set_cookie(
        ACCESS_TOKEN_COOKIE,
        access_token,
        max_age=access_max_age,
        httponly=True,
        secure=secure,
        samesite="Lax",
        path="/",
    )
    response.set_cookie(
        REFRESH_TOKEN_COOKIE,
        refresh_token,
        max_age=REFRESH_TOKEN_MAX_AGE,
        httponly=True,
        secure=secure,
        samesite="Lax",
        path="/",
    )


def _delete_auth_cookies(response: Response) -> None:
    """Clear JWT cookies from the browser."""
    response.delete_cookie(ACCESS_TOKEN_COOKIE, path="/")
    response.delete_cookie(REFRESH_TOKEN_COOKIE, path="/")


# ---------------------------------------------------------------------------
# Health check (existing)
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------

class LoginView(APIView):
    """
    POST /api/auth/login/

    Authenticate with username + password.
    On success: set HttpOnly JWT cookies and return user profile.
    On failure: return 401 with generic error (no credential enumeration).
    """

    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        username = serializer.validated_data["username"]
        password = serializer.validated_data["password"]
        remember_me = serializer.validated_data.get("remember_me", False)

        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        # Generate tokens
        from core.serializers import CustomTokenObtainPairSerializer
        refresh = CustomTokenObtainPairSerializer.get_token(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        # Build profile response — requires UserProfile
        try:
            profile = user.profile
            profile_data = UserProfileSerializer(profile).data
        except Exception:
            profile_data = {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": None,
                "is_force_password_change": False,
            }

        response = Response({"user": profile_data}, status=status.HTTP_200_OK)
        _set_auth_cookies(response, access_token, refresh_token, remember_me)

        # Audit log
        try:
            AuditLog.objects.create(
                user=user,
                action="LOGIN",
                model_name="User",
                object_id=str(user.id),
                object_repr=user.username,
                changes={},
                ip_address=get_client_ip(request),
            )
        except Exception:
            logger.exception("Failed to write LOGIN audit log for user %s", user.username)

        return response


# ---------------------------------------------------------------------------
# Logout
# ---------------------------------------------------------------------------

class LogoutView(APIView):
    """
    POST /api/auth/logout/

    Blacklist the refresh token and clear both JWT cookies.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        refresh_token_value = request.COOKIES.get(REFRESH_TOKEN_COOKIE)

        if refresh_token_value:
            try:
                token = RefreshToken(refresh_token_value)
                token.blacklist()
            except TokenError:
                # Token already blacklisted or invalid — proceed with logout anyway
                pass
            except Exception:
                logger.exception("Unexpected error blacklisting refresh token during logout")

        # Audit log
        try:
            AuditLog.objects.create(
                user=request.user,
                action="LOGOUT",
                model_name="User",
                object_id=str(request.user.id),
                object_repr=request.user.username,
                changes={},
                ip_address=get_client_ip(request),
            )
        except Exception:
            logger.exception("Failed to write LOGOUT audit log for user %s", request.user.username)

        response = Response({"message": "Logged out"}, status=status.HTTP_200_OK)
        _delete_auth_cookies(response)
        return response


# ---------------------------------------------------------------------------
# Token refresh
# ---------------------------------------------------------------------------

class RefreshView(APIView):
    """
    POST /api/auth/refresh/

    Read refresh token from cookie, issue new access token cookie.
    Implements refresh token rotation (ROTATE_REFRESH_TOKENS=True in settings).
    """

    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        refresh_token_value = request.COOKIES.get(REFRESH_TOKEN_COOKIE)

        if not refresh_token_value:
            return Response({"error": "No refresh token"}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            refresh = RefreshToken(refresh_token_value)
            new_access_token = str(refresh.access_token)

            # Rotate refresh token if configured
            if settings.SIMPLE_JWT.get("ROTATE_REFRESH_TOKENS", False):
                refresh.blacklist()
                # Create a new refresh token for the user
                user_id = refresh.payload.get("user_id")
                user = User.objects.get(id=user_id)
                from core.serializers import CustomTokenObtainPairSerializer
                new_refresh = CustomTokenObtainPairSerializer.get_token(user)
                new_refresh_token = str(new_refresh)
            else:
                new_refresh_token = refresh_token_value

        except TokenError:
            response = Response({"error": "Invalid or expired token"}, status=status.HTTP_401_UNAUTHORIZED)
            _delete_auth_cookies(response)
            return response
        except User.DoesNotExist:
            response = Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)
            _delete_auth_cookies(response)
            return response
        except Exception:
            logger.exception("Unexpected error during token refresh")
            response = Response({"error": "Token refresh failed"}, status=status.HTTP_401_UNAUTHORIZED)
            _delete_auth_cookies(response)
            return response

        response = Response({"message": "Token refreshed"}, status=status.HTTP_200_OK)
        secure = not settings.DEBUG
        response.set_cookie(
            ACCESS_TOKEN_COOKIE,
            new_access_token,
            max_age=ACCESS_TOKEN_MAX_AGE,
            httponly=True,
            secure=secure,
            samesite="Lax",
            path="/",
        )
        if new_refresh_token != refresh_token_value:
            response.set_cookie(
                REFRESH_TOKEN_COOKIE,
                new_refresh_token,
                max_age=REFRESH_TOKEN_MAX_AGE,
                httponly=True,
                secure=secure,
                samesite="Lax",
                path="/",
            )
        return response


# ---------------------------------------------------------------------------
# Me (current user profile)
# ---------------------------------------------------------------------------

class MeView(APIView):
    """
    GET /api/auth/me/

    Return the authenticated user's profile with role.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        try:
            profile = request.user.profile
            data = UserProfileSerializer(profile).data
        except Exception:
            # UserProfile does not exist — return minimal data
            data = {
                "id": request.user.id,
                "username": request.user.username,
                "email": request.user.email,
                "first_name": request.user.first_name,
                "last_name": request.user.last_name,
                "role": None,
                "is_force_password_change": False,
            }
        return Response(data, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Password reset (self-service)
# ---------------------------------------------------------------------------

class PasswordResetRequestView(APIView):
    """
    POST /api/auth/password-reset/request/

    Accept email. Create a reset token if a user exists.
    Always returns 200 to prevent email enumeration.
    """

    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        serializer = PasswordResetRequestSerializer(data=request.data)
        if not serializer.is_valid():
            # Return 200 regardless — do not reveal validation details
            return Response({"message": "If that email exists, a reset link has been sent."}, status=status.HTTP_200_OK)

        email = serializer.validated_data["email"]

        try:
            user = User.objects.get(email=email)
            # Create a reset token valid for 1 hour
            PasswordResetToken.objects.create(
                user=user,
                expires_at=timezone.now() + timedelta(hours=1),
            )
            logger.info("Password reset token created for user %s", user.username)
        except User.DoesNotExist:
            # Silently succeed — do not reveal that the email was not found
            pass
        except Exception:
            logger.exception("Error creating password reset token for email %s", email)

        return Response(
            {"message": "If that email exists, a reset link has been sent."},
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    """
    POST /api/auth/password-reset/confirm/

    Accept token UUID + new_password. Validate token, set password, mark token used.
    """

    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        token_uuid = serializer.validated_data["token"]
        new_password = serializer.validated_data["new_password"]

        try:
            reset_token = PasswordResetToken.objects.select_related("user").get(token=token_uuid)
        except PasswordResetToken.DoesNotExist:
            return Response({"error": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)

        if not reset_token.is_valid():
            return Response({"error": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)

        user = reset_token.user

        # Validate new password against Django password validators
        try:
            validate_password(new_password, user=user)
        except DjangoValidationError as exc:
            return Response({"error": list(exc.messages)}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save(update_fields=["password"])

        # Clear force password change flag if set
        try:
            profile = user.profile
            if profile.is_force_password_change:
                profile.is_force_password_change = False
                profile.save(update_fields=["is_force_password_change"])
        except Exception:
            pass

        # Mark token as used
        reset_token.is_used = True
        reset_token.save(update_fields=["is_used"])

        logger.info("Password reset completed for user %s", user.username)
        return Response({"message": "Password has been reset successfully."}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Password change (authenticated — force-reset flow)
# ---------------------------------------------------------------------------

class PasswordChangeView(APIView):
    """
    POST /api/auth/password-change/

    Allow an authenticated user to change their own password.
    Used in the forced-password-change flow after first login.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        serializer = PasswordChangeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        old_password = serializer.validated_data["old_password"]
        new_password = serializer.validated_data["new_password"]

        # Verify current password
        if not request.user.check_password(old_password):
            return Response({"error": "Current password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)

        # Validate new password against Django validators
        try:
            validate_password(new_password, user=request.user)
        except DjangoValidationError as exc:
            return Response({"error": list(exc.messages)}, status=status.HTTP_400_BAD_REQUEST)

        request.user.set_password(new_password)
        request.user.save(update_fields=["password"])

        # Clear force password change flag
        try:
            profile = request.user.profile
            if profile.is_force_password_change:
                profile.is_force_password_change = False
                profile.save(update_fields=["is_force_password_change"])
        except Exception:
            pass

        logger.info("Password changed by user %s", request.user.username)
        return Response({"message": "Password changed successfully."}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# User management views (Admin only, except ChangePasswordView)
# ---------------------------------------------------------------------------

class UserListCreateView(APIView):
    """
    GET  /api/users/  — list all users with pagination, search, and is_active filter.
    POST /api/users/  — create a new user and return temp_password.
    """

    permission_classes = [IsAdmin]

    def get(self, request: Request) -> Response:
        queryset = UserProfile.objects.select_related("user", "role").order_by("user__username")

        # ?search= — filter by username, email, first_name, last_name
        search = request.query_params.get("search", "").strip()
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(user__username__icontains=search)
                | Q(user__email__icontains=search)
                | Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search)
            )

        # ?is_active= — filter by active status (true/false string)
        is_active_param = request.query_params.get("is_active", "").strip().lower()
        if is_active_param == "true":
            queryset = queryset.filter(user__is_active=True)
        elif is_active_param == "false":
            queryset = queryset.filter(user__is_active=False)

        # Server-side pagination (page_size=20)
        page_size = 20
        try:
            page = max(1, int(request.query_params.get("page", 1)))
        except (ValueError, TypeError):
            page = 1

        total_count = queryset.count()
        offset = (page - 1) * page_size
        page_qs = queryset[offset: offset + page_size]

        serializer = UserListSerializer(page_qs, many=True)

        # Build next/previous URLs
        base_url = request.build_absolute_uri(request.path)
        next_url = f"{base_url}?page={page + 1}" if offset + page_size < total_count else None
        prev_url = f"{base_url}?page={page - 1}" if page > 1 else None

        return Response(
            {
                "count": total_count,
                "next": next_url,
                "previous": prev_url,
                "results": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request: Request) -> Response:
        serializer = UserCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        result = serializer.save()
        user = result["user"]
        temp_password = result["temp_password"]

        # Audit log
        try:
            AuditLog.objects.create(
                user=request.user,
                action="CREATE",
                model_name="User",
                object_id=str(user.id),
                object_repr=user.username,
                changes={"username": user.username, "email": user.email},
                ip_address=get_client_ip(request),
            )
        except Exception:
            logger.exception("Failed to write CREATE audit log for new user %s", user.username)

        profile = user.profile
        user_data = UserListSerializer(profile).data
        return Response(
            {"user": user_data, "temp_password": temp_password},
            status=status.HTTP_201_CREATED,
        )


class UserDetailView(APIView):
    """
    GET   /api/users/{pk}/  — retrieve single user.
    PATCH /api/users/{pk}/  — partial update of user fields.
    """

    permission_classes = [IsAdmin]

    def _get_user_profile(self, pk: int):
        """Return (user, profile) or raise Http404."""
        from django.http import Http404
        try:
            user = User.objects.select_related("profile__role").get(pk=pk)
            return user, user.profile
        except User.DoesNotExist:
            raise Http404

    def get(self, request: Request, pk: int) -> Response:
        user, profile = self._get_user_profile(pk)
        serializer = UserListSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request: Request, pk: int) -> Response:
        user, profile = self._get_user_profile(pk)

        serializer = UserUpdateSerializer(data=request.data, instance_user=user)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated = serializer.validated_data
        changes = {}

        # Update User fields
        user_fields_changed = False
        for field in ("email", "first_name", "last_name"):
            if field in validated:
                old_val = getattr(user, field)
                new_val = validated[field]
                if old_val != new_val:
                    changes[field] = {"old": old_val, "new": new_val}
                    setattr(user, field, new_val)
                    user_fields_changed = True
        if user_fields_changed:
            user.save(update_fields=[f for f in ("email", "first_name", "last_name") if f in validated])

        # Update UserProfile fields
        profile_fields_changed = False
        for field in ("phone", "department"):
            if field in validated:
                old_val = getattr(profile, field)
                new_val = validated[field]
                if old_val != new_val:
                    changes[field] = {"old": old_val, "new": new_val}
                    setattr(profile, field, new_val)
                    profile_fields_changed = True

        if "role_id" in validated:
            role = Role.objects.get(id=validated["role_id"])
            old_role = profile.role.name if profile.role else None
            if old_role != role.name:
                changes["role"] = {"old": old_role, "new": role.name}
            profile.role = role
            profile_fields_changed = True

        if profile_fields_changed:
            save_fields = []
            if "phone" in validated:
                save_fields.append("phone")
            if "department" in validated:
                save_fields.append("department")
            if "role_id" in validated:
                save_fields.append("role")
            profile.save(update_fields=save_fields)

        # Audit log
        try:
            AuditLog.objects.create(
                user=request.user,
                action="UPDATE",
                model_name="User",
                object_id=str(user.id),
                object_repr=user.username,
                changes=changes,
                ip_address=get_client_ip(request),
            )
        except Exception:
            logger.exception("Failed to write UPDATE audit log for user %s", user.username)

        profile.refresh_from_db()
        serializer = UserListSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserDeactivateView(APIView):
    """POST /api/users/{pk}/deactivate/ — deactivate user and blacklist all tokens."""

    permission_classes = [IsAdmin]

    def post(self, request: Request, pk: int) -> Response:
        from django.http import Http404
        try:
            user = User.objects.select_related("profile").get(pk=pk)
        except User.DoesNotExist:
            raise Http404

        # Deactivate
        user.is_active = False
        user.save(update_fields=["is_active"])
        user.profile.is_active = False
        user.profile.save(update_fields=["is_active"])

        # Blacklist all outstanding refresh tokens for this user
        try:
            from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
            outstanding_tokens = OutstandingToken.objects.filter(user=user)
            for token in outstanding_tokens:
                BlacklistedToken.objects.get_or_create(token=token)
        except Exception:
            logger.exception("Failed to blacklist tokens for user %s during deactivation", user.username)

        # Audit log
        try:
            AuditLog.objects.create(
                user=request.user,
                action="UPDATE",
                model_name="User",
                object_id=str(user.id),
                object_repr=user.username,
                changes={"description": f"Deactivated user: {user.username}"},
                ip_address=get_client_ip(request),
            )
        except Exception:
            logger.exception("Failed to write UPDATE audit log for deactivation of user %s", user.username)

        return Response({"message": f"User '{user.username}' has been deactivated."}, status=status.HTTP_200_OK)


class UserActivateView(APIView):
    """POST /api/users/{pk}/activate/ — reactivate a deactivated user."""

    permission_classes = [IsAdmin]

    def post(self, request: Request, pk: int) -> Response:
        from django.http import Http404
        try:
            user = User.objects.select_related("profile").get(pk=pk)
        except User.DoesNotExist:
            raise Http404

        user.is_active = True
        user.save(update_fields=["is_active"])
        user.profile.is_active = True
        user.profile.save(update_fields=["is_active"])

        # Audit log
        try:
            AuditLog.objects.create(
                user=request.user,
                action="UPDATE",
                model_name="User",
                object_id=str(user.id),
                object_repr=user.username,
                changes={"description": f"Activated user: {user.username}"},
                ip_address=get_client_ip(request),
            )
        except Exception:
            logger.exception("Failed to write UPDATE audit log for activation of user %s", user.username)

        return Response({"message": f"User '{user.username}' has been activated."}, status=status.HTTP_200_OK)


class RoleListView(APIView):
    """GET /api/roles/ — return all roles (no pagination; only 3 rows)."""

    permission_classes = [IsAdmin]

    def get(self, request: Request) -> Response:
        roles = Role.objects.all()
        serializer = RoleSerializer(roles, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ChangePasswordView(APIView):
    """
    POST /api/users/change-password/

    Allow any authenticated user to change their own password.
    Clears is_force_password_change flag on success.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        new_password = serializer.validated_data["new_password"]

        request.user.set_password(new_password)
        request.user.save(update_fields=["password"])

        # Clear force password change flag
        try:
            profile = request.user.profile
            if profile.is_force_password_change:
                profile.is_force_password_change = False
                profile.save(update_fields=["is_force_password_change"])
        except Exception:
            logger.exception("Failed to clear is_force_password_change for user %s", request.user.username)

        logger.info("Password changed via /api/users/change-password/ by user %s", request.user.username)
        return Response({"message": "Password changed successfully."}, status=status.HTTP_200_OK)
