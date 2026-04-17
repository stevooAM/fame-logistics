"use client";

import { useEffect, useState, useRef } from "react";
import { apiFetch } from "@/lib/api";

const POLL_INTERVAL_MS = 30_000;

interface PendingCountResponse {
  count: number;
}

/**
 * Polls /api/approvals/pending-count/ every 30 seconds and returns the
 * current pending approval count.
 *
 * @param enabled  Pass false to disable polling (e.g. for Finance role users
 *                 who would receive a 403 from that endpoint).
 */
export function useApprovalBadge(enabled = true): number {
  const [count, setCount] = useState<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchCount = async () => {
      try {
        const data = await apiFetch<PendingCountResponse>(
          "/api/approvals/pending-count/"
        );
        setCount(data.count);
      } catch {
        // Non-blocking — keep existing count on error
      }
    };

    fetchCount();
    intervalRef.current = setInterval(fetchCount, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled]);

  return count;
}
