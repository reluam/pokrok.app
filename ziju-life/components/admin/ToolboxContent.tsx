"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Save, X, ChevronDown, ChevronUp } from "lucide-react";
import type { ToolboxTool, ToolSource, ToolSourceType } from "@/lib/toolbox";
import { TOOLBOX_CATEGORIES } from "@/lib/toolbox";

interface FormState {
  id?: string;
  title: string;
  slug: string;
  shortDescription: string;
  descriptionMarkdown: string;
  applicationMarkdown: string;
  sources: ToolSource[];
  tags: string[];
  category: string;
  difficulty: number | null;
  durationEstimate: string;
  icon: string;
  orderIndex: number;
  isActive: boolean;
  isFeatured: boolean;
}

const SOURCE_TYPES: { value: ToolSourceType; label: string }[] = [
  { value: "book", label: "Kniha" },
  { value: "article", label: "Článek" },
  { value: "video", label: "Video" },
  { value: "research", label: "Výzkum" },
  { value: "podcast", label: "Podcast" },
  { value: "course", label: "Kurz" },
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const emptySource = (): ToolSource => ({
  type: "book",
  title: "",
  author: "",
  url: "",
  note: "",
});

export default function ToolboxContent() {
  const [tools, setTools] = useState<ToolboxTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/toolbox?includeInactive=true");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Nepodařilo se načíst nástroje.");
      setTools((data.tools || []) as ToolboxTool[]);
    } catch (e: unknown) {
      console.error(e);
      setError("Nepodařilo se načíst nástroje.");
    } finally {
      setLoading(false);
    }
  };

  const startCreate = () => {
    setEditingId(null);
    setForm({
      title: "",
      slug: "",
      shortDescription: "",
      descriptionMarkdown: "",
      applicationMarkdown: "",
      sources: [],
      tags: [],
      category: "",
      difficulty: null,
      durationEstimate: "",
      icon: "",
      orderIndex: tools.length > 0 ? Math.max(...tools.map((t) => t.orderIndex ?? 0)) + 1 : 1,
      isActive: true,
      isFeatured: false,
    });
    setTagInput("");
  };

  const startEdit = (t: ToolboxTool) => {
    setEditingId(t.id);
    setForm({
      id: t.id,
      title: t.title,
      slug: t.slug,
      shortDescription: t.shortDescription,
      descriptionMarkdown: t.descriptionMarkdown,
      applicationMarkdown: t.applicationMarkdown,
      sources: t.sources ?? [],
      tags: t.tags ?? [],
      category: t.category ?? "",
      difficulty: t.difficulty ?? null,
      durationEstimate: t.durationEstimate ?? "",
      icon: t.icon ?? "",
      orderIndex: t.orderIndex ?? 0,
      isActive: t.isActive,
      isFeatured: t.isFeatured,
    });
    setTagInput("");
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(null);
    setTagInput("");
  };

  const handleFormChange = (field: keyof FormState, value: unknown) => {
    setForm((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [field]: value } as FormState;

      if (field === "title" && !prev.slug) {
        const auto = slugify(String(value));
        if (auto) next.slug = auto;
      }

      if (field === "orderIndex") {
        const n = Number(value);
        next.orderIndex = Number.isNaN(n) ? 0 : n;
      }

      return next;
    });
  };

  // Sources management
  const addSource = () => {
    if (!form) return;
    handleFormChange("sources", [...form.sources, emptySource()]);
  };

  const updateSource = (index: number, field: keyof ToolSource, value: string) => {
    if (!form) return;
    const next = form.sources.map((s, i) => (i === index ? { ...s, [field]: value } : s));
    handleFormChange("sources", next);
  };

  const removeSource = (index: number) => {
    if (!form) return;
    handleFormChange("sources", form.sources.filter((_, i) => i !== index));
  };

  const moveSource = (index: number, direction: -1 | 1) => {
    if (!form) return;
    const next = [...form.sources];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= next.length) return;
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    handleFormChange("sources", next);
  };

  // Tags management
  const addTag = () => {
    if (!form || !tagInput.trim()) return;
    const tag = tagInput.trim().toLowerCase();
    if (!form.tags.includes(tag)) {
      handleFormChange("tags", [...form.tags, tag]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    if (!form) return;
    handleFormChange("tags", form.tags.filter((t) => t !== tag));
  };

  const handleSave = async () => {
    if (!form) return;
    if (!form.title.trim() || !form.slug.trim() || !form.shortDescription.trim()) {
      alert("Vyplň prosím název, slug a krátký popis.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        id: form.id,
        title: form.title.trim(),
        slug: form.slug.trim(),
        shortDescription: form.shortDescription.trim(),
        descriptionMarkdown: form.descriptionMarkdown.trim() || form.shortDescription.trim(),
        applicationMarkdown: form.applicationMarkdown.trim(),
        sources: form.sources.filter((s) => s.title.trim()),
        tags: form.tags,
        category: form.category || null,
        difficulty: form.difficulty,
        durationEstimate: form.durationEstimate.trim() || null,
        icon: form.icon.trim() || null,
        orderIndex: form.orderIndex ?? 0,
        isActive: form.isActive,
        isFeatured: form.isFeatured,
      };

      const method = form.id ? "PUT" : "POST";
      const res = await fetch("/api/admin/toolbox", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Nepodařilo se uložit nástroj.");

      await loadTools();
      resetForm();
    } catch (e: unknown) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Nepodařilo se uložit nástroj.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Opravdu chceš tento nástroj smazat?")) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/toolbox/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Nepodařilo se smazat nástroj.");
      await loadTools();
      if (form?.id === id) resetForm();
    } catch (e: unknown) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Nepodařilo se smazat nástroj.");
    }
  };

  const getCategoryLabel = (id: string) => {
    const cat = TOOLBOX_CATEGORIES.find((c) => c.id === id);
    return cat ? `${cat.icon} ${cat.label}` : id;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Nástrojárna</h2>
        <p className="text-foreground/70 max-w-2xl">
          Sbírka nástrojů pro osobní rozvoj — každý má popis, návod na aplikaci a zdroje pro hlubší práci.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white font-semibold shadow hover:bg-accent-hover transition-colors"
        >
          <Plus size={18} />
          <span>Přidat nástroj</span>
        </button>
        {loading && <p className="text-sm text-foreground/60">Načítám nástroje…</p>}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border-2 border-black/10 overflow-hidden">
        {tools.length === 0 ? (
          <div className="py-10 text-center text-foreground/60">
            Zatím žádné nástroje. Klikni na „Přidat nástroj" a začni.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-black/10 bg-black/5">
                  <th className="px-4 py-3 font-semibold text-foreground text-sm w-16">#</th>
                  <th className="px-4 py-3 font-semibold text-foreground text-sm">Název</th>
                  <th className="px-4 py-3 font-semibold text-foreground text-sm hidden md:table-cell">Kategorie</th>
                  <th className="px-4 py-3 font-semibold text-foreground text-sm hidden lg:table-cell w-20">Zdroje</th>
                  <th className="px-4 py-3 font-semibold text-foreground text-sm w-28">Stav</th>
                  <th className="px-4 py-3 font-semibold text-foreground text-sm w-32">Akce</th>
                </tr>
              </thead>
              <tbody>
                {tools
                  .slice()
                  .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
                  .map((t) => (
                    <tr key={t.id} className="border-b border-black/10 hover:bg-black/5 transition-colors">
                      <td className="px-4 py-3 text-sm text-foreground/80">{t.orderIndex ?? 0}</td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        <div className="flex items-center gap-2">
                          {t.icon && <span>{t.icon}</span>}
                          <span className="font-medium">{t.title}</span>
                          {t.isFeatured && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              Featured
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-foreground/60 hidden md:table-cell">
                        {t.category ? getCategoryLabel(t.category) : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground/60 hidden lg:table-cell">
                        {t.sources?.length ?? 0}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                            t.isActive ? "bg-emerald-50 text-emerald-700" : "bg-black/5 text-foreground/60"
                          }`}
                        >
                          {t.isActive ? "Aktivní" : "Skryto"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(t)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-black/10 text-foreground/70 hover:bg-black/5"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(t.id)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-red-100 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form */}
      {form && (
        <div className="bg-white rounded-2xl border-2 border-black/10 p-6 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-foreground">
                {editingId ? "Upravit nástroj" : "Nový nástroj"}
              </h3>
              <p className="text-sm text-foreground/60">
                Název a slug jsou povinné. Slug se vygeneruje automaticky z názvu.
              </p>
            </div>
            <button type="button" onClick={resetForm} className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-black/10 text-foreground/60 hover:bg-black/5">
              <X size={16} />
            </button>
          </div>

          {/* Row 1: Title + Slug */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Název</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleFormChange("title", e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white"
                placeholder="Eisenhowerova matice"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Slug (URL)</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => handleFormChange("slug", slugify(e.target.value))}
                className="w-full px-4 py-2.5 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white text-sm"
                placeholder="eisenhowerova-matice"
              />
            </div>
          </div>

          {/* Row 2: Short description */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Krátký popis</label>
            <textarea
              value={form.shortDescription}
              onChange={(e) => handleFormChange("shortDescription", e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white min-h-[72px] text-sm"
              placeholder="Jedna až dvě věty — co nástroj dělá a proč je užitečný."
            />
          </div>

          {/* Row 3: Category + Difficulty + Duration + Icon */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Kategorie</label>
              <select
                value={form.category}
                onChange={(e) => handleFormChange("category", e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white text-sm"
              >
                <option value="">— žádná —</option>
                {TOOLBOX_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Obtížnost</label>
              <select
                value={form.difficulty ?? ""}
                onChange={(e) => handleFormChange("difficulty", e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2.5 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white text-sm"
              >
                <option value="">— —</option>
                <option value="1">1 — Snadné</option>
                <option value="2">2 — Střední</option>
                <option value="3">3 — Pokročilé</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Trvání</label>
              <input
                type="text"
                value={form.durationEstimate}
                onChange={(e) => handleFormChange("durationEstimate", e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white text-sm"
                placeholder="15 min"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Ikona (emoji)</label>
              <input
                type="text"
                value={form.icon}
                onChange={(e) => handleFormChange("icon", e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white text-sm"
                placeholder="🎯"
              />
            </div>
          </div>

          {/* Row 4: Description Markdown */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Popis — k čemu je dobrý (Markdown)</label>
            <textarea
              value={form.descriptionMarkdown}
              onChange={(e) => handleFormChange("descriptionMarkdown", e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white min-h-[140px] text-sm font-mono"
              placeholder="Podrobný popis nástroje..."
            />
          </div>

          {/* Row 5: Application Markdown */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Jak na to — návod na aplikaci (Markdown)</label>
            <textarea
              value={form.applicationMarkdown}
              onChange={(e) => handleFormChange("applicationMarkdown", e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white min-h-[140px] text-sm font-mono"
              placeholder="Krok za krokem, jak nástroj použít..."
            />
          </div>

          {/* Row 6: Tags */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Tagy</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-black/5 text-foreground/70"
                >
                  #{tag}
                  <button type="button" onClick={() => removeTag(tag)} className="text-foreground/40 hover:text-red-500">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                className="flex-1 px-3 py-2 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white text-sm"
                placeholder="Přidej tag a stiskni Enter…"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-2 rounded-xl border border-black/10 text-foreground/70 hover:bg-black/5 text-sm"
              >
                Přidat
              </button>
            </div>
          </div>

          {/* Row 7: Sources */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-foreground">
                Zdroje ({form.sources.length})
              </label>
              <button
                type="button"
                onClick={addSource}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 text-foreground/70 hover:bg-black/5 text-xs font-medium"
              >
                <Plus size={14} />
                Přidat zdroj
              </button>
            </div>
            {form.sources.length === 0 && (
              <p className="text-xs text-foreground/50">Zatím žádné zdroje. Přidej knihy, videa, články…</p>
            )}
            {form.sources.map((source, i) => (
              <div key={i} className="rounded-xl border border-black/10 p-4 space-y-3 bg-black/2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-foreground/50">Zdroj #{i + 1}</span>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => moveSource(i, -1)} disabled={i === 0} className="w-6 h-6 rounded border border-black/10 text-foreground/50 hover:bg-black/5 disabled:opacity-30 inline-flex items-center justify-center">
                      <ChevronUp size={12} />
                    </button>
                    <button type="button" onClick={() => moveSource(i, 1)} disabled={i === form.sources.length - 1} className="w-6 h-6 rounded border border-black/10 text-foreground/50 hover:bg-black/5 disabled:opacity-30 inline-flex items-center justify-center">
                      <ChevronDown size={12} />
                    </button>
                    <button type="button" onClick={() => removeSource(i)} className="w-6 h-6 rounded border border-red-100 text-red-500 hover:bg-red-50 inline-flex items-center justify-center">
                      <X size={12} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-foreground/60">Typ</label>
                    <select
                      value={source.type}
                      onChange={(e) => updateSource(i, "type", e.target.value)}
                      className="w-full px-2 py-1.5 border border-black/10 rounded-lg bg-white text-xs"
                    >
                      {SOURCE_TYPES.map((st) => (
                        <option key={st.value} value={st.value}>{st.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-foreground/60">Název</label>
                    <input
                      type="text"
                      value={source.title}
                      onChange={(e) => updateSource(i, "title", e.target.value)}
                      className="w-full px-2 py-1.5 border border-black/10 rounded-lg bg-white text-xs"
                      placeholder="Atomic Habits"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-foreground/60">Autor</label>
                    <input
                      type="text"
                      value={source.author ?? ""}
                      onChange={(e) => updateSource(i, "author", e.target.value)}
                      className="w-full px-2 py-1.5 border border-black/10 rounded-lg bg-white text-xs"
                      placeholder="James Clear"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-foreground/60">URL</label>
                    <input
                      type="text"
                      value={source.url ?? ""}
                      onChange={(e) => updateSource(i, "url", e.target.value)}
                      className="w-full px-2 py-1.5 border border-black/10 rounded-lg bg-white text-xs"
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground/60">Poznámka</label>
                  <input
                    type="text"
                    value={source.note ?? ""}
                    onChange={(e) => updateSource(i, "note", e.target.value)}
                    className="w-full px-2 py-1.5 border border-black/10 rounded-lg bg-white text-xs"
                    placeholder="Kapitola 4 se tomuto tématu věnuje detailně…"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Row 8: Order + toggles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Pořadí</label>
              <input
                type="number"
                value={form.orderIndex}
                onChange={(e) => handleFormChange("orderIndex", e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white text-sm"
                min={0}
              />
            </div>
            <div className="space-y-2 flex flex-col justify-end">
              <div className="flex items-center gap-2">
                <input
                  id="tool-active"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => handleFormChange("isActive", e.target.checked)}
                  className="h-4 w-4 rounded border-black/20 text-accent focus:ring-accent"
                />
                <label htmlFor="tool-active" className="text-sm text-foreground/80">
                  Aktivní
                </label>
              </div>
            </div>
            <div className="space-y-2 flex flex-col justify-end">
              <div className="flex items-center gap-2">
                <input
                  id="tool-featured"
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => handleFormChange("isFeatured", e.target.checked)}
                  className="h-4 w-4 rounded border-black/20 text-accent focus:ring-accent"
                />
                <label htmlFor="tool-featured" className="text-sm text-foreground/80">
                  Doporučený
                </label>
              </div>
            </div>
          </div>

          {/* Save / Cancel */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-black/10 text-foreground/70 hover:bg-black/5"
            >
              <X size={16} />
              <span>Zrušit</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white font-semibold shadow hover:bg-accent-hover disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={18} />
              <span>{saving ? "Ukládám…" : "Uložit nástroj"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
