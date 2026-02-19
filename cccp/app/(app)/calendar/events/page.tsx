"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type EventRow = {
  id: string;
  user_id: string;
  slug: string;
  name: string;
  duration_minutes: number;
  created_at: string;
};

export default function CalendarEventsPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/events");
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <div className="py-2">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Eventy
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Bookovatelné události – úvodní konzultace, discovery call atd. U každého eventu nastavíš název, délku a dostupnost a zkopíruješ odkaz nebo iframe na stránku.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/calendar/events/new"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
        >
          Přidat event
        </Link>
      </div>

      <section className="mt-6 rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-100">
        {loading ? (
          <p className="text-sm text-slate-500">Načítám eventy…</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-slate-500">
            Zatím nemáš žádné eventy. Přidej první a nastav dostupnost a odkaz.
          </p>
        ) : (
          <ul className="space-y-2">
            {events.map((ev) => (
              <li key={ev.id}>
                <Link
                  href={`/calendar/events/${ev.id}`}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm hover:bg-slate-50"
                >
                  <span className="font-medium text-slate-900">{ev.name}</span>
                  <span className="text-slate-500">
                    {ev.duration_minutes} min · /{ev.slug}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
