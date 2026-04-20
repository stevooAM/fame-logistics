"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { generateInvoice, fetchApprovedJobs } from "@/lib/accounts-api";
import { ApiError } from "@/lib/api";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const schema = z
  .object({
    job_id: z.number({ required_error: "Job is required", invalid_type_error: "Job is required" }),
    amount: z
      .string()
      .min(1, "Amount is required")
      .regex(/^\d+(\.\d{1,2})?$/, "Amount must be a positive decimal (e.g. 1200.00)"),
    currency_id: z.number().nullable().optional(),
    issue_date: z.string().min(1, "Issue date is required"),
    due_date: z.string().min(1, "Due date is required"),
    notes: z.string().optional(),
  })
  .refine((d) => !d.issue_date || !d.due_date || d.due_date >= d.issue_date, {
    message: "Due date must be on or after issue date",
    path: ["due_date"],
  });

type FormValues = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const inputClass =
  "h-9 w-full text-sm border rounded-lg px-3 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 placeholder:text-gray-300";

function inputStyle(hasError: boolean) {
  return hasError
    ? `${inputClass} border-red-400 focus:ring-red-300`
    : `${inputClass} border-gray-200 focus:ring-[#1F7A8C]`;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-500">{message}</p>;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface GenerateInvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ApprovedJob {
  id: number;
  job_number: string;
  customer_name: string | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GenerateInvoiceDialog({ open, onClose, onSuccess }: GenerateInvoiceDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Job picker state
  const [jobSearch, setJobSearch] = useState("");
  const [jobOptions, setJobOptions] = useState<ApprovedJob[]>([]);
  const [jobLoading, setJobLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<ApprovedJob | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const jobDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      job_id: undefined,
      amount: "",
      currency_id: null,
      issue_date: today(),
      due_date: "",
      notes: "",
    },
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (!open) return;
    reset({
      job_id: undefined,
      amount: "",
      currency_id: null,
      issue_date: today(),
      due_date: "",
      notes: "",
    });
    setApiError(null);
    setSelectedJob(null);
    setJobSearch("");
    setJobOptions([]);
    setPickerOpen(false);
  }, [open, reset]);

  // Load job options with debounce
  useEffect(() => {
    if (!open) return;
    if (jobDebounceRef.current) clearTimeout(jobDebounceRef.current);
    jobDebounceRef.current = setTimeout(async () => {
      setJobLoading(true);
      try {
        const jobs = await fetchApprovedJobs(jobSearch);
        setJobOptions(jobs);
      } catch {
        setJobOptions([]);
      } finally {
        setJobLoading(false);
      }
    }, 300);
  }, [jobSearch, open]);

  // Close picker on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    if (pickerOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [pickerOpen]);

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  async function onSubmit(data: FormValues) {
    setSubmitting(true);
    setApiError(null);
    try {
      await generateInvoice({
        job_id: data.job_id,
        amount: data.amount,
        currency_id: data.currency_id ?? undefined,
        issue_date: data.issue_date,
        due_date: data.due_date,
        notes: data.notes || undefined,
      });
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        const d = err.data as Record<string, unknown>;
        const fieldMap: Record<string, keyof FormValues> = {
          job_id: "job_id",
          amount: "amount",
          due_date: "due_date",
          issue_date: "issue_date",
          notes: "notes",
        };
        let mapped = false;
        for (const [apiKey, formKey] of Object.entries(fieldMap)) {
          if (d[apiKey]) {
            const msg = d[apiKey];
            setError(formKey, {
              message: Array.isArray(msg) ? String(msg[0]) : String(msg),
            });
            mapped = true;
          }
        }
        if (!mapped) {
          const detail = (d as { detail?: unknown }).detail;
          if (detail) {
            setApiError(String(detail));
          } else {
            const firstKey = Object.keys(d)[0];
            if (firstKey) {
              const msg = d[firstKey];
              setApiError(Array.isArray(msg) ? String(msg[0]) : String(msg));
            } else {
              setApiError("Failed to generate invoice. Please try again.");
            }
          }
        }
      } else {
        setApiError("Failed to generate invoice. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {/* Teal top rail */}
        <div
          className="h-1 flex-shrink-0 w-full rounded-t-lg"
          style={{ background: "linear-gradient(to right, #1F7A8C, #2ab8d4)" }}
        />

        {/* Header */}
        <div className="px-6 py-4 border-b flex-shrink-0">
          <h2 className="text-base font-semibold text-[#2B3E50]">Generate Invoice</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Select an approved job and enter the invoice details.
          </p>
        </div>

        {/* Body */}
        <form
          id="generate-invoice-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-4"
        >
          {/* Job picker */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Job <span className="text-[#1F7A8C]">*</span>
            </label>
            {selectedJob ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-[#e5f4f6] text-[#1F7A8C] font-medium">
                  {selectedJob.job_number}
                  {selectedJob.customer_name ? ` — ${selectedJob.customer_name}` : ""}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedJob(null);
                      setValue("job_id", undefined as unknown as number, { shouldValidate: false });
                      setJobSearch("");
                    }}
                    className="ml-1 text-[#1F7A8C] hover:text-[#155f6e]"
                    aria-label="Remove selected job"
                  >
                    &times;
                  </button>
                </span>
              </div>
            ) : (
              <div className="relative" ref={pickerRef}>
                <input
                  type="text"
                  placeholder="Search by job number or customer..."
                  value={jobSearch}
                  onChange={(e) => {
                    setJobSearch(e.target.value);
                    setPickerOpen(true);
                  }}
                  onFocus={() => setPickerOpen(true)}
                  className={inputStyle(!!errors.job_id)}
                />
                {pickerOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {jobLoading ? (
                      <div className="px-3 py-2 text-sm text-gray-400">Loading...</div>
                    ) : jobOptions.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-400">
                        No approved jobs found.
                      </div>
                    ) : (
                      jobOptions.map((job) => (
                        <button
                          key={job.id}
                          type="button"
                          onClick={() => {
                            setSelectedJob(job);
                            setValue("job_id", job.id, { shouldValidate: true });
                            setPickerOpen(false);
                            setJobSearch("");
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-[#e5f4f6] hover:text-[#1F7A8C] transition-colors"
                        >
                          <span className="font-medium">{job.job_number}</span>
                          {job.customer_name && (
                            <span className="text-gray-500 ml-2">— {job.customer_name}</span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
            <FieldError message={errors.job_id?.message} />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Amount <span className="text-[#1F7A8C]">*</span>
            </label>
            <input
              {...register("amount")}
              type="text"
              inputMode="decimal"
              placeholder="e.g. 1200.00"
              className={inputStyle(!!errors.amount)}
            />
            <FieldError message={errors.amount?.message} />
          </div>

          {/* Issue Date + Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Issue Date <span className="text-[#1F7A8C]">*</span>
              </label>
              <input
                {...register("issue_date")}
                type="date"
                className={inputStyle(!!errors.issue_date)}
              />
              <FieldError message={errors.issue_date?.message} />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Due Date <span className="text-[#1F7A8C]">*</span>
              </label>
              <input
                {...register("due_date")}
                type="date"
                className={inputStyle(!!errors.due_date)}
              />
              <FieldError message={errors.due_date?.message} />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea
              {...register("notes")}
              placeholder="Optional notes..."
              rows={3}
              className={`${inputStyle(!!errors.notes)} h-auto py-2 resize-none`}
            />
            <FieldError message={errors.notes?.message} />
          </div>

          {/* API error banner */}
          {apiError && (
            <div className="rounded-lg border px-3 py-2 text-sm border-red-200 bg-red-50 text-red-600">
              {apiError}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="generate-invoice-form"
            disabled={submitting}
            className="px-4 py-2 text-sm text-white rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
            style={{ backgroundColor: "#1F7A8C" }}
          >
            {submitting ? "Generating..." : "Generate Invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}
