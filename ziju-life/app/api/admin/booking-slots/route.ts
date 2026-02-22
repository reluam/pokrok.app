import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { sql } from "@/lib/database";

export async function GET() {
  const ok = await verifySession();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const now = new Date();
    const rows = await sql`
      SELECT bs.id, bs.start_at, bs.duration_minutes, bs.title, bs.created_at,
             (SELECT 1 FROM bookings b WHERE b.slot_id = bs.id LIMIT 1) AS is_booked
      FROM booking_slots bs
      WHERE bs.start_at >= ${now}
      ORDER BY bs.start_at ASC
    ` as { id: string; start_at: string; duration_minutes: number; title: string | null; created_at: string; is_booked?: unknown }[];
    const slots = rows.map((r) => ({
      id: r.id,
      startAt: r.start_at,
      durationMinutes: r.duration_minutes,
      title: r.title,
      createdAt: r.created_at,
      isBooked: !!r.is_booked,
    }));
    return NextResponse.json({ slots });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Chyba načtení" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const ok = await verifySession();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const startAt = body.startAt ?? body.start_at;
    const durationMinutes = Number(body.durationMinutes ?? body.duration_minutes ?? 30);
    if (!startAt || durationMinutes < 5 || durationMinutes > 480) {
      return NextResponse.json({ error: "Neplatné datum nebo délka (5–480 min)." }, { status: 400 });
    }
    const start = new Date(startAt);
    if (Number.isNaN(start.getTime())) {
      return NextResponse.json({ error: "Neplatné datum." }, { status: 400 });
    }
    const id = `slot_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    await sql`
      INSERT INTO booking_slots (id, start_at, duration_minutes, title, created_at)
      VALUES (${id}, ${start}, ${durationMinutes}, ${body.title ?? null}, NOW())
    `;
    return NextResponse.json({ success: true, id, startAt: start.toISOString(), durationMinutes });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Chyba ukládání" }, { status: 500 });
  }
}
