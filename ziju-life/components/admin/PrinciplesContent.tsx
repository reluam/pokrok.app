"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";
import type { Principle } from "@/lib/principles";
import type { InspirationItem } from "@/lib/inspiration-db";

type PrincipleRow = Pick<
  Principle,
  | "id"
  | "slug"
  | "title"
  | "shortDescription"
  | "contentMarkdown"
  | "orderIndex"
  | "isActive"
  | "relatedInspirationIds"
>;

interface FormState {
  id?: string;
  title: string;
  slug: string;
  shortDescription: string;
  contentMarkdown: string;
  orderIndex: number;
  isActive: boolean;
  relatedInspirationIds: string[];
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

export default function PrinciplesContent() {
  const [principles, setPrinciples] = useState<PrincipleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPrinciples, setShowPrinciples] = useState(true);
  const [inspirations, setInspirations] = useState<InspirationItem[]>([]);
  const [loadingInspirations, setLoadingInspirations] = useState(false);

  useEffect(() => {
    loadPrinciples();
    loadSettings();
    loadInspirations();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (res.ok) {
        if (data.showPrinciples != null) {
          setShowPrinciples(Boolean(data.showPrinciples));
        } else {
          setShowPrinciples(true);
        }
      }
    } catch {
      setShowPrinciples(true);
    }
  };

  const loadInspirations = async () => {
    setLoadingInspirations(true);
    try {
      const res = await fetch("/api/inspiration?includeInactive=true");
      const data = await res.json();
      if (res.ok) {
        const all: InspirationItem[] = [
          ...(data.blogs || []),
          ...(data.videos || []),
          ...(data.books || []),
          ...(data.articles || []),
          ...(data.other || []),
          ...(data.music || []),
        ];
        setInspirations(all);
      }
    } catch {
      setInspirations([]);
    } finally {
      setLoadingInspirations(false);
    }
  };

