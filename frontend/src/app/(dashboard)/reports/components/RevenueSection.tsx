"use client";

import { useEffect, useRef, useState } from "react";
import { fetchRevenue, type RevenueResponse, type RevenueTotals } from "@/lib/reports-api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtValue(v: string | number, currencyCode?: string | null): string {
  const n = parseFloat(String(v));
  if (isNaN(n)) return `${currencyCode || "GHS"} 0.00`;
  return (
    (currencyCode || "GHS") +
    " " +
    n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}

// ---------------------------------------------------------------------------
// Sub-component: totals footer row
// ---------------------------------------------------------------------------

function TotalsRow({ totals, currencyCode }: { totals: RevenueTotals; currencyCode?: string | null }) {
  return (
    <tr className="bg-gray-50 border-t-2 border-gray-300">
      <td className="px-3 py-2 text-sm font-semibold text-gray-900">Totals</td>
      <td className="px-3 py-2 text-sm font-semibold text-gray-900 text-right">{fmtValue(totals.invoiced, currencyCode)}</td>
      <td className="px-3 py-2 text-sm font-semibold text-gray-900 text-right">{fmtValue(totals.paid, currencyCode)}</td>
      <td className="px-3 py-2 text-sm font-semibold text-gray-900 text-right">{fmtValue(totals.outstanding, currencyCode)}</td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RevenueSectionProps {
  runTrigger: number;
  dateFrom: string;
  dateTo: string;
  currencyCode?: string;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function RevenueSection({ runTrigger, dateFrom, dateTo, currencyCode }: RevenueSectionProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RevenueResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (runTrigger === 0) return;

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setData(null);

    fetchRevenue(
      { date_from: dateFrom, date_to: dateTo, currency_code: currencyCode || undefined },
      controller.signal
    )
      .then((res) => setData(res))
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setError("Failed to load revenue report.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [runTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Render states
  // ---------------------------------------------------------------------------

  if (runTrigger === 0) {
    return (
      <p className="text-sm text-gray-400 mt-4">
        Select a date range and click Run Report to view revenue data.
      </p>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 mt-6 text-sm text-gray-500">
        <svg className="animate-spin h-4 w-4 text-[#1F7A8C]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Running report…
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600 mt-4">{error}</p>;
  }

  const isEmpty =
    !data ||
    (data.period_rows.length === 0 && data.customer_rows.length === 0);

  if (isEmpty) {
    return (
      <p className="text-sm text-gray-500 mt-4">
        No revenue data found for the selected period.
      </p>
    );
  }

  const effectiveCurrency = data.currency_code;

  const thClass = "px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap";
  const tdClass = "px-3 py-2 text-sm text-gray-800 whitespace-nowrap";

  return (
    <div className="mt-4 flex flex-col gap-6">
      {/* Currency note */}
      {!effectiveCurrency && (
        <p className="text-xs text-gray-500">
          Showing data across all currencies. Select a currency to filter.
        </p>
      )}

      {/* Section 1: Monthly Revenue */}
      {data.period_rows.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2" style={{ color: "#2B3E50" }}>
            Monthly Revenue
          </h3>
          <div className="overflow-x-auto rounded border border-gray-200">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className={thClass}>Period</th>
                  <th className={thClass + " text-right"}>Invoiced</th>
                  <th className={thClass + " text-right"}>Paid</th>
                  <th className={thClass + " text-right"}>Outstanding</th>
                </tr>
              </thead>
              <tbody>
                {data.period_rows.map((row) => (
                  <tr key={row.period_start} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className={tdClass}>{row.period_label}</td>
                    <td className={tdClass + " text-right"}>{fmtValue(row.invoiced, effectiveCurrency)}</td>
                    <td className={tdClass + " text-right"}>{fmtValue(row.paid, effectiveCurrency)}</td>
                    <td className={tdClass + " text-right"}>{fmtValue(row.outstanding, effectiveCurrency)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <TotalsRow totals={data.period_totals} currencyCode={effectiveCurrency} />
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Section 2: Revenue by Customer */}
      {data.customer_rows.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2" style={{ color: "#2B3E50" }}>
            Revenue by Customer
          </h3>
          <div className="overflow-x-auto rounded border border-gray-200">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className={thClass}>Customer</th>
                  <th className={thClass + " text-right"}>Invoiced</th>
                  <th className={thClass + " text-right"}>Paid</th>
                  <th className={thClass + " text-right"}>Outstanding</th>
                </tr>
              </thead>
              <tbody>
                {data.customer_rows.map((row) => (
                  <tr key={row.customer_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className={tdClass}>{row.customer_name}</td>
                    <td className={tdClass + " text-right"}>{fmtValue(row.invoiced, effectiveCurrency)}</td>
                    <td className={tdClass + " text-right"}>{fmtValue(row.paid, effectiveCurrency)}</td>
                    <td className={tdClass + " text-right"}>{fmtValue(row.outstanding, effectiveCurrency)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <TotalsRow totals={data.customer_totals} currencyCode={effectiveCurrency} />
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
