"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, FlaskConical, Plus, Infinity } from "lucide-react";

interface Grant {
  id: string;
  email: string;
  expires_at: string | null;
  note: string | null;
  created_at: string;
}

const DURATION_OPTIONS = [
  { label: "1 měsíc",   months: 1 },
  { label: "3 měsíce",  months: 3 },
  { label: "6 měsíců",  months: 6 },
  { label: "12 měsíců", months: 12 },
  { label: "Napořád",   months: null },
];

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

function formatExpiry(expiresAt: string | null): string {
  if (!expiresAt) return "Napořád";
  const d = new Date(expiresAt);
  return d.toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" });
}

export default function ManualGrantsContent() {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [selectedMonths, setSelectedMonths] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadGrants = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/manual-grants");
      const data = await res.json();
      setGrants(data.grants ?? []);
    } catch {
      setError("Nepodařilo se načíst přístupy.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadGrants(); }, [loadGrants]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError("Zadej e-mail."); return; }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/manual-grants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), months: selectedMonths, note: note.trim() || null }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Chyba při ukládání.");
        return;
      }
      setSuccess(`Přístup pro ${email.trim()} byl udělen.`);
      setEmail("");
      setNote("");
      setSelectedMonths(null);
      await loadGrants();
    } catch {
      setError("Nepodařilo se uložit.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, email: string) {
    if (!confirm(`Odebrat přístup pro ${email}?`)) return;
    setDeletingId(id);
    try {
      await fetch(`/api/admin/manual-grants?id=${id}`, { method: "DELETE" });
      setGrants((prev) => prev.filter((g) => g.id !== id));
    } catch {
      setError("Nepodařilo se odebrat přístup.");
    } finally {
      setDeletingId(null);
    }
  }

  const active = grants.filter((g) => !isExpired(g.expires_at));
  const expired = grants.filter((g) => isExpired(g.expires_at));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FlaskConical size={24} className="text-accent" />
          Manuál — přístupy zdarma
        </h1>
        <p className="text-sm text-foreground/60 mt-1">
          Udělej konkrétnímu e-mailu přístup do Manuálu bez placení.
        </p>
      </div>

      {/* Add form */}
      <div className="bg-white border border-black/10 rounded-2xl p-6">
        <h2 className="font-semibold text-foreground mb-4">Přidat přístup</h2>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jan@example.cz"
              className="w-full px-4 py-2.5 border border-black/15 rounded-xl text-sm focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/10"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">Délka přístupu</label>
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={String(opt.months)}
                  type="button"
                  onClick={() => setSelectedMonths(opt.months)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                    selectedMonths === opt.months
                      ? "bg-accent text-white border-accent"
                      : "bg-white border-black/15 text-foreground/70 hover:border-accent/40 hover:text-foreground"
                  }`}
                >
                  {opt.months === null && <Infinity size={14} />}
                  {opt.label}
                </button>
              ))}
            </div>
            {selectedMonths === null && selectedMonths !== 0 && (
              <p className="text-xs text-foreground/40 mt-1.5">Vyber délku přístupu</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1">
              Poznámka <span className="text-foreground/35 font-normal">(volitelné)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="např. partner, tester, beta přístup…"
              className="w-full px-4 py-2.5 border border-black/15 rounded-xl text-sm focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/10"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>
          )}
          {success && (
            <p className="text-sm text-green-700 bg-green-50 px-4 py-2.5 rounded-xl">{success}</p>
          )}

          <button
            type="submit"
            disabled={saving || selectedMonths === undefined}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-xl font-semibold text-sm hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
            {saving ? "Ukládám…" : "Udělit přístup"}
          </button>
        </form>
      </div>

      {/* Active grants */}
      <div className="bg-white border border-black/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-black/8 flex items-center justify-between">
          <h2 className="font-semibold text-foreground">
            Aktivní přístupy
            <span className="ml-2 text-sm font-normal text-foreground/40">({active.length})</span>
          </h2>
        </div>

        {loading ? (
          <div className="px-6 py-8 text-center text-sm text-foreground/40">Načítám…</div>
        ) : active.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-foreground/40">Žádné aktivní přístupy.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-xs font-semibold text-foreground/40 uppercase tracking-wide border-b border-black/5">
                <th className="px-6 py-3 text-left">E-mail</th>
                <th className="px-6 py-3 text-left">Platí do</th>
                <th className="px-6 py-3 text-left">Poznámka</th>
                <th className="px-6 py-3 text-left">Přidáno</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {active.map((g) => (
                <tr key={g.id} className="hover:bg-black/[0.02] transition-colors">
                  <td className="px-6 py-3 text-sm font-medium text-foreground">{g.email}</td>
                  <td className="px-6 py-3 text-sm">
                    {g.expires_at === null ? (
                      <span className="inline-flex items-center gap-1 text-accent font-semibold">
                        <Infinity size={13} /> Napořád
                      </span>
                    ) : (
                      <span className="text-foreground/70">{formatExpiry(g.expires_at)}</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-sm text-foreground/50">{g.note ?? "—"}</td>
                  <td className="px-6 py-3 text-sm text-foreground/40">
                    {new Date(g.created_at).toLocaleDateString("cs-CZ")}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => handleDelete(g.id, g.email)}
                      disabled={deletingId === g.id}
                      className="p-1.5 text-foreground/30 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                      title="Odebrat přístup"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Expired grants */}
      {expired.length > 0 && (
        <div className="bg-white border border-black/10 rounded-2xl overflow-hidden opacity-60">
          <div className="px-6 py-4 border-b border-black/8">
            <h2 className="font-semibold text-foreground/60">
              Expirované přístupy
              <span className="ml-2 text-sm font-normal text-foreground/35">({expired.length})</span>
            </h2>
          </div>
          <table className="w-full">
            <tbody className="divide-y divide-black/5">
              {expired.map((g) => (
                <tr key={g.id} className="text-foreground/40">
                  <td className="px-6 py-3 text-sm">{g.email}</td>
                  <td className="px-6 py-3 text-sm">{formatExpiry(g.expires_at)}</td>
                  <td className="px-6 py-3 text-sm">{g.note ?? "—"}</td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => handleDelete(g.id, g.email)}
                      disabled={deletingId === g.id}
                      className="p-1.5 hover:text-red-400 rounded-lg transition-colors disabled:opacity-40"
                      title="Smazat"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
