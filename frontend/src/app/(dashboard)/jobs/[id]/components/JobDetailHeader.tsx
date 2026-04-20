"use client";

import Link from "next/link";
import type { Job } from "@/types/job";
import { JOB_TYPE_LABELS } from "@/types/job";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface JobDetailHeaderProps {
  job: Job;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function JobDetailHeader({ job }: JobDetailHeaderProps) {
  const typeLabel = JOB_TYPE_LABELS[job.job_type] ?? job.job_type;

  return (
    <div className="space-y-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Back link */}
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
        style={{ color: "#1F7A8C" }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z" />
        </svg>
        Back to Jobs
      </Link>

      {/* Title row */}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold" style={{ color: "#2B3E50" }}>
          {job.job_number}
        </h1>
        <span
          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
          style={{ backgroundColor: "#e8f5f7", color: "#1F7A8C" }}
        >
          {typeLabel}
        </span>
      </div>

      {/* Subtitle */}
      <div className="flex items-center gap-2 flex-wrap text-sm text-gray-400">
        {job.customer_detail ? (
          <Link
            href={`/customers/${job.customer_detail.id}`}
            className="font-medium hover:underline transition-colors"
            style={{ color: "#1F7A8C" }}
          >
            {job.customer_detail.company_name}
          </Link>
        ) : job.customer_name ? (
          <span className="font-medium text-gray-600">{job.customer_name}</span>
        ) : null}

        {(job.customer_detail || job.customer_name) && (
          <span>·</span>
        )}

        <span>
          Created{" "}
          {new Date(job.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>

        {job.assigned_to_name && (
          <>
            <span>·</span>
            <span>Assigned to {job.assigned_to_name}</span>
          </>
        )}
      </div>
    </div>
  );
}
