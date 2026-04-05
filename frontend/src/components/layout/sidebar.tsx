"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SidebarNav } from "./sidebar-nav";
import { SidebarUser } from "./sidebar-user";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className="flex flex-col h-screen transition-all duration-300 flex-shrink-0"
      style={{
        backgroundColor: "#2B3E50",
        width: collapsed ? "64px" : "256px",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-white/10">
        {!collapsed && (
          <span className="text-white font-bold text-lg tracking-wide" style={{ color: "#1F7A8C" }}>
            FAME FMS
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-white transition-colors ml-auto"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <SidebarNav collapsed={collapsed} />

      {/* User section */}
      <SidebarUser collapsed={collapsed} />
    </aside>
  );
}
