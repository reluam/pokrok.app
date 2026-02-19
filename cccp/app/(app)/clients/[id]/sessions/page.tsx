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

async function getClientSessions(clientId: string): Promise<SessionRow[]> {
  const rows = await sql`
    SELECT id, title, scheduled_at, duration_minutes, notes, key_points
    FROM sessions
    WHERE client_id = ${clientId}
    ORDER BY scheduled_at DESC NULLS LAST
  `;
  return rows as SessionRow[];
}

export default async function ClientSessionsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sessions = await getClientSessions(id);

  return (
    <div className="py-2">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Schůzky
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Historie a nadcházející schůzky s tímto klientem.
      </p>
      <div className="mt-6 rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-100">
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
