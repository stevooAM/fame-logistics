"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import type { Customer } from "@/types/customer";

// ---------------------------------------------------------------------------
// Types
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
// Validation helpers (mirrors CustomerFormDialog rules)
// ---------------------------------------------------------------------------

function validatePhone(val: string): string | null {
  if (!val) return null;
  if (!/^(\+?\d{1,4}[-\s]?)?\d{6,14}$/.test(val))
    return "Enter a valid phone number";
  return null;
}

function validateTin(val: string): string | null {
  if (!val) return "TIN is required";
  if (!/^(C|P|G|Q|GHA|EUROPE)[\w\d-]*/i.test(val))
    return "TIN must start with C, P, G, Q, GHA, or EUROPE";
  return null;
}

// ---------------------------------------------------------------------------
// FieldGroup (same pattern as CustomerFormDialog)
// ---------------------------------------------------------------------------

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 mb-2">
        <span
          className="text-[10px] font-semibold tracking-widest uppercase"
          style={{ color: "#1F7A8C" }}
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
// InlineField — core inline-edit primitive
// ---------------------------------------------------------------------------

interface InlineFieldProps {
  label: string;
  value: string;
  readOnly?: boolean;
  isEditing: boolean;
  saving: boolean;
  error?: string;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  inputNode: React.ReactNode;
}

