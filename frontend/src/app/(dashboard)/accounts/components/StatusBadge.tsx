import type { InvoiceStatus } from "@/types/account";
import { INVOICE_STATUS_CONFIG } from "@/types/account";

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  const cfg = INVOICE_STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cfg.color} ${cfg.bg}`}
    >
      {cfg.label}
    </span>
  );
}
