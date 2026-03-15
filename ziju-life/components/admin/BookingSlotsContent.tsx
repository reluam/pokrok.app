"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

type AdminBooking = {
  id: string;
  createdAt: string;
  slotAt: string;
  durationMinutes: number;
  meetingType?: string | null;
  leadId: string;
  email: string;
  name: string | null;
  source: string;
  status: string;
  note: string | null;
};

type MeetingType = {
  id: string;
  label: string;
  description?: string;
  isPaid?: boolean;
  startDate?: string;
  endDate?: string;
  defaultDurationMinutes?: number;
  priceId?: string;
  priceCzk?: number;
  stripePaymentLinkUrl?: string;
};

const DEFAULT_SLOT_DURATION = 30;

export default function BookingSlotsContent() {
  const router = useRouter();
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
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState("");
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([]);
  const [selectedMeetingTypeId, setSelectedMeetingTypeId] = useState<string | null>(null);

  const loadWeekly = (meetingTypeId: string | null) => {
    const url = meetingTypeId
      ? `/api/admin/weekly-availability?meetingTypeId=${encodeURIComponent(meetingTypeId)}`
      : "/api/admin/weekly-availability";
    fetch(url)
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

  const loadBookings = () => {
    setBookingsLoading(true);
    setBookingsError("");
    fetch("/api/admin/bookings")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setBookingsError(data.error);
        else setBookings(data.bookings ?? []);
      })
      .catch(() => setBookingsError("Chyba načtení schůzek"))
      .finally(() => setBookingsLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    loadSlots();
    setLoading(false);
    loadBookings();
  }, []);

  useEffect(() => {
    fetch("/api/admin/booking-meeting-types")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.meetingTypes)) {
          setMeetingTypes(data.meetingTypes);
          if (!selectedMeetingTypeId && data.meetingTypes.length > 0) {
            setSelectedMeetingTypeId(data.meetingTypes[0].id);
          }
        }
      })
      .catch(() => {
        /* ignore */
      });
  }, [selectedMeetingTypeId]);

  useEffect(() => {
    if (selectedMeetingTypeId) {
      setLoading(true);
      loadWeekly(selectedMeetingTypeId);
      setLoading(false);
    }
  }, [selectedMeetingTypeId]);

  const resolveMeetingTypeLabel = (meetingType?: string | null): string | null => {
    if (!meetingType) return null;
    const mt = meetingTypes.find((t) => t.id === meetingType);
    return mt?.label ?? meetingType;
  };

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
      body: JSON.stringify({ blocks, meetingTypeId: selectedMeetingType?.id ?? null }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else if (selectedMeetingTypeId) loadWeekly(selectedMeetingTypeId);
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

  const hasMeetingTypes = meetingTypes.length > 0;
  const selectedMeetingType = hasMeetingTypes
    ? meetingTypes.find((t) => t.id === selectedMeetingTypeId) ?? null
    : null;
  const visibleBookings =
    selectedMeetingType != null
      ? bookings.filter((b) => b.meetingType === selectedMeetingType.id)
      : bookings;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Rezervace</h2>
        <p className="text-foreground/70">
          Typy schůzek sdílí stejnou dostupnost (časy v kalendáři). Nejprve vyber typ schůzky, pak
          spravuj dostupnost a sleduj konkrétní rezervace.
        </p>
      </div>

      {/* Typy schůzek */}
      {hasMeetingTypes ? (
        <section className="bg-white rounded-2xl p-6 border-2 border-black/10">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-xl font-bold text-foreground">Typy schůzek</h3>
            <button
              type="button"
              onClick={() => router.push("/admin?section=settings")}
              className="text-xs font-medium text-accent hover:underline"
            >
              Spravovat typy v Nastavení
            </button>
          </div>
          <p className="text-sm text-foreground/60 mb-3">
            Vyber typ schůzky pro zobrazení detailů, dostupnosti a rezervací. Sloty v kalendáři se
            blokují sdíleně pro všechny typy.
          </p>
          <div className="flex flex-wrap gap-3">
            {meetingTypes.map((t) => {
              const isActive = selectedMeetingTypeId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedMeetingTypeId(t.id)}
                  className={`min-w-[180px] text-left rounded-2xl border px-4 py-3 text-sm transition-colors ${
                    isActive
                      ? "border-accent bg-accent text-white"
                      : "border-black/10 bg-white text-foreground hover:border-accent/50 hover:bg-accent/5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold truncate">{t.label}</span>
                    {t.isPaid && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide bg-white/20 px-2 py-0.5 rounded-full border border-white/40">
                        Placené
                      </span>
                    )}
                  </div>
                  {t.description && (
                    <p
                      className={`text-xs line-clamp-2 ${
                        isActive ? "text-white/80" : "text-foreground/60"
                      }`}
                    >
                      {t.description}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="bg-white rounded-2xl p-6 border-2 border-black/10">
          <h3 className="text-xl font-bold text-foreground mb-2">Typy schůzek</h3>
          <p className="text-sm text-foreground/60 mb-2">
            Zatím nemáš definované žádné typy schůzek. Nastav je v Nastavení, sekce „Rezervace –
            ClickUp a Google Kalendář“.
          </p>
          <button
            type="button"
            onClick={() => router.push("/admin?section=settings")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-hover"
          >
            Otevřít Nastavení
          </button>
        </section>
      )}

      {/* Pokud existují typy, ale žádný není zvolen, ukončíme zde */}
      {hasMeetingTypes && !selectedMeetingType && (
        <p className="text-sm text-foreground/60">
          Vyber typ schůzky výše, aby se zobrazila dostupnost a konkrétní rezervace.
        </p>
      )}

      {/* Zbytek obsahu se zobrazuje jen pokud nejsou typy vůbec, nebo pokud je nějaký vybraný */}
      {(!hasMeetingTypes || selectedMeetingType) && (
        <>
          {/* Detail vybraného typu schůzky */}
          {selectedMeetingType && (
            <section className="bg-white rounded-2xl p-6 border-2 border-black/10">
              <h3 className="text-xl font-bold text-foreground mb-3">
                Nastavení typu: {selectedMeetingType.label}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Název schůzky
                  </label>
                  <input
                    type="text"
                    value={selectedMeetingType.label}
                    onChange={(e) => {
                      const label = e.target.value;
                      setMeetingTypes((prev) =>
                        prev.map((mt) =>
                          mt.id === selectedMeetingType.id ? { ...mt, label } : mt
                        )
                      );
                    }}
                    className="w-full px-4 py-2 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white text-sm"
                  />
                  <p className="text-xs text-foreground/60">
                    Tento název se použije v potvrzovacích e-mailech a v přehledu schůzek.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Popis (volitelné)
                  </label>
                  <textarea
                    value={selectedMeetingType.description ?? ""}
                    onChange={(e) => {
                      const description = e.target.value;
                      setMeetingTypes((prev) =>
                        prev.map((mt) =>
                          mt.id === selectedMeetingType.id ? { ...mt, description } : mt
                        )
                      );
                    }}
                    className="w-full px-4 py-2 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white text-sm"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Výchozí délka schůzky (min)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={480}
                    step={5}
                    value={selectedMeetingType.defaultDurationMinutes ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      const num = Number(val);
                      const defaultDurationMinutes =
                        !val || Number.isNaN(num) || num <= 0 ? undefined : num;
                      setMeetingTypes((prev) =>
                        prev.map((mt) =>
                          mt.id === selectedMeetingType.id
                            ? { ...mt, defaultDurationMinutes }
                            : mt
                        )
                      );
                    }}
                    className="w-full px-4 py-2 border-2 border-black/10 rounded-xl bg-white text-sm"
                  />
                  <p className="text-xs text-foreground/60">
                    Informativní – zatím neřídí generování slotů, ale můžeš podle něj nastavovat
                    bloky a do budoucna Stripe.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Rezervovatelné od
                  </label>
                  <input
                    type="date"
                    value={selectedMeetingType.startDate ?? ""}
                    onChange={(e) => {
                      const startDate = e.target.value || undefined;
                      setMeetingTypes((prev) =>
                        prev.map((mt) =>
                          mt.id === selectedMeetingType.id ? { ...mt, startDate } : mt
                        )
                      );
                    }}
                    className="px-4 py-2 border-2 border-black/10 rounded-xl bg-white text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Rezervovatelné do
                  </label>
                  <input
                    type="date"
                    value={selectedMeetingType.endDate ?? ""}
                    onChange={(e) => {
                      const endDate = e.target.value || undefined;
                      setMeetingTypes((prev) =>
                        prev.map((mt) =>
                          mt.id === selectedMeetingType.id ? { ...mt, endDate } : mt
                        )
                      );
                    }}
                    className="px-4 py-2 border-2 border-black/10 rounded-xl bg-white text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Platba
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-foreground/80">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedMeetingType.isPaid)}
                      onChange={(e) => {
                        const isPaid = e.target.checked;
                        setMeetingTypes((prev) =>
                          prev.map((mt) =>
                            mt.id === selectedMeetingType.id ? { ...mt, isPaid } : mt
                          )
                        );
                      }}
                    />
                    <span>Placené (vyžaduje platbu před schůzkou)</span>
                  </label>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Cena schůzky (Kč)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={selectedMeetingType.priceCzk ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      const num = Number(val);
                      const priceCzk =
                        !val || Number.isNaN(num) || num <= 0 ? undefined : Math.round(num);
                      setMeetingTypes((prev) =>
                        prev.map((mt) =>
                          mt.id === selectedMeetingType.id ? { ...mt, priceCzk } : mt
                        )
                      );
                    }}
                    placeholder="např. 900"
                    className="w-full px-4 py-2 border-2 border-black/10 rounded-xl bg-white text-sm"
                  />
                  <p className="text-xs text-foreground/60">
                    Tato částka se použije v platebním boxu a v QR kódu pro tento typ schůzky.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Stripe Price ID
                  </label>
                  <input
                    type="text"
                    value={selectedMeetingType.priceId ?? ""}
                    onChange={(e) => {
                      const priceId = e.target.value.trim() || undefined;
                      setMeetingTypes((prev) =>
                        prev.map((mt) =>
                          mt.id === selectedMeetingType.id ? { ...mt, priceId } : mt
                        )
                      );
                    }}
                    placeholder="price_..."
                    className="w-full px-4 py-2 border-2 border-black/10 rounded-xl bg-white text-sm font-mono"
                  />
                  <p className="text-xs text-foreground/60">
                    Stripe Price ID (začíná <code>price_</code>). Najdeš ho v Stripe Dashboard → Products. Pokud je vyplněné, platba proběhne přímo v modálu kartou.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/admin/booking-meeting-types", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ meetingTypes }),
                      });
                      const data = await res.json();
                      if (!res.ok) {
                        alert(data.error || "Nepodařilo se uložit typy schůzek.");
                        return;
                      }
                      setMeetingTypes(data.meetingTypes ?? meetingTypes);
                      alert("Typy schůzek byly uloženy.");
                    } catch (e) {
                      alert(
                        "Chyba ukládání typů schůzek: " +
                          (e instanceof Error ? e.message : "network")
                      );
                    }
                  }}
                  className="px-5 py-2 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent-hover"
                >
                  Uložit typy schůzek
                </button>
                {meetingTypes.length > 1 && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (
                        !confirm(
                          `Opravdu smazat typ „${selectedMeetingType.label}“? Existující rezervace zůstanou, ale bez typu.`
                        )
                      )
                        return;
                      const next = meetingTypes.filter(
                        (mt) => mt.id !== selectedMeetingType.id
                      );
                      setMeetingTypes(next);
                      setSelectedMeetingTypeId(next[0]?.id ?? null);
                      try {
                        await fetch("/api/admin/booking-meeting-types", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ meetingTypes: next }),
                        });
                      } catch {
                        // ignore; už je v lokálním stavu
                      }
                    }}
                    className="px-4 py-2 rounded-xl border-2 border-red-200 text-red-700 text-xs font-semibold hover:bg-red-50"
                  >
                    Smazat tento typ
                  </button>
                )}
              </div>
            </section>
          )}

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
                      <input
                        type="number"
                        min={5}
                        max={480}
                        step={5}
                        value={block.slotDurationMinutes}
                        onChange={(e) =>
                          updateBlock(
                            day.dayOfWeek,
                            idx,
                            "slotDurationMinutes",
                            Number(e.target.value) || DEFAULT_SLOT_DURATION
                          )
                        }
                        className="w-24 px-3 py-2 border border-black/10 rounded-lg bg-white"
                      />
                      <span className="text-xs text-foreground/60">min</span>
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

      {/* Schůzky */}
      <section className="bg-white rounded-2xl p-6 border-2 border-black/10">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h3 className="text-xl font-bold text-foreground">Schůzky</h3>
          <button
            type="button"
            onClick={loadBookings}
            className="text-xs font-medium text-accent hover:underline"
          >
            Obnovit
          </button>
        </div>
        <p className="text-sm text-foreground/60 mb-4">
          {selectedMeetingType
            ? `Rezervace pro typ „${selectedMeetingType.label}“. Klikni na řádek pro detaily.`
            : "Seznam rezervovaných schůzek (podle nejbližšího termínu). Klikni na řádek pro detaily."}
        </p>
        {bookingsLoading ? (
          <p className="text-foreground/60 text-sm">Načítání schůzek…</p>
        ) : bookingsError ? (
          <p className="text-sm text-red-600">{bookingsError}</p>
        ) : visibleBookings.length === 0 ? (
          <p className="text-foreground/60 text-sm">Zatím nemáš žádné schůzky.</p>
        ) : (
          <ul className="divide-y divide-black/5">
            {visibleBookings.map((b) => {
              const slotDate = new Date(b.slotAt);
              const created = new Date(b.createdAt);
              const label = resolveMeetingTypeLabel(b.meetingType);
              const isExpanded = expandedBookingId === b.id;
              return (
                <li key={b.id} className="py-2">
                  <button
                    type="button"
                    onClick={() => setExpandedBookingId((prev) => (prev === b.id ? null : b.id))}
                    className="w-full text-left flex items-start justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {slotDate.toLocaleString("cs-CZ", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="text-xs text-foreground/60">
                          ({b.durationMinutes} min)
                        </span>
                        {label && (
                          <span className="inline-flex items-center rounded-full bg-accent/10 border border-accent/20 px-2 py-0.5 text-[11px] font-semibold text-accent">
                            {label}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground mt-0.5 truncate">
                        {b.name || "Neznámé jméno"} · {b.email}
                      </p>
                    </div>
                    <div className="shrink-0 text-xs text-foreground/50 flex flex-col items-end">
                      <span>{created.toLocaleDateString("cs-CZ")}</span>
                      <span className="mt-0.5">status: {b.status}</span>
                      <span className="mt-1">{isExpanded ? "▲" : "▼"}</span>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="mt-2 rounded-lg bg-black/3 px-3 py-2 text-xs text-foreground/80 space-y-1">
                      <p>
                        <span className="font-semibold">Zdroj:</span> {b.source}
                      </p>
                      {b.note && (
                        <p className="whitespace-pre-line">
                          <span className="font-semibold">Zpráva / poznámka:</span>{" "}
                          {b.note}
                        </p>
                      )}
                      <p>
                        <span className="font-semibold">Lead ID:</span> {b.leadId}
                      </p>
                      {b.meetingType && (
                        <p>
                          <span className="font-semibold">meeting_type:</span> {b.meetingType}
                        </p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
        </>
      )}
    </div>
  );
}
