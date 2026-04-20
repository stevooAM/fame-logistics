"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CustomerOption {
  id: number;
  company_name: string;
}

interface CustomerListResponse {
  results: CustomerOption[];
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CustomerPickerProps {
  value: number | null;
  onChange: (customerId: number | null) => void;
  error?: string;
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Input style helper (matches CustomerFormDialog pattern)
// ---------------------------------------------------------------------------

const inputClass =
  "h-9 w-full text-sm border rounded-lg px-3 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 placeholder:text-gray-300";

function inputStyle(hasError: boolean) {
  return hasError
    ? `${inputClass} border-red-400 focus:ring-red-300`
    : `${inputClass} border-gray-200 focus:ring-[#1F7A8C]`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CustomerPicker({
  value,
  onChange,
  error,
  disabled = false,
}: CustomerPickerProps) {
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState<CustomerOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedName, setSelectedName] = useState<string>("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // On mount or when value changes externally: fetch the customer name.
  useEffect(() => {
    if (value === null) {
      setSelectedName("");
      setInputValue("");
      return;
    }

    // If we already have the name from selection, skip the fetch.
    if (selectedName && inputValue === selectedName) return;

    apiFetch<CustomerOption>(`/api/customers/${value}/`)
      .then((c) => {
        setSelectedName(c.company_name);
        setInputValue(c.company_name);
      })
      .catch(() => {
        // Customer fetch failed — clear selection silently.
        setSelectedName("");
        setInputValue("");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Debounced search
  const search = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setOptions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ search: query, page_size: "10" });
        const data = await apiFetch<CustomerListResponse>(
          `/api/customers/?${params.toString()}`
        );
        setOptions(data.results ?? []);
        setOpen(true);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setInputValue(q);

    // If user clears the field, clear the selection.
    if (!q) {
      onChange(null);
      setSelectedName("");
    }

    search(q);
  }

  function handleSelect(customer: CustomerOption) {
    onChange(customer.id);
    setSelectedName(customer.company_name);
    setInputValue(customer.company_name);
    setOpen(false);
    setOptions([]);
  }

  function handleBlur() {
    // Small delay so the click on an option registers before closing.
    setTimeout(() => {
      setOpen(false);
      // If the user typed something but didn't select, revert to last known name.
      if (value !== null && selectedName) {
        setInputValue(selectedName);
      } else if (value === null) {
        setInputValue("");
      }
    }, 150);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      if (value !== null && selectedName) {
        setInputValue(selectedName);
      }
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="Search customer..."
        disabled={disabled}
        autoComplete="off"
        className={inputStyle(!!error)}
      />

      {/* Loading indicator */}
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <svg
            className="animate-spin h-3.5 w-3.5"
            style={{ color: "#1F7A8C" }}
            viewBox="0 0 24 24"
            fill="none"
          >
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
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
          style={{ maxHeight: "200px", overflowY: "auto" }}
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-400">
              No customers found
            </div>
          ) : (
            options.map((c) => (
              <button
                key={c.id}
                type="button"
                onMouseDown={() => handleSelect(c)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-[#f0f9fb] transition-colors"
                style={{ color: "#2B3E50", fontFamily: "'DM Sans', sans-serif" }}
              >
                {c.company_name}
              </button>
            ))
          )}
        </div>
      )}

      {error && (
        <p className="mt-1 text-xs" style={{ color: "#ef4444" }}>
          {error}
        </p>
      )}
    </div>
  );
}
