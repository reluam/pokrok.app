"use client";

import { useCallback, useEffect, useState } from "react";

type ContactType = "email" | "phone" | "other";

const CONTACT_TYPES: { value: ContactType; label: string }[] = [
  { value: "email", label: "E-mail" },
  { value: "phone", label: "Telefon" },
  { value: "other", label: "Jiný (odkaz, WhatsApp…)" },
];

export function PrimaryContactSettings() {
  const [type, setType] = useState<ContactType | "">("");
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/primary-contact");
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setType(data.primary_contact_type ?? "");
      setValue(data.primary_contact_value ?? "");
    } catch (e) {
      setMessage({ type: "error", text: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings/primary-contact", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primary_contact_type: type || null,
          primary_contact_value: value.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      setType(data.primary_contact_type ?? "");
      setValue(data.primary_contact_value ?? "");
      setMessage({ type: "ok", text: "Primární kontakt uložen." });
    } catch (e) {
      setMessage({ type: "error", text: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Načítám…</p>;
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-medium text-slate-900">Primární kontakt</h2>
      <p className="mt-0.5 text-xs text-slate-600">
        Zobrazí se klientům u hlášky „už máte rezervaci“, aby věděli, jak vás kontaktovat (e-mail, telefon nebo jiný odkaz).
      </p>
      <form onSubmit={save} className="mt-3 space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-600">Typ</label>
          <select
            value={type}
            onChange={(e) => setType((e.target.value || "") as ContactType | "")}
            className="mt-1 w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
          >
            <option value="">— Nepoužívat —</option>
            {CONTACT_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        {(type === "email" || type === "phone" || type === "other") && (
          <div>
            <label className="block text-xs font-medium text-slate-600">
              {type === "email" ? "E-mail" : type === "phone" ? "Telefon" : "Kontakt (odkaz nebo text)"}
            </label>
            <input
              type={type === "email" ? "email" : "text"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={type === "email" ? "vas@email.cz" : type === "phone" ? "+420 123 456 789" : "např. WhatsApp: +420…"}
              className="mt-1 w-full max-w-md rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
            />
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? "Ukládám…" : "Uložit"}
          </button>
          {message && (
            <span className={message.type === "ok" ? "text-sm text-green-600" : "text-sm text-red-600"}>
              {message.text}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}
