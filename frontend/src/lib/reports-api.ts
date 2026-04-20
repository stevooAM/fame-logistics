import { apiFetch, apiFetchBlob } from "@/lib/api";

// ---------------------------------------------------------------------------
// Customer Activity
// ---------------------------------------------------------------------------

export interface CustomerActivityRow {
  customer_id: number;
  customer_name: string;
  total_jobs: number;
  total_value: string;
  draft: number;
  pending: number;
  in_progress: number;
  customs: number;
  delivered: number;
  closed: number;
  cancelled: number;
}

export interface CustomerActivityResponse {
  date_from: string;
  date_to: string;
  rows: CustomerActivityRow[];
  count: number;
}

export async function fetchCustomerActivity(
  params: { date_from: string; date_to: string; customer_id?: number },
  signal?: AbortSignal
): Promise<CustomerActivityResponse> {
  const qs = new URLSearchParams();
  qs.set("date_from", params.date_from);
  qs.set("date_to", params.date_to);
  if (params.customer_id !== undefined && params.customer_id !== null) {
    qs.set("customer_id", String(params.customer_id));
  }
  return apiFetch<CustomerActivityResponse>(
    `/api/reports/customer-activity/?${qs.toString()}`,
    { signal }
  );
}

// ---------------------------------------------------------------------------
// Job Status
// ---------------------------------------------------------------------------

export interface JobStatusRow {
  status: string;
  status_label: string;
  job_type: string;
  job_type_label: string;
  count: number;
  total_value: string;
}

export interface JobStatusResponse {
  date_from: string;
  date_to: string;
  rows: JobStatusRow[];
}

export async function fetchJobStatus(
  params: { date_from: string; date_to: string },
  signal?: AbortSignal
): Promise<JobStatusResponse> {
  const qs = new URLSearchParams();
  qs.set("date_from", params.date_from);
  qs.set("date_to", params.date_to);
  return apiFetch<JobStatusResponse>(
    `/api/reports/job-status/?${qs.toString()}`,
    { signal }
  );
}

// ---------------------------------------------------------------------------
// Revenue
// ---------------------------------------------------------------------------

export interface RevenuePeriodRow {
  period_label: string;
  period_start: string;
  invoiced: string;
  paid: string;
  outstanding: string;
}

export interface RevenueTotals {
  invoiced: string;
  paid: string;
  outstanding: string;
}

export interface RevenueCustomerRow {
  customer_id: number;
  customer_name: string;
  invoiced: string;
  paid: string;
  outstanding: string;
}

export interface RevenueResponse {
  date_from: string;
  date_to: string;
  currency_code: string | null;
  period_rows: RevenuePeriodRow[];
  period_totals: RevenueTotals;
  customer_rows: RevenueCustomerRow[];
  customer_totals: RevenueTotals;
}

export async function fetchRevenue(
  params: { date_from: string; date_to: string; currency_code?: string },
  signal?: AbortSignal
): Promise<RevenueResponse> {
  const qs = new URLSearchParams();
  qs.set("date_from", params.date_from);
  qs.set("date_to", params.date_to);
  if (params.currency_code) {
    qs.set("currency_code", params.currency_code);
  }
  return apiFetch<RevenueResponse>(
    `/api/reports/revenue/?${qs.toString()}`,
    { signal }
  );
}

// ---------------------------------------------------------------------------
// Export functions (RPT-04) — PDF and Excel via apiFetchBlob
// ---------------------------------------------------------------------------

export async function exportCustomerActivity(
  params: { date_from: string; date_to: string; customer_id?: number },
  format: "pdf" | "xlsx"
): Promise<Blob> {
  const p = new URLSearchParams({
    date_from: params.date_from,
    date_to: params.date_to,
    format,
  });
  if (params.customer_id !== undefined && params.customer_id !== null) {
    p.set("customer_id", String(params.customer_id));
  }
  return apiFetchBlob(`/api/reports/customer-activity/export/?${p.toString()}`);
}

export async function exportJobStatus(
  params: { date_from: string; date_to: string },
  format: "pdf" | "xlsx"
): Promise<Blob> {
  const p = new URLSearchParams({
    date_from: params.date_from,
    date_to: params.date_to,
    format,
  });
  return apiFetchBlob(`/api/reports/job-status/export/?${p.toString()}`);
}

export async function exportRevenue(
  params: { date_from: string; date_to: string; currency_code?: string },
  format: "pdf" | "xlsx"
): Promise<Blob> {
  const p = new URLSearchParams({
    date_from: params.date_from,
    date_to: params.date_to,
    format,
  });
  if (params.currency_code) {
    p.set("currency_code", params.currency_code);
  }
  return apiFetchBlob(`/api/reports/revenue/export/?${p.toString()}`);
}
