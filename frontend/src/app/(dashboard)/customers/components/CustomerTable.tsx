"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AgGridReact } from "ag-grid-react";
import type {
  ColDef,
  ICellRendererParams,
  CellValueChangedEvent,
  RowClassParams,
} from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { apiFetch } from "@/lib/api";
import type { Customer, CustomerFilters, CustomerListResponse } from "@/types/customer";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// KebabMenu component
// ---------------------------------------------------------------------------

interface KebabMenuProps {
  isTemp: boolean;
  onEdit: () => void;
  onViewDetail: () => void;
  onDelete: () => void;
  onRemove: () => void;
}

function KebabMenu({ isTemp, onEdit, onViewDetail, onDelete, onRemove }: KebabMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative flex items-center h-full">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-center w-7 h-7 rounded hover:bg-gray-100 text-gray-500"
        aria-label="Row actions"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="3" r="1.2" />
          <circle cx="8" cy="8" r="1.2" />
          <circle cx="8" cy="13" r="1.2" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-50 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[140px]">
          {isTemp ? (
            <button
              onClick={() => { setOpen(false); onRemove(); }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Remove
            </button>
          ) : (
            <>
              <button
                onClick={() => { setOpen(false); onEdit(); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                onClick={() => { setOpen(false); onViewDetail(); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                View Detail
              </button>
              <button
                onClick={() => { setOpen(false); onDelete(); }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// DeleteDialog component
// ---------------------------------------------------------------------------

interface DeleteDialogProps {
  open: boolean;
  customerName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteDialog({ open, customerName, onConfirm, onCancel }: DeleteDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
        <h2 className="text-base font-semibold text-[#2B3E50] mb-2">Delete Customer</h2>
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to delete{" "}
          <span className="font-medium">{customerName}</span>? This action cannot be
          undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-md px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            style={{ backgroundColor: "#dc2626" }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CustomerTableProps {
  filters: CustomerFilters;
  refreshTrigger: number;
  addInlineTrigger: number;
  saveAllTrigger: number;
  cancelAllTrigger: number;
  onEditCustomer: (c: Customer) => void;
  onDirtyChange: (count: number) => void;
  onSaveComplete: () => void;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function CustomerTable({
  filters,
  refreshTrigger,
  addInlineTrigger,
  saveAllTrigger,
  cancelAllTrigger,
  onEditCustomer,
  onDirtyChange,
  onSaveComplete,
}: CustomerTableProps) {
  const router = useRouter();
  const [gridData, setGridData] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Dirty tracking
  const [dirtyRows, setDirtyRows] = useState<Map<number, Partial<Customer>>>(new Map());
  const originalRowsRef = useRef<Map<number, Customer>>(new Map());

  // Validation errors: set of row ids with errors
  const [validationErrors, setValidationErrors] = useState<Set<number>>(new Set());

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  // Previous trigger values for detecting changes
  const prevAddInlineTrigger = useRef(addInlineTrigger);
  const prevSaveAllTrigger = useRef(saveAllTrigger);
  const prevCancelAllTrigger = useRef(cancelAllTrigger);

  // ---------------------------------------------------------------------------
  // Fetch customers
  // ---------------------------------------------------------------------------

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(PAGE_SIZE),
      });
      if (filters.search) params.set("search", filters.search);
      if (filters.ordering) params.set("ordering", filters.ordering);
      if (filters.business_type) params.set("business_type", filters.business_type);
      if (filters.customer_type) params.set("customer_type", filters.customer_type);
      if (filters.credit_terms) params.set("credit_terms", filters.credit_terms);

      const data = await apiFetch<CustomerListResponse>(`/api/customers/?${params.toString()}`);
      setGridData(data.results);
      setTotalCount(data.count);

      // Reset dirty state on fresh fetch
      setDirtyRows(new Map());
      originalRowsRef.current = new Map();
      onDirtyChange(0);
      setValidationErrors(new Set());
    } catch {
      // error handled by apiFetch
    } finally {
      setLoading(false);
    }
  }, [page, filters, refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [filters.search, filters.ordering, filters.business_type, filters.customer_type, filters.credit_terms]);

  // ---------------------------------------------------------------------------
  // Add inline row
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (addInlineTrigger === prevAddInlineTrigger.current) return;
    prevAddInlineTrigger.current = addInlineTrigger;

    const tempId = -Date.now();
    const blankRow: Customer = {
      id: tempId,
      company_name: "",
      tin: "",
      contact_person: "",
      phone: "",
      email: "",
      address: "",
      customer_type: "Company",
      business_type: "",
      credit_terms: "",
      notes: "",
      is_active: true,
      preferred_port: null,
      preferred_port_name: null,
      currency_preference: null,
      currency_preference_code: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setGridData((prev) => [blankRow, ...prev]);
    setDirtyRows((prev) => {
      const next = new Map(prev);
      next.set(tempId, {});
      onDirtyChange(next.size);
      return next;
    });
  }, [addInlineTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Save all
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (saveAllTrigger === prevSaveAllTrigger.current) return;
    prevSaveAllTrigger.current = saveAllTrigger;

    async function performSave() {
      const errors = new Set<number>();
      const promises: Promise<void>[] = [];

      dirtyRows.forEach((changes, id) => {
        if (id < 0) {
          // New row — POST
          const row = gridData.find((r) => r.id === id);
          if (!row) return;

          // Validate required fields
          if (!row.company_name.trim() || !row.tin.trim()) {
            errors.add(id);
            return;
          }

          const payload = {
            company_name: row.company_name,
            tin: row.tin,
            contact_person: row.contact_person,
            phone: row.phone,
            email: row.email,
            address: row.address,
            customer_type: row.customer_type,
            business_type: row.business_type,
            credit_terms: row.credit_terms,
            notes: row.notes,
          };

          promises.push(
            apiFetch<Customer>("/api/customers/", {
              method: "POST",
              body: JSON.stringify(payload),
            }).then(() => {
              // Row will be refreshed via fetchCustomers
            }).catch(() => {
              errors.add(id);
            })
          );
        } else {
          // Existing row — PATCH
          if (Object.keys(changes).length === 0) return;
          promises.push(
            apiFetch<Customer>(`/api/customers/${id}/`, {
              method: "PATCH",
              body: JSON.stringify(changes),
            }).then(() => {
              // Success
            }).catch(() => {
              errors.add(id);
            })
          );
        }
      });

      await Promise.all(promises);

      if (errors.size > 0) {
        setValidationErrors(errors);
      } else {
        setValidationErrors(new Set());
      }

      // Clear dirty state for rows that saved successfully
      setDirtyRows((prev) => {
        const next = new Map(prev);
        prev.forEach((_, id) => {
          if (!errors.has(id)) next.delete(id);
        });
        onDirtyChange(next.size);
        return next;
      });

      onSaveComplete();
    }

    performSave();
  }, [saveAllTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Cancel all
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (cancelAllTrigger === prevCancelAllTrigger.current) return;
    prevCancelAllTrigger.current = cancelAllTrigger;

    // Revert dirty rows to originals and remove temp rows
    setGridData((prev) => {
      return prev
        .filter((row) => row.id > 0) // remove temp rows
        .map((row) => {
          const original = originalRowsRef.current.get(row.id);
          return original ? original : row;
        });
    });

    originalRowsRef.current = new Map();
    setDirtyRows(new Map());
    onDirtyChange(0);
    setValidationErrors(new Set());
  }, [cancelAllTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await apiFetch(`/api/customers/${deleteTarget.id}/`, { method: "DELETE" });
      setDeleteTarget(null);
      fetchCustomers();
    } catch {
      setDeleteTarget(null);
    }
  }

  // ---------------------------------------------------------------------------
  // Remove temp row
  // ---------------------------------------------------------------------------

  function handleRemoveTempRow(id: number) {
    setGridData((prev) => prev.filter((r) => r.id !== id));
    setDirtyRows((prev) => {
      const next = new Map(prev);
      next.delete(id);
      onDirtyChange(next.size);
      return next;
    });
    validationErrors.delete(id);
    setValidationErrors(new Set(validationErrors));
  }

  // ---------------------------------------------------------------------------
  // Cell value changed (inline editing)
  // ---------------------------------------------------------------------------

  function handleCellValueChanged(event: CellValueChangedEvent<Customer>) {
    const rowId = event.data?.id;
    if (rowId === undefined) return;

    const field = event.colDef.field as keyof Customer;
    if (!field) return;

    // Track original before first edit
    if (!originalRowsRef.current.has(rowId) && rowId > 0) {
      // Find the original unmodified row from the data at time of fetch
      // We use the previous value from the event to reconstruct original
      const original = { ...event.data, [field]: event.oldValue } as Customer;
      originalRowsRef.current.set(rowId, original);
    }

    // Update gridData
    setGridData((prev) =>
      prev.map((row) =>
        row.id === rowId ? { ...row, [field]: event.newValue } : row
      )
    );

    // Update dirty rows
    setDirtyRows((prev) => {
      const next = new Map(prev);
      const existing = next.get(rowId) ?? {};
      next.set(rowId, { ...existing, [field]: event.newValue });
      onDirtyChange(next.size);
      return next;
    });
  }

  // ---------------------------------------------------------------------------
  // Column definitions
  // ---------------------------------------------------------------------------

  const columnDefs: ColDef<Customer>[] = useMemo(
    () => [
      {
        field: "company_name",
        headerName: "Company Name",
        flex: 1,
        minWidth: 180,
        sortable: true,
        filter: true,
        editable: true,
      },
      {
        field: "tin",
        headerName: "TIN",
        width: 140,
        sortable: true,
        filter: true,
        editable: true,
        cellStyle: (params) => {
          if (params.data && validationErrors.has(params.data.id) && !params.value) {
            return { borderLeft: "2px solid #ef4444" };
          }
          return null;
        },
      },
      {
        field: "contact_person",
        headerName: "Contact Person",
        width: 160,
        sortable: true,
        editable: true,
      },
      {
        field: "phone",
        headerName: "Phone",
        width: 140,
        editable: true,
      },
      {
        field: "business_type",
        headerName: "Business Type",
        width: 150,
        sortable: true,
        filter: true,
        editable: true,
      },
      {
        field: "credit_terms",
        headerName: "Credit Terms",
        width: 140,
        sortable: true,
        editable: true,
      },
      {
        headerName: "Actions",
        width: 72,
        sortable: false,
        pinned: "right" as const,
        cellRenderer: (params: ICellRendererParams<Customer>) => {
          const customer = params.data;
          if (!customer) return null;
          const isTemp = customer.id < 0;
          return (
            <KebabMenu
              isTemp={isTemp}
              onEdit={() => onEditCustomer(customer)}
              onViewDetail={() => router.push(`/customers/${customer.id}`)}
              onDelete={() => setDeleteTarget(customer)}
              onRemove={() => handleRemoveTempRow(customer.id)}
            />
          );
        },
      },
    ],
    [validationErrors, onEditCustomer, router] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
    }),
    []
  );

  const rowClassRules = useMemo(
    () => ({
      "bg-amber-50": (params: RowClassParams<Customer>) =>
        params.data !== undefined && dirtyRows.has(params.data.id),
    }),
    [dirtyRows]
  );

  // ---------------------------------------------------------------------------
  // Pagination
  // ---------------------------------------------------------------------------

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      <DeleteDialog
        open={deleteTarget !== null}
        customerName={deleteTarget?.company_name ?? ""}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="flex flex-col gap-3">
        {loading && (
          <p className="text-sm text-gray-400">Loading...</p>
        )}

        {!loading && gridData.length === 0 && (
          <p className="text-sm text-gray-500">No customers found.</p>
        )}

        <div className="ag-theme-alpine w-full" style={{ height: 480 }}>
          <AgGridReact<Customer>
            rowData={gridData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            suppressPaginationPanel
            rowHeight={44}
            headerHeight={40}
            animateRows
            rowClassRules={rowClassRules}
            onCellValueChanged={handleCellValueChanged}
            stopEditingWhenCellsLoseFocus
          />
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            {totalCount > 0
              ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, totalCount)} of ${totalCount} customers`
              : "No customers found"}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded border border-input px-3 py-1 text-xs hover:bg-gray-50 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-2 py-1 text-xs">
              Page {page} of {Math.max(1, totalPages)}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded border border-input px-3 py-1 text-xs hover:bg-gray-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
