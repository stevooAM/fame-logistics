"use client";

import { LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/providers/auth-provider";

interface SidebarUserProps {
  collapsed: boolean;
}

export function SidebarUser({ collapsed }: SidebarUserProps) {
  const { user, logout } = useAuth();

  // Display name: prefer first+last name, fall back to username
  const displayName =
    user
      ? [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username
      : "—";

  // Avatar initials from display name
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const roleName = user?.role?.name ?? "—";

  return (
    <div className="px-3 py-4 border-t border-white/10">
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ backgroundColor: "#1F7A8C", color: "#fff" }}
        >
          {initials}
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{displayName}</p>
            <Badge
              className="text-xs mt-0.5"
              style={{ backgroundColor: "#F89C1C", color: "#fff", border: "none" }}
            >
              {roleName}
            </Badge>
          </div>
        )}
        <button
          onClick={logout}
          className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
