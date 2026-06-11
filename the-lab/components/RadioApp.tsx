"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  radioUi, DRUM_IDS, MELODIC_IDS, DRUM_LABEL, LAYER_LABEL,
  genSong, serverRoundSec, SERVER_TEMPO, TOTAL,
  type SongState, type LayerId, type DrumId, type MelodicId,
} from "@/lib/radio";
import { createRadio, type RadioControl } from "@/lib/radioEngine";
import { RadioEditor } from "./RadioEditor";
import type { Lang } from "@/lib/lang";

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const serifItalic: React.CSSProperties = { fontFamily: "var(--font-display)", fontStyle: "italic" };
const LAYER_COLOR: Record<LayerId, string> = {
  kick: "#f59e0b", clap: "#ec4899", chat: "#94a3b8", ohat: "#cbd5e1",
  sub: "#2563eb", pad: "#14b8a6", arp: "#06b6d4", pluck: "#9333ea", lead: "#22c55e",
};
const card: React.CSSProperties = { background: "#fff", border: "2px solid var(--border)", borderRadius: "14px", boxShadow: "3px 3px 0 var(--border)", padding: "14px" };
const lab: React.CSSProperties = { fontFamily: "var(--font-sans)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" };

type Ripple = { x: number; y: number; r: number; maxR: number; color: string; born: number };

/** Jedno serverové rádio: hraje pro všechny stejně (kola ukotvená na čas),
    posluchač se připojí k session a hlasuje o změnách. Zvuk startuje až po modálu. */
