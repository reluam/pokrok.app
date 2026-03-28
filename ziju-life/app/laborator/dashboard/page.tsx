"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ritualsById, SLOT_LABELS } from "@/data/adhdRituals";
import KompasFlow, { type KompasData } from "@/components/KompasFlow";
import HodnotyFlow, { PrintHodnotyButton, type HodnotyData } from "@/components/HodnotyFlow";
import NastavSiDenWizard, { DownloadPDFButton, type RitualSelection as WizardSelection } from "@/components/NastavSiDenWizard";
import dynamic from "next/dynamic";

const ToolboxTab = dynamic(() => import("@/components/laborator/ToolboxTab"), { ssr: false });
const LabAICoach = dynamic(() => import("@/components/laborator/LabAICoach"), { ssr: false });
const PrioritiesWidget = dynamic(() => import("@/components/laborator/PrioritiesWidget"), { ssr: false });
const DailyTodosWidget = dynamic(() => import("@/components/laborator/DailyTodosWidget"), { ssr: false });
const RitualsChecklistWidget = dynamic(() => import("@/components/laborator/RitualsChecklistWidget"), { ssr: false });

// ── Constants ──────────────────────────────────────────────────────────────────

const WHEEL_AREAS = [
  { key: "kariera", short: "Kariéra" },
  { key: "finance", short: "Finance" },
  { key: "zdravi",  short: "Zdraví" },
  { key: "rodina",  short: "Rodina" },
  { key: "pratele", short: "Přátelé" },
  { key: "rozvoj",  short: "Rozvoj" },
  { key: "volny",   short: "Volný čas" },
  { key: "smysl",   short: "Smysl" },
];

const LS_KEY = "nastav-si-den-selection";

type RitualSelection = { morning: string[]; daily: string[]; evening: string[]; durationOverrides?: Record<string, number> };
type CheckinEntry = {
  score: number | null;
  week_start_date: string;
  value_scores?: Record<string, number>;
  area_scores?: Record<string, number>;
};

const CUSTOM_PREFIX = "custom::";
const isCustom = (id: string) => id.startsWith(CUSTOM_PREFIX);
const customName = (id: string) => id.slice(CUSTOM_PREFIX.length).split("::")[0];
const customDurationMin = (id: string) => { const p = id.split("::"); return p.length >= 3 ? parseInt(p[2]) || 0 : 0; };
function getRitual(id: string, overrides?: Record<string, number>): { id: string; name: string; duration_min: number } {
  if (isCustom(id)) return { id, name: customName(id), duration_min: customDurationMin(id) };
  const r = ritualsById[id];
  const base = r?.duration_min ?? 0;
  return { id, name: r?.name ?? id, duration_min: overrides?.[id] ?? base };
}

// ── Tip helpers ────────────────────────────────────────────────────────────────

interface Tip { emoji: string; title: string; body: string; }

function getRitualTip(selection: RitualSelection): Tip | null {
  const hasMorning = selection.morning.length > 0;
  const hasEvening = selection.evening.length > 0;
  if (hasMorning && hasEvening) return {
    emoji: "🔥", title: "Kompletní systém — výborně",
    body: "Máš pokrytý začátek i konec dne. Teď je nejdůležitější konzistence — 80 % dnů je výhra.",
  };
  if (!hasMorning) return {
    emoji: "🌅", title: "Přidej ranní rituál",
    body: "Ranní rutina nastartuje nervovou soustavu ještě před prvním stresem dne. Stačí 5–10 minut.",
  };
  if (!hasEvening) return {
    emoji: "🌙", title: "Večerní rituál dokončí smyčku",
    body: "Ranní rituál otevírá den, večerní ho zavírá. Mozek potřebuje jasný signál k přepnutí.",
  };
  return null;
}

function InlineTip({ tip }: { tip: Tip }) {
  return (
    <div className="paper-card rounded-[20px] px-5 py-4 flex gap-4 items-start border border-accent/10 bg-orange-50/30">
      <span className="text-2xl shrink-0 mt-0.5">{tip.emoji}</span>
      <div>
        <p className="font-bold text-sm text-foreground">{tip.title}</p>
        <p className="text-sm text-foreground/60 leading-relaxed mt-0.5">{tip.body}</p>
      </div>
    </div>
  );
}

// ── SpiderChart ────────────────────────────────────────────────────────────────

function SpiderChart({ vals, goalVals, size = 220 }: { vals: Record<string, number>; goalVals?: Record<string, number>; size?: number }) {
  const C = size / 2;
  const R = C - 44;
  const N = WHEEL_AREAS.length;
  const pt = (i: number, v: number): [number, number] => {
    const a = (2 * Math.PI * i) / N - Math.PI / 2;
    const r = (v / 10) * R;
    return [C + r * Math.cos(a), C + r * Math.sin(a)];
  };
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[2, 4, 6, 8, 10].map((v) => (
        <polygon key={v} points={WHEEL_AREAS.map((_, i) => pt(i, v).join(",")).join(" ")}
          fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="0.5" />
      ))}
      {WHEEL_AREAS.map((_, i) => {
        const [x, y] = pt(i, 10);
        return <line key={i} x1={C} y1={C} x2={x} y2={y} stroke="rgba(0,0,0,0.08)" strokeWidth="0.5" />;
      })}
      {goalVals && (
        <polygon points={WHEEL_AREAS.map((a, i) => pt(i, goalVals[a.key] ?? 5).join(",")).join(" ")}
          fill="rgba(78,205,196,0.07)" stroke="#4ECDC4" strokeWidth="1" strokeDasharray="3 2" />
      )}
      <polygon points={WHEEL_AREAS.map((a, i) => pt(i, vals[a.key] ?? 5).join(",")).join(" ")}
        fill="rgba(255,140,66,0.12)" stroke="#FF8C42" strokeWidth="1.5" />
      {WHEEL_AREAS.map((a, i) => {
        const ang = (2 * Math.PI * i) / N - Math.PI / 2;
        const lx = C + (R + 28) * Math.cos(ang);
        const ly = C + (R + 28) * Math.sin(ang);
        return (
          <text key={a.key} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
            fontSize="9.5" fill="#888" fontFamily="system-ui">{a.short}</text>
        );
      })}
      {WHEEL_AREAS.map((a, i) => {
        const [x, y] = pt(i, vals[a.key] ?? 5);
        return <circle key={a.key} cx={x} cy={y} r="3" fill="#FF8C42" />;
      })}
    </svg>
  );
}

