"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import type { LookupConfig, LookupEntry } from "@/types/lookup";
import { LookupFormDialog } from "./LookupFormDialog";

interface LookupTabProps {
  config: LookupConfig;
}

export function LookupTab({ config }: LookupTabProps) {
  const [entries, setEntries] = useState<LookupEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogEntry, setDialogEntry] = useState<LookupEntry | null | undefined>(
    undefined
  ); // undefined = closed, null = create, LookupEntry = edit

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<LookupEntry[]>(
        `${config.apiPath}?include_inactive=true`
      );
      const sorted = [...data].sort((a, b) => a.sort_order - b.sort_order);
      setEntries(sorted);
    } catch {
      setError("Failed to load entries. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [config.apiPath]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  async function handleToggleActive(entry: LookupEntry) {
    try {
      if (entry.is_active) {
        // Soft-delete: returns 200 with updated object
        await apiFetch<LookupEntry>(`${config.apiPath}${entry.id}/`, {
          method: "DELETE",
        });
      } else {
        // Reactivate
        await apiFetch<LookupEntry>(`${config.apiPath}${entry.id}/`, {
          method: "PATCH",
          body: JSON.stringify({ is_active: true }),
        });
      }
      await fetchEntries();
    } catch {
      alert("Failed to update status. Please try again.");
    }
  }

  const extraFields = config.extraFields ?? [];

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {entries.length} {entries.length === 1 ? "entry" : "entries"} (including inactive)
        </p>
        <Button
          onClick={() => setDialogEntry(null)}
          style={{ backgroundColor: "#1F7A8C" }}
          className="text-white hover:opacity-90 text-sm"
        >
          + Add New
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
          Loading…
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="rounded-md border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-700">Name</TableHead>
                <TableHead className="font-semibold text-gray-700">Code</TableHead>
                <TableHead className="font-semibold text-gray-700">Sort Order</TableHead>
                {extraFields.map((f) => (
                  <TableHead key={f.name} className="font-semibold text-gray-700">
                    {f.label}
                  </TableHead>
                ))}
                <TableHead className="font-semibold text-gray-700">Status</TableHead>
                <TableHead className="font-semibold text-gray-700 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4 + extraFields.length + 1}
                    className="py-10 text-center text-gray-400 text-sm"
                  >
                    No entries yet. Click &quot;Add New&quot; to create one.
                  </TableCell>
                </TableRow>
              )}
              {entries.map((entry) => (
                <TableRow
                  key={entry.id}
                  className={entry.is_active ? "" : "opacity-50"}
                >
                  <TableCell className="font-medium text-gray-900">
                    {entry.name}
                  </TableCell>
                  <TableCell className="text-gray-500 font-mono text-sm">
                    {entry.code ?? <span className="text-gray-300">—</span>}
                  </TableCell>
                  <TableCell className="text-gray-500">{entry.sort_order}</TableCell>
                  {extraFields.map((f) => (
                    <TableCell key={f.name} className="text-gray-500">
                      {f.type === "checkbox" ? (
                        (entry as Record<string, unknown>)[f.name] ? (
                          <Badge className="bg-teal-100 text-teal-800 border-teal-200">
                            Yes
                          </Badge>
                        ) : (
                          <span className="text-gray-300">No</span>
                        )
                      ) : (
                        String((entry as Record<string, unknown>)[f.name] ?? "—")
                      )}
                    </TableCell>
                  ))}
                  <TableCell>
                    {entry.is_active ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Active
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-500 border-gray-200">
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setDialogEntry(entry)}
                        className="text-sm text-[#1F7A8C] hover:underline font-medium"
                      >
                        Edit
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={() => handleToggleActive(entry)}
                        className={`text-sm font-medium hover:underline ${
                          entry.is_active
                            ? "text-red-500"
                            : "text-green-600"
                        }`}
                      >
                        {entry.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create / Edit dialog */}
      {dialogEntry !== undefined && (
        <LookupFormDialog
          config={config}
          entry={dialogEntry}
          onClose={() => setDialogEntry(undefined)}
          onSaved={fetchEntries}
        />
      )}
    </div>
  );
}
