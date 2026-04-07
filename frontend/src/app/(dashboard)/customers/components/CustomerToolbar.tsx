"use client";
import { useRef, useState } from "react";

interface CustomerToolbarProps {
  onSearch: (term: string) => void;
  onAddCustomer: () => void;
  onAddInline: () => void;
  onExportExcel: () => void;
  onExportCsv: () => void;
}

export function CustomerToolbar({
  onSearch,
  onAddCustomer,
  onAddInline,
  onExportExcel,
  onExportCsv,
}: CustomerToolbarProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  function handleSearchChange(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearch(value), 300);
  }

  function handleExportExcel() {
    setExportOpen(false);
    onExportExcel();
  }

  function handleExportCsv() {
    setExportOpen(false);
    onExportCsv();
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <input
        type="search"
        placeholder="Search customers..."
        onChange={(e) => handleSearchChange(e.target.value)}
        className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-64"
      />
      <button
        onClick={onAddCustomer}
        className="rounded-md px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        style={{ backgroundColor: "#1F7A8C" }}
      >
        + Add Customer
      </button>
      <button
        onClick={onAddInline}
        className="rounded-md border border-[#1F7A8C] px-4 py-2 text-sm font-medium text-[#1F7A8C] hover:bg-[#1F7A8C] hover:text-white transition-colors"
      >
        Add Inline
      </button>

      {/* Export dropdown */}
      <div className="relative" ref={exportRef}>
        <button
          onClick={() => setExportOpen((o) => !o)}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1"
          aria-haspopup="true"
          aria-expanded={exportOpen}
        >
          Export
          <svg
            className={`w-3 h-3 transition-transform ${exportOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {exportOpen && (
          <>
            {/* Click-outside overlay */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setExportOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute right-0 mt-1 w-44 rounded-md border border-gray-200 bg-white shadow-lg z-20 py-1">
              <button
                onClick={handleExportExcel}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Export Excel (.xlsx)
              </button>
              <button
                onClick={handleExportCsv}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Export CSV (.csv)
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
