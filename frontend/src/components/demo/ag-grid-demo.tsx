"use client";

import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

const mockData = [
  { jobNo: "FMS-2026-00001", customer: "Acme Shipping Ltd", type: "Import", status: "Draft", date: "2026-01-15" },
  { jobNo: "FMS-2026-00002", customer: "Global Trade Co", type: "Export", status: "Pending", date: "2026-01-16" },
  { jobNo: "FMS-2026-00003", customer: "West Africa Freight", type: "Transit", status: "In Progress", date: "2026-01-17" },
  { jobNo: "FMS-2026-00004", customer: "Tema Port Services", type: "Local", status: "Delivered", date: "2026-01-18" },
  { jobNo: "FMS-2026-00005", customer: "Ghana Logistics Hub", type: "Import", status: "Closed", date: "2026-01-19" },
  { jobNo: "FMS-2026-00006", customer: "Atlantic Cargo GH", type: "Export", status: "Draft", date: "2026-01-20" },
  { jobNo: "FMS-2026-00007", customer: "Meridian Freight", type: "Transit", status: "Pending", date: "2026-01-21" },
];

const columnDefs = [
  { field: "jobNo", headerName: "Job No", sortable: true, filter: true, resizable: true, minWidth: 140 },
  { field: "customer", headerName: "Customer", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "type", headerName: "Type", sortable: true, filter: true, resizable: true, width: 100 },
  { field: "status", headerName: "Status", sortable: true, filter: true, resizable: true, width: 120 },
  { field: "date", headerName: "Date", sortable: true, filter: true, resizable: true, width: 110 },
];

export default function AgGridDemo() {
  return (
    <div className="ag-theme-alpine" style={{ height: 350, width: "100%" }}>
      <AgGridReact
        rowData={mockData}
        columnDefs={columnDefs}
        pagination={true}
        paginationPageSize={10}
      />
    </div>
  );
}
