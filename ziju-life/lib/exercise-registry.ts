// Exercise registry — defines all exercises, their state logic, and summaries

import type { KompasData } from "@/components/KompasFlow";
import type { HodnotyData } from "@/components/HodnotyFlow";

export type ExerciseState = "not_started" | "in_progress" | "completed";

export type ExerciseSection = "audit" | "nastavovani" | "smerovani" | "hlubsi";

export interface ExerciseSummary {
  label: string;
  details?: string[];
}

// ── New exercise data types ──────────────────────────────────────────────────

export type AreaSetupData = {
  answers: Record<string, string[]>;
  principles: Record<string, string[]>;
  lessons: Record<string, string[]>;
  habitsAdd: Record<string, string[]>;
  habitsRemove: Record<string, string[]>;
  metrics: Record<string, string[]>;
  completedAreas: string[];
  savedAt: string;
};

export type VisionData = {
  idealDay: string;
  eightyBirthday: { partner: string; children: string; colleagues: string };
  bodyCheck: { energy: string; tension: string; adjustments: string };
  savedAt: string;
};

export type PhilosophyData = {
  statement: string;
  principles: string[];
  savedAt: string;
};

export type QuarterlyCheckinData = {
  quarter: string;
  celebrations: string[];
  learnings: string[];
  adjustments: string[];
  areaScores: Record<string, number>;
  updatedAt: string;
};

type RitualSelection = { morning: string[]; daily: string[]; evening: string[] };

export type IkigaiData = {
  love: string[];
  goodAt: string[];
  worldNeeds: string[];
  paidFor: string[];
  reflections: { passion: string; mission: string; profession: string; vocation: string; ikigai: string };
  savedAt: string;
};

export type EnergyAuditData = {
  activities: { name: string; rating: number; frequency: string }[];
  insights: string;
  idealWeek: string;
  savedAt: string;
};

export type BeliefsData = {
  beliefs: { area: string; belief: string; evidence: string; counter: string; reframe: string }[];
  savedAt: string;
};

export type RelationshipMapData = {
  people: { name: string; circle: "inner" | "middle" | "outer"; health: number; energizes: boolean; note: string }[];
  insights: string;
  savedAt: string;
};

// ── Exercise definition ──────────────────────────────────────────────────────

export interface ExerciseDefinition {
  id: string;
  contextType: string;
  section: ExerciseSection;
  emoji: string;
  title: string;
  description: string;
  getState: (data: unknown) => ExerciseState;
  getSummary: (data: unknown) => ExerciseSummary | null;
  getProgress?: (data: unknown) => string | null;
}

// ── Section metadata ─────────────────────────────────────────────────────────

export const SECTIONS: { id: ExerciseSection; title: string; description: string }[] = [
  { id: "nastavovani", title: "Nastavování", description: "Principy, lekce a návyky pro každou oblast" },
  { id: "audit", title: "Audit života", description: "Kde jsi teď a co je pro tebe důležité" },
  { id: "smerovani", title: "Směřování", description: "Kam míříš a jak se tam dostaneš" },
  { id: "hlubsi", title: "Hlubší poznání", description: "Účel, energie, přesvědčení a vztahy" },
];

// ── Exercise definitions ─────────────────────────────────────────────────────

