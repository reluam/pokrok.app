"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  radioUi, DRUM_IDS, MELODIC_IDS, DRUM_LABEL, LAYER_LABEL,
  genSong, serverStateAt, serverRoundSec, toggleNote, toggleDrumCell, TOTAL,
  type SongState, type LayerId, type DrumId, type MelodicId,
} from "@/lib/radio";
import { createRadio, type RadioControl } from "@/lib/radioEngine";
import { RadioEditor } from "./RadioEditor";
import type { Lang } from "@/lib/dictionaries";

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const serifItalic: React.CSSProperties = { fontFamily: "var(--font-display)", fontStyle: "italic" };
const LAYER_COLOR: Record<LayerId, string> = {
  kick: "#f59e0b", clap: "#ec4899", chat: "#94a3b8", ohat: "#cbd5e1",
  sub: "#2563eb", pad: "#14b8a6", arp: "#06b6d4", pluck: "#9333ea", lead: "#22c55e",
};
const card: React.CSSProperties = { background: "#fff", border: "2px solid var(--border)", borderRadius: "14px", boxShadow: "3px 3px 0 var(--border)", padding: "14px" };
const lab: React.CSSProperties = { fontFamily: "var(--font-sans)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" };

type View = "gate" | "select" | "server" | "my" | "shared";
type Ripple = { x: number; y: number; r: number; maxR: number; color: string; born: number };
type LogItem = { label: { cs: string; en: string }; at: number };

function editCell(state: SongState, cell: string): SongState {
  const s: SongState = JSON.parse(JSON.stringify(state));
  const p = cell.split(":");
  if (p[0] === "d") { const lane = p[1] as DrumId; s.drums[lane].pattern = toggleDrumCell(s.drums[lane].pattern, +p[2]); s.drums[lane].muted = false; }
  else { const l = p[1] as MelodicId; s[l].notes = toggleNote(s[l].notes, +p[2], +p[3]); s[l].muted = false; }
  return s;
}

