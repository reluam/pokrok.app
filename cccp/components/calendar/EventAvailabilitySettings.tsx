"use client";

import { useCallback, useEffect, useState } from "react";

type WindowRow = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
};

const DAY_LABELS: Record<number, string> = {
  0: "Ne",
  1: "Po",
  2: "Út",
  3: "St",
  4: "Čt",
  5: "Pá",
  6: "So",
};

export function EventAvailabilitySettings({ eventId }: { eventId: string }) {
  const [windows, setWindows] = useState<WindowRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const fetchAvailability = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/availability`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setWindows(
        Array.isArray(data)
          ? data.map((w: { id: string; day_of_week: number; start_time: string; end_time: string }) => ({
              id: w.id,
              day_of_week: w.day_of_week,
              start_time: w.start_time?.slice(0, 5) ?? "09:00",
              end_time: w.end_time?.slice(0, 5) ?? "17:00",
            }))
          : []
      );
    } catch (e) {
      setMessage({ type: "error", text: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  const addRow = () => {
    setWindows((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        day_of_week: 1,
        start_time: "09:00",
        end_time: "17:00",
      },
    ]);
  };

  const removeRow = (id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  };

  const updateRow = (id: string, patch: Partial<WindowRow>) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...patch } : w))
    );
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/events/${eventId}/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          windows: windows.map((w) => ({
            day_of_week: w.day_of_week,
            start_time: w.start_time,
            end_time: w.end_time,
          })),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || res.statusText);
      }
      setMessage({ type: "ok", text: "Dostupnost uložena." });
    } catch (e) {
      setMessage({ type: "error", text: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Načítám dostupnost…</p>;
  }

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-slate-900">Dostupnost pro tento event</h2>
        <button
          type="button"
          onClick={addRow}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
        >
          Přidat okno
        </button>
      </div>
      <p className="mb-4 text-xs text-slate-600">
        V kterých dnech a časech lze rezervovat tento event. Délka slotu je daná nastavením eventu.
      </p>

      <div className="space-y-3">
        {windows.map((w) => (
          <div
            key={w.id}
            className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/50 p-2"
          >
            <select
              value={w.day_of_week}
              onChange={(e) =>
                updateRow(w.id, { day_of_week: parseInt(e.target.value, 10) })
              }
              className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
            >
              {Object.entries(DAY_LABELS).map(([d, label]) => (
                <option key={d} value={d}>
                  {label}
                </option>
              ))}
            </select>
            <input
              type="time"
              value={w.start_time}
              onChange={(e) => updateRow(w.id, { start_time: e.target.value })}
              className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
            />
            <span className="text-slate-500">–</span>
            <input
              type="time"
              value={w.end_time}
              onChange={(e) => updateRow(w.id, { end_time: e.target.value })}
              className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
            />
            <button
              type="button"
              onClick={() => removeRow(w.id)}
              className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
              aria-label="Odstranit"
            >
              Odebrat
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? "Ukládám…" : "Uložit dostupnost"}
        </button>
        {message && (
          <span
            className={
              message.type === "ok"
                ? "text-sm text-green-600"
                : "text-sm text-red-600"
            }
          >
            {message.text}
          </span>
        )}
      </div>
    </section>
  );
}
