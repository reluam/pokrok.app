"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { Lead, LeadStatus } from "../lib/leads";
import { useProjects } from "../contexts/ProjectsContext";

type Column = { id: LeadStatus; title: string; description?: string };

type Props = {
  leads: Lead[];
  columns: Column[];
  leadIdsWithBooking?: string[];
};

export function CrmBoard({ leads, columns, leadIdsWithBooking = [] }: Props) {
  const projects = useProjects()?.projects ?? [];
  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p]));
  const hasBooking = (leadId: string) => leadIdsWithBooking.includes(leadId);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
   const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSelectedLead(null);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const [deletingLeadId, setDeletingLeadId] = useState<string | null>(null);

  async function moveLead(id: string, status: LeadStatus) {
    startTransition(async () => {
      await fetch("/api/leads/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      });

      router.refresh();
    });
  }

  async function deleteLead(id: string) {
    setDeletingLeadId(id);
    try {
      const res = await fetch(`/api/leads/${id}/delete`, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      setSelectedLead(null);
      router.refresh();
    } finally {
      setDeletingLeadId(null);
    }
  }

  function handleDrop(
    e: React.DragEvent<HTMLDivElement>,
    targetStatus: LeadStatus
  ) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    void moveLead(id, targetStatus);
  }

  return (
    <>
      <section className="overflow-x-auto pb-2">
        <div
          className={`grid auto-cols-[minmax(260px,1fr)] grid-flow-col gap-4 ${
            isPending ? "opacity-60" : ""
          }`}
        >
          {columns.map((col) => {
            const colLeads = leads.filter((lead) => lead.status === col.id);
            return (
              <div
                key={col.id}
                className="flex min-h-[220px] flex-col rounded-xl border border-slate-200 bg-white p-3"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                <div className="mb-2 flex items-baseline justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      {col.title}
                    </h2>
                    {col.description ? (
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {col.description}
                      </p>
                    ) : null}
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    {colLeads.length}
                  </span>
                </div>
                <div className="flex-1 space-y-2 overflow-hidden">
                  {colLeads.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-[11px] text-slate-400">
                      Zatím žádný lead v tomto stavu.
                    </div>
                  ) : (
                    colLeads.map((lead) => {
                      const project = lead.project_id ? projectMap[lead.project_id] : null;
                      return (
                      <article
                        key={lead.id}
                        draggable
                        onDragStart={(e) =>
                          e.dataTransfer.setData("text/plain", lead.id)
                        }
                        onClick={() => setSelectedLead(lead)}
                        className={`cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 hover:border-slate-300 hover:bg-slate-50 ${project ? "border-l-4" : ""}`}
                        style={project ? { borderLeftColor: project.color } : undefined}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-medium text-slate-900">
                              {lead.name || "Bez jména"}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {lead.email}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center justify-end gap-1">
                            {project ? (
                              <span
                                className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                                style={{ backgroundColor: `${project.color}30`, color: project.color }}
                              >
                                {project.name}
                              </span>
                            ) : null}
                            {hasBooking(lead.id) ? (
                              <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-medium text-amber-900" title="Má zarezervovaný termín">
                                Rezervace
                              </span>
                            ) : null}
                            {lead.source ? (
                              <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-700">
                                {lead.source}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        {lead.notes ? (
                          <p className="mt-2 line-clamp-3 text-[11px] text-slate-600">
                            {lead.notes}
                          </p>
                        ) : null}
                      </article>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {selectedLead && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 py-8"
          onClick={() => setSelectedLead(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Detail leada
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Rychlý přehled informací, než ho převedeš na klienta.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-200"
              >
                Zavřít
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Jméno
                </div>
                <div className="mt-0.5 rounded-lg bg-slate-50 px-2 py-1">
                  {selectedLead.name || "Bez jména"}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Email
                </div>
                <div className="mt-0.5 rounded-lg bg-slate-50 px-2 py-1">
                  {selectedLead.email}
                </div>
              </div>
              {hasBooking(selectedLead.id) && (
                <div className="rounded-lg bg-amber-50 px-2 py-1.5 text-[11px] text-amber-800">
                  Má zarezervovaný termín (úvodní call).
                </div>
              )}
              <div className="flex gap-3">
                <div className="flex-1">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Zdroj
                  </div>
                  <div className="mt-0.5 rounded-lg bg-slate-50 px-2 py-1">
                    {selectedLead.source || "Neuvedeno"}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Status
                  </div>
                  <div className="mt-0.5 inline-flex rounded-full bg-slate-900 px-2 py-1 text-[11px] font-medium text-white">
                    {columns.find((c) => c.id === selectedLead.status)?.title ??
                      selectedLead.status}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Poznámky
                </div>
                <div className="mt-0.5 min-h-[60px] rounded-lg bg-slate-50 px-2 py-1 text-[11px] text-slate-600">
                  {selectedLead.notes || "Zatím žádné poznámky."}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                onClick={() => selectedLead && deleteLead(selectedLead.id)}
                disabled={!!deletingLeadId}
              >
                {deletingLeadId ? "Odstraňuji…" : "Odstranit lead"}
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  onClick={() => setSelectedLead(null)}
                >
                  Zavřít
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-500"
                  // future: navigate to /clients/new?fromLead=...
                >
                  Vytvořit klienta (brzy)
                </button>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Odstraněný lead zůstane 48 h v archivu, kde ho lze obnovit. Klient se neodstraňuje.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

