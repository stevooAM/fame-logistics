"use client";

import { useEffect, useState } from "react";
import {
  fetchPeriodSummary,
  type SummaryPeriod,
  type PeriodSummaryResponse,
} from "@/lib/summaries-api";
import SummaryToolbar from "./SummaryToolbar";
import SummaryTable from "./SummaryTable";
import SummaryChart from "./SummaryChart";

interface DateRange {
  date_from: string;
  date_to: string;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function defaultRange(period: SummaryPeriod): DateRange {
  const now = new Date();
  if (period === "month") {
    // trailing 12 months
    const from = new Date(now);
    from.setMonth(from.getMonth() - 11);
    from.setDate(1);
    return {
      date_from: toISODate(from),
      date_to: toISODate(now),
    };
  } else {
    // trailing ~24 months (8 quarters)
    const from = new Date(now);
    from.setMonth(from.getMonth() - 23);
    from.setDate(1);
    return {
      date_from: toISODate(from),
      date_to: toISODate(now),
    };
  }
}

export default function SummarySection() {
  const [period, setPeriod] = useState<SummaryPeriod>("month");
  const [range, setRange] = useState<DateRange>(() => defaultRange("month"));
  const [data, setData] = useState<PeriodSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchPeriodSummary(
      { period, date_from: range.date_from, date_to: range.date_to },
      controller.signal
    )
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(
          err instanceof Error ? err.message : "Failed to load summary data."
        );
        setLoading(false);
      });

    return () => controller.abort();
  }, [period, range]);

  function handlePeriodChange(newPeriod: SummaryPeriod) {
    setPeriod(newPeriod);
    setRange(defaultRange(newPeriod));
  }

  return (
    <div className="flex flex-col gap-6">
      <SummaryToolbar
        period={period}
        range={range}
        onPeriodChange={handlePeriodChange}
        onRangeChange={setRange}
        loading={loading}
      />

      {loading && (
        <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
          Loading summary data…
        </div>
      )}

      {!loading && error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <>
          <SummaryChart rows={data.rows} />
          <SummaryTable data={data} />
        </>
      )}
    </div>
  );
}
