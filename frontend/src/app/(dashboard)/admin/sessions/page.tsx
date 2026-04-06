"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { ActiveSession } from "@/types/session";
import { SessionTable } from "./components/SessionTable";

const REFRESH_INTERVAL_MS = 30_000; // 30 seconds

export default function SessionsPage() {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const data = await apiFetch<ActiveSession[]>("/api/sessions/");
      setSessions(data);
      setError(null);
    } catch {
      setError("Failed to load active sessions. Please refresh the page.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const intervalId = setInterval(fetchSessions, REFRESH_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [fetchSessions]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#2B3E50" }}>
          Active Sessions
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          View and terminate active user sessions. Auto-refreshes every 30 seconds.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
            Loading sessions...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-16 text-red-500 text-sm">
            {error}
          </div>
        ) : (
          <SessionTable sessions={sessions} onRefresh={fetchSessions} />
        )}
      </div>
    </div>
  );
}
