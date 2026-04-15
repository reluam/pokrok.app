import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Lock, Zap, AlertTriangle, Target, Network, Brain,
  Filter, Users, User, Dice1, SlidersHorizontal, Clock, Crown,
  Activity, Apple, Dumbbell, Heart, Moon, Scale,
  Sparkles, Wind, Eye, Repeat, Focus, Settings,
  TrendingUp, Shield, Mountain, Waves, Trophy, Compass,
} from 'lucide-react-native';
import { colors, fontSize, spacing, borderRadius } from '@/lib/constants';

const COURSE_ICONS: Record<string, React.ComponentType<any>> = {
  Zap, AlertTriangle, Target, Network, Brain, Filter, Users, User,
  Dice1, SlidersHorizontal, Clock, Crown, Activity, Apple, Dumbbell,
  Heart, Moon, Scale, Sparkles, Wind, Eye, Repeat, Focus, Settings,
  TrendingUp, Shield, Mountain, Waves, Trophy, Compass,
};

interface CourseSectionProps {
  /** Section number (e.g. "1") */
  section?: number | string;
  /** Unit number within section (e.g. "4") */
  unit?: number | string;
  title: string;
  subtitle: string;
  /** Category color — used to tint the SVG icon (everything else is project primary). */
  color: string;
  progress: number;
  isUnlocked: boolean;
  completedCount: number;
  totalCount: number;
  iconName?: string;
  /** When true, render the completion stats + progress bar inside the body */
  showStats?: boolean;
}

/**
 * Cream "unit box" inspired by Brilliant. The card itself is in the
 * project primary palette (cream background, primary border) so the whole
 * UI feels coherent. Only the SVG icon on the left adopts the category
 * color, providing a quick visual cue without breaking the warm,
 * single-tone look.
 */
export function CourseSection({
  title,
  subtitle,
  color,
  progress,
  isUnlocked,
  completedCount,
  totalCount,
  iconName,
  showStats = false,
}: CourseSectionProps) {
  const Icon = iconName ? COURSE_ICONS[iconName] ?? Zap : Zap;
  const tintBg = withAlpha(color, 0.12);
  const tintBorder = withAlpha(color, 0.4);

  return (
    <View style={[styles.card, !isUnlocked && styles.locked]}>
      {/* Icon tile (category color) */}
      <View style={[styles.iconTile, { backgroundColor: tintBg, borderColor: tintBorder }]}>
        {!isUnlocked ? (
          <Lock size={28} color={colors.textMuted} strokeWidth={2.4} />
        ) : (
          <Icon size={34} color={color} strokeWidth={2.2} />
        )}
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}

        {showStats && totalCount > 0 ? (
          <View style={styles.statsRow}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(100, Math.round(progress * 100))}%` },
                ]}
              />
            </View>
            <Text style={styles.statsText}>
              {completedCount}/{totalCount}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

/** Apply an alpha channel to a #rrggbb color. Returns rgba(...) string. */
function withAlpha(hex: string, alpha: number): string {
  const m = hex.replace('#', '');
  if (m.length !== 6) return hex;
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: 96,
    // Soft shadow underneath — pops the card off the page slightly
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  locked: {
    opacity: 0.55,
  },
  iconTile: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: '800',
    lineHeight: 20,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.borderSubtle,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  statsText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
