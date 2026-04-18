"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AccountsTabs } from "./components/AccountsTabs";
import { InvoiceToolbar } from "./components/InvoiceToolbar";
import { InvoiceTable } from "./components/InvoiceTable";
import { GenerateInvoiceDialog } from "./components/GenerateInvoiceDialog";
import { InvoiceDetailDrawer } from "./components/InvoiceDetailDrawer";
import type { InvoiceFilters } from "@/types/account";

export default function AccountsPage() {
  const [filters, setFilters] = useState<InvoiceFilters>({ ordering: "-created_at" });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [openInvoiceId, setOpenInvoiceId] = useState<number | null>(null);

  // Honour ?invoice={id} on mount so external links (e.g., balances drill-down,
  // email links, bookmarks) can auto-open the detail drawer. Clears the param
  // from the URL on drawer close to keep navigation history tidy.
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const raw = searchParams?.get("invoice");
    if (!raw) return;
    const id = Number(raw);
    if (Number.isFinite(id) && id > 0) {
      setOpenInvoiceId(id);
    }
  }, [searchParams]);

  function handleDrawerClose() {
    setOpenInvoiceId(null);
    // Strip ?invoice= from URL so a refresh doesn't reopen it.
    if (searchParams?.get("invoice")) {
      router.replace("/accounts");
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#2B3E50]">Accounts</h1>
        <p className="text-sm text-gray-500 mt-1">
          Generate invoices, record payments, monitor outstanding balances
        </p>
      </div>

      <AccountsTabs />

      <InvoiceToolbar
        filters={filters}
        onSearch={(s: string) => setFilters((f) => ({ ...f, search: s || undefined, page: 1 }))}
        onFilterChange={(p: Partial<InvoiceFilters>) => setFilters((f) => ({ ...f, ...p, page: 1 }))}
        onGenerate={() => setGenerateOpen(true)}
      />

      <InvoiceTable
        filters={filters}
        refreshTrigger={refreshTrigger}
        onRowClick={(id: number) => setOpenInvoiceId(id)}
      />

      <GenerateInvoiceDialog
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        onSuccess={() => {
          setGenerateOpen(false);
          setRefreshTrigger((n) => n + 1);
        }}
      />

      <InvoiceDetailDrawer
        invoiceId={openInvoiceId}
        onClose={handleDrawerClose}
        onPaymentRecorded={() => setRefreshTrigger((n) => n + 1)}
      />
    </div>
  );
}
