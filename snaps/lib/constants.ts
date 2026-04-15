export const colors = {
  // Primary — warm orange inspired by pokrok.app
  primary: '#FF8C42',
  primaryDark: '#FF6B1A',
  primaryLight: '#FFF1E6',

  // Accent palette
  teal: '#3AB5AD',
  tealLight: '#E0F4F2',
  orange: '#FF8C42',
  orangeLight: '#FFF1E6',
  yellow: '#FBBF24',
  yellowLight: '#FFF8E1',
  rose: '#EC4899',
  roseLight: '#FCE7F3',
  purple: '#8B5CF6',
  purpleLight: '#F1ECFE',

  // Light cream theme
  background: '#FDFDF7',
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',
  surface: '#F5F4EE',
  border: '#FF8C42',
  borderLight: '#FFD0B3',
  borderSubtle: 'rgba(255, 140, 66, 0.18)',

  // Text
  textPrimary: '#171717',
  textSecondary: '#666666',
  textMuted: '#999999',

  // Status
  success: '#22C55E',
  successLight: '#E6F8EC',
  warning: '#F59E0B',
  warningLight: '#FFF4E0',
  error: '#EF4444',
  errorLight: '#FDECEC',

  // Gamification
  xpGold: '#FBBF24',
  xpGoldLight: '#FFF8E1',
  streak: '#F97316',
  streakLight: '#FFEDD9',
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
  xxxl: 40,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
} as const;

export const CATEGORY_LABELS: Record<string, string> = {
  general_thinking: 'Obecné myšlení',
  physics: 'Fyzika & věda',
  psychology: 'Psychologie',
  economics: 'Ekonomie',
  systems: 'Systémy',
  numeracy: 'Čísla & data',
  cognitive_foundations: 'Základy kognice',
  decision_biases: 'Rozhodování',
  social_biases: 'Sociální zkreslení',
  information_biases: 'Informační zkreslení',
  probability_biases: 'Pravděpodobnost',
  memory_biases: 'Paměť',
  self_perception_biases: 'Sebepojetí',
  perception_biases: 'Pozornost & vnímání',
  human_body: 'Tělo',
  human_brain: 'Mozek',
  human_society: 'Společnost',
  health_fitness: 'Zdraví & fitness',
  mindfulness: 'Mindfulness',
  productivity: 'Produktivita',
  mindsets: 'Mindsets',
  performance: 'Výkon',
};

export const CATEGORY_LABELS_EN: Record<string, string> = {
  general_thinking: 'General thinking',
  physics: 'Physics & science',
  psychology: 'Psychology',
  economics: 'Economics',
  systems: 'Systems',
  numeracy: 'Numbers & data',
  cognitive_foundations: 'Foundations of cognition',
  decision_biases: 'Decision-making',
  social_biases: 'Social biases',
  information_biases: 'Information biases',
  probability_biases: 'Probability',
  memory_biases: 'Memory',
  self_perception_biases: 'Self-perception',
  perception_biases: 'Attention & perception',
  human_body: 'Body',
  human_brain: 'Brain',
  human_society: 'Society',
  health_fitness: 'Health & fitness',
  mindfulness: 'Mindfulness',
  productivity: 'Productivity',
  mindsets: 'Mindsets',
  performance: 'Performance',
};

export function getCategoryLabel(category: string, lang: 'cs' | 'en' = 'cs'): string {
  const dict = lang === 'en' ? CATEGORY_LABELS_EN : CATEGORY_LABELS;
  return dict[category] ?? category;
}

export const CATEGORY_COLORS: Record<string, string> = {
  general_thinking: colors.primary,
  physics: colors.teal,
  psychology: colors.purple,
  economics: colors.xpGold,
  systems: colors.success,
  numeracy: colors.primary,
  cognitive_foundations: '#6366F1',
  decision_biases: '#F59E0B',
  social_biases: '#EC4899',
  information_biases: '#EF4444',
  probability_biases: '#14B8A6',
  memory_biases: '#06B6D4',
  self_perception_biases: '#8B5CF6',
  perception_biases: '#D946EF',
  human_body: '#3AB5AD',
  human_brain: '#3AB5AD',
  human_society: '#3AB5AD',
  health_fitness: '#22C55E',
  mindfulness: '#8B5CF6',
  productivity: '#F59E0B',
  mindsets: '#EC4899',
  performance: '#F97316',
};

export const CATEGORY_ICONS: Record<string, string> = {
  general_thinking: 'Lightbulb',
  physics: 'Atom',
  psychology: 'Brain',
  economics: 'TrendingUp',
  systems: 'Network',
  numeracy: 'BarChart3',
  cognitive_foundations: 'Brain',
  decision_biases: 'AlertTriangle',
  social_biases: 'Users',
  information_biases: 'Filter',
  probability_biases: 'Dice1',
  memory_biases: 'Clock',
  self_perception_biases: 'User',
  perception_biases: 'Eye',
  human_body: 'Activity',
  human_brain: 'Brain',
  human_society: 'Users',
  health_fitness: 'Activity',
  mindfulness: 'Wind',
  productivity: 'Zap',
  mindsets: 'Compass',
  performance: 'Trophy',
};

export const LEVEL_TITLES = [
  { min: 1, title: 'Začátečník' },
  { min: 5, title: 'Myslitel' },
  { min: 10, title: 'Stratég' },
  { min: 20, title: 'Filozof' },
  { min: 50, title: 'Master' },
] as const;