// ── Sparkline ──────────────────────────────────────────────────────────────────

function Sparkline({ checkins }: { checkins: CheckinEntry[] }) {
  if (checkins.length < 2) return null;
  const W = 240;
  const H = 56;
  const PAD = 6;
  const w = W - PAD * 2;
  const h = H - PAD * 2;
  const scores = checkins.map((c) => c.score).filter((s): s is number => s !== null);
  if (scores.length < 2) return null;
  const xStep = w / Math.max(scores.length - 1, 1);
  const yScale = (s: number) => PAD + h - ((s - 1) / 9) * h;
  const pts = scores.map((s, i) => `${PAD + i * xStep},${yScale(s)}`).join(" ");
  const last = scores[scores.length - 1];
  const lx = PAD + (scores.length - 1) * xStep;
  const ly = yScale(last);

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      {/* grid lines at 1, 5, 10 */}
      {[1, 5, 10].map((v) => (
        <line key={v} x1={PAD} y1={yScale(v)} x2={W - PAD} y2={yScale(v)}
          stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
      ))}
      <polyline points={pts} fill="none" stroke="#FF8C42" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {scores.map((s, i) => (
        <circle key={i} cx={PAD + i * xStep} cy={yScale(s)} r="2.5"
          fill={i === scores.length - 1 ? "#FF8C42" : "white"}
          stroke="#FF8C42" strokeWidth="1.5" />
      ))}
      {/* last score label */}
      <text x={lx + 6} y={ly + 1} fontSize="10" fill="#FF8C42" fontWeight="700" dominantBaseline="middle">
        {last}
      </text>
    </svg>
  );
}

// ── RitualSlotCard ─────────────────────────────────────────────────────────────

const SLOT_EMOJI: Record<string, string> = { morning: "🌅", daily: "☀️", evening: "🌙" };

