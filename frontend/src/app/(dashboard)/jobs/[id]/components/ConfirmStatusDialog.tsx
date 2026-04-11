"use client";

import { StatusBadge } from "@/app/(dashboard)/jobs/components/StatusBadge";
import type { JobStatus } from "@/types/job";

interface ConfirmStatusDialogProps {
  open: boolean;
  onClose: () => void;
  currentStatus: JobStatus;
  newStatus: JobStatus;
  onConfirm: () => void;
  isLoading: boolean;
}

export function ConfirmStatusDialog({
  open,
  onClose,
  currentStatus,
  newStatus,
  onConfirm,
  isLoading,
}: ConfirmStatusDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {/* Teal top rail */}
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
          style={{ background: "linear-gradient(to right, #1F7A8C, #2ab8d4)" }}
        />

        <h2 className="text-base font-semibold mt-2 mb-2" style={{ color: "#2B3E50" }}>
          Confirm Status Change
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Change status from{" "}
          <StatusBadge status={currentStatus} />
          {" "}to{" "}
          <StatusBadge status={newStatus} />?
        </p>
        <p className="text-xs text-gray-400 mb-6">
          This action will be recorded in the audit trail.
        </p>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            style={{ backgroundColor: "#1F7A8C" }}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Confirming...
              </>
            ) : (
              "Confirm"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
