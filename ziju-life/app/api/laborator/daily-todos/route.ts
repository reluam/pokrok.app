import { NextRequest, NextResponse } from "next/server";
import { checkLaboratorAccess } from "@/lib/laborator-auth";
import { getLaboratorUser } from "@/lib/laborator-user";
import { sql, ensureCoreTables } from "@/lib/database";

export const dynamic = "force-dynamic";

/** Get today's date in Europe/Prague timezone as YYYY-MM-DD */
function getLocalDate(offsetDays = 0): string {
  // Build a date string in Prague timezone using Intl
  const now = new Date(Date.now() + offsetDays * 86_400_000);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Prague",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const y = parts.find(p => p.type === "year")!.value;
  const m = parts.find(p => p.type === "month")!.value;
  const d = parts.find(p => p.type === "day")!.value;
  return `${y}-${m}-${d}`;
}

interface TodoItem { text: string; done: boolean }

export async function GET(request: NextRequest) {
  const user = await getLaboratorUser(request);
  if (!user) return NextResponse.json({ error: "No user" }, { status: 400 });

  const valid = await checkLaboratorAccess(user.email);
  if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await ensureCoreTables();
    const today = getLocalDate();
    const yesterday = getLocalDate(-1);

    // Also fetch ALL rows for this user to debug
    const [rows, allRows] = await Promise.all([
      sql`
        SELECT date, todos, nice_todos FROM daily_todos
        WHERE user_id = ${user.id} AND date IN (${today}::date, ${yesterday}::date)
        ORDER BY date DESC
      `,
      sql`
        SELECT date, id FROM daily_todos
        WHERE user_id = ${user.id}
        ORDER BY date DESC
        LIMIT 5
      `,
    ]);

    // Handle both properly stored JSONB and double-encoded strings
    const parseTodos = (val: unknown): TodoItem[] => {
      if (Array.isArray(val)) return val;
      if (typeof val === "string") {
        try { const parsed = JSON.parse(val); if (Array.isArray(parsed)) return parsed; } catch {}
      }
      return [];
    };

    const todayData = (rows as { date: string; todos: unknown; nice_todos: unknown }[]).find((r) => String(r.date).startsWith(today));
    const yesterdayData = (rows as { date: string; todos: unknown; nice_todos: unknown }[]).find((r) => String(r.date).startsWith(today));

    return NextResponse.json({
      today: { todos: parseTodos(todayData?.todos), niceTodos: parseTodos(todayData?.nice_todos) },
      yesterday: { todos: parseTodos(yesterdayData?.todos), niceTodos: parseTodos(yesterdayData?.nice_todos) },
      date: today,
      _debug: {
        queryDate: today,
        yesterdayDate: yesterday,
        matchedRows: (rows as unknown[]).length,
        allDatesInDb: (allRows as { date: string; id: string }[]).map(r => ({ date: String(r.date), id: r.id })),
        rawTodayTodos: todayData?.todos,
        rawTodayType: typeof todayData?.todos,
      },
    });
  } catch (error) {
    console.error("GET /api/laborator/daily-todos error:", error);
    return NextResponse.json({ error: "Failed to load todos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getLaboratorUser(request);
  if (!user) return NextResponse.json({ error: "No user" }, { status: 400 });

  const valid = await checkLaboratorAccess(user.email);
  if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await ensureCoreTables();
    const body = await request.json();
    const { todos, niceTodos } = body;

    if (!Array.isArray(todos) || !Array.isArray(niceTodos)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Enforce limits
    const limitedTodos = todos.slice(0, 3);
    const limitedNice = niceTodos.slice(0, 3);

    const today = getLocalDate();
    const id = `todo_${user.id}_${today}`;

    const todosJson = JSON.stringify(limitedTodos);
    const niceJson = JSON.stringify(limitedNice);

    // Use raw SQL with explicit JSONB cast — Neon parameterized queries
    await sql`
      INSERT INTO daily_todos (id, user_id, date, todos, nice_todos)
      VALUES (${id}, ${user.id}, ${today}::date, ${todosJson}::jsonb, ${niceJson}::jsonb)
      ON CONFLICT (user_id, date)
      DO UPDATE SET todos = EXCLUDED.todos, nice_todos = EXCLUDED.nice_todos
    `;

    // Verify it was saved
    const verify = await sql`
      SELECT id, date, todos FROM daily_todos WHERE user_id = ${user.id} AND date = ${today}::date LIMIT 1
    `;

    return NextResponse.json({
      ok: true,
      debug: {
        date: today,
        userId: user.id,
        savedRows: verify.length,
        savedDate: verify[0]?.date,
        savedTodosType: typeof verify[0]?.todos,
        savedTodosIsArray: Array.isArray(verify[0]?.todos),
      },
    });
  } catch (error) {
    console.error("POST /api/laborator/daily-todos error:", error);
    return NextResponse.json({ error: "Failed to save todos" }, { status: 500 });
  }
}
