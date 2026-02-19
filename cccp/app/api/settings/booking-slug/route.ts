import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { sql } from "../../../../lib/db";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await sql`
    SELECT slug FROM user_booking_slug WHERE user_id = ${userId} LIMIT 1
  ` as { slug: string }[];

  return NextResponse.json({ slug: rows[0]?.slug ?? "" });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { slug?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const slug = (body.slug ?? "").trim().toLowerCase();
  if (!slug) {
    await sql`DELETE FROM user_booking_slug WHERE user_id = ${userId}`;
    return NextResponse.json({ slug: "" });
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { error: "slug must be lowercase letters, numbers, hyphens" },
      { status: 400 }
    );
  }

  const conflict = await sql`
    SELECT 1 FROM user_booking_slug WHERE slug = ${slug} AND user_id != ${userId} LIMIT 1
  `;
  if (conflict.length > 0) {
    return NextResponse.json({ error: "This slug is already taken" }, { status: 400 });
  }

  await sql`
    INSERT INTO user_booking_slug (user_id, slug, updated_at)
    VALUES (${userId}, ${slug}, NOW())
    ON CONFLICT (user_id) DO UPDATE SET slug = ${slug}, updated_at = NOW()
  `;

  return NextResponse.json({ slug });
}
