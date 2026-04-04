"use client";

import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const mockData = [
  { jobNo: "FMS-2026-00001", customer: "Acme Shipping Ltd", type: "Import", status: "Draft", date: "2026-01-15" },
  { jobNo: "FMS-2026-00002", customer: "Global Trade Co", type: "Export", status: "Pending", date: "2026-01-16" },
  { jobNo: "FMS-2026-00003", customer: "West Africa Freight", type: "Transit", status: "In Progress", date: "2026-01-17" },
  { jobNo: "FMS-2026-00004", customer: "Tema Port Services", type: "Local", status: "Delivered", date: "2026-01-18" },
  { jobNo: "FMS-2026-00005", customer: "Ghana Logistics Hub", type: "Import", status: "Closed", date: "2026-01-19" },
];

const columnDefs = [
  { field: "jobNo", headerName: "Job No", sortable: true, filter: true, resizable: true },
  { field: "customer", headerName: "Customer", sortable: true, filter: true, resizable: true },
  { field: "type", headerName: "Type", sortable: true, filter: true, resizable: true },
  { field: "status", headerName: "Status", sortable: true, filter: true, resizable: true },
  { field: "date", headerName: "Date", sortable: true, filter: true, resizable: true },
];

export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-h1 mb-4" style={{ color: "#1F7A8C" }}>Fame FMS</h1>
      <p className="text-body mb-4">Freight Management System — Demo</p>
      <div className="flex gap-4 mb-6">
        <Button style={{ backgroundColor: "#1F7A8C" }}>Create Job</Button>
        <Badge style={{ backgroundColor: "#F89C1C" }}>5 Active Jobs</Badge>
      </div>
      <div className="ag-theme-alpine" style={{ height: 300, width: "100%" }}>
        <AgGridReact
          rowData={mockData}
          columnDefs={columnDefs}
        />
      </div>
    </main>
  );
}
