import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Flame } from 'lucide-react-native';
import { colors, fontSize, spacing, borderRadius } from '@/lib/constants';

interface StreakBadgeProps {
  streak: number;
  compact?: boolean;
}

export function StreakBadge({ streak, compact = false }: StreakBadgeProps) {
  if (compact) {
    return (
      <View style={styles.compactRow}>
        <Flame size={16} color={streak > 0 ? colors.streak : colors.textSecondary} fill={streak > 0 ? colors.streak : 'transparent'} />
        <Text style={[styles.compactText, streak > 0 && styles.activeText]}>
          {streak}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, streak > 0 && styles.activeContainer]}>
      <Flame
        size={28}
        color={streak > 0 ? colors.streak : colors.textSecondary}
        fill={streak > 0 ? colors.streak : 'transparent'}
      />
      <Text style={[styles.number, streak > 0 && styles.activeText]}>
        {streak}
      </Text>
      <Text style={styles.label}>
        {streak === 1 ? 'den' : streak >= 2 && streak <= 4 ? 'dny' : 'dní'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    minWidth: 80,
  },
  activeContainer: {
    borderWidth: 1,
    borderColor: colors.streak,
  },
  number: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  activeText: {
    color: colors.streak,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textSecondary,
  },
});
