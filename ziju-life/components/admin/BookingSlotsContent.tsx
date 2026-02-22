"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";

type Block = {
  id?: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
};

type DayEntry = {
  dayOfWeek: number;
  dayName: string;
  blocks: Block[];
};

type Slot = {
  id: string;
  startAt: string;
  durationMinutes: number;
  title: string | null;
  isBooked: boolean;
};

const DEFAULT_SLOT_DURATION = 30;

export default function BookingSlotsContent() {
  const [days, setDays] = useState<DayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [addDate, setAddDate] = useState("");
  const [addTime, setAddTime] = useState("09:00");
  const [addDuration, setAddDuration] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadWeekly = () => {
    fetch("/api/admin/weekly-availability")
      .then((r) => r.json())
      .then((data) => {
        if (data.days) setDays(data.days);
      })
      .catch(() => setError("Chyba načtení dostupnosti"));
  };

  const loadSlots = () => {
    setSlotsLoading(true);
    fetch("/api/admin/booking-slots")
      .then((r) => r.json())
      .then((data) => {
        if (data.slots) setSlots(data.slots);
      })
      .catch(() => {})
      .finally(() => setSlotsLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    loadWeekly();
    loadSlots();
    setLoading(false);
  }, []);

  const addBlock = (dayOfWeek: number) => {
    setDays((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayOfWeek
          ? {
              ...d,
              blocks: [
                ...d.blocks,
                { startTime: "09:00", endTime: "12:00", slotDurationMinutes: DEFAULT_SLOT_DURATION },
              ],
            }
          : d
      )
    );
  };

  const removeBlock = (dayOfWeek: number, index: number) => {
    setDays((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayOfWeek
          ? { ...d, blocks: d.blocks.filter((_, i) => i !== index) }
          : d
      )
    );
  };

  const updateBlock = (
    dayOfWeek: number,
    index: number,
    field: keyof Block,
    value: string | number
  ) => {
    setDays((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayOfWeek
          ? {
              ...d,
              blocks: d.blocks.map((b, i) =>
                i === index ? { ...b, [field]: value } : b
              ),
            }
          : d
      )
    );
  };

  const saveWeekly = () => {
    setSaving(true);
    setError("");
    const blocks = days.flatMap((d) =>
      d.blocks.map((b) => ({
        dayOfWeek: d.dayOfWeek,
        startTime: b.startTime.slice(0, 5),
        endTime: b.endTime.slice(0, 5),
        slotDurationMinutes: b.slotDurationMinutes || 30,
      }))
    );
    fetch("/api/admin/weekly-availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else loadWeekly();
      })
      .catch(() => setError("Chyba ukládání"))
      .finally(() => setSaving(false));
  };

  const handleAddOneOff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addDate.trim()) return;
    setSubmitting(true);
    setError("");
    const startAt = `${addDate}T${addTime}:00`;
    fetch("/api/admin/booking-slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startAt, durationMinutes: addDuration }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else {
          loadSlots();
          setAddDate("");
          setAddTime("09:00");
        }
      })
      .catch(() => setError("Chyba ukládání"))
      .finally(() => setSubmitting(false));
  };

  const handleDeleteSlot = (id: string) => {
    if (!confirm("Opravdu smazat tento termín?")) return;
    fetch(`/api/admin/booking-slots/${id}`, { method: "DELETE" })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else loadSlots();
      });
  };

  const formatSlot = (s: Slot) => {
    const d = new Date(s.startAt);
    return d.toLocaleString("cs-CZ", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading && days.length === 0) {
    return <p className="text-foreground/60">Načítání…</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Rezervace</h2>
        <p className="text-foreground/70">
          Nastav dostupnost po dnech (bloky od–do) a případně přidej jednorázové termíny.
        </p>
      </div>

      {/* Dostupnost po dnech (Po–Ne) */}
      <section className="bg-white rounded-2xl p-6 border-2 border-black/10">
        <h3 className="text-xl font-bold text-foreground mb-2">Dostupnost po dnech</h3>
        <p className="text-sm text-foreground/60 mb-4">
          Pro každý den můžeš mít více bloků (od–do). V každém bloku se generují sloty podle délky slotu (např. 30 min).
        </p>
        {days.length === 0 ? (
          <p className="text-foreground/60">Načítání…</p>
        ) : (
          <div className="space-y-6">
            {days.map((day) => (
              <div key={day.dayOfWeek} className="border border-black/10 rounded-xl p-4">
                <div className="font-semibold text-foreground mb-3">{day.dayName}</div>
                <div className="space-y-3">
                  {day.blocks.map((block, idx) => (
                    <div
                      key={idx}
                      className="flex flex-wrap items-center gap-3 text-sm"
                    >
                      <input
                        type="time"
                        value={block.startTime}
                        onChange={(e) =>
                          updateBlock(day.dayOfWeek, idx, "startTime", e.target.value)
                        }
                        className="px-3 py-2 border border-black/10 rounded-lg bg-white"
                      />
                      <span className="text-foreground/60">–</span>
                      <input
                        type="time"
                        value={block.endTime}
                        onChange={(e) =>
                          updateBlock(day.dayOfWeek, idx, "endTime", e.target.value)
                        }
                        className="px-3 py-2 border border-black/10 rounded-lg bg-white"
                      />
                      <select
                        value={block.slotDurationMinutes}
                        onChange={(e) =>
                          updateBlock(
                            day.dayOfWeek,
                            idx,
                            "slotDurationMinutes",
                            Number(e.target.value)
                          )
                        }
                        className="px-3 py-2 border border-black/10 rounded-lg bg-white"
                      >
                        <option value={15}>15 min</option>
                        <option value={30}>30 min</option>
                        <option value={45}>45 min</option>
                        <option value={60}>60 min</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeBlock(day.dayOfWeek, idx)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        aria-label="Odebrat blok"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addBlock(day.dayOfWeek)}
                    className="flex items-center gap-2 text-accent hover:underline font-medium text-sm"
                  >
                    <Plus size={16} />
                    Přidat blok
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={saveWeekly}
              disabled={saving}
              className="px-6 py-2 bg-accent text-white rounded-xl font-semibold hover:bg-accent-hover disabled:opacity-70"
            >
              {saving ? "Ukládám…" : "Uložit dostupnost"}
            </button>
          </div>
        )}
      </section>

      {/* Jednorázové termíny */}
      <section className="bg-white rounded-2xl p-6 border-2 border-black/10">
        <h3 className="text-xl font-bold text-foreground mb-4">Jednorázový termín</h3>
        <p className="text-sm text-foreground/60 mb-4">
          Přidej konkrétní datum a čas (např. mimo běžnou dostupnost).
        </p>
        <form onSubmit={handleAddOneOff} className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Datum</label>
            <input
              type="date"
              value={addDate}
              onChange={(e) => setAddDate(e.target.value)}
              required
              className="px-4 py-2 border-2 border-black/10 rounded-xl bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Čas</label>
            <input
              type="time"
              value={addTime}
              onChange={(e) => setAddTime(e.target.value)}
              className="px-4 py-2 border-2 border-black/10 rounded-xl bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Délka (min)</label>
            <select
              value={addDuration}
              onChange={(e) => setAddDuration(Number(e.target.value))}
              className="px-4 py-2 border-2 border-black/10 rounded-xl bg-white"
            >
              <option value={15}>15</option>
              <option value={30}>30</option>
              <option value={45}>45</option>
              <option value={60}>60</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl font-semibold hover:bg-accent-hover disabled:opacity-70"
          >
            <Plus size={18} />
            Přidat
          </button>
        </form>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="bg-white rounded-2xl p-6 border-2 border-black/10">
        <h3 className="text-xl font-bold text-foreground mb-4">Jednorázové termíny (nadcházející)</h3>
        <p className="text-sm text-foreground/60 mb-4">
            Sloty z „Dostupnost po dnech“ se generují automaticky; zde jsou jen ty, které jsi přidal ručně.
        </p>
        {slotsLoading ? (
          <p className="text-foreground/60">Načítání…</p>
        ) : slots.length === 0 ? (
          <p className="text-foreground/60">Žádné jednorázové termíny.</p>
        ) : (
          <ul className="space-y-2">
            {slots.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between py-2 border-b border-black/5 last:border-0"
              >
                <span>
                  {formatSlot(s)}
                  <span className="text-foreground/50 text-sm ml-2">({s.durationMinutes} min)</span>
                  {s.isBooked && (
                    <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                      Rezervováno
                    </span>
                  )}
                </span>
                {!s.isBooked && (
                  <button
                    type="button"
                    onClick={() => handleDeleteSlot(s.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    aria-label="Smazat"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
