/**
 * Bidirectional transforms between localStorage format and API format
 * for user context data (compass, values, rituals).
 *
 * The API stores the FULL localStorage-format objects for cross-platform sync.
 * AI readers extract what they need from either old (flat) or new (full) formats.
 */

import type { KompasData } from "@/components/KompasFlow"
import type { HodnotyData } from "@/components/HodnotyFlow"

// ── Types ──────────────────────────────────────────────────────────────────

export type RitualSelection = {
  morning: string[]
  daily: string[]
  evening: string[]
  durationOverrides?: Record<string, number>
}

// Old flat API formats (for backwards compatibility)
type FlatCompass = { area: string; current: number; goal: number }[]
type FlatValues = { name: string; alignment: number }[]
type FlatRituals = { slot: string; name: string; ritualId: string }[]

// ── Compass ────────────────────────────────────────────────────────────────

/** Parse compass data from API — handles both old flat array and new full object */
export function kompasFromApi(apiData: unknown): KompasData | null {
  if (!apiData) return null

  // New full format (stored as KompasData object)
  if (typeof apiData === "object" && !Array.isArray(apiData) && "currentVals" in (apiData as Record<string, unknown>)) {
    const d = apiData as Record<string, unknown>
    return {
      currentVals: (d.currentVals ?? {}) as Record<string, number>,
      goalVals: (d.goalVals ?? {}) as Record<string, number>,
      reflectionAnswers: (d.reflectionAnswers ?? {}) as Record<string, string>,
      areaAnswers: (d.areaAnswers ?? {}) as Record<string, string[]>,
      focusArea: d.focusArea as string | undefined,
      completedAt: (d.completedAt ?? "") as string,
    }
  }

  // Old flat format — reconstruct partial KompasData
  if (Array.isArray(apiData)) {
    const flat = apiData as FlatCompass
    const currentVals: Record<string, number> = {}
    const goalVals: Record<string, number> = {}
    for (const item of flat) {
      const key = item.area?.toLowerCase?.() ?? ""
      currentVals[key] = item.current ?? 0
      goalVals[key] = item.goal ?? 0
    }
    return {
      currentVals,
      goalVals,
      reflectionAnswers: {},
      areaAnswers: {},
      completedAt: "",
    }
  }

  return null
}

/** Convert KompasData to API storage format (full object) */
export function kompasToApi(data: KompasData): KompasData {
  return data
}

// ── Values ─────────────────────────────────────────────────────────────────

/** Parse hodnoty data from API — handles flat [{name, alignment}] format */
export function hodnotyFromApi(apiData: unknown): HodnotyData | null {
  if (!apiData) return null

  // New full format (stored as HodnotyData object)
  if (typeof apiData === "object" && !Array.isArray(apiData) && "finalValues" in (apiData as Record<string, unknown>)) {
    return apiData as HodnotyData
  }

  // Old flat format — reconstruct HodnotyData
  if (Array.isArray(apiData)) {
    const flat = apiData as FlatValues
    const finalValues = flat.map(v => v.name)
    const alignmentScores: Record<string, number> = {}
    for (const v of flat) {
      if (v.alignment) alignmentScores[v.name] = v.alignment
    }
    return {
      finalValues,
      alignmentScores: Object.keys(alignmentScores).length > 0 ? alignmentScores : undefined,
      savedAt: "",
    }
  }

  return null
}

/** Convert HodnotyData to API storage format (full object) */
export function hodnotyToApi(data: HodnotyData): HodnotyData {
  return data
}

// ── Rituals ────────────────────────────────────────────────────────────────

/** Parse rituals data from API — handles both old flat array and new structured object */
export function ritualsFromApi(apiData: unknown): RitualSelection | null {
  if (!apiData) return null

  // New structured format
  if (typeof apiData === "object" && !Array.isArray(apiData) && "morning" in (apiData as Record<string, unknown>)) {
    const d = apiData as Record<string, unknown>
    return {
      morning: (d.morning ?? []) as string[],
      daily: (d.daily ?? []) as string[],
      evening: (d.evening ?? []) as string[],
      durationOverrides: d.durationOverrides as Record<string, number> | undefined,
    }
  }

  // Old flat format — reconstruct from slot-based array
  if (Array.isArray(apiData)) {
    const flat = apiData as FlatRituals
    const morning: string[] = []
    const daily: string[] = []
    const evening: string[] = []
    for (const item of flat) {
      const id = item.ritualId ?? item.name
      if (item.slot === "ráno") morning.push(id)
      else if (item.slot === "přes den") daily.push(id)
      else if (item.slot === "večer") evening.push(id)
    }
    return { morning, daily, evening }
  }

  return null
}

/** Convert RitualSelection to API storage format (full object) */
export function ritualsToApi(data: RitualSelection): RitualSelection {
  return data
}

// ── AI context extraction ──────────────────────────────────────────────────

const WHEEL_AREAS_MAP: Record<string, string> = {
  kariera: "Kariéra", finance: "Finance", zdravi: "Zdraví",
  rodina: "Rodina", pratele: "Přátelé", rozvoj: "Rozvoj",
  volny: "Volný čas", smysl: "Smysl",
}

/** Extract flat compass format for AI prompts from either format */
export function extractCompassForAI(data: unknown): { area: string; current: number; goal: number }[] | null {
  if (!data) return null

  // Already flat format
  if (Array.isArray(data)) return data as FlatCompass

  // Full KompasData format
  if (typeof data === "object" && "currentVals" in (data as Record<string, unknown>)) {
    const kd = data as KompasData
    return Object.keys(kd.currentVals).map(key => ({
      area: WHEEL_AREAS_MAP[key] ?? key,
      current: kd.currentVals[key] ?? 0,
      goal: kd.goalVals?.[key] ?? 0,
    }))
  }

  return null
}

/** Extract focus area from compass data (either format) */
export function extractFocusAreaForAI(data: unknown): string | undefined {
  if (!data || Array.isArray(data)) return undefined
  if (typeof data === "object" && "focusArea" in (data as Record<string, unknown>)) {
    return (data as KompasData).focusArea
  }
  return undefined
}

/** Extract flat rituals format for AI prompts from either format */
export function extractRitualsForAI(
  data: unknown,
  ritualsById: Record<string, { name: string }>
): { slot: string; name: string; duration?: string }[] | null {
  if (!data) return null

  // Already flat format
  if (Array.isArray(data)) return data as FlatRituals

  // Structured format
  if (typeof data === "object" && "morning" in (data as Record<string, unknown>)) {
    const sel = data as RitualSelection
    return [
      ...(sel.morning ?? []).map(id => ({ slot: "ráno", name: ritualsById[id]?.name ?? id, ritualId: id })),
      ...(sel.daily ?? []).map(id => ({ slot: "přes den", name: ritualsById[id]?.name ?? id, ritualId: id })),
      ...(sel.evening ?? []).map(id => ({ slot: "večer", name: ritualsById[id]?.name ?? id, ritualId: id })),
    ]
  }

  return null
}
