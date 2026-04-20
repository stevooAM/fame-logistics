"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { fetchBalanceDetail } from "@/lib/balances-api";
import type { CustomerBalanceDetailResponse, BalanceInvoice } from "@/lib/balances-api";
import { ApiError } from "@/lib/api";
import { StatusBadge } from "@/app/(dashboard)/accounts/components/StatusBadge";
import type { InvoiceStatus } from "@/types/account";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtCurrency(value: string | null | undefined, code?: string | null): string {
  if (value === null || value === undefined) return "";
  const num = Number(value);
  if (isNaN(num)) return value ?? "";
  try {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: code || "GHS",
      minimumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${code ?? "GHS"} ${num.toFixed(2)}`;
  }
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CustomerBalanceDetailProps {
  customerId: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CustomerBalanceDetail({ customerId }: CustomerBalanceDetailProps) {
  const [data, setData] = useState<CustomerBalanceDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    fetchBalanceDetail(customerId, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setData(result);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        if (err instanceof ApiError && err.status === 404) {
          setError("Customer not found.");
        } else if (err instanceof ApiError && err.status === 403) {
          setError("You do not have permission to view this customer's balance.");
        } else {
          setError("Failed to load customer balance. Please try again.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [customerId]);

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Link
          href="/accounts/balances"
          className="inline-flex items-center gap-1 text-sm text-[#1F7A8C] hover:underline w-fit"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          All balances
        </Link>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading customer balance...
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Error state
  // ---------------------------------------------------------------------------

  if (error || !data) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Link
          href="/accounts/balances"
          className="inline-flex items-center gap-1 text-sm text-[#1F7A8C] hover:underline w-fit"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          All balances
        </Link>
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? "Something went wrong."}
        </div>
      </div>
    );
  }

  const { customer, invoiced_total, paid_total, balance, invoices } = data;
  const hasBalance = Number(balance) > 0;

  // ---------------------------------------------------------------------------
  // Success state
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Back link */}
      <Link
        href="/accounts/balances"
        className="inline-flex items-center gap-1 text-sm text-[#1F7A8C] hover:underline w-fit"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        All balances
      </Link>

      {/* Section A: Customer header + totals */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        {/* Customer card */}
        <div className="flex-1 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-[#2B3E50] mb-3">{customer.company_name}</h2>
          <dl className="grid grid-cols-1 gap-y-2 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-gray-500 text-xs uppercase tracking-wide">Email</dt>
              <dd className="text-gray-800 mt-0.5">{customer.email || "N/A"}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-xs uppercase tracking-wide">Phone</dt>
              <dd className="text-gray-800 mt-0.5">{customer.phone_number || "N/A"}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-xs uppercase tracking-wide">TIN</dt>
              <dd className="text-gray-800 mt-0.5">{customer.tin || "N/A"}</dd>
            </div>
          </dl>
        </div>

        {/* Totals card */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm min-w-[220px]">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Summary</h3>
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-gray-500">Invoiced</dt>
              <dd className="font-medium text-gray-800">{fmtCurrency(invoiced_total)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-gray-500">Paid</dt>
              <dd className="font-medium text-gray-800">{fmtCurrency(paid_total)}</dd>
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 pt-2 mt-1">
              <dt className="font-medium text-gray-700">Balance</dt>
              <dd className={`font-semibold ${hasBalance ? "text-red-600" : "text-gray-800"}`}>
                {fmtCurrency(balance)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Section B: Invoice table */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-[#2B3E50]">Invoices</h3>
        </div>

        {invoices.length === 0 ? (
          <p className="px-5 py-8 text-sm text-gray-500 text-center">
            This customer has no invoices.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Invoice #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Job #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Issue Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Due Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Paid
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((inv: BalanceInvoice) => {
                  const invHasBalance = Number(inv.balance) > 0;
                  return (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-800 font-medium">{inv.invoice_number}</td>
                      <td className="px-4 py-3 text-gray-600">{inv.job_number || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(inv.issue_date)}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(inv.due_date)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={inv.status as InvoiceStatus} />
                      </td>
                      <td className="px-4 py-3 text-right text-gray-800">
                        {fmtCurrency(inv.amount, inv.currency_code)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-800">
                        {fmtCurrency(inv.paid_total, inv.currency_code)}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${invHasBalance ? "text-red-600" : "text-gray-800"}`}>
                        {fmtCurrency(inv.balance, inv.currency_code)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section C: Footnote */}
      <p className="text-xs text-gray-400">
        Totals include all non-cancelled invoices.
      </p>
    </div>
  );
}
