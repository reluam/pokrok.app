"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  musicUi, midiToName, midiToFreq, drumHits, instrumentLabel, drumLabel,
  SCALE_LABEL, MELODY_STEPS,
  type MusicState, type NoteEvent, type Option,
} from "@/lib/music";
import type { Lang } from "@/lib/dictionaries";

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const serifItalic: React.CSSProperties = { fontFamily: "var(--font-display)", fontStyle: "italic" };

/* ── Web Audio přehrávání songu ───────────────────────────────── */

function playSong(
  events: NoteEvent[], wave: OscillatorType, drums: string, tempo: number,
  onEnd: () => void,
): () => void {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  const master = ctx.createGain(); master.gain.value = 0.7; master.connect(ctx.destination);
  const beat = 60 / tempo;
  const start = ctx.currentTime + 0.08;

  events.forEach((ev, i) => {
    const s = start + i * beat;
    if (ev.type === "note" && ev.midi != null) {
      const osc = ctx.createOscillator(); const g = ctx.createGain();
      osc.type = wave; osc.frequency.value = midiToFreq(ev.midi);
      const d = beat * 0.92;
      g.gain.setValueAtTime(0.0001, s);
      g.gain.linearRampToValueAtTime(0.22, s + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0008, s + d);
      osc.connect(g).connect(master); osc.start(s); osc.stop(s + d + 0.02);
    }
    const hit = drumHits(drums, i);
    if (hit.kick) {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(150, s); o.frequency.exponentialRampToValueAtTime(45, s + 0.16);
      g.gain.setValueAtTime(0.4, s); g.gain.exponentialRampToValueAtTime(0.0008, s + 0.18);
      o.connect(g).connect(master); o.start(s); o.stop(s + 0.2);
    }
    if (hit.snare || hit.hat) {
      const len = Math.ceil(ctx.sampleRate * 0.12);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let k = 0; k < len; k++) data[k] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource(); src.buffer = buf;
      const filt = ctx.createBiquadFilter();
      filt.type = "highpass"; filt.frequency.value = hit.snare ? 1200 : 7000;
      const g = ctx.createGain();
      const dur = hit.snare ? 0.12 : 0.05;
      g.gain.setValueAtTime(hit.snare ? 0.24 : 0.16, s); g.gain.exponentialRampToValueAtTime(0.0008, s + dur);
      src.connect(filt).connect(g).connect(master); src.start(s); src.stop(s + dur + 0.02);
    }
  });

  const totalMs = events.length * beat * 1000 + 300;
  const timer = setTimeout(() => { ctx.close(); onEnd(); }, totalMs);
  return () => { clearTimeout(timer); try { ctx.close(); } catch {} onEnd(); };
}

/* ── Komponenta ────────────────────────────────────────────────── */

