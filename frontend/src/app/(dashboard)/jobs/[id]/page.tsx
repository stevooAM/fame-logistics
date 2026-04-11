"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import type { Job } from "@/types/job";
import { JobDetailHeader } from "./components/JobDetailHeader";
import { StatusTransitionDropdown } from "./components/StatusTransitionDropdown";
import { DocumentPanel } from "./components/DocumentPanel";
import { AuditTrailTimeline } from "./components/AuditTrailTimeline";
import { JobFormDialog } from "../components/JobFormDialog";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const inputClass =
  "h-9 w-full text-sm border border-gray-200 rounded-lg px-3 bg-gray-50 text-gray-700 cursor-default select-all";

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span
          className="text-[10px] font-semibold tracking-widest uppercase"
          style={{ color: "#1F7A8C", fontFamily: "'DM Sans', sans-serif" }}
        >
          {label}
        </span>
        <div className="flex-1 h-px" style={{ background: "#e5f4f6" }} />
      </div>
      {children}
    </div>
  );
}

function ReadField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <div className={inputClass}>{value ?? <span className="text-gray-300">—</span>}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div
      className="p-6 space-y-6 animate-pulse"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="space-y-2">
        <div className="h-4 w-28 rounded bg-gray-200" />
        <div className="h-8 w-56 rounded bg-gray-200" />
        <div className="h-4 w-40 rounded bg-gray-200" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-gray-100 bg-white shadow-sm h-36" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-gray-100 bg-white shadow-sm h-32" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function JobDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { user } = useAuth();
  const userRole = user?.role?.name ?? "operations";

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // ---------------------------------------------------------------------------
  // Fetch job
  // ---------------------------------------------------------------------------

  const fetchJob = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const data = await apiFetch<Job>(`/api/jobs/${id}/`);
      setJob(data);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  // ---------------------------------------------------------------------------
  // Callbacks
  // ---------------------------------------------------------------------------

  const handleStatusChange = useCallback((updated: Job) => {
    setJob(updated);
  }, []);

  const handleEditSuccess = useCallback(() => {
    setEditOpen(false);
    fetchJob();
  }, [fetchJob]);

  // ---------------------------------------------------------------------------
  // Render states
  // ---------------------------------------------------------------------------

  if (loading) return <LoadingSkeleton />;

  if (notFound || !job) {
    return (
      <div className="p-6 space-y-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
          style={{ color: "#1F7A8C" }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z" />
          </svg>
          Back to Jobs
        </Link>
        <p className="text-sm text-gray-500">Job not found.</p>
      </div>
    );
  }

  const canEdit = userRole.toLowerCase() === "admin" || userRole.toLowerCase() === "operations";

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <div className="p-6 space-y-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <JobDetailHeader job={job} />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ---------------------------------------------------------------- */}
        {/* LEFT — field detail sections                                      */}
        {/* ---------------------------------------------------------------- */}
        <div className="lg:col-span-2 space-y-4">
          {/* Edit button */}
          {canEdit && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1F7A8C]"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-gray-400">
                  <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
                </svg>
                Edit Job
              </button>
            </div>
          )}

          {/* Shipment Details */}
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-5 space-y-4">
            <FieldGroup label="Shipment Details">
              <div className="grid grid-cols-2 gap-3">
                <ReadField label="Origin" value={job.origin || null} />
                <ReadField label="Destination" value={job.destination || null} />
              </div>
              <ReadField label="Cargo Description" value={job.cargo_description || null} />
              <div className="grid grid-cols-2 gap-3">
                <ReadField label="Bill of Lading" value={job.bill_of_lading || null} />
                <ReadField label="Container Number" value={job.container_number || null} />
              </div>
            </FieldGroup>
          </div>

          {/* Measurements & Cost */}
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-5 space-y-4">
            <FieldGroup label="Measurements & Cost">
              <div className="grid grid-cols-3 gap-3">
                <ReadField
                  label="Weight (kg)"
                  value={job.weight_kg ? parseFloat(job.weight_kg).toLocaleString() : null}
                />
                <ReadField
                  label="Volume (CBM)"
                  value={job.volume_cbm ? parseFloat(job.volume_cbm).toLocaleString() : null}
                />
                <ReadField
                  label="Total Cost"
                  value={
                    job.total_cost
                      ? `GHS ${parseFloat(job.total_cost).toLocaleString("en-GB", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                      : null
                  }
                />
              </div>
            </FieldGroup>
          </div>

          {/* Schedule */}
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-5 space-y-4">
            <FieldGroup label="Schedule">
              <div className="grid grid-cols-2 gap-3">
                <ReadField
                  label="ETA"
                  value={
                    job.eta
                      ? new Date(job.eta).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : null
                  }
                />
                <ReadField
                  label="Delivery Date"
                  value={
                    job.delivery_date
                      ? new Date(job.delivery_date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : null
                  }
                />
              </div>
            </FieldGroup>
          </div>

          {/* Notes */}
          {job.notes && (
            <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-5 space-y-4">
              <FieldGroup label="Notes">
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {job.notes}
                </p>
              </FieldGroup>
            </div>
          )}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* RIGHT — status, documents, audit trail                           */}
        {/* ---------------------------------------------------------------- */}
        <div className="space-y-4">
          {/* Status card */}
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-4">
            <StatusTransitionDropdown
              job={job}
              userRole={userRole}
              onStatusChange={handleStatusChange}
            />
          </div>

          {/* Documents */}
          <DocumentPanel jobId={job.id} userRole={userRole} />

          {/* Audit trail */}
          <AuditTrailTimeline jobId={job.id} />
        </div>
      </div>

      {/* Edit dialog */}
      <JobFormDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        job={job}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
