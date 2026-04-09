export const colors = {
  primary: '#0EA5E9',
  primaryDark: '#0284C7',
  background: '#0F172A',
  card: '#1E293B',
  surface: '#334155',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  xpGold: '#FBBF24',
  streak: '#F97316',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const CATEGORY_LABELS: Record<string, string> = {
  general_thinking: 'Obecné myšlení',
  physics: 'Fyzika & věda',
  psychology: 'Psychologie',
  economics: 'Ekonomie',
  systems: 'Systémy',
  numeracy: 'Čísla & data',
};

export const LEVEL_TITLES = [
  { min: 1, title: 'Začátečník' },
  { min: 5, title: 'Myslitel' },
  { min: 10, title: 'Stratég' },
  { min: 20, title: 'Filozof' },
  { min: 50, title: 'Master' },
] as const;
