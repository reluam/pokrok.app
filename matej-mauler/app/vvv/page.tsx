import { VVVApp } from "@/components/VVVApp";
import { getDb } from "@/lib/db";
import { getLang } from "@/lib/getLang";
import { ensureVvvSchema } from "@/lib/vvvSchema";

export const metadata = {
  title: "VVV — Vast Void Vault",
  description: "An encyclopedia more complete than the Hitchhiker's Guide to the Galaxy.",
};

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
