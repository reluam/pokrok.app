import { redirect } from "next/navigation";
import { checkManualAccess } from "@/lib/manual-auth";
import ManualSalesPage from "./ManualSalesPage";

export default async function ManualPage() {
  const hasAccess = await checkManualAccess();
  if (hasAccess) redirect("/manual/dashboard");
  return <ManualSalesPage />;
}
