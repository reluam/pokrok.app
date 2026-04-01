import { redirect } from "next/navigation";
import { checkDilnaAccess } from "@/lib/dilna-auth";
import DilnaSalesPage from "./DilnaSalesPage";

export default async function DilnaPage() {
  const hasAccess = await checkDilnaAccess();
  if (hasAccess) redirect("/dilna/dashboard");
  return <DilnaSalesPage />;
}
