import { ExperimentsAdmin } from "@/components/ExperimentsAdmin";
import { getAllExperiments, type ExperimentRow } from "@/lib/experimentsDb";

export const dynamic = "force-dynamic";
export const metadata = { title: "Experimenty — Spaghetti HQ" };

export default async function ExperimentsAdminPage() {
  let rows: ExperimentRow[] = [];
  try { rows = await getAllExperiments(); } catch { rows = []; }
  return <ExperimentsAdmin initial={rows} />;
}
