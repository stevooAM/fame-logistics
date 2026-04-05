"use client";

import { LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SidebarUserProps {
  collapsed: boolean;
}

export function SidebarUser({ collapsed }: SidebarUserProps) {
  return (
    <div className="px-3 py-4 border-t border-white/10">
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ backgroundColor: "#1F7A8C", color: "#fff" }}
        >
          A
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Admin User</p>
            <Badge
              className="text-xs mt-0.5"
              style={{ backgroundColor: "#F89C1C", color: "#fff", border: "none" }}
            >
              Admin
            </Badge>
          </div>
        )}
        <button
          className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
