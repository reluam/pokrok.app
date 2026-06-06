"use client";

import { useEffect, useRef, useState } from "react";
import type { PublicSong } from "@/lib/songsDb";
import type { Lang } from "@/lib/dictionaries";

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };

function fmt(t: number): string {
  if (!isFinite(t) || t < 0) return "0:00";
  const m = Math.floor(t / 60), s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
function fmtDate(iso: string, lang: Lang): string {
  const d = new Date(iso + "T00:00:00");
  return lang === "cs"
    ? d.toLocaleDateString("cs-CZ", { month: "long", year: "numeric" })
    : d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

/** Vlastní mini-přehrávač jednoho songu (mp3). */
export function TrackPlayer({ song, lang }: { song: PublicSong; lang: Lang }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);

  // pauzni, když začne hrát jiný song
  useEffect(() => {
    const onOther = (e: Event) => {
      const id = (e as CustomEvent).detail as string;
      if (id !== song.slug && audioRef.current) audioRef.current.pause();
    };
    window.addEventListener("song-play", onOther);
    return () => window.removeEventListener("song-play", onOther);
  }, [song.slug]);

  const toggle = () => {
    const a = audioRef.current; if (!a) return;
    if (a.paused) {
      window.dispatchEvent(new CustomEvent("song-play", { detail: song.slug }));
      void a.play();
    } else a.pause();
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current; if (!a || !dur) return;
    const rect = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - rect.left) / rect.width) * dur;
  };

  const pct = dur ? (cur / dur) * 100 : 0;

  return (
    <div style={{
      background: "#fff", border: "2.5px solid var(--border)", borderRadius: "16px",
      boxShadow: "4px 4px 0 var(--border)", padding: "16px 18px",
      display: "flex", gap: "16px", alignItems: "center",
    }}>
      <div style={{
        width: 64, height: 64, flexShrink: 0, borderRadius: "10px", overflow: "hidden",
        border: "2px solid var(--border)", background: "var(--bg)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {song.coverUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={song.coverUrl} alt="" width={64} height={64} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
          : <span style={{ fontSize: "26px" }}>🎵</span>}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap", marginBottom: "2px" }}>
          <h3 style={{ ...display, fontSize: "18px", fontWeight: 700, letterSpacing: "-0.01em" }}>{song.title}</h3>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--text-muted)" }}>{fmtDate(song.date, lang)}</span>
        </div>
        {song.note && <p style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.45, marginBottom: "10px" }}>{song.note}</p>}

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={toggle} aria-label={playing ? "pause" : "play"} style={{
            width: 38, height: 38, flexShrink: 0, borderRadius: "50%", cursor: "pointer",
            background: "var(--text-primary)", color: "var(--bg)", border: "none",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px",
          }}>
            {playing ? "❚❚" : "▶"}
          </button>
          <div onClick={seek} style={{ flex: 1, height: 8, background: "rgba(26,22,20,0.12)", borderRadius: "999px", cursor: "pointer", position: "relative" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: "var(--text-primary)", borderRadius: "999px" }} />
          </div>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--text-muted)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{fmt(cur)} / {fmt(dur)}</span>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={song.audioUrl}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setCur(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
        onEnded={() => setPlaying(false)}
      />
    </div>
  );
}
