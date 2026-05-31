import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const sql = getDb();
    const rows = await sql`
      SELECT * FROM community_definitions
      WHERE term_slug = ${slug}
      ORDER BY votes DESC, created_at DESC
    `;
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { content, authorName, captchaA, captchaB, captchaAnswer } = await req.json();

    if (Number(captchaAnswer) !== Number(captchaA) + Number(captchaB)) {
      return NextResponse.json({ error: "Špatná odpověď na captchu." }, { status: 400 });
    }
    if (!content || content.trim().length < 10) {
      return NextResponse.json({ error: "Definice je příliš krátká (min. 10 znaků)." }, { status: 400 });
    }

    const sql = getDb();
    const [row] = await sql`
      INSERT INTO community_definitions (term_slug, content, author_name)
      VALUES (${slug}, ${content.trim()}, ${(authorName ?? "Anonym").trim() || "Anonym"})
      RETURNING *
    `;
    return NextResponse.json(row, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
