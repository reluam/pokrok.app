import type { LevelInfo, LevelTitle } from '@/types';

export function calculateLevel(totalXp: number): number {
  return Math.floor(Math.sqrt(totalXp / 100)) + 1;
}

export function getLevelTitle(level: number): LevelTitle {
  if (level >= 50) return 'Master';
  if (level >= 20) return 'Filozof';
  if (level >= 10) return 'Stratég';
  if (level >= 5) return 'Myslitel';
  return 'Začátečník';
}

export function xpForLevel(level: number): number {
  return (level - 1) * (level - 1) * 100;
}

export function getLevelInfo(totalXp: number): LevelInfo {
  const level = calculateLevel(totalXp);
  const xpForCurrentLevel = xpForLevel(level);
  const xpForNextLevel = xpForLevel(level + 1);
  const progress = (totalXp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel);

  return {
    level,
    title: getLevelTitle(level),
    xpForCurrentLevel,
    xpForNextLevel,
    progress: Math.min(Math.max(progress, 0), 1),
  };
}

export function calculateLessonXp(params: {
  baseXp: number;
  firstTryCorrect: boolean;
  streakDays: number;
}): { total: number; breakdown: { base: number; bonus: number; streak: number } } {
  const base = params.baseXp;
  const bonus = params.firstTryCorrect ? 5 : 0;
  const streak = Math.min(params.streakDays, 30);
  return {
    total: base + bonus + streak,
    breakdown: { base, bonus, streak },
  };
}
