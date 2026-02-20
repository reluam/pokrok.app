import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { sql } from "../../../../lib/db";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await sql`
    SELECT first_day_of_week FROM user_settings WHERE user_id = ${userId} LIMIT 1
  ` as { first_day_of_week: number }[];

  const firstDayOfWeek = rows[0]?.first_day_of_week ?? 1;
  return NextResponse.json({ first_day_of_week: firstDayOfWeek });
}

export async function PATCH(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { first_day_of_week?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const val = body.first_day_of_week;
  if (val !== 0 && val !== 1) {
    return NextResponse.json(
      { error: "first_day_of_week must be 0 (Sunday) or 1 (Monday)" },
      { status: 400 }
    );
  }

  await sql`
    INSERT INTO user_settings (user_id, first_day_of_week, updated_at)
    VALUES (${userId}, ${val}, NOW())
    ON CONFLICT (user_id) DO UPDATE SET first_day_of_week = ${val}, updated_at = NOW()
  `;

  return NextResponse.json({ first_day_of_week: val });
}
