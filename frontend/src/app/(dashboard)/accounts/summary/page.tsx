import type { Metadata } from "next";
import { AccountsTabs } from "../components/AccountsTabs";
import SummarySection from "./components/SummarySection";

export const metadata: Metadata = {
  title: "Period Summary — Accounts",
};

export default function SummaryPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#2B3E50]">
          Financial Period Summary
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Aggregated invoicing and payment data by month or quarter
        </p>
      </div>

      <AccountsTabs />

      <SummarySection />
    </div>
  );
}
