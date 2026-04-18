"use client";

import { useEffect, useRef, useState } from "react";
import { fetchJobStatus, type JobStatusResponse, type JobStatusRow } from "@/lib/reports-api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtValue(v: string | number): string {
  const n = parseFloat(String(v));
  if (isNaN(n)) return "GHS 0.00";
  return "GHS " + n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface JobStatusSectionProps {
  runTrigger: number;
  dateFrom: string;
  dateTo: string;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function JobStatusSection({ runTrigger, dateFrom, dateTo }: JobStatusSectionProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<JobStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (runTrigger === 0) return;

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setData(null);

    fetchJobStatus({ date_from: dateFrom, date_to: dateTo }, controller.signal)
      .then((res) => setData(res))
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setError("Failed to load job status report.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [runTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Totals
  // ---------------------------------------------------------------------------

  const totals = data
    ? data.rows.reduce(
        (acc, r) => ({
          count: acc.count + r.count,
          total_value: acc.total_value + parseFloat(r.total_value || "0"),
        }),
        { count: 0, total_value: 0 }
      )
    : null;

  // ---------------------------------------------------------------------------
  // Group rows by status (preserve order)
  // ---------------------------------------------------------------------------

  function groupByStatus(rows: JobStatusRow[]) {
    const seen: string[] = [];
    const groups: Record<string, JobStatusRow[]> = {};
    for (const row of rows) {
      if (!groups[row.status]) {
        groups[row.status] = [];
        seen.push(row.status);
      }
      groups[row.status].push(row);
    }
    return { seen, groups };
  }

  // ---------------------------------------------------------------------------
  // Render states
  // ---------------------------------------------------------------------------

  if (runTrigger === 0) {
    return (
      <p className="text-sm text-gray-400 mt-4">
        Select a date range and click Run Report to view the job status breakdown.
      </p>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 mt-6 text-sm text-gray-500">
        <svg className="animate-spin h-4 w-4 text-[#1F7A8C]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Running report…
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600 mt-4">{error}</p>;
  }

  if (!data || data.rows.length === 0) {
    return (
      <p className="text-sm text-gray-500 mt-4">
        No jobs found for the selected period.
      </p>
    );
  }

  const { seen, groups } = groupByStatus(data.rows);

  const thClass = "px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap";
  const tdClass = "px-3 py-2 text-sm text-gray-800 whitespace-nowrap";
  const tfClass = "px-3 py-2 text-sm font-semibold text-gray-900 whitespace-nowrap";

  return (
    <div className="mt-4 overflow-x-auto rounded border border-gray-200">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className={thClass}>Status</th>
            <th className={thClass}>Job Type</th>
            <th className={thClass + " text-right"}>Count</th>
            <th className={thClass + " text-right"}>Total Value</th>
          </tr>
        </thead>
        <tbody>
          {seen.map((status) =>
            groups[status].map((row, idx) => (
              <tr key={`${status}-${row.job_type}`} className="border-b border-gray-100 hover:bg-gray-50">
                <td className={tdClass + " font-medium"}>
                  {idx === 0 ? row.status_label : ""}
                </td>
                <td className={tdClass}>{row.job_type_label}</td>
                <td className={tdClass + " text-right"}>{row.count}</td>
                <td className={tdClass + " text-right"}>{fmtValue(row.total_value)}</td>
              </tr>
            ))
          )}
        </tbody>
        {totals && (
          <tfoot className="bg-gray-50 border-t-2 border-gray-300">
            <tr>
              <td className={tfClass}>Totals</td>
              <td className={tfClass} />
              <td className={tfClass + " text-right"}>{totals.count}</td>
              <td className={tfClass + " text-right"}>{fmtValue(totals.total_value)}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
