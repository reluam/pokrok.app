import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { sql } from "../../../../lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  let body: { name?: string; color?: string; logo_url?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const existing = await sql`
    SELECT id, name, color, logo_url FROM projects WHERE id = ${id} AND user_id = ${userId} LIMIT 1
  ` as { id: string; name: string; color: string; logo_url: string | null }[];
  if (existing.length === 0) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  let name = existing[0].name;
  let color = existing[0].color;
  let logo_url: string | null = existing[0].logo_url;
  if (body.name !== undefined) {
    const n = String(body.name).trim().slice(0, 100);
    if (n) name = n;
  }
  if (body.color !== undefined && /^#[0-9A-Fa-f]{6}$/.test(String(body.color).trim())) {
    color = String(body.color).trim();
  }
  if (body.logo_url !== undefined) {
    logo_url = body.logo_url === null || body.logo_url === "" ? null : String(body.logo_url).trim().slice(0, 2000) || null;
  }

  await sql`
    UPDATE projects SET name = ${name}, color = ${color}, logo_url = ${logo_url}, updated_at = NOW()
    WHERE id = ${id} AND user_id = ${userId}
  `;

  const rows = await sql`
    SELECT id, user_id, name, color, sort_order, logo_url, created_at, updated_at
    FROM projects WHERE id = ${id}
  ` as { id: string; user_id: string; name: string; color: string; sort_order: number; logo_url: string | null; created_at: string; updated_at: string }[];
  return NextResponse.json(rows[0]);
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
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const existing = await sql`
    SELECT id FROM projects WHERE id = ${id} AND user_id = ${userId} LIMIT 1
  ` as { id: string }[];
  if (existing.length === 0) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  await sql`UPDATE leads SET project_id = NULL WHERE project_id = ${id}`;
  await sql`UPDATE clients SET project_id = NULL WHERE project_id = ${id}`;
  await sql`UPDATE events SET project_id = NULL WHERE project_id = ${id}`;
  await sql`DELETE FROM projects WHERE id = ${id} AND user_id = ${userId}`;

  return NextResponse.json({ ok: true });
}
