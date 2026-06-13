"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getNode, searchIndex, searchNodes, type SearchEntry } from "@/lib/encyclopedia/graph";
import type { NodeDef } from "@/lib/encyclopedia/types";
import type { Lang } from "@/lib/dictionaries";
import type { Theme } from "./Shell";

const sans = "var(--font-sans)";
const display = "var(--font-display)";

const REALM_ORDER = ["space", "sound", "music", "plain"] as const;
const REALM_LABEL: Record<string, { cs: string; en: string }> = {
  space: { cs: "🌌 Vesmír", en: "🌌 Space" },
  sound: { cs: "🔊 Zvuk", en: "🔊 Sound" },
  music: { cs: "🎶 Hudba", en: "🎶 Music" },
  plain: { cs: "📖 Knihovna", en: "📖 Library" },
};

const UI = {
  cs: { searchPh: "Hledej heslo… (třeba „slunce“)", random: "🎲 Náhodné heslo", map: "🗺 Mapa všeho", uncharted: "Neprobádaná témata", empty: "Nic. Zkus to jinak.", browse: "Nebo procházej" },
  en: { searchPh: "Search a topic… (try “sun”)", random: "🎲 Random topic", map: "🗺 Map of everything", uncharted: "Uncharted topics", empty: "Nothing. Try something else.", browse: "Or browse" },
} as const;

export function EncyclopediaLanding({ node, lang, theme, onPick }: { node: NodeDef; lang: Lang; theme: Theme; onPick: (slug: string) => void }) {
  const u = UI[lang];
  const dark = theme === "dark";
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const ink = dark ? "#fff" : "#1a1614";
  const body = dark ? "rgba(255,255,255,0.82)" : "rgba(26,22,20,0.8)";
  const soft = dark ? "rgba(255,255,255,0.5)" : "rgba(26,22,20,0.5)";
  const cardBg = dark ? "rgba(255,255,255,0.05)" : "#fff";
  const cardBorder = dark ? "1px solid rgba(255,255,255,0.14)" : "2px solid var(--border)";

  // procházení: hotová hesla po oblastech + červené zvlášť
  const { groups, reds } = useMemo(() => {
    const all = searchIndex();
    const g: Record<string, SearchEntry[]> = {};
    const r: SearchEntry[] = [];
    for (const e of all) {
      if (e.red) { r.push(e); continue; }
      const realm = getNode(e.slug)?.realm ?? "plain";
      (g[realm] ??= []).push(e);
    }
    for (const k of Object.keys(g)) g[k].sort((a, b) => a.title[lang].localeCompare(b.title[lang]));
    return { groups: g, reds: r };
  }, [lang]);

  const results = q.trim() ? searchNodes(q, lang, 12) : [];

  const random = () => {
    const real = searchIndex().filter((e) => !e.red && e.slug !== "brana");
    if (real.length) onPick(real[Math.floor(Math.random() * real.length)].slug);
  };

  const Card = ({ e }: { e: SearchEntry }) => (
    <button onClick={() => onPick(e.slug)} style={{
      textAlign: "left", background: e.red ? "transparent" : cardBg, border: e.red ? `1.5px dashed ${soft}` : cardBorder,
      borderRadius: 12, boxShadow: e.red ? "none" : (dark ? "none" : "3px 3px 0 var(--border)"),
      padding: "11px 14px", cursor: "pointer", display: "flex", flexDirection: "column", gap: 3, minWidth: 0,
    }}>
      <span style={{ fontFamily: display, fontSize: 15, fontWeight: 800, color: ink, letterSpacing: "-0.01em" }}>{e.title[lang]}</span>
      {e.guide && <span style={{ fontFamily: sans, fontSize: 12, lineHeight: 1.45, color: soft, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{e.guide[lang]}</span>}
    </button>
  );

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 5, overflowY: "auto" }}>
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "clamp(56px, 12vh, 130px) 22px 80px", textAlign: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="" width={56} height={56} style={{ display: "block", margin: "0 auto 14px", filter: dark ? "invert(1)" : "none", opacity: 0.95 }} />
        <p style={{ fontFamily: sans, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.28em", color: soft, marginBottom: 10 }}>Encyklopedie</p>
        <h1 style={{ fontFamily: display, fontSize: "clamp(30px,6vw,46px)", fontWeight: 700, color: ink, letterSpacing: "-0.03em", lineHeight: 1.04, marginBottom: 12 }}>{node.title[lang]}</h1>
        <p style={{ fontFamily: sans, fontSize: 15, lineHeight: 1.6, color: body, maxWidth: 540, margin: "0 auto 26px" }}>{node.guide[lang]}</p>

        {/* search */}
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, background: dark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.8)", border: dark ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(26,22,20,0.2)", borderRadius: 999, padding: "13px 20px", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
            <span aria-hidden>🔍</span>
            <input ref={inputRef} value={q} autoFocus onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && results[0]) onPick(results[0].slug); }}
              placeholder={u.searchPh} className="ency-search"
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: ink, fontFamily: sans, fontSize: 15, minWidth: 0 }} />
          </div>
        </div>

        {/* výsledky hledání */}
        {q.trim() ? (
          <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10, textAlign: "left" }}>
            {results.length === 0 ? <p style={{ fontFamily: sans, fontSize: 14, color: soft, gridColumn: "1 / -1" }}>{u.empty}</p>
              : results.map((e) => <Card key={e.slug} e={e} />)}
          </div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 16, flexWrap: "wrap" }}>
              <button onClick={random} style={pill(dark)}>{u.random}</button>
              <Link href="/mapa" style={{ ...pill(dark), textDecoration: "none", display: "inline-flex", alignItems: "center" }}>{u.map}</Link>
            </div>

            {/* procházení po oblastech */}
            <p style={{ fontFamily: sans, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.18em", color: soft, margin: "40px 0 16px" }}>{u.browse}</p>
            {REALM_ORDER.filter((r) => groups[r]?.length).map((realm) => (
              <section key={realm} style={{ marginBottom: 28, textAlign: "left" }}>
                <h2 style={{ fontFamily: display, fontSize: 17, fontWeight: 900, color: ink, marginBottom: 10 }}>{REALM_LABEL[realm][lang]}</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
                  {groups[realm].map((e) => <Card key={e.slug} e={e} />)}
                </div>
              </section>
            ))}

            {reds.length > 0 && (
              <section style={{ textAlign: "left" }}>
                <h2 style={{ fontFamily: display, fontSize: 17, fontWeight: 900, color: soft, marginBottom: 10 }}>❓ {u.uncharted}</h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {reds.map((e) => (
                    <button key={e.slug} onClick={() => onPick(e.slug)} style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 600, color: soft, background: "transparent", border: `1.5px dashed ${soft}`, borderRadius: 999, padding: "5px 13px", cursor: "pointer" }}>{e.title[lang]}</button>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
      <style>{`.ency-search::placeholder { color: inherit; opacity: 0.5; }`}</style>
    </div>
  );
}

const pill = (dark: boolean): React.CSSProperties => ({
  fontFamily: sans, fontSize: 13.5, fontWeight: 700, color: dark ? "#fff" : "#1a1614",
  background: dark ? "rgba(255,255,255,0.08)" : "#fff", border: dark ? "1px solid rgba(255,255,255,0.2)" : "2px solid var(--border)",
  borderRadius: 999, boxShadow: dark ? "none" : "3px 3px 0 var(--border)", padding: "9px 18px", cursor: "pointer",
});