export function RadioApp({ lang }: { lang: Lang }) {
  const t = radioUi[lang];
  const homeHref = lang === "cs" ? "/cs" : "/";

  const [view, setView] = useState<View>("gate");
  const [song, setSong] = useState<SongState | null>(null);
  const [log, setLog] = useState<LogItem[]>([]);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [secLeft, setSecLeft] = useState(0);

  const ctrlRef = useRef<RadioControl | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ripplesRef = useRef<Ripple[]>([]);
  const rafRef = useRef<number | null>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const startRef = useRef(0);

  // state sources
  const serverRef = useRef<{ r: number; state: SongState }>({ r: 0, state: genSong() });
  const myRef = useRef<SongState>(genSong());
  const sharedRef = useRef<SongState>(genSong());
  const sharedMeta = useRef<{ roundNo: number; deadline: number }>({ roundNo: 0, deadline: 0 });
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopEngine = () => {
    ctrlRef.current?.stop(); ctrlRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null;
    ripplesRef.current = [];
  };
  const stopAll = () => { stopEngine(); if (pollRef.current) clearInterval(pollRef.current); pollRef.current = null; };
  useEffect(() => () => stopAll(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const spawn = (layer: LayerId, midi: number | null) => {
    const cv = canvasRef.current; if (!cv) return;
    const w = cv.width, h = cv.height;
    const isDrum = (DRUM_IDS as string[]).includes(layer);
    let x: number, y: number, maxR: number;
    if (isDrum) {
      const idx = DRUM_IDS.indexOf(layer as never);
      x = w * (0.14 + idx * 0.06) + (Math.random() - 0.5) * 26; y = h * 0.84 + (Math.random() - 0.5) * 20;
      maxR = layer === "kick" ? w * 0.14 : 50;
    } else {
      const norm = midi != null ? Math.max(0, Math.min(1, (midi - 36) / 60)) : 0.5;
      x = w * (0.08 + norm * 0.84);
      y = h * (layer === "sub" ? 0.62 : layer === "pad" ? 0.5 : layer === "arp" ? 0.36 : layer === "pluck" ? 0.3 : 0.18) + (Math.random() - 0.5) * 24;
      maxR = layer === "sub" ? 90 : 55;
    }
    ripplesRef.current.push({ x, y, r: 4, maxR, color: LAYER_COLOR[layer], born: performance.now() });
    if (ripplesRef.current.length > 110) ripplesRef.current.splice(0, ripplesRef.current.length - 110);
  };

  const draw = () => {
    const cv = canvasRef.current, ctrl = ctrlRef.current;
    if (!cv || !ctrl) return;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    const w = cv.width, h = cv.height;
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#070b18"); g.addColorStop(1, "#141a30");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const freq = new Uint8Array(ctrl.analyser.frequencyBinCount); ctrl.analyser.getByteFrequencyData(freq);
    const bars = 64, bw = w / bars;
    for (let i = 0; i < bars; i++) {
      const v = freq[Math.floor((i / bars) * (freq.length * 0.7))] / 255; const bh = v * h * 0.4;
      ctx.fillStyle = `hsla(${200 + (i / bars) * 120}, 80%, ${40 + v * 30}%, ${0.35 + v * 0.4})`;
      ctx.fillRect(i * bw, h - bh, bw - 1, bh);
    }
    const td = new Uint8Array(ctrl.analyser.fftSize); ctrl.analyser.getByteTimeDomainData(td);
    ctx.lineWidth = 1.5; ctx.strokeStyle = "rgba(255,255,255,0.16)"; ctx.beginPath();
    for (let i = 0; i < td.length; i += 2) { const x = (i / td.length) * w; const y = h * 0.4 + (td[i] / 128 - 1) * (h * 0.18); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.stroke();
    const now = performance.now(); const alive: Ripple[] = [];
    for (const rp of ripplesRef.current) {
      const age = (now - rp.born) / 950; if (age >= 1) continue;
      rp.r = 4 + age * rp.maxR; const a = (1 - age) * 0.75; const hex = Math.round(a * 255).toString(16).padStart(2, "0");
      ctx.beginPath(); ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2); ctx.strokeStyle = rp.color + hex; ctx.lineWidth = 2.5 * (1 - age) + 0.5; ctx.stroke();
      alive.push(rp);
    }
    ripplesRef.current = alive;
    if (timeRef.current) { const s = Math.floor((now - startRef.current) / 1000); timeRef.current.textContent = `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; }
    rafRef.current = requestAnimationFrame(draw);
  };

  // ── Spuštění stanic ──
  const onHit = (layer: LayerId, midi: number | null, whenSec: number) => {
    const delay = Math.max(0, (whenSec - (ctrlRef.current?.audioTime() ?? whenSec)) * 1000);
    window.setTimeout(() => spawn(layer, midi), delay);
  };

  const startServer = () => {
    stopEngine();
    const roundSec = serverRoundSec();
    const elapsed = Date.now() / 1000;
    const r = Math.floor(elapsed / roundSec);
    serverRef.current = { r, state: serverStateAt(r).state };
    setSong({ ...serverRef.current.state }); setLog([]);
    const startStep = Math.floor(((elapsed % roundSec) / roundSec) * TOTAL);
    startRef.current = performance.now();
    ctrlRef.current = createRadio({
      getState: () => serverRef.current.state,
      startStep,
      onHit,
      onBar: () => {
        serverRef.current.r += 1;
        const nx = serverStateAt(serverRef.current.r);
        serverRef.current.state = nx.state;
        setSong({ ...nx.state }); setLog((p) => [{ label: nx.label, at: performance.now() }, ...p].slice(0, 12));
      },
    });
  };

  const startMy = () => {
    stopEngine();
    myRef.current = genSong();
    setSong({ ...myRef.current }); setLog([]);
    startRef.current = performance.now();
    ctrlRef.current = createRadio({ getState: () => myRef.current, onHit });
  };

  const startShared = () => {
    stopEngine();
    startRef.current = performance.now();
    ctrlRef.current = createRadio({ getState: () => sharedRef.current, onHit });
    const poll = async () => {
      try {
        const res = await fetch("/api/radio/state", { cache: "no-store" });
        if (!res.ok) return;
        const d = await res.json();
        sharedRef.current = d.state; setSong({ ...d.state });
        const vm: Record<string, number> = {}; for (const v of d.votes) vm[v.cell] = v.count; setVotes(vm);
        sharedMeta.current = { roundNo: d.roundNo, deadline: new Date(d.deadline).getTime() };
      } catch {}
    };
    poll();
    pollRef.current = setInterval(poll, 1500);
  };

  // countdown for shared
  useEffect(() => {
    if (view !== "shared") return;
    const i = setInterval(() => setSecLeft(Math.max(0, Math.ceil((sharedMeta.current.deadline - Date.now()) / 1000))), 250);
    return () => clearInterval(i);
  }, [view]);

  // spusť vizualizaci až po mountu canvasu
  useEffect(() => {
    if (view !== "server" && view !== "my" && view !== "shared") return;
    const id = requestAnimationFrame(() => { if (!rafRef.current) draw(); });
    return () => cancelAnimationFrame(id);
  }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  const enterGate = () => { setView("select"); startServer(); };
  const goSelect = () => { setView("select"); if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } startServer(); };
  const enter = (v: View) => {
    setView(v);
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (v === "server") startServer();
    else if (v === "my") startMy();
    else if (v === "shared") startShared();
  };

  const myEdit = (cell: string) => { myRef.current = editCell(myRef.current, cell); setSong({ ...myRef.current }); };
  const sharedVote = (cell: string) => {
    setVotes((p) => ({ ...p, [cell]: (p[cell] ?? 0) + 1 }));
    fetch("/api/radio/vote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ roundNo: sharedMeta.current.roundNo, cell }) }).catch(() => {});
  };

  // canvas sizing
  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const resize = () => { const r = cv.getBoundingClientRect(); cv.width = r.width; cv.height = r.height; };
    resize(); window.addEventListener("resize", resize); return () => window.removeEventListener("resize", resize);
  }, [view]);

  const noteName = (root: number) => ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][((root % 12) + 12) % 12];

  /* ── GATE ── */
  if (view === "gate") {
    return (
      <Shell t={t} homeHref={homeHref}>
        <div style={{ textAlign: "center", paddingTop: "60px" }}>
          <h1 style={{ ...display, fontSize: "clamp(36px, 8vw, 64px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: "12px" }}>{t.title}</h1>
          <p style={{ ...serifItalic, fontSize: "17px", color: "var(--text-secondary)", marginBottom: "32px" }}>{t.intro}</p>
          <button onClick={enterGate} style={{ background: "var(--text-primary)", color: "var(--bg)", border: "2.5px solid var(--text-primary)", borderRadius: "12px", boxShadow: "5px 5px 0 var(--text-primary)", padding: "16px 38px", fontFamily: "var(--font-sans)", fontSize: "17px", fontWeight: 800, cursor: "pointer" }}>{t.start}</button>
        </div>
      </Shell>
    );
  }

  /* ── SELECT ── */
  if (view === "select") {
    const modes: { id: View; m: { title: string; desc: string }; emoji: string }[] = [
      { id: "server", m: t.modes.server, emoji: "📡" },
      { id: "my", m: t.modes.my, emoji: "🎛️" },
      { id: "shared", m: t.modes.shared, emoji: "🗳️" },
    ];
    return (
      <Shell t={t} homeHref={homeHref}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--text-muted)", textAlign: "center", marginBottom: "16px" }}>🔊 {t.modes.server.title} — {lang === "cs" ? "hraje na pozadí" : "playing in background"}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
          {modes.map(({ id, m, emoji }) => (
            <button key={id} onClick={() => enter(id)} style={{ ...card, textAlign: "left", cursor: "pointer", display: "flex", flexDirection: "column", gap: "8px", minHeight: "160px" }}>
              <span style={{ fontSize: "34px" }}>{emoji}</span>
              <span style={{ ...display, fontSize: "20px", fontWeight: 800 }}>{m.title}</span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>{m.desc}</span>
              <span style={{ marginTop: "auto", fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>{t.enter}</span>
            </button>
          ))}
        </div>
      </Shell>
    );
  }

  /* ── STATION ── */
  const showEditor = view === "my" || view === "shared";
  return (
    <Shell t={t} homeHref={homeHref}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <button onClick={goSelect} style={{ background: "transparent", border: "none", fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--text-muted)", cursor: "pointer" }}>← {lang === "cs" ? "stanice" : "stations"}</button>
        <span style={{ ...display, fontSize: "18px", fontWeight: 800 }}>{t.modes[view as "server" | "my" | "shared"].title}</span>
        {view === "shared" ? <span style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: secLeft <= 3 ? "#dc2626" : "var(--text-muted)", fontWeight: 700 }}>{t.nextIn} {secLeft}s</span> : <span ref={timeRef} style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text-muted)" }}>00:00</span>}
      </div>

      <div style={{ position: "relative", border: "2.5px solid var(--border)", borderRadius: "16px", boxShadow: "5px 5px 0 var(--border)", overflow: "hidden", background: "#070b18" }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: showEditor ? "30vh" : "46vh", minHeight: "220px", display: "block" }} />
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
        <div style={{ ...card, flex: 1, display: "flex", justifyContent: "space-around", textAlign: "center", minWidth: "200px" }}>
          <div><p style={lab}>{t.tempo}</p><p style={{ ...display, fontSize: "20px", fontWeight: 800 }}>{song?.tempo ?? "—"}</p></div>
          <div><p style={lab}>{t.key}</p><p style={{ ...display, fontSize: "20px", fontWeight: 800 }}>{song ? `${noteName(song.root)}${song.scaleName.includes("minor") ? "m" : ""}` : "—"}</p></div>
        </div>
        {!showEditor && (
          <div style={{ ...card, flex: 2, minWidth: "240px" }}>
            <p style={{ ...lab, marginBottom: "6px" }}>{t.changelog}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px", maxHeight: "120px", overflowY: "auto" }}>
              {log.length === 0 ? <span style={{ ...serifItalic, fontSize: "13px", color: "var(--text-muted)" }}>—</span> :
                log.map((it, i) => <span key={i} style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: i === 0 ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: i === 0 ? 700 : 400 }}>{it.label[lang]}</span>)}
            </div>
          </div>
        )}
      </div>

      {showEditor && song && (
        <div style={{ ...card, marginTop: "12px" }}>
          <p style={{ ...lab, marginBottom: "8px" }}>{t.hint}</p>
          <RadioEditor state={song} lang={lang} mode={view === "shared" ? "vote" : "edit"} votes={view === "shared" ? votes : undefined} onCell={view === "shared" ? sharedVote : myEdit} />
        </div>
      )}
    </Shell>
  );
}

function Shell({ t, homeHref, children }: { t: { back: string; eyebrow: string }; homeHref: string; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <div style={{ padding: "16px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href={homeHref} style={{ fontFamily: "var(--font-sans)", fontSize: "12px", letterSpacing: "0.04em", color: "var(--text-muted)", textDecoration: "none" }}>{t.back}</Link>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.22em", color: "var(--text-muted)" }}>{t.eyebrow}</span>
      </div>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "16px 24px 50px" }}>{children}</div>
    </div>
  );
}