function RitualSlotCard({ slot, ids, overrides, showTags }: {
  slot: "morning" | "daily" | "evening";
  ids: string[];
  overrides?: Record<string, number>;
  showTags?: boolean;
}) {
  const rituals = ids.map((id) => getRitual(id, overrides));
  const totalMin = rituals.reduce((s, r) => s + r.duration_min, 0);

  if (ids.length === 0) {
    return (
      <div className="paper-card rounded-[20px] px-4 py-4 opacity-40">
        <p className="text-sm font-semibold text-foreground/50">
          {SLOT_EMOJI[slot]} {SLOT_LABELS[slot]} — žádné rituály
        </p>
      </div>
    );
  }

  return (
    <div className="paper-card rounded-[20px] overflow-hidden">
      <div className="bg-foreground px-4 py-3 flex items-center justify-between">
        <p className="text-xs font-bold text-white/50 uppercase tracking-widest">
          {SLOT_EMOJI[slot]} {SLOT_LABELS[slot]}
        </p>
        {totalMin > 0 && <p className="text-white/60 text-xs">{totalMin} min</p>}
      </div>
      <ul className="px-4 py-3 space-y-2.5">
        {rituals.map((r) => {
          const tags = !isCustom(r.id) ? (ritualsById[r.id]?.supportsTags ?? []) : [];
          return (
            <li key={r.id} className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="w-4 h-4 rounded border border-foreground/20 shrink-0" />
                <span className="text-foreground/80">{r.name}</span>
                {r.duration_min > 0 && (
                  <span className="ml-auto text-foreground/40 text-xs shrink-0">{r.duration_min} min</span>
                )}
              </div>
              {showTags && tags.length > 0 && (
                <div className="flex flex-wrap gap-1 ml-6">
                  {tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-accent/8 text-accent/70 rounded-full font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── EmptyCta ───────────────────────────────────────────────────────────────────

function EmptyCta({ emoji, title, description, buttonLabel, onClick, href }: {
  emoji: string; title: string; description: string;
  buttonLabel: string; onClick?: () => void; href?: string;
}) {
  const cls = "inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-full font-semibold text-sm hover:bg-accent-hover transition-colors";
  return (
    <div className="paper-card rounded-[24px] px-6 py-8 text-center space-y-3">
      <p className="text-4xl">{emoji}</p>
      <div>
        <p className="font-bold text-foreground">{title}</p>
        <p className="text-sm text-foreground/55 mt-1">{description}</p>
      </div>
      {href ? <Link href={href} className={cls}>{buttonLabel}</Link>
        : <button onClick={onClick} className={cls}>{buttonLabel}</button>}
    </div>
  );
}

// ── ScoreBar: compact 1–10 button row ─────────────────────────────────────────

function ScoreBar({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState<number | null>(null);
  return (
    <div className="flex gap-1">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
        const fill = hovered !== null ? n <= hovered : n <= value;
        return (
          <button
            key={n}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onChange(n)}
            className={`flex-1 h-7 rounded text-[11px] font-bold transition-all ${
              fill ? "bg-accent text-white" : "bg-foreground/6 text-foreground/35 hover:bg-accent/15 hover:text-accent"
            }`}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

// ── InteractiveSpider: click on axis to set score ─────────────────────────────

function InteractiveSpider({
  vals,
  prevVals,
  onChange,
  size = 260,
}: {
  vals: Record<string, number>;
  prevVals?: Record<string, number>;
  onChange?: (key: string, score: number) => void;
  size?: number;
}) {
  const C = size / 2;
  const R = C - 48;
  const N = WHEEL_AREAS.length;

  const pt = (i: number, v: number): [number, number] => {
    const a = (2 * Math.PI * i) / N - Math.PI / 2;
    const r = (v / 10) * R;
    return [C + r * Math.cos(a), C + r * Math.sin(a)];
  };

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    if (!onChange) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - C;
    const y = e.clientY - rect.top - C;

    // Find closest axis by angle
    const clickAngle = Math.atan2(y, x);
    let closest = 0;
    let minDiff = Infinity;
    WHEEL_AREAS.forEach((_, i) => {
      const axisAngle = (2 * Math.PI * i) / N - Math.PI / 2;
      let diff = Math.abs(clickAngle - axisAngle);
      if (diff > Math.PI) diff = 2 * Math.PI - diff;
      if (diff < minDiff) { minDiff = diff; closest = i; }
    });

    const dist = Math.sqrt(x * x + y * y);
    const score = Math.min(10, Math.max(1, Math.round((dist / R) * 10)));
    onChange(WHEEL_AREAS[closest].key, score);
  }

  return (
    <svg
      width={size} height={size}
      viewBox={`0 0 ${size} ${size}`}
      onClick={handleClick}
      className={onChange ? "cursor-pointer" : undefined}
    >
      {[2, 4, 6, 8, 10].map((v) => (
        <polygon key={v}
          points={WHEEL_AREAS.map((_, i) => pt(i, v).join(",")).join(" ")}
          fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="0.5" />
      ))}
      {WHEEL_AREAS.map((_, i) => {
        const [x, y] = pt(i, 10);
        return <line key={i} x1={C} y1={C} x2={x} y2={y} stroke="rgba(0,0,0,0.08)" strokeWidth="0.5" />;
      })}
      {prevVals && (
        <polygon
          points={WHEEL_AREAS.map((a, i) => pt(i, prevVals[a.key] ?? 5).join(",")).join(" ")}
          fill="rgba(0,0,0,0.04)" stroke="rgba(0,0,0,0.18)" strokeWidth="1" strokeDasharray="3 2" />
      )}
      <polygon
        points={WHEEL_AREAS.map((a, i) => pt(i, vals[a.key] ?? 5).join(",")).join(" ")}
        fill="rgba(255,140,66,0.13)" stroke="#FF8C42" strokeWidth="1.5" />
      {WHEEL_AREAS.map((a, i) => {
        const [x, y] = pt(i, vals[a.key] ?? 5);
        const ang = (2 * Math.PI * i) / N - Math.PI / 2;
        const lx = C + (R + 30) * Math.cos(ang);
        const ly = C + (R + 30) * Math.sin(ang);
        const score = vals[a.key] ?? 5;
        return (
          <g key={a.key}>
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
              fontSize="9" fill="#888" fontFamily="system-ui">{a.short}</text>
            <circle cx={x} cy={y} r="4" fill="#FF8C42" />
            <text x={x} y={y - 8} textAnchor="middle" dominantBaseline="middle"
              fontSize="9" fontWeight="700" fill="#FF8C42" fontFamily="system-ui">{score}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── AreaSparklines: small trend per area ───────────────────────────────────────

function AreaSparklines({ checkins }: { checkins: CheckinEntry[] }) {
  const withAreas = checkins.filter((c) => c.area_scores && Object.keys(c.area_scores).length > 0);
  if (withAreas.length < 2) return null;

  return (
    <div>
      <p className="text-xs text-foreground/40 mb-3">Vývoj oblastí (posledních {withAreas.length} týdnů)</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {WHEEL_AREAS.map((area) => {
          const scores = withAreas.map((c) => c.area_scores?.[area.key] ?? 5);
          const W = 80; const H = 28; const PAD = 2;
          const w = W - PAD * 2; const h = H - PAD * 2;
          const xStep = w / Math.max(scores.length - 1, 1);
          const yScale = (s: number) => PAD + h - ((s - 1) / 9) * h;
          const pts = scores.map((s, i) => `${PAD + i * xStep},${yScale(s)}`).join(" ");
          const last = scores[scores.length - 1];
          const prev = scores[scores.length - 2];
          const delta = last - prev;

          return (
            <div key={area.key} className="flex items-center gap-2">
              <div className="w-14 text-[10px] text-foreground/50 font-medium truncate">{area.short}</div>
              <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="shrink-0">
                <polyline points={pts} fill="none" stroke="#FF8C42" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
                <circle cx={PAD + (scores.length - 1) * xStep} cy={yScale(last)} r="2.5" fill="#FF8C42" />
              </svg>
              <div className="flex items-baseline gap-0.5">
                <span className="text-xs font-bold text-foreground/70">{last}</span>
                {delta !== 0 && (
                  <span className={`text-[10px] font-semibold ${delta > 0 ? "text-green-500" : "text-red-400"}`}>
                    {delta > 0 ? `+${delta}` : delta}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── WeeklyCheckinWidget ────────────────────────────────────────────────────────

type CheckinStep = "values" | "areas";

function WeeklyCheckinWidget({
  checkins,
  thisWeekDone,
  hodnotyData,
  onSave,
}: {
  checkins: CheckinEntry[];
  thisWeekDone: boolean;
  hodnotyData: HodnotyData | null;
  onSave: (data: { valueScores: Record<string, number>; areaScores: Record<string, number> }) => Promise<void>;
}) {
  const [step, setStep] = useState<CheckinStep>("values");
  const [valueScores, setValueScores] = useState<Record<string, number>>(() =>
    Object.fromEntries((hodnotyData?.finalValues ?? []).map((v) => [v, 5]))
  );
  const [areaScores, setAreaScores] = useState<Record<string, number>>(
    () => Object.fromEntries(WHEEL_AREAS.map((a) => [a.key, 5]))
  );
  const [saving, setSaving] = useState(false);

  const values = hodnotyData?.finalValues ?? [];
  const prevCheckin = checkins.length >= 2 ? checkins[checkins.length - 2] : null;
  const lastCheckin = checkins[checkins.length - 1];

  // ── Done state: show results ──
  if (thisWeekDone && lastCheckin) {
    const aS = lastCheckin.area_scores ?? {};
    const vS = lastCheckin.value_scores ?? {};
    return (
      <div className="space-y-6">
        <p className="text-xs text-foreground/40">Tento týden vyplněno ✓</p>

        {/* Values scores */}
        {Object.keys(vS).length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">Hodnoty</p>
            {Object.entries(vS).map(([v, s]) => (
              <div key={v} className="flex items-center gap-2">
                <span className="text-xs text-foreground/60 w-24 truncate">{v}</span>
                <div className="flex-1 bg-black/5 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${s * 10}%` }} />
                </div>
                <span className="text-xs font-bold text-accent w-4 text-right">{s}</span>
              </div>
            ))}
          </div>
        )}

        {/* Areas spider */}
        {Object.keys(aS).length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">
              Oblasti{prevCheckin?.area_scores ? " — plná čára = tento týden, přerušovaná = minulý" : ""}
            </p>
            <div className="flex justify-center">
              <InteractiveSpider vals={aS} prevVals={prevCheckin?.area_scores ?? undefined} size={240} />
            </div>
          </div>
        )}

        <AreaSparklines checkins={checkins} />
      </div>
    );
  }

  // ── Step: values ──
  if (step === "values") {
    return (
      <div className="space-y-5">
        <div>
          <p className="font-semibold text-foreground">Hodnoty — jak jsi je žil/a tento týden?</p>
          <p className="text-xs text-foreground/45 mt-0.5">
            {values.length > 0 ? "Ohodnoť každou hodnotu 1–10." : "Nejdřív si ulož svoje hodnoty v záložce Hodnoty."}
          </p>
        </div>

        {values.length > 0 ? (
          <div className="space-y-3">
            {values.map((v) => (
              <div key={v} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground/70">{v}</span>
                  <span className="text-xs font-bold text-accent">{valueScores[v] ?? 5}</span>
                </div>
                <ScoreBar
                  value={valueScores[v] ?? 5}
                  onChange={(n) => setValueScores((p) => ({ ...p, [v]: n }))}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5 text-center space-y-2">
            <p className="text-sm text-foreground/60">
              Nejdřív si vyplň hodnoty v záložce <strong>Hodnoty</strong>, pak se tu objeví měřítka pro každou z nich.
            </p>
          </div>
        )}

        {values.length > 0 && (
          <button
            onClick={() => setStep("areas")}
            className="w-full py-2.5 bg-accent text-white rounded-full font-bold text-sm hover:bg-accent-hover transition-colors"
          >
            Dál — oblasti →
          </button>
        )}
      </div>
    );
  }

  // ── Step: areas ──
  return (
    <div className="space-y-5">
      <div>
        <p className="font-semibold text-foreground">Oblasti — jak se ti dařilo tento týden?</p>
        <p className="text-xs text-foreground/45 mt-0.5">Klikni na pavouka — každá osa = oblast, vzdálenost od středu = skóre 1–10.</p>
      </div>

      <div className="flex justify-center">
        <InteractiveSpider
          vals={areaScores}
          prevVals={prevCheckin?.area_scores ?? undefined}
          onChange={(key, score) => setAreaScores((p) => ({ ...p, [key]: score }))}
          size={260}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setStep("values")}
          className="flex-1 py-2.5 border border-foreground/15 text-foreground/60 rounded-full font-semibold text-sm hover:border-foreground/30 transition-colors"
        >
          ← Zpět
        </button>
        <button
          onClick={async () => {
            setSaving(true);
            await onSave({ valueScores, areaScores });
            setSaving(false);
          }}
          disabled={saving}
          className="flex-1 py-2.5 bg-accent text-white rounded-full font-bold text-sm hover:bg-accent-hover transition-colors disabled:opacity-60"
        >
          {saving ? "Ukládám…" : "Uložit check-in ✓"}
        </button>
      </div>

      {checkins.length >= 2 && <AreaSparklines checkins={checkins} />}
    </div>
  );
}

// ── MonthlyReflexion card ──────────────────────────────────────────────────────

const LS_REFLEXION_KEY = "mozaika-reflexion-dismissed";

function MonthlyReflexionCard({
  kompasData,
  onContinue,
  onChangeArea,
}: {
  kompasData: KompasData;
  onContinue: () => void;
  onChangeArea: () => void;
}) {
  const focusLabel = WHEEL_AREAS.find((a) => a.key === kompasData.focusArea)?.short ?? kompasData.focusArea;

  // Answers user wrote for this area
  const areaAnswers = kompasData.areaAnswers?.[kompasData.focusArea ?? ""] ?? [];

  return (
    <div className="paper-card rounded-[28px] px-6 py-6 border border-accent/20 bg-orange-50/20 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-accent uppercase tracking-widest mb-1">Měsíční reflexe</p>
          <p className="font-bold text-foreground text-lg leading-snug">
            Podívej se na svou mozaiku. Posunul/a ses?
          </p>
        </div>
        <span className="text-3xl">🔍</span>
      </div>

      {kompasData.focusArea && (
        <div className="px-4 py-3 rounded-2xl bg-white/70 border border-black/5 space-y-2">
          <p className="text-xs text-foreground/50 font-semibold uppercase tracking-wider">Tvoje focus oblast</p>
          <p className="font-bold text-foreground">{focusLabel}</p>
          {areaAnswers.filter(Boolean).map((ans, i) => (
            <p key={i} className="text-sm text-foreground/60 leading-relaxed">„{ans}"</p>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 pt-1">
        <button
          onClick={onContinue}
          className="flex-1 py-2.5 px-4 bg-accent text-white rounded-full font-semibold text-sm hover:bg-accent-hover transition-colors"
        >
          Pokračuji v této oblasti →
        </button>
        <button
          onClick={onChangeArea}
          className="flex-1 py-2.5 px-4 border border-foreground/15 text-foreground/70 rounded-full font-semibold text-sm hover:border-foreground/30 transition-colors"
        >
          Chci změnit oblast
        </button>
      </div>
    </div>
  );
}

// ── DashboardSection wrapper ───────────────────────────────────────────────────

function DashboardSection({ title, isFirst, hasData, onEdit, children }: {
  title: string; isFirst?: boolean;
  hasData: boolean; onEdit: () => void; children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-base text-foreground">{title}</h2>
          {isFirst && !hasData && (
            <span className="text-[11px] font-bold text-accent px-2 py-0.5 bg-accent/10 rounded-full">
              Začni tady
            </span>
          )}
        </div>
        {hasData && (
          <button onClick={onEdit} className="text-xs text-accent font-semibold hover:underline shrink-0">
            Upravit →
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

// ── PrehledTab ─────────────────────────────────────────────────────────────────

function PrehledTab({
  ritualSelection,
  kompasData,
  hodnotyData,
  checkins,
  checkinLoaded,
  thisWeekDone,
  onTabChange,
  onCheckinSave,
  onDataChanged,
}: {
  ritualSelection: RitualSelection | null;
  kompasData: KompasData | null;
  hodnotyData: HodnotyData | null;
  checkins: CheckinEntry[];
  checkinLoaded: boolean;
  thisWeekDone: boolean;
  onTabChange: (tab: string) => void;
  onCheckinSave: (data: { valueScores: Record<string, number>; areaScores: Record<string, number> }) => Promise<void>;
  onDataChanged?: () => void;
}) {
  const hasRituals = (ritualSelection?.morning.length ?? 0) + (ritualSelection?.daily.length ?? 0) + (ritualSelection?.evening.length ?? 0) > 0;
  const hasKompas = !!kompasData;
  const hasHodnoty = (hodnotyData?.finalValues?.length ?? 0) > 0;

  const focusAreaLabel = kompasData?.focusArea
    ? WHEEL_AREAS.find((a) => a.key === kompasData.focusArea)?.short ?? kompasData.focusArea
    : null;

  // Monthly reflexion
  const [showReflexion, setShowReflexion] = useState(false);
  useEffect(() => {
    if (!kompasData?.completedAt || !kompasData.focusArea) return;
    const daysSince = (Date.now() - new Date(kompasData.completedAt).getTime()) / 86400000;
    if (daysSince < 30) return;
    try {
      const d = localStorage.getItem(LS_REFLEXION_KEY);
      if (d && (Date.now() - new Date(d).getTime()) / 86400000 < 30) return;
    } catch {}
    setShowReflexion(true);
  }, [kompasData]);

  function dismissReflexion() {
    try { localStorage.setItem(LS_REFLEXION_KEY, new Date().toISOString()); } catch {}
    setShowReflexion(false);
  }

  return (
    <div className="space-y-6">

      {/* AI Coach */}
      <LabAICoach onDataChanged={onDataChanged} />

      {/* Daily Todos + Priorities side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <DailyTodosWidget />
        <PrioritiesWidget />
      </div>

      {/* Rituály — checkable daily completion */}
      {hasRituals ? (
        <RitualsChecklistWidget ritualSelection={ritualSelection} />
      ) : (
        <div className="paper-card rounded-[20px] px-5 py-5 space-y-3">
          <h3 className="text-sm font-bold text-foreground">Rituály</h3>
          <EmptyCta emoji="⏱️" title="Sestav si denní rituály"
            description="Vyber rituály, které ti dají energii — ranní, denní i večerní."
            buttonLabel="Nastavit rituály →" onClick={() => onTabChange("nastav-si-den")} />
        </div>
      )}

      {/* Monthly reflexion banner */}
      {showReflexion && kompasData && (
        <MonthlyReflexionCard
          kompasData={kompasData}
          onContinue={dismissReflexion}
          onChangeArea={() => { dismissReflexion(); onTabChange("tvuj-kompas"); }}
        />
      )}

      {/* Týdenní check-in — only when not done this week */}
      {checkinLoaded && !thisWeekDone && (
        <div className="paper-card rounded-[20px] px-5 py-5">
          <WeeklyCheckinWidget checkins={checkins} thisWeekDone={thisWeekDone} hodnotyData={hodnotyData} onSave={onCheckinSave} />
        </div>
      )}
    </div>
  );
}

// ── NastavSiDenTab ─────────────────────────────────────────────────────────────

function NastavSiDenTab({ selection, onSave, onComplete, onReset }: {
  selection: RitualSelection | null;
  onSave: (sel: WizardSelection) => void;
  onComplete: (sel: WizardSelection) => void;
  onReset: () => void;
}) {
  const totalRituals = selection
    ? selection.morning.length + selection.daily.length + selection.evening.length
    : 0;

  if (!selection || totalRituals === 0) {
    return <NastavSiDenWizard onSave={onSave} onComplete={onComplete} />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Tvůj denní systém</h2>
        <p className="text-sm text-foreground/55 mt-0.5">{totalRituals} rituálů</p>
      </div>
      <div className="space-y-4">
        {(["morning", "daily", "evening"] as const).map((slot) => (
          <RitualSlotCard key={slot} slot={slot} ids={selection[slot]} overrides={selection.durationOverrides} />
        ))}
      </div>
      {getRitualTip(selection) && <InlineTip tip={getRitualTip(selection)!} />}
      <p className="text-xs text-foreground/30 italic border-t border-black/5 pt-4">
        Dnes nemusí být dokonalý den. Stačí, že je lepší než včera.
      </p>
    </div>
  );
}

// ── ToolTopBar ─────────────────────────────────────────────────────────────────

function ToolTopBar({ onReset, printNode }: {
  onReset: () => void;
  printNode?: React.ReactNode;
}) {
  const [confirming, setConfirming] = useState(false);

  const btnBase = "inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-semibold transition-colors bg-white/70";

  return (
    <div className="flex items-center justify-end gap-2 mb-5">
      {printNode}
      {confirming ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-foreground/50">Opravdu smazat vše?</span>
          <button
            onClick={() => { setConfirming(false); onReset(); }}
            className="px-3 py-1.5 rounded-full bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors"
          >
            Ano, smazat
          </button>
          <button
            onClick={() => setConfirming(false)}
            className={`${btnBase} border-foreground/15 text-foreground/50 hover:border-foreground/25`}
          >
            Zrušit
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className={`${btnBase} border-foreground/15 text-foreground/50 hover:border-red-200 hover:text-red-500`}
        >
          Resetovat a začít znovu
        </button>
      )}
    </div>
  );
}

// ── CompletionScreen ───────────────────────────────────────────────────────────

function CompletionScreen({ emoji, title, summary, onGoPrehled, onEdit }: {
  emoji: string;
  title: string;
  summary: React.ReactNode;
  onGoPrehled: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="max-w-lg mx-auto text-center space-y-6 py-8">
      <div className="text-6xl">{emoji}</div>
      <div className="space-y-2">
        <h2 className="text-2xl font-extrabold text-foreground">{title}</h2>
      </div>
      <div className="paper-card rounded-[24px] px-6 py-5 text-left">
        {summary}
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onGoPrehled}
          className="px-7 py-3 bg-accent text-white rounded-full font-bold text-sm hover:bg-accent-hover transition-colors shadow-md"
        >
          Pokračovat na přehled →
        </button>
        <button
          onClick={onEdit}
          className="px-7 py-3 border border-foreground/15 text-foreground/60 rounded-full font-semibold text-sm hover:border-foreground/30 transition-colors"
        >
          Upravit odpovědi
        </button>
      </div>
    </div>
  );
}

// ── DashboardContent ───────────────────────────────────────────────────────────

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checked, setChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [ritualSelection, setRitualSelection] = useState<RitualSelection | null>(null);
  const [kompasData, setKompasData] = useState<KompasData | null>(null);
  const [hodnotyData, setHodnotyData] = useState<HodnotyData | null>(null);

  // Check-in state
  const [checkins, setCheckins] = useState<CheckinEntry[]>([]);
  const [thisWeekDone, setThisWeekDone] = useState(false);
  const [checkinLoaded, setCheckinLoaded] = useState(false);

  // Completion screen state: null | "hodnoty" | "kompas" | "nastav-si-den"
  const [justCompleted, setJustCompleted] = useState<string | null>(null);

  const activeTab = searchParams.get("tab") ?? "prehled";

  // Auth check
  useEffect(() => {
    fetch("/api/laborator/check")
      .then((r) => r.json())
      .then((d) => {
        if (!d.valid) { router.replace("/laborator"); } else {
          setEmail(d.email ?? "");
          setChecked(true);
        }
      })
      .catch(() => router.replace("/laborator"));
  }, [router]);

  // Load localStorage
  useEffect(() => {
    if (!checked) return;
    try { const s = localStorage.getItem(LS_KEY); if (s) setRitualSelection(JSON.parse(s)); } catch {}
    try { const k = localStorage.getItem("kompas-data"); if (k) setKompasData(JSON.parse(k)); } catch {}
    try { const h = localStorage.getItem("hodnoty-data"); if (h) setHodnotyData(JSON.parse(h)); } catch {}
  }, [checked]);

  // Sync localStorage data to DB for AI coach context
  useEffect(() => {
    if (!checked || !kompasData && !hodnotyData && !ritualSelection) return;
    const sync = async (type: string, data: unknown) => {
      if (!data) return;
      try { await fetch("/api/laborator/user-context", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, data }) }); } catch {}
    };
    if (kompasData?.currentVals) {
      const areas = Object.keys(kompasData.currentVals).map((key) => ({
        area: WHEEL_AREAS.find((a) => a.key === key)?.short ?? key,
        current: kompasData.currentVals[key] ?? 0,
        goal: kompasData.goalVals?.[key] ?? 0,
      }));
      sync("compass", areas);
    }
    if (hodnotyData?.finalValues?.length) {
      sync("values", hodnotyData.finalValues.map((v) => ({
        name: v, alignment: hodnotyData.alignmentScores?.[v] ?? 0,
      })));
    }
    if (ritualSelection) {
      const slots = [
        ...((ritualSelection.morning ?? []).map((id: string) => ({ slot: "ráno", name: ritualsById[id]?.name ?? id }))),
        ...((ritualSelection.daily ?? []).map((id: string) => ({ slot: "přes den", name: ritualsById[id]?.name ?? id }))),
        ...((ritualSelection.evening ?? []).map((id: string) => ({ slot: "večer", name: ritualsById[id]?.name ?? id }))),
      ];
      if (slots.length > 0) sync("rituals", slots);
    }
  }, [checked, kompasData, hodnotyData, ritualSelection]);

  // Load check-ins
  useEffect(() => {
    if (!checked) return;
    fetch("/api/laborator/checkin")
      .then((r) => r.json())
      .then((d) => {
        setCheckins(d.checkins ?? []);
        setThisWeekDone(d.thisWeekDone ?? false);
      })
      .catch(() => {})
      .finally(() => setCheckinLoaded(true));
  }, [checked]);

  const goToTab = useCallback((tab: string) => {
    setJustCompleted(null);
    const query = tab !== "prehled" ? `?tab=${tab}` : "";
    router.push(`/laborator/dashboard${query}`, { scroll: false });
  }, [router]);

  const handleWizardSave = useCallback((sel: WizardSelection) => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(sel)); } catch {}
  }, []);

  const handleWizardComplete = useCallback((sel: WizardSelection) => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(sel)); } catch {}
    setRitualSelection(sel);
    setJustCompleted("nastav-si-den");
  }, []);

  const handleRitualReset = useCallback(() => {
    try { localStorage.removeItem(LS_KEY); } catch {}
    setRitualSelection(null);
  }, []);

  const handleKompasSaved = useCallback(() => {
    try { const k = localStorage.getItem("kompas-data"); if (k) setKompasData(JSON.parse(k)); } catch {}
    setJustCompleted("kompas");
  }, []);

  const handleHodnotySaved = useCallback(() => {
    try { const h = localStorage.getItem("hodnoty-data"); if (h) setHodnotyData(JSON.parse(h)); } catch {}
    setJustCompleted("hodnoty");
  }, []);

  const handleKompasReset = useCallback(() => {
    try { localStorage.removeItem("kompas-data"); } catch {}
    setKompasData(null);
    setJustCompleted(null);
  }, []);

  const handleHodnotyReset = useCallback(() => {
    try { localStorage.removeItem("hodnoty-data"); } catch {}
    setHodnotyData(null);
    setJustCompleted(null);
  }, []);

  const handleCheckinSave = useCallback(async (
    { valueScores, areaScores }: { valueScores: Record<string, number>; areaScores: Record<string, number> }
  ) => {
    try {
      const res = await fetch("/api/laborator/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valueScores, areaScores }),
      });
      const data = await res.json();
      if (data.ok) {
        const week = data.week;
        setCheckins((prev) => {
          const filtered = prev.filter((c) => !c.week_start_date.startsWith(week));
          return [...filtered, { score: data.avgScore ?? null, week_start_date: week, value_scores: valueScores, area_scores: areaScores }];
        });
        setThisWeekDone(true);
      }
    } catch {}
  }, []);

  // 4.1: Tab progress badges
  const hasRituals = (ritualSelection?.morning.length ?? 0) + (ritualSelection?.daily.length ?? 0) + (ritualSelection?.evening.length ?? 0) > 0;
  const hasKompas = !!kompasData;
  const hasHodnoty = (hodnotyData?.finalValues?.length ?? 0) > 0;

  const tabs = [
    { id: "prehled",       label: "Přehled",       emoji: "📊" },
    { id: "moje-hodnoty",  label: "Hodnoty",   emoji: "💎",  done: hasHodnoty },
    { id: "tvuj-kompas",   label: "Kompas",    emoji: "🧭",  done: hasKompas },
    { id: "nastav-si-den", label: "Rituály",   emoji: "⏱️", done: hasRituals },
    { id: "nastrojarna",   label: "Nástrojárna", emoji: "🧰" },
  ] as { id: string; label: string; emoji: string; done?: boolean }[];

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFDF7]">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  // Completion screen (4.3)
  function renderCompletionOrTool() {
    // Completion screen — shown after finishing a tool in its tab
    if (justCompleted === "hodnoty" && activeTab === "moje-hodnoty" && hodnotyData) {
      return (
        <CompletionScreen
          emoji="💎"
          title="Hodnoty uloženy!"
          summary={
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground/60">Tvoje top 5 hodnot:</p>
              <div className="flex flex-wrap gap-2">
                {hodnotyData.finalValues.slice(0, 5).map((v, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-xl text-sm font-medium border border-[#FF8C42] bg-orange-50 text-orange-900">{v}</span>
                ))}
              </div>
              {hodnotyData.alignmentScores && (
                <p className="text-xs text-foreground/45 mt-2">Přidal/a jsi i skóre souladu — uvidíš je v Mozaice pod každou hodnotou.</p>
              )}
            </div>
          }
          onGoPrehled={() => goToTab("prehled")}
          onEdit={() => setJustCompleted(null)}
        />
      );
    }

    if (justCompleted === "kompas" && activeTab === "tvuj-kompas" && kompasData) {
      const focusLabel = kompasData.focusArea
        ? WHEEL_AREAS.find((a) => a.key === kompasData.focusArea)?.short ?? kompasData.focusArea
        : null;
      return (
        <CompletionScreen
          emoji="🧭"
          title="Kompas uložen!"
          summary={
            <div className="space-y-3">
              {focusLabel && (
                <div className="px-4 py-3 rounded-2xl bg-accent/8 border border-accent/20">
                  <p className="text-xs font-bold text-accent/70 uppercase tracking-wider mb-0.5">Oblast k rozvoji</p>
                  <p className="font-bold text-foreground">{focusLabel}</p>
                </div>
              )}
              <p className="text-xs text-foreground/45">
                Aktuální vs. cílové hodnoty a fokus oblast jsou teď viditelné v Mozaice.
              </p>
            </div>
          }
          onGoPrehled={() => goToTab("prehled")}
          onEdit={() => setJustCompleted(null)}
        />
      );
    }

    if (justCompleted === "nastav-si-den" && activeTab === "nastav-si-den" && ritualSelection) {
      const total = ritualSelection.morning.length + ritualSelection.daily.length + ritualSelection.evening.length;
      return (
        <CompletionScreen
          emoji="🗓️"
          title="Denní systém uložen!"
          summary={
            <div className="space-y-2">
              <p className="text-sm text-foreground/60">{total} rituálů ve tvém systému:</p>
              {(["morning", "daily", "evening"] as const).map((slot) => (
                ritualSelection[slot].length > 0 && (
                  <p key={slot} className="text-sm font-medium text-foreground/70">
                    {SLOT_EMOJI[slot as keyof typeof SLOT_EMOJI]} {SLOT_LABELS[slot as keyof typeof SLOT_LABELS]}:{" "}
                    <span className="text-foreground/50 font-normal">
                      {ritualSelection[slot].map((id) => getRitual(id).name).join(", ")}
                    </span>
                  </p>
                )
              ))}
            </div>
          }
          onGoPrehled={() => goToTab("prehled")}
          onEdit={() => setJustCompleted(null)}
        />
      );
    }

    // Normal tab content
    if (activeTab === "prehled") {
      return (
        <PrehledTab
          ritualSelection={ritualSelection}
          kompasData={kompasData}
          hodnotyData={hodnotyData}
          checkins={checkins}
          checkinLoaded={checkinLoaded}
          thisWeekDone={thisWeekDone}
          onTabChange={goToTab}
          onCheckinSave={handleCheckinSave}
          onDataChanged={() => {
            // Reload localStorage data after AI action
            try { const k = localStorage.getItem("kompas-data"); if (k) setKompasData(JSON.parse(k)); } catch {}
            try { const h = localStorage.getItem("hodnoty-data"); if (h) setHodnotyData(JSON.parse(h)); } catch {}
            try { const s = localStorage.getItem(LS_KEY); if (s) setRitualSelection(JSON.parse(s)); } catch {}
          }}
        />
      );
    }

    if (activeTab === "nastav-si-den") {
      const hasDenData = (ritualSelection?.morning.length ?? 0) + (ritualSelection?.daily.length ?? 0) + (ritualSelection?.evening.length ?? 0) > 0;
      return (
        <div>
          {hasDenData && (
            <ToolTopBar
              onReset={handleRitualReset}
              printNode={
                <DownloadPDFButton
                  selection={ritualSelection!}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-foreground/15 bg-white/70 text-sm font-semibold text-foreground/50 hover:border-foreground/30 hover:text-foreground/70 transition-colors"
                />
              }
            />
          )}
          <NastavSiDenTab
            selection={ritualSelection}
            onSave={handleWizardSave}
            onComplete={handleWizardComplete}
            onReset={handleRitualReset}
          />
        </div>
      );
    }

    if (activeTab === "tvuj-kompas") {
      const printBtn = (
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-foreground/15 bg-white/70 text-sm font-semibold text-foreground/50 hover:border-foreground/30 hover:text-foreground/70 transition-colors"
        >
          Vytisknout
        </button>
      );
      return (
        <div>
          {hasKompas && <ToolTopBar onReset={handleKompasReset} printNode={printBtn} />}
          <KompasFlow onSaved={handleKompasSaved} />
        </div>
      );
    }

    if (activeTab === "moje-hodnoty") {
      return (
        <div>
          {hasHodnoty && hodnotyData && (
            <ToolTopBar
              onReset={handleHodnotyReset}
              printNode={
                <PrintHodnotyButton
                  data={hodnotyData}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-foreground/15 bg-white/70 text-sm font-semibold text-foreground/50 hover:border-foreground/30 hover:text-foreground/70 transition-colors disabled:opacity-50"
                />
              }
            />
          )}
          <HodnotyFlow onSaved={handleHodnotySaved} />
        </div>
      );
    }

    if (activeTab === "nastrojarna") {
      return <ToolboxTab onNavigateTab={goToTab} />;
    }

    return null;
  }

  return (
    <main className="min-h-screen py-16 md:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">Laboratoř</h1>

        {/* Tabs with progress indicators */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => goToTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-accent text-white shadow-md"
                  : "bg-white/85 border border-white/60 shadow-sm hover:shadow-md hover:border-accent/30 hover:text-accent backdrop-blur"
              }`}
            >
              <span>{tab.emoji}</span>
              {tab.label}
              {tab.done && activeTab !== tab.id && (
                <span className="w-4 h-4 rounded-full bg-green-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>

        <div>{renderCompletionOrTool()}</div>

        {email && <p className="text-xs text-foreground/30 text-center">{email}</p>}
      </div>
    </main>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FDFDF7]">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
