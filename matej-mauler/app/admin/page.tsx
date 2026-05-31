import { AdminDashboard, type Term, type Clarification } from "@/components/AdminDashboard";
import { getDb } from "@/lib/db";

export const metadata = { title: "Spaghetti HQ — Admin" };

async function getStats() {
  try {
    const sql = getDb();
    const [termCount] = await sql`SELECT COUNT(*)::int AS count FROM vvv_terms`;
    const [clarifCount] = await sql`SELECT COUNT(*)::int AS count FROM vvv_clarifications`;
    const [voteCount] = await sql`SELECT COALESCE(SUM(votes),0)::int AS count FROM vvv_terms`;
    const terms = await sql`
      SELECT t.id, t.slug, t.name, t.source, t.author_name, t.votes, t.created_at,
        (SELECT COUNT(*)::int FROM vvv_clarifications c WHERE c.term_slug = t.slug) AS clarif_count
      FROM vvv_terms t ORDER BY t.created_at DESC
    `;
    const clarifications = await sql`
      SELECT c.id, c.term_slug, c.content, c.author_name, c.created_at,
        t.name AS term_name
      FROM vvv_clarifications c
      JOIN vvv_terms t ON t.slug = c.term_slug
      ORDER BY c.created_at DESC
      LIMIT 100
    `;
    return {
      stats: {
        terms: termCount.count,
        clarifications: clarifCount.count,
        votes: voteCount.count,
      },
      terms,
      clarifications,
    };
  } catch {
    return { stats: { terms: 0, clarifications: 0, votes: 0 }, terms: [], clarifications: [] };
  }
}

export default async function AdminPage() {
  const data = await getStats();
  return (
    <AdminDashboard
      stats={data.stats}
      terms={data.terms as Term[]}
      clarifications={data.clarifications as Clarification[]}
    />
  );
}
