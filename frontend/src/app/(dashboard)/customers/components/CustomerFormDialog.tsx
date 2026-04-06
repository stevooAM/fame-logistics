"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api";
import type { Customer, TinCheckResponse } from "@/types/customer";
import { TinWarningDialog } from "./TinWarningDialog";

// ---------------------------------------------------------------------------
// Dropdown types
// ---------------------------------------------------------------------------

interface DropdownOption {
  id: number;
  name: string;
  code?: string;
}

interface DropdownsResponse {
  ports: DropdownOption[];
  currencies: DropdownOption[];
}

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const customerFormSchema = z.object({
  company_name: z.string().min(1, "Company name is required").max(200),
  customer_type: z.enum(["Company", "Individual"], {
    required_error: "Customer type is required",
  }),
  tin: z
    .string()
    .min(1, "TIN is required")
    .max(50)
    .refine(
      (val) => /^(C|P|G|Q|GHA|EUROPE)[\w\d-]*/i.test(val),
      { message: "TIN must start with C, P, G, Q, GHA, or EUROPE" }
    ),
  contact_person: z.string().max(150).optional().or(z.literal("")),
  phone: z
    .string()
    .max(50)
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || /^(\+?\d{1,4}[-\s]?)?\d{6,14}$/.test(val),
      { message: "Enter a valid phone number" }
    ),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  business_type: z.string().max(50).optional().or(z.literal("")),
  preferred_port: z.number().nullable().optional(),
  currency_preference: z.number().nullable().optional(),
  credit_terms: z.string().max(50).optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

// ---------------------------------------------------------------------------
// Helper: FieldGroup
// ---------------------------------------------------------------------------

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
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
  return <p className="mt-1 text-xs" style={{ color: "#ef4444" }}>{message}</p>;
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

interface CustomerFormDialogProps {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
  onSuccess: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CustomerFormDialog({
  open,
  onClose,
  customer,
  onSuccess,
}: CustomerFormDialogProps) {
  const isEdit = customer !== null;

  const [ports, setPorts] = useState<DropdownOption[]>([]);
  const [currencies, setCurrencies] = useState<DropdownOption[]>([]);
  const [dropdownsLoading, setDropdownsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // TIN warning state
  const [tinWarningOpen, setTinWarningOpen] = useState(false);
  const [tinWarningCustomer, setTinWarningCustomer] = useState<string>("");
  const [pendingSubmitValues, setPendingSubmitValues] = useState<CustomerFormValues | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      company_name: "",
      customer_type: "Company",
      tin: "",
      contact_person: "",
      phone: "",
      email: "",
      address: "",
      business_type: "",
      preferred_port: null,
      currency_preference: null,
      credit_terms: "",
      notes: "",
    },
  });

  const watchedPort = watch("preferred_port");
  const watchedCurrency = watch("currency_preference");
  const watchedType = watch("customer_type");

  // Load dropdowns when dialog opens
  useEffect(() => {
    if (!open) return;
    setDropdownsLoading(true);
    apiFetch<DropdownsResponse>("/api/setup/dropdowns/")
      .then((data) => {
        setPorts(data.ports ?? []);
        setCurrencies(data.currencies ?? []);
      })
      .catch(() => {
        setPorts([]);
        setCurrencies([]);
      })
      .finally(() => setDropdownsLoading(false));
  }, [open]);

  // Populate / reset form when dialog opens
  useEffect(() => {
    if (!open) return;

    if (isEdit && customer) {
      reset({
        company_name: customer.company_name,
        customer_type: customer.customer_type,
        tin: customer.tin,
        contact_person: customer.contact_person ?? "",
        phone: customer.phone ?? "",
        email: customer.email ?? "",
        address: customer.address ?? "",
        business_type: customer.business_type ?? "",
        preferred_port: customer.preferred_port ?? null,
        currency_preference: customer.currency_preference ?? null,
        credit_terms: customer.credit_terms ?? "",
        notes: customer.notes ?? "",
      });
    } else {
      reset({
        company_name: "",
        customer_type: "Company",
        tin: "",
        contact_person: "",
        phone: "",
        email: "",
        address: "",
        business_type: "",
        preferred_port: null,
        currency_preference: null,
        credit_terms: "",
        notes: "",
      });
    }
    setApiError(null);
    setTinWarningOpen(false);
    setPendingSubmitValues(null);
  }, [open, isEdit, customer, reset]);

  // ---------------------------------------------------------------------------
  // Save (called after TIN check passes or user proceeds through warning)
  // ---------------------------------------------------------------------------

  async function performSave(values: CustomerFormValues) {
    setSubmitting(true);
    setApiError(null);

    const payload = {
      company_name: values.company_name,
      customer_type: values.customer_type,
      tin: values.tin,
      contact_person: values.contact_person || "",
      phone: values.phone || "",
      email: values.email || "",
      address: values.address || "",
      business_type: values.business_type || "",
      preferred_port: values.preferred_port ?? null,
      currency_preference: values.currency_preference ?? null,
      credit_terms: values.credit_terms || "",
      notes: values.notes || "",
    };

    try {
      if (isEdit && customer) {
        await apiFetch<Customer>(`/api/customers/${customer.id}/`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch<Customer>("/api/customers/", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const data = err.data as Record<string, unknown>;
        const firstKey = Object.keys(data)[0];
        if (firstKey) {
          const msg = data[firstKey];
          setApiError(Array.isArray(msg) ? String(msg[0]) : String(msg));
        } else {
          setApiError("An error occurred. Please try again.");
        }
      } else {
        setApiError("An error occurred. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Submit handler — TIN check first
  // ---------------------------------------------------------------------------

  async function onSubmit(values: CustomerFormValues) {
    setApiError(null);

    // TIN duplicate check
    try {
      const params = new URLSearchParams({ tin: values.tin });
      if (isEdit && customer) {
        params.set("exclude_id", String(customer.id));
      }
      const check = await apiFetch<TinCheckResponse>(
        `/api/customers/check-tin/?${params.toString()}`
      );

      if (check.duplicate && check.existing_customer) {
        // Store values and show warning
        setPendingSubmitValues(values);
        setTinWarningCustomer(check.existing_customer.company_name);
        setTinWarningOpen(true);
        return;
      }
    } catch {
      // TIN check failure: proceed without blocking (non-critical)
    }

    await performSave(values);
  }

  // ---------------------------------------------------------------------------
  // Proceed through TIN warning
  // ---------------------------------------------------------------------------

  async function handleTinProceed() {
    setTinWarningOpen(false);
    if (pendingSubmitValues) {
      await performSave(pendingSubmitValues);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      <TinWarningDialog
        open={tinWarningOpen}
        onClose={() => setTinWarningOpen(false)}
        onProceed={handleTinProceed}
        existingCustomerName={tinWarningCustomer}
      />

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
                {isEdit ? "Edit Customer" : "Add Customer"}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-0.5">
                {isEdit
                  ? "Update the customer's details below."
                  : "Fill in the details to create a new customer record."}
              </DialogDescription>
            </div>
            <DialogClose className="rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#1F7A8C] ml-4 mt-0.5">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-gray-500">
                <path d="M12.854 3.146a.5.5 0 0 1 0 .708l-9 9a.5.5 0 0 1-.708-.708l9-9a.5.5 0 0 1 .708 0z" />
                <path d="M3.146 3.146a.5.5 0 0 0 0 .708l9 9a.5.5 0 0 0 .708-.708l-9-9a.5.5 0 0 0-.708 0z" />
              </svg>
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>

          {/* Body */}
          <form
            id="customer-form"
            onSubmit={handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto px-6 py-5 space-y-6"
          >
            {/* Identity */}
            <FieldGroup label="Identity">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Company Name <span style={{ color: "#1F7A8C" }}>*</span>
                </label>
                <input
                  {...register("company_name")}
                  placeholder="e.g. Acme Freight Ltd"
                  className={inputStyle(!!errors.company_name)}
                />
                <FieldError message={errors.company_name?.message} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Customer Type <span style={{ color: "#1F7A8C" }}>*</span>
                  </label>
                  <select
                    value={watchedType ?? "Company"}
                    onChange={(e) =>
                      setValue("customer_type", e.target.value as "Company" | "Individual", {
                        shouldValidate: true,
                      })
                    }
                    className={inputStyle(!!errors.customer_type)}
                  >
                    <option value="Company">Company</option>
                    <option value="Individual">Individual</option>
                  </select>
                  <FieldError message={errors.customer_type?.message} />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    TIN <span style={{ color: "#1F7A8C" }}>*</span>
                  </label>
                  <input
                    {...register("tin")}
                    placeholder="e.g. C0012345678"
                    className={inputStyle(!!errors.tin)}
                  />
                  <FieldError message={errors.tin?.message} />
                </div>
              </div>
            </FieldGroup>

            {/* Contact */}
            <FieldGroup label="Contact">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Contact Person
                  </label>
                  <input
                    {...register("contact_person")}
                    placeholder="Full name"
                    className={inputStyle(!!errors.contact_person)}
                  />
                  <FieldError message={errors.contact_person?.message} />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Phone
                  </label>
                  <input
                    {...register("phone")}
                    placeholder="+233 20 000 0000"
                    className={inputStyle(!!errors.phone)}
                  />
                  <FieldError message={errors.phone?.message} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Email
                </label>
                <input
                  {...register("email")}
                  type="email"
                  placeholder="contact@example.com"
                  className={inputStyle(!!errors.email)}
                />
                <FieldError message={errors.email?.message} />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Address
                </label>
                <textarea
                  {...register("address")}
                  placeholder="Street, city, region"
                  rows={2}
                  className={`${inputStyle(!!errors.address)} h-auto py-2 resize-none`}
                />
                <FieldError message={errors.address?.message} />
              </div>
            </FieldGroup>

            {/* Commercial */}
            <FieldGroup label="Commercial">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Business Type
                  </label>
                  <input
                    {...register("business_type")}
                    placeholder="e.g. Importer, Exporter"
                    className={inputStyle(!!errors.business_type)}
                  />
                  <FieldError message={errors.business_type?.message} />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Credit Terms
                  </label>
                  <input
                    {...register("credit_terms")}
                    placeholder="e.g. Net 30"
                    className={inputStyle(!!errors.credit_terms)}
                  />
                  <FieldError message={errors.credit_terms?.message} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Preferred Port
                  </label>
                  <select
                    value={watchedPort ?? ""}
                    onChange={(e) =>
                      setValue(
                        "preferred_port",
                        e.target.value ? Number(e.target.value) : null,
                        { shouldValidate: true }
                      )
                    }
                    className={inputStyle(!!errors.preferred_port)}
                    disabled={dropdownsLoading}
                  >
                    <option value="">
                      {dropdownsLoading ? "Loading..." : "Select port"}
                    </option>
                    {ports.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <FieldError message={errors.preferred_port?.message} />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Currency
                  </label>
                  <select
                    value={watchedCurrency ?? ""}
                    onChange={(e) =>
                      setValue(
                        "currency_preference",
                        e.target.value ? Number(e.target.value) : null,
                        { shouldValidate: true }
                      )
                    }
                    className={inputStyle(!!errors.currency_preference)}
                    disabled={dropdownsLoading}
                  >
                    <option value="">
                      {dropdownsLoading ? "Loading..." : "Select currency"}
                    </option>
                    {currencies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code ? `${c.code} – ${c.name}` : c.name}
                      </option>
                    ))}
                  </select>
                  <FieldError message={errors.currency_preference?.message} />
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
              <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#fca5a5", backgroundColor: "#fef2f2", color: "#dc2626" }}>
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
              form="customer-form"
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
                : "Add Customer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
