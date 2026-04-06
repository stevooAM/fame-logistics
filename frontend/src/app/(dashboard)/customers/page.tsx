"use client";
import { useState } from "react";
import { CustomerTable } from "./components/CustomerTable";
import { CustomerToolbar } from "./components/CustomerToolbar";
import { BatchActionBar } from "./components/BatchActionBar";
import { CustomerFormDialog } from "./components/CustomerFormDialog";
import type { Customer, CustomerFilters } from "@/types/customer";

export default function CustomersPage() {
  const [filters, setFilters] = useState<CustomerFilters>({ ordering: "company_name" });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [dirtyCount, setDirtyCount] = useState(0);
  const [addInlineTrigger, setAddInlineTrigger] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveAllTrigger, setSaveAllTrigger] = useState(0);
  const [cancelAllTrigger, setCancelAllTrigger] = useState(0);

  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

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
        onExport={() => console.log("export — wired in 04-07")}
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
