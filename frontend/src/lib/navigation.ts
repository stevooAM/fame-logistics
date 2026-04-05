export type NavItem = {
  label: string;
  href: string;
  icon: string;
  roles: string[];
  badge?: number;
};

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: "LayoutDashboard", roles: ["admin", "manager", "operations", "finance", "viewer"] },
  { label: "Customers", href: "/customers", icon: "Users", roles: ["admin", "manager", "operations", "viewer"] },
  { label: "Jobs", href: "/jobs", icon: "Package", roles: ["admin", "manager", "operations", "viewer"] },
  { label: "Approvals", href: "/approvals", icon: "CheckCircle", roles: ["admin", "manager"] },
  { label: "Accounts", href: "/accounts", icon: "Receipt", roles: ["admin", "manager", "finance"] },
  { label: "Reports", href: "/reports", icon: "BarChart3", roles: ["admin", "manager", "finance", "viewer"] },
  { label: "Admin", href: "/admin", icon: "Settings", roles: ["admin"] },
];

// Stub role filtering — Phase 2 will activate this with real user roles
export function filterNavByRole(items: NavItem[], userRole?: string): NavItem[] {
  if (!userRole) return items; // Show all when no role (dev mode)
  return items.filter((item) => item.roles.includes(userRole));
}
