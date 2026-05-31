import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

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
    if (!content?.trim() || content.trim().length < 10) {
      return NextResponse.json({ error: "Upřesnění je příliš krátké (min. 10 znaků)." }, { status: 400 });
    }

    const author = authorName?.trim() || "Neznámý dobrodinec";
    const sql = getDb();

    const [row] = await sql`
      INSERT INTO vvv_clarifications (term_slug, content, author_name)
      VALUES (${slug}, ${content.trim()}, ${author})
      RETURNING *
    `;

    return NextResponse.json(row, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
