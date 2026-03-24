"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ritualsById, SLOT_LABELS } from "@/data/adhdRituals";
import JourneyFlow, { type JourneyState } from "@/components/JourneyFlow";
import NastavSiDenWizard, { DownloadPDFButton, type RitualSelection as WizardSelection } from "@/components/NastavSiDenWizard";

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

type RitualSelection = { morning: string[]; daily: string[]; evening: string[] };

const CUSTOM_PREFIX = "custom::";
const isCustom = (id: string) => id.startsWith(CUSTOM_PREFIX);
const customName = (id: string) => id.slice(CUSTOM_PREFIX.length);
function getRitual(id: string): { id: string; name: string; duration_min: number } {
  if (isCustom(id)) return { id, name: customName(id), duration_min: 0 };
  const r = ritualsById[id];
  return { id, name: r?.name ?? id, duration_min: r?.duration_min ?? 0 };
}

// ── SpiderChart ────────────────────────────────────────────────────────────────

function SpiderChart({ vals, size = 220 }: { vals: Record<string, number>; size?: number }) {
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
        <polygon
          key={v}
          points={WHEEL_AREAS.map((_, i) => pt(i, v).join(",")).join(" ")}
          fill="none"
          stroke="rgba(0,0,0,0.07)"
          strokeWidth="0.5"
        />
      ))}
      {WHEEL_AREAS.map((_, i) => {
        const [x, y] = pt(i, 10);
        return (
          <line key={i} x1={C} y1={C} x2={x} y2={y} stroke="rgba(0,0,0,0.08)" strokeWidth="0.5" />
        );
      })}
      <polygon
        points={WHEEL_AREAS.map((a, i) => pt(i, vals[a.key] ?? 5).join(",")).join(" ")}
        fill="rgba(255,140,66,0.12)"
        stroke="#FF8C42"
        strokeWidth="1.5"
      />
      {WHEEL_AREAS.map((a, i) => {
        const ang = (2 * Math.PI * i) / N - Math.PI / 2;
        const lx = C + (R + 28) * Math.cos(ang);
        const ly = C + (R + 28) * Math.sin(ang);
        return (
          <text
            key={a.key}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="9.5"
            fill="#888"
            fontFamily="system-ui"
          >
            {a.short}
          </text>
        );
      })}
      {WHEEL_AREAS.map((a, i) => {
        const [x, y] = pt(i, vals[a.key] ?? 5);
        return <circle key={a.key} cx={x} cy={y} r="3" fill="#FF8C42" />;
      })}
    </svg>
  );
}

// ── RitualSlotCard ─────────────────────────────────────────────────────────────

const SLOT_EMOJI: Record<string, string> = { morning: "🌅", daily: "☀️", evening: "🌙" };

