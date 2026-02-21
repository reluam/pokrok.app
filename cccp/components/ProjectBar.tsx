"use client";

import { useCallback, useState } from "react";
import { useProjects } from "../contexts/ProjectsContext";

const MAX_PROJECTS = 5;

export function ProjectBar() {
  const ctx = useProjects();
  const projects = ctx?.projects ?? [];
  const selectedProjectIds = ctx?.selectedProjectIds ?? [];
  const toggleProject = ctx?.toggleProject ?? (() => {});
  const showSolo = ctx?.showSolo ?? (() => {});
  const refetchProjects = ctx?.refetchProjects ?? (async () => {});
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAdd = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Nepodařilo se vytvořit projekt.");
        return;
      }
      await refetchProjects();
      setNewName("");
      setAddOpen(false);
    } finally {
      setSaving(false);
    }
  }, [newName, refetchProjects]);

  if (projects.length === 0 && !addOpen) {
    return (
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-2">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500">Žádné projekty.</span>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
          >
            + Přidat projekt
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-slate-200 bg-slate-50 px-4 py-2">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="mr-1 text-slate-500">Projekty:</span>
        {projects.map((p) => {
          const selected = selectedProjectIds.includes(p.id);
          return (
            <span key={p.id} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => toggleProject(p.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  showSolo(p.id);
                }}
                title="Klik = zapnout/vypnout, pravý klik = jen tento"
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium transition ${
                  selected
                    ? "ring-1 ring-slate-300"
                    : "opacity-50 hover:opacity-75"
                }`}
                style={{
                  backgroundColor: selected ? `${p.color}20` : undefined,
                  color: selected ? p.color : undefined,
                  borderLeft: selected ? `3px solid ${p.color}` : undefined,
                }}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
                {p.name}
              </button>
            </span>
          );
        })}
        {projects.length < MAX_PROJECTS && (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 font-medium text-slate-600 hover:bg-slate-50"
          >
            + Přidat
          </button>
        )}
      </div>

      {addOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30"
          onClick={() => !saving && setAddOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-slate-900">Nový projekt</h3>
            <form onSubmit={handleAdd} className="mt-3 flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Název projektu"
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                autoFocus
              />
              <button
                type="submit"
                disabled={saving || !newName.trim()}
                className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {saving ? "…" : "Přidat"}
              </button>
              <button
                type="button"
                onClick={() => !saving && setAddOpen(false)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Zrušit
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