export function RadioApp({ lang }: { lang: Lang }) {
  const t = radioUi[lang];
  const homeHref = "/";

  const [entered, setEntered] = useState(false);
  const [song, setSong] = useState<SongState | null>(null);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [secLeft, setSecLeft] = useState(0);

  const [, forceMute] = useState(0);
  const mutedRef = useRef<Set<LayerId>>(new Set());
  const isMuted = (l: LayerId) => mutedRef.current.has(l);
  const toggleMute = (l: LayerId) => { const s = mutedRef.current; if (s.has(l)) s.delete(l); else s.add(l); forceMute((x) => x + 1); };

  const ctrlRef = useRef<RadioControl | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ripplesRef = useRef<Ripple[]>([]);
  const rafRef = useRef<number | null>(null);

  const sharedRef = useRef<SongState>(genSong());
  const sharedMeta = useRef<{ roundNo: number; deadline: number }>({ roundNo: 0, deadline: 0 });
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAll = () => {
    ctrlRef.current?.stop(); ctrlRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null;
    if (pollRef.current) clearInterval(pollRef.current); pollRef.current = null;
    ripplesRef.current = [];
  };
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
    for (let i = 0; i < td.length; i += 2) { const x = (i / td.length) * w; const y = h * 0.4 + (td[i] / 128 - 1) * (h * 0.18); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    ctx.stroke();
    const now = performance.now(); const alive: Ripple[] = [];
    for (const rp of ripplesRef.current) {
      const age = (now - rp.born) / 950; if (age >= 1) continue;
      rp.r = 4 + age * rp.maxR; const a = (1 - age) * 0.75; const hex = Math.round(a * 255).toString(16).padStart(2, "0");
      ctx.beginPath(); ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2); ctx.strokeStyle = rp.color + hex; ctx.lineWidth = 2.5 * (1 - age) + 0.5; ctx.stroke();
      alive.push(rp);
    }
    ripplesRef.current = alive;
    rafRef.current = requestAnimationFrame(draw);
  };

  const onHit = (layer: LayerId, midi: number | null, whenSec: number) => {
    const delay = Math.max(0, (whenSec - (ctrlRef.current?.audioTime() ?? whenSec)) * 1000);
    window.setTimeout(() => spawn(layer, midi), delay);
  };

  /** Připojení k serverové session: engine startuje ve fázi odvozené z hodin (kola jsou epoch-anchored). */
  const enter = () => {
    stopAll();
    const roundSec = serverRoundSec();
    sharedRef.current.tempo = SERVER_TEMPO;
    const phase = (Date.now() / 1000) % roundSec;
    const startStep = Math.floor((phase / roundSec) * TOTAL) % TOTAL;
    ctrlRef.current = createRadio({ getState: () => sharedRef.current, startStep, onHit, isMuted });
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
    setEntered(true);
  };

  // odpočet do další změny
  useEffect(() => {
    if (!entered) return;
    const i = setInterval(() => setSecLeft(Math.max(0, Math.ceil((sharedMeta.current.deadline - Date.now()) / 1000))), 250);
    return () => clearInterval(i);
  }, [entered]);

  // vizualizace po mountu canvasu
  useEffect(() => {
    if (!entered) return;
    const id = requestAnimationFrame(() => { if (!rafRef.current) draw(); });
    return () => cancelAnimationFrame(id);
  }, [entered]); // eslint-disable-line react-hooks/exhaustive-deps

  const vote = (cell: string) => {
    setVotes((p) => ({ ...p, [cell]: (p[cell] ?? 0) + 1 }));
    fetch("/api/radio/vote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ roundNo: sharedMeta.current.roundNo, cell }) }).catch(() => {});
  };

  // canvas sizing
  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const resize = () => { const r = cv.getBoundingClientRect(); cv.width = r.width; cv.height = r.height; };
    resize(); window.addEventListener("resize", resize); return () => window.removeEventListener("resize", resize);
  }, [entered]);

  const noteName = (root: number) => ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][((root % 12) + 12) % 12];

  return (
    <Shell t={t} homeHref={homeHref}>
      {/* zvukový modál — zvuk se zapne až po vstupu */}
      {!entered && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(10,12,24,0.55)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div style={{ ...card, maxWidth: 440, width: "100%", textAlign: "center", padding: "30px 28px", animation: "radioModalIn 360ms cubic-bezier(0.22,1,0.36,1)" }}>
            <p style={{ fontSize: "40px", margin: "0 0 8px" }}>🎧</p>
            <h1 style={{ ...display, fontSize: "26px", fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 8px" }}>{t.modalTitle}</h1>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 6px" }}>{t.modalText}</p>
            <p style={{ ...serifItalic, fontSize: "13px", color: "var(--text-muted)", margin: "0 0 20px" }}>{t.intro}</p>
            <button onClick={enter} style={{ background: "var(--text-primary)", color: "var(--bg)", border: "2.5px solid var(--text-primary)", borderRadius: "12px", boxShadow: "5px 5px 0 var(--text-primary)", padding: "14px 36px", fontFamily: "var(--font-sans)", fontSize: "16px", fontWeight: 800, cursor: "pointer" }}>{t.enter}</button>
          </div>
          <style>{`@keyframes radioModalIn { from { opacity: 0; transform: translateY(26px) scale(0.96); } to { opacity: 1; transform: none; } }`}</style>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <span style={{ ...display, fontSize: "18px", fontWeight: 800 }}>{t.title}</span>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: secLeft <= 2 ? "#dc2626" : "var(--text-muted)", fontWeight: 700 }}>{t.nextIn} {entered ? `${secLeft}s` : "—"}</span>
      </div>

      <div style={{ position: "relative", border: "2.5px solid var(--border)", borderRadius: "16px", boxShadow: "5px 5px 0 var(--border)", overflow: "hidden", background: "#070b18" }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "30vh", minHeight: "220px", display: "block" }} />
      </div>

      {/* mute toolbar — každá stopa (jen lokální poslech) */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
        {([...DRUM_IDS, ...MELODIC_IDS] as LayerId[]).map((id) => {
          const m = mutedRef.current.has(id);
          const isDrum = (DRUM_IDS as string[]).includes(id);
          const label = isDrum ? DRUM_LABEL[id as DrumId][lang] : LAYER_LABEL[id as MelodicId][lang];
          return (
            <button key={id} onClick={() => toggleMute(id)} title={m ? t.on : t.muted}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", border: `2px solid ${m ? "var(--border)" : LAYER_COLOR[id]}`, background: m ? "rgba(0,0,0,0.04)" : "#fff", borderRadius: "999px", padding: "6px 12px", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 600, color: m ? "var(--text-muted)" : "var(--text-primary)", opacity: m ? 0.6 : 1, textDecoration: m ? "line-through" : "none" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: m ? "var(--text-muted)" : LAYER_COLOR[id] }} />
              {label}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
        <div style={{ ...card, flex: 1, display: "flex", justifyContent: "space-around", textAlign: "center", minWidth: "200px" }}>
          <div><p style={lab}>{t.tempo}</p><p style={{ ...display, fontSize: "20px", fontWeight: 800 }}>{song?.tempo ?? "—"}</p></div>
          <div><p style={lab}>{t.key}</p><p style={{ ...display, fontSize: "20px", fontWeight: 800 }}>{song ? `${noteName(song.root)}${song.scaleName.includes("minor") ? "m" : ""}` : "—"}</p></div>
        </div>
      </div>

      {song && (
        <div style={{ ...card, marginTop: "12px" }}>
          <p style={{ ...lab, marginBottom: "8px" }}>{t.hint}</p>
          <RadioEditor state={song} lang={lang} mode="vote" votes={votes} onCell={vote} />
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
