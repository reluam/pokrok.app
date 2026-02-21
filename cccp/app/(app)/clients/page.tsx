import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { sql } from "../../../lib/db";

type Project = { id: string; name: string; color: string };

type Client = {
  id: string;
  lead_id: string | null;
  name: string;
  email: string | null;
  status: "aktivni" | "neaktivni";
  created_at: string;
  project_id?: string | null;
};

async function getClients(userId: string, projectIds: string[]): Promise<Client[]> {
  try {
    if (projectIds.length > 0) {
      const rows = await sql`
        SELECT id, lead_id, name, email, status, created_at, project_id
        FROM clients
        WHERE user_id = ${userId} AND project_id = ANY(${projectIds})
        ORDER BY status ASC, created_at DESC
      `;
      return rows as Client[];
    }
    const rows = await sql`
      SELECT id, lead_id, name, email, status, created_at, project_id
      FROM clients
      WHERE user_id = ${userId}
      ORDER BY status ASC, created_at DESC
    `;
    return rows as Client[];
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("user_id") && msg.includes("does not exist")) {
      const rows = await sql`
        SELECT id, lead_id, name, email, status, created_at, project_id
        FROM clients
        ORDER BY status ASC, created_at DESC
      `;
      return rows as Client[];
    }
    console.error("[clients list] getClients error:", err);
    return [];
  }
}

async function getProjects(userId: string): Promise<Project[]> {
  const rows = await sql`
    SELECT id, name, color FROM projects WHERE user_id = ${userId} ORDER BY sort_order ASC, name ASC
  `;
  return rows as Project[];
}

type PageProps = { searchParams?: Promise<{ projects?: string }> };

export default async function ClientsPage({ searchParams }: PageProps) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const params = (await searchParams?.catch(() => ({})) ?? {}) as { projects?: string };
  const projectIds = params.projects ? params.projects.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const [clients, projects] = await Promise.all([
    getClients(userId, projectIds),
    getProjects(userId),
  ]);
  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p]));

  const active = clients.filter((c) => c.status === "aktivni");

  return (
    <div className="py-2">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Aktivní klienti
        </h1>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
          {active.length}
        </span>
      </div>

      {active.length === 0 ? (
        <p className="text-xs text-slate-500">
          Zatím žádný aktivní klient. Jakmile v CRM přesuneš lead do stavu
          „Spolupráce“, objeví se tady.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {active.map((client) => {
            const project = client.project_id ? projectMap[client.project_id] : null;
            return (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <article
                className={`flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-slate-300 ${project ? "border-l-4" : ""}`}
                style={project ? { borderLeftColor: project.color } : undefined}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold text-slate-900">
                      {client.name}
                    </h2>
                    {project ? (
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{ backgroundColor: `${project.color}30`, color: project.color }}
                      >
                        {project.name}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {client.email ?? "Bez emailu"}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    Od{" "}
                    {new Date(client.created_at).toLocaleDateString("cs-CZ")}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                    Aktivní
                  </span>
                </div>
              </article>
            </Link>
          ); })}
        </div>
      )}
    </div>
  );
}


