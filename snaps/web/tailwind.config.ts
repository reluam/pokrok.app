import type { Config } from 'tailwindcss';
import { colors, spacing, fontSize, borderRadius } from '../lib/constants';

// Map Calibrate design tokens (shared with the mobile Expo app) to Tailwind
// theme. Numeric values from lib/constants.ts are converted to px strings.
const toPx = (obj: Record<string, number>) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, `${v}px`]));

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: colors.primary,
          dark: colors.primaryDark,
          light: colors.primaryLight,
        },
        teal: { DEFAULT: colors.teal, light: colors.tealLight },
        yellow: { DEFAULT: colors.yellow, light: colors.yellowLight },
        rose: { DEFAULT: colors.rose, light: colors.roseLight },
        purple: { DEFAULT: colors.purple, light: colors.purpleLight },
        background: colors.background,
        card: colors.card,
        surface: colors.surface,
        border: {
          DEFAULT: colors.border,
          light: colors.borderLight,
          subtle: colors.borderSubtle,
        },
        ink: {
          primary: colors.textPrimary,
          secondary: colors.textSecondary,
          muted: colors.textMuted,
        },
        success: { DEFAULT: colors.success, light: colors.successLight },
        warning: { DEFAULT: colors.warning, light: colors.warningLight },
        error: { DEFAULT: colors.error, light: colors.errorLight },
        xp: { DEFAULT: colors.xpGold, light: colors.xpGoldLight },
        streak: { DEFAULT: colors.streak, light: colors.streakLight },
      },
      spacing: toPx(spacing),
      fontSize: {
        xs: [`${fontSize.xs}px`, { lineHeight: '1.4' }],
        sm: [`${fontSize.sm}px`, { lineHeight: '1.5' }],
        md: [`${fontSize.md}px`, { lineHeight: '1.55' }],
        lg: [`${fontSize.lg}px`, { lineHeight: '1.5' }],
        xl: [`${fontSize.xl}px`, { lineHeight: '1.3' }],
        '2xl': [`${fontSize.xxl}px`, { lineHeight: '1.2' }],
        '3xl': [`${fontSize.xxxl}px`, { lineHeight: '1.1' }],
        // Extra landing-page sizes beyond shared scale
        '4xl': ['56px', { lineHeight: '1.05' }],
        '5xl': ['72px', { lineHeight: '1.02' }],
      },
      borderRadius: {
        sm: `${borderRadius.sm}px`,
        md: `${borderRadius.md}px`,
        lg: `${borderRadius.lg}px`,
        xl: `${borderRadius.xl}px`,
        '2xl': `${borderRadius.xxl}px`,
        full: `${borderRadius.full}px`,
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(23, 23, 23, 0.04), 0 4px 16px rgba(23, 23, 23, 0.04)',
        cardLg: '0 4px 12px rgba(23, 23, 23, 0.06), 0 16px 48px rgba(23, 23, 23, 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
