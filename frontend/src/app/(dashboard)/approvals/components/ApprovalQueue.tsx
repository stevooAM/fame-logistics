"use client";

import { useEffect, useState } from "react";
import {
  fetchPendingApprovals,
  approveApproval,
  rejectApproval,
  type PendingApproval,
} from "@/lib/approvals-api";
import { RejectModal } from "./RejectModal";

export function ApprovalQueue() {
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingApprovals()
      .then((data) => {
        setApprovals(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load approvals. Please refresh.");
        setLoading(false);
      });
  }, []);

  async function handleApprove(id: number) {
    setActionError(null);
    try {
      await approveApproval(id);
      setApprovals((prev) => prev.filter((a) => a.id !== id));
    } catch {
      setActionError("Failed to approve. Please try again.");
    }
  }

  async function handleRejectConfirm(reason: string) {
    if (rejectTarget === null) return;
    await rejectApproval(rejectTarget, reason);
    setApprovals((prev) => prev.filter((a) => a.id !== rejectTarget));
    setRejectTarget(null);
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse bg-gray-100 h-12 rounded"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <>
      {actionError && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {approvals.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-16 flex flex-col items-center justify-center text-center">
          <span className="text-4xl text-green-500 mb-3">&#10003;</span>
          <p className="text-gray-500 text-sm">
            No pending approvals — the queue is clear.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Job Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Submitted By
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {approvals.map((approval) => (
                  <tr key={approval.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-[#1F7A8C]">
                      {approval.job.job_number}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {approval.job.customer_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700">
                        {approval.job.job_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {approval.submitted_by
                        ? approval.submitted_by.full_name || approval.submitted_by.username
                        : "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {new Date(approval.created_at).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(approval.id)}
                          className="px-3 py-1.5 text-sm rounded-md bg-[#1F7A8C] text-white hover:bg-[#186878] focus:outline-none focus:ring-2 focus:ring-[#1F7A8C] transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectTarget(approval.id)}
                          className="px-3 py-1.5 text-sm rounded-md border border-red-500 text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <RejectModal
        open={rejectTarget !== null}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleRejectConfirm}
      />
    </>
  );
}
