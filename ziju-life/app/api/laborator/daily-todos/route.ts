import { NextRequest, NextResponse } from "next/server";
import { checkLaboratorAccess } from "@/lib/laborator-auth";
import { getLaboratorUser } from "@/lib/laborator-user";
import { sql, ensureCoreTables } from "@/lib/database";

export const dynamic = "force-dynamic";

/** Get today's date in Europe/Prague timezone as YYYY-MM-DD */
function getLocalDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  // Use sv-SE locale which outputs YYYY-MM-DD format
  return d.toLocaleDateString("sv-SE", { timeZone: "Europe/Prague" });
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

    const rows = (await sql`
      SELECT date, todos, nice_todos FROM daily_todos
      WHERE user_id = ${user.id} AND date IN (${today}, ${yesterday})
      ORDER BY date DESC
    `) as { date: string; todos: unknown; nice_todos: unknown }[];

    // Handle both properly stored JSONB and double-encoded strings
    const parseTodos = (val: unknown): TodoItem[] => {
      if (Array.isArray(val)) return val;
      if (typeof val === "string") {
        try { const parsed = JSON.parse(val); if (Array.isArray(parsed)) return parsed; } catch {}
      }
      return [];
    };

    const todayData = rows.find((r) => String(r.date).startsWith(today));
    const yesterdayData = rows.find((r) => String(r.date).startsWith(yesterday));

    return NextResponse.json({
      today: { todos: parseTodos(todayData?.todos), niceTodos: parseTodos(todayData?.nice_todos) },
      yesterday: { todos: parseTodos(yesterdayData?.todos), niceTodos: parseTodos(yesterdayData?.nice_todos) },
      date: today,
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

    // Pass JSON.stringify for JSONB columns — Neon needs string for JSONB params
    const todosJson = JSON.stringify(limitedTodos);
    const niceJson = JSON.stringify(limitedNice);

    await sql`
      INSERT INTO daily_todos (id, user_id, date, todos, nice_todos)
      VALUES (${id}, ${user.id}, ${today}, ${todosJson}::jsonb, ${niceJson}::jsonb)
      ON CONFLICT (user_id, date)
      DO UPDATE SET todos = ${todosJson}::jsonb, nice_todos = ${niceJson}::jsonb
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/laborator/daily-todos error:", error);
    return NextResponse.json({ error: "Failed to save todos" }, { status: 500 });
  }
}
