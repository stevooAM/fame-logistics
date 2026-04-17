"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, ICellRendererParams, SortChangedEvent, ColumnState } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import Link from "next/link";
import { fetchBalances } from "@/lib/balances-api";
import type { CustomerBalance, BalancesFilters } from "@/lib/balances-api";
import { ApiError } from "@/lib/api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtCurrency(value: string | null | undefined, code?: string | null): string {
  if (value === null || value === undefined) return "";
  const num = Number(value);
  if (isNaN(num)) return value ?? "";
  try {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: code || "GHS",
      minimumFractionDigits: 2,
    }).format(num);
  } catch {
    // Fallback for unknown currency codes
    return `${code ?? "GHS"} ${num.toFixed(2)}`;
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BalancesTableProps {
  filters: BalancesFilters;
  onFiltersChange: (updater: (prev: BalancesFilters) => BalancesFilters) => void;
  onOrderingChange: (ordering: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BalancesTable({ filters, onFiltersChange, onOrderingChange }: BalancesTableProps) {
  const [rows, setRows] = useState<CustomerBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const page = filters.page ?? 1;
  const pageSize = filters.page_size ?? 50;

  // ---------------------------------------------------------------------------
  // Fetch
  // ---------------------------------------------------------------------------

  const fetchData = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const data = await fetchBalances(filters, controller.signal);
      if (controller.signal.aborted) return;
      setRows(data.results);
      setTotalCount(data.count);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      if (err instanceof ApiError && err.status === 403) {
        setError("You do not have permission to view outstanding balances.");
      } else {
        setError("Failed to load balances. Please try again.");
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchData]);

  // ---------------------------------------------------------------------------
  // Client-side totals footer (current page only)
  // ---------------------------------------------------------------------------

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => ({
        invoiced: acc.invoiced + Number(row.invoiced_total),
        paid: acc.paid + Number(row.paid_total),
        balance: acc.balance + Number(row.balance),
      }),
      { invoiced: 0, paid: 0, balance: 0 }
    );
  }, [rows]);

  // ---------------------------------------------------------------------------
  // AG Grid sort handler (server-side)
  // ---------------------------------------------------------------------------

  function handleSortChanged(event: SortChangedEvent) {
    const colStates: ColumnState[] = event.api.getColumnState();
    const sorted = colStates.filter((s) => s.sort != null);
    sorted.sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0));
    if (sorted.length === 0) {
      onOrderingChange("-balance");
      return;
    }
    const { colId, sort } = sorted[0];
    const ordering = sort === "desc" ? `-${colId}` : (colId ?? "balance");
    onOrderingChange(ordering);
  }

  // ---------------------------------------------------------------------------
  // Column definitions
  // ---------------------------------------------------------------------------

  const columnDefs: ColDef<CustomerBalance>[] = useMemo(
    () => [
      {
        field: "customer_name",
        headerName: "Customer",
        flex: 1,
        minWidth: 200,
        sortable: true,
        cellRenderer: (params: ICellRendererParams<CustomerBalance>) => {
          const row = params.data;
          if (!row) return null;
          return (
            <Link
              href={`/accounts/balances/${row.customer_id}`}
              className="text-[#1F7A8C] hover:underline font-medium text-sm"
            >
              {row.customer_name}
            </Link>
          );
        },
      },
      {
        field: "invoice_count",
        headerName: "Invoices",
        width: 110,
        sortable: true,
        headerClass: "ag-right-aligned-header",
        cellStyle: { textAlign: "right" },
      },
      {
        field: "invoiced_total",
        headerName: "Invoiced",
        width: 160,
        sortable: true,
        headerClass: "ag-right-aligned-header",
        cellStyle: { textAlign: "right" },
        valueFormatter: (params) => {
          const row = params.data as CustomerBalance | undefined;
          return fmtCurrency(params.value as string, row?.currency_code);
        },
      },
      {
        field: "paid_total",
        headerName: "Paid",
        width: 160,
        sortable: true,
        headerClass: "ag-right-aligned-header",
        cellStyle: { textAlign: "right" },
        valueFormatter: (params) => {
          const row = params.data as CustomerBalance | undefined;
          return fmtCurrency(params.value as string, row?.currency_code);
        },
      },
      {
        field: "balance",
        headerName: "Balance",
        width: 160,
        sortable: true,
        headerClass: "ag-right-aligned-header",
        cellStyle: { textAlign: "right" },
        cellRenderer: (params: ICellRendererParams<CustomerBalance>) => {
          const row = params.data;
          if (!row) return null;
          const hasBalance = Number(row.balance) > 0;
          return (
            <span className={hasBalance ? "text-red-600 font-semibold" : ""}>
              {fmtCurrency(row.balance, row.currency_code)}
            </span>
          );
        },
      },
      {
        field: "currency_code",
        headerName: "Currency",
        width: 110,
        sortable: true,
      },
    ],
    []
  );

  const defaultColDef = useMemo(
    () => ({ resizable: true }),
    []
  );

  // ---------------------------------------------------------------------------
  // Pagination
  // ---------------------------------------------------------------------------

  const totalPages = Math.ceil(totalCount / pageSize);
  const rangeStart = (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalCount);

  function goToPrev() {
    onFiltersChange((f) => ({ ...f, page: Math.max(1, (f.page ?? 1) - 1) }));
  }

  function goToNext() {
    onFiltersChange((f) => ({ ...f, page: Math.min(totalPages, (f.page ?? 1) + 1) }));
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <svg
            className="animate-spin w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
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
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          Loading balances...
        </div>
      )}

      {!loading && rows.length === 0 && (
        <p className="text-sm text-gray-500 py-8 text-center">No outstanding balances found.</p>
      )}

      <div className="ag-theme-alpine w-full" style={{ height: 520 }}>
        <AgGridReact<CustomerBalance>
          rowData={rows}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          suppressPaginationPanel
          rowHeight={44}
          headerHeight={40}
          animateRows
          onSortChanged={handleSortChanged}
        />
      </div>

      {/* Totals footer */}
      {rows.length > 0 && (
        <div className="flex flex-wrap gap-6 rounded-md bg-gray-50 border border-gray-200 px-4 py-2 text-sm">
          <span className="text-gray-500">
            Page totals:{" "}
            <span className="font-medium text-gray-700">
              Invoiced{" "}
              {new Intl.NumberFormat("en-GH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(totals.invoiced)}
            </span>
          </span>
          <span className="text-gray-500">
            Paid{" "}
            <span className="font-medium text-gray-700">
              {new Intl.NumberFormat("en-GH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(totals.paid)}
            </span>
          </span>
          <span className="text-gray-500">
            Balance{" "}
            <span
              className={`font-medium ${totals.balance > 0 ? "text-red-600" : "text-gray-700"}`}
            >
              {new Intl.NumberFormat("en-GH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(totals.balance)}
            </span>
          </span>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          {totalCount > 0
            ? `Showing ${rangeStart}–${rangeEnd} of ${totalCount} customers`
            : "No customers found"}
        </span>
        <div className="flex gap-2">
          <button
            onClick={goToPrev}
            disabled={page === 1}
            className="rounded border border-input px-3 py-1 text-xs hover:bg-gray-50 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="px-2 py-1 text-xs">
            Page {page} of {Math.max(1, totalPages)}
          </span>
          <button
            onClick={goToNext}
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
