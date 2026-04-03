"use client";

import { useState, useCallback } from "react";
import { SECTIONS, EXERCISES, getExercisesBySection, type ExerciseDefinition, type ExerciseState } from "@/lib/exercise-registry";
import { WHEEL_AREAS } from "./shared";
import { CompletionScreen } from "./CompletionScreen";
import { ToolTopBar } from "./ToolTopBar";
import KompasFlow, { type KompasData } from "@/components/KompasFlow";
import HodnotyFlow, { PrintHodnotyButton, type HodnotyData } from "@/components/HodnotyFlow";
import dynamic from "next/dynamic";
const NastaveniOblastiFlow = dynamic(() => import("./NastaveniOblastiFlow"), { ssr: false });
const VizeFlow = dynamic(() => import("./VizeFlow"), { ssr: false });
const FilozofieFlow = dynamic(() => import("./FilozofieFlow"), { ssr: false });
const QuarterlyCheckinFlow = dynamic(() => import("./QuarterlyCheckinFlow"), { ssr: false });
const IkigaiFlow = dynamic(() => import("./IkigaiFlow"), { ssr: false });
const EnergyAuditFlow = dynamic(() => import("./EnergyAuditFlow"), { ssr: false });
const BeliefsFlow = dynamic(() => import("./BeliefsFlow"), { ssr: false });
const RelationshipMapFlow = dynamic(() => import("./RelationshipMapFlow"), { ssr: false });

type RitualSelection = { morning: string[]; daily: string[]; evening: string[]; durationOverrides?: Record<string, number> };

// ── State badge ──────────────────────────────────────────────────────────────

function StateBadge({ state, progress }: { state: ExerciseState; progress?: string | null }) {
  if (state === "completed") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold">
        <span className="w-3.5 h-3.5 rounded-full bg-green-500 text-white text-[8px] font-bold flex items-center justify-center">✓</span>
        Hotovo
      </span>
    );
  }
  if (state === "in_progress") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">
        <span className="w-2 h-2 rounded-full bg-amber-400" />
        V procesu{progress ? ` · ${progress}` : ""}
      </span>
    );
  }
  return null;
}

// ── Exercise card ────────────────────────────────────────────────────────────

