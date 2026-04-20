"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { fetchInvoice } from "@/lib/accounts-api";
import type { Invoice } from "@/types/account";
import { StatusBadge } from "./StatusBadge";
import { RecordPaymentDialog } from "./RecordPaymentDialog";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function formatAmount(value: string | null | undefined, currencyCode?: string | null): string {
  if (!value) return "—";
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  const formatted = new Intl.NumberFormat("en-GB", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
  return currencyCode ? `${currencyCode} ${formatted}` : formatted;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface InvoiceDetailDrawerProps {
  invoiceId: number | null;
  onClose: () => void;
  onPaymentRecorded: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InvoiceDetailDrawer({
  invoiceId,
  onClose,
  onPaymentRecorded,
}: InvoiceDetailDrawerProps) {
  const { user } = useAuth();
  const isOperations = user?.role?.name?.toLowerCase() === "operations";

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Fetch invoice when invoiceId changes
  useEffect(() => {
    if (!invoiceId) {
      setInvoice(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setFetchError(null);
    setInvoice(null);

    fetchInvoice(invoiceId)
      .then((data) => {
        if (!cancelled) setInvoice(data);
      })
      .catch(() => {
        if (!cancelled) setFetchError("Failed to load invoice. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [invoiceId]);

  if (!invoiceId) return null;

  const canRecordPayment =
    !isOperations &&
    invoice?.status !== "PAID" &&
    invoice?.status !== "CANCELLED";

  const hasBalance = invoice ? parseFloat(invoice.balance) > 0 : false;

  return (
    <>
      {/* Overlay + drawer */}
      <div
        className="fixed inset-0 z-40 flex justify-end"
        onClick={onClose}
        aria-label="Close drawer"
      >
        <div
          className="relative w-full max-w-md h-full bg-white shadow-xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
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
              {invoice ? (
                <>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-[#2B3E50]">
                      {invoice.invoice_number}
                    </h2>
                    <StatusBadge status={invoice.status} />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Invoice Detail</p>
                </>
              ) : (
                <h2 className="text-base font-semibold text-[#2B3E50]">Invoice Detail</h2>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#1F7A8C] ml-4 mt-0.5"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-gray-500">
                <path d="M12.854 3.146a.5.5 0 0 1 0 .708l-9 9a.5.5 0 0 1-.708-.708l9-9a.5.5 0 0 1 .708 0z" />
                <path d="M3.146 3.146a.5.5 0 0 0 0 .708l9 9a.5.5 0 0 0 .708-.708l-9-9a.5.5 0 0 0-.708 0z" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
            {loading && (
              <div className="flex items-center justify-center h-32">
                <div
                  className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
                  style={{ borderColor: "#1F7A8C", borderTopColor: "transparent" }}
                />
              </div>
            )}

            {fetchError && (
              <div className="rounded-lg border px-3 py-2 text-sm border-red-200 bg-red-50 text-red-600">
                {fetchError}
              </div>
            )}

            {invoice && (
              <>
                {/* Customer & Job */}
                <section className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold tracking-widest uppercase text-[#1F7A8C]">
                      Details
                    </span>
                    <div className="flex-1 h-px bg-[#e5f4f6]" />
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <dt className="text-xs text-gray-500">Customer</dt>
                      <dd className="font-medium text-[#2B3E50]">
                        {invoice.customer_name ?? `#${invoice.customer}`}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">Job</dt>
                      <dd className="font-medium text-[#2B3E50]">
                        {invoice.job_number ?? `#${invoice.job}`}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">Issue Date</dt>
                      <dd className="text-gray-700">{formatDate(invoice.issue_date)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">Due Date</dt>
                      <dd className="text-gray-700">{formatDate(invoice.due_date)}</dd>
                    </div>
                    {invoice.currency_code && (
                      <div>
                        <dt className="text-xs text-gray-500">Currency</dt>
                        <dd className="text-gray-700">{invoice.currency_code}</dd>
                      </div>
                    )}
                    {invoice.notes && (
                      <div className="col-span-2">
                        <dt className="text-xs text-gray-500">Notes</dt>
                        <dd className="text-gray-700 text-xs">{invoice.notes}</dd>
                      </div>
                    )}
                  </dl>
                </section>

                {/* Balance Summary */}
                <section className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold tracking-widest uppercase text-[#1F7A8C]">
                      Balance Summary
                    </span>
                    <div className="flex-1 h-px bg-[#e5f4f6]" />
                  </div>
                  <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-xs text-gray-500 mb-0.5">Invoiced</div>
                      <div className="font-semibold text-[#2B3E50] text-sm">
                        {formatAmount(invoice.amount, invoice.currency_code)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-0.5">Paid</div>
                      <div className="font-semibold text-green-600 text-sm">
                        {formatAmount(invoice.paid_total, invoice.currency_code)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-0.5">Balance</div>
                      <div
                        className={`font-semibold text-sm ${
                          hasBalance ? "text-red-600" : "text-gray-700"
                        }`}
                      >
                        {formatAmount(invoice.balance, invoice.currency_code)}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Payments list */}
                <section className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold tracking-widest uppercase text-[#1F7A8C]">
                      Payments ({invoice.payments?.length ?? 0})
                    </span>
                    <div className="flex-1 h-px bg-[#e5f4f6]" />
                  </div>

                  {!invoice.payments || invoice.payments.length === 0 ? (
                    <p className="text-sm text-gray-400">No payments recorded yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-gray-500 border-b">
                            <th className="text-left py-1.5 pr-3 font-medium">Date</th>
                            <th className="text-right py-1.5 pr-3 font-medium">Amount</th>
                            <th className="text-left py-1.5 pr-3 font-medium">Method</th>
                            <th className="text-left py-1.5 font-medium">Reference</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoice.payments.map((p) => (
                            <tr key={p.id} className="border-b border-gray-50">
                              <td className="py-1.5 pr-3 text-gray-700">
                                {formatDate(p.payment_date)}
                              </td>
                              <td className="py-1.5 pr-3 text-right font-medium text-[#2B3E50]">
                                {formatAmount(p.amount, invoice.currency_code)}
                              </td>
                              <td className="py-1.5 pr-3 text-gray-500">
                                {p.payment_method || "—"}
                              </td>
                              <td className="py-1.5 text-gray-500">{p.reference || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t flex justify-between flex-shrink-0">
            <button
              onClick={() => setPaymentOpen(true)}
              disabled={!canRecordPayment || !invoice}
              className="px-4 py-2 text-sm text-white rounded-md hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              style={{ backgroundColor: "#1F7A8C" }}
              title={
                isOperations
                  ? "Read-only access"
                  : invoice?.status === "PAID"
                  ? "Invoice already paid"
                  : invoice?.status === "CANCELLED"
                  ? "Invoice cancelled"
                  : undefined
              }
            >
              Record Payment
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Record Payment Dialog */}
      {invoice && (
        <RecordPaymentDialog
          open={paymentOpen}
          invoiceId={invoice.id}
          invoiceNumber={invoice.invoice_number}
          onClose={() => setPaymentOpen(false)}
          onSuccess={() => {
            setPaymentOpen(false);
            // Re-fetch the invoice to show updated balance
            setLoading(true);
            fetchInvoice(invoice.id)
              .then((updated) => {
                if (mountedRef.current) setInvoice(updated);
              })
              .catch(() => {
                /* apiFetch handles 401 */
              })
              .finally(() => {
                if (mountedRef.current) setLoading(false);
              });
            // Notify parent to refresh the grid
            onPaymentRecorded();
          }}
        />
      )}
    </>
  );
}
