import { apiFetch, ApiError, buildApiUrl } from "./api";

// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------

export interface UserRole {
  id: number;
  name: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole | null;
  is_force_password_change: boolean;
}

export interface LoginResponse {
  user: UserProfile;
}

// ---------------------------------------------------------------------------
// Auth utilities
// ---------------------------------------------------------------------------

/**
 * Login — POST /api/auth/login/
 * rememberMe: true → 7-day session via X-Remember-Me header
 */
export async function login(
  username: string,
  password: string,
  rememberMe: boolean
): Promise<LoginResponse> {
  const response = await fetch(buildApiUrl("/api/auth/login/"), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(rememberMe ? { "X-Remember-Me": "true" } : {}),
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const error = new ApiError(response.status, data);
    throw error;
  }

  return response.json() as Promise<LoginResponse>;
}

/**
 * Logout — POST /api/auth/logout/
 * Clears HttpOnly cookies server-side, then redirects to /login.
 */
export async function logout(): Promise<void> {
  try {
    await apiFetch<void>("/api/auth/logout/", {
      method: "POST",
      skipRefresh: true,
    } as Parameters<typeof apiFetch>[1]);
  } finally {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }
}

/**
 * Refresh token — POST /api/auth/refresh/
 * Returns true if successful.
 */
export async function refreshToken(): Promise<boolean> {
  try {
    await fetch(buildApiUrl("/api/auth/refresh/"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get current user profile — GET /api/auth/me/
 */
export async function getMe(): Promise<UserProfile> {
  return apiFetch<UserProfile>("/api/auth/me/");
}
