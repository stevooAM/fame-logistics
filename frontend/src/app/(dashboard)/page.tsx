import AgGridDemo from "@/components/demo/ag-grid-demo";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2" style={{ color: "#2B3E50" }}>
        Dashboard
      </h1>
      <p className="text-gray-500 mb-6">Welcome to Fame FMS — freight management overview</p>
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-4" style={{ color: "#2B3E50" }}>
          Recent Jobs (Demo Data)
        </h2>
        <AgGridDemo />
      </div>
    </div>
  );
}
