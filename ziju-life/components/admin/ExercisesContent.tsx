"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Save, X, Link as LinkIcon, Sparkles } from "lucide-react";
import type { Exercise } from "@/lib/exercises";

type ResourceKind = "none" | "url" | "inspirace";

type PostOption = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  tags: string[];
};

interface FormState {
  id?: string;
  title: string;
  slug: string;
  emoji: string;
  bodyMarkdown: string;
  orderIndex: number;
  isActive: boolean;
  resourceKind: ResourceKind;
  resourceUrl: string;
  relatedPostSlug: string;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export default function ExercisesContent() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [posts, setPosts] = useState<PostOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadExercises();
    loadPosts();
  }, []);

  const loadExercises = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/exercises?includeInactive=true");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Nepodařilo se načíst cvičení.");
      setExercises((data.exercises || []) as Exercise[]);
    } catch (e: unknown) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Nepodařilo se načíst cvičení.");
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const res = await fetch("/api/feed?limit=200");
      const data = await res.json();
      if (res.ok && Array.isArray(data.posts)) {
        setPosts(
          data.posts.map((p: PostOption) => ({
            id: p.id,
            slug: p.slug,
            title: p.title,
            subtitle: p.subtitle,
            tags: p.tags || [],
          }))
        );
      }
    } catch {
      // Ignore — picker will just be empty
    }
  };

  const startCreate = () => {
    setEditingId(null);
    setForm({
      title: "",
      slug: "",
      emoji: "🧘",
      bodyMarkdown: "",
      orderIndex:
        exercises.length > 0
          ? Math.max(...exercises.map((e) => e.orderIndex ?? 0)) + 1
          : 1,
      isActive: true,
      resourceKind: "none",
      resourceUrl: "",
      relatedPostSlug: "",
    });
  };

  const startEdit = (ex: Exercise) => {
    setEditingId(ex.id);
    const resourceKind: ResourceKind = ex.resourceUrl
      ? "url"
      : ex.relatedPostSlug
      ? "inspirace"
      : "none";
    setForm({
      id: ex.id,
      title: ex.title,
      slug: ex.slug,
      emoji: ex.emoji ?? "",
      bodyMarkdown: ex.bodyMarkdown,
      orderIndex: ex.orderIndex ?? 0,
      isActive: ex.isActive,
      resourceKind,
      resourceUrl: ex.resourceUrl ?? "",
      relatedPostSlug: ex.relatedPostSlug ?? "",
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(null);
  };

  const handleFormChange = <K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) => {
    setForm((prev) => {
      if (!prev) return prev;
      const next: FormState = { ...prev, [field]: value };
      if (field === "title" && !prev.slug) {
        const auto = slugify(String(value));
        if (auto) next.slug = auto;
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!form) return;
    if (!form.title.trim() || !form.slug.trim() || !form.bodyMarkdown.trim()) {
      alert("Vyplň prosím název, slug a text cvičení.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        id: form.id,
        title: form.title.trim(),
        slug: form.slug.trim(),
        emoji: form.emoji.trim() || null,
        bodyMarkdown: form.bodyMarkdown.trim(),
        orderIndex: form.orderIndex ?? 0,
        isActive: form.isActive,
        resourceUrl:
          form.resourceKind === "url" ? form.resourceUrl.trim() || null : null,
        relatedPostSlug:
          form.resourceKind === "inspirace"
            ? form.relatedPostSlug.trim() || null
            : null,
      };

      const method = form.id ? "PUT" : "POST";
      const res = await fetch("/api/admin/exercises", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Nepodařilo se uložit cvičení.");

      await loadExercises();
      resetForm();
    } catch (e: unknown) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Nepodařilo se uložit cvičení.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Opravdu chceš toto cvičení smazat?")) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/exercises/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Nepodařilo se smazat cvičení.");
      await loadExercises();
      if (form?.id === id) resetForm();
    } catch (e: unknown) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Nepodařilo se smazat cvičení.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Cvičení</h2>
        <p className="text-foreground/70 max-w-2xl">
          Textová cvičení, která se zobrazují na stránce{" "}
          <code className="bg-black/5 px-1 rounded text-[11px]">/koucing</code>.
          Každé může mít nepovinný odkaz — buď na externí web, nebo na vlastní
          inspiraci z knihovny (zobrazí se jako karta).
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white font-semibold shadow hover:bg-accent-hover transition-colors"
        >
          <Plus size={18} />
          <span>Přidat cvičení</span>
        </button>
        {loading && <p className="text-sm text-foreground/60">Načítám cvičení…</p>}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border-2 border-black/10 overflow-hidden">
        {exercises.length === 0 ? (
          <div className="py-10 text-center text-foreground/60">
            Zatím žádné cvičení. Klikni na „Přidat cvičení".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-black/10 bg-black/5">
                  <th className="px-4 py-3 text-sm w-20">Pořadí</th>
                  <th className="px-4 py-3 text-sm w-16"></th>
                  <th className="px-4 py-3 text-sm">Název</th>
                  <th className="px-4 py-3 text-sm hidden md:table-cell">Zdroj</th>
                  <th className="px-4 py-3 text-sm w-28">Aktivní</th>
                  <th className="px-4 py-3 text-sm w-32">Akce</th>
                </tr>
              </thead>
              <tbody>
                {exercises
                  .slice()
                  .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
                  .map((ex) => (
                    <tr
                      key={ex.id}
                      className="border-b border-black/10 hover:bg-black/5 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-foreground/80">
                        {ex.orderIndex ?? 0}
                      </td>
                      <td className="px-4 py-3 text-xl">{ex.emoji ?? ""}</td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {ex.title}
                      </td>
                      <td className="px-4 py-3 text-xs text-foreground/60 hidden md:table-cell">
                        {ex.resourceUrl ? (
                          <span className="inline-flex items-center gap-1">
                            <LinkIcon size={12} /> URL
                          </span>
                        ) : ex.relatedPostSlug ? (
                          <span className="inline-flex items-center gap-1">
                            <Sparkles size={12} /> {ex.relatedPostSlug}
                          </span>
                        ) : (
                          <span className="text-foreground/30">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                            ex.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-black/5 text-foreground/60"
                          }`}
                        >
                          {ex.isActive ? "Ano" : "Skryto"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(ex)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-black/10 text-foreground/70 hover:bg-black/5"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(ex.id)}
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

      {form && (
        <div className="bg-white rounded-2xl border-2 border-black/10 p-6 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-foreground">
                {editingId ? "Upravit cvičení" : "Nové cvičení"}
              </h3>
              <p className="text-sm text-foreground/60">
                Emoji, název, text. Nepovinně přilož externí odkaz nebo inspiraci
                z knihovny.
              </p>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-black/10 text-foreground/60 hover:bg-black/5"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[80px_1fr_1fr] gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Emoji</label>
              <input
                type="text"
                value={form.emoji}
                onChange={(e) => handleFormChange("emoji", e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-black/10 rounded-xl text-center text-xl bg-white"
                placeholder="🧘"
                maxLength={4}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Název</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleFormChange("title", e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white"
                placeholder="Cílená nuda"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Slug (URL)</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) =>
                  handleFormChange("slug", slugify(e.target.value))
                }
                className="w-full px-4 py-2.5 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white text-sm"
                placeholder="cilena-nuda"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Text cvičení (Markdown)
            </label>
            <textarea
              value={form.bodyMarkdown}
              onChange={(e) => handleFormChange("bodyMarkdown", e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white min-h-[140px] text-sm font-mono"
              placeholder="15 minut denně: žádný telefon, žádná stimulace..."
            />
          </div>

          <div className="space-y-3 p-4 rounded-xl bg-black/[0.02] border border-black/5">
            <label className="block text-sm font-semibold">
              Nepovinný zdroj na konci cvičení
            </label>
            <div className="flex gap-2 flex-wrap">
              {(
                [
                  { v: "none", label: "Žádný" },
                  { v: "url", label: "Externí URL" },
                  { v: "inspirace", label: "Inspirace z knihovny" },
                ] as { v: ResourceKind; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => handleFormChange("resourceKind", opt.v)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    form.resourceKind === opt.v
                      ? "bg-accent text-white border-accent"
                      : "bg-white border-black/10 text-foreground/70 hover:bg-black/5"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {form.resourceKind === "url" && (
              <div className="space-y-1">
                <input
                  type="url"
                  value={form.resourceUrl}
                  onChange={(e) => handleFormChange("resourceUrl", e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white text-sm"
                  placeholder="https://example.com/clanek"
                />
                <p className="text-xs text-foreground/50">
                  Zobrazí se jako tlačítko „Další zdroj &rarr;" pod textem cvičení.
                </p>
              </div>
            )}

            {form.resourceKind === "inspirace" && (
              <div className="space-y-1">
                <select
                  value={form.relatedPostSlug}
                  onChange={(e) =>
                    handleFormChange("relatedPostSlug", e.target.value)
                  }
                  className="w-full px-4 py-2.5 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white text-sm"
                >
                  <option value="">&mdash; Vyber inspiraci &mdash;</option>
                  {posts.map((p) => (
                    <option key={p.id} value={p.slug}>
                      {p.title}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-foreground/50">
                  Inspirace se pod cvičením zobrazí jako klasická karta z knihovny.
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium">Pořadí</label>
              <input
                type="number"
                value={form.orderIndex}
                onChange={(e) =>
                  handleFormChange(
                    "orderIndex",
                    Number.isNaN(Number(e.target.value)) ? 0 : Number(e.target.value)
                  )
                }
                className="w-32 px-4 py-2.5 border-2 border-black/10 rounded-xl bg-white"
                min={1}
              />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input
                id="exercise-active"
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => handleFormChange("isActive", e.target.checked)}
                className="h-4 w-4 rounded border-black/20 text-accent focus:ring-accent"
              />
              <label htmlFor="exercise-active" className="text-sm text-foreground/80">
                Zobrazit na webu
              </label>
            </div>
          </div>

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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white font-semibold shadow hover:bg-accent-hover disabled:opacity-60 transition-colors"
            >
              <Save size={18} />
              <span>{saving ? "Ukládám…" : "Uložit cvičení"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
