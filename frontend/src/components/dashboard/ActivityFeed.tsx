"use client";

import type { ActivityEntry } from "@/types/dashboard";

interface ActivityFeedProps {
  entries: ActivityEntry[];
  feedNext: string | null;
  loadingMore: boolean;
  onLoadMore: () => void;
  loading: boolean;
}

/**
 * Formats an ISO 8601 timestamp as a relative string like "2 hours ago"
 * using Intl.RelativeTimeFormat. No date-fns required.
 */
function formatRelativeTime(isoTimestamp: string): string {
  const now = Date.now();
  const then = new Date(isoTimestamp).getTime();
  const diffMs = then - now; // negative = in the past
  const diffSeconds = Math.round(diffMs / 1000);
  const diffMinutes = Math.round(diffSeconds / 60);
  const diffHours = Math.round(diffMinutes / 60);
  const diffDays = Math.round(diffHours / 24);

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffSeconds) < 60) {
    return rtf.format(diffSeconds, "second");
  }
  if (Math.abs(diffMinutes) < 60) {
    return rtf.format(diffMinutes, "minute");
  }
  if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, "hour");
  }
  if (Math.abs(diffDays) < 30) {
    return rtf.format(diffDays, "day");
  }
  const diffMonths = Math.round(diffDays / 30);
  if (Math.abs(diffMonths) < 12) {
    return rtf.format(diffMonths, "month");
  }
  const diffYears = Math.round(diffDays / 365);
  return rtf.format(diffYears, "year");
}

function SkeletonEntry() {
  return (
    <div className="py-3 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-full bg-gray-200 flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}

function EntryRow({ entry }: { entry: ActivityEntry }) {
  const initials = entry.actor_name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="py-3">
      <div className="flex items-start gap-3">
        <span
          className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
          style={{ backgroundColor: "#1F7A8C" }}
          aria-hidden="true"
        >
          {initials}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 leading-snug">
            <span className="font-semibold" style={{ color: "#2B3E50" }}>
              {entry.actor_name}
            </span>{" "}
            {entry.action}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatRelativeTime(entry.timestamp)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ActivityFeed({
  entries,
  feedNext,
  loadingMore,
  onLoadMore,
  loading,
}: ActivityFeedProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h2
        className="text-base font-semibold mb-1"
        style={{ color: "#2B3E50" }}
      >
        Recent Activity
      </h2>
      <p className="text-xs text-gray-400 mb-4">Latest system events</p>

      {loading ? (
        <div className="divide-y divide-gray-50">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonEntry key={i} />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <svg
            className="h-10 w-10 text-gray-300 mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-sm text-gray-400">No recent activity</p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-gray-50">
            {entries.map((entry) => (
              <EntryRow key={entry.id} entry={entry} />
            ))}
          </div>

          {feedNext !== null && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={onLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 rounded-lg border border-[#1F7A8C] px-4 py-2 text-sm font-medium text-[#1F7A8C] hover:bg-[#1F7A8C]/5 disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-[#1F7A8C]/40"
              >
                {loadingMore ? (
                  <>
                    <span
                      className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#1F7A8C] border-t-transparent"
                      aria-hidden="true"
                    />
                    Loading...
                  </>
                ) : (
                  "Load more"
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
