import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Zap, Flame, Target } from 'lucide-react-native';
import { colors, fontSize, spacing, borderRadius } from '@/lib/constants';
import { useUserStore } from '@/stores/user-store';

interface XpRewardProps {
  breakdown: {
    base: number;
    bonus: number;
    streak: number;
  };
  total: number;
}

export function XpReward({ breakdown, total }: XpRewardProps) {
  const language = useUserStore((s) => s.language);
  const t = (cs: string, en: string) => (language === 'en' ? en : cs);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('Získáno XP', 'XP earned')}</Text>
      <Text style={styles.totalXp}>+{total} XP</Text>

      <View style={styles.breakdown}>
        <View style={styles.row}>
          <Target size={16} color={colors.primary} />
          <Text style={styles.label}>{t('Dokončení lekce', 'Lesson complete')}</Text>
          <Text style={styles.value}>+{breakdown.base}</Text>
        </View>

        {breakdown.bonus > 0 && (
          <View style={styles.row}>
            <Zap size={16} color={colors.xpGold} />
            <Text style={styles.label}>{t('Správně na první pokus', 'Correct on first try')}</Text>
            <Text style={[styles.value, { color: colors.xpGold }]}>
              +{breakdown.bonus}
            </Text>
          </View>
        )}

        {breakdown.streak > 0 && (
          <View style={styles.row}>
            <Flame size={16} color={colors.streak} />
            <Text style={styles.label}>{t('Streak bonus', 'Streak bonus')}</Text>
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
