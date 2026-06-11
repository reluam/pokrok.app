"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type Lang = "cs" | "en";
type Word = { id: number; display: string };
type Stats = { words: number; edges: number; total: number; goal: number };
type MapData = {
  total: number; goal: number;
  nodes: { id: number; label: string; seed: boolean }[];
  edges: { a: number; b: number; count: number }[]; // a → b
  truncated: boolean;
};
type Mode = "menu" | "explorer" | "researcher";

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const sans: React.CSSProperties = { fontFamily: "var(--font-sans)" };

const T = {
  cs: {
    back: "← Spaghetti.ltd",
    menu: "← zpět na výběr",
    title: "Veřejný mozek",
    tagline: "Slovo, asociace, synapse. Jeden mozek složený ze všech, kdo sem přijdou.",
    intro: "Dostaneš slovo a napíšeš první věc, která tě napadne. Když stejnou asociaci napíše víc lidí, synapse mezi slovy zesílí — a z odpovědí pomalu roste mapa toho, jak dohromady myslíme.",
    explorerTitle: "Explorer",
    explorerDesc: "Dostaneš slovo. Napíšeš, co tě napadne. Vteřina práce a mozek o kousek povyroste.",
    explorerCta: "Jdu přemýšlet →",
    researcherTitle: "Researcher",
    researcherDesc: "Prohlédni si mapu synapsí — která slova k sobě lidem srostla nejsilněji.",
    researcherCta: "Ukaž mapu →",
    stats: (s: Stats) => `${s.words.toLocaleString("cs-CZ")} slov · ${s.edges.toLocaleString("cs-CZ")} synapsí · ${s.total.toLocaleString("cs-CZ")} asociací`,
    prompt: "Co se ti vybaví, když se řekne…",
    placeholder: "první věc, co tě napadne",
    send: "Uložit →",
    savedNew: (a: string, b: string) => `${a} → ${b} · nová synapse ✨`,
    savedAgain: (a: string, b: string, n: number) => `${a} → ${b} · synapse posílena ×${n}`,
    afterSave: "Přidej další asociaci na stejné slovo — nebo pokračuj dál.",
    chain: (w: string) => `↪ asociuj dál na „${w}“`,
    dice: "🎲 Nové slovo",
    mine: (n: number) => `tvých asociací dnes: ${n}`,
    errInvalid: "Tohle mozek nepobral — zkus 1–3 slova, max 40 znaků.",
    errSame: "Slovo se nemůže asociovat samo na sebe, to by byla smyčka.",
    errNet: "Nepovedlo se uložit. Zkus to znovu.",
    toMap: "🔬 Mrknout na mapu →",
    loadingWord: "Mozek hledá slovo…",
    gateTitle: "Mozek se ještě rodí",
    gateText: (t: number, goal: number) => `Zatím nasbíral ${t.toLocaleString("cs-CZ")} z ${goal.toLocaleString("cs-CZ")} asociací, které potřebuje, aby mapa začala něco říkat.`,
    gateGo: "→ Pomoz mu růst jako Explorer",
    gateAnyway: "Stejně mi ukaž ten nicneříkající zárodek →",
    mapLoading: "Nahrávám mozek…",
    mapEmpty: "Mozek je zatím úplně prázdný. Buď první synapse!",
    mapHint: "táhni = posun · kolečko / pinch = zoom · klik na slovo = detail",
    mapLegend: "tloušťka nudle = síla synapse",
    truncated: "Zobrazuju jen ~600 nejsilnějších synapsí.",
    outLabel: "kam vede →",
    inLabel: "→ co vede sem",
    associateThis: "✏️ Asociuj na tohle slovo",
    nothing: "zatím nic",
  },
  en: {
    back: "← Spaghetti.ltd",
    menu: "← back to modes",
    title: "The Public Brain",
    tagline: "A word, an association, a synapse. One brain made of everyone who drops by.",
    intro: "You get a word and write the first thing that comes to mind. When more people write the same association, the synapse between the words grows stronger — and a map of how we think together slowly emerges.",
    explorerTitle: "Explorer",
    explorerDesc: "You get a word. You write what comes to mind. A second of work and the brain grows a little.",
    explorerCta: "Start thinking →",
    researcherTitle: "Researcher",
    researcherDesc: "Browse the map of synapses — which words have grown together the strongest.",
    researcherCta: "Show the map →",
    stats: (s: Stats) => `${s.words.toLocaleString("en-GB")} words · ${s.edges.toLocaleString("en-GB")} synapses · ${s.total.toLocaleString("en-GB")} associations`,
    prompt: "What comes to mind when you hear…",
    placeholder: "the first thing you think of",
    send: "Save →",
    savedNew: (a: string, b: string) => `${a} → ${b} · new synapse ✨`,
    savedAgain: (a: string, b: string, n: number) => `${a} → ${b} · synapse strengthened ×${n}`,
    afterSave: "Add another association to the same word — or move on.",
    chain: (w: string) => `↪ associate onto “${w}”`,
    dice: "🎲 New word",
    mine: (n: number) => `your associations today: ${n}`,
    errInvalid: "The brain couldn't digest that — try 1–3 words, max 40 characters.",
    errSame: "A word can't associate with itself, that would be a loop.",
    errNet: "Saving failed. Try again.",
    toMap: "🔬 Peek at the map →",
    loadingWord: "The brain is picking a word…",
    gateTitle: "The brain is still being born",
    gateText: (t: number, goal: number) => `So far it has ${t.toLocaleString("en-GB")} of the ${goal.toLocaleString("en-GB")} associations it needs before the map starts to mean anything.`,
    gateGo: "→ Help it grow as an Explorer",
    gateAnyway: "Show me the meaningless embryo anyway →",
    mapLoading: "Loading the brain…",
    mapEmpty: "The brain is completely empty so far. Be the first synapse!",
    mapHint: "drag = pan · wheel / pinch = zoom · click a word = detail",
    mapLegend: "noodle thickness = synapse strength",
    truncated: "Showing only the ~600 strongest synapses.",
    outLabel: "leads to →",
    inLabel: "→ comes from",
    associateThis: "✏️ Associate on this word",
    nothing: "nothing yet",
  },
} as const;

