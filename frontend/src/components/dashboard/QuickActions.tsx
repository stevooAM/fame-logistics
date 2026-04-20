"use client";

import Link from "next/link";

interface QuickActionsProps {
  role: string;
}

interface ActionButton {
  label: string;
  href: string;
  variant: "teal" | "amber";
  icon: React.ReactNode;
}

function PlusIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function UserPlusIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
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

function CheckCircleIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4M12 2a10 10 0 100 20A10 10 0 0012 2z"
      />
    </svg>
  );
}

function DocumentTextIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5l5 5v12a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function CurrencyIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function ScaleIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 6l9-3 9 3M3 6v12l9 3 9-3V6M12 3v18"
      />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20h5v-1a4 4 0 00-5.197-3.796M9 20H4v-1a4 4 0 015.197-3.796M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
    </svg>
  );
}

function ActionLink({ action }: { action: ActionButton }) {
  const tealStyle =
    "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const amberBg = "bg-[#F89C1C] hover:bg-[#e08c10] focus:ring-[#F89C1C]";
  const tealBg = "bg-[#1F7A8C] hover:bg-[#185f6e] focus:ring-[#1F7A8C]";

  return (
    <Link
      href={action.href}
      className={`${tealStyle} ${action.variant === "amber" ? amberBg : tealBg}`}
    >
      {action.icon}
      {action.label}
    </Link>
  );
}

export function QuickActions({ role }: QuickActionsProps) {
  const normalized = role.toLowerCase();
  const isFinance = normalized === "finance";
  const isAdmin = normalized === "admin";

  const financeActions: ActionButton[] = [
    {
      label: "Generate Invoice",
      href: "/accounts",
      variant: "amber",
      icon: <DocumentTextIcon />,
    },
    {
      label: "Record Payment",
      href: "/accounts",
      variant: "teal",
      icon: <CurrencyIcon />,
    },
    {
      label: "View Balances",
      href: "/accounts",
      variant: "teal",
      icon: <ScaleIcon />,
    },
  ];

  const operationsActions: ActionButton[] = [
    {
      label: "Create Job",
      href: "/jobs?create=1",
      variant: "teal",
      icon: <PlusIcon />,
    },
    {
      label: "Add Customer",
      href: "/customers?create=1",
      variant: "teal",
      icon: <UserPlusIcon />,
    },
    {
      label: "View Approvals",
      href: "/approvals",
      variant: "teal",
      icon: <CheckCircleIcon />,
    },
  ];

  const adminOnlyActions: ActionButton[] = [
    {
      label: "Manage Users",
      href: "/admin/users",
      variant: "teal",
      icon: <UsersIcon />,
    },
    {
      label: "View Audit Log",
      href: "/admin/audit-log",
      variant: "teal",
      icon: <ClipboardIcon />,
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4">
        Quick Actions
      </h2>

      {isFinance ? (
        <div className="flex flex-wrap gap-3">
          {financeActions.map((action) => (
            <ActionLink key={action.label} action={action} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {operationsActions.map((action) => (
              <ActionLink key={action.label} action={action} />
            ))}
          </div>

          {isAdmin && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                Admin
              </p>
              <div className="flex flex-wrap gap-3">
                {adminOnlyActions.map((action) => (
                  <ActionLink key={action.label} action={action} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
