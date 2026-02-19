import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { sql } from "../../../../lib/db";
import type { LeadStatus } from "../../../../lib/leads";

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as
    | { id?: string; status?: LeadStatus }
    | null;

  const id = body?.id ?? "";
  const status = body?.status ?? "";

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  if (!["novy", "uvodni_call", "nabidka", "spoluprace", "neaktivni"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  await sql`
    UPDATE leads
    SET status = ${status}, updated_at = NOW()
    WHERE id = ${id}
  `;

  if (status === "spoluprace") {
    const clientId = crypto.randomUUID();
    await sql`
      INSERT INTO clients (id, lead_id, name, email, status, created_at, updated_at)
      SELECT ${clientId}, id, COALESCE(name, email), email, 'aktivni', NOW(), NOW()
      FROM leads
      WHERE id = ${id}
        AND NOT EXISTS (
          SELECT 1 FROM clients c WHERE c.lead_id = leads.id
        )
    `;

    await sql`
      UPDATE clients
      SET status = 'aktivni', updated_at = NOW()
      WHERE lead_id = ${id}
    `;
  } else if (status === "neaktivni") {
    await sql`
      UPDATE clients
      SET status = 'neaktivni', updated_at = NOW()
      WHERE lead_id = ${id}
    `;
  }

  return NextResponse.json({ ok: true });
}

