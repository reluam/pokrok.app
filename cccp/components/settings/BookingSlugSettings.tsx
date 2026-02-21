"use client";

import { useCallback, useEffect, useState } from "react";

export function BookingSlugSettings() {
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const fetchSlug = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/booking-slug");
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSlug(data.slug ?? "");
    } catch (e) {
      setMessage({ type: "error", text: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlug();
  }, [fetchSlug]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings/booking-slug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: slug.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      setSlug(data.slug ?? "");
      setMessage({ type: "ok", text: "Booking slug uložen." });
    } catch (e) {
      setMessage({ type: "error", text: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Načítám…</p>;
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-medium text-slate-900">Váš booking slug</h2>
      <p className="mt-0.5 text-xs text-slate-600">
        Používá se v odkazu na rezervaci: /book/<strong>váš-slug</strong>/slug-eventu
      </p>
      <form onSubmit={save} className="mt-3 flex flex-wrap items-end gap-2">
        <div className="min-w-[200px]">
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="např. matej"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-800"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? "Ukládám…" : "Uložit"}
        </button>
        {message && (
          <span className={message.type === "ok" ? "text-sm text-green-600" : "text-sm text-red-600"}>
            {message.text}
          </span>
        )}
      </form>
    </section>
  );
}
