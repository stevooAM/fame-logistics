export interface AuditLogEntry {
  id: number;
  user: string;          // username or "System"
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "IMPERSONATE";
  model_name: string;    // e.g. "User", "Customer", "Port"
  object_id: string;
  object_repr: string;   // human-readable description
  changes: Record<string, unknown>;
  ip_address: string | null;
  timestamp: string;     // ISO datetime
}

export interface AuditLogFilters {
  user?: string;
  action?: string;
  module?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
}
