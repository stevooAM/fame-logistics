export type NavItem = {
  label: string;
  href: string;
  icon: string;
  roles: string[];
  badge?: number;
};

/**
 * Navigation items with 3-role permission matrix.
 *
 * Roles: admin | operations | finance
 *
 * Permission matrix:
 *   Dashboard : admin, operations, finance
 *   Customers : admin, operations
 *   Jobs      : admin, operations
 *   Approvals : admin
 *   Accounts  : admin, finance
 *   Reports   : admin, operations, finance
 *   Admin     : admin
 */
export const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: "LayoutDashboard",
    roles: ["admin", "operations", "finance"],
  },
  {
    label: "Customers",
    href: "/customers",
    icon: "Users",
    roles: ["admin", "operations"],
  },
  {
    label: "Jobs",
    href: "/jobs",
    icon: "Package",
    roles: ["admin", "operations"],
  },
  {
    label: "Approvals",
    href: "/approvals",
    icon: "CheckCircle",
    roles: ["admin"],
  },
  {
    label: "Accounts",
    href: "/accounts",
    icon: "Receipt",
    roles: ["admin", "finance"],
  },
  {
    label: "Reports",
    href: "/reports",
    icon: "BarChart3",
    roles: ["admin", "operations", "finance"],
  },
  {
    label: "Admin",
    href: "/admin",
    icon: "Settings",
    roles: ["admin"],
  },
];

/**
 * Returns only the nav items permitted for the given role.
 *
 * @param items  Full navItems array
 * @param userRole  Lowercase role name: "admin" | "operations" | "finance"
 *
 * If no role is provided, all items are returned (dev/testing fallback).
 */
export function filterNavByRole(items: NavItem[], userRole?: string): NavItem[] {
  if (!userRole) return items;
  return items.filter((item) => item.roles.includes(userRole));
}
