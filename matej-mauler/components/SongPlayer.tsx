"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { findInst, emptyTracks, SCALE_LABEL, TRACKS, type SongDetail, type TrackName } from "@/lib/music";
import { startLoop } from "@/lib/musicPlayback";
import type { Lang } from "@/lib/dictionaries";

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const serifItalic: React.CSSProperties = { fontFamily: "var(--font-display)", fontStyle: "italic" };
const TRACK_COLOR: Record<TrackName, string> = { melody: "#16A34A", bass: "#2563EB", pluck: "#9333EA", drums: "#D97706" };

const TXT = {
  cs: { back: "← Skládačka hudby", complete: "Hotový song", building: "Skládá se", parts: "Části", done: "hotovo", pending: "čeká", play: "Přehrát ve smyčce ♪", stop: "Zastavit ■", waiting: "Tento song se ještě skládá. Vrať se později, až přibydou další části.", madeBy: "Tento song vznikl naslepo — každou část tvořil někdo jiný.", trackName: { melody: "Melodie", bass: "Basa", pluck: "Pluck", drums: "Bicí" } as Record<TrackName, string> },
  en: { back: "← Music builder", complete: "Finished song", building: "Assembling", parts: "Parts", done: "done", pending: "pending", play: "Play in loop ♪", stop: "Stop ■", waiting: "This song is still assembling. Come back later as more parts arrive.", madeBy: "This song was made blind — each part by a different person.", trackName: { melody: "Melody", bass: "Bass", pluck: "Pluck", drums: "Drums" } as Record<TrackName, string> },
};

export function SongPlayer({ lang, initial }: { lang: Lang; initial: SongDetail }) {
  const t = TXT[lang];
  const homeHref = "/music";
  const [song, setSong] = useState(initial);
  const [playing, setPlaying] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);

  const stopPlay = () => { if (stopRef.current) stopRef.current(); stopRef.current = null; setPlaying(false); };
  useEffect(() => () => stopPlay(), []);

  const refetch = useCallback(async () => {
    try { const res = await fetch(`/api/music/song/${song.id}`, { cache: "no-store" }); if (res.ok) setSong(await res.json()); } catch {}
  }, [song.id]);

  // Dokud se skládá, občas zkontroluj, jestli už není hotovo
  useEffect(() => {
    if (song.complete) return;
    const p = setInterval(refetch, 5000);
    return () => clearInterval(p);
  }, [song.complete, refetch]);

  const partFor = (tr: TrackName) => song.parts.find((p) => p.track === tr);

  const play = () => {
    stopPlay();
    const tracks = emptyTracks();
    for (const p of song.parts) if (p.done) tracks[p.track] = p.events;
    const inst = (tr: TrackName) => findInst(tr, partFor(tr)?.inst ?? null);
    setPlaying(true);
    stopRef.current = startLoop(tracks, { melody: inst("melody"), bass: inst("bass"), pluck: inst("pluck") }, song.tempo);
  };

  const doneCount = song.parts.filter((p) => p.done).length;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <div style={{ padding: "20px 24px 0" }}>
        <Link href={homeHref} style={{ fontFamily: "var(--font-sans)", fontSize: "12px", letterSpacing: "0.04em", color: "var(--text-muted)", textDecoration: "none" }}>{t.back}</Link>
      </div>

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "32px 24px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.22em", color: song.complete ? "#16A34A" : "var(--text-muted)", marginBottom: "12px" }}>
            {song.complete ? t.complete : `${t.building} · ${doneCount}/${TRACKS.length}`}
          </p>
          <h1 style={{ ...display, fontSize: "clamp(32px, 7vw, 52px)", fontWeight: 900, lineHeight: 1.02, letterSpacing: "-0.03em", marginBottom: "10px" }}>Song #{song.id}</h1>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "14px", color: "var(--text-secondary)" }}>{SCALE_LABEL[song.scaleName] ?? song.scaleName} · {song.tempo} BPM</p>
        </div>

        {song.complete && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
            <button onClick={playing ? stopPlay : play}
              style={{ background: playing ? "#16A34A" : "var(--text-primary)", color: "#fff", border: `2.5px solid ${playing ? "#16A34A" : "var(--text-primary)"}`, borderRadius: "12px", boxShadow: `4px 4px 0 ${playing ? "#15803d" : "var(--text-primary)"}`, padding: "14px 32px", fontFamily: "var(--font-sans)", fontSize: "16px", fontWeight: 700, cursor: "pointer" }}>
              {playing ? t.stop : t.play}
            </button>
          </div>
        )}

        {/* Parts */}
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "12px" }}>{t.parts}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
          {TRACKS.map((tr) => {
            const p = partFor(tr);
            const done = !!p?.done;
            return (
              <div key={tr} style={{ background: "#fff", border: `2px solid ${done ? TRACK_COLOR[tr] : "var(--border)"}`, borderRadius: "12px", boxShadow: `3px 3px 0 ${done ? TRACK_COLOR[tr] : "var(--border)"}`, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: done ? 1 : 0.6 }}>
                <span style={{ ...display, fontSize: "16px", fontWeight: 800, color: done ? TRACK_COLOR[tr] : "var(--text-muted)" }}>
                  {t.trackName[tr]}{done && tr !== "drums" && p ? ` · ${findInst(tr, p.inst).label[lang]}` : ""}
                </span>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 600, color: done ? TRACK_COLOR[tr] : "var(--text-muted)" }}>{done ? `✓ ${t.done}` : t.pending}</span>
              </div>
            );
          })}
        </div>

        <p style={{ ...serifItalic, fontSize: "14px", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.6 }}>
          {song.complete ? t.madeBy : t.waiting}
        </p>
      </div>
    </div>
  );
}
