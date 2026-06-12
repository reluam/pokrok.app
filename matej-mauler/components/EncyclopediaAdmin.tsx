"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NODES, SEEDS } from "@/lib/encyclopedia/nodes";
import { graphData, titleOf } from "@/lib/encyclopedia/graph";
import type { Suggestion } from "@/app/api/admin/ency/suggest/route";

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const sans = "var(--font-sans)";
const REALM_LABEL: Record<string, string> = { space: "🌌 Vesmír", sound: "🔊 Zvuk", music: "🎶 Hudba", plain: "📖 Knihovna" };

type Wish = { slug: string; votes: number };

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: "#fff", border: "2px solid var(--border)", borderRadius: "14px", boxShadow: "3px 3px 0 var(--border)", padding: "16px 20px", ...style }}>{children}</div>;
}

function StatCard({ label, value, emoji }: { label: string; value: number; emoji: string }) {
  return (
    <div style={{ background: "#fff", border: "2.5px solid var(--border)", borderRadius: "16px", boxShadow: "4px 4px 0 var(--border)", padding: "18px 22px" }}>
      <p style={{ fontSize: "22px", marginBottom: "6px" }}>{emoji}</p>
      <p style={{ ...display, fontSize: "30px", fontWeight: 900, lineHeight: 1 }}>{value.toLocaleString("cs-CZ")}</p>
      <p style={{ fontFamily: sans, fontSize: "12px", color: "var(--text-muted)", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
    </div>
  );
}

function Chip({ children, tone }: { children: React.ReactNode; tone?: "up" | "next" | "side" | "red" }) {
  const col = tone === "red" ? "#b45309" : tone === "next" ? "#166534" : tone === "up" ? "#1d4ed8" : "var(--text-secondary)";
  return <span style={{ fontFamily: sans, fontSize: "11px", fontWeight: 600, color: col, background: "rgba(26,22,20,0.05)", border: "1px solid rgba(26,22,20,0.12)", borderRadius: "999px", padding: "2px 9px", whiteSpace: "nowrap" }}>{children}</span>;
}

/** CMS encyklopedie: přehled grafu, relace, červené odkazy s přáními a Claude návrhy propojení. */
export function EncyclopediaAdmin({ wishes, suggestions: initial }: { wishes: Wish[]; suggestions: Suggestion[] }) {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<Suggestion[]>(initial);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState("");

  const g = graphData();
  const reds = g.nodes.filter((n) => !n.realm);
  const wishMap = Object.fromEntries(wishes.map((w) => [w.slug, w.votes]));
  const realms = ["space", "sound", "music", "plain"] as const;

  const logout = async () => { await fetch("/api/admin/auth", { method: "DELETE" }); router.push("/admin/login"); };

  const suggest = async () => {
    setThinking(true); setError("");
    try {
      const res = await fetch("/api/admin/ency/suggest", { method: "POST" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Chyba");
      setSuggestions(j.suggestions);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chyba");
    }
    setThinking(false);
  };

  const dismiss = async (id: number) => {
    setSuggestions((s) => s.filter((x) => x.id !== id));
    await fetch(`/api/admin/ency/suggest?id=${id}`, { method: "DELETE" });
  };

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "2.5px solid var(--border)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "24px" }}>🍝</span>
          <div>
            <h1 style={{ ...display, fontSize: "20px", fontWeight: 900, lineHeight: 1 }}>Spaghetti HQ</h1>
            <p style={{ fontFamily: sans, fontSize: "11px", color: "var(--text-muted)" }}>Encyklopedie — content management</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          {[["/admin", "Přehled →"], ["/mapa", "Mapa →"], ["/admin/brain", "Synapse →"], ["/admin/vvv", "VVV →"], ["/admin/experiments", "Experimenty →"], ["/admin/songs", "Songs →"]].map(([href, label]) => (
            <Link key={href} href={href} style={{ fontFamily: sans, fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", textDecoration: "none" }}>{label}</Link>
          ))}
          <Link href="/" style={{ fontFamily: sans, fontSize: "12px", color: "var(--text-muted)", textDecoration: "none" }}>← Spaghetti.ltd</Link>
          <button onClick={logout} style={{ background: "transparent", color: "var(--text-muted)", border: "2px solid var(--border)", borderRadius: "8px", padding: "6px 14px", fontFamily: sans, fontSize: "12px", cursor: "pointer" }}>Odhlásit →</button>
        </div>
      </div>

      <div style={{ maxWidth: "1020px", margin: "0 auto", padding: "32px 24px 80px" }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "14px", marginBottom: "28px" }}>
          <StatCard label="Hesel" value={g.nodes.length - reds.length} emoji="📚" />
          <StatCard label="Synapsí" value={g.edges.length} emoji="🍝" />
          <StatCard label="Červených odkazů" value={reds.length} emoji="❓" />
          <StatCard label="Přání" value={wishes.reduce((s, w) => s + w.votes, 0)} emoji="🙋" />
        </div>

        {/* Claude návrhy */}
        <Card style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", marginBottom: suggestions.length || error ? "14px" : 0 }}>
            <div style={{ flex: 1, minWidth: "220px" }}>
              <p style={{ ...display, fontSize: "16px", fontWeight: 800 }}>🤖 Claude — návrhy propojení</p>
              <p style={{ fontFamily: sans, fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                Pošle Claudovi celý graf (hesla, synapse, červené odkazy, přání) a vrátí návrhy nových vazeb a témat. Spouštěj po přidání nového tématu. Graf žije v kódu — návrhy jsou zásobník na příští editaci.
              </p>
            </div>
            <button onClick={suggest} disabled={thinking}
              style={{ background: "var(--text-primary)", color: "var(--bg)", border: "2px solid var(--text-primary)", borderRadius: "10px", boxShadow: "3px 3px 0 var(--text-primary)", padding: "9px 18px", fontFamily: sans, fontSize: "13px", fontWeight: 700, cursor: "pointer", opacity: thinking ? 0.55 : 1, flexShrink: 0 }}>
              {thinking ? "Claude přemýšlí…" : "Navrhnout propojení →"}
            </button>
          </div>
          {error && <p style={{ fontFamily: sans, fontSize: "12px", color: "#b91c1c" }}>✗ {error}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {suggestions.map((s) => (
              <div key={s.id} style={{ border: "1.5px solid rgba(26,22,20,0.12)", borderRadius: "10px", padding: "10px 14px", display: "flex", gap: "12px", alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "240px" }}>
                  <p style={{ fontFamily: sans, fontSize: "13px", fontWeight: 700 }}>
                    <Chip tone={s.kind === "topic" ? "red" : "side"}>{s.kind === "topic" ? "nové téma" : "synapse"}</Chip>
                    {" "}
                    <code style={{ fontSize: "12px" }}>{s.from_slug}</code> → <code style={{ fontSize: "12px" }}>{s.to_slug}</code>
                    {s.title && <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}> · {s.title}</span>}
                  </p>
                  <p style={{ fontFamily: sans, fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: 1.5, marginTop: "3px" }}>{s.reason}</p>
                </div>
                <button onClick={() => dismiss(s.id)} style={{ background: "#FEF2F2", color: "#b91c1c", border: "1.5px solid #FECACA", borderRadius: "8px", padding: "4px 10px", fontFamily: sans, fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>Zahodit</button>
              </div>
            ))}
            {!suggestions.length && !error && !thinking && (
              <p style={{ fontFamily: sans, fontSize: "12px", color: "var(--text-muted)" }}>Zatím žádné návrhy — klikni na tlačítko.</p>
            )}
          </div>
        </Card>

        {/* Červené odkazy + přání */}
        <Card style={{ marginBottom: "28px" }}>
          <p style={{ ...display, fontSize: "16px", fontWeight: 800, marginBottom: "10px" }}>❓ Červené odkazy (zásobník témat)</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "8px" }}>
            {reds.sort((a, b) => (wishMap[b.slug] ?? 0) - (wishMap[a.slug] ?? 0)).map((r) => (
              <div key={r.slug} style={{ border: "1.5px dashed rgba(26,22,20,0.25)", borderRadius: "10px", padding: "8px 12px" }}>
                <p style={{ fontFamily: sans, fontSize: "13px", fontWeight: 700 }}>
                  {SEEDS[r.slug]?.cs ?? r.slug}
                  {(wishMap[r.slug] ?? 0) > 0 && <span style={{ color: "#b45309", fontWeight: 700 }}> · 🙋 {wishMap[r.slug]}</span>}
                </p>
                <p style={{ fontFamily: sans, fontSize: "11px", color: "var(--text-muted)" }}>/{r.slug} · z: {r.parent ?? "—"}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Hesla podle realmů */}
        {realms.map((realm) => {
          const list = Object.values(NODES).filter((n) => n.realm === realm && n.slug !== "brana");
          if (!list.length) return null;
          return (
            <Card key={realm} style={{ marginBottom: "20px" }}>
              <p style={{ ...display, fontSize: "16px", fontWeight: 800, marginBottom: "12px" }}>{REALM_LABEL[realm]} <span style={{ fontFamily: sans, fontSize: "12px", fontWeight: 400, color: "var(--text-muted)" }}>· {list.length} hesel</span></p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {list.map((n) => (
                  <div key={n.slug} style={{ borderTop: "1px solid rgba(26,22,20,0.08)", paddingTop: "8px", display: "flex", gap: "10px", alignItems: "baseline", flexWrap: "wrap" }}>
                    <Link href={`/${n.slug}`} target="_blank" style={{ fontFamily: sans, fontSize: "13.5px", fontWeight: 700, color: "var(--text-primary)", textDecoration: "none", minWidth: "150px" }}>{n.title.cs}</Link>
                    <span style={{ fontFamily: sans, fontSize: "11px", color: "var(--text-muted)" }}>/{n.slug}</span>
                    <span style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                      {n.up && <Chip tone="up">↑ {titleOf(n.up, "cs")}</Chip>}
                      {n.next && <Chip tone="next">↓ {titleOf(n.next, "cs")}</Chip>}
                      {(n.satellites ?? []).map((s) => (
                        <Chip key={s.to} tone={NODES[s.to] ? "side" : "red"}>{NODES[s.to] ? "→" : "?"} {titleOf(s.to, "cs")}</Chip>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
