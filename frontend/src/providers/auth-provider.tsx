"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { getMe, logout as authLogout, refreshToken, UserProfile } from "@/lib/auth";
import { setupTokenRefresh } from "@/lib/api";
import { useIdleTimeout } from "@/hooks/use-idle-timeout";
import { SessionWarningDialog } from "@/components/auth/session-warning-dialog";

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// useAuth hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// AuthProvider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSessionWarning, setShowSessionWarning] = useState(false);

  // Stable logout reference for idle timeout callbacks
  const logoutRef = useRef<() => Promise<void>>(async () => {});

  const logout = useCallback(async () => {
    setShowSessionWarning(false);
    await authLogout();
  }, []);

  // Keep the logout ref in sync
  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  const refreshUser = useCallback(async () => {
    try {
      const profile = await getMe();
      setUser(profile);
    } catch {
      await logoutRef.current();
    }
  }, []);

  // Load user on mount
  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const profile = await getMe();
        if (!cancelled) {
          setUser(profile);
        }
      } catch {
        if (!cancelled) {
          router.replace("/login");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // Set up proactive token refresh interval
  useEffect(() => {
    const stop = setupTokenRefresh();
    return stop;
  }, []);

  // Idle timeout — warning at 28 min, logout at 30 min
  const { resetTimers } = useIdleTimeout({
    onWarning: useCallback(() => {
      setShowSessionWarning(true);
    }, []),
    onTimeout: useCallback(() => {
      logoutRef.current();
    }, []),
  });

  const handleStayLoggedIn = useCallback(async () => {
    await refreshToken();
    resetTimers();
    setShowSessionWarning(false);
  }, [resetTimers]);

  // -------------------------------------------------------------------------
  // Loading state — full-screen spinner
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent"
          style={{ borderColor: "#1F7A8C", borderTopColor: "transparent" }}
          role="status"
          aria-label="Loading"
        />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
      {children}
      <SessionWarningDialog
        open={showSessionWarning}
        onStayLoggedIn={handleStayLoggedIn}
        onLogout={logout}
      />
    </AuthContext.Provider>
  );
}
