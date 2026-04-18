import type { Metadata } from "next";
import ReportsClient from "./components/ReportsClient";

export const metadata: Metadata = {
  title: "Reports | Fame FMS",
};

export default function ReportsPage() {
  return <ReportsClient />;
}
