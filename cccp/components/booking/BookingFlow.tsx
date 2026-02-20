"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Slot = { slot_at: string; duration_minutes: number };

const TZ = "Europe/Prague";

function formatSlotDate(iso: string): string {
  return new Date(iso).toLocaleDateString("cs-CZ", {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatSlotTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("cs-CZ", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getNextDays(count: number): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = 0; i < count; i++) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    out.push(`${y}-${m}-${day}`);
    d.setDate(d.getDate() + 1);
  }
  return out;
}

function dateKey(slotAt: string): string {
  return slotAt.slice(0, 10);
}

type BookingFlowProps = {
  coach?: string;
  eventId?: string;
  source?: string;
  eventName?: string;
};

export function BookingFlow(props?: BookingFlowProps) {
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "1";
  const coachFromUrl = searchParams.get("coach")?.trim() ?? "";
  const sourceFromUrl = searchParams.get("source")?.trim() ?? "";
  const coach = props?.coach ?? coachFromUrl;
  const eventId = props?.eventId ?? "";
  const source = props?.source ?? sourceFromUrl;
  const nameFromUrl = searchParams.get("name")?.trim() ?? "";
  const emailFromUrl = searchParams.get("email")?.trim() ?? "";

  const dates = getNextDays(14); // 2 týdny = 2 řádky po 7 dnech
  const [step, setStep] = useState<"pick" | "form">("pick");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsByDate, setSlotsByDate] = useState<Record<string, Slot[]>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(nameFromUrl);
  const [email, setEmail] = useState(emailFromUrl);
  const [phone, setPhone] = useState("");

  const fetchSlotsRange = useCallback(async () => {
    if (!coach && !eventId) return;
    setLoadingSlots(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        from: dates[0],
        to: dates[dates.length - 1],
      });
      if (eventId) params.set("eventId", eventId);
      else params.set("coach", coach);
      const res = await fetch(`/api/bookings/slots?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || res.statusText);
      }
      const data = await res.json();
      const allSlots: Slot[] = Array.isArray(data) ? data : [];
      const byDate: Record<string, Slot[]> = {};
      for (const date of dates) byDate[date] = [];
      for (const slot of allSlots) {
        const key = dateKey(slot.slot_at);
        if (byDate[key]) byDate[key].push(slot);
      }
      setSlotsByDate(byDate);
      const firstWithSlots = dates.find((d) => (byDate[d]?.length ?? 0) > 0);
      if (firstWithSlots && (byDate[firstWithSlots]?.length ?? 0) > 0) {
        setSelectedDate(firstWithSlots);
        setSlots(byDate[firstWithSlots]);
      }
      setStep("pick");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingSlots(false);
      setInitialLoadDone(true);
    }
  }, [coach, eventId, dates]);

  useEffect(() => {
    if (success || (!coach && !eventId)) return;
    fetchSlotsRange();
  }, [success, coach, eventId]);

  const selectDate = useCallback(
    (date: string) => {
      const daySlots = slotsByDate[date] ?? [];
      if (daySlots.length === 0) return;
      setSelectedDate(date);
      setSlots(daySlots);
      setError(null);
    },
    [slotsByDate]
  );

  useEffect(() => {
    if (success) return;
    if (step === "pick" && selectedDate && slots.length === 0 && initialLoadDone && !loadingSlots) {
      setError("Pro tento den nejsou k dispozici žádné volné termíny.");
    }
  }, [success, step, selectedDate, slots.length, initialLoadDone, loadingSlots]);

  const handleSelectSlot = (slot: Slot) => {
    setSelectedSlot(slot);
    setStep("form");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || (!coach && !eventId)) return;
    setSubmitting(true);
    setError(null);
    try {
      const body: Record<string, string | undefined> = {
        coach,
        source: source || undefined,
        scheduled_at: selectedSlot.slot_at,
        email: email.trim(),
        name: name.trim(),
        phone: phone.trim() || undefined,
      };
      if (eventId) body.event_id = eventId;
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || res.statusText);
      }
      const redirectUrl = new URL("/book", window.location.origin);
      redirectUrl.searchParams.set("success", "1");
      if (coach) redirectUrl.searchParams.set("coach", coach);
      if (eventId) redirectUrl.searchParams.set("eventId", eventId);
      if (source) redirectUrl.searchParams.set("source", source);
      window.location.href = redirectUrl.toString();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const hasSlots = (date: string) => (slotsByDate[date]?.length ?? 0) > 0;

  const backToSlot = () => {
    setStep("pick");
    setSelectedSlot(null);
    setError(null);
  };

  if (!coach && !eventId) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8">
        <h2 className="text-xl font-semibold text-slate-900">
          Chybí údaj o kouči nebo eventu
        </h2>
        <p className="mt-2 text-slate-600">
          Rezervace musí být otevřena z odkazu s vybraným koučem nebo eventem (např. /book/vase-slug/slug-eventu). Zkontrolujte odkaz nebo se vraťte na stránku, odkud jste přišli.
        </p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8">
        <h2 className="text-xl font-semibold text-slate-900">
          Termín je zarezervovaný
        </h2>
        <p className="mt-2 text-slate-600">
          Děkujeme. Brzy tě budeme kontaktovat s potvrzením. Můžeš zavřít toto okno nebo se vrátit na stránku, odkud jsi přišel.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200/60 md:p-8">
      <h2 className="text-xl font-semibold tracking-tight text-slate-900">
        {props?.eventName ? `Rezervovat: ${props.eventName}` : "Rezervovat termín"}
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Vyber datum, čas a vyplň údaje.
      </p>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
          {error}
        </div>
      )}

      {!initialLoadDone && loadingSlots && (
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl bg-slate-50/80 py-10 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
          <p className="mt-3 text-sm text-slate-600">Načítám dostupnost…</p>
        </div>
      )}

      {initialLoadDone && step === "pick" && (
        <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-start">
          {/* Kalendář: vždy 7 sloupců (týden v řádku), 2 řádky */}
          <div className="shrink-0">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Datum
            </p>
            <div className="grid grid-cols-7 gap-1.5">
              {dates.map((d) => {
                const available = hasSlots(d);
                const isSelected = selectedDate === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => selectDate(d)}
                    disabled={!available}
                    className={`flex min-w-0 flex-col items-center justify-center rounded-lg border px-1.5 py-2 text-center text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 ${
                      !available
                        ? "cursor-not-allowed border-slate-100 bg-slate-50/60 text-slate-400 line-through"
                        : isSelected
                          ? "border-slate-700 bg-slate-800 text-white shadow"
                          : "border-slate-200 bg-white text-slate-800 shadow-sm hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span className="block truncate w-full text-[10px] opacity-80">
                      {new Date(d + "T12:00:00").toLocaleDateString("cs-CZ", { weekday: "short" })}
                    </span>
                    <span className="mt-0.5 block text-sm font-semibold">
                      {new Date(d + "T12:00:00").getDate()}
                    </span>
                    {!available && (
                      <span className="mt-0.5 block text-[9px] font-normal normal-case not-italic opacity-70">
                        —
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Časové sloty: vedle na md+, pod na malých obrazovkách */}
          <div className="min-w-0 flex-1">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              {selectedDate
                ? `Čas — ${formatSlotDate(selectedDate + "T12:00:00")}`
                : "Čas"}
            </p>
            {!selectedDate ? (
              <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Vyber datum v kalendáři.
              </p>
            ) : slots.length === 0 ? (
              <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Pro tento den nejsou volné termíny. Zvol jiný den.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4">
                {slots.map((slot) => (
                  <button
                    key={slot.slot_at}
                    type="button"
                    onClick={() => handleSelectSlot(slot)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:shadow focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                  >
                    {formatSlotTime(slot.slot_at)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {step === "form" && selectedSlot && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <button
            type="button"
            onClick={backToSlot}
            className="text-sm text-slate-500 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 rounded px-1 -ml-1"
          >
            ← Zpět na výběr času
          </button>
          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <span className="font-medium">
              {formatSlotDate(selectedSlot.slot_at)} v {formatSlotTime(selectedSlot.slot_at)}
            </span>
            <span className="text-slate-500"> · {selectedSlot.duration_minutes} min</span>
          </div>
          <div className="space-y-4">
            <div>
              <label htmlFor="book-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Jméno *
              </label>
              <input
                id="book-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div>
              <label htmlFor="book-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                E-mail *
              </label>
              <input
                id="book-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div>
              <label htmlFor="book-phone" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Telefon
              </label>
              <input
                id="book-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {submitting ? "Odesílám…" : "Rezervovat termín"}
          </button>
        </form>
      )}
    </div>
  );
}
