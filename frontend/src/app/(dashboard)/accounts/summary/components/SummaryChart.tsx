import type { PeriodSummaryRow } from "@/lib/summaries-api";

interface SummaryChartProps {
  rows: PeriodSummaryRow[];
}

const BAR_MAX_HEIGHT = 120; // px

export default function SummaryChart({ rows }: SummaryChartProps) {
  if (rows.length === 0) return null;

  const maxVal = Math.max(
    ...rows.flatMap((r) => [Number(r.invoiced), Number(r.paid)]),
    1
  );

  function barHeight(value: string | number): number {
    const ratio = Number(value) / maxVal;
    return Math.max(Math.round(ratio * BAR_MAX_HEIGHT), 2);
  }

  return (
    <div className="rounded border border-gray-200 bg-white p-4">
      {/* Legend */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-[#1F7A8C]" />
          <span className="text-xs text-gray-600">Invoiced</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-[#F89C1C]" />
          <span className="text-xs text-gray-600">Paid</span>
        </div>
      </div>

      {/* Chart */}
      <div className="overflow-x-auto">
        <div
          className="flex items-end gap-3 min-w-0"
          style={{ minHeight: `${BAR_MAX_HEIGHT + 32}px` }}
        >
          {rows.map((row) => {
            const invoicedH = barHeight(row.invoiced);
            const paidH = barHeight(row.paid);
            return (
              <div
                key={row.period_start}
                className="flex flex-col items-center gap-1"
                style={{ minWidth: "48px" }}
              >
                {/* Bars */}
                <div
                  className="flex items-end gap-0.5"
                  style={{ height: `${BAR_MAX_HEIGHT}px` }}
                >
                  {/* Invoiced bar — teal */}
                  <div
                    title={`Invoiced: ${row.invoiced}`}
                    style={{
                      height: `${invoicedH}px`,
                      width: "18px",
                      backgroundColor: "#1F7A8C",
                      borderRadius: "2px 2px 0 0",
                    }}
                  />
                  {/* Paid bar — amber */}
                  <div
                    title={`Paid: ${row.paid}`}
                    style={{
                      height: `${paidH}px`,
                      width: "18px",
                      backgroundColor: "#F89C1C",
                      borderRadius: "2px 2px 0 0",
                    }}
                  />
                </div>
                {/* Label */}
                <span className="text-[10px] text-gray-500 text-center leading-tight whitespace-nowrap">
                  {row.period_label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
