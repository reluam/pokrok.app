"use client";

import { useEffect, useState } from "react";

type SessionDetail = {
  id: string;
  client_id: string | null;
  title: string;
  scheduled_at: string | null;
  duration_minutes: number;
  notes: string | null;
  client_name: string;
  client_email: string | null;
};

type SessionDetailModalProps = {
  sessionId: string | null;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

export function SessionDetailModal({
  sessionId,
  open,
  onClose,
  onSaved,
}: SessionDetailModalProps) {
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editTitle, setEditTitle] = useState("");
  const [editScheduledAt, setEditScheduledAt] = useState("");
  const [editDuration, setEditDuration] = useState(30);
  const [editNotes, setEditNotes] = useState("");

  useEffect(() => {
    if (!open || !sessionId) {
      setDetail(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`/api/sessions/${sessionId}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? "Schůzka nenalezena" : "Chyba načtení");
        return res.json();
      })
      .then((data: SessionDetail) => {
        setDetail(data);
        setEditTitle(data.title || "Schůzka");
        setEditScheduledAt(
          data.scheduled_at
            ? new Date(data.scheduled_at).toISOString().slice(0, 16)
            : ""
        );
        setEditDuration(data.duration_minutes ?? 30);
        setEditNotes(data.notes || "");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [open, sessionId]);

  async function handleSave() {
    if (!sessionId || !detail) return;
    setSaving(true);
    setError(null);
    try {
      const body: {
        title?: string;
        scheduled_at?: string;
        duration_minutes?: number;
        notes?: string;
      } = {};
      if (editTitle.trim() !== (detail.title || "Schůzka")) body.title = editTitle.trim() || "Schůzka";
      if (editScheduledAt) {
        const d = new Date(editScheduledAt);
        if (!Number.isNaN(d.getTime())) body.scheduled_at = d.toISOString();
      }
      if (editDuration !== (detail.duration_minutes ?? 30)) body.duration_minutes = editDuration;
      if (editNotes !== (detail.notes || "")) body.notes = editNotes.trim() || undefined;

      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Uložení se nepovedlo");
      }
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Uložení se nepovedlo");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  const dateTime = detail?.scheduled_at
    ? new Date(detail.scheduled_at).toLocaleString("cs-CZ", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-detail-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 id="session-detail-title" className="text-lg font-semibold text-slate-900">
            Detail schůzky
          </h2>
        </div>
        <div className="p-4">
          {loading && (
            <p className="py-8 text-center text-sm text-slate-500">Načítám…</p>
          )}
          {error && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          {!loading && detail && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">
                  Název
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">
                  Termín
                </label>
                <input
                  type="datetime-local"
                  value={editScheduledAt}
                  onChange={(e) => setEditScheduledAt(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Aktuálně: {dateTime || "—"}
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">
                  Délka (min)
                </label>
                <input
                  type="number"
                  min={15}
                  max={120}
                  value={editDuration}
                  onChange={(e) => setEditDuration(Math.min(120, Math.max(15, Number(e.target.value) || 30)))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                />
              </div>
              <div>
                <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                  Klient
                </div>
                <p className="text-sm text-slate-900">{detail.client_name}</p>
                {detail.client_email && (
                  <a
                    href={`mailto:${detail.client_email}`}
                    className="text-sm text-sky-600 hover:underline"
                  >
                    {detail.client_email}
                  </a>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">
                  Poznámka
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Zavřít
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  {saving ? "Ukládám…" : "Uložit"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
