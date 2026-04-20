"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import type { DashboardResponse, ActivityEntry } from "@/types/dashboard";

const POLL_INTERVAL_MS = 30_000;

interface UseDashboardResult {
  data: DashboardResponse | null;
  loading: boolean;
  extraEntries: ActivityEntry[];
  feedNext: string | null;
  loadingMore: boolean;
  loadMore: () => Promise<void>;
}

/**
 * Fetches GET /api/dashboard/ and polls every 30 seconds.
 *
 * Behaviour mirrors useApprovalBadge:
 * - loading = true only on first fetch (data === null) — no flash to zero on re-polls
 * - Non-blocking catch — keeps existing data on error
 * - loadMore appends paginated entries from /api/dashboard/activity/
 */
export function useDashboard(): UseDashboardResult {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [extraEntries, setExtraEntries] = useState<ActivityEntry[]>([]);
  const [feedNext, setFeedNext] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Track whether we have received the first response
  const initializedRef = useRef(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const response = await apiFetch<DashboardResponse>("/api/dashboard/");
      setData(response);
      // Update feedNext from fresh poll only if user has not loaded extra pages
      // to avoid resetting their pagination position
      if (!initializedRef.current) {
        setFeedNext(response.feed.next);
      }
      initializedRef.current = true;
    } catch {
      // Non-blocking — keep existing data on error
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    intervalRef.current = setInterval(fetchDashboard, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchDashboard]);

  const loadMore = useCallback(async () => {
    if (!feedNext || loadingMore) return;

    setLoadingMore(true);
    try {
      // feedNext is the full URL returned by DRF pagination
      const url = feedNext.startsWith("http")
        ? feedNext
        : `/api/dashboard/activity/?${feedNext.split("?")[1] ?? ""}`;

      const page = await apiFetch<DashboardResponse["feed"]>(url);
      setExtraEntries((prev) => [...prev, ...page.results]);
      setFeedNext(page.next);
    } catch {
      // Non-blocking — keep existing entries on error
    } finally {
      setLoadingMore(false);
    }
  }, [feedNext, loadingMore]);

  // loading = true only when data === null (first fetch not yet complete)
  const loading = data === null;

  return { data, loading, extraEntries, feedNext, loadingMore, loadMore };
}
