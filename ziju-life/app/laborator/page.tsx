import { redirect } from "next/navigation";
import { checkLaboratorAccess } from "@/lib/laborator-auth";
import LaboratorSalesPage from "./LaboratorSalesPage";

export default async function LaboratorPage() {
  const hasAccess = await checkLaboratorAccess();
  if (hasAccess) redirect("/laborator/dashboard");
  return <LaboratorSalesPage />;
}
