"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { CustomerTable } from "./components/CustomerTable";
import { CustomerToolbar } from "./components/CustomerToolbar";
import { BatchActionBar } from "./components/BatchActionBar";
import { CustomerFormDialog } from "./components/CustomerFormDialog";
import { apiFetchBlob } from "@/lib/api";
import type { Customer, CustomerFilters } from "@/types/customer";

export default function CustomersPage() {
  const [filters, setFilters] = useState<CustomerFilters>({ ordering: "company_name" });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [dirtyCount, setDirtyCount] = useState(0);
  const [addInlineTrigger, setAddInlineTrigger] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveAllTrigger, setSaveAllTrigger] = useState(0);
  const [cancelAllTrigger, setCancelAllTrigger] = useState(0);

  const searchParams = useSearchParams();

  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    if (searchParams.get("create") === "1") {
      setEditingCustomer(null);
      setIsFormOpen(true);
    }
  }, [searchParams]);

  function handleAddCustomer() {
    setEditingCustomer(null);
    setIsFormOpen(true);
  }

  function handleEditCustomer(customer: Customer) {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  }

  function handleFormSuccess() {
    setIsFormOpen(false);
    setRefreshTrigger((n) => n + 1);
  }

  async function handleExport(format: "xlsx" | "csv") {
    const params = new URLSearchParams();
    params.set("format", format);
    if (filters.search) params.set("search", filters.search);
    if (filters.company_name) params.set("company_name", filters.company_name);
    if (filters.tin) params.set("tin", filters.tin);
    if (filters.business_type) params.set("business_type", filters.business_type);
    if (filters.customer_type) params.set("customer_type", filters.customer_type);
    if (filters.credit_terms) params.set("credit_terms", filters.credit_terms);
    if (filters.ordering) params.set("ordering", filters.ordering);

    const blob = await apiFetchBlob(`/api/customers/export/?${params.toString()}`);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customers_export.${format === "xlsx" ? "xlsx" : "csv"}`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#2B3E50]">Customers</h1>
        <p className="text-sm text-gray-500 mt-1">Manage customer records</p>
      </div>
      <CustomerToolbar
        onSearch={(term) => setFilters((f) => ({ ...f, search: term }))}
        onAddCustomer={handleAddCustomer}
        onAddInline={() => setAddInlineTrigger((n) => n + 1)}
        onExportExcel={() => handleExport("xlsx")}
        onExportCsv={() => handleExport("csv")}
      />
      <BatchActionBar
        dirtyCount={dirtyCount}
        isSaving={isSaving}
        onSaveAll={() => {
          setIsSaving(true);
          setSaveAllTrigger((n) => n + 1);
        }}
        onCancelAll={() => setCancelAllTrigger((n) => n + 1)}
      />
      <CustomerTable
        filters={filters}
        refreshTrigger={refreshTrigger}
        addInlineTrigger={addInlineTrigger}
        saveAllTrigger={saveAllTrigger}
        cancelAllTrigger={cancelAllTrigger}
        onEditCustomer={handleEditCustomer}
        onDirtyChange={setDirtyCount}
        onSaveComplete={() => {
          setIsSaving(false);
          setRefreshTrigger((n) => n + 1);
        }}
      />

      <CustomerFormDialog
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        customer={editingCustomer}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
