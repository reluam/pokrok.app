import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { sql } from "../../../lib/db";

export type WeeklyAvailabilityItem = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
};

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await sql`
    SELECT id, day_of_week, start_time::text AS start_time, end_time::text AS end_time, slot_duration_minutes
    FROM weekly_availability
    ORDER BY day_of_week, start_time
  `;
  const typedRows = rows as WeeklyAvailabilityItem[];
  const list = typedRows.map((r) => ({
    ...r,
    start_time: r.start_time?.slice(0, 5) ?? "",
    end_time: r.end_time?.slice(0, 5) ?? "",
  }));

  return NextResponse.json(list);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { windows?: Array<{
    id?: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    slot_duration_minutes?: number;
  }> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const windows = body.windows ?? [];
  for (const w of windows) {
    if (
      typeof w.day_of_week !== "number" ||
      w.day_of_week < 0 ||
      w.day_of_week > 6
    ) {
      return NextResponse.json(
        { error: "Invalid day_of_week (0-6)" },
        { status: 400 }
      );
    }
    if (!/^\d{1,2}:\d{2}(:\d{2})?$/.test(w.start_time ?? "") || !/^\d{1,2}:\d{2}(:\d{2})?$/.test(w.end_time ?? "")) {
      return NextResponse.json(
        { error: "start_time and end_time must be HH:mm or HH:mm:ss" },
        { status: 400 }
      );
    }
  }

  try {
    await sql`DELETE FROM weekly_availability`;
    for (const w of windows) {
      const id = w.id ?? crypto.randomUUID();
      const duration = w.slot_duration_minutes ?? 30;
      await sql`
        INSERT INTO weekly_availability (id, day_of_week, start_time, end_time, slot_duration_minutes)
        VALUES (${id}, ${w.day_of_week}, ${w.start_time.slice(0, 5)}::time, ${w.end_time.slice(0, 5)}::time, ${duration})
      `;
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/availability", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
