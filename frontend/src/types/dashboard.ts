export interface KpiData {
  active_jobs: number;
  pending_approvals: number | null; // null for Finance role
  outstanding_invoice_total: string; // e.g. "12450.00"
  new_customers_this_month: number;
}

export interface ActivityEntry {
  id: number;
  source_type: string;
  actor_name: string;
  action: string;
  timestamp: string; // ISO 8601
  link: string | null;
}

export interface FeedPage {
  count: number;
  next: string | null;
  previous: string | null;
  results: ActivityEntry[];
}

export interface DashboardResponse {
  kpis: KpiData;
  feed: FeedPage;
}
