"use client";

import { useEffect, useState } from "react";

type Event = {
  id: string;
  name: string;
  slug: string;
  duration_minutes: number;
};

type Client = {
  id: string;
  name: string;
  email: string | null;
};

type AddCalendarItemModalProps = {
  open: boolean;
  date: string; // YYYY-MM-DD
  defaultTime?: string; // HH:mm
  onClose: () => void;
  onAdded?: () => void;
};

export function AddCalendarItemModal({
  open,
  date,
  defaultTime,
  onClose,
  onAdded,
}: AddCalendarItemModalProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<Array<{
    type: "session" | "booking";
    id: string;
    title: string;
    scheduled_at: string;
    duration_minutes: number;
    client_name: string;
  }>>([]);
  const [checkingConflicts, setCheckingConflicts] = useState(false);

  // Form fields
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [createLead, setCreateLead] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [title, setTitle] = useState("Schůzka");
  const [time, setTime] = useState(defaultTime || "09:00");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) {
      // Reset form when modal closes
      setSelectedEventId("");
      setDurationMinutes(30);
      setSelectedClientId("");
      setCreateLead(false);
      setName("");
      setEmail("");
      setPhone("");
      setTitle("Schůzka");
      setTime(defaultTime || "09:00");
      setNote("");
      setError(null);
      setConflicts([]);
      return;
    }
    setLoading(true);
    Promise.all([
      fetch("/api/events")
        .then((r) => r.json())
        .then((d) => setEvents(Array.isArray(d) ? d : []))
        .catch(() => setEvents([])),
      fetch("/api/clients")
        .then((r) => r.json())
        .then((d) => setClients(Array.isArray(d) ? d : []))
        .catch(() => setClients([])),
    ]).finally(() => setLoading(false));
  }, [open, defaultTime]);

  useEffect(() => {
    if (selectedEventId && events.length > 0) {
      const event = events.find((e) => e.id === selectedEventId);
      if (event) {
        setDurationMinutes(event.duration_minutes);
      }
    }
  }, [selectedEventId, events]);

  // Kontrola kolizí při změně času/datum/délky
  useEffect(() => {
    if (!open || !date || !time) {
      setConflicts([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const [hours, minutes] = time.split(":").map(Number);
        const scheduledAt = new Date(`${date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`);
        
        if (Number.isNaN(scheduledAt.getTime())) {
          setConflicts([]);
          return;
        }

        setCheckingConflicts(true);
        const res = await fetch("/api/sessions/check-conflicts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scheduled_at: scheduledAt.toISOString(),
            duration_minutes: durationMinutes,
          }),
        });
        const data = await res.json().catch(() => ({ conflicts: [] }));
        setConflicts(data.conflicts || []);
      } catch (e) {
        console.error("Error checking conflicts:", e);
        setConflicts([]);
      } finally {
        setCheckingConflicts(false);
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(timeoutId);
  }, [open, date, time, durationMinutes]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const [hours, minutes] = time.split(":").map(Number);
    const scheduledAt = new Date(`${date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`);

    try {
      if (createLead && (!name || !email)) {
        setError("Pro vytvoření leadu jsou jméno a email povinné");
        setSubmitting(false);
        return;
      }
      const body: Record<string, any> = {
        scheduled_at: scheduledAt.toISOString(),
        title: title.trim() || "Schůzka",
        duration_minutes: durationMinutes,
      };
      if (selectedClientId) body.client_id = selectedClientId;
      if (note) body.notes = note.trim();
      if (createLead) {
        body.create_lead = true;
        body.lead_name = name.trim();
        body.lead_email = email.trim().toLowerCase();
        if (phone) body.lead_phone = phone.trim();
      }

      console.log("[AddCalendarItemModal] Sending request:", body);
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      console.log("[AddCalendarItemModal] Response:", res.status, data);
      if (!res.ok) {
        const errorMsg = data.error || res.statusText || "Neznámá chyba";
        console.error("[AddCalendarItemModal] Error:", errorMsg);
        throw new Error(errorMsg);
      }

      console.log("[AddCalendarItemModal] Success, calling onAdded and onClose");
      onAdded?.();
      onClose();
    } catch (e) {
      console.error("[AddCalendarItemModal] Exception:", e);
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-item-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 id="add-item-title" className="text-lg font-semibold text-slate-900">
            Přidat schůzku
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {new Date(date + "T12:00:00").toLocaleDateString("cs-CZ", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-4">
          {loading && (
            <p className="py-4 text-center text-sm text-slate-500">Načítám…</p>
          )}
          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          {!loading && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Event (volitelné, pro referenci)
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Žádný event</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name} ({ev.duration_minutes} min)
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Výběr eventu slouží jen jako reference, aby sis něco nezabookoval dvakrát.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Čas
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  required
                />
              </div>

              <div
                className={`overflow-hidden transition-all duration-300 ease-out ${
                  conflicts.length > 0 ? "max-h-[28rem] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="rounded-lg border-2 border-red-200 bg-red-50 p-3">
                  <div className="mb-2 text-sm font-semibold text-red-800">
                    ⚠️ Schůzka se kryje s {conflicts.length === 1 ? "touto schůzkou" : "těmito schůzkami"}:
                  </div>
                  <div className="space-y-1.5">
                    {conflicts.map((conflict) => {
                      const conflictDate = new Date(conflict.scheduled_at);
                      const conflictEnd = new Date(conflictDate.getTime() + conflict.duration_minutes * 60 * 1000);
                      return (
                        <div key={conflict.id} className="text-xs text-red-700">
                          <div className="font-medium">
                            {conflict.title} ({conflict.type === "booking" ? "Rezervace" : "Schůzka"})
                          </div>
                          <div className="text-red-600">
                            {conflictDate.toLocaleString("cs-CZ", {
                              day: "numeric",
                              month: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            -{" "}
                            {conflictEnd.toLocaleTimeString("cs-CZ", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            ({conflict.duration_minutes} min) · {conflict.client_name}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Délka (minuty)
                </label>
                <input
                  type="number"
                  min={15}
                  max={120}
                  step={15}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value) || 30)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Název schůzky
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Klient (volitelné)
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Bez klienta</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.email ? `(${c.email})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Poznámka
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={createLead}
                    onChange={(e) => setCreateLead(e.target.checked)}
                    className="rounded border-slate-300 text-slate-800 focus:ring-slate-500"
                  />
                  <span className="text-xs font-medium text-slate-700">
                    Vytvořit také lead
                  </span>
                </label>
                <p className="mt-1 text-xs text-slate-500">
                  Vytvoří lead v CRM s kontaktními údaji
                </p>
              </div>
              {createLead && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-700">
                      Jméno leadu *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                      required={createLead}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700">
                      Email leadu *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                      required={createLead}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700">
                      Telefon leadu
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {submitting ? "Přidávám…" : "Přidat"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
