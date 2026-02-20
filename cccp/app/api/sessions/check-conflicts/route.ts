import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "../../../../lib/db";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    scheduled_at?: string;
    duration_minutes?: number;
    exclude_session_id?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const scheduledAt = body.scheduled_at;
  const durationMinutes = body.duration_minutes || 30;
  const excludeSessionId = body.exclude_session_id;

  if (!scheduledAt) {
    return NextResponse.json(
      { error: "scheduled_at is required" },
      { status: 400 }
    );
  }

  const date = new Date(scheduledAt);
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json(
      { error: "Invalid scheduled_at" },
      { status: 400 }
    );
  }

  const start = date.getTime();
  const end = start + durationMinutes * 60 * 1000;
  const startISO = new Date(start).toISOString();
  const endISO = new Date(end - 1).toISOString();

  type SessionConflictRow = { id: string; title: string; scheduled_at: string; duration_minutes: number; client_name: string };
  let sessionsRows: SessionConflictRow[];
  try {
    sessionsRows = excludeSessionId
      ? (await sql`
          SELECT s.id, s.title, s.scheduled_at, s.duration_minutes, COALESCE(c.name, 'Bez klienta') AS client_name
          FROM sessions s
          LEFT JOIN clients c ON c.id = s.client_id
          WHERE (s.user_id = ${userId} OR (s.user_id IS NULL AND c.user_id = ${userId}))
            AND s.scheduled_at IS NOT NULL
            AND s.scheduled_at < ${endISO}
            AND s.scheduled_at + (COALESCE(s.duration_minutes, 30) * interval '1 minute') > ${startISO}
            AND s.id != ${excludeSessionId}
        `) as SessionConflictRow[]
      : (await sql`
          SELECT s.id, s.title, s.scheduled_at, s.duration_minutes, COALESCE(c.name, 'Bez klienta') AS client_name
          FROM sessions s
          LEFT JOIN clients c ON c.id = s.client_id
          WHERE (s.user_id = ${userId} OR (s.user_id IS NULL AND c.user_id = ${userId}))
            AND s.scheduled_at IS NOT NULL
            AND s.scheduled_at < ${endISO}
            AND s.scheduled_at + (COALESCE(s.duration_minutes, 30) * interval '1 minute') > ${startISO}
        `) as SessionConflictRow[];
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("user_id") && msg.includes("does not exist")) {
      sessionsRows = excludeSessionId
        ? (await sql`
            SELECT s.id, s.title, s.scheduled_at, s.duration_minutes, COALESCE(c.name, 'Bez klienta') AS client_name
            FROM sessions s
            INNER JOIN clients c ON c.id = s.client_id AND c.user_id = ${userId}
            WHERE s.scheduled_at IS NOT NULL
              AND s.scheduled_at < ${endISO}
              AND s.scheduled_at + (COALESCE(s.duration_minutes, 30) * interval '1 minute') > ${startISO}
              AND s.id != ${excludeSessionId}
          `) as SessionConflictRow[]
        : (await sql`
            SELECT s.id, s.title, s.scheduled_at, s.duration_minutes, COALESCE(c.name, 'Bez klienta') AS client_name
            FROM sessions s
            INNER JOIN clients c ON c.id = s.client_id AND c.user_id = ${userId}
            WHERE s.scheduled_at IS NOT NULL
              AND s.scheduled_at < ${endISO}
              AND s.scheduled_at + (COALESCE(s.duration_minutes, 30) * interval '1 minute') > ${startISO}
          `) as SessionConflictRow[];
    } else {
      throw err;
    }
  }

  const bookingsRows = (await sql`
    SELECT id, name AS client_name, scheduled_at, duration_minutes
    FROM bookings
    WHERE user_id = ${userId}
      AND status != 'cancelled'
      AND scheduled_at < ${endISO}
      AND scheduled_at + (COALESCE(duration_minutes, 30) * interval '1 minute') > ${startISO}
  `) as { id: string; client_name: string; scheduled_at: string; duration_minutes: number }[];

  const conflicts: Array<{
    type: "session" | "booking";
    id: string;
    title: string;
    scheduled_at: string;
    duration_minutes: number;
    client_name: string;
  }> = [
    ...sessionsRows.map((s) => ({
      type: "session" as const,
      id: s.id,
      title: s.title,
      scheduled_at: s.scheduled_at,
      duration_minutes: s.duration_minutes || 30,
      client_name: s.client_name,
    })),
    ...bookingsRows.map((b) => ({
      type: "booking" as const,
      id: b.id,
      title: "Úvodní call",
      scheduled_at: b.scheduled_at,
      duration_minutes: b.duration_minutes || 30,
      client_name: b.client_name,
    })),
  ];

  return NextResponse.json({ conflicts });
}
