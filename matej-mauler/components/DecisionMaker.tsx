"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Lang } from "@/lib/dictionaries";

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const serifI: React.CSSProperties = { fontFamily: "var(--font-display)", fontStyle: "italic" };
const sans = "var(--font-sans)";

type Arg = { id: string; text: string; w: number };
type Side = { name: string; pros: Arg[]; cons: Arg[] };
type Snapshot = { a: Side; b: Side };
type JournalEntry = { id: string; date: number; aName: string; bName: string; choice: "a" | "b"; leanA: number; leanB: number; outcome?: "good" | "bad" };

const uid = () => Math.random().toString(36).slice(2, 9);
// tvorba záznamu (uid + Date.now) mimo render — kvůli pravidlu „žádné nečisté volání v renderu"
function makeEntry(a: Side, b: Side, side: "a" | "b", leanA: number, leanB: number): JournalEntry {
  return { id: uid(), date: Date.now(), aName: a.name, bName: b.name, choice: side, leanA, leanB };
}

const UI = {
  cs: {
    back: "← Spaghetti.ltd", eyebrow: "Rozhodování · decidere",
    title: "Decision Maker",
    tagline: "Rozhodnout znamená odříznout. (z lat. de-cidere — od-říznout)",
    intro: "Jsi zaseknutý na 50/50? Napiš si pro a proti, dej jim váhu — a uvidíš, kam se to kloní. Pak to odřízni.",
    optA: "Varianta A", optB: "Varianta B",
    pros: "Pro", cons: "Proti", addArg: "přidej důvod…",
    weight: "váha", leansTo: "kloní se k", even: "vyrovnané — pořád 50/50",
    coin: "🪙 Hodit si", coinAsk: "Když mince padla na", coinFelt: "ulevilo se ti, nebo tě to zklamalo?",
    relief: "😮‍💨 ulevilo", letdown: "😕 zklamalo",
    coinNoteRelief: (s: string) => `Úleva u „${s}" je signál. Tvoje střevo už zvolilo.`,
    coinNoteLetdown: (s: string) => `Zklamání u „${s}" je taky odpověď — zřejmě chceš tu druhou.`,
    decide: "✂️ Rozhodl jsem se", which: "Kterou variantu si vybíráš?",
    decidedFor: "Odříznuto. Zvolil jsi:", saved: "Uloženo do deníku.",
    again: "Nové rozhodnutí",
    journal: "Deník rozhodnutí", journalEmpty: "Zatím prázdno. První rozhodnutí se sem uloží.",
    outcomeAsk: "Dopadlo dobře?", good: "👍", bad: "👎",
    cleared: "vymazat", clearAll: "Vyčistit a začít znovu",
  },
  en: {
    back: "← Spaghetti.ltd", eyebrow: "Deciding · decidere",
    title: "Decision Maker",
    tagline: "To decide is to cut off. (from Latin de-cidere — to cut away)",
    intro: "Stuck at 50/50? Write down the pros and cons, give them weight — and see which way it leans. Then cut.",
    optA: "Option A", optB: "Option B",
    pros: "Pros", cons: "Cons", addArg: "add a reason…",
    weight: "weight", leansTo: "leans to", even: "even — still 50/50",
    coin: "🪙 Flip a coin", coinAsk: "When the coin landed on", coinFelt: "relieved, or let down?",
    relief: "😮‍💨 relieved", letdown: "😕 let down",
    coinNoteRelief: (s: string) => `Relief at "${s}" is a signal. Your gut already chose.`,
    coinNoteLetdown: (s: string) => `Disappointment at "${s}" is also an answer — you probably want the other one.`,
    decide: "✂️ I've decided", which: "Which option are you choosing?",
    decidedFor: "Cut away. You chose:", saved: "Saved to your journal.",
    again: "New decision",
    journal: "Decision journal", journalEmpty: "Empty for now. Your first decision lands here.",
    outcomeAsk: "Did it work out?", good: "👍", bad: "👎",
    cleared: "clear", clearAll: "Clear and start over",
  },
} as const;

const card: React.CSSProperties = { background: "#fff", border: "2px solid var(--border)", borderRadius: 16, boxShadow: "4px 4px 0 var(--border)" };
const CUR = "dm:current", JOUR = "dm:journal";

const emptySide = (name: string): Side => ({ name, pros: [], cons: [] });
const sumW = (a: Arg[]) => a.reduce((s, x) => s + x.w, 0);

