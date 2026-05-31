"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };

export type Term = {
  id: number; slug: string; name: string; source: string;
  author_name: string; votes: number; created_at: string; clarif_count: number;
};
export type Clarification = {
  id: number; term_slug: string; term_name: string;
  content: string; author_name: string; created_at: string;
};
type Stats = { terms: number; clarifications: number; votes: number };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("cs-CZ", { day: "numeric", month: "short", year: "numeric" });
}

function StatCard({ label, value, emoji }: { label: string; value: number; emoji: string }) {
  return (
    <div style={{
      background: "#fff", border: "2.5px solid var(--border)",
      borderRadius: "16px", boxShadow: "4px 4px 0 var(--border)",
      padding: "20px 24px",
    }}>
      <p style={{ fontSize: "24px", marginBottom: "8px" }}>{emoji}</p>
      <p style={{ ...display, fontSize: "32px", fontWeight: 900, lineHeight: 1 }}>{value.toLocaleString("cs-CZ")}</p>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text-muted)", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
    </div>
  );
}

export function AdminDashboard({ stats, terms: initialTerms, clarifications: initialClarifs }: { stats: Stats; terms: Term[]; clarifications: Clarification[] }) {
  const [terms, setTerms] = useState<Term[]>(initialTerms as Term[]);
  const [clarifs, setClarifs] = useState<Clarification[]>(initialClarifs as Clarification[]);
  const [tab, setTab] = useState<"terms" | "clarifs">("terms");
  const [search, setSearch] = useState("");
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState("");
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  };

  const deleteTerm = async (slug: string) => {
    if (!confirm(`Smazat termín "${slug}" a všechna jeho upřesnění?`)) return;
    const res = await fetch(`/api/admin/vvv/terms/${slug}`, { method: "DELETE" });
    if (res.ok) {
      setTerms(prev => prev.filter(t => t.slug !== slug));
      setClarifs(prev => prev.filter(c => c.term_slug !== slug));
    }
  };

  const deleteClarif = async (id: number) => {
    if (!confirm("Smazat toto upřesnění?")) return;
    const res = await fetch(`/api/admin/vvv/clarifications/${id}`, { method: "DELETE" });
    if (res.ok) setClarifs(prev => prev.filter(c => c.id !== id));
  };

  const runSetup = async () => {
    setSeeding(true);
    setSeedMsg("");
    const res = await fetch("/api/vvv/setup", { method: "POST" });
    const j = await res.json();
    setSeedMsg(res.ok ? `✓ Hotovo. Naseedováno ${j.seeded} termínů.` : `✗ Chyba: ${j.error}`);
    setSeeding(false);
  };

  const filteredTerms = search
    ? terms.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.slug.includes(search.toLowerCase()))
    : terms;

  const filteredClarifs = search
    ? clarifs.filter(c => c.content.toLowerCase().includes(search.toLowerCase()) || c.term_name.toLowerCase().includes(search.toLowerCase()))
    : clarifs;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      {/* Header */}
      <div style={{
        background: "#fff", borderBottom: "2.5px solid var(--border)",
        padding: "16px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "24px" }}>🍝</span>
          <div>
            <h1 style={{ ...display, fontSize: "20px", fontWeight: 900, lineHeight: 1 }}>Spaghetti HQ</h1>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--text-muted)" }}>Admin rozhraní</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <Link href="/" style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text-muted)", textDecoration: "none" }}>
            ← Spaghetti.ltd
          </Link>
          <button onClick={logout} style={{
            background: "transparent", color: "var(--text-muted)",
            border: "2px solid var(--border)", borderRadius: "8px",
            padding: "6px 14px", fontFamily: "var(--font-sans)",
            fontSize: "12px", cursor: "pointer",
          }}>
            Odhlásit →
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "32px 24px 80px" }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "14px", marginBottom: "32px" }}>
          <StatCard label="Termínů VVV" value={stats.terms} emoji="📚" />
          <StatCard label="Upřesnění" value={stats.clarifications} emoji="✏️" />
          <StatCard label="Celkem hlasů" value={stats.votes} emoji="👍" />
        </div>

        {/* DB Setup */}
        <div style={{ background: "#fff", border: "2px solid var(--border)", borderRadius: "14px", boxShadow: "3px 3px 0 var(--border)", padding: "16px 20px", marginBottom: "28px", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <p style={{ ...display, fontSize: "15px", fontWeight: 700 }}>Inicializace databáze</p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text-muted)" }}>Vytvoří tabulky a naseeduje HHGG termíny (idempotentní)</p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={runSetup} disabled={seeding}
              style={{ background: "var(--text-primary)", color: "var(--bg)", border: "2px solid var(--text-primary)", borderRadius: "10px", boxShadow: "3px 3px 0 var(--text-primary)", padding: "8px 18px", fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 600, cursor: "pointer", opacity: seeding ? 0.5 : 1 }}>
              {seeding ? "Spouštím..." : "Spustit setup →"}
            </button>
            {seedMsg && <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: seedMsg.startsWith("✓") ? "#166534" : "#b91c1c" }}>{seedMsg}</p>}
          </div>
        </div>

        {/* Tabs + Search */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
          {(["terms", "clarifs"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ background: tab === t ? "var(--text-primary)" : "#fff", color: tab === t ? "var(--bg)" : "var(--text-primary)", border: "2px solid var(--border)", borderRadius: "10px", boxShadow: "2px 2px 0 var(--border)", padding: "8px 18px", fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
              {t === "terms" ? `Termíny (${terms.length})` : `Upřesnění (${clarifs.length})`}
            </button>
          ))}
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Hledat..."
            style={{ flex: 1, minWidth: "180px", background: "#fff", border: "2px solid var(--border)", borderRadius: "10px", padding: "8px 14px", fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--text-primary)", outline: "none" }} />
        </div>

        {/* Terms table */}
        {tab === "terms" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {filteredTerms.map(term => (
              <div key={term.slug} style={{
                background: "#fff", border: "2px solid var(--border)", borderRadius: "12px",
                boxShadow: "3px 3px 0 var(--border)", padding: "14px 18px",
                display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap",
              }}>
                <div style={{ flex: 1, minWidth: "180px" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
                    <Link href={`/vvv/${term.slug}`} target="_blank"
                      style={{ ...display, fontSize: "16px", fontWeight: 800, color: "var(--text-primary)", textDecoration: "none" }}>
                      {term.name}
                    </Link>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: "10px", color: term.source === "Komunita" ? "#D97706" : "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {term.source === "Komunita" ? "⚠️ komunita" : "HHGG"}
                    </span>
                  </div>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>
                    {term.author_name} · {formatDate(term.created_at)} · 👍 {term.votes} · ✏️ {term.clarif_count}
                  </p>
                </div>
                <button onClick={() => deleteTerm(term.slug)}
                  style={{ background: "#FEF2F2", color: "#b91c1c", border: "1.5px solid #FECACA", borderRadius: "8px", padding: "6px 12px", fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                  Smazat
                </button>
              </div>
            ))}
            {filteredTerms.length === 0 && (
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "14px", color: "var(--text-muted)", padding: "20px 0" }}>Žádné výsledky.</p>
            )}
          </div>
        )}

        {/* Clarifications table */}
        {tab === "clarifs" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {filteredClarifs.map(c => (
              <div key={c.id} style={{
                background: "#fff", border: "2px solid var(--border)", borderRadius: "12px",
                boxShadow: "3px 3px 0 var(--border)", padding: "14px 18px",
                display: "flex", gap: "14px", flexWrap: "wrap",
              }}>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>
                    <Link href={`/vvv/${c.term_slug}`} target="_blank" style={{ color: "var(--text-secondary)", textDecoration: "underline" }}>{c.term_name}</Link>
                    {" · "}{c.author_name} · {formatDate(c.created_at)}
                  </p>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--text-primary)", lineHeight: 1.55 }}>
                    {c.content.slice(0, 180)}{c.content.length > 180 ? "…" : ""}
                  </p>
                </div>
                <button onClick={() => deleteClarif(c.id)}
                  style={{ background: "#FEF2F2", color: "#b91c1c", border: "1.5px solid #FECACA", borderRadius: "8px", padding: "6px 12px", fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 600, cursor: "pointer", flexShrink: 0, alignSelf: "flex-start" }}>
                  Smazat
                </button>
              </div>
            ))}
            {filteredClarifs.length === 0 && (
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "14px", color: "var(--text-muted)", padding: "20px 0" }}>Žádná upřesnění.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
