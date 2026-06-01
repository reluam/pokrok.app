"use client";

import { useRef } from "react";
import {
  TOTAL, SPB, DRUM_IDS, MELODIC_IDS, DRUM_LABEL, LAYER_LABEL, scaleRowsFor, midiToShort,
  type SongState, type DrumId, type MelodicId,
} from "@/lib/radio";
import type { Lang } from "@/lib/dictionaries";

const LAYER_COLOR: Record<string, string> = {
  kick: "#f59e0b", clap: "#ec4899", chat: "#94a3b8", ohat: "#cbd5e1",
  sub: "#2563eb", pad: "#14b8a6", arp: "#06b6d4", pluck: "#9333ea", lead: "#22c55e",
};
const pct = (v: number) => `${(v / TOTAL) * 100}%`;
const ROW_H = 11;

type Props = {
  state: SongState;
  lang: Lang;
  mode: "edit" | "vote";
  votes?: Record<string, number>;
  onCell: (cell: string) => void;
};

export function RadioEditor({ state, lang, mode, votes = {}, onCell }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {/* bar značky */}
      <div style={{ position: "relative", height: 12, marginLeft: 40 }}>
        {Array.from({ length: TOTAL / SPB }).map((_, b) => (
          <span key={b} style={{ position: "absolute", left: pct(b * SPB), fontFamily: "var(--font-sans)", fontSize: 9, color: "var(--text-muted)" }}>{b + 1}</span>
        ))}
      </div>

      {/* drums */}
      {DRUM_IDS.map((lane) => (
        <DrumRow key={lane} lane={lane} state={state} mode={mode} votes={votes} onCell={onCell} label={DRUM_LABEL[lane][lang]} />
      ))}

      {/* melodic */}
      {MELODIC_IDS.map((layer) => (
        <MelGrid key={layer} layer={layer} state={state} mode={mode} votes={votes} onCell={onCell} label={LAYER_LABEL[layer][lang]} />
      ))}
    </div>
  );
}

function DrumRow({ lane, state, mode, votes, onCell, label }: { lane: DrumId; state: SongState; mode: "edit" | "vote"; votes: Record<string, number>; onCell: (c: string) => void; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const color = LAYER_COLOR[lane];
  const pattern = state.drums[lane].pattern;
  const click = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const step = Math.max(0, Math.min(TOTAL - 1, Math.floor(((e.clientX - r.left) / r.width) * TOTAL)));
    onCell(`d:${lane}:${step}`);
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 40, flexShrink: 0, fontFamily: "var(--font-sans)", fontSize: 9, fontWeight: 700, color: "var(--text-secondary)" }}>{label}</span>
      <div ref={ref} onPointerDown={click} style={{ position: "relative", flex: 1, height: 18, background: "rgba(0,0,0,0.04)", borderRadius: 5, cursor: "pointer", touchAction: "none" }}>
        {Array.from({ length: TOTAL / SPB }).map((_, b) => b > 0 && (
          <div key={b} style={{ position: "absolute", left: pct(b * SPB), top: 0, bottom: 0, width: 1, background: "rgba(0,0,0,0.12)" }} />
        ))}
        {pattern.map((on, s) => on && (
          <div key={s} style={{ position: "absolute", left: `calc(${pct(s)} + 1px)`, top: 2, width: `calc(${pct(1)} - 2px)`, height: 14, borderRadius: 3, background: color }} />
        ))}
        {mode === "vote" && Object.entries(votes).map(([cell, c]) => {
          const p = cell.split(":"); if (p[0] !== "d" || p[1] !== lane) return null;
          const s = +p[2];
          return <div key={cell} style={{ position: "absolute", left: `calc(${pct(s)} + 1px)`, top: 2, width: `calc(${pct(1)} - 2px)`, height: 14, borderRadius: 3, border: "2px solid #facc15", boxShadow: "0 0 6px #facc15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 800, color: "#fff" }}>{c}</div>;
        })}
      </div>
    </div>
  );
}

function MelGrid({ layer, state, mode, votes, onCell, label }: { layer: MelodicId; state: SongState; mode: "edit" | "vote"; votes: Record<string, number>; onCell: (c: string) => void; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const color = LAYER_COLOR[layer];
  const rows = [...scaleRowsFor(state.root, state.scaleName)].reverse();
  const H = rows.length * ROW_H;
  const rowTop = (midi: number) => rows.indexOf(midi);
  const notes = state[layer].notes;

  const click = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const step = Math.max(0, Math.min(TOTAL - 1, Math.floor(((e.clientX - r.left) / r.width) * TOTAL)));
    const ri = Math.max(0, Math.min(rows.length - 1, Math.floor((e.clientY - r.top) / ROW_H)));
    onCell(`m:${layer}:${step}:${rows[ri]}`);
  };

  return (
    <div style={{ display: "flex", alignItems: "stretch", gap: 6 }}>
      <span style={{ width: 40, flexShrink: 0, fontFamily: "var(--font-sans)", fontSize: 9, fontWeight: 700, color: "var(--text-secondary)", display: "flex", alignItems: "center" }}>{label}</span>
      <div ref={ref} onPointerDown={click} style={{ position: "relative", flex: 1, height: H, background: "rgba(0,0,0,0.03)", borderRadius: 5, cursor: "pointer", touchAction: "none", overflow: "hidden" }}>
        {rows.map((m, ri) => (
          <div key={m} style={{ position: "absolute", top: ri * ROW_H, left: 0, right: 0, height: ROW_H, background: (((m - state.root) % 12) + 12) % 12 === 0 ? `${color}12` : "transparent", borderBottom: "1px solid rgba(0,0,0,0.03)" }} />
        ))}
        {Array.from({ length: TOTAL / SPB }).map((_, b) => b > 0 && (
          <div key={b} style={{ position: "absolute", left: pct(b * SPB), top: 0, height: H, width: 1, background: "rgba(0,0,0,0.1)" }} />
        ))}
        {notes.map((n, i) => rowTop(n.midi) >= 0 && (
          <div key={i} style={{ position: "absolute", left: `calc(${pct(n.step)} + 1px)`, top: rowTop(n.midi) * ROW_H + 1, width: `calc(${pct(n.dur)} - 2px)`, height: ROW_H - 2, borderRadius: 3, background: color, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)" }} />
        ))}
        {mode === "vote" && Object.entries(votes).map(([cell, c]) => {
          const p = cell.split(":"); if (p[0] !== "m" || p[1] !== layer) return null;
          const top = rowTop(+p[3]); if (top < 0) return null;
          return <div key={cell} style={{ position: "absolute", left: `calc(${pct(+p[2])} + 1px)`, top: top * ROW_H + 1, width: `calc(${pct(1)} - 2px)`, height: ROW_H - 2, borderRadius: 3, border: "1.5px solid #facc15", boxShadow: "0 0 5px #facc15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 800, color: "#facc15" }}>{c}</div>;
        })}
      </div>
    </div>
  );
}
