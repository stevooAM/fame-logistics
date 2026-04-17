export type InvoiceStatus =
  | "DRAFT"
  | "SENT"
  | "PAID"
  | "PARTIAL"
  | "OVERDUE"
  | "CANCELLED";

export interface Invoice {
  id: number;
  invoice_number: string;
  job: number;
  job_number: string | null;
  job_detail: { id: number; job_number: string; status: string } | null;
  customer: number;
  customer_name: string | null;
  customer_detail: { id: number; company_name: string } | null;
  amount: string; // DRF DecimalField → string
  paid_total: string;
  balance: string;
  currency: number | null;
  currency_code: string | null;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  notes: string;
  payments?: Payment[];
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: number;
  invoice: number;
  amount: string;
  payment_date: string;
  payment_method: string;
  reference: string;
  notes: string;
  recorded_by: number | null;
  recorded_by_name: string | null;
  created_at: string;
}

export interface InvoiceListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Invoice[];
}

export interface InvoiceFilters {
  search?: string;
  status?: InvoiceStatus;
  customer_id?: number;
  job_id?: number;
  date_from?: string;
  date_to?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface GenerateInvoicePayload {
  job_id: number;
  amount: string;
  currency_id?: number | null;
  issue_date?: string;
  due_date: string;
  notes?: string;
}

export interface RecordPaymentPayload {
  invoice: number;
  amount: string;
  payment_date: string;
  payment_method?: string;
  reference?: string;
  notes?: string;
}

export const INVOICE_STATUS_CONFIG: Record<
  InvoiceStatus,
  { label: string; color: string; bg: string }
> = {
  DRAFT: { label: "Draft", color: "text-gray-700", bg: "bg-gray-100" },
  SENT: { label: "Sent", color: "text-blue-700", bg: "bg-blue-100" },
  PARTIAL: { label: "Partial", color: "text-amber-700", bg: "bg-amber-100" },
  PAID: { label: "Paid", color: "text-green-700", bg: "bg-green-100" },
  OVERDUE: { label: "Overdue", color: "text-red-700", bg: "bg-red-100" },
  CANCELLED: { label: "Cancelled", color: "text-gray-500", bg: "bg-gray-200" },
};
