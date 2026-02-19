import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { sql } from "../../../lib/db";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await sql`
    SELECT id, user_id, slug, name, duration_minutes, created_at, updated_at
    FROM events
    WHERE user_id = ${userId}
    ORDER BY name ASC
  `;

  return NextResponse.json(rows);
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string; slug?: string; duration_minutes?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const slug = (body.slug ?? slugify(name)).trim() || slugify(name);
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: "slug must be lowercase letters, numbers, hyphens" }, { status: 400 });
  }

  const durationMinutes = Math.min(120, Math.max(15, Number(body.duration_minutes) || 30));

  const existing = await sql`
    SELECT 1 FROM events WHERE user_id = ${userId} AND slug = ${slug} LIMIT 1
  `;
  if (existing.length > 0) {
    return NextResponse.json({ error: "Event with this slug already exists" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  await sql`
    INSERT INTO events (id, user_id, slug, name, duration_minutes, updated_at)
    VALUES (${id}, ${userId}, ${slug}, ${name}, ${durationMinutes}, NOW())
  `;

  return NextResponse.json({
    id,
    user_id: userId,
    slug,
    name,
    duration_minutes: durationMinutes,
  });
}
