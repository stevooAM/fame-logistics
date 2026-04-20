"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { JobTable } from "./components/JobTable";
import { JobToolbar } from "./components/JobToolbar";
import { JobFormDialog } from "./components/JobFormDialog";
import type { JobFilters } from "@/types/job";

export default function JobsPage() {
  const [filters, setFilters] = useState<JobFilters>({
    ordering: "-created_at",
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("create") === "1") {
      setCreateOpen(true);
    }
  }, [searchParams]);

  function handleSearch(term: string) {
    setFilters((f) => ({ ...f, search: term || undefined, page: 1 }));
  }

  function handleFilterChange(partial: Partial<JobFilters>) {
    setFilters((f) => ({ ...f, ...partial, page: 1 }));
  }

  function handleAddJob() {
    setCreateOpen(true);
  }

  function handleCreateSuccess() {
    setCreateOpen(false);
    setRefreshTrigger((n) => n + 1);
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#2B3E50]">Jobs</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track and manage all freight jobs
        </p>
      </div>

      <JobToolbar
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        onAddJob={handleAddJob}
      />

      <JobTable
        filters={filters}
        refreshTrigger={refreshTrigger}
      />

      <JobFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