/* ════════════════════════════════════════════════════════════════
   Hlavní aplikace
   ════════════════════════════════════════════════════════════════ */
export function BrainApp({ lang }: { lang: Lang }) {
  const t = T[lang];
  const [mode, setMode] = useState<Mode>("menu");
  const [stats, setStats] = useState<Stats | null>(null);

  // Explorer
  const [word, setWord] = useState<Word | null>(null);
  const [input, setInput] = useState("");
  const [last, setLast] = useState<{ from: string; to: Word; count: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [mine, setMine] = useState(0);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Researcher
  const [map, setMap] = useState<MapData | null>(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [forced, setForced] = useState(false);

  useEffect(() => {
    fetch("/api/brain/stats").then((r) => r.ok ? r.json() : null).then((s) => s && setStats(s)).catch(() => {});
  }, []);

  const fetchWord = async (notId?: number) => {
    setWord(null); setErr(null);
    try {
      const r = await fetch(`/api/brain/word${notId ? `?not=${notId}` : ""}`);
      const j = await r.json();
      if (j.word) setWord(j.word);
    } catch { setErr(t.errNet); }
  };

  const enterExplorer = (w?: Word) => {
    setMode("explorer"); setLast(null); setErr(null); setInput("");
    if (w) setWord(w); else fetchWord(word?.id);
  };

  const enterResearcher = () => {
    setMode("researcher"); setForced(false); setMapLoading(true); setMap(null);
    fetch("/api/brain/map").then((r) => r.ok ? r.json() : null)
      .then((m) => { if (m) setMap(m); })
      .catch(() => {})
      .finally(() => setMapLoading(false));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word || !input.trim() || busy) return;
    setBusy(true); setErr(null);
    try {
      const r = await fetch("/api/brain/associate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: word.id, to: input }),
      });
      const j = await r.json();
      if (j.ok) {
        setLast({ from: word.display, to: j.to, count: j.count });
        setMine((m) => m + 1);
        setInput("");
        setStats((s) => s ? { ...s, total: j.total } : s);
        inputRef.current?.focus();
      } else {
        setErr(j.error === "same" ? t.errSame : t.errInvalid);
      }
    } catch { setErr(t.errNet); }
    setBusy(false);
  };

  /* ── Menu ─────────────────────────────────────────────────────── */
  if (mode === "menu") {
    return (
      <main style={{ minHeight: "100dvh", background: "var(--bg)", padding: "64px 24px 80px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <Link href="/" style={{ ...sans, fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>{t.back}</Link>
          <h1 style={{ ...display, fontSize: "clamp(36px,7vw,56px)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, margin: "18px 0 10px" }}>🧠 {t.title}</h1>
          <p style={{ ...display, fontStyle: "italic", fontSize: 18, margin: "0 0 10px", color: "var(--text-primary)" }}>{t.tagline}</p>
          <p style={{ ...sans, fontSize: 14.5, color: "var(--text-secondary)", lineHeight: 1.65, margin: 0, maxWidth: 560 }}>{t.intro}</p>
          {stats && (
            <p style={{ ...sans, fontSize: 12, color: "var(--text-muted)", margin: "14px 0 0", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {t.stats(stats)}
            </p>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18, marginTop: 36 }}>
            <button onClick={() => enterExplorer()} className="brain-card" style={{
              textAlign: "left", cursor: "pointer", background: "#FCE7F3",
              border: "2.5px solid var(--border)", borderRadius: 20, boxShadow: "5px 5px 0 var(--shadow)",
              padding: "26px 26px 22px", display: "flex", flexDirection: "column", gap: 10,
              color: "var(--text-primary)", transition: "transform 140ms ease, box-shadow 140ms ease",
            }}>
              <span style={{ fontSize: 34, lineHeight: 1 }}>🧭</span>
              <span style={{ ...display, fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>{t.explorerTitle}</span>
              <span style={{ ...sans, fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.55 }}>{t.explorerDesc}</span>
              <span style={{ ...sans, fontSize: 13, fontWeight: 700 }}>{t.explorerCta}</span>
            </button>

            <button onClick={enterResearcher} className="brain-card" style={{
              textAlign: "left", cursor: "pointer", background: "#E0F2FE",
              border: "2.5px solid var(--border)", borderRadius: 20, boxShadow: "5px 5px 0 var(--shadow)",
              padding: "26px 26px 22px", display: "flex", flexDirection: "column", gap: 10,
              color: "var(--text-primary)", transition: "transform 140ms ease, box-shadow 140ms ease",
            }}>
              <span style={{ fontSize: 34, lineHeight: 1 }}>🔬</span>
              <span style={{ ...display, fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>{t.researcherTitle}</span>
              <span style={{ ...sans, fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.55 }}>{t.researcherDesc}</span>
              <span style={{ ...sans, fontSize: 13, fontWeight: 700 }}>{t.researcherCta}</span>
            </button>
          </div>
        </div>
        <style>{`.brain-card:hover { transform: translate(-2px,-2px); box-shadow: 7px 7px 0 var(--shadow); }`}</style>
      </main>
    );
  }

  /* ── Explorer ─────────────────────────────────────────────────── */
  if (mode === "explorer") {
    return (
      <main style={{ minHeight: "100dvh", background: "var(--bg)", padding: "64px 24px 80px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
            <button onClick={() => setMode("menu")} style={{ ...sans, fontSize: 13, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>{t.menu}</button>
            <span style={{ ...sans, fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.2em" }}>🧭 {t.explorerTitle}</span>
          </div>

          <div style={{
            marginTop: 32, background: "#fff", border: "2.5px solid var(--border)", borderRadius: 24,
            boxShadow: "6px 6px 0 var(--shadow)", padding: "36px 32px",
          }}>
            <p style={{ ...sans, fontSize: 13, color: "var(--text-muted)", margin: 0 }}>{t.prompt}</p>
            <p style={{ ...display, fontSize: "clamp(34px,7vw,52px)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1, margin: "10px 0 22px", minHeight: "1.1em" }}>
              {word ? word.display : <span style={{ opacity: 0.35, fontSize: 18, ...sans, fontWeight: 400 }}>{t.loadingWord}</span>}
            </p>

            <form onSubmit={submit} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => { setInput(e.target.value); setErr(null); }}
                placeholder={t.placeholder}
                autoFocus
                maxLength={60}
                style={{
                  flex: 1, minWidth: 200, background: "var(--bg)", border: "2px solid var(--border)",
                  borderRadius: 12, padding: "13px 16px", ...sans, fontSize: 16,
                  color: "var(--text-primary)", outline: "none",
                }}
              />
              <button type="submit" disabled={!word || !input.trim() || busy} style={{
                background: "var(--text-primary)", color: "var(--bg)", border: "2.5px solid var(--text-primary)",
                borderRadius: 12, boxShadow: "4px 4px 0 var(--text-primary)", padding: "12px 22px",
                ...sans, fontSize: 14, fontWeight: 700, cursor: "pointer",
                opacity: (!word || !input.trim() || busy) ? 0.4 : 1,
              }}>{t.send}</button>
            </form>

            {err && <p style={{ ...sans, fontSize: 13, color: "#b91c1c", margin: "12px 0 0" }}>{err}</p>}

            {last && !err && (
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1.5px dashed rgba(26,22,20,0.2)" }}>
                <p style={{ ...sans, fontSize: 14, fontWeight: 600, margin: 0 }}>
                  {last.count > 1 ? t.savedAgain(last.from, last.to.display, last.count) : t.savedNew(last.from, last.to.display)}
                </p>
                <p style={{ ...sans, fontSize: 12.5, color: "var(--text-muted)", margin: "6px 0 0" }}>{t.afterSave}</p>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 22, flexWrap: "wrap" }}>
              {last && (
                <button onClick={() => { setWord(last.to); setLast(null); setErr(null); inputRef.current?.focus(); }} style={{
                  background: "#FCE7F3", border: "2px solid var(--border)", borderRadius: 999,
                  padding: "8px 16px", ...sans, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "var(--text-primary)",
                }}>{t.chain(last.to.display)}</button>
              )}
              <button onClick={() => { setLast(null); fetchWord(word?.id); inputRef.current?.focus(); }} style={{
                background: "#fff", border: "2px solid var(--border)", borderRadius: 999,
                padding: "8px 16px", ...sans, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "var(--text-primary)",
              }}>{t.dice}</button>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18, gap: 12, flexWrap: "wrap" }}>
            <span style={{ ...sans, fontSize: 12, color: "var(--text-muted)" }}>{mine > 0 ? t.mine(mine) : stats ? t.stats(stats) : ""}</span>
            <button onClick={enterResearcher} style={{ ...sans, fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>{t.toMap}</button>
          </div>
        </div>
      </main>
    );
  }

  /* ── Researcher ───────────────────────────────────────────────── */
  const gated = map !== null && map.total < map.goal && !forced;

  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      {mapLoading && (
        <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ ...sans, fontSize: 15, color: "var(--text-muted)" }}>{t.mapLoading}</p>
        </div>
      )}

      {!mapLoading && gated && map && (
        <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{
            maxWidth: 480, width: "100%", background: "#fff", border: "2.5px solid var(--border)",
            borderRadius: 24, boxShadow: "6px 6px 0 var(--shadow)", padding: "38px 34px", textAlign: "center",
          }}>
            <span style={{ fontSize: 44, display: "block", marginBottom: 12 }}>🐣</span>
            <h1 style={{ ...display, fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 10px" }}>{t.gateTitle}</h1>
            <p style={{ ...sans, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 18px" }}>
              {t.gateText(map.total, map.goal)}
            </p>
            <div style={{ background: "var(--bg)", border: "2px solid var(--border)", borderRadius: 999, height: 18, overflow: "hidden", marginBottom: 24 }}>
              <div style={{ width: `${Math.max(1.5, Math.min(100, (map.total / map.goal) * 100))}%`, height: "100%", background: "#FCE7F3", borderRight: "2px solid var(--border)" }} />
            </div>
            <button onClick={() => enterExplorer()} style={{
              display: "block", width: "100%", background: "var(--text-primary)", color: "var(--bg)",
              border: "2.5px solid var(--text-primary)", borderRadius: 12, boxShadow: "4px 4px 0 var(--text-primary)",
              padding: "13px 18px", ...sans, fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 14,
            }}>{t.gateGo}</button>
            <button onClick={() => setForced(true)} style={{
              background: "none", border: "none", ...sans, fontSize: 12.5, color: "var(--text-muted)",
              cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "3px", padding: 0,
            }}>{t.gateAnyway}</button>
            <p style={{ marginTop: 20 }}>
              <button onClick={() => setMode("menu")} style={{ ...sans, fontSize: 12, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>{t.menu}</button>
            </p>
          </div>
        </div>
      )}

      {!mapLoading && !gated && map && (
        map.edges.length === 0 ? (
          <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24 }}>
            <p style={{ ...sans, fontSize: 15, color: "var(--text-secondary)" }}>{t.mapEmpty}</p>
            <button onClick={() => enterExplorer()} style={{
              background: "var(--text-primary)", color: "var(--bg)", border: "2.5px solid var(--text-primary)",
              borderRadius: 12, boxShadow: "4px 4px 0 var(--text-primary)", padding: "12px 20px",
              ...sans, fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}>{t.gateGo}</button>
          </div>
        ) : (
          <BrainMap data={map} lang={lang} onMenu={() => setMode("menu")} onAssociate={(w) => enterExplorer(w)} />
        )
      )}

      {!mapLoading && !map && (
        <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
          <p style={{ ...sans, fontSize: 14, color: "#b91c1c" }}>{t.errNet}</p>
          <button onClick={enterResearcher} style={{ ...sans, fontSize: 13, fontWeight: 600, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>↻</button>
          <button onClick={() => setMode("menu")} style={{ ...sans, fontSize: 12, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>{t.menu}</button>
        </div>
      )}
    </main>
  );
}

/* ════════════════════════════════════════════════════════════════
   Mapa mozku — force layout na canvasu, nudlové synapse.
   Tloušťka a sytost nudle = síla synapse (count).
   ════════════════════════════════════════════════════════════════ */
type SimNode = { id: number; label: string; seed: boolean; strength: number; x: number; y: number; vx: number; vy: number; r: number };
type SimEdge = { a: number; b: number; count: number };
type View = { scale: number; tx: number; ty: number };

// Deterministický pseudo-random z id (ať mapa po reloadu vypadá stejně).
function hash01(n: number, salt = 0): number {
  let x = (n + salt * 7919 + 1) * 2654435761;
  x = (x ^ (x >>> 16)) * 2246822519;
  x = (x ^ (x >>> 13)) * 3266489917;
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}

function buildSim(data: MapData): { nodes: SimNode[]; edges: SimEdge[]; maxCount: number; maxStrength: number } {
  const idx = new Map<number, number>();
  const nodes: SimNode[] = data.nodes.map((n, i) => {
    idx.set(n.id, i);
    return { id: n.id, label: n.label, seed: n.seed, strength: 0, x: 0, y: 0, vx: 0, vy: 0, r: 4 };
  });
  const edges: SimEdge[] = [];
  let maxCount = 1;
  for (const e of data.edges) {
    const a = idx.get(e.a), b = idx.get(e.b);
    if (a === undefined || b === undefined) continue;
    edges.push({ a, b, count: e.count });
    nodes[a].strength += e.count;
    nodes[b].strength += e.count;
    if (e.count > maxCount) maxCount = e.count;
  }
  const maxStrength = Math.max(1, ...nodes.map((n) => n.strength));
  const spread = 60 * Math.sqrt(nodes.length);
  nodes.forEach((n) => {
    const a = hash01(n.id) * Math.PI * 2;
    const r = 40 + hash01(n.id, 1) * spread;
    n.x = Math.cos(a) * r;
    n.y = Math.sin(a) * r;
    n.r = 3.5 + 9 * Math.sqrt(n.strength / maxStrength);
  });
  return { nodes, edges, maxCount, maxStrength };
}

function runSim(nodes: SimNode[], edges: SimEdge[], maxCount: number, ticks = 300) {
  for (let tick = 0; tick < ticks; tick++) {
    // odpuzování všech od všech
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        let dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > 160000) continue; // > 400 px — neřeš
        const d = Math.sqrt(d2) || 0.01;
        const f = 2200 / (d2 + 100);
        dx /= d; dy /= d;
        a.vx += dx * f; a.vy += dy * f;
        b.vx -= dx * f; b.vy -= dy * f;
      }
    }
    // pružiny podél synapsí — silné synapse táhnou slova k sobě
    for (const e of edges) {
      const a = nodes[e.a], b = nodes[e.b];
      const norm = Math.sqrt(e.count / maxCount);
      const rest = 46 + 120 * (1 - norm);
      let dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 0.01;
      const f = (d - rest) * 0.006 * (0.5 + norm);
      dx /= d; dy /= d;
      a.vx += dx * f * d * 0.1; a.vy += dy * f * d * 0.1;
      b.vx -= dx * f * d * 0.1; b.vy -= dy * f * d * 0.1;
    }
    // gravitace ke středu (drží oddělené ostrůvky pohromadě)
    for (const n of nodes) {
      n.vx -= n.x * 0.004;
      n.vy -= n.y * 0.004;
      n.vx *= 0.85; n.vy *= 0.85;
      n.x += n.vx; n.y += n.vy;
    }
  }
}

function BrainMap({ data, lang, onMenu, onAssociate }: { data: MapData; lang: Lang; onMenu: () => void; onAssociate: (w: Word) => void }) {
  const t = T[lang];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selected, setSelected] = useState<{ id: number; label: string } | null>(null);
  const selRef = useRef<number | null>(null);
  const drawRef = useRef<() => void>(() => {});

  useEffect(() => {
    selRef.current = selected?.id ?? null;
    drawRef.current();
  }, [selected]);

  // Detail vybraného slova: nejsilnější odchozí a příchozí synapse.
  const detail = useMemo(() => {
    if (!selected) return null;
    const labelOf = new Map(data.nodes.map((n) => [n.id, n.label]));
    const out = data.edges.filter((e) => e.a === selected.id)
      .sort((x, y) => y.count - x.count).slice(0, 8)
      .map((e) => ({ id: e.b, label: labelOf.get(e.b) ?? "?", count: e.count }));
    const inn = data.edges.filter((e) => e.b === selected.id)
      .sort((x, y) => y.count - x.count).slice(0, 8)
      .map((e) => ({ id: e.a, label: labelOf.get(e.a) ?? "?", count: e.count }));
    return { out, inn };
  }, [selected, data]);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const { nodes, edges, maxCount, maxStrength } = buildSim(data);
    runSim(nodes, edges, maxCount);

    // slova s vždy viditelným popiskem (top podle síly)
    const labeled = new Set([...nodes].sort((a, b) => b.strength - a.strength).slice(0, 36).map((n) => n.id));

    const view: View = { scale: 1, tx: 0, ty: 0 };
    let hovered: SimNode | null = null;

    const fit = () => {
      const w = cv.clientWidth, h = cv.clientHeight;
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const n of nodes) {
        minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x);
        minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y);
      }
      const bw = Math.max(120, maxX - minX), bh = Math.max(120, maxY - minY);
      view.scale = Math.max(0.18, Math.min(1.6, Math.min(w / (bw + 160), h / (bh + 160))));
      view.tx = w / 2 - ((minX + maxX) / 2) * view.scale;
      view.ty = h / 2 - ((minY + maxY) / 2) * view.scale;
    };

    const adj = (id: number) => edges.filter((e) => nodes[e.a].id === id || nodes[e.b].id === id);

    const draw = () => {
      const w = cv.clientWidth, h = cv.clientHeight;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const g = ctx.createRadialGradient(w * 0.35, h * 0.3, 0, w * 0.35, h * 0.3, Math.max(w, h));
      g.addColorStop(0, "#fffdf6"); g.addColorStop(0.75, "#f1ece0");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

      ctx.setTransform(dpr * view.scale, 0, 0, dpr * view.scale, dpr * view.tx, dpr * view.ty);

      const selId = selRef.current;
      const hotId = hovered?.id ?? selId;

      // nudle (synapse)
      for (const e of edges) {
        const a = nodes[e.a], b = nodes[e.b];
        const norm = Math.sqrt(e.count / maxCount);
        const isOut = hotId !== null && a.id === hotId;
        const isIn = hotId !== null && b.id === hotId;
        const hot = isOut || isIn;
        if (hot) {
          // směr: odchozí teplá, příchozí chladná
          ctx.strokeStyle = isOut ? "rgba(180, 83, 9, 0.92)" : "rgba(71, 85, 105, 0.85)";
        } else {
          ctx.strokeStyle = `rgba(176, 124, 24, ${hotId !== null ? 0.07 + 0.1 * norm : 0.16 + 0.4 * norm})`;
        }
        ctx.lineWidth = (0.8 + 4.2 * norm) * (hot ? 1.25 : 1);
        ctx.lineCap = "round";
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        const side = (e.a + e.b) % 2 === 0 ? 1 : -1;
        const bow = Math.min(26, d * 0.14) * side;
        const px = -(b.y - a.y) / d, py = (b.x - a.x) / d;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(mx + px * bow, my + py * bow, b.x, b.y);
        ctx.stroke();
      }

      // slova (uzly)
      const neighborIds = new Set<number>();
      if (hotId !== null) {
        for (const e of edges) {
          if (nodes[e.a].id === hotId) neighborIds.add(nodes[e.b].id);
          if (nodes[e.b].id === hotId) neighborIds.add(nodes[e.a].id);
        }
      }
      for (const n of nodes) {
        const hot = n.id === hotId;
        const dim = hotId !== null && !hot && !neighborIds.has(n.id);
        ctx.globalAlpha = hot ? 1 : dim ? 0.25 : 0.88;
        ctx.fillStyle = "#1a1614";
        ctx.beginPath(); ctx.arc(n.x, n.y, hot ? n.r + 2 : n.r, 0, 7); ctx.fill();
        if (n.seed) {
          ctx.strokeStyle = "rgba(176, 124, 24, 0.85)"; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.arc(n.x, n.y, (hot ? n.r + 2 : n.r) + 2.4, 0, 7); ctx.stroke();
        }
        const showLabel = hot || neighborIds.has(n.id) || (labeled.has(n.id) && (hotId === null || !dim));
        if (showLabel) {
          ctx.globalAlpha = hot ? 1 : 0.78;
          ctx.font = `${hot ? 700 : 500} 11px ${getComputedStyle(document.body).fontFamily || "system-ui"}`;
          ctx.textAlign = "center";
          ctx.fillText(n.label, n.x, n.y + n.r + 14);
        }
        ctx.globalAlpha = 1;
      }
    };
    drawRef.current = draw;

    const resize = () => {
      cv.width = cv.clientWidth * dpr;
      cv.height = cv.clientHeight * dpr;
      fit(); draw();
    };
    resize();
    window.addEventListener("resize", resize);

    const toWorld = (sx: number, sy: number) => ({ x: (sx - view.tx) / view.scale, y: (sy - view.ty) / view.scale });
    const pick = (sx: number, sy: number): SimNode | null => {
      const p = toWorld(sx, sy);
      let best: SimNode | null = null, bestD = Infinity;
      for (const n of nodes) {
        const d = Math.hypot(n.x - p.x, n.y - p.y);
        if (d < Math.max(14 / view.scale, n.r + 8) && d < bestD) { best = n; bestD = d; }
      }
      return best;
    };

    // pan + zoom + pinch + klik
    const pointers = new Map<number, { x: number; y: number }>();
    let panStart: { x: number; y: number; tx: number; ty: number } | null = null;
    let moved = 0;
    let pinchDist = 0;

    const rect = () => cv.getBoundingClientRect();

    const onDown = (e: PointerEvent) => {
      cv.setPointerCapture(e.pointerId);
      const r = rect();
      pointers.set(e.pointerId, { x: e.clientX - r.left, y: e.clientY - r.top });
      if (pointers.size === 1) {
        panStart = { x: e.clientX - r.left, y: e.clientY - r.top, tx: view.tx, ty: view.ty };
        moved = 0;
      } else if (pointers.size === 2) {
        const [p1, p2] = [...pointers.values()];
        pinchDist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        panStart = null;
      }
    };
    const onMove = (e: PointerEvent) => {
      const r = rect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x, y });

      if (pointers.size === 2) {
        const [p1, p2] = [...pointers.values()];
        const d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        if (pinchDist > 0) {
          const cx = (p1.x + p2.x) / 2, cy = (p1.y + p2.y) / 2;
          zoomAt(cx, cy, d / pinchDist);
        }
        pinchDist = d;
        return;
      }
      if (panStart && pointers.size === 1) {
        const dx = x - panStart.x, dy = y - panStart.y;
        moved = Math.max(moved, Math.hypot(dx, dy));
        if (moved > 4) {
          view.tx = panStart.tx + dx; view.ty = panStart.ty + dy;
          draw();
        }
        return;
      }
      // hover (myš bez stisknutí)
      if (pointers.size === 0) {
        const p = pick(x, y);
        if (p !== hovered) { hovered = p; cv.style.cursor = p ? "pointer" : "grab"; draw(); }
      }
    };
    const onUp = (e: PointerEvent) => {
      const r = rect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const wasSingle = pointers.size === 1;
      pointers.delete(e.pointerId);
      pinchDist = 0;
      if (wasSingle && moved <= 4) {
        const p = pick(x, y);
        setSelected(p ? { id: p.id, label: p.label } : null);
      }
      panStart = null;
    };
    const zoomAt = (cx: number, cy: number, factor: number) => {
      const ns = Math.max(0.12, Math.min(6, view.scale * factor));
      const k = ns / view.scale;
      view.tx = cx - (cx - view.tx) * k;
      view.ty = cy - (cy - view.ty) * k;
      view.scale = ns;
      draw();
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = rect();
      zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.0014));
    };

    cv.addEventListener("pointerdown", onDown);
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerup", onUp);
    cv.addEventListener("pointercancel", onUp);
    cv.addEventListener("wheel", onWheel, { passive: false });
    cv.style.cursor = "grab";

    return () => {
      window.removeEventListener("resize", resize);
      cv.removeEventListener("pointerdown", onDown);
      cv.removeEventListener("pointermove", onMove);
      cv.removeEventListener("pointerup", onUp);
      cv.removeEventListener("pointercancel", onUp);
      cv.removeEventListener("wheel", onWheel);
    };
  }, [data]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#f1ece0" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block", touchAction: "none" }} />

      {/* horní lišta */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, padding: "14px 18px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
        pointerEvents: "none",
      }}>
        <button onClick={onMenu} style={{
          pointerEvents: "auto", background: "#fff", border: "2px solid var(--border)", borderRadius: 999,
          padding: "7px 14px", ...sans, fontSize: 12.5, fontWeight: 600, cursor: "pointer", color: "var(--text-primary)",
          boxShadow: "3px 3px 0 var(--shadow)",
        }}>{t.menu}</button>
        <div style={{ textAlign: "right" }}>
          <p style={{ ...display, fontSize: 16, fontWeight: 700, margin: 0 }}>🧠 {t.title} · 🔬 {t.researcherTitle}</p>
          <p style={{ ...sans, fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0" }}>
            {t.mapLegend}{data.truncated ? ` · ${t.truncated}` : ""}
          </p>
        </div>
      </div>

      {/* nápověda dole */}
      <p style={{
        position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
        ...sans, fontSize: 11, color: "var(--text-muted)", margin: 0, whiteSpace: "nowrap",
      }}>{t.mapHint}</p>

      {/* detail slova */}
      {selected && detail && (
        <div style={{
          position: "absolute", top: 70, right: 16, width: 240, maxHeight: "calc(100dvh - 140px)", overflowY: "auto",
          background: "#fff", border: "2.5px solid var(--border)", borderRadius: 16,
          boxShadow: "5px 5px 0 var(--shadow)", padding: "16px 18px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
            <p style={{ ...display, fontSize: 19, fontWeight: 700, margin: 0, wordBreak: "break-word" }}>{selected.label}</p>
            <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", ...sans, fontSize: 14, color: "var(--text-muted)", padding: 0 }}>×</button>
          </div>

          <p style={{ ...sans, fontSize: 10.5, color: "#b45309", textTransform: "uppercase", letterSpacing: "0.08em", margin: "14px 0 6px" }}>{t.outLabel}</p>
          {detail.out.length === 0 && <p style={{ ...sans, fontSize: 12, color: "var(--text-muted)", margin: 0 }}>{t.nothing}</p>}
          {detail.out.map((o) => (
            <div key={`o${o.id}`} style={{ display: "flex", justifyContent: "space-between", gap: 8, ...sans, fontSize: 13, padding: "2px 0" }}>
              <span style={{ wordBreak: "break-word" }}>{o.label}</span>
              <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>×{o.count}</span>
            </div>
          ))}

          <p style={{ ...sans, fontSize: 10.5, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", margin: "14px 0 6px" }}>{t.inLabel}</p>
          {detail.inn.length === 0 && <p style={{ ...sans, fontSize: 12, color: "var(--text-muted)", margin: 0 }}>{t.nothing}</p>}
          {detail.inn.map((o) => (
            <div key={`i${o.id}`} style={{ display: "flex", justifyContent: "space-between", gap: 8, ...sans, fontSize: 13, padding: "2px 0" }}>
              <span style={{ wordBreak: "break-word" }}>{o.label}</span>
              <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>×{o.count}</span>
            </div>
          ))}

          <button onClick={() => onAssociate({ id: selected.id, display: selected.label })} style={{
            marginTop: 16, width: "100%", background: "#FCE7F3", border: "2px solid var(--border)",
            borderRadius: 10, padding: "9px 12px", ...sans, fontSize: 12.5, fontWeight: 700,
            cursor: "pointer", color: "var(--text-primary)",
          }}>{t.associateThis}</button>
        </div>
      )}
    </div>
  );
}
