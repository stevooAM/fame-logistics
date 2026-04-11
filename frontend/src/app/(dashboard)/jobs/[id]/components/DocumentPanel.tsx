"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, API_BASE_URL } from "@/lib/api";
import type { JobDocument } from "@/types/job";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DocumentType {
  id: number;
  name: string;
  code: string | null;
}

interface DropdownResponse {
  document_types: DocumentType[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DocumentPanelProps {
  jobId: number;
  userRole: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DocumentPanel({ jobId, userRole }: DocumentPanelProps) {
  const role = userRole.toLowerCase();
  const canModify = role === "admin" || role === "operations";

  const [documents, setDocuments] = useState<JobDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload state
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [selectedDocType, setSelectedDocType] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete state
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // ---------------------------------------------------------------------------
  // Fetch documents
  // ---------------------------------------------------------------------------

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<JobDocument[]>(`/api/jobs/${jobId}/documents/`);
      setDocuments(data);
    } catch {
      setError("Failed to load documents.");
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // ---------------------------------------------------------------------------
  // Fetch document types
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!canModify) return;
    apiFetch<DropdownResponse>("/api/setup/dropdowns/")
      .then((data) => setDocTypes(data.document_types ?? []))
      .catch(() => setDocTypes([]));
  }, [canModify]);

  // ---------------------------------------------------------------------------
  // Upload document
  // ---------------------------------------------------------------------------

  async function handleUpload() {
    if (!selectedFile) {
      setUploadError("Please select a file.");
      return;
    }
    if (!selectedDocType) {
      setUploadError("Please select a document type.");
      return;
    }

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("document_type", selectedDocType);

    try {
      const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/documents/`, {
        method: "POST",
        credentials: "include",
        body: formData,
        // Do NOT set Content-Type — browser sets multipart/form-data with boundary
      });

      if (response.status === 401) {
        // Try silent refresh
        const refreshed = await fetch(`${API_BASE_URL}/api/auth/refresh/`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (refreshed.ok) {
          const retry = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/documents/`, {
            method: "POST",
            credentials: "include",
            body: formData,
          });
          if (!retry.ok) {
            const err = await retry.json().catch(() => ({}));
            setUploadError(
              (err as Record<string, unknown>).detail
                ? String((err as Record<string, unknown>).detail)
                : "Upload failed."
            );
            return;
          }
        } else {
          window.location.href = "/login";
          return;
        }
      } else if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const errData = err as Record<string, unknown>;
        const msg =
          errData.detail ??
          errData.file ??
          errData.document_type ??
          Object.values(errData)[0];
        setUploadError(
          typeof msg === "string" ? msg : Array.isArray(msg) ? String(msg[0]) : "Upload failed."
        );
        return;
      }

      // Success — reset and refresh
      setSelectedFile(null);
      setSelectedDocType("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchDocuments();
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Delete document
  // ---------------------------------------------------------------------------

  async function handleDeleteConfirm(docId: number) {
    setDeletingId(docId);
    setConfirmDeleteId(null);
    try {
      await apiFetch(`/api/jobs/${jobId}/documents/${docId}/`, { method: "DELETE" });
      await fetchDocuments();
    } catch {
      // Non-fatal — show nothing, just stop spinner
    } finally {
      setDeletingId(null);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div
      className="rounded-xl border border-gray-100 bg-white shadow-sm p-4 space-y-4"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Section header */}
      <div className="flex items-center gap-2">
        <span
          className="text-[10px] font-semibold tracking-widest uppercase"
          style={{ color: "#1F7A8C" }}
        >
          Documents
        </span>
        <div className="flex-1 h-px" style={{ background: "#e5f4f6" }} />
        {documents.length >= 20 && (
          <span className="text-xs text-amber-600">20-doc limit reached</span>
        )}
      </div>

      {/* Upload section */}
      {canModify && documents.length < 20 && (
        <div className="space-y-2 rounded-lg border border-dashed border-gray-200 p-3">
          <p className="text-xs font-medium text-gray-600">Upload Document</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <select
              value={selectedDocType}
              onChange={(e) => setSelectedDocType(e.target.value)}
              className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F7A8C] text-gray-700"
            >
              <option value="">Select document type</option>
              {docTypes.map((dt) => (
                <option key={dt.id} value={String(dt.id)}>
                  {dt.name}
                </option>
              ))}
            </select>

            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-700 file:mr-2 file:rounded file:border-0 file:bg-gray-100 file:px-2 file:py-1 file:text-xs file:font-medium focus:outline-none"
            />
          </div>

          {selectedFile && (
            <p className="text-xs text-gray-400 truncate">
              Selected: {selectedFile.name} ({formatBytes(selectedFile.size)})
            </p>
          )}

          {uploadError && (
            <p className="text-xs text-red-600">{uploadError}</p>
          )}

          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading || !selectedFile || !selectedDocType}
            className="rounded-lg px-4 py-2 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            style={{ backgroundColor: "#1F7A8C" }}
          >
            {uploading ? (
              <>
                <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Uploading...
              </>
            ) : (
              "Upload"
            )}
          </button>
        </div>
      )}

      {/* Document list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-10 rounded bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <p className="text-xs text-red-500">{error}</p>
      ) : documents.length === 0 ? (
        <p className="text-xs text-gray-400 py-2 text-center">No documents attached.</p>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-start justify-between gap-2 rounded-lg border border-gray-100 p-3 hover:bg-gray-50 group"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-800 truncate max-w-[200px]">
                    {doc.file_name}
                  </span>
                  {doc.document_type_name && (
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{ backgroundColor: "#e8f5f7", color: "#1F7A8C" }}
                    >
                      {doc.document_type_name}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatBytes(doc.file_size)} · {doc.uploaded_by_name ?? "Unknown"} · {formatDate(doc.created_at)}
                </p>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded px-2 py-1 text-xs font-medium hover:bg-gray-100"
                  style={{ color: "#1F7A8C" }}
                >
                  Download
                </a>

                {canModify && (
                  <>
                    {confirmDeleteId === doc.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDeleteConfirm(doc.id)}
                          disabled={deletingId === doc.id}
                          className="rounded px-2 py-1 text-xs font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50"
                        >
                          {deletingId === doc.id ? "..." : "Yes"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(doc.id)}
                        className="rounded px-2 py-1 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Delete
                      </button>
                    )}
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
