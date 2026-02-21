"use client";

import { useCallback, useEffect, useState } from "react";

export function FirstDayOfWeekSettings() {
  const [firstDayOfWeek, setFirstDayOfWeek] = useState<0 | 1>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const fetchSetting = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/first-day-of-week");
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setFirstDayOfWeek((data.first_day_of_week === 0 ? 0 : 1) as 0 | 1);
    } catch (e) {
      setMessage({ type: "error", text: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSetting();
  }, [fetchSetting]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings/first-day-of-week", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_day_of_week: firstDayOfWeek }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      setFirstDayOfWeek((data.first_day_of_week === 0 ? 0 : 1) as 0 | 1);
      setMessage({ type: "ok", text: "Uloženo." });
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
      <h2 className="text-sm font-medium text-slate-900">První den týdne v kalendáři rezervací</h2>
      <p className="mt-0.5 text-xs text-slate-600">
        Jak se zobrazují týdny v rezervačním widgetu: Pondělí nebo Neděle.
      </p>
      <form onSubmit={save} className="mt-3">
        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setFirstDayOfWeek(1)}
            className={`relative rounded-lg px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-100 ${
              firstDayOfWeek === 1
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Pondělí
          </button>
          <button
            type="button"
            onClick={() => setFirstDayOfWeek(0)}
            className={`relative rounded-lg px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-100 ${
              firstDayOfWeek === 0
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Neděle
          </button>
        </div>
        {message && (
          <p className={`mt-2 text-xs ${message.type === "ok" ? "text-emerald-600" : "text-red-600"}`}>
            {message.text}
          </p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="mt-3 rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {saving ? "Ukládám…" : "Uložit"}
        </button>
      </form>
    </section>
  );
}