export const EXERCISES: ExerciseDefinition[] = [
  // ── Audit života ──
  {
    id: "kompas",
    contextType: "compass",
    section: "audit",
    emoji: "🧭",
    title: "Kompas",
    description: "Ohodnoť 8 životních oblastí — aktuální stav a cíl za 5 let.",
    getState: (data) => {
      const d = data as KompasData | null;
      if (!d) return "not_started";
      if (d.completedAt) return "completed";
      if (d.currentVals && Object.keys(d.currentVals).length > 0) return "in_progress";
      return "not_started";
    },
    getSummary: (data) => {
      const d = data as KompasData | null;
      if (!d?.currentVals) return null;
      const avg = Object.values(d.currentVals);
      const mean = avg.length > 0 ? (avg.reduce((s, v) => s + v, 0) / avg.length).toFixed(1) : "—";
      return { label: `Průměr: ${mean}/10`, details: d.focusArea ? [`Focus: ${d.focusArea}`] : undefined };
    },
  },
  {
    id: "hodnoty",
    contextType: "values",
    section: "audit",
    emoji: "💎",
    title: "Hodnoty",
    description: "Vyber své klíčové hodnoty a ohodnoť, jak moc podle nich žiješ.",
    getState: (data) => {
      const d = data as HodnotyData | null;
      if (!d) return "not_started";
      if (d.finalValues?.length > 0 && d.alignmentScores) return "completed";
      if (d.finalValues?.length > 0) return "in_progress";
      return "not_started";
    },
    getSummary: (data) => {
      const d = data as HodnotyData | null;
      if (!d?.finalValues?.length) return null;
      return { label: `${d.finalValues.length} hodnot`, details: d.finalValues.slice(0, 5) };
    },
  },

  // ── Nastavování ──
  {
    id: "oblasti",
    contextType: "areas",
    section: "nastavovani",
    emoji: "📋",
    title: "Nastavení oblastí",
    description: "Pro každou oblast: otázky, principy, lekce, návyky a metriky.",
    getState: (data) => {
      const d = data as AreaSetupData | null;
      if (!d) return "not_started";
      if (d.completedAreas?.length === 8) return "completed";
      if (d.completedAreas?.length > 0) return "in_progress";
      return "not_started";
    },
    getSummary: (data) => {
      const d = data as AreaSetupData | null;
      if (!d?.completedAreas?.length) return null;
      return { label: `${d.completedAreas.length}/8 oblastí` };
    },
    getProgress: (data) => {
      const d = data as AreaSetupData | null;
      if (!d?.completedAreas?.length) return null;
      return `${d.completedAreas.length}/8`;
    },
  },
  // ── Směřování ──
  {
    id: "vize",
    contextType: "vision",
    section: "smerovani",
    emoji: "🔭",
    title: "Vize",
    description: "Popiš svůj ideální den za 5 let a zamysli se nad svým odkazem.",
    getState: (data) => {
      const d = data as VisionData | null;
      if (!d) return "not_started";
      if (d.idealDay && d.savedAt) return "completed";
      if (d.idealDay || d.eightyBirthday?.partner) return "in_progress";
      return "not_started";
    },
    getSummary: (data) => {
      const d = data as VisionData | null;
      if (!d?.idealDay) return null;
      const preview = d.idealDay.slice(0, 80) + (d.idealDay.length > 80 ? "…" : "");
      return { label: preview };
    },
  },
  {
    id: "filozofie",
    contextType: "philosophy",
    section: "smerovani",
    emoji: "🌱",
    title: "Životní filozofie",
    description: "Napiš 2–5 vět, které vystihují, jak chceš žít.",
    getState: (data) => {
      const d = data as PhilosophyData | null;
      if (!d) return "not_started";
      if (d.statement && d.savedAt) return "completed";
      if (d.statement) return "in_progress";
      return "not_started";
    },
    getSummary: (data) => {
      const d = data as PhilosophyData | null;
      if (!d?.statement) return null;
      const preview = d.statement.slice(0, 100) + (d.statement.length > 100 ? "…" : "");
      return { label: preview };
    },
  },
  {
    id: "akcni-plan",
    contextType: "priorities",
    section: "smerovani",
    emoji: "🎯",
    title: "Akční plán",
    description: "Kroky na tento týden, měsíc a milníky na rok.",
    getState: (data) => {
      if (!data || typeof data !== "object") return "not_started";
      const d = data as Record<string, unknown>;
      const hasAny = d.weekly || d.monthly || d.yearly;
      if (hasAny) return "completed";
      return "not_started";
    },
    getSummary: (data) => {
      if (!data || typeof data !== "object") return null;
      return { label: "Nastaveno" };
    },
  },
  {
    id: "ctvrtletni-checkin",
    contextType: "quarterly",
    section: "smerovani",
    emoji: "🔄",
    title: "Čtvrtletní check-in",
    description: "Oslav pokrok, zamysli se a aktualizuj svůj manuál.",
    getState: (data) => {
      const d = data as QuarterlyCheckinData | null;
      if (!d) return "not_started";
      if (d.updatedAt) return "completed";
      if (d.celebrations?.length > 0) return "in_progress";
      return "not_started";
    },
    getSummary: (data) => {
      const d = data as QuarterlyCheckinData | null;
      if (!d?.quarter) return null;
      return { label: d.quarter };
    },
  },
  // ── Hlubší poznání ──
  {
    id: "ikigai",
    contextType: "ikigai",
    section: "hlubsi",
    emoji: "☀️",
    title: "Ikigai",
    description: "Najdi svůj účel na průsečíku toho, co miluješ, umíš, svět potřebuje a co tě živí.",
    getState: (data) => {
      const d = data as IkigaiData | null;
      if (!d) return "not_started";
      if (d.savedAt && d.reflections?.ikigai) return "completed";
      if (d.love?.some(Boolean)) return "in_progress";
      return "not_started";
    },
    getSummary: (data) => {
      const d = data as IkigaiData | null;
      if (!d?.reflections?.ikigai) return null;
      const preview = d.reflections.ikigai.slice(0, 80) + (d.reflections.ikigai.length > 80 ? "…" : "");
      return { label: preview };
    },
  },
  {
    id: "energie",
    contextType: "energy",
    section: "hlubsi",
    emoji: "⚡",
    title: "Energetický audit",
    description: "Co ti dává energii a co ji bere? Identifikuj energizéry a vampýry.",
    getState: (data) => {
      const d = data as EnergyAuditData | null;
      if (!d) return "not_started";
      if (d.savedAt && d.insights) return "completed";
      if (d.activities?.some(a => a.name)) return "in_progress";
      return "not_started";
    },
    getSummary: (data) => {
      const d = data as EnergyAuditData | null;
      if (!d?.activities) return null;
      const filled = d.activities.filter(a => a.name && a.rating !== 0);
      const pos = filled.filter(a => a.rating > 0).length;
      const neg = filled.filter(a => a.rating < 0).length;
      return { label: `${pos} energizérů, ${neg} vampýrů` };
    },
  },
  {
    id: "presvedceni",
    contextType: "beliefs",
    section: "hlubsi",
    emoji: "🧠",
    title: "Limitující přesvědčení",
    description: "Odhal přesvědčení, která blokují změnu, a přeformuluj je.",
    getState: (data) => {
      const d = data as BeliefsData | null;
      if (!d) return "not_started";
      if (d.savedAt && d.beliefs?.some(b => b.reframe)) return "completed";
      if (d.beliefs?.some(b => b.belief)) return "in_progress";
      return "not_started";
    },
    getSummary: (data) => {
      const d = data as BeliefsData | null;
      if (!d?.beliefs) return null;
      const done = d.beliefs.filter(b => b.reframe).length;
      return { label: `${done} přeformulovaných přesvědčení` };
    },
  },
  {
    id: "vztahy",
    contextType: "relationships",
    section: "hlubsi",
    emoji: "🗺️",
    title: "Mapa vztahů",
    description: "Zmapuj své vztahy — kdo tě nabíjí, kdo vyčerpává a jak zdravé jsou.",
    getState: (data) => {
      const d = data as RelationshipMapData | null;
      if (!d) return "not_started";
      if (d.savedAt && d.insights) return "completed";
      if (d.people?.some(p => p.name)) return "in_progress";
      return "not_started";
    },
    getSummary: (data) => {
      const d = data as RelationshipMapData | null;
      if (!d?.people) return null;
      const filled = d.people.filter(p => p.name);
      return { label: `${filled.length} lidí zmapováno` };
    },
  },
];

export function getExercisesBySection(section: ExerciseSection): ExerciseDefinition[] {
  return EXERCISES.filter((e) => e.section === section);
}
