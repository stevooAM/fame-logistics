"use client";
import { useState } from "react";
import { CustomerTable } from "./components/CustomerTable";
import { CustomerToolbar } from "./components/CustomerToolbar";
import type { CustomerFilters } from "@/types/customer";

export default function CustomersPage() {
  const [filters, setFilters] = useState<CustomerFilters>({ ordering: "company_name" });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [dirtyCount, setDirtyCount] = useState(0);
  const [addInlineTrigger, setAddInlineTrigger] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveAllTrigger, setSaveAllTrigger] = useState(0);
  const [cancelAllTrigger, setCancelAllTrigger] = useState(0);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#2B3E50]">Customers</h1>
        <p className="text-sm text-gray-500 mt-1">Manage customer records</p>
      </div>
      <CustomerToolbar
        onSearch={(term) => setFilters((f) => ({ ...f, search: term }))}
        onAddCustomer={() => console.log("open modal — wired in 04-05")}
        onAddInline={() => setAddInlineTrigger((n) => n + 1)}
        onExport={() => console.log("export — wired in 04-07")}
      />
      <CustomerTable
        filters={filters}
        refreshTrigger={refreshTrigger}
        addInlineTrigger={addInlineTrigger}
        saveAllTrigger={saveAllTrigger}
        cancelAllTrigger={cancelAllTrigger}
        onEditCustomer={(c) => console.log("edit — wired in 04-05", c)}
        onDirtyChange={setDirtyCount}
        onSaveComplete={() => {
          setIsSaving(false);
          setRefreshTrigger((n) => n + 1);
        }}
      />
    </div>
  );
}
