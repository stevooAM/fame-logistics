import dynamic from "next/dynamic";

const BalancesSection = dynamic(
  () => import("./components/BalancesSection").then((m) => m.BalancesSection),
  { ssr: false }
);

export default function BalancesPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#2B3E50]">Outstanding Balances</h1>
        <p className="text-sm text-gray-500 mt-1">
          Per-customer outstanding balances with invoice details
        </p>
      </div>

      <BalancesSection />
    </div>
  );
}
