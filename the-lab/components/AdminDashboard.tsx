"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AdminBrainWord } from "@/lib/brainDb";

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };

type Stats = { published: number; drafts: number; words: number; edges: number; total: number };

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

export function AdminDashboard({ stats, initialWords }: { stats: Stats; initialWords: AdminBrainWord[] }) {
  const [words, setWords] = useState<AdminBrainWord[]>(initialWords);
  const [search, setSearch] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  };

  // Hledání jde na server (lokálně máme jen top 300 slov podle síly).
  const onSearch = (q: string) => {
    setSearch(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      const res = await fetch(`/api/admin/brain/words?q=${encodeURIComponent(q)}`);
      if (res.ok) setWords(await res.json());
    }, 250);
  };

  const deleteWord = async (w: AdminBrainWord) => {
    if (!confirm(`Smazat slovo „${w.display}“ a všech jeho ${w.out_n + w.in_n} synapsí?`)) return;
    const res = await fetch(`/api/admin/brain/words/${w.id}`, { method: "DELETE" });
    if (res.ok) setWords(prev => prev.filter(x => x.id !== w.id));
  };

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      {/* Header */}
      <div style={{
        background: "#fff", borderBottom: "2.5px solid var(--border)",
        padding: "16px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "24px" }}>🧪</span>
          <div>
            <h1 style={{ ...display, fontSize: "20px", fontWeight: 900, lineHeight: 1 }}>The Lab HQ</h1>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--text-muted)" }}>Admin rozhraní</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <Link href="/admin/experiments" style={{ fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", textDecoration: "none" }}>
            Experimenty →
          </Link>
          <Link href="/" style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text-muted)", textDecoration: "none" }}>
            ← The Lab
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "14px", marginBottom: "32px" }}>
          <StatCard label="Publikováno" value={stats.published} emoji="🧫" />
          <StatCard label="Drafty" value={stats.drafts} emoji="📝" />
          <StatCard label="Slov v mozku" value={stats.words} emoji="🧠" />
          <StatCard label="Synapsí" value={stats.edges} emoji="🔗" />
          <StatCard label="Asociací" value={stats.total} emoji="⚡" />
        </div>

        {/* Veřejný mozek — moderace */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "14px", flexWrap: "wrap" }}>
          <h2 style={{ ...display, fontSize: "20px", fontWeight: 900 }}>🧠 Veřejný mozek — moderace</h2>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text-muted)" }}>
            smazání slova odstraní i všechny jeho synapse
          </span>
        </div>
        <input value={search} onChange={e => onSearch(e.target.value)} placeholder="Hledat slovo…"
          style={{ width: "100%", background: "#fff", border: "2px solid var(--border)", borderRadius: "10px", padding: "8px 14px", fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--text-primary)", outline: "none", marginBottom: "14px" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {words.map(w => (
            <div key={w.id} style={{
              background: "#fff", border: "2px solid var(--border)", borderRadius: "12px",
              boxShadow: "3px 3px 0 var(--border)", padding: "12px 16px",
              display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap",
            }}>
              <div style={{ flex: 1, minWidth: "160px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{ ...display, fontSize: "16px", fontWeight: 800 }}>{w.display}</span>
                  {w.is_seed && (
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: "10px", color: "#D97706", textTransform: "uppercase", letterSpacing: "0.06em" }}>🌱 seed</span>
                  )}
                </div>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>
                  ⚡ {w.strength} · → {w.out_n} ven · ← {w.in_n} sem · {formatDate(w.created_at)}
                </p>
              </div>
              <button onClick={() => deleteWord(w)}
                style={{ background: "#FEF2F2", color: "#b91c1c", border: "1.5px solid #FECACA", borderRadius: "8px", padding: "6px 12px", fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                Smazat
              </button>
            </div>
          ))}
          {words.length === 0 && (
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "14px", color: "var(--text-muted)", padding: "20px 0" }}>Žádná slova.</p>
          )}
        </div>
      </div>
    </div>
  );
}
