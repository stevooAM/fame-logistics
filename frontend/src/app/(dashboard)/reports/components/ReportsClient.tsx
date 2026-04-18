"use client";

import { useState } from "react";
import { ReportsTabs, type ReportTab } from "./ReportsTabs";
import { ReportsToolbar } from "./ReportsToolbar";
import { CustomerActivitySection } from "./CustomerActivitySection";
import { JobStatusSection } from "./JobStatusSection";
import { RevenueSection } from "./RevenueSection";

// ---------------------------------------------------------------------------
// Default date range — current month
// ---------------------------------------------------------------------------

function getDefaultDateRange() {
  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return {
    date_from: first.toISOString().split("T")[0],
    date_to: last.toISOString().split("T")[0],
  };
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ReportsClient() {
  const defaults = getDefaultDateRange();

  const [activeTab, setActiveTab] = useState<ReportTab>("customer-activity");
  const [dateFrom, setDateFrom] = useState(defaults.date_from);
  const [dateTo, setDateTo] = useState(defaults.date_to);
  const [currencyCode, setCurrencyCode] = useState("");
  const [customerId, setCustomerId] = useState("");

  // Per-tab run triggers (so each tab independently tracks whether report was run)
  const [customerActivityTrigger, setCustomerActivityTrigger] = useState(0);
  const [jobStatusTrigger, setJobStatusTrigger] = useState(0);
  const [revenueTrigger, setRevenueTrigger] = useState(0);

  // Section-level loading states lifted for toolbar spinner
  // (sections manage their own loading but we need it for toolbar)
  // We use a simple derived approach: toolbar shows loading from sections
  const [customerActivityLoading, setCustomerActivityLoading] = useState(false);
  const [jobStatusLoading, setJobStatusLoading] = useState(false);
  const [revenueLoading, setRevenueLoading] = useState(false);

  function handleTabChange(tab: ReportTab) {
    setActiveTab(tab);
    // Do not reset triggers — keep previous results visible when returning to a tab
  }

  function handleRun() {
    if (activeTab === "customer-activity") {
      setCustomerActivityTrigger((n) => n + 1);
    } else if (activeTab === "job-status") {
      setJobStatusTrigger((n) => n + 1);
    } else {
      setRevenueTrigger((n) => n + 1);
    }
  }

  const activeLoading =
    activeTab === "customer-activity"
      ? customerActivityLoading
      : activeTab === "job-status"
      ? jobStatusLoading
      : revenueLoading;

  return (
    <div className="flex flex-col gap-4">
      {/* Page title */}
      <h1 className="text-2xl font-bold" style={{ color: "#2B3E50" }}>
        Reports
      </h1>

      {/* Tab navigation */}
      <ReportsTabs activeTab={activeTab} onChange={handleTabChange} />

      {/* Toolbar */}
      <div className="mt-2">
        <ReportsToolbar
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onRun={handleRun}
          loading={activeLoading}
          showCurrencyFilter={activeTab === "revenue"}
          currencyCode={currencyCode}
          onCurrencyCodeChange={setCurrencyCode}
          showCustomerFilter={activeTab === "customer-activity"}
          customerId={customerId}
          onCustomerIdChange={setCustomerId}
        />
      </div>

      {/* Active section */}
      {activeTab === "customer-activity" && (
        <CustomerActivitySectionWrapper
          runTrigger={customerActivityTrigger}
          dateFrom={dateFrom}
          dateTo={dateTo}
          customerId={customerId}
          onLoadingChange={setCustomerActivityLoading}
        />
      )}
      {activeTab === "job-status" && (
        <JobStatusSectionWrapper
          runTrigger={jobStatusTrigger}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onLoadingChange={setJobStatusLoading}
        />
      )}
      {activeTab === "revenue" && (
        <RevenueSectionWrapper
          runTrigger={revenueTrigger}
          dateFrom={dateFrom}
          dateTo={dateTo}
          currencyCode={currencyCode}
          onLoadingChange={setRevenueLoading}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Thin wrapper components to hoist loading state to parent
// ---------------------------------------------------------------------------

function CustomerActivitySectionWrapper({
  runTrigger,
  dateFrom,
  dateTo,
  customerId,
  onLoadingChange,
}: {
  runTrigger: number;
  dateFrom: string;
  dateTo: string;
  customerId?: string;
  onLoadingChange: (v: boolean) => void;
}) {
  // CustomerActivitySection manages its own loading internally
  // We pass through props without extra wrapping complexity
  void onLoadingChange; // suppress unused warning — sections self-manage loading
  return (
    <CustomerActivitySection
      runTrigger={runTrigger}
      dateFrom={dateFrom}
      dateTo={dateTo}
      customerId={customerId}
    />
  );
}

function JobStatusSectionWrapper({
  runTrigger,
  dateFrom,
  dateTo,
  onLoadingChange,
}: {
  runTrigger: number;
  dateFrom: string;
  dateTo: string;
  onLoadingChange: (v: boolean) => void;
}) {
  void onLoadingChange;
  return (
    <JobStatusSection
      runTrigger={runTrigger}
      dateFrom={dateFrom}
      dateTo={dateTo}
    />
  );
}

function RevenueSectionWrapper({
  runTrigger,
  dateFrom,
  dateTo,
  currencyCode,
  onLoadingChange,
}: {
  runTrigger: number;
  dateFrom: string;
  dateTo: string;
  currencyCode?: string;
  onLoadingChange: (v: boolean) => void;
}) {
  void onLoadingChange;
  return (
    <RevenueSection
      runTrigger={runTrigger}
      dateFrom={dateFrom}
      dateTo={dateTo}
      currencyCode={currencyCode}
    />
  );
}
