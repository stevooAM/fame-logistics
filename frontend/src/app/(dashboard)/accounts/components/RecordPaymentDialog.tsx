"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { recordPayment } from "@/lib/accounts-api";
import { ApiError } from "@/lib/api";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const schema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .regex(/^\d+(\.\d{1,2})?$/, "Amount must be a positive decimal (e.g. 400.00)"),
  payment_date: z.string().min(1, "Payment date is required"),
  payment_method: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
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

interface RecordPaymentDialogProps {
  open: boolean;
  invoiceId: number;
  invoiceNumber: string;
  onClose: () => void;
  onSuccess: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RecordPaymentDialog({
  open,
  invoiceId,
  invoiceNumber,
  onClose,
  onSuccess,
}: RecordPaymentDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: "",
      payment_date: today(),
      payment_method: "",
      reference: "",
      notes: "",
    },
  });

  // Reset when dialog opens
  useEffect(() => {
    if (!open) return;
    reset({
      amount: "",
      payment_date: today(),
      payment_method: "",
      reference: "",
      notes: "",
    });
    setApiError(null);
  }, [open, reset]);

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  async function onSubmit(data: FormValues) {
    setSubmitting(true);
    setApiError(null);
    try {
      await recordPayment({
        invoice: invoiceId,
        amount: data.amount,
        payment_date: data.payment_date,
        payment_method: data.payment_method || undefined,
        reference: data.reference || undefined,
        notes: data.notes || undefined,
      });
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        const d = err.data as Record<string, unknown>;
        // Overpayment or amount validation — map to inline field error
        if (d.amount && Array.isArray(d.amount) && d.amount.length > 0) {
          setError("amount", { message: String((d.amount as string[])[0]) });
          return;
        }
        // Other field errors
        const fieldMap: Record<string, keyof FormValues> = {
          payment_date: "payment_date",
          payment_method: "payment_method",
          reference: "reference",
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
          setApiError(detail ? String(detail) : "Validation failed. Please check the fields.");
        }
      } else {
        setApiError("Failed to record payment. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 flex flex-col max-h-[90vh]"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {/* Teal top rail */}
        <div
          className="h-1 flex-shrink-0 w-full rounded-t-lg"
          style={{ background: "linear-gradient(to right, #1F7A8C, #2ab8d4)" }}
        />

        {/* Header */}
        <div className="px-6 py-4 border-b flex-shrink-0">
          <h2 className="text-base font-semibold text-[#2B3E50]">Record Payment</h2>
          <p className="text-xs text-gray-500 mt-0.5">Invoice {invoiceNumber}</p>
        </div>

        {/* Body */}
        <form
          id="record-payment-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-4"
        >
          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Amount <span className="text-[#1F7A8C]">*</span>
            </label>
            <input
              {...register("amount")}
              type="text"
              inputMode="decimal"
              placeholder="e.g. 400.00"
              className={inputStyle(!!errors.amount)}
            />
            <FieldError message={errors.amount?.message} />
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Payment Date <span className="text-[#1F7A8C]">*</span>
            </label>
            <input
              {...register("payment_date")}
              type="date"
              className={inputStyle(!!errors.payment_date)}
            />
            <FieldError message={errors.payment_date?.message} />
          </div>

          {/* Method */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Payment Method
            </label>
            <input
              {...register("payment_method")}
              type="text"
              placeholder="e.g. Bank Transfer, Cash, Cheque"
              className={inputStyle(!!errors.payment_method)}
            />
            <FieldError message={errors.payment_method?.message} />
          </div>

          {/* Reference */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Reference</label>
            <input
              {...register("reference")}
              type="text"
              placeholder="e.g. Transaction ID, Cheque No."
              className={inputStyle(!!errors.reference)}
            />
            <FieldError message={errors.reference?.message} />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea
              {...register("notes")}
              placeholder="Optional notes..."
              rows={2}
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
            form="record-payment-form"
            disabled={submitting}
            className="px-4 py-2 text-sm text-white rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
            style={{ backgroundColor: "#1F7A8C" }}
          >
            {submitting ? "Recording..." : "Record Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}
