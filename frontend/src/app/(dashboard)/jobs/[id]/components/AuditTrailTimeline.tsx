"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { StatusBadge } from "@/app/(dashboard)/jobs/components/StatusBadge";
import type { JobAuditEntry, JobStatus } from "@/types/job";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const JOB_STATUS_VALUES: Set<string> = new Set([
  "DRAFT",
  "PENDING",
  "IN_PROGRESS",
  "CUSTOMS",
  "DELIVERED",
  "CLOSED",
  "CANCELLED",
]);

function isJobStatus(value: string): value is JobStatus {
  return JOB_STATUS_VALUES.has(value);
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getActionLabel(entry: JobAuditEntry): React.ReactNode {
  switch (entry.action) {
    case "CREATED":
      return <span className="text-gray-700">Job created</span>;

    case "STATUS_CHANGED": {
      const oldVal = entry.old_value;
      const newVal = entry.new_value;
      return (
        <span className="flex items-center gap-1.5 flex-wrap text-gray-700">
          Status changed:{" "}
          {isJobStatus(oldVal) ? (
            <StatusBadge status={oldVal} />
          ) : (
            <span className="text-xs font-medium">{oldVal || "—"}</span>
          )}
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="text-gray-400 flex-shrink-0">
            <path d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z" />
          </svg>
          {isJobStatus(newVal) ? (
            <StatusBadge status={newVal} />
          ) : (
            <span className="text-xs font-medium">{newVal || "—"}</span>
          )}
        </span>
      );
    }

    case "DOCUMENT_UPLOADED":
      return (
        <span className="text-gray-700">
          Document uploaded:{" "}
          <span className="font-medium">{entry.new_value || "Unknown file"}</span>
        </span>
      );

    case "DOCUMENT_DELETED":
      return (
        <span className="text-gray-700">
          Document deleted:{" "}
          <span className="font-medium">{entry.old_value || "Unknown file"}</span>
        </span>
      );

    case "UPDATED":
      return <span className="text-gray-700">Job details updated</span>;

    default:
      return (
        <span className="text-gray-700">
          {entry.action.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
        </span>
      );
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AuditTrailTimelineProps {
  jobId: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AuditTrailTimeline({ jobId }: AuditTrailTimelineProps) {
  const [entries, setEntries] = useState<JobAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiFetch<JobAuditEntry[]>(`/api/jobs/${jobId}/audit-trail/`)
      .then((data) => {
        // Newest first
        setEntries([...data].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)));
      })
      .catch(() => setError("Failed to load audit trail."))
      .finally(() => setLoading(false));
  }, [jobId]);

  return (
    <div
      className="rounded-xl border border-gray-100 bg-white shadow-sm p-4 space-y-4"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Section header */}
      <div className="flex items-center gap-2">
        <span
          className="text-[10px] font-semibold tracking-widest uppercase"
          style={{ color: "#1F7A8C" }}
        >
          Audit Trail
        </span>
        <div className="flex-1 h-px" style={{ background: "#e5f4f6" }} />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-200 mt-1 flex-shrink-0 animate-pulse" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-3/4 rounded bg-gray-100 animate-pulse" />
                <div className="h-3 w-1/2 rounded bg-gray-100 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="text-xs text-red-500">{error}</p>
      ) : entries.length === 0 ? (
        <p className="text-xs text-gray-400 py-2 text-center">No activity recorded.</p>
      ) : (
        <ol className="relative border-l border-gray-100 ml-1 space-y-4">
          {entries.map((entry) => (
            <li key={entry.id} className="ml-4">
              {/* Timeline dot */}
              <span
                className="absolute -left-[5px] flex h-2.5 w-2.5 rounded-full border-2 border-white"
                style={{ backgroundColor: "#1F7A8C" }}
              />

              <div className="text-sm leading-snug">
                {getActionLabel(entry)}
              </div>

              <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400">
                <span>{entry.user_name ?? "System"}</span>
                <span>·</span>
                <time
                  title={entry.created_at}
                  dateTime={entry.created_at}
                >
                  {formatTimestamp(entry.created_at)}
                </time>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
