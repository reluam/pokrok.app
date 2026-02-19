"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function NewEventPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug || slug === slugify(name)) setSlug(slugify(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: (slug || slugify(name)).trim() || slugify(name),
          duration_minutes: Math.min(120, Math.max(15, durationMinutes)),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      router.push(`/calendar/events/${data.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="py-2">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Nový event
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Název a délka. Dostupnost a odkaz nastavíš na další stránce.
      </p>

      <div className="mt-4">
        <Link
          href="/calendar/events"
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          ← Zpět na eventy
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-4 rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-slate-100">
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <div>
          <label htmlFor="ev-name" className="block text-sm font-medium text-slate-700">
            Název *
          </label>
          <input
            id="ev-name"
            type="text"
            required
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Úvodní konzultace zdarma"
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="ev-slug" className="block text-sm font-medium text-slate-700">
            Slug (pro odkaz)
          </label>
          <input
            id="ev-slug"
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="uvodni-konzultace"
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-700"
          />
          <p className="mt-0.5 text-xs text-slate-500">
            Pouze malá písmena, číslice, pomlčky. Odkaz bude /book/tvuj-slug/{slug || "…"}
          </p>
        </div>
        <div>
          <label htmlFor="ev-duration" className="block text-sm font-medium text-slate-700">
            Délka (minuty)
          </label>
          <input
            id="ev-duration"
            type="number"
            min={15}
            max={120}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value) || 30)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? "Vytvářím…" : "Vytvořit event"}
          </button>
          <Link
            href="/calendar/events"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Zrušit
          </Link>
        </div>
      </form>
    </div>
  );
}
