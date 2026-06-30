"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PromptRegistration } from "@/components/PromptRegistration";
import { track } from "@/lib/analytics/track";
import {
  computeMirror,
  shuffledScenarios,
  SCENARIOS,
  type Decision,
  type Scenario,
} from "@/lib/priceOfALife";

// ── palette ──────────────────────────────────────────────────────────────────
const C = {
  cream: "#FBF8F1",
  ink: "#1A1A18",
  sub: "#8A8475",
  line: "#E4DECF",
  track: "#ECE7DC",
  green: "#3F8F6B",
  greenSoft: "#E4EFE8",
  red: "#B4503F",
  redSoft: "#F3E4E0",
};

// Short chart labels keyed by slug (the situation text is too long for the axis).
const SHORT: Record<string, string> = {
  vaccination: "vaccination (abroad)",
  "traffic-lights": "traffic lights",
  "icu-beds": "ICU beds",
  "air-filtration": "air filtration",
  underpass: "school underpass",
  "mine-safety": "mine safety",
  "fire-station": "fire station",
  "bus-seatbelts": "bus seatbelts",
  "speed-limit": "speed limit",
  "rare-drug": "rare-disease drug",
};

// ── helpers ────────────────────────────────────────────────────────────────────
const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const usdCompact = (n: number) => {
  if (n >= 1_000_000) return "$" + (Math.round(n / 100_000) / 10).toString() + "M";
  if (n >= 1_000) return "$" + Math.round(n / 1_000) + "K";
  return "$" + Math.round(n);
};

const PRICES = SCENARIOS.map((s) => s.pricePerLife);
const LOG_MIN = Math.log10(Math.min(...PRICES));
const LOG_MAX = Math.log10(Math.max(...PRICES));
/** Position of a price on the log axis, 0–100 (clamped to stay visible). */
const axisPos = (price: number) => {
  const p = ((Math.log10(price) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 100;
  return Math.max(3, Math.min(100, p));
};

function useCountUp(target: number, run: boolean, ms = 950): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - t, 3);
      setV(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setV(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, ms]);
  return v;
}

type Phase = "intro" | "run" | "mirror";
type Sub = "decide" | "reveal";

export default function PriceOfALife() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [order, setOrder] = useState<Scenario[]>(() => SCENARIOS);
  const [index, setIndex] = useState(0);
  const [sub, setSub] = useState<Sub>("decide");
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const savedRef = useRef(false);

  const start = () => {
    setOrder(shuffledScenarios());
    setIndex(0);
    setSub("decide");
    setDecisions([]);
    savedRef.current = false;
    setPhase("run");
    track("experiment_started", { slug: "price-of-a-life" });
  };

  const restart = () => start();

  const decide = (funded: boolean) => {
    const s = order[index];
    setDecisions((prev) => [...prev, { slug: s.slug, funded, pricePerLife: s.pricePerLife }]);
    setSub("reveal");
  };

  const next = () => {
    if (index + 1 >= order.length) {
      setPhase("mirror");
    } else {
      setIndex((i) => i + 1);
      setSub("decide");
    }
  };

  // Save participation once, when the mirror is reached.
  useEffect(() => {
    if (phase !== "mirror" || savedRef.current || decisions.length !== SCENARIOS.length) return;
    savedRef.current = true;
    const mirror = computeMirror(decisions);
    track("experiment_completed", { slug: "price-of-a-life", fundedCount: mirror.fundedCount });
    fetch("/api/participation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        experimentSlug: "price-of-a-life",
        insight: {
          reachedMirror: true,
          fundedCount: mirror.fundedCount,
          skippedCount: mirror.skippedCount,
          contradictions: mirror.contradictions,
          distanceBias: mirror.distanceBias,
          fundedSpanRatio: mirror.fundedSpanRatio,
          impliedFloor: mirror.impliedFloor,
          impliedCeiling: Number.isFinite(mirror.impliedCeiling) ? mirror.impliedCeiling : null,
        },
        payload: { decisions },
      }),
    }).catch(() => {});
  }, [phase, decisions]);

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: C.cream,
        color: C.ink,
        fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "clamp(20px, 5vw, 56px) 20px 72px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 680 }}>
        {phase === "intro" && <Intro onStart={start} />}
        {phase === "run" && (
          <Run
            key={`${index}-${sub}`}
            scenario={order[index]}
            index={index}
            total={order.length}
            sub={sub}
            decision={decisions[index]}
            onDecide={decide}
            onNext={next}
          />
        )}
        {phase === "mirror" && <MirrorView decisions={decisions} onRestart={restart} />}
      </div>
    </main>
  );
}

