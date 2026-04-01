import { NextRequest, NextResponse } from "next/server";
import { checkDilnaAccess } from "@/lib/dilna-auth";
import { getDilnaUser } from "@/lib/dilna-user";
import { sql, ensureCoreTables } from "@/lib/database";

export const dynamic = "force-dynamic";

function getDateStr(d?: Date): string {
  return (d ?? new Date()).toISOString().split("T")[0];
}

/** Build array of last N date strings (oldest first) */
function lastNDays(n: number): string[] {
  const dates: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(getDateStr(d));
  }
  return dates;
}

export async function GET(request: NextRequest) {
  const user = await getDilnaUser(request);
  if (!user) return NextResponse.json({ error: "No user" }, { status: 400 });

  const valid = await checkDilnaAccess(user.email);
  if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await ensureCoreTables();
    const today = getDateStr();
    const days7 = lastNDays(7);
    const sevenDaysAgo = days7[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 30-day stats
    const rows = (await sql`
      SELECT
        ritual_id,
        bool_or(date = ${today}::date) AS completed_today,
        COUNT(*)::int AS count_30d
      FROM ritual_completions
      WHERE user_id = ${user.id}
        AND date >= ${thirtyDaysAgo.toISOString().split("T")[0]}
      GROUP BY ritual_id
    `) as { ritual_id: string; completed_today: boolean; count_30d: number }[];

    // Last 7 days per-ritual completions
    const weekRows = (await sql`
      SELECT ritual_id, date::text AS date
      FROM ritual_completions
      WHERE user_id = ${user.id}
        AND date >= ${sevenDaysAgo}::date
        AND date <= ${today}::date
    `) as { ritual_id: string; date: string }[];

    // Build map: { ritualId: ["2026-03-26", "2026-03-28"] }
    const history: Record<string, string[]> = {};
    for (const row of weekRows) {
      if (!history[row.ritual_id]) history[row.ritual_id] = [];
      history[row.ritual_id].push(row.date);
    }

    return NextResponse.json({
      today: rows.filter((r) => r.completed_today).map((r) => r.ritual_id),
      stats: Object.fromEntries(rows.map((r) => [r.ritual_id, r.count_30d])),
      days: days7,
      history,
    });
  } catch (error) {
    console.error("GET /api/dilna/ritual-completions error:", error);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

/** POST — toggle a ritual completion for a given date (last 7 days) */
export async function POST(request: NextRequest) {
  const user = await getDilnaUser(request);
  if (!user) return NextResponse.json({ error: "No user" }, { status: 400 });

  const valid = await checkDilnaAccess(user.email);
  if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await ensureCoreTables();
    const { ritualId, completed, date: requestDate } = await request.json();

    if (!ritualId || typeof ritualId !== "string") {
      return NextResponse.json({ error: "Invalid ritual ID" }, { status: 400 });
    }

    // Allow any date within the last 7 days
    const today = getDateStr();
    const allowed = new Set(lastNDays(7));
    const targetDate = requestDate && allowed.has(requestDate) ? requestDate : today;

    if (completed) {
      const id = `rc_${user.id}_${ritualId}_${targetDate}`;
      await sql`
        INSERT INTO ritual_completions (id, user_id, ritual_id, date)
        VALUES (${id}, ${user.id}, ${ritualId}, ${targetDate})
        ON CONFLICT (user_id, ritual_id, date) DO NOTHING
      `;
    } else {
      await sql`
        DELETE FROM ritual_completions
        WHERE user_id = ${user.id} AND ritual_id = ${ritualId} AND date = ${targetDate}
      `;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/dilna/ritual-completions error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
