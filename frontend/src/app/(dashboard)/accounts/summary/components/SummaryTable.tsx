import type { PeriodSummaryResponse } from "@/lib/summaries-api";

interface SummaryTableProps {
  data: PeriodSummaryResponse;
}

function fmtMoney(value: string | number): string {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
  }).format(Number(value));
}

export default function SummaryTable({ data }: SummaryTableProps) {
  if (data.rows.length === 0) {
    return (
      <div className="rounded border border-gray-200 px-6 py-10 text-center text-sm text-gray-400">
        No invoices in this date range.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <th className="px-4 py-3">Period</th>
            <th className="px-4 py-3 text-right">Invoiced (GHS)</th>
            <th className="px-4 py-3 text-right">Paid (GHS)</th>
            <th className="px-4 py-3 text-right">Outstanding (GHS)</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row) => {
            const hasOutstanding = Number(row.outstanding) > 0;
            return (
              <tr
                key={row.period_start}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3 text-gray-700 font-medium">
                  {row.period_label}
                </td>
                <td className="px-4 py-3 text-right text-gray-700">
                  {fmtMoney(row.invoiced)}
                </td>
                <td className="px-4 py-3 text-right text-gray-700">
                  {fmtMoney(row.paid)}
                </td>
                <td
                  className={`px-4 py-3 text-right ${
                    hasOutstanding
                      ? "text-red-600 font-semibold"
                      : "text-gray-700"
                  }`}
                >
                  {fmtMoney(row.outstanding)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold text-gray-800">
            <td className="px-4 py-3">Totals</td>
            <td className="px-4 py-3 text-right">{fmtMoney(data.totals.invoiced)}</td>
            <td className="px-4 py-3 text-right">{fmtMoney(data.totals.paid)}</td>
            <td
              className={`px-4 py-3 text-right ${
                Number(data.totals.outstanding) > 0
                  ? "text-red-600"
                  : "text-gray-800"
              }`}
            >
              {fmtMoney(data.totals.outstanding)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
