"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { Customer } from "@/types/customer";
import { CustomerInfoPanel } from "./components/CustomerInfoPanel";
import { LinkedJobsPanel } from "./components/LinkedJobsPanel";

function LoadingSkeleton() {
  return (
    <div
      className="p-6 space-y-6 animate-pulse"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="space-y-2">
        <div className="h-4 w-32 rounded bg-gray-200" />
        <div className="h-8 w-64 rounded bg-gray-200" />
        <div className="h-5 w-20 rounded-full bg-gray-200" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 rounded-xl border border-gray-100 bg-white shadow-sm h-96" />
        <div className="lg:col-span-2 rounded-xl border border-gray-100 bg-white shadow-sm h-96" />
      </div>
    </div>
  );
}

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    apiFetch<Customer>(`/api/customers/${id}/`)
      .then(setCustomer)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSkeleton />;

  if (notFound || !customer) {
    return (
      <div className="p-6 space-y-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <Link
          href="/customers"
          className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
          style={{ color: "#1F7A8C" }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z" />
          </svg>
          Back to Customers
        </Link>
        <p className="text-sm text-gray-500">Customer not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Back + Header */}
      <div className="space-y-2">
        <Link
          href="/customers"
          className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
          style={{ color: "#1F7A8C" }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z" />
          </svg>
          Back to Customers
        </Link>

        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold" style={{ color: "#2B3E50" }}>
            {customer.company_name}
          </h1>
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ backgroundColor: "#e8f5f7", color: "#1F7A8C" }}
          >
            {customer.customer_type}
          </span>
          {!customer.is_active && (
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{ backgroundColor: "#fef2f2", color: "#dc2626" }}
            >
              Inactive
            </span>
          )}
        </div>
        <p className="text-sm text-gray-400">
          Customer #{customer.id} · Created{" "}
          {new Date(customer.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-3">
          <CustomerInfoPanel customer={customer} onUpdate={setCustomer} />
        </div>
        <div className="lg:col-span-2">
          <LinkedJobsPanel customerId={customer.id} />
        </div>
      </div>
    </div>
  );
}
