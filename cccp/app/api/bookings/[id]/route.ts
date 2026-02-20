import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { sql } from "../../../../lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const rows = await sql`
    SELECT
      b.id,
      b.user_id,
      b.scheduled_at,
      b.duration_minutes,
      b.name,
      b.email,
      b.phone,
      b.note,
      b.status,
      b.source,
      b.lead_id,
      b.event_id,
      b.created_at,
      l.id AS lead_id_ref,
      l.name AS lead_name,
      l.email AS lead_email,
      l.status AS lead_status,
      e.id AS event_id_ref,
      e.name AS event_name,
      e.slug AS event_slug,
      ubs.slug AS user_booking_slug
    FROM bookings b
    LEFT JOIN leads l ON l.id = b.lead_id
    LEFT JOIN events e ON e.id = b.event_id AND e.user_id = b.user_id
    LEFT JOIN user_booking_slug ubs ON ubs.user_id = b.user_id
    WHERE b.id = ${id} AND b.user_id = ${userId}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const r = rows[0] as {
    id: string;
    user_id: string;
    scheduled_at: string;
    duration_minutes: number;
    name: string;
    email: string;
    phone: string | null;
    note: string | null;
    status: string;
    source: string | null;
    lead_id: string | null;
    event_id: string | null;
    created_at: string;
    lead_id_ref: string | null;
    lead_name: string | null;
    lead_email: string | null;
    lead_status: string | null;
    event_id_ref: string | null;
    event_name: string | null;
    event_slug: string | null;
    user_booking_slug: string | null;
  };

  const bookingLink =
    r.user_booking_slug && r.event_slug
      ? `/book/${r.user_booking_slug}/${r.event_slug}`
      : null;

  return NextResponse.json({
    id: r.id,
    scheduled_at: r.scheduled_at,
    duration_minutes: r.duration_minutes,
    name: r.name,
    email: r.email,
    phone: r.phone,
    note: r.note,
    status: r.status,
    source: r.source ?? null,
    created_at: r.created_at,
    lead: r.lead_id_ref
      ? {
          id: r.lead_id_ref,
          name: r.lead_name,
          email: r.lead_email,
          status: r.lead_status,
        }
      : null,
    event: r.event_id_ref
      ? { id: r.event_id_ref, name: r.event_name, slug: r.event_slug }
      : null,
    booking_link: bookingLink,
  });
}
