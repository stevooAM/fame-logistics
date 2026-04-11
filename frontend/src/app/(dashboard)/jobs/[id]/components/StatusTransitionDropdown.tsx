"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { StatusBadge } from "@/app/(dashboard)/jobs/components/StatusBadge";
import { ConfirmStatusDialog } from "./ConfirmStatusDialog";
import type { Job, JobStatus } from "@/types/job";
import { JOB_STATUS_CONFIG } from "@/types/job";

// ---------------------------------------------------------------------------
// Transition map — forward transitions available to all staff
// ---------------------------------------------------------------------------

const FORWARD_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  DRAFT: ["PENDING", "CANCELLED"],
  PENDING: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["CUSTOMS", "CANCELLED"],
  CUSTOMS: ["DELIVERED", "CANCELLED"],
  DELIVERED: ["CLOSED", "CANCELLED"],
  CLOSED: [],
  CANCELLED: [],
};

// Backward transitions — Admin only
const BACKWARD_TRANSITIONS: Record<JobStatus, JobStatus | null> = {
  DRAFT: null,
  PENDING: "DRAFT",
  IN_PROGRESS: "PENDING",
  CUSTOMS: "IN_PROGRESS",
  DELIVERED: "CUSTOMS",
  CLOSED: "DELIVERED",
  CANCELLED: null,
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface StatusTransitionDropdownProps {
  job: Job;
  userRole: string;
  onStatusChange: (job: Job) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StatusTransitionDropdown({
  job,
  userRole,
  onStatusChange,
}: StatusTransitionDropdownProps) {
  const [open, setOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<JobStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const role = userRole.toLowerCase();
  const isFinance = role === "finance";
  const isAdmin = role === "admin";

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  // Build list of available transitions
  const forwardOptions = FORWARD_TRANSITIONS[job.status] ?? [];
  const backwardTarget = isAdmin ? BACKWARD_TRANSITIONS[job.status] : null;
  const allOptions: Array<{ status: JobStatus; isBackward: boolean }> = [
    ...forwardOptions.map((s) => ({ status: s, isBackward: false })),
    ...(backwardTarget ? [{ status: backwardTarget, isBackward: true }] : []),
  ];

  const hasOptions = allOptions.length > 0;
  const isDisabled = isFinance || !hasOptions;

  async function handleConfirm() {
    if (!confirmTarget) return;
    setIsLoading(true);
    setError(null);
    try {
      const updated = await apiFetch<Job>(
        `/api/jobs/${job.id}/transition/`,
        {
          method: "PATCH",
          body: JSON.stringify({ new_status: confirmTarget }),
        }
      );
      onStatusChange(updated);
      setConfirmTarget(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setError("Only Admin can reverse job status.");
      } else if (err instanceof ApiError) {
        const msg = err.data?.detail ?? err.data?.new_status;
        setError(
          typeof msg === "string"
            ? msg
            : Array.isArray(msg)
            ? String(msg[0])
            : "Failed to update status."
        );
      } else {
        setError("Failed to update status.");
      }
      setConfirmTarget(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: "#1F7A8C" }}>
        Job Status
      </p>

      <div ref={ref} className="relative inline-block">
        {isDisabled ? (
          // Finance or terminal state: show badge only
          <div className="flex items-center gap-2">
            <StatusBadge status={job.status} />
            {isFinance && (
              <span className="text-xs text-gray-400">(view only)</span>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1F7A8C]"
          >
            <StatusBadge status={job.status} />
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="currentColor"
              className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
            >
              <path d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z" />
            </svg>
          </button>
        )}

        {open && (
          <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px]">
            {allOptions.map(({ status, isBackward }) => {
              const config = JOB_STATUS_CONFIG[status];
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setConfirmTarget(status);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-gray-50"
                >
                  <StatusBadge status={status} />
                  {isBackward && (
                    <span className="text-xs text-amber-600 ml-auto">Reverse</span>
                  )}
                  {!isBackward && (
                    <span className="sr-only">{config?.label}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}

      <ConfirmStatusDialog
        open={confirmTarget !== null}
        onClose={() => setConfirmTarget(null)}
        currentStatus={job.status}
        newStatus={confirmTarget ?? job.status}
        onConfirm={handleConfirm}
        isLoading={isLoading}
      />
    </div>
  );
}
