import { addXp, awardBadge, getBadgeBySlug, getUserParticipations, getUserStats } from "../accountsDb";
import { badgesForExperiment } from "./index";
import type { ParticipationInput } from "./types";

export type AwardedBadge = { slug: string; name: string; description: string; xp: number };

/** Call AFTER a participation is saved. Awards any newly-earned badges + XP, idempotently.
 *  Returns the badges awarded *this call* (for the unlock UI — surface the description). */
export async function evaluateRewards({
  userId,
  experimentSlug,
  participation,
}: {
  userId: string;
  experimentSlug: string;
  participation: ParticipationInput;
}): Promise<AwardedBadge[]> {
  const stats = await getUserStats(userId, experimentSlug);
  const defs = badgesForExperiment(experimentSlug);
  const awarded: AwardedBadge[] = [];

  for (const def of defs) {
    if (!def.evaluate({ participation, stats })) continue;
    const badge = await getBadgeBySlug(def.slug);
    if (!badge) continue; // catalog not seeded yet — skip rather than crash

    const isNew = await awardBadge(userId, badge.id, def.experimentSlug, {
      criteriaKey: def.criteriaKey,
      // store WHY: a snapshot of the signal that triggered it
      snapshot: participation.insight ?? participation.payload ?? null,
    });
    if (!isNew) continue;

    await addXp(userId, def.experimentSlug, def.xp, def.name);
    awarded.push({ slug: def.slug, name: def.name, description: def.description, xp: def.xp });
  }

  return awarded;
}

/** Re-run reward evaluation across ALL of a user's participations (used after an anon→account
 *  merge so insight-based badges from anonymous play get awarded). Idempotent. */
export async function recomputeUserRewards(userId: string): Promise<AwardedBadge[]> {
  const parts = await getUserParticipations(userId);
  const all: AwardedBadge[] = [];
  for (const p of parts) {
    const awarded = await evaluateRewards({
      userId,
      experimentSlug: p.experiment_slug,
      participation: {
        experimentSlug: p.experiment_slug,
        payload: (p.payload as Record<string, unknown> | null) ?? null,
        insight: (p.insight as Record<string, unknown> | null) ?? null,
      },
    });
    all.push(...awarded);
  }
  return all;
}
