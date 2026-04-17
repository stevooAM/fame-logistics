"use client";

import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { ApprovalQueue } from "./components/ApprovalQueue";
import { ApprovalHistory } from "./components/ApprovalHistory";

type Tab = "queue" | "history";

export default function ApprovalsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role?.name?.toLowerCase() === "admin";
  const [activeTab, setActiveTab] = useState<Tab>("queue");

  const tabCls = (tab: Tab) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      activeTab === tab
        ? "border-[#1F7A8C] text-[#1F7A8C]"
        : "border-transparent text-gray-500 hover:text-gray-700"
    }`;

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold" style={{ color: "#2B3E50" }}>
          Approvals
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage job approval requests
        </p>
      </div>

      {/* Tab bar — History tab only visible for Admin */}
      <div className="flex border-b border-gray-200 mb-6">
        <button className={tabCls("queue")} onClick={() => setActiveTab("queue")}>
          Pending Queue
        </button>
        {isAdmin && (
          <button
            className={tabCls("history")}
            onClick={() => setActiveTab("history")}
          >
            History
          </button>
        )}
      </div>

      {activeTab === "queue" && <ApprovalQueue />}
      {activeTab === "history" && isAdmin && <ApprovalHistory />}
    </div>
  );
}
