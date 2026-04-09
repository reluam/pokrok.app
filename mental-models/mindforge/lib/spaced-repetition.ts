import type { SpacedRepetitionCard } from '@/types';

/**
 * SM-2 algorithm implementation for spaced repetition.
 * Quality: 0-5 (0-2 = fail, 3-5 = pass)
 */
export function sm2(
  card: Pick<SpacedRepetitionCard, 'ease_factor' | 'interval_days' | 'repetitions'>,
  quality: number
): { ease_factor: number; interval_days: number; repetitions: number } {
  const q = Math.min(5, Math.max(0, Math.round(quality)));

  let { ease_factor, interval_days, repetitions } = card;

  if (q < 3) {
    // Failed review — reset
    repetitions = 0;
    interval_days = 1;
  } else {
    // Successful review
    if (repetitions === 0) {
      interval_days = 1;
    } else if (repetitions === 1) {
      interval_days = 6;
    } else {
      interval_days = Math.round(interval_days * ease_factor);
    }
    repetitions += 1;
  }

  // Update ease factor
  ease_factor = ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  ease_factor = Math.max(1.3, ease_factor);

  return { ease_factor, interval_days, repetitions };
}

export function getNextReviewDate(intervalDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + intervalDays);
  return date.toISOString().split('T')[0];
}

export function isDueForReview(nextReviewDate: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return nextReviewDate <= today;
}

export function qualityFromScore(score: number): number {
  // score 0-100 → quality 0-5
  if (score >= 90) return 5;
  if (score >= 70) return 4;
  if (score >= 50) return 3;
  if (score >= 30) return 2;
  if (score >= 10) return 1;
  return 0;
}
