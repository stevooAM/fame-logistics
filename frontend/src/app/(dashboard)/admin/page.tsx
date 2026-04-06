import Link from "next/link";
import {
  Users,
  ScrollText,
  Monitor,
  Database,
  Building2,
} from "lucide-react";

interface AdminCard {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
}

const ADMIN_CARDS: AdminCard[] = [
  {
    href: "/admin/users",
    icon: Users,
    title: "Users",
    description: "Manage user accounts and roles",
  },
  {
    href: "/admin/audit-log",
    icon: ScrollText,
    title: "Audit Log",
    description: "View system activity log",
  },
  {
    href: "/admin/sessions",
    icon: Monitor,
    title: "Sessions",
    description: "Monitor active sessions",
  },
  {
    href: "/admin/lookups",
    icon: Database,
    title: "Lookup Tables",
    description: "Configure reference data",
  },
  {
    href: "/admin/settings",
    icon: Building2,
    title: "Company Settings",
    description: "Update company profile",
  },
];

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "#2B3E50" }}>
          Administration
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          System configuration, user management, and audit tools.
        </p>
      </div>

      {/* Navigation cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ADMIN_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-[#1F7A8C] hover:shadow-md"
            >
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg transition-colors group-hover:bg-teal-50"
                style={{ backgroundColor: "#f0f9fb" }}
              >
                <Icon
                  className="h-5 w-5 transition-colors group-hover:text-[#1F7A8C]"
                  style={{ color: "#1F7A8C" }}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-[#1F7A8C] transition-colors">
                  {card.title}
                </p>
                <p className="mt-0.5 text-sm text-gray-500">
                  {card.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
