"use client";

import { useState } from "react";
import type { BalancesFilters } from "@/lib/balances-api";
import { BalancesToolbar } from "./BalancesToolbar";
import { BalancesTable } from "./BalancesTable";

export function BalancesSection() {
  const [filters, setFilters] = useState<BalancesFilters>({
    ordering: "-balance",
    page: 1,
    page_size: 50,
  });

  function handleSearchChange(search: string) {
    setFilters((f) => ({ ...f, search: search || undefined, page: 1 }));
  }

  function handleOrderingChange(ordering: string) {
    setFilters((f) => ({ ...f, ordering, page: 1 }));
  }

  return (
    <div className="flex flex-col gap-4">
      <BalancesToolbar
        filters={filters}
        onSearchChange={handleSearchChange}
      />
      <BalancesTable
        filters={filters}
        onFiltersChange={setFilters}
        onOrderingChange={handleOrderingChange}
      />
    </div>
  );
}
