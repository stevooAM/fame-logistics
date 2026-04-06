"use client";

import { useRef, useState } from "react";
import type { AuditLogFilters } from "@/types/audit";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACTION_OPTIONS = [
  { value: "", label: "All Actions" },
  { value: "CREATE", label: "Create" },
  { value: "UPDATE", label: "Update" },
  { value: "DELETE", label: "Delete" },
  { value: "LOGIN", label: "Login" },
  { value: "LOGOUT", label: "Logout" },
  { value: "IMPERSONATE", label: "Impersonate" },
];

const MODULE_OPTIONS = [
  { value: "", label: "All Modules" },
  { value: "User", label: "User" },
  { value: "Customer", label: "Customer" },
  { value: "Job", label: "Job" },
  { value: "Port", label: "Port" },
  { value: "CargoType", label: "Cargo Type" },
  { value: "Currency", label: "Currency" },
  { value: "DocumentType", label: "Document Type" },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AuditLogFiltersProps {
  onFilterChange: (filters: AuditLogFilters) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AuditLogFilters({ onFilterChange }: AuditLogFiltersProps) {
  const [localFilters, setLocalFilters] = useState<AuditLogFilters>({});
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleFieldChange(field: keyof AuditLogFilters, value: string) {
    setLocalFilters((prev) => ({ ...prev, [field]: value || undefined }));
  }

  function handleSearchChange(value: string) {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setLocalFilters((prev) => ({ ...prev, search: value || undefined }));
    }, 300);
  }

  function handleApply() {
    onFilterChange({ ...localFilters, page: 1 });
  }

  function handleClear() {
    setLocalFilters({});
    // Reset the search input visually
    const searchInput = document.getElementById("audit-search") as HTMLInputElement | null;
    if (searchInput) searchInput.value = "";
    onFilterChange({ page: 1 });
  }

  const inputClass =
    "flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

  const selectClass =
    "flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer";

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-end gap-3">
        {/* User filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">User</label>
          <input
            type="text"
            placeholder="Filter by username..."
            className={`${inputClass} w-44`}
            value={localFilters.user ?? ""}
            onChange={(e) => handleFieldChange("user", e.target.value)}
          />
        </div>

        {/* Action type filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Action</label>
          <select
            className={`${selectClass} w-40`}
            value={localFilters.action ?? ""}
            onChange={(e) => handleFieldChange("action", e.target.value)}
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Module filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Module</label>
          <select
            className={`${selectClass} w-44`}
            value={localFilters.module ?? ""}
            onChange={(e) => handleFieldChange("module", e.target.value)}
          >
            {MODULE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date range: From */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">From</label>
          <input
            type="date"
            className={`${inputClass} w-38`}
            value={localFilters.date_from ?? ""}
            onChange={(e) => handleFieldChange("date_from", e.target.value)}
          />
        </div>

        {/* Date range: To */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">To</label>
          <input
            type="date"
            className={`${inputClass} w-38`}
            value={localFilters.date_to ?? ""}
            onChange={(e) => handleFieldChange("date_to", e.target.value)}
          />
        </div>

        {/* Search (object_repr) */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Search</label>
          <input
            id="audit-search"
            type="search"
            placeholder="Search records..."
            className={`${inputClass} w-52`}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pb-0.5">
          <button
            onClick={handleApply}
            className="rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "#1F7A8C" }}
          >
            Apply Filters
          </button>
          <button
            onClick={handleClear}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