function RitualSlotCard({
  slot,
  ids,
}: {
  slot: "morning" | "daily" | "evening";
  ids: string[];
}) {
  const rituals = ids.map((id) => getRitual(id));
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
      <ul className="px-4 py-3 space-y-2">
        {rituals.map((r) => (
          <li key={r.id} className="flex items-center gap-2 text-sm">
            <span className="w-4 h-4 rounded border border-foreground/20 shrink-0" />
            <span className="text-foreground/80">{r.name}</span>
            {r.duration_min > 0 && (
              <span className="ml-auto text-foreground/40 text-xs shrink-0">{r.duration_min} min</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── EmptyCta ───────────────────────────────────────────────────────────────────

function EmptyCta({
  emoji,
  title,
  description,
  buttonLabel,
  onClick,
  href,
}: {
  emoji: string;
  title: string;
  description: string;
  buttonLabel: string;
  onClick?: () => void;
  href?: string;
}) {
  const buttonClass =
    "inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-full font-semibold text-sm hover:bg-accent-hover transition-colors";
  return (
    <div className="paper-card rounded-[24px] px-6 py-8 text-center space-y-3">
      <p className="text-4xl">{emoji}</p>
      <div>
        <p className="font-bold text-foreground">{title}</p>
        <p className="text-sm text-foreground/55 mt-1">{description}</p>
      </div>
      {href ? (
        <Link href={href} className={buttonClass}>
          {buttonLabel}
        </Link>
      ) : (
        <button onClick={onClick} className={buttonClass}>
          {buttonLabel}
        </button>
      )}
    </div>
  );
}

// ── PrehledTab ─────────────────────────────────────────────────────────────────

function PrehledTab({
  journeyData,
  ritualSelection,
  onTabChange,
}: {
  journeyData: JourneyState | null;
  ritualSelection: RitualSelection | null;
  onTabChange: (tab: string) => void;
}) {
  const hasWheel =
    journeyData?.wheelVals &&
    Object.values(journeyData.wheelVals).some((v) => v !== 5);
  const hasValues = (journeyData?.finalValues?.length ?? 0) > 0;
  const hasKompas = hasWheel || hasValues;

  const totalRituals = ritualSelection
    ? ritualSelection.morning.length + ritualSelection.daily.length + ritualSelection.evening.length
    : 0;
  const hasRituals = totalRituals > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Denní rituály */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg text-foreground">Denní rituály</h2>
          {hasRituals && (
            <button
              onClick={() => onTabChange("nastav-si-den")}
              className="text-xs text-accent font-semibold hover:underline"
            >
              Zobrazit vše →
            </button>
          )}
        </div>

        {hasRituals ? (
          <div className="space-y-3">
            {(["morning", "daily", "evening"] as const).map((slot) => (
              <RitualSlotCard key={slot} slot={slot} ids={ritualSelection![slot]} />
            ))}
          </div>
        ) : (
          <EmptyCta
            emoji="🗓️"
            title="Nastav si den"
            description="Sestav si vlastní denní rutinu z rituálů s vědeckým základem."
            buttonLabel="Spustit průvodce →"
            onClick={() => onTabChange("nastav-si-den")}
          />
        )}
      </div>

      {/* Right: Kompas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg text-foreground">Tvůj kompas</h2>
          {hasKompas && (
            <button
              onClick={() => onTabChange("tvuj-kompas")}
              className="text-xs text-accent font-semibold hover:underline"
            >
              Zobrazit vše →
            </button>
          )}
        </div>

        {hasKompas ? (
          <div className="space-y-4">
            {hasWheel && (
              <div className="paper-card rounded-[24px] px-5 py-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground/35 mb-3">
                  Spokojenost v oblastech
                </p>
                <div className="flex items-center justify-center">
                  <SpiderChart vals={journeyData!.wheelVals!} size={220} />
                </div>
                <div className="grid grid-cols-2 gap-1.5 mt-2">
                  {WHEEL_AREAS.map((a) => (
                    <div key={a.key} className="flex items-center gap-2">
                      <div className="flex-1 bg-black/5 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(journeyData?.wheelVals?.[a.key] ?? 5) * 10}%`,
                            background: "#FF8C42",
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-foreground/40 w-12 truncate">{a.short}</span>
                      <span className="text-xs font-bold w-3 text-right" style={{ color: "#FF8C42" }}>
                        {journeyData?.wheelVals?.[a.key] ?? 5}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasValues && (
              <div className="paper-card rounded-[24px] px-5 py-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground/35 mb-3">
                  Moje hodnoty
                </p>
                <div className="flex flex-wrap gap-2">
                  {journeyData!.finalValues!.map((v, i) => (
                    <span
                      key={i}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium border ${
                        i < 5
                          ? "border-[#FF8C42] bg-orange-50 text-orange-900"
                          : "border-black/10 text-foreground/50"
                      }`}
                    >
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <EmptyCta
            emoji="🧭"
            title="Tvůj kompas"
            description={"Projdi sedm zastávek od \u201ekde jsem\u201c po \u201ežiju podle sebe\u201c."}
            buttonLabel="Spustit průvodce →"
            onClick={() => onTabChange("tvuj-kompas")}
          />
        )}
      </div>
    </div>
  );
}

// ── NastavSiDenTab ─────────────────────────────────────────────────────────────

function NastavSiDenTab({
  selection,
  onSave,
  onComplete,
  onReset,
}: {
  selection: RitualSelection | null;
  onSave: (sel: WizardSelection) => void;
  onComplete: (sel: WizardSelection) => void;
  onReset: () => void;
}) {
  const totalRituals = selection
    ? selection.morning.length + selection.daily.length + selection.evening.length
    : 0;

  // No data yet — run the wizard inline
  if (!selection || totalRituals === 0) {
    return <NastavSiDenWizard onSave={onSave} onComplete={onComplete} />;
  }

  // Has data — show results
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Tvůj denní systém</h2>
          <p className="text-sm text-foreground/55 mt-0.5">{totalRituals} rituálů</p>
        </div>
        <button
          onClick={onReset}
          className="text-sm text-foreground/40 hover:text-foreground/60 transition-colors whitespace-nowrap pt-0.5"
        >
          Vyplnit průvodce znovu
        </button>
      </div>

      <div className="space-y-4">
        {(["morning", "daily", "evening"] as const).map((slot) => (
          <RitualSlotCard key={slot} slot={slot} ids={selection[slot]} />
        ))}
      </div>

      <div className="border-t border-black/5 pt-4 flex items-center justify-between">
        <p className="text-xs text-foreground/30 italic">
          Dnes nemusí být dokonalý den. Stačí, že je lepší než včera.
        </p>
        <DownloadPDFButton selection={selection} />
      </div>
    </div>
  );
}

// ── TvujKompasTab ──────────────────────────────────────────────────────────────

function TvujKompasTab({
  initialData,
  purchaseId,
}: {
  initialData: JourneyState | null;
  purchaseId: string;
}) {
  const [kompasKey, setKompasKey] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);

  const hasData =
    initialData &&
    (Object.values(initialData.wheelVals ?? {}).some((v) => v !== 5) ||
      (initialData.finalValues?.length ?? 0) > 0);

  return (
    <div>
      {hasData && (
        <div className="flex justify-end mb-4">
          {confirmReset ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-foreground/60">Opravdu začít znovu?</span>
              <button
                onClick={() => {
                  setKompasKey((k) => k + 1);
                  setConfirmReset(false);
                }}
                className="text-sm text-red-500 font-semibold hover:text-red-600 transition-colors"
              >
                Ano, začít znovu
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="text-sm text-foreground/40 hover:text-foreground/60 transition-colors"
              >
                Zrušit
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="text-sm text-foreground/40 hover:text-foreground/60 transition-colors"
            >
              Vyplnit průvodce znovu
            </button>
          )}
        </div>
      )}
      <JourneyFlow
        key={kompasKey}
        initialData={kompasKey === 0 ? initialData : null}
        purchaseId={purchaseId}
      />
    </div>
  );
}

// ── DashboardContent ───────────────────────────────────────────────────────────

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checked, setChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [journeyData, setJourneyData] = useState<JourneyState | null>(null);
  const [purchaseId, setPurchaseId] = useState("");
  const [ritualSelection, setRitualSelection] = useState<RitualSelection | null>(null);
  const [journeyLoading, setJourneyLoading] = useState(true);

  const activeTab = searchParams.get("tab") ?? "prehled";

  // Auth check
  useEffect(() => {
    fetch("/api/laborator/check")
      .then((r) => r.json())
      .then((d) => {
        if (!d.valid) {
          router.replace("/laborator");
        } else {
          setEmail(d.email ?? "");
          setChecked(true);
        }
      })
      .catch(() => router.replace("/laborator"));
  }, [router]);

  // Load journey data
  useEffect(() => {
    if (!checked) return;
    setJourneyLoading(true);
    fetch("/api/laborator/journey")
      .then((r) => r.json())
      .then((d) => {
        setJourneyData((d.data as JourneyState) ?? null);
        setPurchaseId(d.purchaseId ?? "");
      })
      .catch(console.error)
      .finally(() => setJourneyLoading(false));
  }, [checked]);

  // Load nastav-si-den from localStorage
  useEffect(() => {
    if (!checked) return;
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) setRitualSelection(JSON.parse(saved));
    } catch {}
  }, [checked]);

  const goToTab = useCallback(
    (tab: string) => {
      const query = tab !== "prehled" ? `?tab=${tab}` : "";
      router.push(`/laborator/dashboard${query}`, { scroll: false });
    },
    [router]
  );

  const handleWizardSave = useCallback((sel: WizardSelection) => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(sel)); } catch {}
    // don't update state yet — wizard stays open until "Přejít do laboratoře"
  }, []);

  const handleWizardComplete = useCallback((sel: WizardSelection) => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(sel)); } catch {}
    setRitualSelection(sel);
  }, []);

  const handleRitualReset = useCallback(() => {
    try { localStorage.removeItem(LS_KEY); } catch {}
    setRitualSelection(null);
  }, []);

  const tabs = [
    { id: "prehled",       label: "Přehled",       emoji: "📊" },
    { id: "nastav-si-den", label: "Nastav si den",  emoji: "🗓️" },
    { id: "tvuj-kompas",   label: "Tvůj kompas",    emoji: "🧭" },
  ];

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFDF7]">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen py-16 md:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Hero */}
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">Laboratoř</h1>
          <p className="text-lg md:text-xl text-foreground/65 max-w-xl">
            Tvoje osobní dílna. Interaktivní průvodci a cvičení pro nalezení směru a budování systémů.
          </p>
        </div>

        {/* Tabs */}
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
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div>
          {activeTab === "prehled" &&
            (journeyLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="paper-card rounded-[24px] h-48 animate-pulse bg-white/60" />
                <div className="paper-card rounded-[24px] h-48 animate-pulse bg-white/60" />
              </div>
            ) : (
              <PrehledTab
                journeyData={journeyData}
                ritualSelection={ritualSelection}
                onTabChange={goToTab}
              />
            ))}

          {activeTab === "nastav-si-den" && (
            <NastavSiDenTab
              selection={ritualSelection}
              onSave={handleWizardSave}
              onComplete={handleWizardComplete}
              onReset={handleRitualReset}
            />
          )}

          {activeTab === "tvuj-kompas" &&
            (journeyLoading ? (
              <div className="space-y-4">
                <div className="paper-card rounded-[24px] h-24 animate-pulse bg-white/60" />
                <div className="paper-card rounded-[24px] h-64 animate-pulse bg-white/60" />
              </div>
            ) : (
              <TvujKompasTab initialData={journeyData} purchaseId={purchaseId} />
            ))}
        </div>

        {email && (
          <p className="text-xs text-foreground/30 text-center">{email}</p>
        )}
      </div>
    </main>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FDFDF7]">
          <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
