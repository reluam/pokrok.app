"use client";

import { useState, useEffect } from "react";
import { Save, Check } from "lucide-react";

export default function SettingsContent() {
  const [notionApiKey, setNotionApiKey] = useState("");
  const [notionDatabaseId, setNotionDatabaseId] = useState("");
  const [calLink, setCalLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.notionApiKey) setNotionApiKey(data.notionApiKey);
        if (data.notionDatabaseId) setNotionDatabaseId(data.notionDatabaseId);
        if (data.calLink) setCalLink(data.calLink);
      })
      .catch(() => {
        // Settings nejsou v DB, použijeme aktuální z .env (maskované)
        setNotionApiKey("••••••••••••••••");
        setNotionDatabaseId("••••••••••••••••");
      });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notionApiKey: notionApiKey.trim() || null,
          notionDatabaseId: notionDatabaseId.trim() || null,
          calLink: calLink.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Nepodařilo se uložit nastavení.");
        setLoading(false);
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setLoading(false);
    } catch {
      setError("Chyba při ukládání nastavení.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Nastavení</h2>
        <p className="text-foreground/70">
          Konfigurace integrací a externích služeb.
        </p>
      </div>

      {/* Notion */}
      <section className="bg-white rounded-2xl p-6 border-2 border-black/10">
        <h3 className="text-xl font-bold text-foreground mb-4">Notion CRM</h3>
        <p className="text-sm text-foreground/60 mb-6">
          Leady se automaticky posílají do Notionu, pokud jsou nastavené údaje níže.
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="notion-api-key" className="block text-sm font-medium text-foreground mb-2">
              Notion API Key
            </label>
            <input
              id="notion-api-key"
              type="password"
              value={notionApiKey}
              onChange={(e) => setNotionApiKey(e.target.value)}
              placeholder="secret_..."
              className="w-full px-4 py-3 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white"
            />
            <p className="text-xs text-foreground/50 mt-1">
              Získáš v{" "}
              <a
                href="https://www.notion.so/my-integrations"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                Notion Integrations
              </a>
            </p>
          </div>

          <div>
            <label htmlFor="notion-db-id" className="block text-sm font-medium text-foreground mb-2">
              Notion Database ID
            </label>
            <input
              id="notion-db-id"
              type="text"
              value={notionDatabaseId}
              onChange={(e) => setNotionDatabaseId(e.target.value)}
              placeholder="32-znakový ID z URL databáze"
              className="w-full px-4 py-3 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white"
            />
            <p className="text-xs text-foreground/50 mt-1">
              ID najdeš v URL databáze: notion.so/XXXXX?v=... → XXXXX je Database ID
            </p>
          </div>
        </div>
      </section>

      {/* Cal.com */}
      <section className="bg-white rounded-2xl p-6 border-2 border-black/10">
        <h3 className="text-xl font-bold text-foreground mb-4">Cal.com / cal.eu</h3>
        <p className="text-sm text-foreground/60 mb-6">
          Booking link pro rezervace termínů (formát: username/event-slug).
        </p>

        <div>
          <label htmlFor="cal-link" className="block text-sm font-medium text-foreground mb-2">
            Cal Link
          </label>
          <input
            id="cal-link"
            type="text"
            value={calLink}
            onChange={(e) => setCalLink(e.target.value)}
            placeholder="matej-mauler/30min"
            className="w-full px-4 py-3 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white"
          />
          <p className="text-xs text-foreground/50 mt-1">
            Použije se jako NEXT_PUBLIC_CAL_LINK v aplikaci.
          </p>
        </div>
      </section>

      {/* Externí CRM služby */}
      <section className="bg-white rounded-2xl p-6 border-2 border-black/10">
        <h3 className="text-xl font-bold text-foreground mb-4">Externí CRM služby</h3>
        <p className="text-sm text-foreground/60 mb-4">
          Pro profesionálnější CRM s fakturacemi a mobilní aplikací doporučujeme:
        </p>
        <ul className="space-y-2 text-sm text-foreground/80 mb-6">
          <li>
            • <strong>Paperbell</strong> – CRM pro kouče, fakturace, mobilní app
          </li>
          <li>
            • <strong>HoneyBook</strong> – CRM pro service professionals, fakturace, smlouvy
          </li>
          <li>
            • <strong>Zoho CRM + Books</strong> – komplexní CRM + fakturace, mobilní app
          </li>
        </ul>
        <p className="text-xs text-foreground/50">
          Leady lze exportovat do těchto služeb přes jejich API (nastavení v budoucí verzi).
        </p>
      </section>

      {/* Save button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl font-semibold hover:bg-accent-hover transition-colors disabled:opacity-70"
        >
          {saved ? (
            <>
              <Check size={20} />
              <span>Uloženo</span>
            </>
          ) : (
            <>
              <Save size={20} />
              <span>{loading ? "Ukládám..." : "Uložit nastavení"}</span>
            </>
          )}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
