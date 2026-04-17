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
