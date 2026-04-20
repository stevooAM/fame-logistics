import { apiFetch } from "@/lib/api";

export interface PendingApproval {
  id: number;
  job: {
    // job.id is NOT included in ApprovalQueueSerializer — render job_number as text
    job_number: string;
    customer_name: string | null;
    job_type: string;
    eta: string | null;
  };
  submitted_by: {
    username: string;
    full_name: string;
  } | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: string;
}

export async function fetchPendingApprovals(): Promise<PendingApproval[]> {
  return apiFetch<PendingApproval[]>("/api/approvals/");
}

export async function approveApproval(id: number, comment = ""): Promise<void> {
  await apiFetch(`/api/approvals/${id}/approve/`, {
    method: "POST",
    body: JSON.stringify({ reason: comment }),
  });
}

export async function rejectApproval(id: number, reason: string): Promise<void> {
  await apiFetch(`/api/approvals/${id}/reject/`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

// ---------------------------------------------------------------------------
// Approval History (Admin-only) — 06-05
// ---------------------------------------------------------------------------

export interface ApprovalHistoryEntry {
  id: number;
  job_number: string;
  action: "SUBMITTED" | "APPROVED" | "REJECTED";
  actor: {
    username: string;
    full_name: string;
  };
  comment: string;
  created_at: string;
}

export interface HistoryFilters {
  action?: "APPROVED" | "REJECTED" | "SUBMITTED" | "";
  date_from?: string;
  date_to?: string;
  job_number?: string;
}

export async function fetchApprovalHistory(
  filters: HistoryFilters = {}
): Promise<ApprovalHistoryEntry[]> {
  const params = new URLSearchParams();
  if (filters.action) params.set("action", filters.action);
  if (filters.date_from) params.set("date_from", filters.date_from);
  if (filters.date_to) params.set("date_to", filters.date_to);
  if (filters.job_number) params.set("job_number", filters.job_number);
  const query = params.toString();
  return apiFetch<ApprovalHistoryEntry[]>(
    `/api/approvals/history/${query ? `?${query}` : ""}`
  );
}
