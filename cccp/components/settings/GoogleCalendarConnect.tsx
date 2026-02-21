"use client";

import { useCallback, useEffect, useState } from "react";

export function GoogleCalendarConnect() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [useIntegratedCalendars, setUseIntegratedCalendars] = useState(true);
  const [savingSetting, setSavingSetting] = useState(false);
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
      const [statusRes, settingsRes] = await Promise.all([
        fetch("/api/calendar/google/status"),
        fetch("/api/settings/use-integrated-calendars"),
      ]);
      if (!statusRes.ok) throw new Error(await statusRes.text());
      const statusData = await statusRes.json();
      setConnected(statusData.connected === true);
      
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setUseIntegratedCalendars(settingsData.use_integrated_calendars ?? true);
      }
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

  const handleToggleIntegratedCalendars = async (checked: boolean) => {
    setSavingSetting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings/use-integrated-calendars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ use_integrated_calendars: checked }),
      });
      if (!res.ok) throw new Error(await res.text());
      setUseIntegratedCalendars(checked);
      setMessage({
        type: "ok",
        text: checked
          ? "Události z integrovaných kalendářů se nyní zohledňují při výpočtu volných termínů."
          : "Události z integrovaných kalendářů se již nezohledňují.",
      });
    } catch (e) {
      setMessage({ type: "error", text: (e as Error).message });
    } finally {
      setSavingSetting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8">
        <p className="text-slate-500">Načítám stav kalendáře…</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8">
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

      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
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

        {connected && (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={useIntegratedCalendars}
              onChange={(e) => handleToggleIntegratedCalendars(e.target.checked)}
              disabled={savingSetting}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500 disabled:opacity-50"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-slate-900">
                Zohledňovat události z integrovaných kalendářů
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                Pokud je zaškrtnuto, události z Google Kalendáře se zohlední při výpočtu volných termínů pro eventy.
              </p>
            </div>
          </label>
        )}
      </div>
    </div>
  );
}
