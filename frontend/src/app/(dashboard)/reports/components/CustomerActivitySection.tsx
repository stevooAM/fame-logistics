"use client";

import { useEffect, useRef, useState } from "react";
import {
  fetchCustomerActivity,
  type CustomerActivityResponse,
  type CustomerActivityRow,
} from "@/lib/reports-api";
import { apiFetch } from "@/lib/api";
import { StatusBadge } from "@/app/(dashboard)/jobs/components/StatusBadge";
import type { JobStatus } from "@/types/job";
import { JOB_TYPE_LABELS } from "@/types/job";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DrilldownJob {
  id: number;
  job_number: string;
  status: JobStatus;
  job_type: string;
  created_at: string;
  total_cost: string | null;
}

interface DrilldownResponse {
  count: number;
  results: DrilldownJob[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtValue(v: string | number): string {
  const n = parseFloat(String(v));
  if (isNaN(n)) return "GHS 0.00";
  return "GHS " + n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(v: string | null | undefined): string {
  if (!v) return "";
  try {
    return new Date(v).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return v;
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CustomerActivitySectionProps {
  runTrigger: number;
  dateFrom: string;
  dateTo: string;
  customerId?: string;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function CustomerActivitySection({
  runTrigger,
  dateFrom,
  dateTo,
  customerId,
}: CustomerActivitySectionProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CustomerActivityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedCustomerId, setExpandedCustomerId] = useState<number | null>(null);
  const [drilldownCache, setDrilldownCache] = useState<Record<number, DrilldownJob[]>>({});
  const [drilldownCounts, setDrilldownCounts] = useState<Record<number, number>>({});
  const [drilldownLoading, setDrilldownLoading] = useState<Set<number>>(new Set());
  const abortRef = useRef<AbortController | null>(null);

  // Fetch report data when run trigger fires
  useEffect(() => {
    if (runTrigger === 0) return;

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setData(null);
    setExpandedCustomerId(null);
    setDrilldownCache({});
    setDrilldownCounts({});

    const params: { date_from: string; date_to: string; customer_id?: number } = {
      date_from: dateFrom,
      date_to: dateTo,
    };
    if (customerId && customerId.trim() !== "") {
      const parsed = parseInt(customerId, 10);
      if (!isNaN(parsed)) params.customer_id = parsed;
    }

    fetchCustomerActivity(params, controller.signal)
      .then((res) => setData(res))
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setError("Failed to load customer activity report.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [runTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  // Expand / collapse a customer row
  async function toggleCustomer(row: CustomerActivityRow) {
    if (expandedCustomerId === row.customer_id) {
      setExpandedCustomerId(null);
      return;
    }

    setExpandedCustomerId(row.customer_id);

    if (drilldownCache[row.customer_id]) return; // already cached

    // Mark loading
    setDrilldownLoading((prev) => new Set(prev).add(row.customer_id));

    try {
      const params = new URLSearchParams({
        customer_id: String(row.customer_id),
        date_from: dateFrom,
        date_to: dateTo,
        page_size: "50",
        ordering: "-created_at",
      });
      const res = await apiFetch<DrilldownResponse>(`/api/jobs/?${params.toString()}`);
      setDrilldownCache((prev) => ({ ...prev, [row.customer_id]: res.results }));
      setDrilldownCounts((prev) => ({ ...prev, [row.customer_id]: res.count }));
    } catch {
      setDrilldownCache((prev) => ({ ...prev, [row.customer_id]: [] }));
    } finally {
      setDrilldownLoading((prev) => {
        const next = new Set(prev);
        next.delete(row.customer_id);
        return next;
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Totals (client-side)
  // ---------------------------------------------------------------------------

  const totals = data
    ? data.rows.reduce(
        (acc, r) => ({
          total_jobs: acc.total_jobs + r.total_jobs,
          total_value: acc.total_value + parseFloat(r.total_value || "0"),
          draft: acc.draft + r.draft,
          pending: acc.pending + r.pending,
          in_progress: acc.in_progress + r.in_progress,
          customs: acc.customs + r.customs,
          delivered: acc.delivered + r.delivered,
          closed: acc.closed + r.closed,
          cancelled: acc.cancelled + r.cancelled,
        }),
        {
          total_jobs: 0,
          total_value: 0,
          draft: 0,
          pending: 0,
          in_progress: 0,
          customs: 0,
          delivered: 0,
          closed: 0,
          cancelled: 0,
        }
      )
    : null;

  // ---------------------------------------------------------------------------
  // Render states
  // ---------------------------------------------------------------------------

  if (runTrigger === 0) {
    return (
      <p className="text-sm text-gray-400 mt-4">
        Select a date range and click Run Report to view customer activity.
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
        No customer activity found for the selected period.
      </p>
    );
  }

  // ---------------------------------------------------------------------------
  // Table render
  // ---------------------------------------------------------------------------

  const thClass = "px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap";
  const tdClass = "px-3 py-2 text-sm text-gray-800 whitespace-nowrap";
  const tfClass = "px-3 py-2 text-sm font-semibold text-gray-900 whitespace-nowrap";

  return (
    <div className="mt-4 overflow-x-auto rounded border border-gray-200">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className={thClass}>Customer</th>
            <th className={thClass + " text-right"}>Total Jobs</th>
            <th className={thClass + " text-right"}>Total Value</th>
            <th className={thClass + " text-right"}>Draft</th>
            <th className={thClass + " text-right"}>Pending</th>
            <th className={thClass + " text-right"}>In Progress</th>
            <th className={thClass + " text-right"}>Customs</th>
            <th className={thClass + " text-right"}>Delivered</th>
            <th className={thClass + " text-right"}>Closed</th>
            <th className={thClass + " text-right"}>Cancelled</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row) => {
            const isExpanded = expandedCustomerId === row.customer_id;
            const isLoadingDrill = drilldownLoading.has(row.customer_id);
            const jobs = drilldownCache[row.customer_id] ?? [];
            const jobCount = drilldownCounts[row.customer_id] ?? 0;

            return (
              <>
                <tr
                  key={row.customer_id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className={tdClass}>
                    <button
                      type="button"
                      onClick={() => toggleCustomer(row)}
                      className="flex items-center gap-1.5 cursor-pointer text-[#1F7A8C] font-medium hover:underline text-sm"
                    >
                      <span className="text-xs">{isExpanded ? "▼" : "▶"}</span>
                      {row.customer_name}
                    </button>
                  </td>
                  <td className={tdClass + " text-right"}>{row.total_jobs}</td>
                  <td className={tdClass + " text-right"}>{fmtValue(row.total_value)}</td>
                  <td className={tdClass + " text-right"}>{row.draft}</td>
                  <td className={tdClass + " text-right"}>{row.pending}</td>
                  <td className={tdClass + " text-right"}>{row.in_progress}</td>
                  <td className={tdClass + " text-right"}>{row.customs}</td>
                  <td className={tdClass + " text-right"}>{row.delivered}</td>
                  <td className={tdClass + " text-right"}>{row.closed}</td>
                  <td className={tdClass + " text-right"}>{row.cancelled}</td>
                </tr>

                {/* Drilldown sub-table */}
                {isExpanded && (
                  <tr key={`drill-${row.customer_id}`} className="bg-slate-50">
                    <td colSpan={10} className="px-6 py-3">
                      {isLoadingDrill ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                          <svg className="animate-spin h-4 w-4 text-[#1F7A8C]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Loading jobs…
                        </div>
                      ) : jobs.length === 0 ? (
                        <p className="text-sm text-gray-500 py-1">No jobs found.</p>
                      ) : (
                        <div>
                          {jobCount > 50 && (
                            <p className="text-xs text-amber-700 mb-2">Showing first 50 of {jobCount} jobs.</p>
                          )}
                          <table className="w-full text-left border border-gray-200 rounded text-xs">
                            <thead className="bg-gray-100 border-b border-gray-200">
                              <tr>
                                <th className="px-3 py-1.5 font-semibold text-gray-600">Job Number</th>
                                <th className="px-3 py-1.5 font-semibold text-gray-600">Status</th>
                                <th className="px-3 py-1.5 font-semibold text-gray-600">Job Type</th>
                                <th className="px-3 py-1.5 font-semibold text-gray-600">Created Date</th>
                                <th className="px-3 py-1.5 font-semibold text-gray-600 text-right">Cost</th>
                              </tr>
                            </thead>
                            <tbody>
                              {jobs.map((job) => (
                                <tr key={job.id} className="border-b border-gray-100 hover:bg-white">
                                  <td className="px-3 py-1.5">
                                    <a
                                      href={`/jobs/${job.id}`}
                                      className="text-[#1F7A8C] hover:underline font-medium"
                                    >
                                      {job.job_number}
                                    </a>
                                  </td>
                                  <td className="px-3 py-1.5">
                                    <StatusBadge status={job.status} />
                                  </td>
                                  <td className="px-3 py-1.5 text-gray-700">
                                    {JOB_TYPE_LABELS[job.job_type as keyof typeof JOB_TYPE_LABELS] ?? job.job_type}
                                  </td>
                                  <td className="px-3 py-1.5 text-gray-700">{fmtDate(job.created_at)}</td>
                                  <td className="px-3 py-1.5 text-right text-gray-700">
                                    {job.total_cost ? fmtValue(job.total_cost) : "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
        {totals && (
          <tfoot className="bg-gray-50 border-t-2 border-gray-300">
            <tr>
              <td className={tfClass}>Totals</td>
              <td className={tfClass + " text-right"}>{totals.total_jobs}</td>
              <td className={tfClass + " text-right"}>{fmtValue(totals.total_value)}</td>
              <td className={tfClass + " text-right"}>{totals.draft}</td>
              <td className={tfClass + " text-right"}>{totals.pending}</td>
              <td className={tfClass + " text-right"}>{totals.in_progress}</td>
              <td className={tfClass + " text-right"}>{totals.customs}</td>
              <td className={tfClass + " text-right"}>{totals.delivered}</td>
              <td className={tfClass + " text-right"}>{totals.closed}</td>
              <td className={tfClass + " text-right"}>{totals.cancelled}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
