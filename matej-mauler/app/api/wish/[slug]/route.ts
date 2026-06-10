import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { isRedLink } from "@/lib/encyclopedia/graph";

type Ctx = { params: Promise<{ slug: string }> };

let ready = false;
async function ensure(sql: ReturnType<typeof getDb>) {
  if (ready) return;
  await sql`CREATE TABLE IF NOT EXISTS topic_wishes (
    slug TEXT PRIMARY KEY,
    votes INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  ready = true;
}

const valid = (slug: string) => /^[a-z0-9-]{1,64}$/.test(slug) && isRedLink(slug);

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { slug } = await ctx.params;
  if (!valid(slug)) return NextResponse.json({ votes: 0 });
  try {
    const sql = getDb();
    await ensure(sql);
    const [row] = await sql`SELECT votes FROM topic_wishes WHERE slug = ${slug}` as { votes: number }[];
    return NextResponse.json({ votes: row?.votes ?? 0 });
  } catch {
    return NextResponse.json({ votes: 0 });
  }
}

export async function POST(_req: NextRequest, ctx: Ctx) {
  const { slug } = await ctx.params;
  if (!valid(slug)) return NextResponse.json({ error: "unknown topic" }, { status: 400 });
  try {
    const sql = getDb();
    await ensure(sql);
    const [row] = await sql`INSERT INTO topic_wishes (slug, votes) VALUES (${slug}, 1)
      ON CONFLICT (slug) DO UPDATE SET votes = topic_wishes.votes + 1, updated_at = NOW()
      RETURNING votes` as { votes: number }[];
    return NextResponse.json({ votes: row.votes });
  } catch {
    return NextResponse.json({ error: "db" }, { status: 500 });
  }
}
