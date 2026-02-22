import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { sql } from "@/lib/database";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ok = await verifySession();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Chybí id" }, { status: 400 });
  try {
    const existing = await sql`SELECT 1 FROM bookings WHERE slot_id = ${id} LIMIT 1`;
    if (existing.length > 0) {
      return NextResponse.json({ error: "Slot již má rezervaci, nelze smazat." }, { status: 400 });
    }
    await sql`DELETE FROM booking_slots WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Chyba mazání" }, { status: 500 });
  }
}
