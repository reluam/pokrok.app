"use client";

import { useCallback, useEffect, useState } from "react";

export function GoogleCalendarConnect() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const connectedParam = params.get("connected");
    const errorParam = params.get("error");
    if (connectedParam === "1") {
      setMessage({ type: "ok", text: "Google Kalendář byl úspěšně připojen." });
      window.history.replaceState({}, "", window.location.pathname);
    } else if (errorParam) {
      setMessage({ type: "error", text: decodeURIComponent(errorParam) });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/calendar/google/status");
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setConnected(data.connected === true);
    } catch (e) {
      setMessage({ type: "error", text: (e as Error).message });
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleDisconnect = async () => {
    setDisconnecting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/calendar/google/disconnect", { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      setConnected(false);
      setMessage({ type: "ok", text: "Google Kalendář byl odpojen." });
    } catch (e) {
      setMessage({ type: "error", text: (e as Error).message });
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-white/80 p-8 shadow-sm ring-1 ring-slate-100">
        <p className="text-slate-500">Načítám stav kalendáře…</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white/80 p-8 shadow-sm ring-1 ring-slate-100">
      <h2 className="text-lg font-medium text-slate-900">Google Kalendář</h2>
      <p className="mt-1 text-sm text-slate-600">
        Propojením s Google Kalendářem se při výpočtu volných termínů zohlední vaše události a rezervace se nebudou nabízet v obsazených časech.
      </p>

      {message && (
        <p
          className={`mt-4 text-sm ${message.type === "ok" ? "text-emerald-600" : "text-red-600"}`}
        >
          {message.text}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {connected ? (
          <>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">
              Připojeno
            </span>
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
            >
              {disconnecting ? "Odpojuji…" : "Odpojit"}
            </button>
          </>
        ) : (
          <a
            href="/api/calendar/google/connect"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
          >
            Připojit Google Kalendář
          </a>
        )}
      </div>
    </div>
  );
}
