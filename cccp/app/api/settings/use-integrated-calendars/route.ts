import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "../../../../lib/db";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = (await sql`
    SELECT use_integrated_calendars FROM user_settings WHERE user_id = ${userId} LIMIT 1
  `) as { use_integrated_calendars: boolean | null }[];

  const value = rows.length > 0 ? (rows[0].use_integrated_calendars ?? true) : true;
  return NextResponse.json({ use_integrated_calendars: value });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { use_integrated_calendars?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const useIntegratedCalendars = body.use_integrated_calendars ?? true;

  await sql`
    INSERT INTO user_settings (user_id, first_day_of_week, use_integrated_calendars, updated_at)
    VALUES (${userId}, 1, ${useIntegratedCalendars}, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      use_integrated_calendars = ${useIntegratedCalendars},
      updated_at = NOW()
  `;

  return NextResponse.json({ ok: true, use_integrated_calendars: useIntegratedCalendars });
}
