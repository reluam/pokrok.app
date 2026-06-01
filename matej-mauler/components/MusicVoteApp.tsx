"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  musicUi, midiToName, midiToFreq, findInst, comboHits, SCALE_LABEL, STEPS,
  type MusicState, type Ev, type TrackName, type Option, type Inst,
} from "@/lib/music";
import type { Lang } from "@/lib/dictionaries";

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const serifItalic: React.CSSProperties = { fontFamily: "var(--font-display)", fontStyle: "italic" };

const TRACK_COLOR: Record<TrackName, string> = { melody: "#16A34A", bass: "#2563EB", pluck: "#9333EA", drums: "#D97706" };

/* ── Smyčkové přehrávání ───────────────────────────────────────── */

function startLoop(
  tracks: Record<TrackName, Ev[]>,
  insts: { melody: Inst; bass: Inst; pluck: Inst },
  tempo: number,
): () => void {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  const master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
  const beat = 60 / tempo;
  const bar = STEPS * beat;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout>;

  const noteAt = (ev: Ev, inst: Inst, time: number) => {
    if (ev.type !== "note" || ev.midi == null) return;
    const d = beat * inst.rel;
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = inst.wave; o.frequency.value = midiToFreq(ev.midi);
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(inst.gain, time + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0008, time + d);
    o.connect(g).connect(master); o.start(time); o.stop(time + d + 0.02);
    if (inst.harm) {
      const o2 = ctx.createOscillator(); const g2 = ctx.createGain();
      o2.type = inst.wave; o2.frequency.value = midiToFreq(ev.midi + 12);
      g2.gain.setValueAtTime(0.0001, time);
      g2.gain.linearRampToValueAtTime(inst.gain * 0.4, time + 0.01);
      g2.gain.exponentialRampToValueAtTime(0.0008, time + d * 0.7);
      o2.connect(g2).connect(master); o2.start(time); o2.stop(time + d);
    }
  };

  const drumAt = (combo: string | null, time: number) => {
    for (const h of comboHits(combo ?? "none")) {
      if (h === "kick") {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = "sine"; o.frequency.setValueAtTime(150, time); o.frequency.exponentialRampToValueAtTime(45, time + 0.15);
        g.gain.setValueAtTime(0.42, time); g.gain.exponentialRampToValueAtTime(0.0008, time + 0.17);
        o.connect(g).connect(master); o.start(time); o.stop(time + 0.19);
      } else {
        const len = Math.ceil(ctx.sampleRate * 0.12);
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let k = 0; k < len; k++) data[k] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource(); src.buffer = buf;
        const filt = ctx.createBiquadFilter();
        filt.type = "highpass"; filt.frequency.value = h === "clap" ? 1200 : 7000;
        const g = ctx.createGain();
        const dur = h === "clap" ? 0.13 : 0.05;
        g.gain.setValueAtTime(h === "clap" ? 0.26 : 0.16, time);
        g.gain.exponentialRampToValueAtTime(0.0008, time + dur);
        src.connect(filt).connect(g).connect(master); src.start(time); src.stop(time + dur + 0.02);
      }
    }
  };

  const scheduleBar = (barStart: number) => {
    (["melody", "bass", "pluck"] as TrackName[]).forEach((tr) => {
      for (const ev of tracks[tr]) noteAt(ev, insts[tr as "melody" | "bass" | "pluck"], barStart + ev.position * beat);
    });
    for (const ev of tracks.drums) drumAt(ev.combo, barStart + ev.position * beat);
  };

  let next = ctx.currentTime + 0.12;
  const tick = () => {
    if (stopped) return;
    scheduleBar(next);
    next += bar;
    timer = setTimeout(tick, bar * 1000 - 60);
  };
  tick();

  return () => { stopped = true; clearTimeout(timer); try { ctx.close(); } catch {} };
}

/* ── Komponenta ────────────────────────────────────────────────── */

