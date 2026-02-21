"use client";

import { useCallback, useState } from "react";
import { useProjects } from "../contexts/ProjectsContext";
import type { Project } from "../contexts/ProjectsContext";

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
  const [newLogoUrl, setNewLogoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editLogoUrl, setEditLogoUrl] = useState("");

  const openEdit = useCallback((p: Project) => {
    setEditProject(p);
    setEditName(p.name);
    setEditColor(p.color);
    setEditLogoUrl(p.logo_url ?? "");
  }, []);

  const handleAdd = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          logo_url: newLogoUrl.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Nepodařilo se vytvořit projekt.");
        return;
      }
      await refetchProjects();
      setNewName("");
      setNewLogoUrl("");
      setAddOpen(false);
    } finally {
      setSaving(false);
    }
  }, [newName, newLogoUrl, refetchProjects]);

  const handleEdit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProject) return;
    const name = editName.trim();
    if (!name) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${editProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          color: /^#[0-9A-Fa-f]{6}$/.test(editColor.trim()) ? editColor.trim() : editProject.color,
          logo_url: editLogoUrl.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Nepodařilo se uložit.");
        return;
      }
      await refetchProjects();
      setEditProject(null);
    } finally {
      setSaving(false);
    }
  }, [editProject, editName, editColor, editLogoUrl, refetchProjects]);

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
                className={`inline-flex items-center gap-1.5 rounded-full pl-2 pr-1.5 py-1 font-medium transition ${
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
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openEdit(p);
                }}
                title="Upravit projekt (název, barva, logo)"
                className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <span className="sr-only">Upravit</span>
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
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
            <form onSubmit={handleAdd} className="mt-3 space-y-3">
              <div>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Název projektu"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-0.5">Logo (URL)</label>
                <input
                  type="url"
                  value={newLogoUrl}
                  onChange={(e) => setNewLogoUrl(e.target.value)}
                  placeholder="https://…"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                <p className="mt-0.5 text-[11px] text-slate-400">Volitelné. Zobrazí se v potvrzovacích e-mailech.</p>
              </div>
              <div className="flex gap-2">
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
              </div>
            </form>
          </div>
        </div>
      )}

      {editProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30"
          onClick={() => !saving && setEditProject(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-slate-900">Upravit projekt</h3>
            <form onSubmit={handleEdit} className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-0.5">Název</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-0.5">Barva</label>
                <input
                  type="text"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  placeholder="#3B82F6"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-0.5">Logo (URL)</label>
                <input
                  type="url"
                  value={editLogoUrl}
                  onChange={(e) => setEditLogoUrl(e.target.value)}
                  placeholder="https://…"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                <p className="mt-0.5 text-[11px] text-slate-400">Volitelné. Zobrazí se v potvrzovacích e-mailech.</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving || !editName.trim()}
                  className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving ? "…" : "Uložit"}
                </button>
                <button
                  type="button"
                  onClick={() => !saving && setEditProject(null)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Zrušit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
