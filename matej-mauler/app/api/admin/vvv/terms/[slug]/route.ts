import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

function isAdmin(req: NextRequest) {
  const token = req.cookies.get("admin_token")?.value;
  return token === process.env.ADMIN_SECRET;
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const sql = getDb();
  await sql`DELETE FROM vvv_terms WHERE slug = ${slug}`;
  await sql`DELETE FROM vvv_clarifications WHERE term_slug = ${slug}`;
  await sql`DELETE FROM vvv_votes WHERE term_slug = ${slug}`;
  return NextResponse.json({ ok: true });
}
