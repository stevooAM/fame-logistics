"use client";

import { useRef, useState } from "react";
import type { BalancesFilters } from "@/lib/balances-api";
import { exportBalancesBlob } from "@/lib/balances-api";
import { ApiError } from "@/lib/api";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BalancesToolbarProps {
  filters: BalancesFilters;
  onSearchChange: (search: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BalancesToolbar({ filters, onSearchChange }: BalancesToolbarProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function handleSearchChange(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearchChange(value), 300);
  }

  async function handleExport(format: "xlsx" | "csv") {
    setExportOpen(false);
    setExporting(true);
    setExportError(null);

    // Use filters minus page/page_size for export (export all)
    const exportFilters: BalancesFilters = {
      search: filters.search,
      ordering: filters.ordering,
      include_zero: filters.include_zero,
    };

    try {
      const blob = await exportBalancesBlob(exportFilters, format);
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const filename = `outstanding-balances-${today}.${format}`;
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

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-2">
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
            placeholder="Search customers..."
            onChange={(e) => handleSearchChange(e.target.value)}
            className="flex h-9 rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-64"
          />
        </div>

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
              {/* Fixed-inset overlay for click-outside dismiss */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setExportOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute left-0 mt-1 w-48 rounded-md border border-gray-200 bg-white shadow-lg z-20 py-1">
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
