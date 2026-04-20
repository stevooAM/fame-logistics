"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { fetchInvoices } from "@/lib/accounts-api";
import type { Invoice, InvoiceFilters } from "@/types/account";
import { StatusBadge } from "./StatusBadge";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Helpers
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

function formatAmount(value: string | null | undefined, currencyCode?: string | null): string {
  if (!value) return "";
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  const formatted = new Intl.NumberFormat("en-GB", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
  return currencyCode ? `${currencyCode} ${formatted}` : formatted;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface InvoiceTableProps {
  filters: InvoiceFilters;
  refreshTrigger: number;
  onRowClick: (id: number) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InvoiceTable({ filters, refreshTrigger, onRowClick }: InvoiceTableProps) {
  const [gridData, setGridData] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  // ---------------------------------------------------------------------------
  // Fetch invoices
  // ---------------------------------------------------------------------------

  const fetchData = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const activeFilters: InvoiceFilters = {
        ...filters,
        page,
        page_size: PAGE_SIZE,
        ordering: filters.ordering ?? "-created_at",
      };
      const data = await fetchInvoices(activeFilters);
      if (controller.signal.aborted) return;
      setGridData(data.results);
      setTotalCount(data.count);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      // apiFetch handles 401 redirect; other errors: leave grid as-is
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [page, filters, refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchData]);

  // Reset to page 1 when filters change (not page change)
  useEffect(() => {
    setPage(1);
  }, [
    filters.search,
    filters.status,
    filters.customer_id,
    filters.job_id,
    filters.date_from,
    filters.date_to,
    filters.ordering,
    refreshTrigger,
  ]);

  // ---------------------------------------------------------------------------
  // Column definitions
  // ---------------------------------------------------------------------------

  const columnDefs: ColDef<Invoice>[] = useMemo(
    () => [
      {
        field: "invoice_number",
        headerName: "Invoice Number",
        width: 170,
        sortable: true,
        cellRenderer: (params: ICellRendererParams<Invoice>) => {
          const inv = params.data;
          if (!inv) return null;
          return (
            <button
              onClick={() => onRowClick(inv.id)}
              className="text-[#1F7A8C] hover:underline font-medium text-sm"
            >
              {inv.invoice_number}
            </button>
          );
        },
      },
      {
        field: "job_number",
        headerName: "Job Number",
        width: 150,
        sortable: true,
        valueGetter: (params) => params.data?.job_number ?? "",
      },
      {
        field: "customer_name",
        headerName: "Customer",
        flex: 1,
        minWidth: 160,
        sortable: true,
        valueGetter: (params) => params.data?.customer_name ?? "",
      },
      {
        field: "amount",
        headerName: "Amount",
        width: 140,
        sortable: true,
        headerClass: "ag-right-aligned-header",
        cellStyle: { textAlign: "right" },
        valueFormatter: (params) => {
          const inv = params.data as Invoice | undefined;
          return formatAmount(params.value as string, inv?.currency_code);
        },
      },
      {
        field: "paid_total",
        headerName: "Paid",
        width: 140,
        sortable: true,
        headerClass: "ag-right-aligned-header",
        cellStyle: { textAlign: "right" },
        valueFormatter: (params) => {
          const inv = params.data as Invoice | undefined;
          return formatAmount(params.value as string, inv?.currency_code);
        },
      },
      {
        field: "balance",
        headerName: "Balance",
        width: 140,
        sortable: true,
        headerClass: "ag-right-aligned-header",
        cellStyle: { textAlign: "right" },
        cellRenderer: (params: ICellRendererParams<Invoice>) => {
          const inv = params.data;
          if (!inv) return null;
          const hasBalance = parseFloat(inv.balance) > 0;
          return (
            <span className={hasBalance ? "text-red-600 font-semibold" : ""}>
              {formatAmount(inv.balance, inv.currency_code)}
            </span>
          );
        },
      },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        sortable: true,
        cellRenderer: (params: ICellRendererParams<Invoice>) => {
          if (!params.data) return null;
          return <StatusBadge status={params.data.status} />;
        },
      },
      {
        field: "issue_date",
        headerName: "Issue Date",
        width: 130,
        sortable: true,
        valueFormatter: (params) => formatDate(params.value as string | null),
      },
      {
        field: "due_date",
        headerName: "Due Date",
        width: 130,
        sortable: true,
        valueFormatter: (params) => formatDate(params.value as string | null),
      },
    ],
    [onRowClick]
  );

  const defaultColDef = useMemo(() => ({ resizable: true }), []);

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
        <p className="text-sm text-gray-500">No invoices found.</p>
      )}

      <div className="ag-theme-alpine w-full" style={{ height: 480 }}>
        <AgGridReact<Invoice>
          rowData={gridData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          suppressPaginationPanel
          rowHeight={44}
          headerHeight={40}
          animateRows
        />
      </div>

      {/* Pagination footer */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          {totalCount > 0
            ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(
                page * PAGE_SIZE,
                totalCount
              )} of ${totalCount} invoices`
            : "No invoices found"}
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
