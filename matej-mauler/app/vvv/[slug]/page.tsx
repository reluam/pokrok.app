import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { VVVTermDetail } from "@/components/VVVTermDetail";

export const dynamicParams = true;

export type VVVTerm = {
  id: number; slug: string; name: string;
  description: string; source: string;
  author_name: string; votes: number; created_at: string;
};

export type VVVClarification = {
  id: number; term_slug: string;
  content: string; author_name: string; created_at: string;
};

async function getData(slug: string) {
  try {
    const sql = getDb();
    const [term] = await sql`SELECT * FROM vvv_terms WHERE slug = ${slug}`;
    if (!term) return null;
    const clarifications = await sql`
      SELECT * FROM vvv_clarifications WHERE term_slug = ${slug} ORDER BY created_at DESC
    `;
    return { term: term as VVVTerm, clarifications: clarifications as VVVClarification[] };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getData(slug);
  return { title: data ? `${data.term.name} — VVV` : "VVV" };
}

export default async function TermPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getData(slug);
  if (!data) notFound();
  return <VVVTermDetail term={data.term} initialClarifications={data.clarifications} />;
}
