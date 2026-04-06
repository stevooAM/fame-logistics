"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { apiFetch } from "@/lib/api";
import type { AuditLogEntry, AuditLogFilters } from "@/types/audit";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 25;

interface PaginatedAuditLog {
  count: number;
  next: string | null;
  previous: string | null;
  results: AuditLogEntry[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimestamp(value: string): string {
  const d = new Date(value);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function buildQueryString(filters: AuditLogFilters): string {
  const params = new URLSearchParams();
  const page = filters.page ?? 1;
  params.set("page", String(page));
  params.set("page_size", String(PAGE_SIZE));
  if (filters.user) params.set("user", filters.user);
  if (filters.action) params.set("action", filters.action);
  if (filters.module) params.set("module", filters.module);
  if (filters.date_from) params.set("date_from", filters.date_from);
  if (filters.date_to) params.set("date_to", filters.date_to);
  if (filters.search) params.set("search", filters.search);
  return params.toString();
}

// ---------------------------------------------------------------------------
// Cell renderers
// ---------------------------------------------------------------------------

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-emerald-100 text-emerald-800",
  UPDATE: "bg-blue-100 text-blue-800",
  DELETE: "bg-red-100 text-red-800",
  LOGIN: "bg-gray-100 text-gray-700",
  LOGOUT: "bg-gray-100 text-gray-700",
  IMPERSONATE: "bg-amber-100 text-amber-800",
};

function ActionBadge({ value }: { value: string }) {
  const cls = ACTION_COLORS[value] ?? "bg-gray-100 text-gray-700";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}
    >
      {value}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AuditLogTableProps {
  filters: AuditLogFilters;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AuditLogTable({ filters }: AuditLogTableProps) {
  const [rowData, setRowData] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(filters.page ?? 1);

  // Sync page when filters change (Apply Filters resets to page 1)
  useEffect(() => {
    setPage(filters.page ?? 1);
  }, [filters]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildQueryString({ ...filters, page });
      const data = await apiFetch<PaginatedAuditLog>(`/api/audit-log/?${qs}`);
      setRowData(data.results);
      setTotalCount(data.count);
    } catch {
      // error handled by apiFetch (401 → redirect, others throw ApiError)
    } finally {
      setLoading(false);
    }
  }, [filters, page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columnDefs: ColDef<AuditLogEntry>[] = useMemo(
    () => [
      {
        field: "timestamp",
        headerName: "Timestamp",
        width: 190,
        sortable: false,
        valueFormatter: (params) =>
          params.value ? formatTimestamp(params.value) : "",
      },
      {
        field: "user",
        headerName: "User",
        width: 140,
        sortable: false,
      },
      {
        field: "action",
        headerName: "Action",
        width: 130,
        sortable: false,
        cellRenderer: (params: ICellRendererParams<AuditLogEntry>) => (
          <ActionBadge value={params.value ?? ""} />
        ),
      },
      {
        field: "model_name",
        headerName: "Module",
        width: 140,
        sortable: false,
      },
      {
        field: "object_repr",
        headerName: "Record",
        flex: 1,
        minWidth: 200,
        sortable: false,
      },
      {
        field: "ip_address",
        headerName: "IP Address",
        width: 140,
        sortable: false,
        valueFormatter: (params) => params.value ?? "—",
      },
    ],
    []
  );

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
    }),
    []
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const startEntry = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endEntry = Math.min(page * PAGE_SIZE, totalCount);

  return (
    <div className="flex flex-col gap-3">
      {/* Entry count + loading indicator */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          {loading
            ? "Loading..."
            : totalCount === 0
            ? "No audit log entries match your filters"
            : `Showing ${startEntry}–${endEntry} of ${totalCount} entries`}
        </span>
      </div>

      {/* AG Grid — read-only */}
      <div className="ag-theme-alpine w-full" style={{ height: 520 }}>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          suppressPaginationPanel
          rowSelection={undefined}
          suppressRowClickSelection
          rowHeight={44}
          headerHeight={40}
          animateRows
          overlayNoRowsTemplate={
            loading
              ? "<span></span>"
              : "<span style='color:#6b7280;font-size:14px'>No audit log entries match your filters</span>"
          }
        />
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-end gap-2 text-sm">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1 || loading}
          className="rounded border border-input px-3 py-1 text-xs hover:bg-gray-50 disabled:opacity-40"
        >
          Previous
        </button>
        <span className="px-2 py-1 text-xs text-gray-500">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages || loading}
          className="rounded border border-input px-3 py-1 text-xs hover:bg-gray-50 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
