import { NextResponse } from "next/server";
import { sql } from "../../../../lib/db";

/** Public: resolve userSlug + eventSlug to event (for booking page). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userSlug = searchParams.get("userSlug")?.trim();
  const eventSlug = searchParams.get("eventSlug")?.trim();

  if (!userSlug || !eventSlug) {
    return NextResponse.json(
      { error: "userSlug and eventSlug are required" },
      { status: 400 }
    );
  }

  const userRow = await sql`
    SELECT user_id FROM user_booking_slug WHERE slug = ${userSlug} LIMIT 1
  ` as { user_id: string }[];

  if (userRow.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userId = userRow[0].user_id;

  const eventRows = await sql`
    SELECT e.id, e.user_id, e.slug, e.name, e.duration_minutes,
           COALESCE(s.first_day_of_week, 1) AS first_day_of_week
    FROM events e
    LEFT JOIN user_settings s ON s.user_id = e.user_id
    WHERE e.user_id = ${userId} AND e.slug = ${eventSlug}
    LIMIT 1
  ` as { id: string; user_id: string; slug: string; name: string; duration_minutes: number; first_day_of_week: number }[];

  if (eventRows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const event = eventRows[0];
  return NextResponse.json({
    id: event.id,
    user_id: event.user_id,
    slug: event.slug,
    name: event.name,
    duration_minutes: event.duration_minutes,
    first_day_of_week: event.first_day_of_week ?? 1,
    user_slug: userSlug,
    event_slug: eventSlug,
  });
}
