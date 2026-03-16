"use client";

import { useState, useEffect } from "react";
import { Trash2, Send, RefreshCw } from "lucide-react";

type PurchaseRow = {
  id: string;
  user_id: string;
  email: string;
  created_at: string;
  completed_at: string | null;
  stripe_payment_id: string | null;
};

export default function AuditAccessContent() {
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [emails, setEmails] = useState("");
  const [granting, setGranting] = useState(false);
  const [results, setResults] = useState<{ email: string; ok: boolean; error?: string }[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/grant-access");
      const data = await res.json();
      if (res.ok) setPurchases(data.purchases ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emails.trim()) return;
    setGranting(true);
    setResults([]);
    try {
      const res = await fetch("/api/admin/grant-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
      });
      const data = await res.json();
      if (res.ok) {
        setResults(data.results ?? []);
        setEmails("");
        load();
      } else {
        setResults([{ email: "—", ok: false, error: data.error }]);
      }
    } catch {
      setResults([{ email: "—", ok: false, error: "Chyba připojení." }]);
    } finally {
      setGranting(false);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Odebrat přístup uživateli ${email}?`)) return;
    setDeletingId(id);
    try {
      await fetch("/api/admin/grant-access", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setPurchases((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("cs-CZ", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Audit života — přístupy</h2>
        <p className="text-sm text-foreground/50 mt-1">Přiděluj přístupy zadarmo. Uživatelům přijde magic link e-mailem (platný 7 dní).</p>
      </div>

      {/* Formulář */}
      <form onSubmit={handleGrant} className="bg-white rounded-2xl border border-black/8 p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Přidělit přístup</h3>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground/50 uppercase tracking-wider">
            E-mail(y) — jeden per řádek nebo oddělené čárkou
          </label>
          <textarea
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            placeholder={"jan@example.cz\npetra@example.cz"}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-black/15 bg-white text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-accent resize-none"
          />
        </div>
        <button
          type="submit"
          disabled={granting || !emails.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent-hover disabled:opacity-50 transition-colors"
        >
          <Send size={15} />
          {granting ? "Odesílám…" : "Přidělit přístup a odeslat e-mail"}
        </button>

        {results.length > 0 && (
          <div className="space-y-1.5 pt-1">
            {results.map((r, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${r.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
              >
                <span>{r.ok ? "✓" : "✗"}</span>
                <span className="font-medium">{r.email}</span>
                {!r.ok && r.error && <span className="text-xs opacity-70">— {r.error}</span>}
                {r.ok && <span className="text-xs opacity-70">— přístup přidělen, e-mail odeslán</span>}
              </div>
            ))}
          </div>
        )}
      </form>

      {/* Seznam přístupů */}
      <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/8">
          <h3 className="font-semibold text-foreground">
            Všechny přístupy
            <span className="ml-2 text-xs font-normal text-foreground/40">({purchases.length})</span>
          </h3>
          <button onClick={load} className="p-2 rounded-lg hover:bg-black/5 text-foreground/40 transition-colors">
            <RefreshCw size={15} />
          </button>
        </div>

        {loading ? (
          <div className="px-6 py-8 text-sm text-foreground/40 text-center">Načítám…</div>
        ) : purchases.length === 0 ? (
          <div className="px-6 py-8 text-sm text-foreground/40 text-center">Zatím žádné přístupy.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-foreground/35 border-b border-black/5">
                <th className="px-6 py-3">E-mail</th>
                <th className="px-4 py-3">Přidělen</th>
                <th className="px-4 py-3">Stav</th>
                <th className="px-4 py-3">Způsob</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {purchases.map((p) => (
                <tr key={p.id} className="hover:bg-black/[0.015] transition-colors">
                  <td className="px-6 py-3 font-medium text-foreground">{p.email}</td>
                  <td className="px-4 py-3 text-foreground/50 whitespace-nowrap">{fmt(p.created_at)}</td>
                  <td className="px-4 py-3">
                    {p.completed_at ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-foreground/8 text-foreground/50">
                        Dokončeno
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                        Aktivní
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-foreground/40 text-xs">
                    {p.stripe_payment_id ? "Stripe" : "Admin"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(p.id, p.email)}
                      disabled={deletingId === p.id}
                      className="p-1.5 rounded-lg text-foreground/30 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                      title="Odebrat přístup"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