export function MusicVoteApp({ lang, initial }: { lang: Lang; initial: MusicState | null }) {
  const t = musicUi[lang];
  const homeHref = lang === "cs" ? "/cs" : "/";

  const [state, setState] = useState<MusicState | null>(initial);
  const [now, setNow] = useState(Date.now());
  const [votedRound, setVotedRound] = useState<number | null>(null);
  const [votedOption, setVotedOption] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch("/api/music/state", { cache: "no-store" });
      if (res.ok) setState(await res.json());
    } catch {}
  }, []);

  // Polling + hodiny
  useEffect(() => {
    const poll = setInterval(fetchState, 2500);
    const clock = setInterval(() => setNow(Date.now()), 250);
    return () => { clearInterval(poll); clearInterval(clock); };
  }, [fetchState]);

  // Načti uložený hlas pro aktuální kolo
  useEffect(() => {
    if (!state?.round) return;
    try {
      const v = localStorage.getItem(`mv-vote-${state.round.id}`);
      if (v) { setVotedRound(state.round.id); setVotedOption(v); }
      else if (votedRound !== state.round.id) { setVotedRound(null); setVotedOption(null); }
    } catch {}
  }, [state?.round?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopPlay = () => { if (stopRef.current) stopRef.current(); stopRef.current = null; setPlayingId(null); };
  useEffect(() => () => stopPlay(), []);

  const play = (id: string, events: NoteEvent[], wave: OscillatorType, drums: string, tempo: number) => {
    stopPlay();
    if (events.length === 0) return;
    setPlayingId(id);
    stopRef.current = playSong(events, wave, drums, tempo, () => setPlayingId(null));
  };

  const vote = async (option: Option) => {
    if (!state?.round || votedRound === state.round.id) return;
    setVotedRound(state.round.id); setVotedOption(option.id);
    try { localStorage.setItem(`mv-vote-${state.round.id}`, option.id); } catch {}
    try {
      await fetch("/api/music/vote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ roundId: state.round.id, optionId: option.id }) });
      fetchState();
    } catch {}
  };

  if (!state) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "var(--font-sans)", color: "var(--text-muted)" }}>…</p>
      </div>
    );
  }

  const { song, round, finished } = state;
  const phaseTitle = round?.phase === "instrument" ? t.phaseInstrument : round?.phase === "drums" ? t.phaseDrums : t.phaseNote;
  const secondsLeft = round ? Math.max(0, Math.ceil((new Date(round.deadline).getTime() - now) / 1000)) : 0;
  const previewWave = song.instrument ?? "sine";
  const previewDrums = song.drums ?? "none";

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <div style={{ padding: "20px 24px 0" }}>
        <Link href={homeHref} style={{ fontFamily: "var(--font-sans)", fontSize: "12px", letterSpacing: "0.04em", color: "var(--text-muted)", textDecoration: "none" }}>{t.back}</Link>
      </div>

      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "28px 24px 80px" }}>
        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.22em", color: "var(--text-muted)", marginBottom: "12px" }}>{t.eyebrow}</p>
          <h1 style={{ ...display, fontSize: "clamp(32px, 7vw, 52px)", fontWeight: 900, lineHeight: 1.02, letterSpacing: "-0.03em", marginBottom: "12px" }}>{t.title}</h1>
          <p style={{ ...serifItalic, fontSize: "16px", color: "var(--text-secondary)", lineHeight: 1.45, maxWidth: "460px", margin: "0 auto" }}>{t.intro}</p>
        </div>

        {/* Song meta */}
        <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap", marginBottom: "20px" }}>
          {[
            { l: t.scale, v: SCALE_LABEL[song.scaleName] ?? song.scaleName },
            { l: t.tempo, v: `${song.tempo} BPM` },
            { l: t.step, v: `${Math.min(song.events.length, MELODY_STEPS)} ${t.of} ${MELODY_STEPS}` },
          ].map((s) => (
            <div key={s.l} style={{ background: "#fff", border: "2px solid var(--border)", borderRadius: "10px", boxShadow: "2px 2px 0 var(--border)", padding: "8px 14px", textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>{s.l}</p>
              <p style={{ ...display, fontSize: "14px", fontWeight: 800 }}>{s.v}</p>
            </div>
          ))}
        </div>

        {/* Melody so far */}
        <div style={{ background: "#fff", border: "2.5px solid var(--border)", borderRadius: "16px", boxShadow: "4px 4px 0 var(--border)", padding: "16px", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>{t.melody}</p>
            <button
              onClick={() => playingId === "current" ? stopPlay() : play("current", song.events, previewWave, previewDrums, song.tempo)}
              disabled={song.events.length === 0}
              style={{ background: playingId === "current" ? "#16A34A" : "var(--text-primary)", color: "#fff", border: "none", borderRadius: "8px", padding: "6px 14px", fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 600, cursor: song.events.length ? "pointer" : "default", opacity: song.events.length ? 1 : 0.4 }}
            >
              {playingId === "current" ? t.stop : t.play}
            </button>
          </div>
          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", alignItems: "flex-end", minHeight: "40px" }}>
            {Array.from({ length: MELODY_STEPS }).map((_, i) => {
              const ev = song.events[i];
              const filled = !!ev;
              const isRest = ev?.type === "rest";
              return (
                <div key={i} style={{
                  minWidth: "34px", height: filled ? (isRest ? "16px" : "34px") : "34px",
                  borderRadius: "6px",
                  background: !filled ? "rgba(26,22,20,0.05)" : isRest ? "rgba(26,22,20,0.12)" : "#16A34A",
                  border: "1.5px solid " + (!filled ? "rgba(26,22,20,0.12)" : "#15803d"),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 700,
                  color: !filled ? "var(--text-muted)" : isRest ? "var(--text-muted)" : "#fff",
                }}>
                  {filled ? (isRest ? "·" : midiToName(ev.midi!)) : i + 1}
                </div>
              );
            })}
          </div>
        </div>

        {/* Voting round */}
        {round && song.status !== "done" && (
          <div style={{ background: "#fff", border: "2.5px solid var(--border)", borderRadius: "18px", boxShadow: "5px 5px 0 var(--border)", padding: "22px", marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
              <h2 style={{ ...display, fontSize: "20px", fontWeight: 800 }}>{phaseTitle}</h2>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: secondsLeft <= 5 ? "#dc2626" : "var(--text-muted)", fontWeight: 600 }}>
                {t.nextIn} {secondsLeft}{t.seconds}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {round.options.map((opt) => {
                const count = round.counts[opt.id] ?? 0;
                const mine = votedRound === round.id && votedOption === opt.id;
                const hasVoted = votedRound === round.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => vote(opt)}
                    disabled={hasVoted}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px",
                      background: mine ? "#DCFCE7" : "#fff",
                      border: `2px solid ${mine ? "#16A34A" : "var(--border)"}`,
                      borderRadius: "12px", boxShadow: `2px 2px 0 ${mine ? "#16A34A" : "var(--border)"}`,
                      padding: "12px 16px", cursor: hasVoted ? "default" : "pointer",
                      fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)",
                      opacity: hasVoted && !mine ? 0.7 : 1, textAlign: "left", width: "100%",
                    }}
                  >
                    <span>{opt.label[lang]}{mine ? ` · ${t.yourVote}` : ""}</span>
                    <span style={{ ...display, fontSize: "15px", fontWeight: 800, color: count > 0 ? "var(--text-primary)" : "var(--text-muted)" }}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Finished songs */}
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
                    <p style={{ ...display, fontSize: "15px", fontWeight: 800 }}>#{f.id} · {SCALE_LABEL[f.scaleName] ?? f.scaleName}</p>
                    <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--text-muted)" }}>
                      {f.tempo} BPM · {instrumentLabel(f.instrument, lang)} · {drumLabel(f.drums, lang)}
                    </p>
                  </div>
                  <button
                    onClick={() => playingId === id ? stopPlay() : play(id, f.events, f.instrument, f.drums, f.tempo)}
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
