import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { sql } from "@/lib/database";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuthenticated = await verifySession();
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const exists = await sql`SELECT 1 FROM leads WHERE id = ${id} LIMIT 1` as { "?column?": number }[];
    if (exists.length === 0) {
      return NextResponse.json({ error: "Kontakt nenalezen." }, { status: 404 });
    }

    try {
      await sql`DELETE FROM bookings WHERE lead_id = ${id}`;
    } catch {
      /* bookings table may not exist */
    }
    await sql`DELETE FROM leads WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/leads/[id] error:", error);
    return NextResponse.json(
      { error: "Nepodařilo se odstranit kontakt." },
      { status: 500 }
    );
  }
}
