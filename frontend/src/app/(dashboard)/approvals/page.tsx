import { ApprovalQueue } from "./components/ApprovalQueue";

export default function ApprovalsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#2B3E50" }}>
          Approval Queue
        </h1>
        <p className="text-sm text-gray-500 mt-1">Jobs awaiting your approval</p>
      </div>
      <ApprovalQueue />
    </div>
  );
}
