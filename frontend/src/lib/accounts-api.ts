import { apiFetch, apiFetchBlob } from "@/lib/api";
import type {
  Invoice,
  InvoiceListResponse,
  InvoiceFilters,
  GenerateInvoicePayload,
  Payment,
  RecordPaymentPayload,
} from "@/types/account";

function buildQuery(filters: InvoiceFilters): string {
  const p = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  });
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function fetchInvoices(filters: InvoiceFilters = {}) {
  return apiFetch<InvoiceListResponse>(`/api/accounts/invoices/${buildQuery(filters)}`);
}

export function fetchInvoice(id: number) {
  return apiFetch<Invoice>(`/api/accounts/invoices/${id}/`);
}

export function generateInvoice(payload: GenerateInvoicePayload) {
  return apiFetch<Invoice>(`/api/accounts/invoices/generate/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function recordPayment(payload: RecordPaymentPayload) {
  return apiFetch<Payment>(`/api/accounts/payments/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchPayments(invoice_id: number) {
  return apiFetch<{ count: number; results: Payment[] }>(
    `/api/accounts/payments/?invoice_id=${invoice_id}`
  );
}

/**
 * Approved jobs available for invoicing.
 * Fetches jobs whose status is one of the post-approval lifecycle states
 * (IN_PROGRESS, CUSTOMS, DELIVERED, CLOSED) — the API rejects the rest at
 * generate-time anyway.
 */
export async function fetchApprovedJobs(
  search = ""
): Promise<Array<{ id: number; job_number: string; customer_name: string | null }>> {
  const p = new URLSearchParams({
    page_size: "50",
    ordering: "-created_at",
  });
  if (search) p.set("search", search);
  const res = await apiFetch<{
    results: Array<{
      id: number;
      job_number: string;
      customer_name: string | null;
      status: string;
    }>;
  }>(`/api/jobs/?${p.toString()}`);
  const eligible = new Set(["IN_PROGRESS", "CUSTOMS", "DELIVERED", "CLOSED"]);
  return res.results
    .filter((j) => eligible.has(j.status))
    .map(({ id, job_number, customer_name }) => ({ id, job_number, customer_name }));
}

export function exportInvoicesBlob(
  filters: InvoiceFilters = {},
  format: "xlsx" | "csv"
): Promise<Blob> {
  const exportFilters = { ...filters, format };
  return apiFetchBlob(`/api/accounts/invoices/export/${buildQuery(exportFilters)}`);
}