// ── intro ──────────────────────────────────────────────────────────────────────
function Intro({ onStart }: { onStart: () => void }) {
  return (
    <section style={{ ...fadeIn, paddingTop: "8vh" }}>
      <p style={{ ...kicker }}>the price of a life</p>
      <h1 style={{ ...heading, fontSize: "clamp(30px, 6.5vw, 52px)", lineHeight: 1.08, margin: "18px 0 0" }}>
        Governments decide how much a human life is worth — every single day.
      </h1>
      <p style={{ fontSize: 18, lineHeight: 1.6, color: C.sub, margin: "22px 0 0", maxWidth: 540 }}>
        They just don&rsquo;t say it out loud. You&rsquo;re about to make 10 of these decisions.
      </p>
      <button onClick={onStart} style={{ ...primaryBtn, marginTop: 40 }}>
        Start
      </button>
      <p style={{ fontSize: 13, color: C.sub, marginTop: 22, lineHeight: 1.6 }}>
        every figure here is illustrative, not a real statistic — chosen to show the spread.
      </p>
    </section>
  );
}

// ── a single scenario (decide → reveal) ─────────────────────────────────────────
function Run({
  scenario,
  index,
  total,
  sub,
  decision,
  onDecide,
  onNext,
}: {
  scenario: Scenario;
  index: number;
  total: number;
  sub: Sub;
  decision?: Decision;
  onDecide: (funded: boolean) => void;
  onNext: () => void;
}) {
  return (
    <section style={fadeIn}>
      <Progress index={index} total={total} />
      {sub === "decide" ? (
        <>
          <p style={{ fontSize: "clamp(19px, 3.4vw, 23px)", lineHeight: 1.5, margin: "26px 0 0" }}>
            {scenario.situation}
          </p>
          <div style={{ ...factGrid, marginTop: 28 }}>
            <Fact label="cost to fund" value={scenario.costLabel} />
            <Fact label="at stake, each year" value={scenario.livesLabel} />
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 34, flexWrap: "wrap" }}>
            <button onClick={() => onDecide(true)} style={fundBtn}>
              Fund it
            </button>
            <button onClick={() => onDecide(false)} style={skipBtn}>
              Don&rsquo;t fund it
            </button>
          </div>
        </>
      ) : (
        <Reveal scenario={scenario} funded={!!decision?.funded} onNext={onNext} last={index + 1 >= total} />
      )}
    </section>
  );
}

function Reveal({
  scenario,
  funded,
  onNext,
  last,
}: {
  scenario: Scenario;
  funded: boolean;
  onNext: () => void;
  last: boolean;
}) {
  const v = useCountUp(scenario.pricePerLife, true);
  const accent = funded ? C.green : C.red;
  return (
    <div style={{ ...fadeIn, marginTop: 26 }}>
      <p style={{ fontSize: 15, color: C.sub, margin: 0 }}>
        {funded ? "You funded it. That puts a price on each life saved:" : "You passed. The lives lost were valued at:"}
      </p>
      <div
        style={{
          ...heading,
          fontVariantNumeric: "tabular-nums",
          fontSize: "clamp(44px, 11vw, 84px)",
          lineHeight: 1.05,
          color: accent,
          margin: "10px 0 0",
        }}
      >
        {usd(v)}
      </div>
      <p style={{ fontSize: 14, color: C.sub, margin: "6px 0 0" }}>per statistical life · {SHORT[scenario.slug]}</p>
      <button onClick={onNext} style={{ ...primaryBtn, marginTop: 36 }}>
        {last ? "See your number" : "Next decision"}
      </button>
    </div>
  );
}

