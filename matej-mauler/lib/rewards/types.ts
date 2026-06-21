// Rewards layer types. Badge catalog lives in code (lib/rewards/<slug>.ts) and is seeded
// into the `badges` table on ensure(); evaluate() logic stays in code only.

export type ParticipationInput = {
  experimentSlug: string;
  payload?: Record<string, unknown> | null;
  insight?: Record<string, unknown> | null;
};

export type UserStats = {
  /** How many distinct experiments this user has participated in (cross-series signal). */
  distinctExperiments: number;
  /** How many times this user has participated in THIS experiment. */
  thisExperimentCount: number;
};

export type RewardContext = {
  participation: ParticipationInput;
  stats: UserStats;
};

export type BadgeDef = {
  slug: string;
  /** null = studio-wide / cross-experiment badge. */
  experimentSlug: string | null;
  name: string;
  /** Self-knowledge sentence — the shareable payload. Never "completed X". */
  description: string;
  /** Machine key mirrored into the badges table for reference. */
  criteriaKey: string;
  xp: number;
  evaluate: (ctx: RewardContext) => boolean;
};

// Small safe readers for the loosely-typed insight/payload jsonb.
export const asNumber = (v: unknown): number => (typeof v === "number" ? v : NaN);
export const asBool = (v: unknown): boolean => v === true;
