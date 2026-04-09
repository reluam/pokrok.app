import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { calculateLevel, getLevelTitle } from '@/lib/xp-engine';
import type { LevelTitle, UserStats } from '@/types';

interface UserState {
  isAuthenticated: boolean;
  userId: string | null;
  displayName: string;
  email: string | null;
  stats: UserStats;
  levelTitle: LevelTitle;

  login: (userId: string, email: string, displayName: string) => void;
  logout: () => void;
  addXp: (amount: number) => void;
  updateStreak: () => void;
  incrementModelsMastered: () => void;
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

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      userId: null,
      displayName: '',
      email: null,
      stats: defaultStats,
      levelTitle: 'Začátečník',

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
    }),
    {
      name: 'snaps-user',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
