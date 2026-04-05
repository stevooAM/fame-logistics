from django.urls import path

from . import views

urlpatterns = [
    # Health check
    path("health/", views.health_check, name="health_check"),

    # Auth endpoints
    path("auth/login/", views.LoginView.as_view(), name="auth_login"),
    path("auth/logout/", views.LogoutView.as_view(), name="auth_logout"),
    path("auth/refresh/", views.RefreshView.as_view(), name="auth_refresh"),
    path("auth/me/", views.MeView.as_view(), name="auth_me"),
    path("auth/password-reset/request/", views.PasswordResetRequestView.as_view(), name="auth_password_reset_request"),
    path("auth/password-reset/confirm/", views.PasswordResetConfirmView.as_view(), name="auth_password_reset_confirm"),
    path("auth/password-change/", views.PasswordChangeView.as_view(), name="auth_password_change"),

    # User management (IMPORTANT: change-password before <int:pk> to avoid routing conflict)
    path("users/", views.UserListCreateView.as_view(), name="user_list_create"),
    path("users/change-password/", views.ChangePasswordView.as_view(), name="change_password"),
    path("users/<int:pk>/", views.UserDetailView.as_view(), name="user_detail"),
    path("users/<int:pk>/deactivate/", views.UserDeactivateView.as_view(), name="user_deactivate"),
    path("users/<int:pk>/activate/", views.UserActivateView.as_view(), name="user_activate"),

    # Role list
    path("roles/", views.RoleListView.as_view(), name="role_list"),
]
