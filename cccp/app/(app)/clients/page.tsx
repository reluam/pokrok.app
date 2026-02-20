import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { sql } from "../../../lib/db";

type Client = {
  id: string;
  lead_id: string | null;
  name: string;
  email: string | null;
  status: "aktivni" | "neaktivni";
  created_at: string;
};

async function getClients(userId: string): Promise<Client[]> {
  try {
    const rows = await sql`
      SELECT id, lead_id, name, email, status, created_at
      FROM clients
      WHERE user_id = ${userId}
      ORDER BY status ASC, created_at DESC
    `;
    return rows as Client[];
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("user_id") && msg.includes("does not exist")) {
      const rows = await sql`
        SELECT id, lead_id, name, email, status, created_at
        FROM clients
        ORDER BY status ASC, created_at DESC
      `;
      return rows as Client[];
    }
    console.error("[clients list] getClients error:", err);
    return [];
  }
}

export default async function ClientsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const clients = await getClients(userId);

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
          {active.map((client) => (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <article className="flex h-full flex-col justify-between rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:ring-slate-200">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    {client.name}
                  </h2>
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
          ))}
        </div>
      )}
    </div>
  );
}


