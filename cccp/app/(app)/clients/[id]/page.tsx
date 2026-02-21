import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { sql } from "../../../../lib/db";
import { ClientProjectSelect } from "../../../../components/ClientProjectSelect";

type Client = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  main_goal: string | null;
  status: string;
  project_id: string | null;
};

type SessionSummary = {
  id: string;
  title: string;
  scheduled_at: string | null;
};

async function getClientWithSummary(id: string, userId: string) {
  try {
    const [clientRows, sessionRows] = await Promise.all([
      sql`
        SELECT id, name, email, phone, main_goal, status, project_id
        FROM clients
        WHERE id = ${id} AND user_id = ${userId}
        LIMIT 1
      `,
      sql`
        SELECT id, title, scheduled_at
        FROM sessions s
        JOIN clients c ON c.id = s.client_id AND c.user_id = ${userId}
        WHERE s.client_id = ${id}
        ORDER BY s.scheduled_at DESC NULLS LAST
        LIMIT 5
      `
    ]);
    const clients = clientRows as Client[];
    const sessions = sessionRows as SessionSummary[];
    return { client: clients[0] ?? null, sessions };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("user_id") && msg.includes("does not exist")) {
      const [clientRows, sessionRows] = await Promise.all([
        sql`
          SELECT id, name, email, phone, main_goal, status, project_id
          FROM clients
          WHERE id = ${id}
          LIMIT 1
        `,
        sql`
          SELECT id, title, scheduled_at
          FROM sessions s
          JOIN clients c ON c.id = s.client_id
          WHERE s.client_id = ${id}
          ORDER BY s.scheduled_at DESC NULLS LAST
          LIMIT 5
        `
      ]);
      const clients = clientRows as Client[];
      const sessions = sessionRows as SessionSummary[];
      return { client: clients[0] ?? null, sessions };
    }
    console.error("[clients page] getClientWithSummary error:", err);
    return { client: null, sessions: [] };
  }
}

export default async function ClientOverviewPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) return null;
  const { id } = await params;
  const { client, sessions } = await getClientWithSummary(id, userId);

  if (!client) notFound();

  return (
    <div className="py-2">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {client.name}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Přehled klienta, jeho cíle a poslední schůzky.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-medium text-slate-900">Základní info</h2>
          <dl className="mt-3 space-y-2 text-sm text-slate-700">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Email
              </dt>
              <dd>{client.email ?? "Bez emailu"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Telefon
              </dt>
              <dd>{client.phone ?? "Neuvedeno"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Stav
              </dt>
              <dd>
                <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                  {client.status === "aktivni" ? "Aktivní" : "Neaktivní"}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Hlavní cíl
              </dt>
              <dd>{client.main_goal ?? "Zatím nevyplněno"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Projekt
              </dt>
              <dd>
                <ClientProjectSelect clientId={client.id} projectId={client.project_id} />
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-900">
              Poslední schůzky
            </h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
              {sessions.length}
            </span>
          </div>
          {sessions.length === 0 ? (
            <p className="text-xs text-slate-500">
              S tímto klientem zatím nemáš žádné schůzky.
            </p>
          ) : (
            <div className="space-y-2 text-sm">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {s.title}
                    </div>
                    <div className="text-xs text-slate-500">
                      {s.scheduled_at
                        ? new Date(s.scheduled_at).toLocaleString("cs-CZ", {
                            day: "numeric",
                            month: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })
                        : "Bez data"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

