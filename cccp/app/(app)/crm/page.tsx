import { auth, currentUser } from "@clerk/nextjs/server";
import { sql } from "../../../lib/db";
import { CrmBoard } from "../../../components/CrmBoard";
import type { Lead, LeadStatus } from "../../../lib/leads";

async function getLeads(userId: string, projectIds: string[]): Promise<Lead[]> {
  if (projectIds.length > 0) {
    const rows = await sql`
      SELECT id, email, name, source, status, notes, created_at, project_id
      FROM leads
      WHERE deleted_at IS NULL AND (user_id = ${userId} OR user_id IS NULL) AND project_id = ANY(${projectIds})
      ORDER BY created_at DESC
    `;
    return rows as Lead[];
  }
  const rows = await sql`
    SELECT id, email, name, source, status, notes, created_at, project_id
    FROM leads
    WHERE deleted_at IS NULL AND (user_id = ${userId} OR user_id IS NULL)
    ORDER BY created_at DESC
  `;
  return rows as Lead[];
}

async function getProjects(userId: string): Promise<{ id: string; name: string; color: string }[]> {
  const rows = await sql`
    SELECT id, name, color FROM projects WHERE user_id = ${userId} ORDER BY sort_order ASC, name ASC
  `;
  return rows as { id: string; name: string; color: string }[];
}

async function getLeadIdsWithBooking(): Promise<string[]> {
  const rows = await sql`
    SELECT lead_id FROM bookings
    WHERE lead_id IS NOT NULL AND status IN ('pending', 'confirmed')
  `;
  return (rows as { lead_id: string }[]).map((r) => r.lead_id);
}

async function createLead(formData: FormData) {
  "use server";

  const { userId } = await auth();
  if (!userId) return;

  const email = String(formData.get("email") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const source = String(formData.get("source") ?? "").trim() || "manual";
  const status = String(formData.get("status") ?? "novy").trim() as LeadStatus;

  if (!email) {
    return;
  }

  const validStatuses: LeadStatus[] = ["novy", "uvodni_call", "nabidka", "spoluprace", "neaktivni"];
  const finalStatus = validStatuses.includes(status) ? status : "novy";

  const id = crypto.randomUUID();
  const projectId = String(formData.get("project_id") ?? "").trim() || null;

  await sql`
    INSERT INTO leads (id, user_id, project_id, email, name, source, status)
    VALUES (${id}, ${userId}, ${projectId}, ${email}, ${name || null}, ${source}, ${finalStatus})
  `;

  if (finalStatus === "spoluprace") {
    await sql`
      INSERT INTO clients (id, user_id, lead_id, name, email, status, project_id, created_at, updated_at)
      SELECT ${crypto.randomUUID()}, ${userId}, id, COALESCE(name, email), email, 'aktivni', project_id, NOW(), NOW()
      FROM leads
      WHERE id = ${id}
        AND NOT EXISTS (
          SELECT 1 FROM clients c WHERE c.lead_id = leads.id
        )
    `;
  }
}

async function updateLeadStatus(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as LeadStatus;

  if (!id) return;
  if (!["novy", "uvodni_call", "nabidka", "spoluprace", "neaktivni"].includes(status)) {
    return;
  }

  await sql`
    UPDATE leads
    SET status = ${status}, updated_at = NOW()
    WHERE id = ${id}
  `;

}

type PageProps = { searchParams?: Promise<{ projects?: string }> };

export default async function CrmPage({ searchParams }: PageProps) {
  const { userId } = await auth();
  if (!userId) return null;
  const params = (await searchParams?.catch(() => ({})) ?? {}) as { projects?: string };
  const projectIds = params.projects ? params.projects.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const user = await currentUser();
  const [leads, leadIdsWithBooking, projects] = await Promise.all([
    getLeads(userId, projectIds),
    getLeadIdsWithBooking(),
    getProjects(userId),
  ]);

  const columns: { id: LeadStatus; title: string; description?: string }[] = [
    { id: "novy", title: "Nový", description: "Čerstvě přijaté leady" },
    {
      id: "uvodni_call",
      title: "Úvodní call",
      description: "Domluvený nebo proběhlý úvodní hovor"
    },
    {
      id: "nabidka",
      title: "Nabídka",
      description: "Odeslaná nabídka / čeká na rozhodnutí"
    },
    {
      id: "spoluprace",
      title: "Spolupráce",
      description: "Aktivní klient / probíhá spolupráce"
    },
    {
      id: "neaktivni",
      title: "Neaktivní",
      description: "Neodpovídá / nezájem / ukončeno"
    }
  ];

  return (
    <div className="py-2">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            CRM – Leady
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Jednoduchý board pro leady z funnelů a webu. Vlevo přidáš lead,
            vpravo ho posouváš mezi stavy.
          </p>
        </div>
        <div className="text-right text-xs text-slate-500">
          Přihlášený uživatel:
          <div className="font-medium text-slate-800">
            {user?.primaryEmailAddress?.emailAddress ?? user?.id}
          </div>
        </div>
      </div>

      <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-medium text-slate-900">
          Rychlé přidání leada
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Stačí email, jméno a volitelně zdroj (např. „koučing landing“,
          „homepage“, „doporučení“).
        </p>
        <form
          action={createLead}
          className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center"
        >
          <input
            name="email"
            type="email"
            placeholder="email@klienta.cz"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
            required
          />
          <input
            name="name"
            type="text"
            placeholder="Jméno (volitelné)"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
          />
          <input
            name="source"
            type="text"
            placeholder="Zdroj (např. koucing landing)"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
          />
          <select
            name="project_id"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-slate-400 focus:bg-white"
          >
            <option value="">— Bez projektu —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            name="status"
            defaultValue="novy"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-slate-400 focus:bg-white"
          >
            <option value="novy">Nový</option>
            <option value="uvodni_call">Úvodní call</option>
            <option value="nabidka">Nabídka</option>
            <option value="spoluprace">Spolupráce</option>
            <option value="neaktivni">Neaktivní</option>
          </select>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Přidat lead
          </button>
        </form>
      </section>

      <CrmBoard leads={leads} columns={columns} leadIdsWithBooking={leadIdsWithBooking} />
    </div>
  );
}

