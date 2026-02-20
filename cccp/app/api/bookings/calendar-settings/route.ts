import { NextResponse } from "next/server";
import { sql } from "../../../../lib/db";

/** Public: first day of week for booking calendar (0=Sunday, 1=Monday) by coach user id. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const coach = searchParams.get("coach")?.trim();
  if (!coach) {
    return NextResponse.json({ first_day_of_week: 1 });
  }

  const rows = await sql`
    SELECT first_day_of_week FROM user_settings WHERE user_id = ${coach} LIMIT 1
  ` as { first_day_of_week: number }[];

  return NextResponse.json({
    first_day_of_week: rows[0]?.first_day_of_week ?? 1,
  });
}
