import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Lock } from 'lucide-react-native';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { colors, fontSize, spacing, borderRadius } from '@/lib/constants';

interface CourseSectionProps {
  title: string;
  subtitle: string;
  color: string;
  progress: number;
  isUnlocked: boolean;
  completedCount: number;
  totalCount: number;
}

export function CourseSection({
  title,
  subtitle,
  color,
  progress,
  isUnlocked,
  completedCount,
  totalCount,
}: CourseSectionProps) {
  return (
    <View style={[styles.container, { borderLeftColor: color }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {!isUnlocked && <Lock size={14} color={colors.textSecondary} />}
          <Text style={[styles.title, !isUnlocked && styles.locked]}>{title}</Text>
        </View>
        <Text style={[styles.subtitle, !isUnlocked && styles.locked]}>{subtitle}</Text>
      </View>
      <View style={styles.progressRow}>
        <ProgressBar
          progress={progress}
          height={4}
          color={color}
          style={styles.bar}
        />
        <Text style={styles.count}>
          {completedCount}/{totalCount}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 4,
    marginHorizontal: spacing.lg,
  },
  header: {
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  locked: {
    opacity: 0.5,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bar: {
    flex: 1,
  },
  count: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: '600',
    minWidth: 28,
    textAlign: 'right',
  },
});
