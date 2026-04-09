import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Zap, Flame, Target } from 'lucide-react-native';
import { colors, fontSize, spacing, borderRadius } from '@/lib/constants';

interface XpRewardProps {
  breakdown: {
    base: number;
    bonus: number;
    streak: number;
  };
  total: number;
}

export function XpReward({ breakdown, total }: XpRewardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Získáno XP</Text>
      <Text style={styles.totalXp}>+{total} XP</Text>

      <View style={styles.breakdown}>
        <View style={styles.row}>
          <Target size={16} color={colors.primary} />
          <Text style={styles.label}>Dokončení lekce</Text>
          <Text style={styles.value}>+{breakdown.base}</Text>
        </View>

        {breakdown.bonus > 0 && (
          <View style={styles.row}>
            <Zap size={16} color={colors.xpGold} />
            <Text style={styles.label}>Správně na první pokus</Text>
            <Text style={[styles.value, { color: colors.xpGold }]}>
              +{breakdown.bonus}
            </Text>
          </View>
        )}

        {breakdown.streak > 0 && (
          <View style={styles.row}>
            <Flame size={16} color={colors.streak} />
            <Text style={styles.label}>Streak bonus</Text>
            <Text style={[styles.value, { color: colors.streak }]}>
              +{breakdown.streak}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  totalXp: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.xpGold,
    marginBottom: spacing.lg,
  },
  breakdown: {
    width: '100%',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSize.sm,
  },
  value: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: fontSize.sm,
  },
});
