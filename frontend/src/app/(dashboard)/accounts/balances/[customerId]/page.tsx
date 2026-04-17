import { notFound } from "next/navigation";
import { CustomerBalanceDetail } from "./components/CustomerBalanceDetail";

interface Props {
  params: Promise<{ customerId: string }>;
}

export default async function CustomerBalancePage({ params }: Props) {
  const { customerId } = await params;
  const id = Number(customerId);

  if (!Number.isFinite(id) || id <= 0) {
    notFound();
  }

  return <CustomerBalanceDetail customerId={id} />;
}
