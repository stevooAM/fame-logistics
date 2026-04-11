"use client";

import { useRef } from "react";
import type { JobFilters, JobStatus, JobType } from "@/types/job";
import { JOB_STATUS_CONFIG, JOB_TYPE_LABELS } from "@/types/job";

interface JobToolbarProps {
  onSearch: (term: string) => void;
  onFilterChange: (partial: Partial<JobFilters>) => void;
  onAddJob: () => void;
}

export function JobToolbar({ onSearch, onFilterChange, onAddJob }: JobToolbarProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearchChange(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearch(value), 300);
  }

  function handlePortChange(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onFilterChange({ port: value || undefined }), 300);
  }

  function handleAssignedChange(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onFilterChange({ assigned_to: value || undefined }), 300);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Primary row: search + add */}
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
            placeholder="Search jobs..."
            onChange={(e) => handleSearchChange(e.target.value)}
            className="flex h-9 rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-64"
          />
        </div>

        <button
          onClick={onAddJob}
          className="flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          style={{ backgroundColor: "#1F7A8C" }}
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
          Add Job
        </button>
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Status */}
        <select
          onChange={(e) =>
            onFilterChange({ status: (e.target.value as JobStatus) || undefined })
          }
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-gray-700"
          defaultValue=""
        >
          <option value="">All Statuses</option>
          {(Object.keys(JOB_STATUS_CONFIG) as JobStatus[]).map((s) => (
            <option key={s} value={s}>
              {JOB_STATUS_CONFIG[s].label}
            </option>
          ))}
        </select>

        {/* Job Type */}
        <select
          onChange={(e) =>
            onFilterChange({ job_type: (e.target.value as JobType) || undefined })
          }
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-gray-700"
          defaultValue=""
        >
          <option value="">All Types</option>
          {(Object.keys(JOB_TYPE_LABELS) as JobType[]).map((t) => (
            <option key={t} value={t}>
              {JOB_TYPE_LABELS[t]}
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

        {/* Port */}
        <input
          type="text"
          placeholder="Port..."
          onChange={(e) => handlePortChange(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-32"
        />

        {/* Assigned staff */}
        <input
          type="text"
          placeholder="Assigned to..."
          onChange={(e) => handleAssignedChange(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-36"
        />
      </div>
    </div>
  );
}
