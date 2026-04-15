'use client';

import { useState, useEffect } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { calculateLevel, getLevelTitle } from '@/lib/xp-engine';
import type { LevelTitle, UserStats } from '@/types';

export type Language = 'cs' | 'en';

interface WebUserState {
  isAuthenticated: boolean;
  userId: string | null;
  displayName: string;
  email: string | null;
  stats: UserStats;
  levelTitle: LevelTitle;
  language: Language;

  login: (userId: string, email: string, displayName: string) => void;
  logout: () => void;
  addXp: (amount: number) => void;
  updateStreak: () => void;
  incrementModelsMastered: () => void;
  setLanguage: (lang: Language) => void;
  setStats: (stats: Record<string, any>) => void;
}

const defaultStats: UserStats = {
  user_id: '',
  total_xp: 0,
  current_level: 1,
  current_streak: 0,
  longest_streak: 0,
  last_activity_date: null,
  models_mastered: 0,
};

export const useWebUserStore = create<WebUserState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      userId: null,
      displayName: '',
      email: null,
      stats: defaultStats,
      levelTitle: 'Začátečník',
      language: 'cs',

      login: (userId, email, displayName) =>
        set({
          isAuthenticated: true,
          userId,
          email,
          displayName,
          stats: { ...defaultStats, user_id: userId },
        }),

      logout: () =>
        set({
          isAuthenticated: false,
          userId: null,
          displayName: '',
          email: null,
          stats: defaultStats,
          levelTitle: 'Začátečník',
        }),

      addXp: (amount) => {
        const { stats } = get();
        const newXp = stats.total_xp + amount;
        const newLevel = calculateLevel(newXp);
        set({
          stats: { ...stats, total_xp: newXp, current_level: newLevel },
          levelTitle: getLevelTitle(newLevel),
        });
      },

      updateStreak: () => {
        const { stats } = get();
        const today = new Date().toISOString().split('T')[0];
        if (stats.last_activity_date === today) return;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const newStreak =
          stats.last_activity_date === yesterdayStr
            ? stats.current_streak + 1
            : 1;

        set({
          stats: {
            ...stats,
            current_streak: newStreak,
            longest_streak: Math.max(stats.longest_streak, newStreak),
            last_activity_date: today,
          },
        });
      },

      incrementModelsMastered: () => {
        const { stats } = get();
        set({
          stats: { ...stats, models_mastered: stats.models_mastered + 1 },
        });
      },

      setLanguage: (lang) => set({ language: lang }),

      setStats: (incoming) => {
        const merged = { ...get().stats, ...incoming } as UserStats;
        set({
          stats: merged,
          levelTitle: getLevelTitle(calculateLevel(merged.total_xp)),
        });
      },
    }),
    {
      name: 'calibrate-user',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/**
 * Returns true once the user store has finished rehydrating from localStorage.
 * Use this to prevent flash-redirects on page refresh.
 */
export function useStoreHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (useWebUserStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    const unsub = useWebUserStore.persist.onFinishHydration(() =>
      setHydrated(true),
    );
    return unsub;
  }, []);

  return hydrated;
}