// ── the mirror ───────────────────────────────────────────────────────────────────
function MirrorView({ decisions, onRestart }: { decisions: Decision[]; onRestart: () => void }) {
  const mirror = useMemo(() => computeMirror(decisions), [decisions]);
  const fundedBySlug = useMemo(
    () => Object.fromEntries(decisions.map((d) => [d.slug, d.funded])),
    [decisions],
  );
  // Chart sorted ascending by price (cheapest life at top).
  const rows = useMemo(() => [...SCENARIOS].sort((a, b) => a.pricePerLife - b.pricePerLife), []);
  const linePos = mirror.impliedFloor > 0 ? axisPos(mirror.impliedFloor) : 0;
  const contra = new Set(mirror.contradictionSlugs);

  const share = () => {
    const url = typeof window !== "undefined" ? window.location.href : "https://spaghetti.ltd/price-of-a-life";
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ url, title: "the price of a life" }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).catch(() => {});
    }
  };

  return (
    <section style={fadeIn}>
      <p style={kicker}>your decisions, priced</p>
      <h2 style={{ ...heading, fontSize: "clamp(24px, 5vw, 34px)", margin: "12px 0 0", lineHeight: 1.15 }}>
        What a life was worth to you
      </h2>

      {/* chart */}
      <div style={{ position: "relative", marginTop: 28 }}>
        {linePos > 0 && (
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: 0,
              bottom: 18,
              left: `calc(${linePos}% )`,
              borderLeft: `1.5px dashed ${C.ink}`,
              opacity: 0.32,
              zIndex: 2,
            }}
          />
        )}
        {rows.map((s) => {
          const funded = !!fundedBySlug[s.slug];
          const w = axisPos(s.pricePerLife);
          const isContra = contra.has(s.slug);
          return (
            <div key={s.slug} style={{ margin: "0 0 10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: C.sub, marginBottom: 3 }}>
                <span style={{ color: isContra ? C.red : C.sub }}>
                  {SHORT[s.slug]}
                  {isContra ? " ·  cheaper than one you funded" : ""}
                </span>
                <span style={{ fontVariantNumeric: "tabular-nums", color: funded ? C.green : C.red }}>
                  {usdCompact(s.pricePerLife)}
                </span>
              </div>
              <div style={{ height: 14, background: C.track, borderRadius: 7, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${w}%`,
                    background: funded ? C.green : C.red,
                    borderRadius: 7,
                    transition: "width .6s cubic-bezier(.2,.7,.2,1)",
                  }}
                />
              </div>
            </div>
          );
        })}
        <div style={{ display: "flex", gap: 18, marginTop: 12, fontSize: 12.5, color: C.sub, flexWrap: "wrap" }}>
          <Legend color={C.green} label="you funded" />
          <Legend color={C.red} label="you passed" />
          {linePos > 0 && <span>┊ your ceiling — {usdCompact(mirror.impliedFloor)} per life</span>}
        </div>
      </div>

      {/* the read-out */}
      <div style={{ marginTop: 30, borderTop: `1px solid ${C.line}`, paddingTop: 22 }}>
        <Readout mirror={mirror} />
      </div>

      <p style={{ fontSize: 17, lineHeight: 1.6, marginTop: 26, color: C.ink }}>
        The price of a life isn&rsquo;t fixed. It depends on who&rsquo;s asking, and why.
      </p>

      <div style={{ marginTop: 26 }}>
        <PromptRegistration
          trigger="on_result"
          headline="keep your number — and carry it across every experiment."
          sub="no account needed; sign in to save your badges across the series."
        />
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
        <button onClick={onRestart} style={primaryBtn}>
          Play again
        </button>
        <button onClick={share} style={skipBtn}>
          Share
        </button>
      </div>
      <p style={{ fontSize: 12, color: C.sub, marginTop: 18, lineHeight: 1.6 }}>
        we store your choices to compute this mirror; nothing is shared publicly. illustrative numbers only.
      </p>
    </section>
  );
}

function Readout({ mirror }: { mirror: ReturnType<typeof computeMirror> }) {
  const { fundedCount, skippedCount, impliedFloor, impliedCeiling, contradictions } = mirror;

  if (fundedCount === 0) {
    return (
      <p style={readLine}>
        You funded nothing. Your line sits <b>below {usdCompact(Math.min(...PRICES))}</b> — no life here cleared the bar.
      </p>
    );
  }
  if (skippedCount === 0) {
    return (
      <p style={readLine}>
        You funded every measure. Your line sits <b>above {usdCompact(Math.max(...PRICES))}</b> per life — every life made the cut.
      </p>
    );
  }
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <p style={readLine}>
        You paid up to <b style={{ color: C.green }}>{usd(impliedFloor)}</b> for a life — and walked away from one that cost{" "}
        <b style={{ color: C.red }}>{usd(impliedCeiling)}</b>.
      </p>
      {contradictions > 0 ? (
        <p style={{ ...readLine, color: C.sub }}>
          {contradictions === 1 ? "One life" : `${contradictions} lives`} you passed on cost <i>less</i> than one you
          funded. Your line bends.
        </p>
      ) : (
        <p style={{ ...readLine, color: C.sub }}>You held a clean line — cheaper lives in, dearer lives out. Tidy. Most people aren&rsquo;t.</p>
      )}
    </div>
  );
}

// ── small bits ───────────────────────────────────────────────────────────────────
function Progress({ index, total }: { index: number; total: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ ...heading, fontSize: 14, letterSpacing: 1, color: C.sub, fontVariantNumeric: "tabular-nums" }}>
        {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </span>
      <div style={{ flex: 1, height: 3, background: C.track, borderRadius: 2 }}>
        <div style={{ height: "100%", width: `${((index + 1) / total) * 100}%`, background: C.ink, borderRadius: 2, transition: "width .4s ease" }} />
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1, color: C.sub, margin: 0 }}>{label}</p>
      <p style={{ fontSize: 15.5, lineHeight: 1.4, margin: "5px 0 0" }}>{value}</p>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 11, height: 11, borderRadius: 3, background: color, display: "inline-block" }} />
      {label}
    </span>
  );
}

// ── style tokens ───────────────────────────────────────────────────────────────────
const heading: React.CSSProperties = { fontFamily: "var(--font-grotesk), ui-sans-serif, system-ui, sans-serif", fontWeight: 600 };
const kicker: React.CSSProperties = {
  ...heading,
  fontSize: 12.5,
  letterSpacing: 2.5,
  textTransform: "uppercase",
  color: C.sub,
  margin: 0,
};
const factGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr", gap: 16 };
const readLine: React.CSSProperties = { fontSize: 16, lineHeight: 1.55, margin: 0 };
const fadeIn: React.CSSProperties = { animation: "pol-fade .45s ease both" };

const baseBtn: React.CSSProperties = {
  font: "inherit",
  fontSize: 16,
  fontWeight: 600,
  padding: "13px 26px",
  borderRadius: 999,
  cursor: "pointer",
  border: "1.5px solid transparent",
  transition: "transform .1s ease, opacity .15s ease",
};
const primaryBtn: React.CSSProperties = { ...baseBtn, background: C.ink, color: C.cream };
const fundBtn: React.CSSProperties = { ...baseBtn, background: C.green, color: "#fff", flex: "1 1 140px" };
const skipBtn: React.CSSProperties = { ...baseBtn, background: "transparent", color: C.ink, borderColor: C.ink, flex: "0 1 auto" };
