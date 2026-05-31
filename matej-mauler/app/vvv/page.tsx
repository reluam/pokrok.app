import { VVVApp } from "@/components/VVVApp";
import { getDb } from "@/lib/db";

export const metadata = {
  title: "VVV — Veškeré vesmírné vědění",
  description: "Encyklopedie kompletnější, než-li doposud uznáván Stopařův průvodce po galaxii.",
};

async function getTerms() {
  try {
    const sql = getDb();
    return await sql`
      SELECT id, slug, name, description, source, author_name, votes, created_at
      FROM vvv_terms ORDER BY votes DESC, created_at ASC
    `;
  } catch {
    return [];
  }
}

export default async function VVVPage() {
  const terms = await getTerms();
  return <VVVApp initialTerms={terms as VVVTerm[]} />;
}

export type VVVTerm = {
  id: number;
  slug: string;
  name: string;
  description: string;
  source: string;
  author_name: string;
  votes: number;
  created_at: string;
};
