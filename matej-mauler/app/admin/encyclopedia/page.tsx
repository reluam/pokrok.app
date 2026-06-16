import { EncyclopediaAdmin } from "@/components/EncyclopediaAdmin";
import { getDb } from "@/lib/db";
import type { Suggestion } from "@/app/api/admin/ency/suggest/route";

export const dynamic = "force-dynamic";
export const metadata = { title: "Encyclopedia — Spaghetti HQ" };

async function getData() {
  try {
    const sql = getDb();
    const wishes = await sql`SELECT slug, votes FROM topic_wishes ORDER BY votes DESC` as { slug: string; votes: number }[];
    let suggestions: Suggestion[] = [];
    try { suggestions = await sql`SELECT * FROM ency_suggestions ORDER BY id ASC` as Suggestion[]; } catch {}
    return { wishes, suggestions };
  } catch {
    return { wishes: [], suggestions: [] };
  }
}

export default async function AdminPage() {
  const { wishes, suggestions } = await getData();
  return <EncyclopediaAdmin wishes={wishes} suggestions={suggestions} />;
}
