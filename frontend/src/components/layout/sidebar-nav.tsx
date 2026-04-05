"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  CheckCircle,
  Receipt,
  BarChart3,
  Settings,
} from "lucide-react";
import { navItems, filterNavByRole } from "@/lib/navigation";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Users,
  Package,
  CheckCircle,
  Receipt,
  BarChart3,
  Settings,
};

interface SidebarNavProps {
  collapsed: boolean;
}

export function SidebarNav({ collapsed }: SidebarNavProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  // Role name from API is e.g. "Admin", "Operations", "Finance" — lowercase for matching
  const userRole = user?.role?.name?.toLowerCase();
  const items = filterNavByRole(navItems, userRole);

  return (
    <nav className="flex-1 px-2 py-4 space-y-1">
      {items.map((item) => {
        const Icon = iconMap[item.icon];
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              isActive
                ? "text-white"
                : "text-gray-300 hover:text-white hover:bg-white/10"
            )}
            style={isActive ? { backgroundColor: "rgba(31, 122, 140, 0.4)" } : {}}
            title={collapsed ? item.label : undefined}
          >
            {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
            {!collapsed && <span>{item.label}</span>}
            {!collapsed && item.badge != null && item.badge > 0 && (
              <span
                className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: "#F89C1C", color: "#fff" }}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
