"use client";

export type ReportTab = "customer-activity" | "job-status" | "revenue";

const TABS: { key: ReportTab; label: string }[] = [
  { key: "customer-activity", label: "Customer Activity" },
  { key: "job-status", label: "Job Status" },
  { key: "revenue", label: "Revenue" },
];

interface ReportsTabsProps {
  activeTab: ReportTab;
  onChange: (tab: ReportTab) => void;
}

export function ReportsTabs({ activeTab, onChange }: ReportsTabsProps) {
  return (
    <div className="border-b border-gray-200 flex gap-1" role="tablist">
      {TABS.map((t) => {
        const active = t.key === activeTab;
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              active
                ? "border-[#1F7A8C] text-[#1F7A8C]"
                : "border-transparent text-gray-500 hover:text-[#2B3E50] hover:border-gray-300"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