export function MusicVoteApp({ lang, initial }: { lang: Lang; initial: MusicState | null }) {
  const t = musicUi[lang];
  const homeHref = lang === "cs" ? "/cs" : "/";

  const [state, setState] = useState<MusicState | null>(initial);
  const [busy, setBusy] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const busyRef = useRef(false);

  const fetchState = useCallback(async () => {
    if (busyRef.current) return;
    try { const res = await fetch("/api/music/state", { cache: "no-store" }); if (res.ok) setState(await res.json()); } catch {}
  }, []);

  useEffect(() => { const p = setInterval(fetchState, 2000); return () => clearInterval(p); }, [fetchState]);

  const stopPlay = () => { if (stopRef.current) stopRef.current(); stopRef.current = null; setPlayingId(null); };
  useEffect(() => () => stopPlay(), []);

  const playLoop = (id: string, tracks: Record<TrackName, Ev[]>, melodyId: string | null, bassId: string | null, pluckId: string | null, tempo: number) => {
    stopPlay();
    setPlayingId(id);
    stopRef.current = startLoop(tracks, {
      melody: findInst("melody", melodyId), bass: findInst("bass", bassId), pluck: findInst("pluck", pluckId),
    }, tempo);
  };

  const commit = async (opt: Option) => {
    if (!state || busyRef.current) return;
    busyRef.current = true; setBusy(true);
    try {
      const res = await fetch("/api/music/commit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId: state.song.id, phase: state.phase, stepIndex: state.stepIndex, optionId: opt.id }),
      });
      if (res.ok) setState(await res.json());
    } catch {}
    busyRef.current = false; setBusy(false);
  };

  if (!state) {
    return <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}><p style={{ fontFamily: "var(--font-sans)", color: "var(--text-muted)" }}>…</p></div>;
  }

  const { song, phase, stepIndex, options, finished } = state;
  const isDrums = phase === "drums";
  const isInst = phase.endsWith("_inst");

  const trackCell = (tr: TrackName, ev: Ev | undefined, i: number) => {
    const filled = !!ev;
    const isRest = ev?.type === "rest";
    const isEmptyDrum = ev?.type === "drum" && (!ev.combo || ev.combo === "none");
    let txt = String(i + 1);
    if (filled) {
      if (tr === "drums") txt = isEmptyDrum ? "·" : (ev!.combo ?? "").split("_").map((p) => p[0]?.toUpperCase()).join("");
      else txt = isRest ? "·" : midiToName(ev!.midi!).replace(/[0-9]/g, "");
    }
    const active = filled && !isRest && !isEmptyDrum;
    return (
      <div key={i} style={{
        minWidth: "26px", height: "26px", borderRadius: "5px",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-sans)", fontSize: "9px", fontWeight: 700,
        background: !filled ? "rgba(26,22,20,0.05)" : active ? TRACK_COLOR[tr] : "rgba(26,22,20,0.1)",
        color: active ? "#fff" : "var(--text-muted)",
        border: "1px solid " + (!filled ? "rgba(26,22,20,0.1)" : active ? TRACK_COLOR[tr] : "rgba(26,22,20,0.15)"),
      }}>{txt}</div>
    );
  };

  const trackGrid = (tr: TrackName) => (
    <div key={tr} style={{ marginBottom: "8px" }}>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: TRACK_COLOR[tr], marginBottom: "4px" }}>
        {t.trackName[tr]}{tr !== "drums" ? ` · ${findInst(tr, tr === "melody" ? song.melodyInst : tr === "bass" ? song.bassInst : song.pluckInst).label[lang]}` : ""}
      </p>
      <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
        {Array.from({ length: STEPS }).map((_, i) => trackCell(tr, song.tracks[tr][i], i))}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <div style={{ padding: "20px 24px 0" }}>
        <Link href={homeHref} style={{ fontFamily: "var(--font-sans)", fontSize: "12px", letterSpacing: "0.04em", color: "var(--text-muted)", textDecoration: "none" }}>{t.back}</Link>
      </div>

      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "28px 24px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.22em", color: "var(--text-muted)", marginBottom: "12px" }}>{t.eyebrow}</p>
          <h1 style={{ ...display, fontSize: "clamp(32px, 7vw, 52px)", fontWeight: 900, lineHeight: 1.02, letterSpacing: "-0.03em", marginBottom: "12px" }}>{t.title}</h1>
          <p style={{ ...serifItalic, fontSize: "16px", color: "var(--text-secondary)", lineHeight: 1.45, maxWidth: "460px", margin: "0 auto" }}>{t.intro}</p>
        </div>

        {/* meta */}
        <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap", marginBottom: "18px" }}>
          {[
            { l: t.scale, v: SCALE_LABEL[song.scaleName] ?? song.scaleName },
            { l: t.tempo, v: `${song.tempo} BPM` },
          ].map((s) => (
            <div key={s.l} style={{ background: "#fff", border: "2px solid var(--border)", borderRadius: "10px", boxShadow: "2px 2px 0 var(--border)", padding: "8px 14px", textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>{s.l}</p>
              <p style={{ ...display, fontSize: "14px", fontWeight: 800 }}>{s.v}</p>
            </div>
          ))}
        </div>

        {/* Decision */}
        <div style={{ background: "#fff", border: "2.5px solid var(--border)", borderRadius: "18px", boxShadow: "5px 5px 0 var(--border)", padding: "20px", marginBottom: "18px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: "6px", marginBottom: "6px" }}>
            <h2 style={{ ...display, fontSize: "19px", fontWeight: 800 }}>{t.phase[phase]}</h2>
            {!isInst && <span style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text-muted)" }}>{t.step} {stepIndex + 1} {t.of} {STEPS}</span>}
          </div>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--text-muted)", marginBottom: "14px" }}>{t.firstClick}</p>

          <div style={{ display: "grid", gridTemplateColumns: isInst || isDrums ? "repeat(auto-fit, minmax(130px, 1fr))" : "repeat(auto-fit, minmax(110px, 1fr))", gap: "8px" }}>
            {options.map((opt) => (
              <button key={opt.id} onClick={() => commit(opt)} disabled={busy}
                style={{
                  background: "#fff", border: "2px solid var(--border)", borderRadius: "12px",
                  boxShadow: "2px 2px 0 var(--border)", padding: "12px 10px",
                  fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)",
                  cursor: busy ? "default" : "pointer", opacity: busy ? 0.5 : 1, transition: "transform 120ms ease",
                }}
                onMouseEnter={(e) => { if (!busy) e.currentTarget.style.transform = "translate(-1px,-1px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
              >
                {opt.label[lang]}
              </button>
            ))}
          </div>
        </div>

        {/* Tracks + play */}
        <div style={{ background: "#fff", border: "2.5px solid var(--border)", borderRadius: "16px", boxShadow: "4px 4px 0 var(--border)", padding: "16px", marginBottom: "28px" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
            <button
              onClick={() => playingId === "current" ? stopPlay() : playLoop("current", song.tracks, song.melodyInst, song.bassInst, song.pluckInst, song.tempo)}
              style={{ background: playingId === "current" ? "#16A34A" : "var(--text-primary)", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 16px", fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
            >
              {playingId === "current" ? t.stop : t.play}
            </button>
          </div>
          {(["melody", "bass", "pluck", "drums"] as TrackName[]).map(trackGrid)}
        </div>

        {/* Finished */}
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "12px" }}>{t.finishedTitle}</p>
        {finished.length === 0 ? (
          <p style={{ ...serifItalic, fontSize: "15px", color: "var(--text-muted)", marginBottom: "24px" }}>{t.finishedEmpty}</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
            {finished.map((f) => {
              const id = `f-${f.id}`;
              return (
                <div key={f.id} style={{ background: "#fff", border: "2px solid var(--border)", borderRadius: "12px", boxShadow: "3px 3px 0 var(--border)", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                  <div>
                    <p style={{ ...display, fontSize: "15px", fontWeight: 800 }}>#{f.id} · {SCALE_LABEL[f.scaleName] ?? f.scaleName} · {f.tempo} BPM</p>
                    <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--text-muted)" }}>
                      {findInst("melody", f.melodyInst).label[lang]} · {findInst("bass", f.bassInst).label[lang]} · {findInst("pluck", f.pluckInst).label[lang]}
                    </p>
                  </div>
                  <button
                    onClick={() => playingId === id ? stopPlay() : playLoop(id, f.tracks, f.melodyInst, f.bassInst, f.pluckInst, f.tempo)}
                    style={{ background: playingId === id ? "#16A34A" : "var(--text-primary)", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 14px", fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 600, cursor: "pointer", flexShrink: 0 }}
                  >
                    {playingId === id ? t.stop : t.play}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <p style={{ ...serifItalic, fontSize: "13px", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.6 }}>{t.disclaimer}</p>
      </div>
    </div>
  );
}
