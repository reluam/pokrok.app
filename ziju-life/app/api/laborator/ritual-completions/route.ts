import { NextRequest, NextResponse } from "next/server";
import { checkLaboratorAccess } from "@/lib/laborator-auth";
import { getLaboratorUser } from "@/lib/laborator-user";
import { sql, initializeDatabase } from "@/lib/database";

export const dynamic = "force-dynamic";

function getDateStr(): string {
  return new Date().toISOString().split("T")[0];
}

export async function GET(request: NextRequest) {
  const user = await getLaboratorUser(request);
  if (!user) return NextResponse.json({ error: "No user" }, { status: 400 });

  const valid = await checkLaboratorAccess(user.email);
  if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await initializeDatabase();
    const today = getDateStr();

    // Today's completions
    const todayRows = (await sql`
      SELECT ritual_id FROM ritual_completions
      WHERE user_id = ${user.id} AND date = ${today}
    `) as { ritual_id: string }[];

    // Stats: total completions per ritual (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const statsRows = (await sql`
      SELECT ritual_id, COUNT(*)::int AS count
      FROM ritual_completions
      WHERE user_id = ${user.id} AND date >= ${thirtyDaysAgo.toISOString().split("T")[0]}
      GROUP BY ritual_id
    `) as { ritual_id: string; count: number }[];

    return NextResponse.json({
      today: todayRows.map((r) => r.ritual_id),
      stats: Object.fromEntries(statsRows.map((r) => [r.ritual_id, r.count])),
    });
  } catch (error) {
    console.error("GET /api/laborator/ritual-completions error:", error);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

/** POST — toggle a ritual completion for today */
export async function POST(request: NextRequest) {
  const user = await getLaboratorUser(request);
  if (!user) return NextResponse.json({ error: "No user" }, { status: 400 });

  const valid = await checkLaboratorAccess(user.email);
  if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await initializeDatabase();
    const { ritualId, completed } = await request.json();

    if (!ritualId || typeof ritualId !== "string") {
      return NextResponse.json({ error: "Invalid ritual ID" }, { status: 400 });
    }

    const today = getDateStr();

    if (completed) {
      const id = `rc_${user.id}_${ritualId}_${today}`;
      await sql`
        INSERT INTO ritual_completions (id, user_id, ritual_id, date)
        VALUES (${id}, ${user.id}, ${ritualId}, ${today})
        ON CONFLICT (user_id, ritual_id, date) DO NOTHING
      `;
    } else {
      await sql`
        DELETE FROM ritual_completions
        WHERE user_id = ${user.id} AND ritual_id = ${ritualId} AND date = ${today}
      `;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/laborator/ritual-completions error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
