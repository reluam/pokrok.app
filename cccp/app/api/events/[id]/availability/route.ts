import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { sql } from "../../../../../lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const event = await sql`
    SELECT id FROM events WHERE id = ${id} AND user_id = ${userId} LIMIT 1
  `;
  if (event.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const rows = await sql`
    SELECT id, event_id, day_of_week, start_time::text AS start_time, end_time::text AS end_time
    FROM event_availability
    WHERE event_id = ${id}
    ORDER BY day_of_week, start_time
  `;

  const list = (rows as { id: string; event_id: string; day_of_week: number; start_time: string; end_time: string }[]).map((r) => ({
    id: r.id,
    day_of_week: r.day_of_week,
    start_time: r.start_time?.slice(0, 5) ?? "",
    end_time: r.end_time?.slice(0, 5) ?? "",
  }));

  return NextResponse.json(list);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const event = await sql`
    SELECT id FROM events WHERE id = ${id} AND user_id = ${userId} LIMIT 1
  `;
  if (event.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: { windows?: Array<{ day_of_week: number; start_time: string; end_time: string }> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const windows = body.windows ?? [];
  for (const w of windows) {
    if (typeof w.day_of_week !== "number" || w.day_of_week < 0 || w.day_of_week > 6) {
      return NextResponse.json({ error: "Invalid day_of_week (0-6)" }, { status: 400 });
    }
    if (!/^\d{1,2}:\d{2}(:\d{2})?$/.test(w.start_time ?? "") || !/^\d{1,2}:\d{2}(:\d{2})?$/.test(w.end_time ?? "")) {
      return NextResponse.json({ error: "start_time and end_time must be HH:mm or HH:mm:ss" }, { status: 400 });
    }
  }

  await sql`DELETE FROM event_availability WHERE event_id = ${id}`;
  for (const w of windows) {
    const rowId = crypto.randomUUID();
    const startTime = w.start_time.slice(0, 5);
    const endTime = w.end_time.slice(0, 5);
    await sql`
      INSERT INTO event_availability (id, event_id, day_of_week, start_time, end_time)
      VALUES (${rowId}, ${id}, ${w.day_of_week}, ${startTime}::time, ${endTime}::time)
    `;
  }

  return NextResponse.json({ ok: true });
}
