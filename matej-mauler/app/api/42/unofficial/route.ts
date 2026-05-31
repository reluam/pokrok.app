import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function GET() {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT
        ut.id,
        ut.slug,
        ut.name,
        ut.created_at,
        cd.content  AS latest_content,
        cd.author_name AS latest_author,
        cd.created_at  AS latest_def_at
      FROM unofficial_terms ut
      LEFT JOIN LATERAL (
        SELECT content, author_name, created_at
        FROM community_definitions
        WHERE term_slug = ut.slug
        ORDER BY created_at DESC
        LIMIT 1
      ) cd ON true
      ORDER BY ut.created_at DESC
    `;
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, content, authorName, captchaA, captchaB, captchaAnswer } = await req.json();

    if (Number(captchaAnswer) !== Number(captchaA) + Number(captchaB)) {
      return NextResponse.json({ error: "Špatná odpověď na captchu." }, { status: 400 });
    }
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: "Název je příliš krátký." }, { status: 400 });
    }
    if (!content || content.trim().length < 10) {
      return NextResponse.json({ error: "Definice je příliš krátká." }, { status: 400 });
    }

    const slug = toSlug(name.trim());
    if (!slug) return NextResponse.json({ error: "Neplatný název." }, { status: 400 });

    const sql = getDb();

    const [term] = await sql`
      INSERT INTO unofficial_terms (slug, name)
      VALUES (${slug}, ${name.trim()})
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING *
    `;

    await sql`
      INSERT INTO community_definitions (term_slug, content, author_name)
      VALUES (${term.slug}, ${content.trim()}, ${(authorName ?? "Anonym").trim() || "Anonym"})
    `;

    return NextResponse.json({ slug: term.slug }, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
