import { auth } from "@clerk/nextjs/server";
import { sql } from "../../../../../lib/db";
import Link from "next/link";

type SessionRow = {
  id: string;
  title: string;
  scheduled_at: string | null;
  duration_minutes: number | null;
  notes: string | null;
  key_points: string | null;
};

async function getClientSessions(clientId: string, userId: string): Promise<SessionRow[]> {
  try {
    const rows = await sql`
      SELECT s.id, s.title, s.scheduled_at, s.duration_minutes, s.notes, s.key_points
      FROM sessions s
      JOIN clients c ON c.id = s.client_id AND c.user_id = ${userId}
      WHERE s.client_id = ${clientId}
      ORDER BY s.scheduled_at DESC NULLS LAST
    `;
    return rows as SessionRow[];
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("user_id") && msg.includes("does not exist")) {
      const rows = await sql`
        SELECT s.id, s.title, s.scheduled_at, s.duration_minutes, s.notes, s.key_points
        FROM sessions s
        JOIN clients c ON c.id = s.client_id
        WHERE s.client_id = ${clientId}
        ORDER BY s.scheduled_at DESC NULLS LAST
      `;
      return rows as SessionRow[];
    }
    console.error("[clients sessions] getClientSessions error:", err);
    return [];
  }
}

export default async function ClientSessionsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) return null;
  const { id } = await params;
  const sessions = await getClientSessions(id, userId);

  return (
    <div className="py-2">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Schůzky
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Historie a nadcházející schůzky s tímto klientem.
      </p>
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        {sessions.length === 0 ? (
          <p className="text-sm text-slate-500">Zatím žádné schůzky.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {sessions.map((s) => (
              <li
                key={s.id}
                className="rounded-xl bg-slate-50 px-4 py-3"
              >
                <div className="font-semibold text-slate-900">{s.title}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {s.scheduled_at
                    ? new Date(s.scheduled_at).toLocaleString("cs-CZ", {
                        weekday: "short",
                        day: "numeric",
                        month: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })
                    : "Bez data"}
                  {s.duration_minutes ? ` · ${s.duration_minutes} min` : null}
                </div>
                {s.notes ? (
                  <p className="mt-2 text-slate-600 text-xs">{s.notes}</p>
                ) : null}
                {s.key_points ? (
                  <p className="mt-1 text-slate-500 text-xs">Klíčové body: {s.key_points}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
