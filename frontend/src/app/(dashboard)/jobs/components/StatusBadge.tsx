"use client";

import { JOB_STATUS_CONFIG } from "@/types/job";
import type { JobStatus } from "@/types/job";

interface StatusBadgeProps {
  status: JobStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = JOB_STATUS_CONFIG[status];
  if (!config) return <span className="text-xs text-gray-400">{status}</span>;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color} ${config.bg}`}
    >
      {config.label}
    </span>
  );
}
