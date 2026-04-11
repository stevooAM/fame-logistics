"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api";
import type { Job } from "@/types/job";
import type { UserProfile, PaginatedResponse } from "@/types/user";
import { CustomerPicker } from "./CustomerPicker";

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const jobFormSchema = z.object({
  customer: z
    .number({ required_error: "Customer is required", invalid_type_error: "Customer is required" })
    .int()
    .positive("Customer is required"),
  job_type: z.enum(["IMPORT", "EXPORT", "TRANSIT", "LOCAL"], {
    required_error: "Job type is required",
  }),
  origin: z.string().max(200).optional().or(z.literal("")),
  destination: z.string().max(200).optional().or(z.literal("")),
  cargo_description: z.string().min(1, "Cargo description is required"),
  bill_of_lading: z.string().min(1, "Bill of lading is required"),
  container_number: z.string().min(1, "Container number is required"),
  weight_kg: z
    .string()
    .min(1, "Weight is required")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
      message: "Weight must be a positive number",
    }),
  volume_cbm: z
    .string()
    .min(1, "Volume is required")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
      message: "Volume must be a positive number",
    }),
  total_cost: z
    .string()
    .min(1, "Total cost is required")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, {
      message: "Total cost must be a non-negative number",
    }),
  notes: z.string().optional().or(z.literal("")),
  eta: z.string().optional().or(z.literal("")),
  delivery_date: z.string().optional().or(z.literal("")),
  assigned_to: z.number().nullable().optional(),
});

type JobFormValues = z.infer<typeof jobFormSchema>;

// ---------------------------------------------------------------------------
// Helper: FieldGroup (matches CustomerFormDialog pattern)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Helper: FieldError
// ---------------------------------------------------------------------------

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-xs" style={{ color: "#ef4444" }}>
      {message}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Input class
// ---------------------------------------------------------------------------

const inputClass =
  "h-9 w-full text-sm border rounded-lg px-3 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 placeholder:text-gray-300";

