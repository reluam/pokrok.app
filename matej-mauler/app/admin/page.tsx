import { AdminHome } from "@/components/AdminHome";
import { getDb } from "@/lib/db";
import { getProjectMetrics, type ProjectMetrics } from "@/lib/metricsDb";
import { countUnclassified, getBrainStats, type BrainStats } from "@/lib/brainDb";
import { getAllExperiments, type ExperimentRow } from "@/lib/experimentsDb";
import { getTextOverrides } from "@/lib/siteTextsDb";
import { graphData } from "@/lib/encyclopedia/graph";

export const dynamic = "force-dynamic";
export const metadata = { title: "Spaghetti HQ" };

export type DashboardData = {
  metrics: ProjectMetrics[];
  brain: { cs: BrainStats | null; en: BrainStats | null };
  brainUnclassified: number;
  radio: { rounds: number; votes: number } | null;
  ency: { terms: number; synapses: number; reds: number; wishes: number };
  rows: ExperimentRow[];
  overrides: { cs: Record<string, string>; en: Record<string, string> };
};

async function getData(): Promise<DashboardData> {
  const sql = getDb();
  const g = graphData();
  const reds = g.nodes.filter((n) => !n.realm).length;

  const [metrics, brainCs, brainEn, unclassified, rows, ovCs, ovEn] = await Promise.all([
    getProjectMetrics().catch(() => [] as ProjectMetrics[]),
    getBrainStats("cs").catch(() => null),
    getBrainStats("en").catch(() => null),
    countUnclassified().catch(() => 0),
    getAllExperiments().catch(() => [] as ExperimentRow[]),
    getTextOverrides("cs").catch(() => ({})),
    getTextOverrides("en").catch(() => ({})),
  ]);

  let radio: { rounds: number; votes: number } | null = null;
  try {
    const [r] = await sql`SELECT
      (SELECT COUNT(*)::int FROM radio_rounds) AS rounds,
      (SELECT COUNT(*)::int FROM radio_round_votes) AS votes` as { rounds: number; votes: number }[];
    radio = r;
  } catch {}

  let wishes = 0;
  try {
    const [w] = await sql`SELECT COALESCE(SUM(votes), 0)::int AS n FROM topic_wishes` as { n: number }[];
    wishes = w.n;
  } catch {}

  return {
    metrics,
    brain: { cs: brainCs, en: brainEn },
    brainUnclassified: unclassified,
    radio,
    ency: { terms: g.nodes.length - reds - 1, synapses: g.edges.length, reds, wishes },
    rows,
    overrides: { cs: ovCs, en: ovEn },
  };
}

export default async function AdminPage() {
  const data = await getData();
  return <AdminHome data={data} />;
}
