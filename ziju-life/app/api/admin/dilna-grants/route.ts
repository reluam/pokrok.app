import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { sql } from "@/lib/database";
import { nanoid } from "nanoid";

export async function GET() {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await sql`
    SELECT id, email, expires_at, note, created_at
    FROM laborator_grants
    ORDER BY created_at DESC
  `;

  return NextResponse.json({ grants: rows });
}

export async function POST(req: NextRequest) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email, months, note } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email je povinný" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const expiresAt =
    typeof months === "number" && months > 0
      ? new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000)
      : null;

  const id = nanoid();

  await sql`
    INSERT INTO laborator_grants (id, email, expires_at, note)
    VALUES (${id}, ${normalizedEmail}, ${expiresAt}, ${note ?? null})
    ON CONFLICT (email) DO UPDATE
      SET expires_at = EXCLUDED.expires_at,
          note = EXCLUDED.note
  `;

  const [row] = await sql`
    SELECT id, email, expires_at, note, created_at
    FROM laborator_grants WHERE id = ${id}
  `;

  // If upserted (conflict on email), fetch by email instead
  const result = row ?? (await sql`
    SELECT id, email, expires_at, note, created_at
    FROM laborator_grants WHERE email = ${normalizedEmail}
  `)[0];

  return NextResponse.json({ grant: result });
}

export async function DELETE(req: NextRequest) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Chybí id" }, { status: 400 });
  }

  await sql`DELETE FROM laborator_grants WHERE id = ${id}`;

  return NextResponse.json({ ok: true });
}
