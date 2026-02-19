import type { ReactNode } from "react";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { sql } from "../../../../lib/db";

type Client = {
  id: string;
  name: string;
  email: string | null;
};

async function getClient(id: string, userId: string): Promise<Client | null> {
  const rows = (await sql`
    SELECT id, name, email
    FROM clients
    WHERE id = ${id} AND user_id = ${userId}
    LIMIT 1
  `) as Client[];

  return rows[0] ?? null;
}

export default async function ClientLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) return null;
  const { id } = await params;
  const client = await getClient(id, userId);
  if (!client) notFound();

  return (
    <div className="flex gap-6">
      <aside className="w-56 shrink-0">
        <div className="mb-3 rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-100">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Klient
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {client?.name ?? "Neznámý klient"}
          </div>
          <div className="text-[11px] text-slate-500">
            {client?.email ?? "Bez emailu"}
          </div>
        </div>
        <div className="rounded-2xl bg-white/80 p-3 shadow-sm ring-1 ring-slate-100">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Navigace klienta
          </div>
          <div className="space-y-1 text-xs">
            <Link
              href={`/clients/${id}`}
              className="block rounded-lg px-2 py-1.5 text-slate-600 hover:bg-slate-100"
            >
              Přehled
            </Link>
            <Link
              href={`/clients/${id}/sessions`}
              className="block rounded-lg px-2 py-1.5 text-slate-600 hover:bg-slate-100"
            >
              Schůzky
            </Link>
            <Link
              href={`/clients/${id}/notes`}
              className="block rounded-lg px-2 py-1.5 text-slate-600 hover:bg-slate-100"
            >
              Poznámky
            </Link>
            <Link
              href={`/clients/${id}/payments`}
              className="block rounded-lg px-2 py-1.5 text-slate-600 hover:bg-slate-100"
            >
              Platby
            </Link>
          </div>
        </div>
      </aside>
      <main className="flex-1 pb-8">{children}</main>
    </div>
  );
}

