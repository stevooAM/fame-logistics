"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { apiFetch } from "@/lib/api";
import type { Job, JobFilters, JobListResponse } from "@/types/job";
import { JOB_TYPE_LABELS } from "@/types/job";
import { StatusBadge } from "./StatusBadge";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Date formatter
// ---------------------------------------------------------------------------

function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface JobTableProps {
  filters: JobFilters;
  refreshTrigger: number;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function JobTable({ filters, refreshTrigger }: JobTableProps) {
  const router = useRouter();
  const [gridData, setGridData] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  // ---------------------------------------------------------------------------
  // Fetch jobs
  // ---------------------------------------------------------------------------

  const fetchJobs = useCallback(async () => {
    // Abort previous in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(PAGE_SIZE),
        ordering: filters.ordering ?? "-created_at",
      });
      if (filters.search) params.set("search", filters.search);
      if (filters.status) params.set("status", filters.status);
      if (filters.job_type) params.set("job_type", filters.job_type);
      if (filters.assigned_to) params.set("assigned_to", filters.assigned_to);
      if (filters.date_from) params.set("date_from", filters.date_from);
      if (filters.date_to) params.set("date_to", filters.date_to);
      if (filters.port) params.set("port", filters.port);

      const data = await apiFetch<JobListResponse>(
        `/api/jobs/?${params.toString()}`,
        { signal: controller.signal } as RequestInit
      );
      setGridData(data.results);
      setTotalCount(data.count);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      // Other errors handled by apiFetch (redirect on 401, etc.)
    } finally {
      setLoading(false);
    }
  }, [page, filters, refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchJobs();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchJobs]);

  // Reset page when filters change (but not on page change itself)
  useEffect(() => {
    setPage(1);
  }, [
    filters.search,
    filters.status,
    filters.job_type,
    filters.assigned_to,
    filters.date_from,
    filters.date_to,
    filters.port,
    filters.ordering,
  ]);

  // ---------------------------------------------------------------------------
  // Column definitions
  // ---------------------------------------------------------------------------

  const columnDefs: ColDef<Job>[] = useMemo(
    () => [
      {
        field: "job_number",
        headerName: "Job Number",
        width: 160,
        sortable: true,
        cellRenderer: (params: ICellRendererParams<Job>) => {
          const job = params.data;
          if (!job) return null;
          return (
            <button
              onClick={() => router.push(`/jobs/${job.id}`)}
              className="text-[#1F7A8C] hover:underline font-medium text-sm"
            >
              {job.job_number}
            </button>
          );
        },
      },
      {
        field: "customer_name",
        headerName: "Customer Name",
        flex: 1,
        minWidth: 160,
        sortable: true,
      },
      {
        field: "status",
        headerName: "Status",
        width: 140,
        sortable: true,
        cellRenderer: (params: ICellRendererParams<Job>) => {
          if (!params.data) return null;
          return <StatusBadge status={params.data.status} />;
        },
      },
      {
        field: "job_type",
        headerName: "Job Type",
        width: 120,
        sortable: true,
        valueFormatter: (params) =>
          params.value ? JOB_TYPE_LABELS[params.value as keyof typeof JOB_TYPE_LABELS] ?? params.value : "",
      },
      {
        field: "cargo_description",
        headerName: "Cargo Description",
        flex: 1,
        minWidth: 160,
        valueFormatter: (params) => {
          const val = params.value as string | null | undefined;
          if (!val) return "";
          return val.length > 50 ? `${val.slice(0, 50)}…` : val;
        },
      },
      {
        field: "eta",
        headerName: "ETA",
        width: 130,
        sortable: true,
        valueFormatter: (params) => formatDate(params.value as string | null),
      },
      {
        field: "delivery_date",
        headerName: "Delivery Date",
        width: 140,
        sortable: true,
        valueFormatter: (params) => formatDate(params.value as string | null),
      },
      {
        headerName: "Actions",
        width: 130,
        sortable: false,
        pinned: "right" as const,
        cellRenderer: (params: ICellRendererParams<Job>) => {
          const job = params.data;
          if (!job) return null;
          return (
            <div className="flex items-center gap-2 h-full">
              <button
                onClick={() => router.push(`/jobs/${job.id}`)}
                className="rounded px-2 py-1 text-xs font-medium text-[#1F7A8C] border border-[#1F7A8C] hover:bg-[#1F7A8C] hover:text-white transition-colors"
              >
                View
              </button>
              <button
                onClick={() => router.push(`/jobs/${job.id}/edit`)}
                className="rounded px-2 py-1 text-xs font-medium text-gray-600 border border-gray-300 hover:bg-gray-100 transition-colors"
              >
                Edit
              </button>
            </div>
          );
        },
      },
    ],
    [router]
  );

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
    }),
    []
  );

  // ---------------------------------------------------------------------------
  // Pagination
  // ---------------------------------------------------------------------------

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-3">
      {loading && <p className="text-sm text-gray-400">Loading...</p>}

      {!loading && gridData.length === 0 && (
        <p className="text-sm text-gray-500">No jobs found.</p>
      )}

      <div className="ag-theme-alpine w-full" style={{ height: 480 }}>
        <AgGridReact<Job>
          rowData={gridData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          suppressPaginationPanel
          rowHeight={44}
          headerHeight={40}
          animateRows
        />
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          {totalCount > 0
            ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(
                page * PAGE_SIZE,
                totalCount
              )} of ${totalCount} jobs`
            : "No jobs found"}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded border border-input px-3 py-1 text-xs hover:bg-gray-50 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="px-2 py-1 text-xs">
            Page {page} of {Math.max(1, totalPages)}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded border border-input px-3 py-1 text-xs hover:bg-gray-50 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
