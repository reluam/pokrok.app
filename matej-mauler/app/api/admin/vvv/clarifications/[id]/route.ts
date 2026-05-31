import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

function isAdmin(req: NextRequest) {
  return req.cookies.get("admin_token")?.value === process.env.ADMIN_SECRET;
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const sql = getDb();
  await sql`DELETE FROM vvv_clarifications WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