function InlineField({
  label,
  value,
  readOnly = false,
  isEditing,
  saving,
  error,
  onStartEdit,
  onSave,
  onCancel,
  inputNode,
}: InlineFieldProps) {
  return (
    <div
      className={`rounded-lg px-3 py-2.5 transition-colors ${
        !readOnly && !isEditing ? "cursor-pointer group hover:bg-[#f0f9fa]" : ""
      }`}
      onClick={!readOnly && !isEditing ? onStartEdit : undefined}
    >
      <span
        className="block text-[10px] font-semibold tracking-wider uppercase mb-0.5"
        style={{ color: "#8fa3b8" }}
      >
        {label}
      </span>

      {isEditing ? (
        <div onClick={(e) => e.stopPropagation()} className="space-y-1.5">
          {inputNode}
          {error && (
            <p className="text-xs" style={{ color: "#dc2626" }}>
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={onSave}
              disabled={saving}
              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: "#1F7A8C" }}
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Saving
                </>
              ) : (
                <>
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                  </svg>
                  Save
                </>
              )}
            </button>
            <button
              onClick={onCancel}
              disabled={saving}
              className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-60"
              style={{ borderColor: "#d1d5db" }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <span className={`text-sm ${value ? "text-gray-800" : "text-gray-400 italic"}`}>
            {value || "—"}
          </span>
          {!readOnly && (
            <svg
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="opacity-0 group-hover:opacity-40 text-gray-500 flex-shrink-0 ml-2 transition-opacity"
            >
              <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
            </svg>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared input classes (match CustomerFormDialog)
// ---------------------------------------------------------------------------

const inputCls =
  "h-8 w-full text-sm border rounded-md px-2.5 transition-all duration-150 " +
  "focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[#1F7A8C] " +
  "border-gray-200";

const selectCls =
  "h-8 w-full text-sm border rounded-md px-2.5 bg-white transition-all duration-150 " +
  "focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[#1F7A8C] " +
  "border-gray-200";

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface CustomerInfoPanelProps {
  customer: Customer;
  onUpdate: (updated: Customer) => void;
}

export function CustomerInfoPanel({ customer, onUpdate }: CustomerInfoPanelProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [savingField, setSavingField] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string>("");

  const [ports, setPorts] = useState<DropdownOption[]>([]);
  const [currencies, setCurrencies] = useState<DropdownOption[]>([]);
  const [dropdownsLoaded, setDropdownsLoaded] = useState(false);

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // Load dropdowns once on first use
  useEffect(() => {
    if (dropdownsLoaded) return;
    apiFetch<DropdownsResponse>("/api/setup/dropdowns/")
      .then((data) => {
        setPorts(data.ports ?? []);
        setCurrencies(data.currencies ?? []);
        setDropdownsLoaded(true);
      })
      .catch(() => {
        setDropdownsLoaded(true);
      });
  }, [dropdownsLoaded]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingField && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingField]);

  function startEdit(field: string, currentValue: string) {
    setEditingField(field);
    setEditValue(currentValue);
    setFieldError("");
  }

  function cancelEdit() {
    setEditingField(null);
    setEditValue("");
    setFieldError("");
  }

  async function saveField(field: string, value: string | number | null) {
    if (field === "tin") {
      const err = validateTin(String(value ?? ""));
      if (err) { setFieldError(err); return; }
    }
    if (field === "phone") {
      const err = validatePhone(String(value ?? ""));
      if (err) { setFieldError(err); return; }
    }
    if (field === "company_name" && !String(value ?? "").trim()) {
      setFieldError("Company name is required");
      return;
    }

    setSavingField(field);
    setFieldError("");
    try {
      const updated = await apiFetch<Customer>(`/api/customers/${customer.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ [field]: value }),
      });
      onUpdate(updated);
      setEditingField(null);
      setEditValue("");
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const data = err.data as Record<string, unknown>;
        const firstKey = Object.keys(data)[0];
        if (firstKey) {
          const msg = data[firstKey];
          setFieldError(Array.isArray(msg) ? String(msg[0]) : String(msg));
        } else {
          setFieldError("Save failed. Please try again.");
        }
      } else {
        setFieldError("Save failed. Please try again.");
      }
    } finally {
      setSavingField(null);
    }
  }

  function handleKeyDown(
    e: React.KeyboardEvent,
    field: string,
    value: string | number | null
  ) {
    if (e.key === "Enter" && field !== "address" && field !== "notes") {
      e.preventDefault();
      saveField(field, value);
    }
    if (e.key === "Escape") {
      cancelEdit();
    }
  }

  // Display values for FK fields
  const portName = customer.preferred_port_name ?? "";
  const currencyDisplay = customer.currency_preference_code ?? "";

  // Helper: text / textarea input
  function textInputNode(
    field: string,
    placeholder?: string,
    multiline?: boolean
  ) {
    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, field, editValue)}
          placeholder={placeholder}
          rows={3}
          className={`${inputCls} h-auto py-1.5 resize-none`}
        />
      );
    }
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={(e) => handleKeyDown(e, field, editValue)}
        placeholder={placeholder}
        className={inputCls}
      />
    );
  }

  // Helper: simple select
  function selectInputNode(field: string, options: { value: string; label: string }[]) {
    return (
      <select
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={(e) => handleKeyDown(e, field, editValue)}
        className={selectCls}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  // Helper: FK select (ports / currencies)
  function fkSelectNode(
    field: string,
    items: DropdownOption[],
    displayFn: (o: DropdownOption) => string
  ) {
    return (
      <select
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={(e) => handleKeyDown(e, field, editValue)}
        className={selectCls}
      >
        <option value="">— None —</option>
        {items.map((o) => (
          <option key={o.id} value={String(o.id)}>
            {displayFn(o)}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div
      className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Teal top rail */}
      <div
        className="h-0.5 w-full"
        style={{ background: "linear-gradient(to right, #1F7A8C, #2ab8d4)" }}
      />

      <div className="p-5 space-y-5">
        {/* Identity */}
        <FieldGroup label="Identity">
          <InlineField
            label="Company Name"
            value={customer.company_name}
            isEditing={editingField === "company_name"}
            saving={savingField === "company_name"}
            error={editingField === "company_name" ? fieldError : ""}
            onStartEdit={() => startEdit("company_name", customer.company_name)}
            onSave={() => saveField("company_name", editValue)}
            onCancel={cancelEdit}
            inputNode={textInputNode("company_name", "e.g. Acme Freight Ltd")}
          />
          <div className="grid grid-cols-2">
            <InlineField
              label="Customer Type"
              value={customer.customer_type}
              isEditing={editingField === "customer_type"}
              saving={savingField === "customer_type"}
              error={editingField === "customer_type" ? fieldError : ""}
              onStartEdit={() => startEdit("customer_type", customer.customer_type)}
              onSave={() => saveField("customer_type", editValue)}
              onCancel={cancelEdit}
              inputNode={selectInputNode("customer_type", [
                { value: "Company", label: "Company" },
                { value: "Individual", label: "Individual" },
              ])}
            />
            <InlineField
              label="TIN"
              value={customer.tin}
              isEditing={editingField === "tin"}
              saving={savingField === "tin"}
              error={editingField === "tin" ? fieldError : ""}
              onStartEdit={() => startEdit("tin", customer.tin)}
              onSave={() => saveField("tin", editValue)}
              onCancel={cancelEdit}
              inputNode={textInputNode("tin", "e.g. C0012345678")}
            />
          </div>
          <InlineField
            label="Business Type"
            value={customer.business_type}
            isEditing={editingField === "business_type"}
            saving={savingField === "business_type"}
            error={editingField === "business_type" ? fieldError : ""}
            onStartEdit={() => startEdit("business_type", customer.business_type ?? "")}
            onSave={() => saveField("business_type", editValue)}
            onCancel={cancelEdit}
            inputNode={textInputNode("business_type", "e.g. Importer, Exporter")}
          />
        </FieldGroup>

        {/* Contact */}
        <FieldGroup label="Contact">
          <InlineField
            label="Contact Person"
            value={customer.contact_person}
            isEditing={editingField === "contact_person"}
            saving={savingField === "contact_person"}
            error={editingField === "contact_person" ? fieldError : ""}
            onStartEdit={() => startEdit("contact_person", customer.contact_person ?? "")}
            onSave={() => saveField("contact_person", editValue)}
            onCancel={cancelEdit}
            inputNode={textInputNode("contact_person", "Full name")}
          />
          <div className="grid grid-cols-2">
            <InlineField
              label="Phone"
              value={customer.phone}
              isEditing={editingField === "phone"}
              saving={savingField === "phone"}
              error={editingField === "phone" ? fieldError : ""}
              onStartEdit={() => startEdit("phone", customer.phone ?? "")}
              onSave={() => saveField("phone", editValue)}
              onCancel={cancelEdit}
              inputNode={textInputNode("phone", "+233 20 000 0000")}
            />
            <InlineField
              label="Email"
              value={customer.email}
              isEditing={editingField === "email"}
              saving={savingField === "email"}
              error={editingField === "email" ? fieldError : ""}
              onStartEdit={() => startEdit("email", customer.email ?? "")}
              onSave={() => saveField("email", editValue)}
              onCancel={cancelEdit}
              inputNode={textInputNode("email", "contact@example.com")}
            />
          </div>
          <InlineField
            label="Address"
            value={customer.address}
            isEditing={editingField === "address"}
            saving={savingField === "address"}
            error={editingField === "address" ? fieldError : ""}
            onStartEdit={() => startEdit("address", customer.address ?? "")}
            onSave={() => saveField("address", editValue)}
            onCancel={cancelEdit}
            inputNode={textInputNode("address", "Street, city, region", true)}
          />
        </FieldGroup>

        {/* Commercial */}
        <FieldGroup label="Commercial">
          <div className="grid grid-cols-2">
            <InlineField
              label="Preferred Port"
              value={portName}
              isEditing={editingField === "preferred_port"}
              saving={savingField === "preferred_port"}
              error={editingField === "preferred_port" ? fieldError : ""}
              onStartEdit={() =>
                startEdit(
                  "preferred_port",
                  customer.preferred_port ? String(customer.preferred_port) : ""
                )
              }
              onSave={() =>
                saveField("preferred_port", editValue ? Number(editValue) : null)
              }
              onCancel={cancelEdit}
              inputNode={fkSelectNode("preferred_port", ports, (o) => o.name)}
            />
            <InlineField
              label="Currency"
              value={currencyDisplay}
              isEditing={editingField === "currency_preference"}
              saving={savingField === "currency_preference"}
              error={editingField === "currency_preference" ? fieldError : ""}
              onStartEdit={() =>
                startEdit(
                  "currency_preference",
                  customer.currency_preference
                    ? String(customer.currency_preference)
                    : ""
                )
              }
              onSave={() =>
                saveField(
                  "currency_preference",
                  editValue ? Number(editValue) : null
                )
              }
              onCancel={cancelEdit}
              inputNode={fkSelectNode("currency_preference", currencies, (o) =>
                o.code ? `${o.code} – ${o.name}` : o.name
              )}
            />
          </div>
          <InlineField
            label="Credit Terms"
            value={customer.credit_terms}
            isEditing={editingField === "credit_terms"}
            saving={savingField === "credit_terms"}
            error={editingField === "credit_terms" ? fieldError : ""}
            onStartEdit={() => startEdit("credit_terms", customer.credit_terms ?? "")}
            onSave={() => saveField("credit_terms", editValue)}
            onCancel={cancelEdit}
            inputNode={textInputNode("credit_terms", "e.g. Net 30")}
          />
        </FieldGroup>

        {/* Notes */}
        <FieldGroup label="Notes">
          <InlineField
            label="Notes"
            value={customer.notes}
            isEditing={editingField === "notes"}
            saving={savingField === "notes"}
            error={editingField === "notes" ? fieldError : ""}
            onStartEdit={() => startEdit("notes", customer.notes ?? "")}
            onSave={() => saveField("notes", editValue)}
            onCancel={cancelEdit}
            inputNode={textInputNode("notes", "Any additional information...", true)}
          />
        </FieldGroup>

        {/* System (read-only) */}
        <FieldGroup label="System">
          <div className="grid grid-cols-2">
            <InlineField
              label="Created"
              value={new Date(customer.created_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
              readOnly
              isEditing={false}
              saving={false}
              onStartEdit={() => {}}
              onSave={() => {}}
              onCancel={() => {}}
              inputNode={null}
            />
            <InlineField
              label="Last Updated"
              value={new Date(customer.updated_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
              readOnly
              isEditing={false}
              saving={false}
              onStartEdit={() => {}}
              onSave={() => {}}
              onCancel={() => {}}
              inputNode={null}
            />
          </div>
        </FieldGroup>
      </div>
    </div>
  );
}
