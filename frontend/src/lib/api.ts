function normalizeApiBaseUrl(rawUrl?: string): string {
  const baseUrl = (rawUrl || "http://localhost:8000").trim().replace(/\/+$/, "");
  return baseUrl.endsWith("/api") ? baseUrl.slice(0, -4) : baseUrl;
}

// In the browser, route API traffic through the Next.js app origin so auth
// cookies are first-party to the frontend domain and readable by middleware.
export const API_BASE_URL =
  typeof window === "undefined"
    ? normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL)
    : "";

function normalizeRequestPath(path: string): string {
  if (path.startsWith("http")) return path;
  if (!API_BASE_URL) return path.replace(/\/+$/, "");
  return path;
}

export function buildApiUrl(path: string): string {
  const normalizedPath = normalizeRequestPath(path);
  return normalizedPath.startsWith("http")
    ? normalizedPath
    : `${API_BASE_URL}${normalizedPath}`;
}

type FetchOptions = RequestInit & {
  skipRefresh?: boolean;
};

/**
 * Fetch wrapper that:
 * - Prepends API_BASE_URL to relative paths
 * - Always sends credentials (HttpOnly cookies)
 * - Sets Content-Type: application/json for non-GET requests
 * - Silently retries once on 401 by refreshing the JWT cookie
 * - Redirects to /login if refresh also fails
 */
export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { skipRefresh = false, ...fetchOptions } = options;

  const url = buildApiUrl(path);

  const headers: HeadersInit = {
    ...(fetchOptions.method && fetchOptions.method !== "GET"
      ? { "Content-Type": "application/json" }
      : {}),
    ...(fetchOptions.headers as Record<string, string> | undefined),
  };

  const response = await fetch(url, {
    ...fetchOptions,
    credentials: "include",
    headers,
  });

  if (response.status === 401 && !skipRefresh) {
    // Attempt silent token refresh
    const refreshed = await silentRefresh();
    if (refreshed) {
      // Retry the original request once
      const retryResponse = await fetch(url, {
        ...fetchOptions,
        credentials: "include",
        headers,
      });
      if (!retryResponse.ok) {
        redirectToLogin();
        throw new Error("Session expired");
      }
      return retryResponse.json() as Promise<T>;
    } else {
      redirectToLogin();
      throw new Error("Session expired");
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new ApiError(response.status, errorData);
    throw error;
  }

  // Handle empty responses (204 No Content)
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json() as Promise<T>;
}

async function silentRefresh(): Promise<boolean> {
  try {
    const response = await fetch(buildApiUrl("/api/auth/refresh/"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    return response.ok;
  } catch {
    return false;
  }
}

function redirectToLogin(): void {
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

export class ApiError extends Error {
  status: number;
  data: Record<string, unknown>;

  constructor(status: number, data: Record<string, unknown>) {
    super(`API error ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * Fetch wrapper for binary/blob responses (e.g. file downloads).
 *
 * Mirrors apiFetch credential/cookie/CSRF handling exactly but returns a Blob
 * instead of parsed JSON. Use this for Excel/CSV export endpoints.
 *
 * On 401: attempts silent token refresh then retries once.
 * On failure after retry: redirects to /login.
 */
export async function apiFetchBlob(
  path: string,
  options: FetchOptions = {}
): Promise<Blob> {
  const { skipRefresh = false, ...fetchOptions } = options;

  const url = buildApiUrl(path);

  const headers: HeadersInit = {
    ...(fetchOptions.method && fetchOptions.method !== "GET"
      ? { "Content-Type": "application/json" }
      : {}),
    ...(fetchOptions.headers as Record<string, string> | undefined),
  };

  const response = await fetch(url, {
    ...fetchOptions,
    credentials: "include",
    headers,
  });

  if (response.status === 401 && !skipRefresh) {
    const refreshed = await silentRefresh();
    if (refreshed) {
      const retryResponse = await fetch(url, {
        ...fetchOptions,
        credentials: "include",
        headers,
      });
      if (!retryResponse.ok) {
        redirectToLogin();
        throw new Error("Session expired");
      }
      return retryResponse.blob();
    } else {
      redirectToLogin();
      throw new Error("Session expired");
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(response.status, errorData);
  }

  return response.blob();
}

/**
 * Sets up a background interval that silently refreshes the JWT access token
 * every 13 minutes — well before the 15-minute access token expiry.
 *
 * Call once on application mount (e.g. inside a root layout or auth provider).
 * Returns a cleanup function that clears the interval; call it on unmount.
 *
 * @example
 * useEffect(() => {
 *   const stop = setupTokenRefresh();
 *   return stop;
 * }, []);
 */
export function setupTokenRefresh(): () => void {
  const REFRESH_INTERVAL_MS = 13 * 60 * 1000; // 13 minutes

  const intervalId = setInterval(async () => {
    try {
      await fetch(buildApiUrl("/api/auth/refresh/"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      // Silently ignore failures — the next apiFetch call will handle 401
    } catch {
      // Network error: ignore, apiFetch retry logic will handle it
    }
  }, REFRESH_INTERVAL_MS);

  return () => clearInterval(intervalId);
}
