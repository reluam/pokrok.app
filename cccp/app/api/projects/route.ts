import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { sql } from "../../../lib/db";

const MAX_PROJECTS = 5;
const DEFAULT_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await sql`
    SELECT id, user_id, name, color, sort_order, created_at, updated_at
    FROM projects
    WHERE user_id = ${userId}
    ORDER BY sort_order ASC, created_at ASC
  ` as { id: string; user_id: string; name: string; color: string; sort_order: number; created_at: string; updated_at: string }[];

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string; color?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = (body.name ?? "").trim().slice(0, 100);
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const countRows = await sql`
    SELECT COUNT(*)::int AS cnt FROM projects WHERE user_id = ${userId}
  ` as { cnt: number }[];
  if (countRows[0]?.cnt >= MAX_PROJECTS) {
    return NextResponse.json(
      { error: "Maximálně 5 projektů." },
      { status: 400 }
    );
  }

  const hexColor = /^#[0-9A-Fa-f]{6}$/.test(body.color ?? "")
    ? (body.color as string).trim()
    : DEFAULT_COLORS[countRows[0]?.cnt ?? 0] ?? DEFAULT_COLORS[0];

  const id = crypto.randomUUID();
  const sortOrder = countRows[0]?.cnt ?? 0;

  await sql`
    INSERT INTO projects (id, user_id, name, color, sort_order, created_at, updated_at)
    VALUES (${id}, ${userId}, ${name}, ${hexColor}, ${sortOrder}, NOW(), NOW())
  `;

  const rows = await sql`
    SELECT id, user_id, name, color, sort_order, created_at, updated_at
    FROM projects WHERE id = ${id}
  ` as { id: string; user_id: string; name: string; color: string; sort_order: number; created_at: string; updated_at: string }[];

  return NextResponse.json(rows[0]);
}
