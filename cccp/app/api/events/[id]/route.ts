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
    SELECT id, user_id, slug, name, duration_minutes, min_advance_minutes, created_at, updated_at
    FROM events
    WHERE id = ${id} AND user_id = ${userId}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
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
  let body: { name?: string; slug?: string; duration_minutes?: number; min_advance_minutes?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const existing = await sql`
    SELECT id FROM events WHERE id = ${id} AND user_id = ${userId} LIMIT 1
  `;
  if (existing.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const name = body.name !== undefined ? String(body.name).trim() : undefined;
  const slug = body.slug !== undefined ? String(body.slug).trim().toLowerCase() : undefined;
  const durationMinutes = body.duration_minutes !== undefined
    ? Math.min(120, Math.max(15, Number(body.duration_minutes) || 30))
    : undefined;
  const minAdvanceMinutes = body.min_advance_minutes !== undefined
    ? Math.min(43200, Math.max(0, Number(body.min_advance_minutes) ?? 0))
    : undefined;

  if (slug !== undefined && !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: "slug must be lowercase letters, numbers, hyphens" }, { status: 400 });
  }
  if (slug !== undefined) {
    const conflict = await sql`
      SELECT 1 FROM events WHERE user_id = ${userId} AND slug = ${slug} AND id != ${id} LIMIT 1
    `;
    if (conflict.length > 0) {
      return NextResponse.json({ error: "Event with this slug already exists" }, { status: 400 });
    }
  }

  await sql`
    UPDATE events
    SET
      name = COALESCE(${name ?? null}, name),
      slug = COALESCE(${slug ?? null}, slug),
      duration_minutes = COALESCE(${durationMinutes ?? null}, duration_minutes),
      min_advance_minutes = COALESCE(${minAdvanceMinutes ?? null}, min_advance_minutes),
      updated_at = NOW()
    WHERE id = ${id} AND user_id = ${userId}
  `;

  const row = await sql`
    SELECT id, user_id, slug, name, duration_minutes, min_advance_minutes, created_at, updated_at
    FROM events WHERE id = ${id} LIMIT 1
  `;
  return NextResponse.json(row[0]);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Odpojit rezervace od eventu (lead a klient zůstanou nedotčeni)
  await sql`
    UPDATE bookings SET event_id = NULL WHERE event_id = ${id} AND user_id = ${userId}
  `;

  await sql`DELETE FROM events WHERE id = ${id} AND user_id = ${userId}`;
  return NextResponse.json({ ok: true });
}
