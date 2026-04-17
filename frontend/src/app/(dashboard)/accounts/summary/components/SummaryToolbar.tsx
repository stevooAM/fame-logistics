"use client";

import { useState } from "react";
import { apiFetchBlob } from "@/lib/api";
import type { SummaryPeriod } from "@/lib/summaries-api";

interface DateRange {
  date_from: string;
  date_to: string;
}

interface SummaryToolbarProps {
  period: SummaryPeriod;
  range: DateRange;
  onPeriodChange: (period: SummaryPeriod) => void;
  onRangeChange: (range: DateRange) => void;
  loading: boolean;
}

export default function SummaryToolbar({
  period,
  range,
  onPeriodChange,
  onRangeChange,
  loading,
}: SummaryToolbarProps) {
  const [localFrom, setLocalFrom] = useState(range.date_from);
  const [localTo, setLocalTo] = useState(range.date_to);
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  function handleFromChange(val: string) {
    setLocalFrom(val);
    setRangeError(null);
    if (val && localTo && val > localTo) {
      setRangeError("From date must not be after To date.");
      return;
    }
    if (val && localTo) {
      onRangeChange({ date_from: val, date_to: localTo });
    }
  }

  function handleToChange(val: string) {
    setLocalTo(val);
    setRangeError(null);
    if (localFrom && val && localFrom > val) {
      setRangeError("From date must not be after To date.");
      return;
    }
    if (localFrom && val) {
      onRangeChange({ date_from: localFrom, date_to: val });
    }
  }

  async function handleExport() {
    if (rangeError) return;
    setExporting(true);
    try {
      const params = new URLSearchParams({
        date_from: range.date_from,
        date_to: range.date_to,
        format: "xlsx",
      });
      // IMPORTANT: Export uses date_from/date_to — NOT start_date/end_date
      const blob = await apiFetchBlob(
        `/api/accounts/invoices/export/?${params.toString()}`
      );
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `period-summary-${period}-${range.date_from}-to-${range.date_to}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch {
      // non-blocking — user can retry
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-wrap items-start gap-4">
      {/* Period toggle — segmented control */}
      <div className="flex rounded border border-gray-200 overflow-hidden">
        {(["month", "quarter"] as SummaryPeriod[]).map((p) => (
          <button
            key={p}
            onClick={() => onPeriodChange(p)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              period === p
                ? "bg-[#1F7A8C] text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {p === "month" ? "Month" : "Quarter"}
          </button>
        ))}
      </div>

      {/* Date range */}
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">From</label>
          <input
            type="date"
            value={localFrom}
            onChange={(e) => handleFromChange(e.target.value)}
            className="h-9 rounded border border-gray-300 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1F7A8C]/40 focus:border-[#1F7A8C]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">To</label>
          <input
            type="date"
            value={localTo}
            onChange={(e) => handleToChange(e.target.value)}
            className="h-9 rounded border border-gray-300 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1F7A8C]/40 focus:border-[#1F7A8C]"
          />
        </div>
        {rangeError && (
          <p className="self-end pb-1 text-xs text-red-600">{rangeError}</p>
        )}
      </div>

      {/* Export button */}
      <div className="flex items-end pb-0 ml-auto">
        <button
          onClick={handleExport}
          disabled={loading || exporting || !!rangeError}
          className="h-9 px-4 rounded bg-[#F89C1C] text-white text-sm font-medium hover:bg-[#e08a10] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exporting ? "Exporting…" : "Export XLSX"}
        </button>
      </div>
    </div>
  );
}
