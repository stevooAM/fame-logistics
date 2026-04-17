"use client";

import { useState } from "react";

interface RejectModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

export function RejectModal({ open, onClose, onConfirm }: RejectModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  async function handleSubmit() {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("A rejection reason is required.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await onConfirm(trimmed);
      setReason("");
      setSubmitting(false);
    } catch {
      setError("Failed to reject. Please try again.");
      setSubmitting(false);
    }
  }

  function handleClose() {
    if (submitting) return;
    setReason("");
    setError("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold mb-1" style={{ color: "#2B3E50" }}>
          Reject Job
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          Provide a reason. The originating staff member will see this.
        </p>

        <label className="block mb-1">
          <span className="text-sm font-medium text-gray-700">
            Rejection Reason{" "}
            <span className="text-red-500">*</span>
          </span>
        </label>
        <textarea
          className="w-full border border-gray-300 rounded-md p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1F7A8C]"
          rows={4}
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (e.target.value.trim()) setError("");
          }}
          disabled={submitting}
          placeholder="Enter rejection reason..."
        />
        {error && (
          <p className="mt-1 text-xs text-red-600">{error}</p>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleClose}
            disabled={submitting}
            className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1F7A8C] disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Rejecting..." : "Reject Job"}
          </button>
        </div>
      </div>
    </div>
  );
}
