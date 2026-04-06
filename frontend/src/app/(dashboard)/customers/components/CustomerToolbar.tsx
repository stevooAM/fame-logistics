"use client";
import { useRef } from "react";

interface CustomerToolbarProps {
  onSearch: (term: string) => void;
  onAddCustomer: () => void;
  onAddInline: () => void;
  onExport: () => void;
}

export function CustomerToolbar({
  onSearch,
  onAddCustomer,
  onAddInline,
  onExport,
}: CustomerToolbarProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearchChange(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearch(value), 300);
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
      <button
        onClick={onExport}
        className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
      >
        Export
      </button>
    </div>
  );
}
