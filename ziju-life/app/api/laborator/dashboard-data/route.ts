import { NextRequest, NextResponse } from "next/server";
import { checkLaboratorAccess } from "@/lib/laborator-auth";
import { getLaboratorUser } from "@/lib/laborator-user";
import { sql, initializeDatabase } from "@/lib/database";

export const dynamic = "force-dynamic";

/**
 * Batched dashboard endpoint — returns todos, user context, and ritual completions
 * in a single request with a single auth check.
 */
export async function GET(request: NextRequest) {
  const user = await getLaboratorUser(request);
  if (!user) return NextResponse.json({ error: "No user" }, { status: 400 });

  const valid = await checkLaboratorAccess(user.email);
  if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await initializeDatabase();
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().split("T")[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString().split("T")[0];

    // Run all queries in parallel
    const [todoRows, contextRows, completionRows, statsRows] = (await Promise.all([
      sql`
        SELECT date, todos, nice_todos FROM daily_todos
        WHERE user_id = ${user.id} AND date IN (${today}, ${yesterday})
        ORDER BY date DESC
      `,
      sql`
        SELECT context_type, data, updated_at FROM user_lab_context
        WHERE user_id = ${user.id}
      `,
      sql`
        SELECT ritual_id FROM ritual_completions
        WHERE user_id = ${user.id} AND date = ${today}
      `,
      sql`
        SELECT ritual_id, COUNT(*)::int AS count FROM ritual_completions
        WHERE user_id = ${user.id} AND date >= ${thirtyDaysAgo}
        GROUP BY ritual_id
      `,
    ])) as [
      { date: string; todos: unknown; nice_todos: unknown }[],
      { context_type: string; data: unknown; updated_at: Date }[],
      { ritual_id: string }[],
      { ritual_id: string; count: number }[],
    ];

    // Compose todos
    const todayData = todoRows.find((r) => String(r.date).startsWith(today));
    const yesterdayData = todoRows.find((r) => String(r.date).startsWith(yesterday));

    // Compose context
    const context: Record<string, unknown> = {};
    for (const row of contextRows) {
      context[row.context_type] = row.data;
    }

    return NextResponse.json({
      todos: {
        today: { todos: todayData?.todos ?? [], niceTodos: todayData?.nice_todos ?? [] },
        yesterday: { todos: yesterdayData?.todos ?? [], niceTodos: yesterdayData?.nice_todos ?? [] },
        date: today,
      },
      context,
      ritualCompletions: {
        today: completionRows.map((r) => r.ritual_id),
        stats: Object.fromEntries(statsRows.map((r) => [r.ritual_id, r.count])),
      },
    });
  } catch (error) {
    console.error("GET /api/laborator/dashboard-data error:", error);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}
