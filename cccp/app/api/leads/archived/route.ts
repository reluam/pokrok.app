import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { sql } from "../../../../lib/db";

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

export type ArchivedLead = {
  id: string;
  email: string;
  name: string | null;
  source: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  deleted_at: string;
  can_restore: boolean;
};

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await sql`
    SELECT id, email, name, source, status, notes, created_at, deleted_at
    FROM leads
    WHERE deleted_at IS NOT NULL
    ORDER BY deleted_at DESC
  ` as { id: string; email: string; name: string | null; source: string | null; status: string; notes: string | null; created_at: string; deleted_at: string }[];

  const now = Date.now();
  const list: ArchivedLead[] = rows.map((r) => {
    const deletedAt = new Date(r.deleted_at).getTime();
    const canRestore = now - deletedAt <= FORTY_EIGHT_HOURS_MS;
    return {
      ...r,
      can_restore: canRestore,
    };
  });

  return NextResponse.json(list);
}
