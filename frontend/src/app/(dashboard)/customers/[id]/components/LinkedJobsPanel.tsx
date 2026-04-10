interface LinkedJobsPanelProps {
  customerId: number;
}

export function LinkedJobsPanel({ customerId: _customerId }: LinkedJobsPanelProps) {
  // TODO Phase 5: apiFetch<JobListResponse>(`/api/jobs/?customer=${_customerId}`)

  return (
    <div
      className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Teal top rail */}
      <div
        className="h-0.5 w-full"
        style={{ background: "linear-gradient(to right, #1F7A8C, #2ab8d4)" }}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-semibold tracking-widest uppercase"
              style={{ color: "#1F7A8C" }}
            >
              Linked Jobs
            </span>
            <span
              className="inline-flex items-center justify-center rounded-full w-5 h-5 text-[10px] font-semibold"
              style={{ backgroundColor: "#e8f5f7", color: "#1F7A8C" }}
            >
              0
            </span>
          </div>
          <button
            disabled
            className="text-xs font-medium opacity-30 cursor-not-allowed"
            style={{ color: "#1F7A8C" }}
            title="Available in Phase 5"
          >
            View all jobs →
          </button>
        </div>

        {/* Divider */}
        <div className="h-px mb-5" style={{ background: "#e5f4f6" }} />

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
            style={{ backgroundColor: "#f0f9fa" }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1F7A8C"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
              <line x1="12" y1="12" x2="12" y2="16" />
              <line x1="10" y1="14" x2="14" y2="14" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">No jobs linked yet</p>
          <p className="text-xs text-gray-400 max-w-[180px]">
            Jobs will appear here once created in the Jobs module.
          </p>
        </div>
      </div>
    </div>
  );
}
