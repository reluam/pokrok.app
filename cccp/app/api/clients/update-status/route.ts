import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { sql } from "../../../../lib/db";

type ClientStatus = "aktivni" | "neaktivni";

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { id?: string; status?: ClientStatus }
    | null;

  const id = body?.id ?? "";
  const status = body?.status ?? "";

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  if (!["aktivni", "neaktivni"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const rows = (await sql`
    UPDATE clients
    SET status = ${status}, updated_at = NOW()
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING lead_id
  `) as { lead_id: string | null }[];

  if (rows.length === 0) {
    return NextResponse.json({ error: "Klient nenalezen" }, { status: 404 });
  }

  const leadId = rows[0].lead_id;

  if (leadId) {
    if (status === "neaktivni") {
      await sql`
        UPDATE leads
        SET status = 'neaktivni', updated_at = NOW()
        WHERE id = ${leadId}
      `;
    } else {
      await sql`
        UPDATE leads
        SET status = 'spoluprace', updated_at = NOW()
        WHERE id = ${leadId}
      `;
    }
  }

  return NextResponse.json({ ok: true });
}

