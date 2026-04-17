"use client";

import { useRef } from "react";
import { useAuth } from "@/providers/auth-provider";
import type { InvoiceFilters, InvoiceStatus } from "@/types/account";
import { INVOICE_STATUS_CONFIG } from "@/types/account";

interface InvoiceToolbarProps {
  onSearch: (term: string) => void;
  onFilterChange: (partial: Partial<InvoiceFilters>) => void;
  onGenerate: () => void;
}

export function InvoiceToolbar({ onSearch, onFilterChange, onGenerate }: InvoiceToolbarProps) {
  const { user } = useAuth();
  const isOperations = user?.role?.name?.toLowerCase() === "operations";

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearchChange(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearch(value), 300);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Primary row: search + generate */}
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
  );
}
