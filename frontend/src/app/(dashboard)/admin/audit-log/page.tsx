"use client";

import { useState } from "react";
import { AuditLogFilters } from "./components/AuditLogFilters";
import { AuditLogTable } from "./components/AuditLogTable";
import type { AuditLogFilters as AuditLogFiltersType } from "@/types/audit";

export default function AuditLogPage() {
  const [activeFilters, setActiveFilters] = useState<AuditLogFiltersType>({
    page: 1,
  });

  function handleFilterChange(filters: AuditLogFiltersType) {
    setActiveFilters(filters);
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#2B3E50]">Audit Log</h1>
        <p className="mt-1 text-sm text-gray-500">
          Read-only record of all system actions. No changes can be made here.
        </p>
      </div>

      {/* Filter controls */}
      <AuditLogFilters onFilterChange={handleFilterChange} />

      {/* Audit log table */}
      <AuditLogTable filters={activeFilters} />
    </div>
  );
}
