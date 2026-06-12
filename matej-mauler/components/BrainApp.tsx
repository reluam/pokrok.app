"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { track } from "@/lib/track";
import Link from "next/link";

type Lang = "cs" | "en";
type Word = { id: number; display: string };
type Stats = { words: number; edges: number; total: number; goal: number };
type MapData = {
  total: number; goal: number;
  nodes: { id: number; label: string; seed: boolean; pos: string | null }[];
  edges: { a: number; b: number; count: number }[]; // a → b
  truncated: boolean;
};
type Mode = "explore" | "gate" | "map";

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const sans: React.CSSProperties = { fontFamily: "var(--font-sans)" };

const T = {
  cs: {
    back: "← Spaghetti.ltd",
    backToAssoc: "← zpět k asociacím",
    title: "Synapse",
    tagline: "Slovo, asociace, synapse. Jedna síť složená ze všech, kdo sem přijdou.",
    stats: (s: Stats) => `${s.words.toLocaleString("cs-CZ")} slov · ${s.edges.toLocaleString("cs-CZ")} synapsí · ${s.total.toLocaleString("cs-CZ")} asociací`,
    prompt: "Co se ti vybaví, když se řekne…",
    placeholder: "první věc, co tě napadne",
    send: "Potvrdit ⏎",
    savedNew: (a: string, b: string) => `${a} → ${b} · nová synapse ✨`,
    savedAgain: (a: string, b: string, n: number) => `${a} → ${b} · synapse posílena ×${n}`,
    afterSave: "Uloženo. Tady je další náhodné slovo.",
    dice: "🎲 Jiné slovo",
    researcher: "🔬 Prozkoumat mapu jako Researcher →",
    mine: (n: number) => `tvých asociací dnes: ${n}`,
    errInvalid: "Tohle síť nepobrala — zkus 1–3 slova, max 40 znaků.",
    errSame: "Slovo se nemůže asociovat samo na sebe, to by byla smyčka.",
    errNet: "Nepovedlo se uložit. Zkus to znovu.",
    loadingWord: "Síť hledá slovo…",
    gateTitle: "Síť se ještě rodí",
    gateText: (t: number, goal: number) => `Zatím nasbírala ${t.toLocaleString("cs-CZ")} z ${goal.toLocaleString("cs-CZ")} asociací, které potřebuje, aby mapa začala něco říkat.`,
    gateGo: "→ Pomoz jí růst asociacemi",
    gateAnyway: "Stejně mi ukaž ten nicneříkající zárodek →",
    mapEmpty: "Síť je zatím úplně prázdná. Buď první synapse!",
    mapHint: "táhni = posun · kolečko / pinch = zoom · klik na slovo = detail a zoom",
    mapLegend: "tloušťka nudle = síla synapse",
    legendBall: "kulička = tok informací ve směru převahy asociací",
    legendSeed: "kroužek = startovní slovo",
    legendColor: "u vybraného slova: oranžová = ven · šedomodrá = dovnitř",
    legendPos: "barva slova = slovní druh: modrá podst. jm. · červená sloveso · fialová příd. jm. · zelená příslovce · šedá ostatní",
    wordTip: (o: number, os: number, i: number, is_: number) => `${o} ven (×${os}) · ${i} dovnitř (×${is_})`,
    truncated: "Zobrazuju jen ~600 nejsilnějších synapsí.",
    outLabel: "kam vede →",
    inLabel: "→ co vede sem",
    associateThis: "✏️ Asociuj na tohle slovo",
    nothing: "zatím nic",
  },
  en: {
    back: "← Spaghetti.ltd",
    backToAssoc: "← back to associating",
    title: "Synapses",
    tagline: "A word, an association, a synapse. One network made of everyone who drops by.",
    stats: (s: Stats) => `${s.words.toLocaleString("en-GB")} words · ${s.edges.toLocaleString("en-GB")} synapses · ${s.total.toLocaleString("en-GB")} associations`,
    prompt: "What comes to mind when you hear…",
    placeholder: "the first thing you think of",
    send: "Confirm ⏎",
    savedNew: (a: string, b: string) => `${a} → ${b} · new synapse ✨`,
    savedAgain: (a: string, b: string, n: number) => `${a} → ${b} · synapse strengthened ×${n}`,
    afterSave: "Saved. Here's another random word.",
    dice: "🎲 Different word",
    researcher: "🔬 Explore the map as a Researcher →",
    mine: (n: number) => `your associations today: ${n}`,
    errInvalid: "The network couldn't digest that — try 1–3 words, max 40 characters.",
    errSame: "A word can't associate with itself, that would be a loop.",
    errNet: "Saving failed. Try again.",
    loadingWord: "The network is picking a word…",
    gateTitle: "The network is still being born",
    gateText: (t: number, goal: number) => `So far it has ${t.toLocaleString("en-GB")} of the ${goal.toLocaleString("en-GB")} associations it needs before the map starts to mean anything.`,
    gateGo: "→ Help it grow with associations",
    gateAnyway: "Show me the meaningless embryo anyway →",
    mapEmpty: "The network is completely empty so far. Be the first synapse!",
    mapHint: "drag = pan · wheel / pinch = zoom · click a word = detail & zoom",
    mapLegend: "noodle thickness = synapse strength",
    legendBall: "ball = information flowing in the dominant direction",
    legendSeed: "ring = seed word",
    legendColor: "for a selected word: orange = outgoing · slate = incoming",
    legendPos: "word colour = part of speech: blue noun · red verb · violet adjective · green adverb · grey other",
    wordTip: (o: number, os: number, i: number, is_: number) => `${o} out (×${os}) · ${i} in (×${is_})`,
    truncated: "Showing only the ~600 strongest synapses.",
    outLabel: "leads to →",
    inLabel: "→ comes from",
    associateThis: "✏️ Associate on this word",
    nothing: "nothing yet",
  },
} as const;

