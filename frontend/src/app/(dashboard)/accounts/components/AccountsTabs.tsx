"use client";

import { useRouter, usePathname } from "next/navigation";

const TABS = [
  { key: "invoices", label: "Invoices", href: "/accounts" },
  { key: "balances", label: "Outstanding Balances", href: "/accounts/balances" },
  { key: "summary", label: "Period Summary", href: "/accounts/summary" },
] as const;

export function AccountsTabs() {
  const router = useRouter();
  const pathname = usePathname() || "/accounts";

  function isActive(href: string) {
    if (href === "/accounts") return pathname === "/accounts";
    return pathname.startsWith(href);
  }

  return (
    <div className="border-b border-gray-200 flex gap-1">
      {TABS.map((t) => {
        const active = isActive(t.href);
        return (
          <button
            key={t.key}
            onClick={() => router.push(t.href)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              active
                ? "border-[#1F7A8C] text-[#1F7A8C]"
                : "border-transparent text-gray-500 hover:text-[#2B3E50] hover:border-gray-300"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
