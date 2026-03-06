import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { sql } from "@/lib/database";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  const ok = await verifySession();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = (await sql`
      SELECT 
        b.id,
        b.created_at,
        b.meeting_type,
        bs.start_at,
        bs.duration_minutes,
        l.id AS lead_id,
        l.email,
        l.name,
        l.source,
        l.status,
        l.message
      FROM bookings b
      JOIN booking_slots bs ON bs.id = b.slot_id
      JOIN leads l ON l.id = b.lead_id
      ORDER BY bs.start_at DESC, b.created_at DESC
    `) as {
      id: string;
      created_at: Date;
      meeting_type: string | null;
      start_at: Date;
      duration_minutes: number;
      lead_id: string;
      email: string;
      name: string | null;
      source: string;
      status: string;
      message: string | null;
    }[];

    const bookings = rows.map((r) => ({
      id: r.id,
      createdAt: r.created_at.toISOString(),
      meetingType: r.meeting_type,
      slotAt: r.start_at.toISOString(),
      durationMinutes: r.duration_minutes,
      leadId: r.lead_id,
      email: r.email,
      name: r.name,
      source: r.source,
      status: r.status,
      note: r.message,
    }));

    return NextResponse.json({ bookings });
  } catch (err) {
    console.error("GET /api/admin/bookings error:", err);
    return NextResponse.json(
      { error: "Chyba načtení schůzek." },
      { status: 500 }
    );
  }
}

