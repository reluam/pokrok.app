import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ensureVvvSchema } from "@/lib/vvvSchema";

function makeSlug(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "term-" + Date.now();
}

export async function GET() {
  try {
    const sql = getDb();
    await ensureVvvSchema(sql);
    const rows = await sql`
      SELECT id, slug, name, description, source, author_name, votes, created_at
      FROM vvv_terms
      ORDER BY votes DESC, created_at ASC
    `;
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, description, authorName, captchaA, captchaB, captchaAnswer } = await req.json();

    if (Number(captchaAnswer) !== Number(captchaA) + Number(captchaB)) {
      return NextResponse.json({ error: "Špatná odpověď na captchu." }, { status: 400 });
    }
    if (!name?.trim() || name.trim().length < 2) {
      return NextResponse.json({ error: "Název je příliš krátký." }, { status: 400 });
    }
    if (!description?.trim() || description.trim().length < 10) {
      return NextResponse.json({ error: "Popis je příliš krátký (min. 10 znaků)." }, { status: 400 });
    }

    const slug = makeSlug(name.trim());
    const author = authorName?.trim() || "Neznámý dobrodinec";

    const sql = getDb();
    await ensureVvvSchema(sql);
    const [row] = await sql`
      INSERT INTO vvv_terms (slug, name, description, source, author_name)
      VALUES (${slug}, ${name.trim()}, ${description.trim()}, 'Komunita', ${author})
      ON CONFLICT (slug) DO UPDATE SET slug = vvv_terms.slug
      RETURNING *
    `;

    return NextResponse.json(row, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
