import { apiFetch } from "@/lib/api";

export type SummaryPeriod = "month" | "quarter";

export interface PeriodSummaryRow {
  period_start: string;
  period_end: string;
  period_label: string;
  invoiced: string | number;
  paid: string | number;
  outstanding: string | number;
}

export interface PeriodSummaryTotals {
  invoiced: string | number;
  paid: string | number;
  outstanding: string | number;
}

export interface PeriodSummaryResponse {
  period: SummaryPeriod;
  date_from: string;
  date_to: string;
  rows: PeriodSummaryRow[];
  totals: PeriodSummaryTotals;
}

export interface SummaryFilters {
  period: SummaryPeriod;
  date_from?: string;
  date_to?: string;
}

/**
 * Fetch period summary from /api/accounts/summary/
 * IMPORTANT: uses date_from/date_to — NEVER start_date/end_date (backend silently ignores them)
 */
export async function fetchPeriodSummary(
  filters: SummaryFilters,
  signal?: AbortSignal
): Promise<PeriodSummaryResponse> {
  const params = new URLSearchParams();
  params.set("period", filters.period);
  if (filters.date_from) params.set("date_from", filters.date_from);
  if (filters.date_to) params.set("date_to", filters.date_to);

  return apiFetch<PeriodSummaryResponse>(
    `/api/accounts/summary/?${params.toString()}`,
    { signal }
  );
}
