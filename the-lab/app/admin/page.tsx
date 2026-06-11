import { AdminDashboard } from "@/components/AdminDashboard";
import { getAllExperiments } from "@/lib/experimentsDb";
import { getBrainStats, adminListWords, type AdminBrainWord } from "@/lib/brainDb";

export const dynamic = "force-dynamic";
export const metadata = { title: "The Lab HQ" };

async function getData() {
  let published = 0, drafts = 0, words = 0, edges = 0, total = 0;
  let list: AdminBrainWord[] = [];
  try {
    const rows = await getAllExperiments();
    published = rows.filter((r) => r.published).length;
    drafts = rows.length - published;
  } catch {}
  try {
    const s = await getBrainStats();
    words = s.words; edges = s.edges; total = s.total;
    list = await adminListWords();
  } catch {}
  return { stats: { published, drafts, words, edges, total }, list };
}

export default async function AdminPage() {
  const { stats, list } = await getData();
  return <AdminDashboard stats={stats} initialWords={list} />;
}
