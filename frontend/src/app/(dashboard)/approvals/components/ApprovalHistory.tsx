"use client";

import { useEffect, useState } from "react";
import {
  ApprovalHistoryEntry,
  HistoryFilters,
  fetchApprovalHistory,
} from "@/lib/approvals-api";

const inputCls =
  "border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F7A8C]";

function ActionBadge({ action }: { action: ApprovalHistoryEntry["action"] }) {
  if (action === "APPROVED") {
    return (
      <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-medium">
        Approved
      </span>
    );
  }
  if (action === "REJECTED") {
    return (
      <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs font-medium">
        Rejected
      </span>
    );
  }
  return (
    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">
      Submitted
    </span>
  );
}

function SkeletonRows() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <tr key={i}>
          {[0, 1, 2, 3, 4].map((j) => (
            <td key={j} className="px-4 py-3">
              <div className="animate-pulse bg-gray-100 h-5 rounded" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function ApprovalHistory() {
  const [entries, setEntries] = useState<ApprovalHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Draft filter state (controlled inputs before Apply)
  const [draftAction, setDraftAction] = useState<HistoryFilters["action"]>("");
  const [draftDateFrom, setDraftDateFrom] = useState("");
  const [draftDateTo, setDraftDateTo] = useState("");
  const [draftJobNumber, setDraftJobNumber] = useState("");

  async function loadHistory(filters: HistoryFilters = {}) {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchApprovalHistory(filters);
      setEntries(data);
    } catch {
      setError("Failed to load history. Please refresh.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory({});
  }, []);

  function handleApplyFilters() {
    loadHistory({
      action: draftAction,
      date_from: draftDateFrom,
      date_to: draftDateTo,
      job_number: draftJobNumber,
    });
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Action</label>
          <select
            value={draftAction}
            onChange={(e) =>
              setDraftAction(e.target.value as HistoryFilters["action"])
            }
            className={inputCls}
          >
            <option value="">All</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="SUBMITTED">Submitted</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Date From</label>
          <input
            type="date"
            value={draftDateFrom}
            onChange={(e) => setDraftDateFrom(e.target.value)}
            className={inputCls}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Date To</label>
          <input
            type="date"
            value={draftDateTo}
            onChange={(e) => setDraftDateTo(e.target.value)}
            className={inputCls}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Job Number</label>
          <input
            type="text"
            value={draftJobNumber}
            onChange={(e) => setDraftJobNumber(e.target.value)}
            placeholder="FMS-2025-00001"
            className={inputCls}
          />
        </div>

        <button
          onClick={handleApplyFilters}
          className="bg-[#1F7A8C] text-white px-3 py-1.5 text-sm rounded-md hover:bg-[#186678] transition-colors"
        >
          Apply
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Job Number", "Action", "Actioned By", "Comment", "Date"].map(
                (col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <SkeletonRows />
            ) : entries.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-gray-500 text-center py-8"
                >
                  No approval history found for the selected filters.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 font-mono">
                    {entry.job_number}
                  </td>
                  <td className="px-4 py-3">
                    <ActionBadge action={entry.action} />
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {entry.actor.full_name || entry.actor.username}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {entry.comment || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(entry.created_at).toLocaleDateString("en-GB")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
