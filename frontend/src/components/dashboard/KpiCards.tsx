"use client";

import { useRouter } from "next/navigation";
import type { KpiData } from "@/types/dashboard";

interface KpiCardsProps {
  kpis: KpiData | null;
  role: string;
}

interface KpiCardConfig {
  key: string;
  label: string;
  value: string | number | null;
  route: string;
  icon: React.ReactNode;
}

function formatCurrency(raw: string): string {
  const num = parseFloat(raw);
  if (isNaN(num)) return "GHS 0.00";
  return (
    "GHS " +
    num.toLocaleString("en-GH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="h-3 bg-gray-200 rounded w-28" />
        <div className="h-8 w-8 bg-gray-200 rounded-lg" />
      </div>
      <div className="h-8 bg-gray-200 rounded w-20 mt-2" />
    </div>
  );
}

function BriefcaseIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
    </svg>
  );
}

function CurrencyIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v2m0 8v2m-4-6h8"
      />
    </svg>
  );
}

function UserPlusIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2 21v-1a7 7 0 0114 0v1"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 8v6m3-3h-6" />
    </svg>
  );
}

export function KpiCards({ kpis, role }: KpiCardsProps) {
  const router = useRouter();
  const isFinance = role.toLowerCase() === "finance";

  if (kpis === null) {
    const skeletonCount = isFinance ? 3 : 4;
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  const cards: KpiCardConfig[] = [
    {
      key: "active_jobs",
      label: "Active Jobs",
      value: kpis.active_jobs,
      route: "/jobs",
      icon: <BriefcaseIcon />,
    },
    ...(!isFinance
      ? [
          {
            key: "pending_approvals",
            label: "Pending Approvals",
            value: kpis.pending_approvals ?? 0,
            route: "/approvals",
            icon: <ClockIcon />,
          } satisfies KpiCardConfig,
        ]
      : []),
    {
      key: "outstanding_invoice_total",
      label: "Outstanding Invoice Total",
      value: formatCurrency(kpis.outstanding_invoice_total),
      route: "/accounts",
      icon: <CurrencyIcon />,
    },
    {
      key: "new_customers_this_month",
      label: "New Customers This Month",
      value: kpis.new_customers_this_month,
      route: "/customers",
      icon: <UserPlusIcon />,
    },
  ];

  return (
    <div
      className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${
        isFinance ? "xl:grid-cols-3" : "xl:grid-cols-4"
      }`}
    >
      {cards.map((card) => (
        <button
          key={card.key}
          onClick={() => router.push(card.route)}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-left transition-all duration-150 hover:shadow-md hover:border-[#1F7A8C]/30 focus:outline-none focus:ring-2 focus:ring-[#1F7A8C]/40 group"
        >
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide leading-tight">
              {card.label}
            </span>
            <span
              className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-lg text-[#1F7A8C] bg-[#1F7A8C]/10 group-hover:bg-[#1F7A8C]/15 transition-colors"
              aria-hidden="true"
            >
              {card.icon}
            </span>
          </div>
          <p
            className="text-2xl font-bold mt-1 truncate"
            style={{ color: "#2B3E50" }}
          >
            {card.value}
          </p>
        </button>
      ))}
    </div>
  );
}
