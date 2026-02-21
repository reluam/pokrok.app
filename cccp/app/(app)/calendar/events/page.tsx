"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useProjects } from "../../../../contexts/ProjectsContext";

type EventRow = {
  id: string;
  user_id: string;
  slug: string;
  name: string;
  duration_minutes: number;
  created_at: string;
  project_id?: string | null;
};

export default function CalendarEventsPage() {
  const ctx = useProjects();
  const selectedProjectIds = ctx?.selectedProjectIds ?? [];
  const projects = ctx?.projects ?? [];
  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p]));
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const q = selectedProjectIds.length > 0 ? `?projectIds=${selectedProjectIds.join(",")}` : "";
      const res = await fetch(`/api/events${q}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectIds]);

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

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        {loading ? (
          <p className="text-sm text-slate-500">Načítám eventy…</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-slate-500">
            Zatím nemáš žádné eventy. Přidej první a nastav dostupnost a odkaz.
          </p>
        ) : (
          <ul className="space-y-2">
            {events.map((ev) => {
              const project = ev.project_id ? projectMap[ev.project_id] : null;
              return (
              <li key={ev.id}>
                <Link
                  href={`/calendar/events/${ev.id}`}
                  className={`flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm hover:bg-slate-50 ${project ? "border-l-4" : ""}`}
                  style={project ? { borderLeftColor: project.color } : undefined}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{ev.name}</span>
                    {project ? (
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{ backgroundColor: `${project.color}30`, color: project.color }}
                      >
                        {project.name}
                      </span>
                    ) : null}
                  </div>
                  <span className="text-slate-500">
                    {ev.duration_minutes} min · /{ev.slug}
                  </span>
                </Link>
              </li>
            ); })}
          </ul>
        )}
      </section>
    </div>
  );
}