  const loadPrinciples = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/principles?includeInactive=true");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Nepodařilo se načíst principy.");
      }
      setPrinciples(
        (data.principles || []) as PrincipleRow[]
      );
    } catch (e: unknown) {
      console.error(e);
      setError("Nepodařilo se načíst principy.");
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
      contentMarkdown: "",
      orderIndex:
        principles.length > 0
          ? Math.max(...principles.map((p) => p.orderIndex ?? 0)) + 1
          : 1,
      isActive: true,
      relatedInspirationIds: [],
    });
  };

  const startEdit = (p: PrincipleRow) => {
    setEditingId(p.id);
    setForm({
      id: p.id,
      title: p.title,
      slug: p.slug,
      shortDescription: p.shortDescription,
      contentMarkdown: p.contentMarkdown,
      orderIndex: p.orderIndex ?? 0,
      isActive: p.isActive,
      relatedInspirationIds: p.relatedInspirationIds ?? [],
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(null);
  };

  const handleFormChange = (
    field: keyof FormState,
    value: string | number | boolean | string[]
  ) => {
    setForm((prev) => {
      if (!prev) return prev;
      let next: FormState = { ...prev, [field]: value } as FormState;

      if (field === "title" && !prev.slug) {
        const auto = slugify(String(value));
        if (auto) {
          next.slug = auto;
        }
      }

      if (field === "orderIndex") {
        const n = Number(value);
        next.orderIndex = Number.isNaN(n) ? 0 : n;
      }

      return next;
    });
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
        contentMarkdown: form.contentMarkdown.trim() || form.shortDescription.trim(),
        orderIndex: form.orderIndex ?? 0,
        isActive: form.isActive,
        relatedInspirationIds: form.relatedInspirationIds ?? [],
      };

      const method = form.id ? "PUT" : "POST";
      const res = await fetch("/api/admin/principles", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Nepodařilo se uložit princip.");
      }

      await loadPrinciples();
      resetForm();
    } catch (e: unknown) {
      console.error(e);
      setError(
        e instanceof Error ? e.message : "Nepodařilo se uložit princip."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePrinciplesVisibility = async (next: boolean) => {
    setShowPrinciples(next);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showPrinciples: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Nepodařilo se uložit nastavení viditelnosti.");
      }
    } catch {
      alert("Chyba při ukládání nastavení viditelnosti.");
    }
  };

  const getSelectedInspirations = (ids: string[]) => {
    if (!ids || ids.length === 0) return [];
    return inspirations.filter((i) => ids.includes(i.id));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Opravdu chceš tento princip smazat?")) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/principles/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Nepodařilo se smazat princip.");
      }
      await loadPrinciples();
      if (form?.id === id) {
        resetForm();
      }
    } catch (e: unknown) {
      console.error(e);
      setError(
        e instanceof Error ? e.message : "Nepodařilo se smazat princip."
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Principy
        </h2>
        <p className="text-foreground/70 max-w-2xl">
          Seznam principů, na kterých stavíš Žiju life. Tady můžeš přidávat
          nové, upravovat texty a měnit pořadí, ve kterém se zobrazují na
          stránce.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-4 border-2 border-black/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Viditelnost stránky Principy
          </p>
          <p className="text-xs text-foreground/60 mt-1 max-w-xl">
            Když je vypnutá, odkaz na <code className="bg-black/5 px-1 rounded text-[11px]">/principy</code> zmizí z menu i patičky.
            Samotná stránka ale zůstane funkční, pokud znáš přímý odkaz.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="toggle-show-principles"
            type="checkbox"
            checked={showPrinciples}
            onChange={(e) => handleTogglePrinciplesVisibility(e.target.checked)}
            className="h-4 w-4 rounded border-black/20 text-accent focus:ring-accent"
          />
          <label
            htmlFor="toggle-show-principles"
            className="text-sm text-foreground/80"
          >
            Zobrazit „Principy“ v menu a zápatí
          </label>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white font-semibold shadow hover:bg-accent-hover transition-colors"
        >
          <Plus size={18} />
          <span>Přidat princip</span>
        </button>
        {loading && (
          <p className="text-sm text-foreground/60">Načítám principy…</p>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Seznam principů */}
      <div className="bg-white rounded-2xl border-2 border-black/10 overflow-hidden">
        {principles.length === 0 ? (
          <div className="py-10 text-center text-foreground/60">
            Zatím žádné principy. Klikni na „Přidat princip“ a začni první.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-black/10 bg-black/5">
                  <th className="px-4 py-3 font-semibold text-foreground text-sm w-20">
                    Pořadí
                  </th>
                  <th className="px-4 py-3 font-semibold text-foreground text-sm">
                    Název
                  </th>
                  <th className="px-4 py-3 font-semibold text-foreground text-sm hidden md:table-cell">
                    Slug
                  </th>
                  <th className="px-4 py-3 font-semibold text-foreground text-sm w-28">
                    Aktivní
                  </th>
                  <th className="px-4 py-3 font-semibold text-foreground text-sm w-32">
                    Akce
                  </th>
                </tr>
              </thead>
              <tbody>
                {principles
                  .slice()
                  .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
                  .map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-black/10 hover:bg-black/5 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-foreground/80">
                        {p.orderIndex ?? 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {p.title}
                      </td>
                      <td className="px-4 py-3 text-xs text-foreground/60 hidden md:table-cell">
                        {p.slug}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                            p.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-black/5 text-foreground/60"
                          }`}
                        >
                          {p.isActive ? "Ano" : "Skryto"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(p)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-black/10 text-foreground/70 hover:bg-black/5"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id)}
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

      {/* Formulář pro vytvoření / editaci */}
      {form && (
        <div className="bg-white rounded-2xl border-2 border-black/10 p-6 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-foreground">
                {editingId ? "Upravit princip" : "Nový princip"}
              </h3>
              <p className="text-sm text-foreground/60">
                Název se zobrazuje na webu, slug je URL adresa (můžeš ji
                nechat vygenerovat automaticky).
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Název principu
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) =>
                  handleFormChange("title", e.target.value)
                }
                className="w-full px-4 py-2.5 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white"
                placeholder="Za svůj život jsi zodpovědný pouze ty sám."
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Slug (URL)
              </label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) =>
                  handleFormChange("slug", slugify(e.target.value))
                }
                className="w-full px-4 py-2.5 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white text-sm"
                placeholder="za-svuj-zivot-jsi-zodpovedny-pouze-ty-sam"
              />
              <p className="text-xs text-foreground/50">
                Použij malá písmena bez diakritiky. Mezery se nahradí pomlčkami.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Krátký popis
              </label>
              <textarea
                value={form.shortDescription}
                onChange={(e) =>
                  handleFormChange("shortDescription", e.target.value)
                }
                className="w-full px-4 py-2.5 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white min-h-[96px] text-sm"
                placeholder="Jedna až dvě věty, které shrnují podstatu principu."
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Pořadí
              </label>
              <input
                type="number"
                value={form.orderIndex}
                onChange={(e) =>
                  handleFormChange("orderIndex", e.target.value)
                }
                className="w-32 px-4 py-2.5 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white"
                min={0}
              />
              <div className="flex items-center gap-2 mt-2">
                <input
                  id="princip-active"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    handleFormChange("isActive", e.target.checked)
                  }
                  className="h-4 w-4 rounded border-black/20 text-accent focus:ring-accent"
                />
                <label
                  htmlFor="princip-active"
                  className="text-sm text-foreground/80"
                >
                  Zobrazit na webu
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Detailní text (Markdown)
            </label>
            <textarea
              value={form.contentMarkdown}
              onChange={(e) =>
                handleFormChange("contentMarkdown", e.target.value)
              }
              className="w-full px-4 py-2.5 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white min-h-[160px] text-sm font-mono"
              placeholder="Můžeš použít **tučný text**, _kurzívu_ nebo odrážky..."
            />
            <p className="text-xs text-foreground/50">
              Podporuje{" "}
              <span className="font-semibold">Markdown</span> (nadpisy,
              odrážky, tučný text, kurzíva…).
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Přiřazené inspirace (volitelné)
            </label>
            {loadingInspirations ? (
              <p className="text-xs text-foreground/60">
                Načítám inspirace…
              </p>
            ) : inspirations.length === 0 ? (
              <p className="text-xs text-foreground/60">
                Zatím nemáš žádné inspirace. Nejprve je přidej v sekci
                „Inspirace“.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="max-h-48 overflow-y-auto rounded-xl border border-black/10 bg-black/2 p-2">
                  {inspirations.map((item) => {
                    const selected =
                      form.relatedInspirationIds?.includes(item.id);
                    return (
                      <label
                        key={item.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/5 text-xs cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(e) => {
                            const next = new Set(form.relatedInspirationIds);
                            if (e.target.checked) {
                              next.add(item.id);
                            } else {
                              next.delete(item.id);
                            }
                            handleFormChange(
                              "relatedInspirationIds",
                              Array.from(next)
                            );
                          }}
                          className="h-3.5 w-3.5 rounded border-black/20 text-accent focus:ring-accent"
                        />
                        <span className="flex-1 text-foreground/80">
                          <span className="font-semibold">{item.title}</span>
                          <span className="text-foreground/50">
                            {" "}
                            – {item.type}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
                {form.relatedInspirationIds.length > 0 && (
                  <p className="text-[11px] text-foreground/50">
                    Vybráno {form.relatedInspirationIds.length} inspirací –
                    zobrazí se na detailu principu.
                  </p>
                )}
              </div>
            )}
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white font-semibold shadow hover:bg-accent-hover disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={18} />
              <span>{saving ? "Ukládám…" : "Uložit princip"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

