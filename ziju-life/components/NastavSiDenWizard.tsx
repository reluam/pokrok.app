"use client";

import { useState, useCallback, useRef } from "react";
import {
  categories,
  featuredBuild,
  ritualsById,
  SLOT_MAX,
  SLOT_LABELS,
  type Ritual,
  type Slot,
} from "@/data/adhdRituals";

// ── Custom ritual helpers ──────────────────────────────────────────────────────

const CUSTOM_PREFIX = "custom::";
const isCustom = (id: string) => id.startsWith(CUSTOM_PREFIX);
// ID format: "custom::name::duration_min"
const customName = (id: string) => id.slice(CUSTOM_PREFIX.length).split("::")[0];
const customDurationMin = (id: string) => {
  const parts = id.split("::");
  return parts.length >= 3 ? parseInt(parts[2]) || 0 : 0;
};
const makeCustomId = (name: string, duration: number) =>
  `${CUSTOM_PREFIX}${name.trim()}::${duration}`;

function getRitual(
  id: string,
  overrides?: Record<string, number>
): { name: string; duration_min: number } {
  if (isCustom(id)) return { name: customName(id), duration_min: customDurationMin(id) };
  const r = ritualsById[id];
  const base = r?.duration_min ?? 0;
  return { name: r?.name ?? id, duration_min: overrides?.[id] ?? base };
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface Answers {
  wakeTime: string;
  screenFree: string;
  mainProblem: string;
  exercise: string;
  goal: string;
}

export interface RitualSelection {
  morning: string[];
  daily: string[];
  evening: string[];
  /** User-overridden durations for predefined rituals (id → minutes) */
  durationOverrides?: Record<string, number>;
}

interface Props {
  /** Called from step 4 "Uložit" — saves data but keeps wizard open */
  onSave: (selection: RitualSelection) => void;
  /** Called from step 5 "Přejít do laboratoře" — closes wizard */
  onComplete: (selection: RitualSelection) => void;
}

// ── Root wizard ────────────────────────────────────────────────────────────────

export default function NastavSiDenWizard({ onSave, onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Answers>({
    wakeTime: "",
    screenFree: "",
    mainProblem: "",
    exercise: "",
    goal: "",
  });
  const [selection, setSelection] = useState<RitualSelection>({
    morning: [],
    daily: [],
    evening: [],
    durationOverrides: {},
  });
  return (
    <div className="max-w-2xl mx-auto">
      <StepProgress step={step} total={5} />
      <div className="px-1 pb-16">
        {step === 1 && (
          <Step1Onboarding
            answers={answers}
            setAnswers={setAnswers}
            onDone={() => setStep(2)}
          />
        )}
        {step === 2 && <Step2Videos onNext={() => setStep(3)} />}
        {step === 3 && (
          <Step3Configurator
            selection={selection}
            setSelection={setSelection}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && (
          <Step4Preview
            selection={selection}
            onEdit={() => setStep(3)}
            onNext={() => {
              onSave(selection);
              setStep(5);
            }}
          />
        )}
        {step === 5 && (
          <Step5Download
            selection={selection}
            onComplete={() => onComplete(selection)}
          />
        )}
      </div>
    </div>
  );
}

// ── Progress dots ──────────────────────────────────────────────────────────────

function StepProgress({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 pt-4 pb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i + 1 === step
              ? "w-6 h-2.5 bg-accent"
              : i + 1 < step
              ? "w-2.5 h-2.5 bg-accent/40"
              : "w-2.5 h-2.5 bg-foreground/10"
          }`}
        />
      ))}
    </div>
  );
}

// ── Step 1: Onboarding ─────────────────────────────────────────────────────────

const questions: Array<{
  key: keyof Answers;
  question: string;
  options: string[];
}> = [
  {
    key: "wakeTime",
    question: "V kolik obvykle vstáváš?",
    options: ["Před 6:00", "6:00–8:00", "8:00–10:00", "Po 10:00"],
  },
  {
    key: "screenFree",
    question: "Máš ráno čas bez obrazovky?",
    options: ["Ano, aspoň 30 min", "Ano, ale jen chvíli", "Ne, hned koukám na telefon"],
  },
  {
    key: "mainProblem",
    question: "Co ti dělá největší problém?",
    options: ["Soustředění", "Energie přes den", "Spánek", "Organizace a plánování"],
  },
  {
    key: "exercise",
    question: "Jak jsi na tom s pohybem?",
    options: ["Cvičím pravidelně", "Občas", "Skoro vůbec"],
  },
  {
    key: "goal",
    question: "Co tě sem přivedlo?",
    options: ["Chci systém na ráno", "Chci vyřešit celý den", "Chci hlavně spánek a energii"],
  },
];

function Step1Onboarding({
  answers,
  setAnswers,
  onDone,
}: {
  answers: Answers;
  setAnswers: (a: Answers) => void;
  onDone: () => void;
}) {
  const [qIndex, setQIndex] = useState(0);
  const q = questions[qIndex];

  function pick(option: string) {
    const updated = { ...answers, [q.key]: option };
    setAnswers(updated);
    if (qIndex < questions.length - 1) {
      setQIndex(qIndex + 1);
    } else {
      onDone();
    }
  }

  return (
    <div className="pt-4">
      <p className="text-xs font-semibold text-foreground/40 uppercase tracking-widest mb-8">
        Otázka {qIndex + 1} z {questions.length}
      </p>
      <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-8 leading-tight">
        {q.question}
      </h2>
      <div className="flex flex-col gap-3">
        {q.options.map((opt) => (
          <button
            key={opt}
            onClick={() => pick(opt)}
            className="paper-card rounded-[20px] px-6 py-4 text-left font-semibold text-foreground
              hover:border-accent/40 hover:shadow-md transition-all duration-200 border border-transparent"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Step 2: Videos ─────────────────────────────────────────────────────────────

const videos = [
  {
    title: "Jak ADHD mozek funguje jinak",
    desc: "Proč ty nejsi líný — tvůj mozek jen funguje jinak. Základy neurovědy.",
    url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  {
    title: "Proč systémy fungují líp než motivace",
    desc: "Motivace je nespolehlivá. Systém funguje i ve špatné dny.",
    url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  {
    title: "4 pilíře: tělo, mysl, energie, struktura",
    desc: "Kompletní přehled toho, co budeme stavět.",
    url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
];

function Step2Videos({ onNext }: { onNext: () => void }) {
  const [watched, setWatched] = useState<Set<number>>(new Set());

  return (
    <div className="pt-4">
      <h2 className="text-2xl font-extrabold mb-2">Než začneme</h2>
      <p className="text-foreground/60 text-sm mb-8">
        Tři krátká videa, která ti dají kontext. Můžeš je přeskočit, ale doporučuji je shlédnout.
      </p>
      <div className="space-y-5 mb-8">
        {videos.map((v, i) => (
          <div key={i} className="paper-card rounded-[24px] overflow-hidden">
            <div className="aspect-video bg-foreground/5 relative">
              {watched.has(i) ? (
                <iframe
                  src={v.url}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <button
                  onClick={() => setWatched((s) => new Set([...s, i]))}
                  className="w-full h-full flex items-center justify-center"
                >
                  <div className="w-14 h-14 bg-accent rounded-full flex items-center justify-center shadow-lg">
                    <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6 ml-1">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </button>
              )}
            </div>
            <div className="px-5 py-4 flex items-start justify-between gap-4">
              <div>
                <p className="font-bold text-sm text-foreground">{v.title}</p>
                <p className="text-xs text-foreground/50 mt-0.5">{v.desc}</p>
              </div>
              <button
                onClick={() => setWatched((s) => new Set([...s, i]))}
                className="text-xs text-foreground/40 whitespace-nowrap hover:text-foreground/60 transition-colors shrink-0"
              >
                Sledovat později
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={onNext}
        className="w-full py-4 bg-accent text-white rounded-full font-bold hover:bg-accent-hover transition-colors"
      >
        Pokračovat →
      </button>
    </div>
  );
}

// ── Step 3: Configurator ───────────────────────────────────────────────────────

const SLOT_ORDER: Slot[] = ["morning", "daily", "evening"];
const SLOT_META: Record<Slot, { emoji: string; heading: string; sub: string }> = {
  morning: { emoji: "🌅", heading: "Ranní rituály", sub: "Jak začneš den — než přijdou povinnosti." },
  daily:   { emoji: "☀️", heading: "Denní rituály", sub: "Kotvy a návyky v průběhu dne." },
  evening: { emoji: "🌙", heading: "Večerní rituály", sub: "Jak den zakončíš a připravíš se na spánek." },
};

function Step3Configurator({
  selection,
  setSelection,
  onNext,
  onBack,
}: {
  selection: RitualSelection;
  setSelection: (s: RitualSelection) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [slotIndex, setSlotIndex] = useState(0);
  const [expandedWhy, setExpandedWhy] = useState<string | null>(null);
  const [warning, setWarning] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [customDuration, setCustomDuration] = useState(5);
  const inputRef = useRef<HTMLInputElement>(null);

  const slot = SLOT_ORDER[slotIndex];
  const meta = SLOT_META[slot];
  const isLast = slotIndex === SLOT_ORDER.length - 1;

  const availableRituals = categories.flatMap((c) =>
    c.rituals.filter((r) => r.slots.includes(slot))
  );

  // Custom rituals already in selection for this slot
  const customIds = selection[slot].filter(isCustom);

  function addCustomRitual() {
    const name = customInput.trim();
    if (!name) return;
    const id = makeCustomId(name, customDuration);
    const current = selection[slot];
    if (current.includes(id)) {
      setCustomInput("");
      return;
    }
    if (current.length >= SLOT_MAX[slot]) {
      setWarning(`Pro ADHD mozek je míň víc. Vyber max ${SLOT_MAX[slot]} rituály.`);
      return;
    }
    setWarning("");
    setSelection({ ...selection, [slot]: [...current, id] });
    setCustomInput("");
    setCustomDuration(5);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function removeCustom(id: string) {
    setSelection({ ...selection, [slot]: selection[slot].filter((x) => x !== id) });
    setWarning("");
  }

  function togglePredefined(ritual: Ritual) {
    const current = selection[slot];
    if (current.includes(ritual.id)) {
      setSelection({ ...selection, [slot]: current.filter((id) => id !== ritual.id) });
      setWarning("");
    } else {
      if (current.length >= SLOT_MAX[slot]) {
        setWarning(`Pro ADHD mozek je míň víc. Vyber max ${SLOT_MAX[slot]} rituály.`);
        return;
      }
      setWarning("");
      setSelection({ ...selection, [slot]: [...current, ritual.id] });
    }
  }

  function goNext() {
    setWarning("");
    setExpandedWhy(null);
    setCustomInput("");
    setCustomDuration(5);
    if (isLast) {
      onNext();
    } else {
      setSlotIndex((i) => i + 1);
    }
  }

  function goBack() {
    setWarning("");
    setExpandedWhy(null);
    setCustomInput("");
    setCustomDuration(5);
    if (slotIndex === 0) {
      onBack();
    } else {
      setSlotIndex((i) => i - 1);
    }
  }

  const totalSelected =
    selection.morning.length + selection.daily.length + selection.evening.length;

  return (
    <div className="pt-4">
      {/* Slot heading */}
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold text-foreground/40 uppercase tracking-widest">
          {slotIndex + 1} / {SLOT_ORDER.length}
        </p>
        <div className="flex gap-1.5">
          {SLOT_ORDER.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                i < slotIndex ? "w-5 bg-accent/40" : i === slotIndex ? "w-5 bg-accent" : "w-5 bg-foreground/10"
              }`}
            />
          ))}
        </div>
      </div>

      <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-1 mt-4">
        {meta.emoji} {meta.heading}
      </h2>
      <p className="text-sm text-foreground/55 mb-2">{meta.sub}</p>
      <p className="text-xs text-foreground/35 mb-6">
        Vybráno: {selection[slot].length} / {SLOT_MAX[slot]} (méně je více)
      </p>

      {/* ── Vlastní rituál ── */}
      <div className="mb-6">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomRitual(); } }}
            placeholder="Napsat vlastní rituál…"
            className="flex-1 px-4 py-3 rounded-[16px] bg-white/80 border border-white/60 shadow-sm text-sm font-medium text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-accent/40 focus:shadow-md transition-all"
          />
          <div className="flex items-center gap-1 px-3 rounded-[16px] bg-white/80 border border-white/60 shadow-sm shrink-0">
            <input
              type="number"
              min={1}
              max={120}
              value={customDuration}
              onChange={(e) => setCustomDuration(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-9 text-sm font-semibold text-foreground text-center bg-transparent focus:outline-none"
            />
            <span className="text-xs text-foreground/40">min</span>
          </div>
          <button
            onClick={addCustomRitual}
            disabled={!customInput.trim()}
            className="w-11 h-11 rounded-[16px] bg-accent text-white flex items-center justify-center shadow-sm hover:bg-accent-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
            title="Přidat rituál"
          >
            <svg viewBox="0 0 12 12" fill="none" className="w-4 h-4">
              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Added custom rituals */}
        {customIds.length > 0 && (
          <div className="mt-3 space-y-2">
            {customIds.map((id) => (
              <div key={id} className="flex items-center gap-3 px-4 py-3 rounded-[16px] bg-accent/8 border border-accent/20">
                <div className="w-5 h-5 rounded-md bg-accent flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="flex-1 text-sm font-semibold text-foreground">{customName(id)}</span>
                {customDurationMin(id) > 0 && (
                  <span className="text-xs text-foreground/40 shrink-0">{customDurationMin(id)} min</span>
                )}
                <button
                  onClick={() => removeCustom(id)}
                  className="text-foreground/30 hover:text-foreground/60 transition-colors text-lg leading-none"
                  title="Odebrat"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {warning && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-800 mb-4">
          {warning}
        </div>
      )}

      {/* ── Predefined rituals ── */}
      <p className="text-xs font-semibold text-foreground/35 uppercase tracking-widest mb-3">
        nebo vyber z nabídky
      </p>
      <div className="space-y-3 mb-8">
        {availableRituals.map((ritual) => {
          const checked = selection[slot].includes(ritual.id);
          const isExpanded = expandedWhy === ritual.id;
          const overrides = selection.durationOverrides ?? {};
          const effectiveDuration = overrides[ritual.id] ?? ritual.duration_min;
          return (
            <div
              key={ritual.id}
              className={`paper-card rounded-[20px] px-5 py-4 transition-all ${
                checked ? "border border-accent/30" : "border border-transparent"
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => togglePredefined(ritual)}
                  className={`w-5 h-5 rounded-md border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                    checked ? "bg-accent border-accent" : "border-foreground/20 hover:border-accent/50"
                  }`}
                >
                  {checked && (
                    <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-foreground">{ritual.name}</span>
                    {ritual.duration_min > 0 && (
                      checked ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={1}
                            max={120}
                            value={effectiveDuration}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value) || 1);
                              setSelection({
                                ...selection,
                                durationOverrides: { ...overrides, [ritual.id]: val },
                              });
                            }}
                            className="w-10 text-xs font-semibold text-center bg-white/80 border border-black/10 rounded-md px-1 py-0.5 focus:outline-none focus:border-accent/40"
                          />
                          <span className="text-xs text-foreground/40">min</span>
                        </div>
                      ) : (
                        <span className="text-xs text-foreground/40">{ritual.duration_min} min</span>
                      )
                    )}
                    <DifficultyDots level={ritual.difficulty} />
                  </div>
                  {isExpanded && (
                    <div className="mt-2 space-y-1.5">
                      <p className="text-xs text-foreground/70 leading-relaxed">{ritual.why}</p>
                      <p className="text-xs text-accent/80 leading-relaxed">💡 {ritual.tip}</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setExpandedWhy(isExpanded ? null : ritual.id)}
                  className="text-xs text-foreground/40 hover:text-accent transition-colors shrink-0 ml-1"
                >
                  {isExpanded ? "Méně" : "Proč?"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Matějův build — jen na prvním slotu */}
      {slotIndex === 0 && (
        <div className="paper-card rounded-[24px] px-5 py-5 mb-8 border border-foreground/5">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <p className="font-bold text-sm">⭐ {featuredBuild.name}</p>
              <p className="text-xs text-foreground/50 mt-0.5 leading-relaxed">{featuredBuild.description}</p>
            </div>
            <button
              onClick={() => {
                setSelection({ morning: [...featuredBuild.morning], daily: [...featuredBuild.daily], evening: [...featuredBuild.evening], durationOverrides: {} });
                setWarning("");
                onNext();
              }}
              className="text-xs px-3 py-1.5 bg-foreground text-white rounded-full shrink-0 hover:bg-foreground/80 transition-colors"
            >
              Použít vše
            </button>
          </div>
          <div className="flex gap-3 text-xs text-foreground/50 flex-wrap">
            <span>🌅 {featuredBuild.morning.length} ráno</span>
            <span>☀️ {featuredBuild.daily.length} den</span>
            <span>🌙 {featuredBuild.evening.length} večer</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={goBack}
          className="flex-1 py-3.5 rounded-full border border-foreground/15 font-semibold text-foreground/70 hover:border-foreground/30 transition-colors"
        >
          ← Zpět
        </button>
        <button
          onClick={goNext}
          disabled={isLast && totalSelected === 0}
          className="flex-1 py-3.5 bg-accent text-white rounded-full font-bold hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLast ? "Zobrazit preview →" : "Další →"}
        </button>
      </div>
    </div>
  );
}

function DifficultyDots({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span className="flex gap-0.5 items-center">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${i <= level ? "bg-foreground/40" : "bg-foreground/10"}`}
        />
      ))}
    </span>
  );
}

// ── Step 4: Preview ────────────────────────────────────────────────────────────

function Step4Preview({
  selection,
  onEdit,
  onNext,
}: {
  selection: RitualSelection;
  onEdit: () => void;
  onNext: () => void;
}) {
  return (
    <div className="pt-4">
      <h2 className="text-2xl font-extrabold mb-2">Tvůj systém</h2>
      <p className="text-sm text-foreground/60 mb-8">
        Takhle budou vypadat kartičky. Pokud chceš změnit — vrať se zpět.
      </p>
      <div className="space-y-4 mb-8">
        {(["morning", "daily", "evening"] as Slot[]).map((slot) => (
          <PreviewCard key={slot} slot={slot} ids={selection[slot]} overrides={selection.durationOverrides} />
        ))}
      </div>
      <div className="flex gap-3">
        <button
          onClick={onEdit}
          className="flex-1 py-3.5 rounded-full border border-foreground/15 font-semibold text-foreground/70 hover:border-foreground/30 transition-colors"
        >
          ← Upravit
        </button>
        <button
          onClick={onNext}
          className="flex-1 py-3.5 bg-accent text-white rounded-full font-bold hover:bg-accent-hover transition-colors"
        >
          Uložit →
        </button>
      </div>
    </div>
  );
}

function PreviewCard({ slot, ids, overrides }: { slot: Slot; ids: string[]; overrides?: Record<string, number> }) {
  const rituals = ids.map((id) => ({ id, ...getRitual(id, overrides) }));
  const totalMin = rituals.reduce((s, r) => s + r.duration_min, 0);

  if (ids.length === 0) {
    return (
      <div className="paper-card rounded-[24px] px-5 py-5 opacity-40">
        <p className="text-sm font-semibold text-foreground/50">{SLOT_LABELS[slot]} — žádné rituály</p>
      </div>
    );
  }

  return (
    <div className="paper-card rounded-[24px] overflow-hidden">
      <div className="bg-foreground px-5 py-4">
        <p className="text-xs font-bold text-white/50 uppercase tracking-widest">{SLOT_LABELS[slot]}</p>
        <p className="text-white font-semibold text-sm mt-0.5">{totalMin} min celkem</p>
      </div>
      <ul className="px-5 py-4 space-y-2">
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
      <div className="border-t border-foreground/5 px-5 py-3">
        <p className="text-xs text-foreground/30 italic">
          Dnes nemusí být dokonalý den.
        </p>
      </div>
    </div>
  );
}

// ── Step 5: Download ───────────────────────────────────────────────────────────

const bonusVideos = [
  "Jak přežít špatný den — nouzový protokol",
  "Proč nemusíš dělat všechno každý den",
  "Jak adaptovat systém po měsíci",
  "Ranní rutina krok za krokem (videonávod)",
  "Večerní rutina — jak se vypnout",
  "Pohyb a ADHD: co vědci zjistili",
  "Výživa pro ADHD mozek: top 5 změn",
];

// ── DownloadPDFButton (exported for reuse in dashboard) ────────────────────────

export function DownloadPDFButton({
  selection,
  className,
}: {
  selection: RitualSelection;
  className?: string;
}) {
  const [generating, setGenerating] = useState(false);

  const handleClick = useCallback(async () => {
    setGenerating(true);
    try {
      const { default: jsPDF } = await import("jspdf");

      // Load Roboto fonts (support Czech diacritics)
      async function toBase64(url: string): Promise<string> {
        const buf = await fetch(url).then((r) => r.arrayBuffer());
        const bytes = new Uint8Array(buf);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        return btoa(binary);
      }
      const [fontRegular, fontBold] = await Promise.all([
        toBase64("/fonts/Roboto-Regular.ttf"),
        toBase64("/fonts/Roboto-Bold.ttf"),
      ]);

      // Load logo
      const logoBase64 = await toBase64("/ziju-life-logo.png");

      const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      doc.addFileToVFS("Roboto-Regular.ttf", fontRegular);
      doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
      doc.addFileToVFS("Roboto-Bold.ttf", fontBold);
      doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");

      const pageW = 210, pageH = 297, margin = 12;
      const contentW = pageW - margin * 2;
      const colGap = 5;
      const colW = (contentW - colGap * 2) / 3;
      const accent = { r: 255, g: 140, b: 66 };

      const slots: Array<{ slot: Slot; label: string }> = [
        { slot: "morning", label: "RANNÍ RUTINA" },
        { slot: "daily",   label: "DENNÍ RUTINA" },
        { slot: "evening", label: "VEČERNÍ RUTINA" },
      ];

      // Calculate row height based on max rituals
      const maxRituals = Math.max(selection.morning.length, selection.daily.length, selection.evening.length, 1);
      const colHeaderH = 8;
      const dateFieldH = 7;
      const rowGap = 3;
      const fullRowH = dateFieldH + colHeaderH + maxRituals * 7 + 4;
      const footerH = 10;
      const availableH = pageH - margin * 2 - footerH;
      const rowsOnPage = Math.max(1, Math.floor((availableH + rowGap) / (fullRowH + rowGap)));

      // --- Render function for one page ---
      function renderPage() {
        // Background
        doc.setFillColor(253, 253, 247); // #FDFDF7
        doc.rect(0, 0, pageW, pageH, "F");

        for (let row = 0; row < rowsOnPage; row++) {
          const rowY = margin + row * (fullRowH + rowGap);

          // Row separator
          if (row > 0) {
            doc.setDrawColor(230, 230, 225);
            doc.setLineDashPattern([1, 1], 0);
            doc.line(margin, rowY - 2, pageW - margin, rowY - 2);
            doc.setLineDashPattern([], 0);
          }

          // Date field for this row
          doc.setFont("Roboto", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(180, 180, 175);
          doc.text("Datum:", margin + 1, rowY + 4);
          doc.setDrawColor(200, 200, 195);
          doc.line(margin + 16, rowY + 5, margin + 55, rowY + 5);

          // Column headers for this row
          const headerY = rowY + dateFieldH;
          slots.forEach(({ label }, colIdx) => {
            const colX = margin + colIdx * (colW + colGap);
            doc.setFillColor(255, 248, 240);
            doc.roundedRect(colX, headerY, colW, colHeaderH, 1.5, 1.5, "F");
            doc.setFont("Roboto", "bold");
            doc.setFontSize(7);
            doc.setTextColor(accent.r, accent.g, accent.b);
            doc.text(label, colX + colW / 2, headerY + 5, { align: "center" });
          });

          // Rituals for this row
          const ritualsY = headerY + colHeaderH + 2;
          slots.forEach(({ slot }, colIdx) => {
            const colX = margin + colIdx * (colW + colGap);
            const ids = selection[slot];
            const rituals = ids.map((id) => ({ id, ...getRitual(id, selection.durationOverrides) }));

            let y = ritualsY;

            if (rituals.length === 0) {
              doc.setFontSize(7.5);
              doc.setTextColor(200, 200, 195);
              doc.text("—", colX + 2, y + 3);
            } else {
              rituals.forEach((r) => {
                doc.setDrawColor(210, 210, 205);
                doc.setFillColor(255, 255, 255);
                doc.roundedRect(colX + 1, y, 4, 4, 0.8, 0.8, "FD");

                doc.setFont("Roboto", "normal");
                doc.setFontSize(8);
                doc.setTextColor(60, 60, 60);
                const maxChars = Math.floor((colW - 16) / 1.7);
                const name = r.name.length > maxChars ? r.name.slice(0, maxChars - 1) + "…" : r.name;
                doc.text(name, colX + 7, y + 3);

                if (r.duration_min > 0) {
                  doc.setFontSize(6.5);
                  doc.setTextColor(180, 180, 175);
                  doc.text(`${r.duration_min} min`, colX + colW - 1, y + 3, { align: "right" });
                }

                y += 7;
              });
            }
          });
        }

        // Footer with logo
        const footerY = pageH - margin;
        doc.setDrawColor(accent.r, accent.g, accent.b);
        doc.setLineWidth(0.3);
        doc.line(margin, footerY - 6, pageW - margin, footerY - 6);
        doc.setLineWidth(0.2);

        try {
          doc.addImage(logoBase64, "PNG", margin, footerY - 5, 18, 6);
        } catch {}

        doc.setFont("Roboto", "normal");
        doc.setFontSize(6);
        doc.setTextColor(200, 200, 195);
        doc.text("Dnes nemusí být dokonalý den.", pageW / 2, footerY - 1, { align: "center" });
      }

      renderPage();

      doc.save("ritualy.pdf");
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setGenerating(false);
    }
  }, [selection]);

  return (
    <button
      onClick={handleClick}
      disabled={generating}
      className={className ?? "inline-flex items-center gap-1.5 text-sm text-foreground/50 hover:text-foreground/70 transition-colors disabled:opacity-40"}
    >
      {generating ? (
        <>
          <span className="w-3.5 h-3.5 border-2 border-foreground/20 border-t-foreground/50 rounded-full animate-spin" />
          Generuji…
        </>
      ) : (
        <>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Stáhnout jako PDF
        </>
      )}
    </button>
  );
}

// ── PrintDayOverviewButton — A5 x2 on A4, blank daily planner ────────────────

export function PrintDayOverviewButton({
  selection,
  className,
}: {
  selection: RitualSelection;
  className?: string;
}) {
  const [generating, setGenerating] = useState(false);

  const handleClick = useCallback(async () => {
    setGenerating(true);
    try {
      const { default: jsPDF } = await import("jspdf");

      async function toBase64(url: string): Promise<string> {
        const buf = await fetch(url).then((r) => r.arrayBuffer());
        const bytes = new Uint8Array(buf);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        return btoa(binary);
      }
      const [fontRegular, fontBold, logoBase64] = await Promise.all([
        toBase64("/fonts/Roboto-Regular.ttf"),
        toBase64("/fonts/Roboto-Bold.ttf"),
        toBase64("/ziju-life-logo.png"),
      ]);

      // A4 landscape → two A5 portrait side by side
      const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
      doc.addFileToVFS("Roboto-Regular.ttf", fontRegular);
      doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
      doc.addFileToVFS("Roboto-Bold.ttf", fontBold);
      doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");

      const pageW = 297, pageH = 210;
      const a5W = pageW / 2; // ~148.5
      const a5H = pageH;     // 210
      const accent = { r: 255, g: 140, b: 66 };

      function renderA5(offsetX: number) {
        const m = 8;
        const left = offsetX + m;
        const w = a5W - m * 2;
        const h = a5H;

        // Background
        doc.setFillColor(253, 253, 247);
        doc.rect(offsetX, 0, a5W, a5H, "F");

        // Cut line between halves
        if (offsetX > 0) {
          doc.setDrawColor(210, 210, 210);
          doc.setLineDashPattern([2, 2], 0);
          doc.line(offsetX, 0, offsetX, pageH);
          doc.setLineDashPattern([], 0);
        }

        // Header: "Můj den" + underline for date
        let y = m + 5;
        doc.setFont("Roboto", "bold");
        doc.setFontSize(12);
        doc.setTextColor(50, 50, 50);
        doc.text("Můj den", left, y);
        const titleW = doc.getTextWidth("Můj den");
        doc.setDrawColor(200, 200, 195);
        doc.line(left + titleW + 3, y + 1, left + titleW + 45, y + 1);

        try { doc.addImage(logoBase64, "PNG", left + w - 20, m, 20, 7); } catch {}

        y += 4;
        doc.setDrawColor(accent.r, accent.g, accent.b);
        doc.setLineWidth(0.4);
        doc.line(left, y, left + w, y);
        doc.setLineWidth(0.2);

        y += 5;

        // --- To Do ---
        doc.setFont("Roboto", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(accent.r, accent.g, accent.b);
        doc.text("TO DO", left, y);
        y += 5.5;
        for (let i = 0; i < 3; i++) {
          doc.setDrawColor(210, 210, 205);
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(left, y, 3.5, 3.5, 0.6, 0.6, "FD");
          doc.setDrawColor(230, 230, 225);
          doc.line(left + 5.5, y + 3.5, left + w, y + 3.5);
          y += 7.5;
        }

        y += 3;

        // --- Nice To Do ---
        doc.setFont("Roboto", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(accent.r, accent.g, accent.b);
        doc.text("NICE TO DO", left, y);
        y += 5.5;
        for (let i = 0; i < 3; i++) {
          doc.setDrawColor(210, 210, 205);
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(left, y, 3.5, 3.5, 0.6, 0.6, "FD");
          doc.setDrawColor(230, 230, 225);
          doc.line(left + 5.5, y + 3.5, left + w, y + 3.5);
          y += 7.5;
        }

        y += 4;

        // --- Priority ---
        const scopes = [
          { label: "TÝDEN", count: 3 },
          { label: "MĚSÍC", count: 3 },
          { label: "ROK", count: 3 },
        ];
        scopes.forEach(({ label, count }) => {
          doc.setFont("Roboto", "bold");
          doc.setFontSize(6.5);
          doc.setTextColor(160, 160, 155);
          doc.text(label, left, y);
          y += 4;
          for (let i = 0; i < count; i++) {
            doc.setDrawColor(230, 230, 225);
            doc.line(left, y + 3, left + w, y + 3);
            y += 6;
          }
          y += 2.5;
        });

        // --- Rituály ---
        const rSlots: Array<{ slot: Slot; label: string }> = [
          { slot: "morning", label: "RANNÍ" },
          { slot: "daily", label: "DENNÍ" },
          { slot: "evening", label: "VEČERNÍ" },
        ];

        y += 2;

        rSlots.forEach(({ slot, label }) => {
          const ids = selection[slot];
          const rituals = ids.map((id) => ({ id, ...getRitual(id, selection.durationOverrides) }));

          doc.setFont("Roboto", "bold");
          doc.setFontSize(7.5);
          doc.setTextColor(accent.r, accent.g, accent.b);
          doc.text(label, left, y);
          const labelW = doc.getTextWidth(label);

          if (rituals.length === 0) {
            doc.setFont("Roboto", "normal");
            doc.setFontSize(7);
            doc.setTextColor(200, 200, 195);
            doc.text(" —", left + labelW, y);
          } else {
            let x = left + labelW + 3;
            const baseY = y - 2.8; // align checkboxes with label baseline
            let curY = baseY;
            rituals.forEach((r, i) => {
              doc.setDrawColor(210, 210, 205);
              doc.setFillColor(255, 255, 255);
              doc.roundedRect(x, curY, 3.5, 3.5, 0.6, 0.6, "FD");

              doc.setFont("Roboto", "normal");
              doc.setFontSize(7.5);
              doc.setTextColor(60, 60, 60);
              const name = r.name.length > 20 ? r.name.slice(0, 19) + "…" : r.name;
              doc.text(name, x + 4.5, curY + 2.8);
              const nameW = doc.getTextWidth(name);
              x += 4.5 + nameW + 5;

              if (x > left + w - 15 && i < rituals.length - 1) {
                x = left;
                curY += 6;
                y = curY + 2.8;
              }
            });
          }
          y += 7;
        });

        // Footer
        doc.setDrawColor(accent.r, accent.g, accent.b);
        doc.setLineWidth(0.3);
        doc.line(left, h - m - 4, left + w, h - m - 4);
        doc.setLineWidth(0.2);
        doc.setFont("Roboto", "normal");
        doc.setFontSize(5.5);
        doc.setTextColor(210, 210, 205);
        doc.text("Dnes nemusí být dokonalý den.", left + w / 2, h - m, { align: "center" });
      }

      // Render two A5 side by side
      renderA5(0);
      renderA5(a5W);

      doc.save("prehled-dne.pdf");
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setGenerating(false);
    }
  }, [selection]);

  return (
    <button
      onClick={handleClick}
      disabled={generating}
      className={className ?? "inline-flex items-center gap-1.5 text-sm text-foreground/50 hover:text-foreground/70 transition-colors disabled:opacity-40"}
    >
      {generating ? (
        <>
          <span className="w-3.5 h-3.5 border-2 border-foreground/20 border-t-foreground/50 rounded-full animate-spin" />
          Generuji…
        </>
      ) : (
        <>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
          </svg>
          Tisk přehledu
        </>
      )}
    </button>
  );
}

function Step5Download({
  selection,
  onComplete,
}: {
  selection: RitualSelection;
  onComplete: () => void;
}) {
  return (
    <div className="pt-4">
      <h2 className="text-2xl font-extrabold mb-2">Hotovo. 🎉</h2>
      <p className="text-sm text-foreground/60 mb-8">Systém je uložený. Stáhni PDF nebo se vrať do laboratoře.</p>

      <div className="flex gap-3 mb-8">
        <DownloadPDFButton
          selection={selection}
          className="flex-1 py-4 bg-accent text-white rounded-full font-bold hover:bg-accent-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        />
        <button
          onClick={onComplete}
          className="flex-1 py-4 rounded-full border border-foreground/15 font-semibold text-foreground/60 hover:border-foreground/30 hover:text-foreground/80 transition-colors"
        >
          Přejít do laboratoře
        </button>
      </div>

      <div className="paper-card rounded-[24px] px-5 py-5">
        <p className="font-bold mb-4 text-sm">🎥 Bonusová videa</p>
        <div className="space-y-3">
          {bonusVideos.map((title, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-foreground/5 rounded-full flex items-center justify-center shrink-0">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-accent">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm text-foreground/70">{title}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-foreground/30 mt-4">Videa budou dostupná brzy — dostaneš e-mail.</p>
      </div>
    </div>
  );
}
