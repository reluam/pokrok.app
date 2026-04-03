"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2 } from "lucide-react";
import { categories, ritualsById, SLOT_LABELS } from "@/data/adhdRituals";
import type { RitualSelection as WizardSelection } from "@/components/NastavSiDenWizard";

type RitualSelection = { morning: string[]; daily: string[]; evening: string[]; durationOverrides?: Record<string, number> };

const CUSTOM_PREFIX = "custom::";
const isCustom = (id: string) => id.startsWith(CUSTOM_PREFIX);
const customName = (id: string) => id.slice(CUSTOM_PREFIX.length).split("::")[0];

const DAY_LABELS_CZ = ["Ne", "Po", "Út", "St", "Čt", "Pá", "So"];
function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return DAY_LABELS_CZ[d.getDay()];
}

function getDateNum(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").getDate().toString();
}

export function NastavSiDenTab({ selection, onSave, onComplete, onReset }: {
  selection: RitualSelection | null;
  onSave: (sel: WizardSelection) => void;
  onComplete: (sel: WizardSelection) => void;
  onReset: () => void;
}) {
  const [sel, setSel] = useState<RitualSelection>({
    morning: selection?.morning ?? [],
    daily: selection?.daily ?? [],
    evening: selection?.evening ?? [],
  });

  useEffect(() => {
    setSel({
      morning: selection?.morning ?? [],
      daily: selection?.daily ?? [],
      evening: selection?.evening ?? [],
    });
  }, [selection]);

  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [addingSlot, setAddingSlot] = useState<string | null>(null);
  const [customText, setCustomText] = useState("");

  const LS_CUSTOM_KEY = "custom-rituals-history";
  const [customHistory, setCustomHistory] = useState<string[]>(() => {
    try { const s = localStorage.getItem(LS_CUSTOM_KEY); return s ? JSON.parse(s) : []; } catch { return []; }
  });

  function saveCustomHistory(ids: string[]) {
    setCustomHistory(ids);
    try { localStorage.setItem(LS_CUSTOM_KEY, JSON.stringify(ids)); } catch {}
  }

  const [history, setHistory] = useState<Record<string, Set<string>>>({});
  const [days, setDays] = useState<string[]>([]);
  const [trackerLoaded, setTrackerLoaded] = useState(false);

  const loadTracker = useCallback(async () => {
    try {
      const res = await fetch("/api/manual/ritual-completions");
      if (res.ok) {
        const d = await res.json();
        setDays(d.days ?? []);
        const h: Record<string, Set<string>> = {};
        for (const [rid, dates] of Object.entries(d.history ?? {})) {
          h[rid] = new Set(dates as string[]);
        }
        setHistory(h);
      }
    } catch {}
    setTrackerLoaded(true);
  }, []);

  useEffect(() => { loadTracker(); }, [loadTracker]);

  const toggleDay = async (ritualId: string, date: string) => {
    const ritualDates = history[ritualId] ?? new Set<string>();
    const isDone = ritualDates.has(date);
    setHistory((prev) => {
      const newSet = new Set(prev[ritualId] ?? []);
      if (isDone) newSet.delete(date); else newSet.add(date);
      return { ...prev, [ritualId]: newSet };
    });
    try {
      await fetch("/api/manual/ritual-completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ritualId, completed: !isDone, date }),
      });
    } catch {}
  };

  const persist = useCallback((updated: RitualSelection) => {
    setSel(updated);
    onSave(updated);
  }, [onSave]);

  const usedIds = new Set([...sel.morning, ...sel.daily, ...sel.evening]);
  const catalogByCategory = categories.map((cat) => ({
    ...cat,
    rituals: cat.rituals.filter((r) => !usedIds.has(r.id)),
  })).filter((cat) => cat.rituals.length > 0);

  const unusedCustom = customHistory.filter((id) => !usedIds.has(id));

  function removeRitual(slot: "morning" | "daily" | "evening", id: string) {
    persist({ ...sel, [slot]: sel[slot].filter((x) => x !== id) });
  }

  function addCustom(slot: "morning" | "daily" | "evening") {
    if (!customText.trim()) return;
    const id = `custom::${customText.trim()}::5`;
    if (sel[slot].includes(id)) return;
    persist({ ...sel, [slot]: [...sel[slot], id] });
    if (!customHistory.includes(id)) saveCustomHistory([...customHistory, id]);
    setCustomText("");
    setAddingSlot(null);
  }

  function handleDrop(slot: "morning" | "daily" | "evening") {
    if (!dragId) return;
    if (sel[slot].includes(dragId)) return;
    persist({ ...sel, [slot]: [...sel[slot], dragId] });
    setDragId(null);
    setDragOver(null);
  }

  const slotMeta: { key: "morning" | "daily" | "evening"; emoji: string; label: string }[] = [
    { key: "morning", emoji: "🌅", label: "Ranní rutina" },
    { key: "daily",   emoji: "☀️", label: "Denní rutina" },
    { key: "evening", emoji: "🌙", label: "Večerní rutina" },
  ];

  const today = days.length > 0 ? days[days.length - 1] : "";
  const totalRituals = sel.morning.length + sel.daily.length + sel.evening.length;
  const hasDays = trackerLoaded && days.length > 0;

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Left: predefined catalog */}
      <div className="lg:w-56 shrink-0">
        <div className="bg-white border border-black/8 rounded-[24px] px-5 py-5 space-y-3 lg:sticky lg:top-24">
          <h3 className="text-base font-extrabold text-foreground">Nabídka</h3>
          <p className="text-lg text-foreground/40 leading-relaxed">
            Přetáhni do sekce vpravo.
          </p>

          {catalogByCategory.length === 0 && unusedCustom.length === 0 && (
            <p className="text-lg text-foreground/30 italic">Vše přidáno.</p>
          )}

          <div className="space-y-3 max-h-[65vh] overflow-y-auto overscroll-contain">
            {catalogByCategory.map((cat) => (
              <div key={cat.id}>
                <p className="text-base font-semibold text-foreground/35 uppercase tracking-wider mb-1.5">
                  {cat.name}
                </p>
                <div className="space-y-0.5">
                  {cat.rituals.map((r) => (
                    <div
                      key={r.id}
                      draggable
                      onDragStart={() => setDragId(r.id)}
                      onDragEnd={() => { setDragId(null); setDragOver(null); }}
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-base text-foreground/60 hover:bg-accent/5 hover:text-accent cursor-grab active:cursor-grabbing transition-colors group"
                    >
                      <span className="text-foreground/15 group-hover:text-accent/40 text-base">⠿</span>
                      <span className="flex-1 leading-snug truncate">{r.name}</span>
                      <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                        {slotMeta.filter((s) => r.slots.includes(s.key)).map((s) => (
                          <button
                            key={s.key}
                            onClick={() => {
                              if (!sel[s.key].includes(r.id)) persist({ ...sel, [s.key]: [...sel[s.key], r.id] });
                            }}
                            className="text-base px-1 py-0.5 rounded bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                            title={`Přidat do ${s.label}`}
                          >
                            {s.emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {unusedCustom.length > 0 && (
              <div>
                <p className="text-base font-semibold text-foreground/35 uppercase tracking-wider mb-1.5">
                  Vlastní
                </p>
                <div className="space-y-0.5">
                  {unusedCustom.map((id) => (
                    <div
                      key={id}
                      draggable
                      onDragStart={() => setDragId(id)}
                      onDragEnd={() => { setDragId(null); setDragOver(null); }}
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-base text-foreground/60 hover:bg-accent/5 hover:text-accent cursor-grab active:cursor-grabbing transition-colors group"
                    >
                      <span className="text-foreground/15 group-hover:text-accent/40 text-base">⠿</span>
                      <span className="flex-1 leading-snug truncate">{customName(id)}</span>
                      <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                        {slotMeta.map((s) => (
                          <button
                            key={s.key}
                            onClick={() => {
                              if (!sel[s.key].includes(id)) persist({ ...sel, [s.key]: [...sel[s.key], id] });
                            }}
                            className="text-base px-1 py-0.5 rounded bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                            title={`Přidat do ${s.label}`}
                          >
                            {s.emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: tracker + editor combined */}
      <div className="flex-1 bg-white border border-black/8 rounded-[24px] px-6 py-6 space-y-3 min-w-0">
        <h3 className="text-base font-extrabold text-foreground">Rituály</h3>

        {hasDays && totalRituals > 0 && (
          <div className="flex items-end">
            <div className="flex-1" />
            <div className="grid shrink-0 mr-6" style={{ gridTemplateColumns: `repeat(${days.length}, 40px)` }}>
              {days.map((date) => (
                <div key={date} className="text-center">
                  <span className={`text-[8px] block ${date === today ? "text-foreground/40" : "text-foreground/20"}`}>
                    {getDateNum(date)}.
                  </span>
                  <span className={`text-base ${date === today ? "font-bold text-foreground/60" : "text-foreground/30"}`}>
                    {getDayLabel(date)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="divide-y divide-black/5">
          {slotMeta.map(({ key, emoji, label }) => {
            const ids = sel[key];
            const isOver = dragOver === key;

            return (
              <div
                key={key}
                onDragOver={(e) => { e.preventDefault(); setDragOver(key); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => { e.preventDefault(); handleDrop(key); }}
                className={`py-3 first:pt-0 last:pb-0 transition-colors rounded-xl ${
                  isOver ? "bg-accent/[0.03]" : ""
                }`}
              >
                <p className="text-base font-semibold text-foreground/40 uppercase tracking-wider mb-2">
                  {emoji} {label}
                </p>

                <div className="space-y-1">
                  {ids.map((id) => {
                    const name = isCustom(id) ? customName(id) : (ritualsById[id]?.name ?? id);
                    const ritualDates = history[id] ?? new Set<string>();
                    return (
                      <div key={id} className="flex items-center gap-1.5 py-0.5 group">
                        <button
                          onClick={() => removeRitual(key, id)}
                          className="opacity-0 group-hover:opacity-100 text-foreground/20 hover:text-red-500 transition-all shrink-0"
                          title="Odebrat rituál"
                        >
                          <Trash2 size={12} />
                        </button>
                        <span className="flex-1 text-base text-foreground/70 leading-tight truncate">{name}</span>
                        {hasDays && (
                          <div className="grid shrink-0" style={{ gridTemplateColumns: `repeat(${days.length}, 40px)` }}>
                            {days.map((date) => {
                              const done = ritualDates.has(date);
                              return (
                                <button
                                  key={date}
                                  onClick={() => toggleDay(id, date)}
                                  className={`text-center py-0.5 rounded-md text-base font-semibold transition-colors ${
                                    done
                                      ? "bg-accent/10 text-accent"
                                      : date === today
                                        ? "text-foreground/35 hover:text-foreground/55 hover:bg-black/5"
                                        : "text-foreground/15 hover:text-foreground/40 hover:bg-black/[0.03]"
                                  }`}
                                  title={`${getDayLabel(date)} ${date}`}
                                >
                                  {getDayLabel(date)}
                                </button>
                              );
                            })}
                          </div>
                        )}
                        <span className="text-base text-foreground/25 w-5 text-right shrink-0" title="Celkem splněno">
                          {ritualDates.size > 0 ? ritualDates.size : ""}
                        </span>
                      </div>
                    );
                  })}

                  {isOver && (
                    <div className="text-lg text-accent/60 italic py-2 text-center border border-dashed border-accent/30 rounded-xl">
                      Pusť sem
                    </div>
                  )}
                </div>

                {addingSlot === key ? (
                  <div className="flex items-center gap-1.5 mt-2">
                    <input
                      autoFocus
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") addCustom(key); if (e.key === "Escape") { setAddingSlot(null); setCustomText(""); } }}
                      placeholder="Vlastní rituál..."
                      className="flex-1 text-base px-2 py-1.5 border border-black/10 rounded-lg bg-white focus:ring-1 focus:ring-accent/30 focus:border-accent"
                    />
                    <button onClick={() => addCustom(key)} className="text-accent text-base font-semibold">OK</button>
                    <button onClick={() => { setAddingSlot(null); setCustomText(""); }} className="text-foreground/30 text-lg leading-none">×</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingSlot(key)}
                    className="text-lg text-foreground/30 hover:text-accent transition-colors mt-1.5"
                  >
                    + Přidat vlastní
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
