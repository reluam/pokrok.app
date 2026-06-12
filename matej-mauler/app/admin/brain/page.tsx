import { BrainAdmin } from "@/components/BrainAdmin";
import { getAllExperiments } from "@/lib/experimentsDb";
import { getBrainStats, adminListWords, type AdminBrainWord } from "@/lib/brainDb";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mozek — Spaghetti HQ" };

async function getData() {
  let published = 0, drafts = 0, words = 0, edges = 0, total = 0;
  let list: AdminBrainWord[] = [];
  try {
    const rows = await getAllExperiments();
    published = rows.filter((r) => r.published).length;
    drafts = rows.length - published;
  } catch {}
  try {
    const s = await getBrainStats("cs");
    words = s.words; edges = s.edges; total = s.total;
    list = await adminListWords();
  } catch {}
  return { stats: { published, drafts, words, edges, total }, list };
}

export default async function BrainAdminPage() {
  const { stats, list } = await getData();
  return <BrainAdmin stats={stats} initialWords={list} />;
}
