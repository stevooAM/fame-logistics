"use client";

import { useState } from "react";
import { LOOKUP_CONFIGS } from "@/types/lookup";
import { LookupTab } from "./components/LookupTab";

export default function LookupsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const activeConfig = LOOKUP_CONFIGS[activeTab];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#2B3E50]">Lookup Tables</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure reference data used across the system.
        </p>
      </div>

      {/* Tab bar */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-0" aria-label="Lookup tabs">
          {LOOKUP_CONFIGS.map((config, index) => (
            <button
              key={config.type}
              onClick={() => setActiveTab(index)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === index
                  ? "border-[#1F7A8C] text-[#1F7A8C]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {config.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Active tab content */}
      <LookupTab key={activeConfig.type} config={activeConfig} />
    </div>
  );
}