/* ════════════════════════════════════════════════════════════════
   Synapse — stejný kabát jako encyklopedie: žádné modály,
   mapa žije na pozadí (rozmazaná tak, ať slova nejdou přečíst)
   a asociace se píše přímo přes ni, text bez krabice na střed.
   ════════════════════════════════════════════════════════════════ */
export function BrainApp({ lang }: { lang: Lang }) {
  // jazyk appky: default podle hlavní stránky, ale jde přepnout kdykoliv a kdekoliv
  const [appLang, setAppLang] = useState<Lang>(lang);
  const t = T[appLang];
  const [mode, setMode] = useState<Mode>("explore");
  const [stats, setStats] = useState<Stats | null>(null);
  const [map, setMap] = useState<MapData | null>(null);
  const dirty = useRef(false); // po nových asociacích mapu před zobrazením obnovit

  const [word, setWord] = useState<Word | null>(null);
  const [input, setInput] = useState("");
  const [last, setLast] = useState<{ from: string; to: Word; count: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [mine, setMine] = useState(0);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadMap = (l: Lang) => {
    fetch(`/api/brain/map?lang=${l}`).then((r) => r.ok ? r.json() : null)
      .then((m) => { if (m) setMap(m); })
      .catch(() => {});
  };

  const fetchWord = async (l: Lang, notId?: number) => {
    setWord(null); setErr(null);
    try {
      const r = await fetch(`/api/brain/word?lang=${l}${notId ? `&not=${notId}` : ""}`);
      const j = await r.json();
      if (j.word) setWord(j.word);
    } catch { setErr(T[l].errNet); }
  };

  useEffect(() => {
    // celé načtení (i reset při přepnutí jazyka) mimo tělo efektu — žádný synchronní setState
    const id = requestAnimationFrame(() => {
      setMap(null); setLast(null); setErr(null); setInput("");
      fetch(`/api/brain/stats?lang=${appLang}`).then((r) => r.ok ? r.json() : null).then((s) => s && setStats(s)).catch(() => {});
      loadMap(appLang);
      fetchWord(appLang);
    });
    return () => cancelAnimationFrame(id);
  }, [appLang]);

  useEffect(() => { track("brain", "open"); }, []);

  const enterMap = () => {
    track("brain", "interact");
    if (dirty.current) { dirty.current = false; loadMap(appLang); }
    if (map && map.total < map.goal) setMode("gate");
    else setMode("map");
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
        track("brain", "interact");
        setLast({ from: word.display, to: j.to, count: j.count });
        setMine((m) => m + 1);
        setInput("");
        setStats((s) => s ? { ...s, total: j.total } : s);
        dirty.current = true;
        fetchWord(appLang, word.id); // další slovo je vždy náhodné — žádný vlastní train of thought
        inputRef.current?.focus();
      } else {
        setErr(j.error === "same" ? t.errSame : t.errInvalid);
      }
    } catch { setErr(t.errNet); }
    setBusy(false);
  };

  const overlay = mode !== "map";

  return (
    <main style={{ position: "fixed", inset: 0, background: "var(--bg)", color: "var(--text-primary)", overflow: "hidden" }}>
      {/* ── mapa na pozadí — živá síť jako brána encyklopedie, jen kuličky bez popisků ── */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: overlay ? "none" : "auto" }}>
        {map && map.edges.length > 0
          ? <BrainMap data={map} lang={appLang} chrome={mode === "map"} onBack={() => setMode("explore")} />
          : <IdleField />}
      </div>

      {/* ── asociace přímo přes mapu, encyklopedický střed bez krabice ── */}
      {mode === "explore" && (
        <div style={overlayWrap}>
          <Link href="/" style={{ position: "absolute", top: 20, left: 24, ...sans, fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>{t.back}</Link>

          <div style={{ maxWidth: 600, width: "100%", textAlign: "center" }}>
            <p style={{ ...sans, fontSize: 11, letterSpacing: "0.32em", textTransform: "uppercase", color: "var(--text-muted)", margin: "0 0 6px" }}>⚡ {t.title}</p>
            <p style={{ ...display, fontStyle: "italic", fontSize: 14, color: "var(--text-secondary)", margin: "0 0 34px" }}>{t.tagline}</p>

            <p style={{ ...sans, fontSize: 13.5, color: "var(--text-secondary)", margin: 0 }}>{t.prompt}</p>
            <p style={{ ...display, fontSize: "clamp(36px,8vw,60px)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.08, margin: "8px 0 24px", minHeight: "1.1em" }}>
              {word ? word.display : <span style={{ opacity: 0.4, fontSize: 17, ...sans, fontWeight: 400 }}>{t.loadingWord}</span>}
            </p>

            <form onSubmit={submit} style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => { setInput(e.target.value); setErr(null); }}
                placeholder={t.placeholder}
                autoFocus
                maxLength={60}
                style={{
                  flex: 1, minWidth: 200, maxWidth: 340, background: "rgba(255,255,255,0.8)",
                  border: "1px solid rgba(26,22,20,0.2)", borderRadius: 999,
                  padding: "12px 18px", ...sans, fontSize: 14,
                  color: "var(--text-primary)", outline: "none",
                  backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                }}
              />
              <button type="submit" disabled={!word || !input.trim() || busy} style={{
                background: "var(--text-primary)", color: "var(--bg)", border: "none",
                borderRadius: 999, padding: "12px 22px",
                ...sans, fontSize: 13.5, fontWeight: 700, cursor: "pointer",
                opacity: (!word || !input.trim() || busy) ? 0.4 : 1,
              }}>{t.send}</button>
            </form>

            {err && <p style={{ ...sans, fontSize: 13, color: "#b91c1c", margin: "14px 0 0" }}>{err}</p>}

            {last && !err && (
              <div style={{ marginTop: 18 }}>
                <p style={{ ...sans, fontSize: 14, fontWeight: 600, margin: 0 }}>
                  {last.count > 1 ? t.savedAgain(last.from, last.to.display, last.count) : t.savedNew(last.from, last.to.display)}
                </p>
                <p style={{ ...sans, fontSize: 12.5, color: "var(--text-muted)", margin: "5px 0 0" }}>{t.afterSave}</p>
              </div>
            )}

            <div style={{ marginTop: 30, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <button onClick={() => { setLast(null); fetchWord(appLang, word?.id); inputRef.current?.focus(); }} style={{
                background: "rgba(255,255,255,0.8)", border: "1px solid rgba(26,22,20,0.2)", borderRadius: 999,
                padding: "8px 18px", ...sans, fontSize: 13, fontWeight: 600, cursor: "pointer",
                color: "var(--text-primary)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
              }}>{t.dice}</button>
              <button onClick={enterMap} style={{
                background: "none", border: "none", cursor: "pointer", padding: 0,
                ...sans, fontSize: 13, fontWeight: 600, color: "var(--text-secondary)",
                textDecoration: "underline", textUnderlineOffset: "4px",
              }}>{t.researcher}</button>
            </div>
          </div>

          <p style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", ...sans, fontSize: 11, color: "var(--text-muted)", margin: 0, whiteSpace: "nowrap" }}>
            {mine > 0 ? t.mine(mine) : stats ? t.stats(stats) : ""}
          </p>
        </div>
      )}

      {/* ── přepínač jazyka sítě — kdykoliv, kdekoliv; default podle hlavní stránky ── */}
      <div style={{ position: "absolute", right: 16, bottom: 12, zIndex: 30, display: "flex", gap: 6 }}>
        {(["cs", "en"] as const).map((l) => (
          <button key={l} onClick={() => setAppLang(l)} aria-label={l === "cs" ? "Čeština" : "English"} style={{
            background: appLang === l ? "var(--text-primary)" : "#fff",
            color: appLang === l ? "var(--bg)" : "var(--text-primary)",
            border: "2px solid var(--border)", borderRadius: 999, padding: "5px 12px",
            ...sans, fontSize: 11.5, fontWeight: 700, cursor: "pointer",
            boxShadow: "2px 2px 0 var(--shadow)",
          }}>{l.toUpperCase()}</button>
        ))}
      </div>

      {/* ── gate: síť je moc malá na mapu — taky jen text na střed ── */}
      {mode === "gate" && map && (
        <div style={overlayWrap}>
          <div style={{ maxWidth: 460, width: "100%", textAlign: "center" }}>
            <span style={{ fontSize: 42, display: "block", marginBottom: 12 }}>🐣</span>
            <h2 style={{ ...display, fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 10px" }}>{t.gateTitle}</h2>
            <p style={{ ...sans, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 18px" }}>
              {t.gateText(map.total, map.goal)}
            </p>
            <div style={{ background: "#fff", border: "2px solid var(--border)", borderRadius: 999, height: 14, overflow: "hidden", marginBottom: 24, boxShadow: "2px 2px 0 var(--shadow)" }}>
              <div style={{ width: `${Math.max(1.5, Math.min(100, (map.total / map.goal) * 100))}%`, height: "100%", background: "var(--text-primary)" }} />
            </div>
            <button onClick={() => setMode("explore")} style={{
              background: "var(--text-primary)", color: "var(--bg)", border: "2px solid var(--text-primary)",
              borderRadius: 999, boxShadow: "3px 3px 0 var(--shadow)", padding: "11px 22px",
              ...sans, fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 16,
            }}>{t.gateGo}</button>
            <p style={{ margin: 0 }}>
              {map.edges.length > 0
                ? <button onClick={() => setMode("map")} style={{ background: "none", border: "none", ...sans, fontSize: 12.5, color: "var(--text-muted)", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "3px", padding: 0 }}>{t.gateAnyway}</button>
                : <span style={{ ...sans, fontSize: 12.5, color: "var(--text-muted)" }}>{t.mapEmpty}</span>}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

const overlayWrap: React.CSSProperties = {
  position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
  padding: 24, zIndex: 10, overflowY: "auto",
};

/* Decentní zárodek sítě, dokud mapa nedorazí (nebo je prázdná) — jen CSS, žádný canvas. */
function IdleField() {
  return (
    <div style={{
      position: "absolute", inset: 0,
      background: `
        radial-gradient(420px 300px at 28% 30%, rgba(176,124,24,0.12), transparent 70%),
        radial-gradient(360px 280px at 72% 62%, rgba(180,83,9,0.08), transparent 70%),
        radial-gradient(300px 240px at 55% 20%, rgba(71,85,105,0.07), transparent 70%),
        var(--bg)`,
    }} />
  );
}

/* ════════════════════════════════════════════════════════════════
   Mapa synapsí — force layout na canvasu, nudlové synapse
   v těstovinové barvě jako špagety v encyklopedii.
   Barva slova = slovní druh (stejná paleta jako realmy encyklopedie).
   ════════════════════════════════════════════════════════════════ */
const POS_COL: Record<string, string> = {
  noun: "#8b9cf6", verb: "#e8556d", adjective: "#b07ef6", adverb: "#4daf7c", other: "#8a90a0",
};
type SimNode = { id: number; label: string; seed: boolean; pos: string | null; strength: number; x: number; y: number; vx: number; vy: number; r: number; fx: number; fy: number; fph: number; fsp: number };
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
    return { id: n.id, label: n.label, seed: n.seed, pos: n.pos, strength: 0, x: 0, y: 0, vx: 0, vy: 0, r: 4, fx: 0, fy: 0, fph: (i * 2.399) % 6.28, fsp: 0.4 + ((i * 7) % 10) / 14 };
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
    n.r = 3 + 2.5 * Math.sqrt(n.strength / maxStrength); // screen px — jako tečky v encyklopedii
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

function BrainMap({ data, lang, chrome, onBack }: { data: MapData; lang: Lang; chrome: boolean; onBack: () => void }) {
  const t = T[lang];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<{ id: number; label: string } | null>(null);
  const [tip, setTip] = useState<{ title: string; lines: string[] } | null>(null);
  const selRef = useRef<number | null>(null);
  const drawRef = useRef<() => void>(() => {});
  const chromeRef = useRef(chrome);
  const loopRef = useRef<{ start: () => void; stop: () => void }>({ start: () => {}, stop: () => {} });

  useEffect(() => {
    chromeRef.current = chrome;
    loopRef.current.start(); // síť je živá vždy — jako brána encyklopedie
  }, [chrome]);

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

    const { nodes, edges, maxCount } = buildSim(data);
    runSim(nodes, edges, maxCount);
    const nodeByIdx = (i: number) => nodes[i];
    const idxById = new Map(nodes.map((n, i) => [n.id, i]));

    // slova s vždy viditelným popiskem (top podle síly)
    const labeled = new Set([...nodes].sort((a, b) => b.strength - a.strength).slice(0, 36).map((n) => n.id));

    // jedna špageta na dvojici slov — s vlastním rozcuchem a tempem houpání (jako v encyklopedii)
    const pairs = new Map<string, { ab: number; ba: number; i: number; j: number }>();
    for (const e of edges) {
      const i = Math.min(e.a, e.b), j = Math.max(e.a, e.b);
      const k = `${i}|${j}`;
      const rec = pairs.get(k) ?? { ab: 0, ba: 0, i, j };
      if (e.a === i) rec.ab += e.count; else rec.ba += e.count;
      pairs.set(k, rec);
    }
    type Strand = { a: number; b: number; ab: number; ba: number; norm: number; side: number; o1: number; o2: number; ph: number; sp: number; dirAB: boolean; speed: number; fphase: number };
    const strands: Strand[] = [];
    for (const r of pairs.values()) {
      const hi = Math.max(r.ab, r.ba), lo = Math.min(r.ab, r.ba);
      if (hi === 0) continue;
      const seed = r.i * 31 + r.j * 17;
      strands.push({
        a: r.i, b: r.j, ab: r.ab, ba: r.ba,
        norm: Math.sqrt(hi / maxCount),
        side: (r.i + r.j) % 2 === 0 ? 1 : -1,
        o1: (hash01(seed, 2) - 0.5) * 2, o2: (hash01(seed, 3) - 0.5) * 2,
        ph: hash01(seed, 4) * 6.28, sp: 0.45 + hash01(seed, 6) * 0.75,
        dirAB: r.ab >= r.ba,
        speed: (hi - lo) / hi, // 100:0 → 1, 100:1 → 0,99; vyrovnané netečou
        fphase: hash01(seed, 5),
      });
    }

    // sousedi (indexy) pro zoom na slovo
    const neigh = new Map<number, Set<number>>();
    for (const e of edges) {
      (neigh.get(e.a) ?? neigh.set(e.a, new Set()).get(e.a)!).add(e.b);
      (neigh.get(e.b) ?? neigh.set(e.b, new Set()).get(e.b)!).add(e.a);
    }
    // statistiky slova pro hover tooltip (id slova → ven/dovnitř)
    const wordStats = new Map<number, { out: number; outSum: number; inn: number; innSum: number }>();
    for (const e of data.edges) {
      const o = wordStats.get(e.a) ?? { out: 0, outSum: 0, inn: 0, innSum: 0 };
      o.out += 1; o.outSum += e.count; wordStats.set(e.a, o);
      const i2 = wordStats.get(e.b) ?? { out: 0, outSum: 0, inn: 0, innSum: 0 };
      i2.inn += 1; i2.innSum += e.count; wordStats.set(e.b, i2);
    }

    const view: View = { scale: 1, tx: 0, ty: 0 };
    let hovered: SimNode | null = null;
    let hoveredStrand: number | null = null;
    let anim: { t0: number; dur: number; from: View; to: View } | null = null;
    const cur = { x: -1e4, y: -1e4 };
    let panelSide = 0; // index do pořadí stran
    let lastFlip = 0;
    let panelFresh = true; // první umístění bez animace

    const fitView = (): View => {
      const w = cv.clientWidth, h = cv.clientHeight;
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const n of nodes) {
        minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x);
        minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y);
      }
      const bw = Math.max(120, maxX - minX), bh = Math.max(120, maxY - minY);
      const scale = Math.max(0.18, Math.min(1.6, Math.min(w / (bw + 160), h / (bh + 160))));
      return { scale, tx: w / 2 - ((minX + maxX) / 2) * scale, ty: h / 2 - ((minY + maxY) / 2) * scale };
    };
    const animateTo = (to: View, dur = 520) => { anim = { t0: performance.now(), dur, from: { ...view }, to }; if (!chromeRef.current) Object.assign(view, to); };
    // zoom na slovo: slovo se zafixuje doprostřed stránky, přiblížení tak, ať jsou vidět všichni sousedi
    const zoomToNode = (i: number) => {
      const w = cv.clientWidth, h = cv.clientHeight;
      const n = nodes[i];
      let rMax = 80;
      for (const j of neigh.get(i) ?? []) {
        const m = nodeByIdx(j);
        rMax = Math.max(rMax, Math.hypot(m.x - n.x, m.y - n.y) + m.r);
      }
      const scale = Math.max(0.35, Math.min(3, (Math.min(w, h) / 2 - 100) / rMax));
      animateTo({ scale, tx: w / 2 - n.x * scale, ty: h / 2 - n.y * scale });
    };

    // geometrie špagety (bez houpání — pro hit-test)
    const strandGeom = (st: Strand) => {
      const A = nodes[st.a], B = nodes[st.b];
      const dx = B.fx - A.fx, dy = B.fy - A.fy;
      const d = Math.hypot(dx, dy) || 1;
      const px = -dy / d, py = dx / d;
      const bow = Math.min(26, d * 0.14) * st.side;
      return { A, B, dx, dy, d, px, py, bow };
    };
    const strandAt = (wx: number, wy: number): number | null => {
      const tol = 9 / view.scale + 4;
      let best: number | null = null, bestD = Infinity;
      for (let si = 0; si < strands.length; si++) {
        const st = strands[si];
        const { A, B, dx, dy, px, py, bow } = strandGeom(st);
        if (wx < Math.min(A.fx, B.fx) - 40 || wx > Math.max(A.fx, B.fx) + 40 || wy < Math.min(A.fy, B.fy) - 40 || wy > Math.max(A.fy, B.fy) + 40) continue;
        const c1x = A.fx + dx / 3 + px * (bow * 0.9 + st.o1 * 6), c1y = A.fy + dy / 3 + py * (bow * 0.9 + st.o1 * 6);
        const c2x = A.fx + (2 * dx) / 3 + px * (bow * 0.9 + st.o2 * 6), c2y = A.fy + (2 * dy) / 3 + py * (bow * 0.9 + st.o2 * 6);
        for (let k = 0; k <= 14; k++) {
          const tt = k / 14, u = 1 - tt;
          const x = u * u * u * A.fx + 3 * u * u * tt * c1x + 3 * u * tt * tt * c2x + tt * tt * tt * B.fx;
          const y = u * u * u * A.fy + 3 * u * u * tt * c1y + 3 * u * tt * tt * c2y + tt * tt * tt * B.fy;
          const dd = Math.hypot(x - wx, y - wy);
          if (dd < tol && dd < bestD) { best = si; bestD = dd; }
        }
      }
      return best;
    };

    const draw = () => {
      const w = cv.clientWidth, h = cv.clientHeight;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const g = ctx.createRadialGradient(w * 0.35, h * 0.3, 0, w * 0.35, h * 0.3, Math.max(w, h));
      g.addColorStop(0, "#fffdf6"); g.addColorStop(0.75, "#f1ece0");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

      ctx.setTransform(dpr * view.scale, 0, 0, dpr * view.scale, dpr * view.tx, dpr * view.ty);

      const bg = !chromeRef.current; // mapa jako živé pozadí asociací
      const nowF = performance.now() / 1000;
      const px1 = 1 / view.scale; // 1 screen px ve světových jednotkách — vše kreslíme v pevných px jako encyklopedie
      for (const n of nodes) { // jemné plutí jen na pozadí; v Researcheru uzly stojí
        n.fx = bg ? n.x + Math.sin(nowF * n.fsp + n.fph) * 4.5 : n.x;
        n.fy = bg ? n.y + Math.cos(nowF * n.fsp + n.fph) * 4.5 : n.y;
      }
      // v pozadí asociací nechat střed čistý pro text — útlum podle vzdálenosti od středu obrazovky
      const cwx = (w / 2 - view.tx) / view.scale, cwy = (h / 2 - view.ty) / view.scale;
      const R0 = (Math.min(w, h) * 0.32) / view.scale, feather = 180 / view.scale;
      const clear = (x: number, y: number) => bg ? Math.max(0, Math.min(1, (Math.hypot(x - cwx, y - cwy) - R0) / feather)) : 1;
      const selId = selRef.current;
      const hotId = hovered?.id ?? selId;
      const hsEnds = new Set<number>(); // popisky konců hoverované nudle
      if (hoveredStrand !== null) { const st = strands[hoveredStrand]; hsEnds.add(nodes[st.a].id); hsEnds.add(nodes[st.b].id); }

      // špagety (synapse) — zlehka se houpou; kulička putuje potrubím směrem převahy
      const now = performance.now() / 1000;
      for (let si = 0; si < strands.length; si++) {
        const st = strands[si];
        const A = nodes[st.a], B = nodes[st.b];
        const hot = hotId !== null && (A.id === hotId || B.id === hotId);
        const hovS = hoveredStrand === si;
        const dimS = hotId !== null && !hot;
        const srcId = st.dirAB ? A.id : B.id; // odkud informace teče
        const cf = clear((A.fx + B.fx) / 2, (A.fy + B.fy) / 2);
        if (cf <= 0.02) continue;
        let col: string;
        if (hot) {
          // z vybraného slova teče teplá, do něj chladná
          col = srcId === hotId ? "rgba(180, 83, 9, 0.92)" : "rgba(71, 85, 105, 0.85)";
        } else if (hovS) {
          col = `rgba(176, 124, 24, ${0.55 + 0.3 * st.norm})`;
        } else {
          col = `rgba(176, 124, 24, ${(dimS ? 0.07 + 0.1 * st.norm : 0.16 + 0.4 * st.norm) * cf})`;
        }
        const lw = (0.8 + 1.6 * st.norm) * (hot || hovS ? 1.35 : 1) * px1; // screen px
        ctx.strokeStyle = col;
        ctx.lineWidth = lw;
        ctx.lineCap = "round";

        const { dx, dy, d, px, py, bow } = strandGeom(st);
        const wobAmp = bg ? Math.min(9, d * 0.07) : 0; // houpe se jen pozadí asociací, Researcher stojí
        const w1 = Math.sin(now * st.sp + st.ph) * wobAmp;
        const w2 = Math.sin(now * st.sp * 1.27 + st.ph + 2.1) * wobAmp;
        const c1x = A.fx + dx / 3 + px * (bow * 0.9 + st.o1 * 6 + w1);
        const c1y = A.fy + dy / 3 + py * (bow * 0.9 + st.o1 * 6 + w1);
        const c2x = A.fx + (2 * dx) / 3 + px * (bow * 0.9 + st.o2 * 6 + w2);
        const c2y = A.fy + (2 * dy) / 3 + py * (bow * 0.9 + st.o2 * 6 + w2);
        ctx.beginPath();
        ctx.moveTo(A.fx, A.fy);
        ctx.bezierCurveTo(c1x, c1y, c2x, c2y, B.fx, B.fy);
        ctx.stroke();

        // kulička v potrubí: nudle se kolem ní gaussovsky rozšíří a zase stáhne
        if (st.speed > 0.001 && cf > 0.05) {
          const tRaw = (now * st.speed * 2 + st.fphase) % 1; // plná rychlost = 0,5 s na přejezd
          const tBall = st.dirAB ? tRaw : 1 - tRaw;
          const pt = (tt: number) => {
            const u = 1 - tt;
            return {
              x: u * u * u * A.fx + 3 * u * u * tt * c1x + 3 * u * tt * tt * c2x + tt * tt * tt * B.fx,
              y: u * u * u * A.fy + 3 * u * u * tt * c1y + 3 * u * tt * tt * c2y + tt * tt * tt * B.fy,
            };
          };
          ctx.strokeStyle = hot || hovS ? col : `rgba(176, 124, 24, ${(dimS ? 0.22 : 0.7) * cf})`;
          const span = 0.045, steps = 8;
          let prev = pt(Math.max(0, tBall - span));
          for (let k = 1; k <= steps; k++) {
            const tk = Math.min(1, Math.max(0, tBall - span + (2 * span * k) / steps));
            const cur2 = pt(tk);
            const gss = Math.exp(-(((k - steps / 2) / (steps / 3.2)) ** 2));
            ctx.lineWidth = lw + (1.7 + 1.5 * st.norm) * gss * px1;
            ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(cur2.x, cur2.y); ctx.stroke();
            prev = cur2;
          }
        }
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
        const cf = clear(n.fx, n.fy);
        if (cf <= 0.02) continue;
        const r = (hot ? n.r + 2 : n.r) * px1;
        ctx.globalAlpha = (hot ? 1 : dim ? 0.25 : 0.9) * cf;
        ctx.fillStyle = POS_COL[n.pos ?? ""] ?? POS_COL.other; // barva = slovní druh
        ctx.beginPath(); ctx.arc(n.fx, n.fy, r, 0, 7); ctx.fill();
        if (n.seed) {
          ctx.strokeStyle = `rgba(176, 124, 24, ${0.85 * cf})`; ctx.lineWidth = 1.2 * px1;
          ctx.beginPath(); ctx.arc(n.fx, n.fy, r + 2.2 * px1, 0, 7); ctx.stroke();
        }
        const showLabel = !bg && (hot || neighborIds.has(n.id) || hsEnds.has(n.id) || (labeled.has(n.id) && (hotId === null || !dim)));
        if (showLabel) {
          ctx.globalAlpha = hot ? 1 : 0.85;
          ctx.fillStyle = "#1a1614";
          ctx.font = `${hot ? 700 : 500} ${10 * px1}px system-ui`;
          ctx.textAlign = "center";
          ctx.fillText(n.label, n.fx, n.fy + r + 11 * px1);
        }
        ctx.globalAlpha = 1;
      }
    };
    drawRef.current = draw;

    // ── info panel u vybraného slova: drží se u něj, neleze přes nudle a uhýbá kurzoru ──
    const placePanel = () => {
      const panel = panelRef.current;
      const selId = selRef.current;
      if (!panel || selId === null) return;
      const i = idxById.get(selId);
      if (i === undefined) return;
      const n = nodes[i];
      const w = cv.clientWidth, h = cv.clientHeight;
      const sx = n.fx * view.scale + view.tx, sy = n.fy * view.scale + view.ty;
      const W = panel.offsetWidth || 200, H = panel.offsetHeight || 120;
      const gap = 26;
      // preferovaná strana: pryč od těžiště sousedů (tam nudle nejsou)
      const ns = [...(neigh.get(i) ?? [])].map(nodeByIdx);
      let cxN = 0, cyN = 0;
      ns.forEach((m) => { cxN += m.x - n.x; cyN += m.y - n.y; });
      const order: ("r" | "l" | "t" | "b")[] = Math.abs(cxN) > Math.abs(cyN)
        ? (cxN > 0 ? ["l", "r", "t", "b"] : ["r", "l", "t", "b"])
        : (cyN > 0 ? ["t", "b", "r", "l"] : ["b", "t", "r", "l"]);
      const posFor = (side: "r" | "l" | "t" | "b") => {
        if (side === "r") return { x: sx + gap, y: sy - H / 2 };
        if (side === "l") return { x: sx - gap - W, y: sy - H / 2 };
        if (side === "t") return { x: sx - W / 2, y: sy - gap - H };
        return { x: sx - W / 2, y: sy + gap };
      };
      // uhýbání kurzoru: když se kurzor přiblíží, přeskoč na další stranu
      const nowMs = performance.now();
      let side = order[panelSide % order.length];
      let pos = posFor(side);
      const near = (pp: { x: number; y: number }) =>
        cur.x > pp.x - 30 && cur.x < pp.x + W + 30 && cur.y > pp.y - 30 && cur.y < pp.y + H + 30;
      if (near(pos) && nowMs - lastFlip > 320) {
        for (let k = 1; k < order.length; k++) {
          const cand = order[(panelSide + k) % order.length];
          if (!near(posFor(cand))) { panelSide = (panelSide + k) % order.length; side = cand; break; }
        }
        lastFlip = nowMs;
        pos = posFor(side);
      }
      pos.x = Math.max(8, Math.min(w - W - 8, pos.x));
      pos.y = Math.max(54, Math.min(h - H - 8, pos.y));
      if (panelFresh) { panel.style.transition = "none"; }
      panel.style.left = `${pos.x}px`;
      panel.style.top = `${pos.y}px`;
      if (panelFresh) { void panel.offsetWidth; panel.style.transition = "left 300ms ease, top 300ms ease"; panelFresh = false; }
    };
    const markPanelFresh = () => { panelFresh = true; panelSide = 0; };

    const resize = () => {
      cv.width = cv.clientWidth * dpr;
      cv.height = cv.clientHeight * dpr;
      Object.assign(view, fitView());
      draw();
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    const tick = () => {
      if (anim) {
        const k = Math.min(1, (performance.now() - anim.t0) / anim.dur);
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        view.scale = anim.from.scale + (anim.to.scale - anim.from.scale) * e;
        view.tx = anim.from.tx + (anim.to.tx - anim.from.tx) * e;
        view.ty = anim.from.ty + (anim.to.ty - anim.from.ty) * e;
        if (k >= 1) anim = null;
      }
      draw();
      placePanel();
      raf = requestAnimationFrame(tick);
    };
    loopRef.current = {
      start: () => { if (!raf) raf = requestAnimationFrame(tick); },
      stop: () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } },
    };
    loopRef.current.start();

    const toWorld = (sx: number, sy: number) => ({ x: (sx - view.tx) / view.scale, y: (sy - view.ty) / view.scale });
    const pick = (sx: number, sy: number): SimNode | null => {
      const p = toWorld(sx, sy);
      let best: SimNode | null = null, bestD = Infinity;
      for (const n of nodes) {
        const d = Math.hypot(n.fx - p.x, n.fy - p.y);
        if (d < Math.max(14, n.r + 8) / view.scale && d < bestD) { best = n; bestD = d; }
      }
      return best;
    };

    // hover → tooltip (slovo, nebo nudle s počty oběma směry)
    const updateHover = (sx: number, sy: number) => {
      const pWord = pick(sx, sy);
      let pStrand: number | null = null;
      if (!pWord) { const wp = toWorld(sx, sy); pStrand = strandAt(wp.x, wp.y); }
      if (pWord !== hovered || pStrand !== hoveredStrand) {
        hovered = pWord; hoveredStrand = pWord ? null : pStrand;
        cv.style.cursor = pWord || pStrand !== null ? "pointer" : "grab";
        if (pWord && pWord.id !== selRef.current) {
          const st2 = wordStats.get(pWord.id) ?? { out: 0, outSum: 0, inn: 0, innSum: 0 };
          setTip({ title: pWord.label, lines: [T[lang].wordTip(st2.out, st2.outSum, st2.inn, st2.innSum)] });
        } else if (!pWord && pStrand !== null) {
          const st2 = strands[pStrand];
          const la = nodes[st2.a].label, lb = nodes[st2.b].label;
          const lines: string[] = [];
          if (st2.ab > 0) lines.push(`${la} → ${lb} ×${st2.ab}`);
          if (st2.ba > 0) lines.push(`${lb} → ${la} ×${st2.ba}`);
          setTip({ title: "", lines });
        } else {
          setTip(null);
        }
        if (!chromeRef.current) draw();
      }
      const tipEl = tipRef.current;
      if (tipEl) {
        const w = cv.clientWidth;
        const tw = tipEl.offsetWidth || 160;
        tipEl.style.left = `${sx + 16 + tw > w - 8 ? sx - tw - 12 : sx + 16}px`;
        tipEl.style.top = `${sy + 18}px`;
      }
    };

    // pan + zoom + pinch + klik
    const pointers = new Map<number, { x: number; y: number }>();
    let panStart: { x: number; y: number; tx: number; ty: number } | null = null;
    let moved = 0;
    let pinchDist = 0;

    const rect = () => cv.getBoundingClientRect();

    const onDown = (e: PointerEvent) => {
      anim = null; // ruční zásah ruší animaci pohledu
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
      cur.x = x; cur.y = y;
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
          if (!chromeRef.current) draw();
        }
        return;
      }
      // hover (myš bez stisknutí)
      if (pointers.size === 0) updateHover(x, y);
    };
    const onUp = (e: PointerEvent) => {
      const r = rect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const wasSingle = pointers.size === 1;
      pointers.delete(e.pointerId);
      pinchDist = 0;
      if (wasSingle && moved <= 4) {
        const p = pick(x, y);
        if (p) {
          if (selRef.current === p.id) {
            // druhý klik na vybrané slovo → odznačit a oddálit
            setSelected(null);
            animateTo(fitView());
          } else {
            setSelected({ id: p.id, label: p.label });
            setTip(null);
            markPanelFresh();
            const i = idxById.get(p.id);
            if (i !== undefined) zoomToNode(i);
          }
        } else {
          setSelected(null);
          animateTo(fitView());
        }
      }
      panStart = null;
    };
    const zoomAt = (cx: number, cy: number, factor: number) => {
      const ns = Math.max(0.12, Math.min(6, view.scale * factor));
      const k = ns / view.scale;
      view.tx = cx - (cx - view.tx) * k;
      view.ty = cy - (cy - view.ty) * k;
      view.scale = ns;
      if (!chromeRef.current) draw();
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      anim = null;
      const r = rect();
      zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.0014));
    };
    const onLeave = () => { cur.x = -1e4; cur.y = -1e4; hovered = null; hoveredStrand = null; setTip(null); };

    cv.addEventListener("pointerdown", onDown);
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerup", onUp);
    cv.addEventListener("pointercancel", onUp);
    cv.addEventListener("pointerleave", onLeave);
    cv.addEventListener("wheel", onWheel, { passive: false });
    cv.style.cursor = "grab";

    return () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      window.removeEventListener("resize", resize);
      cv.removeEventListener("pointerdown", onDown);
      cv.removeEventListener("pointermove", onMove);
      cv.removeEventListener("pointerup", onUp);
      cv.removeEventListener("pointercancel", onUp);
      cv.removeEventListener("pointerleave", onLeave);
      cv.removeEventListener("wheel", onWheel);
    };
  }, [data, lang]);

  return (
    <div style={{ position: "absolute", inset: 0, background: "#f1ece0" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block", touchAction: "none" }} />

      {/* horní lišta + legenda + nápověda — jen v ostrém (interaktivním) režimu */}
      {chrome && (
        <>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, padding: "14px 18px",
            display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
            pointerEvents: "none",
          }}>
            <button onClick={onBack} style={{
              pointerEvents: "auto", background: "#fff", border: "2px solid var(--border)", borderRadius: 999,
              padding: "7px 14px", ...sans, fontSize: 12.5, fontWeight: 600, cursor: "pointer", color: "var(--text-primary)",
              boxShadow: "3px 3px 0 var(--shadow)",
            }}>{t.backToAssoc}</button>
            <div style={{ textAlign: "right" }}>
              <p style={{ ...display, fontSize: 16, fontWeight: 700, margin: 0 }}>⚡ {t.title} · 🔬 Researcher</p>
              {/* vysvětlivky — mimochodem, drobně pod titulkem */}
              <div style={{ ...sans, fontSize: 10.5, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.7 }}>
                <p style={{ margin: 0 }}>{t.mapLegend}</p>
                <p style={{ margin: 0 }}>{t.legendBall}</p>
                <p style={{ margin: 0 }}>{t.legendSeed}</p>
                <p style={{ margin: 0 }}>{t.legendColor}</p>
                <p style={{ margin: 0 }}>{t.legendPos}</p>
                {data.truncated && <p style={{ margin: 0 }}>{t.truncated}</p>}
              </div>
            </div>
          </div>

          <p style={{
            position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
            ...sans, fontSize: 11, color: "var(--text-muted)", margin: 0, whiteSpace: "nowrap",
          }}>{t.mapHint}</p>
        </>
      )}

      {/* hover tooltip — letí s kurzorem, čistý text */}
      {chrome && tip && (tip.title || tip.lines.length > 0) && (
        <div ref={tipRef} style={{
          position: "absolute", left: -9999, top: -9999, pointerEvents: "none", zIndex: 25,
          background: "rgba(255,253,246,0.93)", borderRadius: 8, padding: "6px 10px", maxWidth: 240,
        }}>
          {tip.title && <p style={{ ...display, fontSize: 13.5, fontWeight: 700, margin: 0 }}>{tip.title}</p>}
          {tip.lines.map((l, i) => <p key={i} style={{ ...sans, fontSize: 11.5, color: "var(--text-secondary)", margin: 0 }}>{l}</p>)}
        </div>
      )}

      {/* detail vybraného slova — mimochodem vedle slova, uhýbá kurzoru, nejde přes něj klikat */}
      {chrome && selected && detail && (
        <div ref={panelRef} style={{
          position: "absolute", left: -9999, top: -9999, width: 200, pointerEvents: "none", zIndex: 20,
          background: "rgba(255,253,246,0.9)", borderRadius: 10, padding: "10px 13px",
          transition: "left 300ms ease, top 300ms ease",
        }}>
          <p style={{ ...display, fontSize: 17, fontWeight: 700, margin: 0, wordBreak: "break-word" }}>{selected.label}</p>

          <p style={{ ...sans, fontSize: 10, color: "#b45309", textTransform: "uppercase", letterSpacing: "0.08em", margin: "10px 0 3px" }}>{t.outLabel}</p>
          {detail.out.length === 0 && <p style={{ ...sans, fontSize: 11.5, color: "var(--text-muted)", margin: 0 }}>{t.nothing}</p>}
          {detail.out.map((o) => (
            <div key={`o${o.id}`} style={{ display: "flex", justifyContent: "space-between", gap: 8, ...sans, fontSize: 12, padding: "1px 0" }}>
              <span style={{ wordBreak: "break-word" }}>{o.label}</span>
              <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>×{o.count}</span>
            </div>
          ))}

          <p style={{ ...sans, fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", margin: "10px 0 3px" }}>{t.inLabel}</p>
          {detail.inn.length === 0 && <p style={{ ...sans, fontSize: 11.5, color: "var(--text-muted)", margin: 0 }}>{t.nothing}</p>}
          {detail.inn.map((o) => (
            <div key={`i${o.id}`} style={{ display: "flex", justifyContent: "space-between", gap: 8, ...sans, fontSize: 12, padding: "1px 0" }}>
              <span style={{ wordBreak: "break-word" }}>{o.label}</span>
              <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>×{o.count}</span>
            </div>
          ))}

        </div>
      )}
    </div>
  );
}