export function DecisionMaker({ lang }: { lang: Lang }) {
  const t = UI[lang];
  const [a, setA] = useState<Side>(() => emptySide(UI[lang].optA));
  const [b, setB] = useState<Side>(() => emptySide(UI[lang].optB));
  const [decided, setDecided] = useState<"a" | "b" | null>(null);
  const [choosing, setChoosing] = useState(false);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [coin, setCoin] = useState<{ phase: "flip" | "ask"; side: "a" | "b" } | null>(null);
  const [coinNote, setCoinNote] = useState<string | null>(null);

  // lean: A vlevo. Pro A + proti B táhne k A; pro B + proti A táhne k B.
  const leanA = sumW(a.pros) + sumW(b.cons);
  const leanB = sumW(b.pros) + sumW(a.cons);
  const total = leanA + leanB;
  const posA = total > 0 ? leanA / total : 0.5; // 1 = celé A (vlevo)

  /* ── načtení deníku + rozpracovaného ── */
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      try { const j = JSON.parse(localStorage.getItem(JOUR) || "[]"); if (Array.isArray(j)) setJournal(j); } catch {}
      try {
        const c = JSON.parse(localStorage.getItem(CUR) || "null") as Snapshot | null;
        if (c?.a && c?.b) { setA(c.a); setB(c.b); }
      } catch {}
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // autosave rozpracovaného (dokud není rozhodnuto)
  useEffect(() => {
    if (decided) return;
    try { localStorage.setItem(CUR, JSON.stringify({ a, b })); } catch {}
  }, [a, b, decided]);

  /* ── fyzikální přetahování (rAF, bez re-renderů) ── */
  const targetRef = useRef(posA);
  useEffect(() => { targetRef.current = decided ? (decided === "a" ? 1 : 0) : posA; }, [posA, decided]);
  const knotRef = useRef<SVGCircleElement>(null);
  const leftRef = useRef<SVGPathElement>(null);
  const rightRef = useRef<SVGPathElement>(null);
  useEffect(() => {
    let raf = 0; let pos = targetRef.current; let vel = 0;
    const xL = 70, xR = 530, baseY = 78, sag = 46;
    const tick = () => {
      const target = targetRef.current;
      const k = 0.012, damp = 0.78; // pružina
      vel = (vel + (target - pos) * k) * damp;
      pos += vel;
      const wob = Math.sin(Date.now() / 600) * (1 - Math.min(1, Math.abs(vel) * 60)) * 2.5;
      const kx = xL + (1 - pos) * (xR - xL);
      const ky = baseY + sag + wob;
      knotRef.current?.setAttribute("cx", String(kx));
      knotRef.current?.setAttribute("cy", String(ky));
      leftRef.current?.setAttribute("d", `M ${xL} ${baseY} Q ${(xL + kx) / 2} ${baseY + sag + 6} ${kx} ${ky}`);
      rightRef.current?.setAttribute("d", `M ${kx} ${ky} Q ${(kx + xR) / 2} ${baseY + sag + 6} ${xR} ${baseY}`);
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── editace argumentů ── */
  const addArg = (side: "a" | "b", kind: "pros" | "cons", text: string) => {
    const v = text.trim(); if (!v) return;
    const setter = side === "a" ? setA : setB;
    setter((s) => ({ ...s, [kind]: [...s[kind], { id: uid(), text: v, w: 3 }] }));
  };
  const setW = (side: "a" | "b", kind: "pros" | "cons", id: string, w: number) => {
    const setter = side === "a" ? setA : setB;
    setter((s) => ({ ...s, [kind]: s[kind].map((x) => x.id === id ? { ...x, w } : x) }));
  };
  const removeArg = (side: "a" | "b", kind: "pros" | "cons", id: string) => {
    const setter = side === "a" ? setA : setB;
    setter((s) => ({ ...s, [kind]: s[kind].filter((x) => x.id !== id) }));
  };
  const rename = (side: "a" | "b", name: string) => (side === "a" ? setA : setB)((s) => ({ ...s, name }));

  /* ── mince ── */
  const flip = () => {
    setCoinNote(null);
    const side: "a" | "b" = Math.random() < 0.5 ? "a" : "b";
    setCoin({ phase: "flip", side });
    setTimeout(() => setCoin({ phase: "ask", side }), 1100);
  };
  const coinAnswer = (felt: "relief" | "letdown") => {
    if (!coin) return;
    const name = coin.side === "a" ? a.name : b.name;
    setCoinNote(felt === "relief" ? t.coinNoteRelief(name) : t.coinNoteLetdown(name));
    setCoin(null);
  };

  /* ── rozhodnutí + deník ── */
  const decide = (side: "a" | "b") => {
    setChoosing(false);
    setDecided(side);
    const entry = makeEntry(a, b, side, leanA, leanB);
    setJournal((j) => { const next = [entry, ...j].slice(0, 50); try { localStorage.setItem(JOUR, JSON.stringify(next)); } catch {} return next; });
    try { localStorage.removeItem(CUR); } catch {}
  };
  const reset = () => {
    setDecided(null); setCoin(null); setCoinNote(null);
    setA(emptySide(t.optA)); setB(emptySide(t.optB));
    try { localStorage.removeItem(CUR); } catch {}
  };
  const setOutcome = (id: string, outcome: "good" | "bad") => {
    setJournal((j) => { const next = j.map((e) => e.id === id ? { ...e, outcome: e.outcome === outcome ? undefined : outcome } : e); try { localStorage.setItem(JOUR, JSON.stringify(next)); } catch {} return next; });
  };

  const leanPct = Math.round(Math.max(posA, 1 - posA) * 100);
  const leanName = posA > 0.5 ? a.name : b.name;

  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg)", color: "var(--text-primary)" }}>
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "16px 22px 70px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" style={{ fontFamily: sans, fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}>{t.back}</Link>
          <span style={{ fontFamily: sans, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.22em", color: "var(--text-muted)" }}>{t.eyebrow}</span>
        </div>

        <h1 style={{ ...display, fontSize: "clamp(34px,6vw,52px)", fontWeight: 900, letterSpacing: "-0.03em", margin: "18px 0 6px" }}>✂️ {t.title}</h1>
        <p style={{ ...serifI, fontSize: 15, color: "var(--text-secondary)", margin: "0 0 4px" }}>{t.tagline}</p>
        <p style={{ fontFamily: sans, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 18px", maxWidth: 600 }}>{t.intro}</p>

        {/* přetahování */}
        <div style={{ ...card, padding: "14px 16px 10px", position: "relative" }}>
          <svg viewBox="0 0 600 150" style={{ width: "100%", height: "auto", display: "block" }}>
            {/* plates */}
            {([["a", a, posA > 0.5], ["b", b, posA < 0.5]] as const).map(([key, side, winning]) => {
              const x = key === "a" ? 70 : 530;
              const dim = decided ? (decided !== key) : false;
              return (
                <g key={key} style={{ opacity: dim ? 0.25 : 1, transition: "opacity .5s" }}>
                  <circle cx={x} cy={78} r={winning && !decided ? 13 : 11} fill={key === "a" ? "#60a5fa" : "#f59e0b"} stroke="#1a1614" strokeWidth={2} />
                  <text x={x} y={50} textAnchor="middle" style={{ ...display, fontSize: 15, fontWeight: 800, fill: "#1a1614" }}>{side.name || (key === "a" ? t.optA : t.optB)}</text>
                  <text x={x} y={108} textAnchor="middle" style={{ fontFamily: sans, fontSize: 11, fill: "var(--text-muted)" }}>{key === "a" ? leanA : leanB}</text>
                </g>
              );
            })}
            {/* noodle (two halves so we can cut one) */}
            <path ref={leftRef} d="" fill="none" stroke="#c8a24a" strokeWidth={5} strokeLinecap="round"
              style={{ opacity: decided === "b" ? 0.15 : 1, transition: "opacity .6s" }} />
            <path ref={rightRef} d="" fill="none" stroke="#c8a24a" strokeWidth={5} strokeLinecap="round"
              style={{ opacity: decided === "a" ? 0.15 : 1, transition: "opacity .6s" }} />
            <circle ref={knotRef} cx={300} cy={124} r={7} fill="#1a1614" />
          </svg>
          <p style={{ textAlign: "center", fontFamily: sans, fontSize: 13, color: "var(--text-secondary)", margin: "2px 0 4px" }}>
            {decided ? <span style={{ fontWeight: 800, color: "var(--text-primary)" }}>{t.decidedFor} {(decided === "a" ? a.name : b.name)}</span>
              : total === 0 ? t.even
              : leanPct < 53 ? t.even
              : <>{t.leansTo} <b>{leanName}</b> · {leanPct}%</>}
          </p>
        </div>

        {/* dvě varianty */}
        {!decided && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, marginTop: 14 }}>
            {([["a", a], ["b", b]] as const).map(([key, side]) => (
              <div key={key} style={{ ...card, padding: "14px 16px", borderColor: key === "a" ? "#60a5fa" : "#f59e0b", boxShadow: `4px 4px 0 ${key === "a" ? "#bfdbfe" : "#fde68a"}` }}>
                <input value={side.name} onChange={(e) => rename(key, e.target.value)}
                  style={{ ...display, fontSize: 18, fontWeight: 900, width: "100%", border: "none", borderBottom: "2px solid var(--border)", background: "transparent", outline: "none", padding: "2px 0 6px", marginBottom: 10 }} />
                {(["pros", "cons"] as const).map((kind) => (
                  <div key={kind} style={{ marginBottom: 8 }}>
                    <p style={{ fontFamily: sans, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: kind === "pros" ? "#16a34a" : "#b91c1c", margin: "8px 0 4px" }}>
                      {kind === "pros" ? `👍 ${t.pros}` : `👎 ${t.cons}`}
                    </p>
                    {side[kind].map((arg) => (
                      <div key={arg.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0" }}>
                        <span style={{ flex: 1, fontFamily: sans, fontSize: 13, minWidth: 0, wordBreak: "break-word" }}>{arg.text}</span>
                        <span style={{ display: "flex", gap: 2, flexShrink: 0 }} title={t.weight}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button key={n} onClick={() => setW(key, kind, arg.id, n)} aria-label={`${t.weight} ${n}`}
                              style={{ width: 11, height: 11, borderRadius: "50%", padding: 0, cursor: "pointer", border: "1.5px solid var(--border)", background: n <= arg.w ? (kind === "pros" ? "#16a34a" : "#b91c1c") : "#fff" }} />
                          ))}
                        </span>
                        <button onClick={() => removeArg(key, kind, arg.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 14, flexShrink: 0, padding: 0 }}>×</button>
                      </div>
                    ))}
                    <ArgInput onAdd={(text) => addArg(key, kind, text)} placeholder={t.addArg} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* akce */}
        <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap", alignItems: "center" }}>
          {!decided ? (
            <>
              <button onClick={flip} style={btnGhost}>{t.coin}</button>
              <button onClick={() => setChoosing(true)} style={btnPrimary}>{t.decide}</button>
              <button onClick={reset} style={{ ...btnGhost, marginLeft: "auto", color: "var(--text-muted)" }}>{t.clearAll}</button>
            </>
          ) : (
            <>
              <span style={{ fontFamily: sans, fontSize: 13, color: "#16a34a", fontWeight: 700 }}>✓ {t.saved}</span>
              <button onClick={reset} style={{ ...btnPrimary, marginLeft: "auto" }}>{t.again}</button>
            </>
          )}
        </div>

        {coinNote && <p style={{ ...serifI, fontSize: 14, color: "var(--text-secondary)", marginTop: 12, padding: "10px 14px", background: "rgba(96,165,250,0.08)", borderRadius: 12 }}>🪙 {coinNote}</p>}

        {/* deník */}
        <div style={{ marginTop: 30 }}>
          <p style={{ ...display, fontSize: 16, fontWeight: 900, marginBottom: 8 }}>📓 {t.journal}</p>
          {journal.length === 0 ? (
            <p style={{ fontFamily: sans, fontSize: 13, color: "var(--text-muted)" }}>{t.journalEmpty}</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {journal.map((e) => {
                const chosen = e.choice === "a" ? e.aName : e.bName;
                const other = e.choice === "a" ? e.bName : e.aName;
                return (
                  <div key={e.id} style={{ ...card, boxShadow: "2px 2px 0 var(--border)", padding: "9px 13px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: sans, fontSize: 13, flex: 1, minWidth: 160 }}>
                      <b>{chosen || "—"}</b> <span style={{ color: "var(--text-muted)" }}>↯ {other || "—"}</span>
                    </span>
                    <span style={{ fontFamily: sans, fontSize: 10.5, color: "var(--text-muted)" }}>{new Date(e.date).toLocaleDateString(lang === "cs" ? "cs-CZ" : "en-GB", { day: "numeric", month: "numeric", year: "numeric" })}</span>
                    <span style={{ fontFamily: sans, fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                      {t.outcomeAsk}
                      <button onClick={() => setOutcome(e.id, "good")} style={{ ...thumb, opacity: e.outcome === "good" ? 1 : 0.4 }}>{t.good}</button>
                      <button onClick={() => setOutcome(e.id, "bad")} style={{ ...thumb, opacity: e.outcome === "bad" ? 1 : 0.4 }}>{t.bad}</button>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* výběr varianty při rozhodnutí */}
      {choosing && (
        <div onClick={() => setChoosing(false)} style={overlay}>
          <div onClick={(e) => e.stopPropagation()} style={{ ...card, padding: "24px 26px", maxWidth: 420, width: "100%", textAlign: "center" }}>
            <p style={{ ...display, fontSize: 20, fontWeight: 900, marginBottom: 16 }}>{t.which}</p>
            <div style={{ display: "flex", gap: 10 }}>
              {([["a", a, "#60a5fa"], ["b", b, "#f59e0b"]] as const).map(([key, side, col]) => (
                <button key={key} onClick={() => decide(key)} style={{ flex: 1, ...display, fontSize: 16, fontWeight: 800, color: "#fff", background: col, border: "2px solid #1a1614", borderRadius: 12, boxShadow: "3px 3px 0 #1a1614", padding: "16px 12px", cursor: "pointer" }}>
                  {side.name || (key === "a" ? t.optA : t.optB)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* mince */}
      {coin && (
        <div onClick={() => coin.phase === "ask" && setCoin(null)} style={overlay}>
          <div onClick={(e) => e.stopPropagation()} style={{ ...card, padding: "26px 28px", maxWidth: 420, width: "100%", textAlign: "center" }}>
            {coin.phase === "flip" ? (
              <>
                <div style={{ fontSize: 56, animation: "dmFlip 0.45s linear infinite" }}>🪙</div>
                <style>{`@keyframes dmFlip { 0%{transform:rotateY(0) scale(1)} 50%{transform:rotateY(180deg) scale(1.15)} 100%{transform:rotateY(360deg) scale(1)} }`}</style>
              </>
            ) : (
              <>
                <p style={{ ...display, fontSize: 18, fontWeight: 800, margin: "0 0 4px" }}>{t.coinAsk} <span style={{ color: coin.side === "a" ? "#2563eb" : "#d97706" }}>{coin.side === "a" ? a.name : b.name}</span>,</p>
                <p style={{ fontFamily: sans, fontSize: 14, color: "var(--text-secondary)", margin: "0 0 18px" }}>{t.coinFelt}</p>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => coinAnswer("relief")} style={{ ...btnGhost, flex: 1 }}>{t.relief}</button>
                  <button onClick={() => coinAnswer("letdown")} style={{ ...btnGhost, flex: 1 }}>{t.letdown}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

const btnPrimary: React.CSSProperties = { background: "var(--text-primary)", color: "var(--bg)", border: "2px solid var(--text-primary)", borderRadius: 999, boxShadow: "3px 3px 0 var(--shadow, var(--border))", padding: "11px 22px", fontFamily: sans, fontSize: 14, fontWeight: 800, cursor: "pointer" };
const btnGhost: React.CSSProperties = { background: "#fff", color: "var(--text-primary)", border: "2px solid var(--border)", borderRadius: 999, padding: "10px 18px", fontFamily: sans, fontSize: 13, fontWeight: 700, cursor: "pointer" };
const thumb: React.CSSProperties = { background: "none", border: "none", cursor: "pointer", fontSize: 14, padding: 0 };
const overlay: React.CSSProperties = { position: "fixed", inset: 0, zIndex: 60, background: "rgba(10,12,24,0.45)", backdropFilter: "blur(5px)", WebkitBackdropFilter: "blur(5px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 22 };

function ArgInput({ onAdd, placeholder }: { onAdd: (text: string) => void; placeholder: string }) {
  const [v, setV] = useState("");
  const submit = () => { onAdd(v); setV(""); };
  return (
    <input
      value={v}
      onChange={(e) => setV(e.target.value)}
      onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
      onBlur={submit}
      placeholder={placeholder}
      style={{ width: "100%", background: "var(--bg)", border: "1.5px dashed var(--border)", borderRadius: 8, padding: "6px 9px", fontFamily: sans, fontSize: 12.5, color: "var(--text-primary)", outline: "none", marginTop: 4 }}
    />
  );
}
