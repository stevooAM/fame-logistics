export type JobStatus =
  | "DRAFT"
  | "PENDING"
  | "IN_PROGRESS"
  | "CUSTOMS"
  | "DELIVERED"
  | "CLOSED"
  | "CANCELLED";

export type JobType = "IMPORT" | "EXPORT" | "TRANSIT" | "LOCAL";

export interface Job {
  id: number;
  job_number: string;
  customer: number;
  customer_name: string | null;
  customer_detail: { id: number; company_name: string } | null;
  job_type: JobType;
  status: JobStatus;
  origin: string;
  destination: string;
  cargo_description: string;
  bill_of_lading: string;
  container_number: string;
  weight_kg: string | null;
  volume_cbm: string | null;
  total_cost: string | null;
  notes: string;
  eta: string | null;
  delivery_date: string | null;
  assigned_to: number | null;
  assigned_to_name: string | null;
  assigned_to_detail: { id: number; username: string; full_name: string } | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface JobListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Job[];
}

export interface JobFilters {
  search?: string;
  status?: JobStatus;
  job_type?: JobType;
  customer_name?: string;
  assigned_to?: string;
  date_from?: string;
  date_to?: string;
  port?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface JobDocument {
  id: number;
  job: number;
  document_type: number | null;
  document_type_name: string | null;
  file_name: string;
  file_url: string;
  file_size: number | null;
  uploaded_by: number | null;
  uploaded_by_name: string | null;
  created_at: string;
}

export interface JobAuditEntry {
  id: number;
  action: string;
  old_value: string;
  new_value: string;
  user: number | null;
  user_name: string | null;
  created_at: string;
}

export const JOB_STATUS_CONFIG: Record<
  JobStatus,
  { label: string; color: string; bg: string }
> = {
  DRAFT: { label: "Draft", color: "text-gray-700", bg: "bg-gray-100" },
  PENDING: { label: "Pending", color: "text-amber-700", bg: "bg-amber-100" },
  IN_PROGRESS: {
    label: "In Progress",
    color: "text-blue-700",
    bg: "bg-blue-100",
  },
  CUSTOMS: {
    label: "Customs",
    color: "text-purple-700",
    bg: "bg-purple-100",
  },
  DELIVERED: {
    label: "Delivered",
    color: "text-green-700",
    bg: "bg-green-100",
  },
  CLOSED: { label: "Closed", color: "text-gray-500", bg: "bg-gray-200" },
  CANCELLED: {
    label: "Cancelled",
    color: "text-red-700",
    bg: "bg-red-100",
  },
};

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  IMPORT: "Import",
  EXPORT: "Export",
  TRANSIT: "Transit",
  LOCAL: "Local",
};
