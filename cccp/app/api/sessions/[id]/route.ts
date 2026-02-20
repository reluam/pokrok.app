import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { sql } from "../../../../lib/db";
import { isSlotFree } from "../../../../lib/bookings";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  type SessionRow = {
    id: string;
    client_id: string | null;
    title: string;
    scheduled_at: string | null;
    duration_minutes: number | null;
    notes: string | null;
    client_name: string;
    client_email: string | null;
  };
  let rows: SessionRow[];
  try {
    rows = (await sql`
      SELECT
        s.id,
        s.client_id,
        s.title,
        s.scheduled_at,
        s.duration_minutes,
        s.notes,
        COALESCE(c.name, 'Bez klienta') AS client_name,
        c.email AS client_email
      FROM sessions s
      LEFT JOIN clients c ON c.id = s.client_id
      WHERE s.id = ${id}
        AND (s.user_id = ${userId} OR (s.user_id IS NULL AND c.user_id = ${userId}))
      LIMIT 1
    `) as SessionRow[];
  } catch {
    rows = (await sql`
      SELECT
        s.id,
        s.client_id,
        s.title,
        s.scheduled_at,
        s.duration_minutes,
        s.notes,
        COALESCE(c.name, 'Bez klienta') AS client_name,
        c.email AS client_email
      FROM sessions s
      INNER JOIN clients c ON c.id = s.client_id AND c.user_id = ${userId}
      WHERE s.id = ${id}
      LIMIT 1
    `) as SessionRow[];
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const r = rows[0] as {
    id: string;
    client_id: string | null;
    title: string;
    scheduled_at: string | null;
    duration_minutes: number | null;
    notes: string | null;
    client_name: string;
    client_email: string | null;
  };

  return NextResponse.json({
    id: r.id,
    client_id: r.client_id,
    title: r.title,
    scheduled_at: r.scheduled_at,
    duration_minutes: r.duration_minutes ?? 30,
    notes: r.notes,
    client_name: r.client_name,
    client_email: r.client_email,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let existing: { id: string; duration_minutes: number | null }[];
  try {
    existing = (await sql`
      SELECT s.id, s.duration_minutes
      FROM sessions s
      LEFT JOIN clients c ON c.id = s.client_id
      WHERE s.id = ${id}
        AND (s.user_id = ${userId} OR (s.user_id IS NULL AND c.user_id = ${userId}))
      LIMIT 1
    `) as { id: string; duration_minutes: number | null }[];
  } catch {
    existing = (await sql`
      SELECT s.id, s.duration_minutes
      FROM sessions s
      INNER JOIN clients c ON c.id = s.client_id AND c.user_id = ${userId}
      WHERE s.id = ${id}
      LIMIT 1
    `) as { id: string; duration_minutes: number | null }[];
  }
  if (existing.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: {
    title?: string;
    scheduled_at?: string;
    duration_minutes?: number;
    notes?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = body.title !== undefined ? (String(body.title).trim() || "Schůzka") : null;
  const scheduledAt = body.scheduled_at;
  const durationMinutes = body.duration_minutes !== undefined
    ? Math.min(120, Math.max(15, Number(body.duration_minutes) || 30))
    : null;
  const notes = body.notes !== undefined
    ? (typeof body.notes === "string" ? body.notes.trim().slice(0, 5000) || null : null)
    : null;

  if (scheduledAt !== undefined) {
    const date = new Date(scheduledAt);
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json({ error: "Invalid scheduled_at" }, { status: 400 });
    }
    const dur = durationMinutes ?? existing[0].duration_minutes ?? 30;
    const free = await isSlotFree(scheduledAt, dur, userId, id);
    if (!free) {
      return NextResponse.json(
        { error: "Slot je již obsazený nebo koliduje s jinou schůzkou" },
        { status: 409 }
      );
    }
  }

  const updates: { title?: string; scheduled_at?: string; duration_minutes?: number; notes?: string | null } = {};
  if (title !== null) updates.title = title;
  if (scheduledAt !== undefined) updates.scheduled_at = new Date(scheduledAt).toISOString();
  if (durationMinutes !== null) updates.duration_minutes = durationMinutes;
  if (notes !== undefined) updates.notes = notes;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true });
  }

  if (updates.title !== undefined) {
    await sql`UPDATE sessions SET title = ${updates.title}, updated_at = NOW() WHERE id = ${id}`;
  }
  if (updates.scheduled_at !== undefined) {
    await sql`UPDATE sessions SET scheduled_at = ${updates.scheduled_at}, updated_at = NOW() WHERE id = ${id}`;
  }
  if (updates.duration_minutes !== undefined) {
    await sql`UPDATE sessions SET duration_minutes = ${updates.duration_minutes}, updated_at = NOW() WHERE id = ${id}`;
  }
  if (updates.notes !== undefined) {
    await sql`UPDATE sessions SET notes = ${updates.notes}, updated_at = NOW() WHERE id = ${id}`;
  }

  return NextResponse.json({ ok: true });
}
