"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, GridReadyEvent, ICellRendererParams } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { apiFetch } from "@/lib/api";
import type { PaginatedResponse, UserProfile } from "@/types/user";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(value: string | null): string {
  if (!value) return "Never";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Cell renderers
// ---------------------------------------------------------------------------

function RoleBadge({ value }: { value: UserProfile["role"] }) {
  if (!value) return <span className="text-gray-400 text-xs">No role</span>;

  const colorMap: Record<string, string> = {
    admin: "bg-purple-100 text-purple-800",
    operations: "bg-blue-100 text-blue-800",
    finance: "bg-green-100 text-green-800",
  };
  const cls = colorMap[value.name.toLowerCase()] ?? "bg-gray-100 text-gray-700";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {value.name}
    </span>
  );
}

function StatusBadge({ value }: { value: boolean }) {
  return value ? (
    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
      Active
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
      Inactive
    </span>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface UserTableProps {
  onEdit: (user: UserProfile) => void;
  refreshTrigger: number;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function UserTable({ onEdit, refreshTrigger }: UserTableProps) {
  const [rowData, setRowData] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const PAGE_SIZE = 20;

  // Debounced search
  function handleSearchChange(value: string) {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 400);
  }

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(PAGE_SIZE),
      });
      if (search) params.set("search", search);
      if (activeFilter === "active") params.set("is_active", "true");
      if (activeFilter === "inactive") params.set("is_active", "false");

      const data = await apiFetch<PaginatedResponse<UserProfile>>(
        `/api/users/?${params.toString()}`
      );
      setRowData(data.results);
      setTotalCount(data.count);
    } catch {
      // error handled by apiFetch
    } finally {
      setLoading(false);
    }
  }, [page, search, activeFilter, refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleDeactivate(userId: number) {
    setActionLoading(userId);
    try {
      await apiFetch(`/api/users/${userId}/deactivate/`, { method: "POST" });
      fetchUsers();
    } catch {
      // error handled by apiFetch
    } finally {
      setActionLoading(null);
    }
  }

  async function handleActivate(userId: number) {
    setActionLoading(userId);
    try {
      await apiFetch(`/api/users/${userId}/activate/`, { method: "POST" });
      fetchUsers();
    } catch {
      // error handled by apiFetch
    } finally {
      setActionLoading(null);
    }
  }

  const columnDefs: ColDef<UserProfile>[] = useMemo(
    () => [
      {
        field: "username",
        headerName: "Username",
        width: 140,
        sortable: true,
      },
      {
        headerName: "Full Name",
        width: 180,
        valueGetter: (params) =>
          `${params.data?.first_name ?? ""} ${params.data?.last_name ?? ""}`.trim(),
        sortable: true,
      },
      {
        field: "email",
        headerName: "Email",
        flex: 1,
        minWidth: 200,
      },
      {
        field: "role",
        headerName: "Role",
        width: 130,
        cellRenderer: (params: ICellRendererParams<UserProfile>) => (
          <RoleBadge value={params.value} />
        ),
      },
      {
        field: "is_active",
        headerName: "Status",
        width: 110,
        cellRenderer: (params: ICellRendererParams<UserProfile>) => (
          <StatusBadge value={params.value} />
        ),
      },
      {
        field: "last_login",
        headerName: "Last Login",
        width: 180,
        valueFormatter: (params) => formatDate(params.value),
      },
      {
        headerName: "Actions",
        width: 200,
        sortable: false,
        cellRenderer: (params: ICellRendererParams<UserProfile>) => {
          const user = params.data;
          if (!user) return null;
          const busy = actionLoading === user.id;

          return (
            <div className="flex items-center gap-1.5 h-full">
              <button
                onClick={() => onEdit(user)}
                disabled={busy}
                className="rounded px-2 py-1 text-xs font-medium text-[#1F7A8C] border border-[#1F7A8C] hover:bg-[#1F7A8C] hover:text-white transition-colors disabled:opacity-50"
              >
                Edit
              </button>
              {user.is_active ? (
                <button
                  onClick={() => handleDeactivate(user.id)}
                  disabled={busy}
                  className="rounded px-2 py-1 text-xs font-medium text-red-600 border border-red-300 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {busy ? "..." : "Deactivate"}
                </button>
              ) : (
                <button
                  onClick={() => handleActivate(user.id)}
                  disabled={busy}
                  className="rounded px-2 py-1 text-xs font-medium text-emerald-600 border border-emerald-300 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                >
                  {busy ? "..." : "Activate"}
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [onEdit, actionLoading] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
    }),
    []
  );

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  function onGridReady(_params: GridReadyEvent) {
    // Grid is ready
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="search"
          placeholder="Search by name or username..."
          onChange={(e) => handleSearchChange(e.target.value)}
          className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-64"
        />

        {/* Active/Inactive filter */}
        <div className="flex rounded-md border border-input overflow-hidden text-sm">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setActiveFilter(f); setPage(1); }}
              className={`px-3 py-1.5 capitalize transition-colors ${
                activeFilter === f
                  ? "bg-[#1F7A8C] text-white"
                  : "bg-white text-[#2B3E50] hover:bg-gray-50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading && (
          <span className="text-xs text-gray-400">Loading...</span>
        )}
      </div>

      {/* AG Grid */}
      <div className="ag-theme-alpine w-full" style={{ height: 480 }}>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onGridReady={onGridReady}
          suppressPaginationPanel
          rowHeight={44}
          headerHeight={40}
          animateRows
        />
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          {totalCount > 0
            ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, totalCount)} of ${totalCount} users`
            : "No users found"}
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
  );
}