function inputStyle(hasError: boolean) {
  return hasError
    ? `${inputClass} border-red-400 focus:ring-red-300`
    : `${inputClass} border-gray-200 focus:ring-[#1F7A8C]`;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface JobFormDialogProps {
  open: boolean;
  onClose: () => void;
  job?: Job | null;
  onSuccess: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function JobFormDialog({
  open,
  onClose,
  job,
  onSuccess,
}: JobFormDialogProps) {
  const isEdit = !!job;

  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    setError,
    formState: { errors },
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      customer: undefined,
      job_type: "IMPORT",
      origin: "",
      destination: "",
      cargo_description: "",
      bill_of_lading: "",
      container_number: "",
      weight_kg: "",
      volume_cbm: "",
      total_cost: "",
      notes: "",
      eta: "",
      delivery_date: "",
      assigned_to: null,
    },
  });

  const watchedJobType = watch("job_type");
  const watchedAssignedTo = watch("assigned_to");

  // Load staff users when dialog opens
  useEffect(() => {
    if (!open) return;
    setUsersLoading(true);
    apiFetch<PaginatedResponse<UserProfile>>("/api/users/?page_size=100")
      .then((data) => setUsers(data.results ?? []))
      .catch(() => setUsers([]))
      .finally(() => setUsersLoading(false));
  }, [open]);

  // Populate / reset form when dialog opens
  useEffect(() => {
    if (!open) return;

    if (isEdit && job) {
      reset({
        customer: job.customer,
        job_type: job.job_type,
        origin: job.origin ?? "",
        destination: job.destination ?? "",
        cargo_description: job.cargo_description ?? "",
        bill_of_lading: job.bill_of_lading ?? "",
        container_number: job.container_number ?? "",
        weight_kg: job.weight_kg ?? "",
        volume_cbm: job.volume_cbm ?? "",
        total_cost: job.total_cost ?? "",
        notes: job.notes ?? "",
        eta: job.eta ?? "",
        delivery_date: job.delivery_date ?? "",
        assigned_to: job.assigned_to ?? null,
      });
    } else {
      reset({
        customer: undefined,
        job_type: "IMPORT",
        origin: "",
        destination: "",
        cargo_description: "",
        bill_of_lading: "",
        container_number: "",
        weight_kg: "",
        volume_cbm: "",
        total_cost: "",
        notes: "",
        eta: "",
        delivery_date: "",
        assigned_to: null,
      });
    }
    setApiError(null);
  }, [open, isEdit, job, reset]);

  // ---------------------------------------------------------------------------
  // Submit handler
  // ---------------------------------------------------------------------------

  async function onSubmit(values: JobFormValues) {
    setSubmitting(true);
    setApiError(null);

    const payload = {
      customer: values.customer,
      job_type: values.job_type,
      origin: values.origin || "",
      destination: values.destination || "",
      cargo_description: values.cargo_description,
      bill_of_lading: values.bill_of_lading,
      container_number: values.container_number,
      weight_kg: parseFloat(values.weight_kg),
      volume_cbm: parseFloat(values.volume_cbm),
      total_cost: parseFloat(values.total_cost),
      notes: values.notes || "",
      eta: values.eta || null,
      delivery_date: values.delivery_date || null,
      assigned_to: values.assigned_to ?? null,
    };

    try {
      if (isEdit && job) {
        await apiFetch<Job>(`/api/jobs/${job.id}/`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch<Job>("/api/jobs/", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const data = err.data as Record<string, unknown>;

        // Map DRF field errors onto form fields
        const fieldMap: Record<string, keyof JobFormValues> = {
          customer: "customer",
          job_type: "job_type",
          origin: "origin",
          destination: "destination",
          cargo_description: "cargo_description",
          bill_of_lading: "bill_of_lading",
          container_number: "container_number",
          weight_kg: "weight_kg",
          volume_cbm: "volume_cbm",
          total_cost: "total_cost",
          notes: "notes",
          eta: "eta",
          delivery_date: "delivery_date",
          assigned_to: "assigned_to",
        };

        let hasFieldError = false;
        for (const [apiKey, formKey] of Object.entries(fieldMap)) {
          if (data[apiKey]) {
            const msg = data[apiKey];
            setError(formKey, {
              message: Array.isArray(msg) ? String(msg[0]) : String(msg),
            });
            hasFieldError = true;
          }
        }

        if (!hasFieldError) {
          const firstKey = Object.keys(data)[0];
          if (firstKey) {
            const msg = data[firstKey];
            setApiError(Array.isArray(msg) ? String(msg[0]) : String(msg));
          } else {
            setApiError("An error occurred. Please try again.");
          }
        }
      } else {
        setApiError("An error occurred. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-0"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {/* Teal top rail */}
        <div
          className="h-1 flex-shrink-0 w-full"
          style={{ background: "linear-gradient(to right, #1F7A8C, #2ab8d4)" }}
        />

        {/* Header */}
        <div className="px-6 py-4 border-b flex items-start justify-between flex-shrink-0">
          <div>
            <DialogTitle className="text-base font-semibold text-[#2B3E50]">
              {isEdit ? `Edit Job ${job.job_number}` : "Create New Job"}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 mt-0.5">
              {isEdit
                ? "Update the job details below."
                : "Fill in the details to create a new freight job."}
            </DialogDescription>
          </div>
          <DialogClose className="rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#1F7A8C] ml-4 mt-0.5">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="text-gray-500"
            >
              <path d="M12.854 3.146a.5.5 0 0 1 0 .708l-9 9a.5.5 0 0 1-.708-.708l9-9a.5.5 0 0 1 .708 0z" />
              <path d="M3.146 3.146a.5.5 0 0 0 0 .708l9 9a.5.5 0 0 0 .708-.708l-9-9a.5.5 0 0 0-.708 0z" />
            </svg>
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {/* Body */}
        <form
          id="job-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-6"
        >
          {/* Job Information */}
          <FieldGroup label="Job Information">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Job Type <span style={{ color: "#1F7A8C" }}>*</span>
                </label>
                <select
                  value={watchedJobType ?? "IMPORT"}
                  onChange={(e) =>
                    setValue(
                      "job_type",
                      e.target.value as "IMPORT" | "EXPORT" | "TRANSIT" | "LOCAL",
                      { shouldValidate: true }
                    )
                  }
                  className={inputStyle(!!errors.job_type)}
                >
                  <option value="IMPORT">Import</option>
                  <option value="EXPORT">Export</option>
                  <option value="TRANSIT">Transit</option>
                  <option value="LOCAL">Local</option>
                </select>
                <FieldError message={errors.job_type?.message} />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Assigned Staff
                </label>
                <select
                  value={watchedAssignedTo ?? ""}
                  onChange={(e) =>
                    setValue(
                      "assigned_to",
                      e.target.value ? Number(e.target.value) : null,
                      { shouldValidate: true }
                    )
                  }
                  className={inputStyle(!!errors.assigned_to)}
                  disabled={usersLoading}
                >
                  <option value="">
                    {usersLoading ? "Loading..." : "Unassigned"}
                  </option>
                  {users.map((u) => {
                    const label =
                      u.first_name || u.last_name
                        ? `${u.first_name} ${u.last_name}`.trim()
                        : u.username;
                    return (
                      <option key={u.id} value={u.id}>
                        {label}
                      </option>
                    );
                  })}
                </select>
                <FieldError message={errors.assigned_to?.message} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Customer <span style={{ color: "#1F7A8C" }}>*</span>
              </label>
              <Controller
                name="customer"
                control={control}
                render={({ field }) => (
                  <CustomerPicker
                    value={field.value ?? null}
                    onChange={(id) =>
                      setValue("customer", id as number, { shouldValidate: true })
                    }
                    error={errors.customer?.message}
                  />
                )}
              />
            </div>
          </FieldGroup>

          {/* Shipment Details */}
          <FieldGroup label="Shipment Details">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Origin
                </label>
                <input
                  {...register("origin")}
                  placeholder="e.g. Shanghai, China"
                  className={inputStyle(!!errors.origin)}
                />
                <FieldError message={errors.origin?.message} />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Destination
                </label>
                <input
                  {...register("destination")}
                  placeholder="e.g. Tema Port, Ghana"
                  className={inputStyle(!!errors.destination)}
                />
                <FieldError message={errors.destination?.message} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Cargo Description <span style={{ color: "#1F7A8C" }}>*</span>
              </label>
              <textarea
                {...register("cargo_description")}
                placeholder="Describe the cargo contents..."
                rows={2}
                className={`${inputStyle(!!errors.cargo_description)} h-auto py-2 resize-none`}
              />
              <FieldError message={errors.cargo_description?.message} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Bill of Lading <span style={{ color: "#1F7A8C" }}>*</span>
                </label>
                <input
                  {...register("bill_of_lading")}
                  placeholder="e.g. MAEU1234567"
                  className={inputStyle(!!errors.bill_of_lading)}
                />
                <FieldError message={errors.bill_of_lading?.message} />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Container Number <span style={{ color: "#1F7A8C" }}>*</span>
                </label>
                <input
                  {...register("container_number")}
                  placeholder="e.g. MSCU1234567"
                  className={inputStyle(!!errors.container_number)}
                />
                <FieldError message={errors.container_number?.message} />
              </div>
            </div>
          </FieldGroup>

          {/* Measurements & Cost */}
          <FieldGroup label="Measurements & Cost">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Weight (kg) <span style={{ color: "#1F7A8C" }}>*</span>
                </label>
                <input
                  {...register("weight_kg")}
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g. 1500.000"
                  className={inputStyle(!!errors.weight_kg)}
                />
                <FieldError message={errors.weight_kg?.message} />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Volume (CBM) <span style={{ color: "#1F7A8C" }}>*</span>
                </label>
                <input
                  {...register("volume_cbm")}
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g. 25.500"
                  className={inputStyle(!!errors.volume_cbm)}
                />
                <FieldError message={errors.volume_cbm?.message} />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Total Cost <span style={{ color: "#1F7A8C" }}>*</span>
                </label>
                <input
                  {...register("total_cost")}
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g. 4500.00"
                  className={inputStyle(!!errors.total_cost)}
                />
                <FieldError message={errors.total_cost?.message} />
              </div>
            </div>
          </FieldGroup>

          {/* Schedule */}
          <FieldGroup label="Schedule">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  ETA
                </label>
                <input
                  {...register("eta")}
                  type="date"
                  className={inputStyle(!!errors.eta)}
                />
                <FieldError message={errors.eta?.message} />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Delivery Date
                </label>
                <input
                  {...register("delivery_date")}
                  type="date"
                  className={inputStyle(!!errors.delivery_date)}
                />
                <FieldError message={errors.delivery_date?.message} />
              </div>
            </div>
          </FieldGroup>

          {/* Notes */}
          <FieldGroup label="Notes">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Notes
              </label>
              <textarea
                {...register("notes")}
                placeholder="Any additional information..."
                rows={3}
                className={`${inputStyle(!!errors.notes)} h-auto py-2 resize-none`}
              />
              <FieldError message={errors.notes?.message} />
            </div>
          </FieldGroup>

          {/* API error banner */}
          {apiError && (
            <div
              className="rounded-lg border px-3 py-2 text-sm"
              style={{
                borderColor: "#fca5a5",
                backgroundColor: "#fef2f2",
                color: "#dc2626",
              }}
            >
              {apiError}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-3 flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="job-form"
            disabled={submitting}
            className="text-white hover:opacity-90"
            style={{ backgroundColor: "#1F7A8C" }}
          >
            {submitting
              ? isEdit
                ? "Saving..."
                : "Creating..."
              : isEdit
              ? "Save Changes"
              : "Create Job"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
