import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { sql } from "../../../../../lib/db";

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const [row] = await sql`
    SELECT deleted_at FROM leads WHERE id = ${id}
  ` as { deleted_at: string | null }[];

  if (!row) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }
  if (!row.deleted_at) {
    return NextResponse.json({ ok: true }); // already restored
  }

  const deletedAt = new Date(row.deleted_at).getTime();
  const now = Date.now();
  if (now - deletedAt > FORTY_EIGHT_HOURS_MS) {
    return NextResponse.json(
      { error: "Restore only possible within 48 hours of deletion" },
      { status: 400 }
    );
  }

  await sql`
    UPDATE leads
    SET deleted_at = NULL, updated_at = NOW()
    WHERE id = ${id}
  `;

  return NextResponse.json({ ok: true });
}
