"use client";

interface ReportsToolbarProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  onRun: () => void;
  loading: boolean;
  currencyCode?: string;
  onCurrencyCodeChange?: (v: string) => void;
  showCurrencyFilter?: boolean;
  showCustomerFilter?: boolean;
  customerId?: string;
  onCustomerIdChange?: (v: string) => void;
}

function getMonthRange(offset: 0 | -1) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + offset;
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  return {
    from: first.toISOString().split("T")[0],
    to: last.toISOString().split("T")[0],
  };
}

export function ReportsToolbar({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onRun,
  loading,
  currencyCode,
  onCurrencyCodeChange,
  showCurrencyFilter,
  showCustomerFilter,
  customerId,
  onCustomerIdChange,
}: ReportsToolbarProps) {
  const dateError =
    dateFrom && dateTo && dateFrom > dateTo
      ? "From date must be on or before To date."
      : null;

  const canRun = !loading && !dateError;

  function applyThisMonth() {
    const { from, to } = getMonthRange(0);
    onDateFromChange(from);
    onDateToChange(to);
  }

  function applyLastMonth() {
    const { from, to } = getMonthRange(-1);
    onDateFromChange(from);
    onDateToChange(to);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-3">
        {/* Date from */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F7A8C] focus:border-[#1F7A8C]"
          />
        </div>

        {/* Date to */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F7A8C] focus:border-[#1F7A8C]"
          />
        </div>

        {/* Shortcut buttons */}
        <div className="flex items-center gap-2 pb-0.5">
          <button
            type="button"
            onClick={applyThisMonth}
            className="rounded border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            This Month
          </button>
          <button
            type="button"
            onClick={applyLastMonth}
            className="rounded border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Last Month
          </button>
        </div>

        {/* Currency filter */}
        {showCurrencyFilter && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Currency</label>
            <select
              value={currencyCode ?? ""}
              onChange={(e) => onCurrencyCodeChange?.(e.target.value)}
              className="rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F7A8C] focus:border-[#1F7A8C]"
            >
              <option value="">All Currencies</option>
              <option value="GHS">GHS</option>
              <option value="USD">USD</option>
            </select>
          </div>
        )}

        {/* Customer filter */}
        {showCustomerFilter && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Customer ID (optional)</label>
            <input
              type="number"
              min={1}
              value={customerId ?? ""}
              onChange={(e) => onCustomerIdChange?.(e.target.value)}
              placeholder="All customers"
              className="w-36 rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F7A8C] focus:border-[#1F7A8C]"
            />
          </div>
        )}

        {/* Run button */}
        <button
          type="button"
          onClick={onRun}
          disabled={!canRun}
          className="flex items-center gap-2 rounded px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#1F7A8C" }}
        >
          {loading && (
            <svg
              className="animate-spin h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          )}
          Run Report
        </button>
      </div>

      {/* Date validation error */}
      {dateError && (
        <p className="text-xs text-red-600">{dateError}</p>
      )}
    </div>
  );
}
