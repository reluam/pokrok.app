import { VVVApp } from "@/components/VVVApp";
import { getDb } from "@/lib/db";
import { getLang } from "@/lib/getLang";
import { ensureVvvSchema } from "@/lib/vvvSchema";
import { guardExperiment } from "@/lib/experimentsDb";
import { experienceMetadata } from "@/lib/experienceMetadata";

export const dynamic = "force-dynamic";

export const generateMetadata = () => experienceMetadata("/vvv");

async function getTerms() {
  try {
    const sql = getDb();
    await ensureVvvSchema(sql);
    return await sql`
      SELECT id, slug, name, description, source, author_name, votes, created_at
      FROM vvv_terms ORDER BY votes DESC, created_at ASC
    `;
  } catch {
    return [];
  }
}

export default async function VVVPage() {
  await guardExperiment("vvv");
  const [terms, lang] = await Promise.all([getTerms(), getLang()]);
  return <VVVApp initialTerms={terms as VVVTerm[]} lang={lang} />;
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
