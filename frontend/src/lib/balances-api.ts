import { apiFetch, apiFetchBlob } from "@/lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CustomerBalance {
  customer_id: number;
  customer_name: string;
  invoice_count: number;
  invoiced_total: string;
  paid_total: string;
  balance: string;
  currency_code: string;
}

export interface CustomerBalancesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: CustomerBalance[];
}

export interface BalanceInvoice {
  id: number;
  invoice_number: string;
  job: number | null;
  job_number: string | null;
  customer: number;
  customer_name: string | null;
  amount: string;
  paid_total: string;
  balance: string;
  currency: number | null;
  currency_code: string | null;
  status: string;
  issue_date: string;
  due_date: string;
  created_at: string;
}

export interface CustomerBalanceDetailResponse {
  customer: {
    id: number;
    company_name: string;
    email: string;
    phone_number: string | null;
    tin: string;
  };
  invoiced_total: string;
  paid_total: string;
  balance: string;
  invoice_count: number;
  invoices: BalanceInvoice[];
}

export interface BalancesFilters {
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
  include_zero?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildQuery(filters: BalancesFilters): string {
  const p = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  });
  const s = p.toString();
  return s ? `?${s}` : "";
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export function fetchBalances(
  filters: BalancesFilters = {},
  signal?: AbortSignal
): Promise<CustomerBalancesResponse> {
  return apiFetch<CustomerBalancesResponse>(
    `/api/accounts/balances/${buildQuery(filters)}`,
    { signal }
  );
}

export function fetchBalanceDetail(
  customerId: number,
  signal?: AbortSignal
): Promise<CustomerBalanceDetailResponse> {
  return apiFetch<CustomerBalanceDetailResponse>(
    `/api/accounts/balances/${customerId}/`,
    { signal }
  );
}

export function exportBalancesBlob(
  filters: BalancesFilters = {},
  format: "xlsx" | "csv"
): Promise<Blob> {
  const exportFilters = { ...filters, format };
  return apiFetchBlob(`/api/accounts/balances/export/${buildQuery(exportFilters)}`);
}
