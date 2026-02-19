"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ArchivedLead = {
  id: string;
  email: string;
  name: string | null;
  source: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  deleted_at: string;
  can_restore: boolean;
};

export default function CrmArchivPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<ArchivedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const fetchArchived = useCallback(async () => {
    try {
      const res = await fetch("/api/leads/archived");
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setLeads(Array.isArray(data) ? data : []);
    } catch (e) {
      setMessage({ type: "error", text: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArchived();
  }, [fetchArchived]);

  async function restore(id: string) {
    setRestoringId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/leads/${id}/restore`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: (data.error as string) || res.statusText });
        return;
      }
      setMessage({ type: "ok", text: "Lead byl obnoven a je zpět na boardu." });
      setLeads((prev) => prev.filter((l) => l.id !== id));
      router.refresh();
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <div className="py-2">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Archiv leadů
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Odstraněné leady. Obnovit lze pouze do 48 hodin od odstranění. Klienti zůstávají nedotčeni.
      </p>

      <div className="mt-4">
        <Link
          href="/crm"
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          ← Zpět na board leadů
        </Link>
      </div>

      {message && (
        <p
          className={`mt-4 text-sm ${message.type === "ok" ? "text-emerald-600" : "text-red-600"}`}
        >
          {message.text}
        </p>
      )}

      <section className="mt-6 rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-100">
        {loading ? (
          <p className="text-sm text-slate-500">Načítám archiv…</p>
        ) : leads.length === 0 ? (
          <p className="text-sm text-slate-500">
            V archivu nejsou žádné leady. Odstraněné leady se zde zobrazí a do 48 h je lze obnovit.
          </p>
        ) : (
          <ul className="space-y-2">
            {leads.map((lead) => (
              <li
                key={lead.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              >
                <div>
                  <span className="font-medium text-slate-900">
                    {lead.name || "Bez jména"}
                  </span>
                  <span className="ml-2 text-slate-500">{lead.email}</span>
                  {lead.source && (
                    <span className="ml-2 rounded-full bg-slate-200/70 px-2 py-0.5 text-xs text-slate-600">
                      {lead.source}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">
                    Odstraněno:{" "}
                    {new Date(lead.deleted_at).toLocaleString("cs-CZ", {
                      day: "numeric",
                      month: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {lead.can_restore ? (
                    <button
                      type="button"
                      onClick={() => restore(lead.id)}
                      disabled={!!restoringId}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                    >
                      {restoringId === lead.id ? "Obnovuji…" : "Obnovit"}
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">
                      Obnova po 48 h již není možná
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