function ExerciseCard({
  exercise,
  state,
  contextData,
  onOpen,
}: {
  exercise: ExerciseDefinition;
  state: ExerciseState;
  contextData: unknown;
  onOpen: () => void;
}) {
  const summary = state !== "not_started" ? exercise.getSummary(contextData) : null;
  const progress = exercise.getProgress?.(contextData);

  return (
    <button
      onClick={onOpen}
      className={`w-full text-left bg-white border rounded-[24px] px-5 py-5 space-y-3 transition-all hover:shadow-md hover:border-accent/30 ${
        state === "in_progress" ? "border-amber-200 shadow-sm" :
        state === "completed" ? "border-green-200/60" : "border-black/8"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{exercise.emoji}</span>
          <div>
            <p className="font-bold text-foreground text-sm">{exercise.title}</p>
            <p className="text-xs text-foreground/50 mt-0.5 leading-relaxed">{exercise.description}</p>
          </div>
        </div>
        <StateBadge state={state} progress={progress} />
      </div>

      {/* Summary for completed/in-progress */}
      {summary && (
        <div className="pl-[44px]">
          <p className="text-xs text-foreground/60">{summary.label}</p>
          {summary.details && (
            <div className="flex flex-wrap gap-1 mt-1">
              {summary.details.map((d, i) => (
                <span key={i} className="px-2 py-0.5 rounded-lg text-[11px] font-medium border border-accent/20 bg-accent/5 text-accent/80">
                  {d}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CTA */}
      <div className="pl-[44px]">
        <span className={`text-xs font-semibold ${
          state === "not_started" ? "text-accent" :
          state === "in_progress" ? "text-amber-600" : "text-foreground/40"
        }`}>
          {state === "not_started" ? "Začít →" :
           state === "in_progress" ? "Pokračovat →" : "Upravit →"}
        </span>
      </div>
    </button>
  );
}

// ── ManualHub ────────────────────────────────────────────────────────────────

export function ManualHub({
  context,
  onContextChanged,
}: {
  context: Record<string, unknown>;
  onContextChanged: () => void;
}) {
  const [activeExercise, setActiveExercise] = useState<string | null>(null);
  const [justCompleted, setJustCompleted] = useState<string | null>(null);

  const goBack = useCallback(() => {
    setActiveExercise(null);
    setJustCompleted(null);
    onContextChanged();
  }, [onContextChanged]);

  const handleComplete = useCallback((exerciseId: string) => {
    setJustCompleted(exerciseId);
    onContextChanged();
  }, [onContextChanged]);

  // ── Render active exercise ──
  if (activeExercise) {
    return renderExercise(activeExercise, justCompleted, context, goBack, handleComplete, onContextChanged);
  }

  // ── Hub grid ──
  return (
    <div className="space-y-8">
      {SECTIONS.map((section) => {
        const exercises = getExercisesBySection(section.id);
        return (
          <div key={section.id} className="space-y-3">
            <div>
              <h2 className="text-lg font-bold text-foreground">{section.title}</h2>
              <p className="text-sm text-foreground/50">{section.description}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {exercises.map((ex) => {
                const data = context[ex.contextType] ?? null;
                const state = ex.getState(data);
                return (
                  <ExerciseCard
                    key={ex.id}
                    exercise={ex}
                    state={state}
                    contextData={data}
                    onOpen={() => setActiveExercise(ex.id)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Exercise renderer ────────────────────────────────────────────────────────

function renderExercise(
  exerciseId: string,
  justCompleted: string | null,
  context: Record<string, unknown>,
  goBack: () => void,
  onComplete: (id: string) => void,
  onContextChanged: () => void,
) {
  const backButton = (
    <button
      onClick={goBack}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-foreground/15 bg-white/70 text-sm font-semibold text-foreground/50 hover:border-foreground/30 hover:text-foreground/70 transition-colors mb-4"
    >
      ← Zpět na Manuál
    </button>
  );

  // ── Kompas ──
  if (exerciseId === "kompas") {
    const kompasData = context.compass as KompasData | null;

    if (justCompleted === "kompas" && kompasData) {
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
              <p className="text-xs text-foreground/45">Aktuální vs. cílové hodnoty a fokus oblast jsou teď viditelné v dashboardu.</p>
            </div>
          }
          onGoPrehled={goBack}
          onEdit={() => onComplete("")}
        />
      );
    }

    return (
      <div>
        {backButton}
        {kompasData && (
          <ToolTopBar
            onReset={() => {
              try { localStorage.removeItem("kompas-data"); } catch {}
              fetch("/api/manual/user-context", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "compass", data: {} }) });
              onContextChanged();
              goBack();
            }}
            printNode={
              <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-foreground/15 bg-white/70 text-sm font-semibold text-foreground/50 hover:border-foreground/30 hover:text-foreground/70 transition-colors">
                Vytisknout
              </button>
            }
          />
        )}
        <KompasFlow onSaved={() => {
          try { const k = localStorage.getItem("kompas-data"); if (k) { /* data will be refreshed */ } } catch {}
          onComplete("kompas");
          onContextChanged();
        }} />
      </div>
    );
  }

  // ── Hodnoty ──
  if (exerciseId === "hodnoty") {
    const hodnotyData = context.values as HodnotyData | null;

    if (justCompleted === "hodnoty" && hodnotyData) {
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
                <p className="text-xs text-foreground/45 mt-2">Přidal/a jsi i skóre souladu.</p>
              )}
            </div>
          }
          onGoPrehled={goBack}
          onEdit={() => onComplete("")}
        />
      );
    }

    return (
      <div>
        {backButton}
        {hodnotyData && (
          <ToolTopBar
            onReset={() => {
              try { localStorage.removeItem("hodnoty-data"); } catch {}
              fetch("/api/manual/user-context", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "values", data: {} }) });
              onContextChanged();
              goBack();
            }}
            printNode={
              <PrintHodnotyButton
                data={hodnotyData}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-foreground/15 bg-white/70 text-sm font-semibold text-foreground/50 hover:border-foreground/30 hover:text-foreground/70 transition-colors disabled:opacity-50"
              />
            }
          />
        )}
        <HodnotyFlow onSaved={() => {
          onComplete("hodnoty");
          onContextChanged();
        }} />
      </div>
    );
  }

  // ── Nastavení oblastí ──
  if (exerciseId === "oblasti") {
    return (
      <div>
        {backButton}
        <NastaveniOblastiFlow
          initialData={context.areas as any ?? null}
          kompasData={context.compass as KompasData | null}
          onSave={async (data) => {
            await fetch("/api/manual/user-context", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "areas", data }) });
            onContextChanged();
          }}
          onComplete={() => { onComplete("oblasti"); onContextChanged(); }}
          onBack={goBack}
        />
      </div>
    );
  }

  // ── Vize ──
  if (exerciseId === "vize") {
    return (
      <div>
        {backButton}
        <VizeFlow
          initialData={context.vision as any ?? null}
          onSave={async (data) => {
            await fetch("/api/manual/user-context", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "vision", data }) });
            onContextChanged();
          }}
          onComplete={() => { onComplete("vize"); onContextChanged(); }}
        />
      </div>
    );
  }

  // ── Životní filozofie ──
  if (exerciseId === "filozofie") {
    return (
      <div>
        {backButton}
        <FilozofieFlow
          initialData={context.philosophy as any ?? null}
          onSave={async (data) => {
            await fetch("/api/manual/user-context", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "philosophy", data }) });
            onContextChanged();
          }}
          onComplete={() => { onComplete("filozofie"); onContextChanged(); }}
        />
      </div>
    );
  }

  // ── Akční plán ── (uses PrioritiesWidget which already exists)
  if (exerciseId === "akcni-plan") {
    const PrioritiesWidget = require("@/components/manual/PrioritiesWidget").default;
    return (
      <div>
        {backButton}
        <div className="max-w-2xl mx-auto">
          <PrioritiesWidget expanded />
        </div>
      </div>
    );
  }

  // ── Čtvrtletní check-in ──
  if (exerciseId === "ctvrtletni-checkin") {
    return (
      <div>
        {backButton}
        <QuarterlyCheckinFlow
          initialData={context.quarterly as any ?? null}
          kompasData={context.compass as KompasData | null}
          onSave={async (data) => {
            await fetch("/api/manual/user-context", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "quarterly", data }) });
            onContextChanged();
          }}
          onComplete={() => { onComplete("ctvrtletni-checkin"); onContextChanged(); }}
        />
      </div>
    );
  }

  // ── Ikigai ──
  if (exerciseId === "ikigai") {
    return (
      <div>
        {backButton}
        <IkigaiFlow
          initialData={context.ikigai as any ?? null}
          onSave={async (data) => {
            await fetch("/api/manual/user-context", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "ikigai", data }) });
            onContextChanged();
          }}
          onComplete={() => { onComplete("ikigai"); onContextChanged(); }}
        />
      </div>
    );
  }

  // ── Energetický audit ──
  if (exerciseId === "energie") {
    return (
      <div>
        {backButton}
        <EnergyAuditFlow
          initialData={context.energy as any ?? null}
          onSave={async (data) => {
            await fetch("/api/manual/user-context", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "energy", data }) });
            onContextChanged();
          }}
          onComplete={() => { onComplete("energie"); onContextChanged(); }}
        />
      </div>
    );
  }

  // ── Limitující přesvědčení ──
  if (exerciseId === "presvedceni") {
    return (
      <div>
        {backButton}
        <BeliefsFlow
          initialData={context.beliefs as any ?? null}
          onSave={async (data) => {
            await fetch("/api/manual/user-context", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "beliefs", data }) });
            onContextChanged();
          }}
          onComplete={() => { onComplete("presvedceni"); onContextChanged(); }}
        />
      </div>
    );
  }

  // ── Mapa vztahů ──
  if (exerciseId === "vztahy") {
    return (
      <div>
        {backButton}
        <RelationshipMapFlow
          initialData={context.relationships as any ?? null}
          onSave={async (data) => {
            await fetch("/api/manual/user-context", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "relationships", data }) });
            onContextChanged();
          }}
          onComplete={() => { onComplete("vztahy"); onContextChanged(); }}
        />
      </div>
    );
  }

  // Fallback
  return (
    <div className="text-center py-12">
      <p className="text-foreground/50">Toto cvičení ještě není dostupné.</p>
      <button onClick={goBack} className="mt-4 px-5 py-2 bg-accent text-white rounded-full text-sm font-semibold">
        ← Zpět na Manuál
      </button>
    </div>
  );
}
