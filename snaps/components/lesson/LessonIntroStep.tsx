import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import {
  Activity,
  AlertCircle,
  Apple,
  BookOpen,
  Brain,
  Coffee,
  Compass,
  Droplet,
  Dumbbell,
  Eye,
  Heart,
  Leaf,
  Lightbulb,
  Moon,
  Sparkles,
  Sun,
  Target,
  Trophy,
  Wind,
  Zap,
} from 'lucide-react-native';
import { colors, fontSize, spacing } from '@/lib/constants';
import { useUserStore } from '@/stores/user-store';
import { MarkdownText } from './MarkdownText';

/**
 * Splash-style intro for a lesson. Shows a big icon, a "what to expect" label,
 * a title, and a short description. Used as the first step of every lesson.
 */

const ICONS: Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
  Activity,
  AlertCircle,
  Apple,
  BookOpen,
  Brain,
  Coffee,
  Compass,
  Droplet,
  Dumbbell,
  Eye,
  Heart,
  Leaf,
  Lightbulb,
  Moon,
  Sparkles,
  Sun,
  Target,
  Trophy,
  Wind,
  Zap,
};

interface LessonIntroStepProps {
  title: string;
  description: string;
  icon?: string;
}

export function LessonIntroStep({ title, description, icon }: LessonIntroStepProps) {
  const language = useUserStore((s) => s.language);
  const Icon = (icon && ICONS[icon]) || Sparkles;
  const label = language === 'en' ? 'In this lesson' : 'Co tě čeká';

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Big icon circle */}
      <View style={styles.iconCircleOuter}>
        <View style={styles.iconCircleInner}>
          <Icon size={56} color="#fff" strokeWidth={2} />
        </View>
      </View>

      {/* Label */}
      <Text style={styles.label}>{label}</Text>

      {/* Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Description */}
      <MarkdownText content={description} style={styles.description} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  iconCircleOuter: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  iconCircleInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: fontSize.sm,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.xxl,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 38,
  },
  description: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    lineHeight: 26,
    textAlign: 'center',
    fontWeight: '500',
  },
});
