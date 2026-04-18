"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import type { InvoiceFilters, InvoiceStatus } from "@/types/account";
import { INVOICE_STATUS_CONFIG } from "@/types/account";
import { exportInvoicesBlob } from "@/lib/accounts-api";
import { ApiError } from "@/lib/api";

interface InvoiceToolbarProps {
  filters: InvoiceFilters;
  onSearch: (term: string) => void;
  onFilterChange: (partial: Partial<InvoiceFilters>) => void;
  onGenerate: () => void;
}

export function InvoiceToolbar({ filters, onSearch, onFilterChange, onGenerate }: InvoiceToolbarProps) {
  const { user } = useAuth();
  const isOperations = user?.role?.name?.toLowerCase() === "operations";

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  function handleSearchChange(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearch(value), 300);
  }

  async function handleExport(format: "xlsx" | "csv") {
    setExportOpen(false);
    setExporting(true);
    setExportError(null);

    // Export all matching records — exclude pagination fields
    const exportFilters: InvoiceFilters = {
      search: filters.search,
      status: filters.status,
      date_from: filters.date_from,
      date_to: filters.date_to,
      ordering: filters.ordering,
    };

    try {
      const blob = await exportInvoicesBlob(exportFilters, format);
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const filename = `invoices-${today}.${format}`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setExportError(`Export failed: ${err.status} error. Please try again.`);
      } else {
        setExportError("Export failed. Please try again.");
      }
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Primary row: search + filters + actions */}
      <div className="flex items-center gap-3 flex-wrap justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
              />
            </svg>
            <input
              type="search"
              placeholder="Search invoice / customer / job..."
              onChange={(e) => handleSearchChange(e.target.value)}
              className="flex h-9 rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-72"
            />
          </div>

          {/* Status filter */}
          <select
            onChange={(e) =>
              onFilterChange({ status: (e.target.value as InvoiceStatus) || undefined })
            }
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-gray-700"
            defaultValue=""
          >
            <option value="">All Statuses</option>
            {(Object.keys(INVOICE_STATUS_CONFIG) as InvoiceStatus[]).map((s) => (
              <option key={s} value={s}>
                {INVOICE_STATUS_CONFIG[s].label}
              </option>
            ))}
          </select>

          {/* Date From */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500 whitespace-nowrap">From</label>
            <input
              type="date"
              onChange={(e) => onFilterChange({ date_from: e.target.value || undefined })}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-gray-700"
            />
          </div>

          {/* Date To */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500 whitespace-nowrap">To</label>
            <input
              type="date"
              onChange={(e) => onFilterChange({ date_to: e.target.value || undefined })}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-gray-700"
            />
          </div>
        </div>

        {/* Right-side actions: Export + Generate Invoice */}
        <div className="flex items-center gap-3">
          {/* Export dropdown */}
          <div className="relative">
            <button
              onClick={() => setExportOpen((o) => !o)}
              disabled={exporting}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1 disabled:opacity-50"
              aria-haspopup="true"
              aria-expanded={exportOpen}
            >
              {exporting ? "Exporting..." : "Export"}
              {!exporting && (
                <svg
                  className={`w-3 h-3 transition-transform ${exportOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              )}
            </button>

            {exportOpen && (
              <>
                {/* Fixed-inset overlay for click-outside dismiss — NOT shadcn DropdownMenu */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setExportOpen(false)}
                  aria-hidden="true"
                />
                <div className="absolute right-0 mt-1 w-48 rounded-md border border-gray-200 bg-white shadow-lg z-20 py-1">
                  <button
                    onClick={() => handleExport("xlsx")}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Export Excel (.xlsx)
                  </button>
                  <button
                    onClick={() => handleExport("csv")}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Export CSV (.csv)
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Generate Invoice button — hidden for Operations role */}
          {!isOperations && (
            <button
              onClick={onGenerate}
              className="flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#F89C1C" }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Generate Invoice
            </button>
          )}
        </div>
      </div>

      {/* Export error toast */}
      {exportError && (
        <div className="flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <span>{exportError}</span>
          <button
            onClick={() => setExportError(null)}
            className="ml-3 text-red-500 hover:text-red-700"
            aria-label="Dismiss error"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
