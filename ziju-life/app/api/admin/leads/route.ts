import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { sql } from "@/lib/database";
import type { Lead } from "@/lib/leads-db";

export async function GET(request: NextRequest) {
  const isAuthenticated = await verifySession();
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let rows: (Lead & { reservationDate?: string | null })[];
    try {
      rows = (await sql`
        SELECT 
          l.id,
          l.email,
          l.name,
          l.source,
          l.status,
          l.message,
          l.created_at::text as "createdAt",
          l.updated_at::text as "updatedAt",
          (SELECT bs.start_at::text
           FROM bookings b
           JOIN booking_slots bs ON b.slot_id = bs.id
           WHERE b.lead_id = l.id
           ORDER BY bs.start_at DESC
           LIMIT 1) as "reservationDate"
        FROM leads l
        ORDER BY l.created_at DESC
      `) as (Lead & { reservationDate: string | null })[];
    } catch {
      rows = (await sql`
        SELECT id, email, name, source, status, message,
          created_at::text as "createdAt", updated_at::text as "updatedAt"
        FROM leads
        ORDER BY created_at DESC
      `) as (Lead & { reservationDate?: null })[];
      rows = rows.map((r) => ({ ...r, reservationDate: null }));
    }

    const leads = rows.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      reservationDate: r.reservationDate ?? null,
    }));

    return NextResponse.json({ leads });
  } catch (error) {
    console.error("GET /api/admin/leads error:", error);
    return NextResponse.json(
      { error: "Nepodařilo se načíst leady." },
      { status: 500 }
    );
  }
}
