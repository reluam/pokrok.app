import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/adminAuth";
import JourneyAdmin from "@/components/journey/JourneyAdmin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Journey — editor" };

export default async function JourneyAdminPage() {
  if (!(await isAdmin())) notFound();
  return <JourneyAdmin />;
}
