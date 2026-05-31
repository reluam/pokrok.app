import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { voterKey } = await req.json();

    if (!voterKey) {
      return NextResponse.json({ error: "Chybí voterKey" }, { status: 400 });
    }

    const sql = getDb();

    await sql`
      INSERT INTO definition_votes (definition_id, voter_key)
      VALUES (${id}, ${voterKey})
    `;

    const [row] = await sql`
      UPDATE community_definitions
      SET votes = votes + 1
      WHERE id = ${id}
      RETURNING votes
    `;

    return NextResponse.json({ votes: row.votes });
  } catch (e: unknown) {
    const msg = String(e);
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return NextResponse.json({ error: "Již jsi hlasoval/a." }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
