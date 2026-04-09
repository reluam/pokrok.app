import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Zap } from 'lucide-react-native';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { colors, fontSize, spacing } from '@/lib/constants';
import type { LevelInfo } from '@/types';

interface XpBarProps {
  levelInfo: LevelInfo;
  totalXp: number;
}

export function XpBar({ levelInfo, totalXp }: XpBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.levelRow}>
          <Zap size={16} color={colors.xpGold} fill={colors.xpGold} />
          <Text style={styles.levelText}>Level {levelInfo.level}</Text>
          <Text style={styles.titleText}>{levelInfo.title}</Text>
        </View>
        <Text style={styles.xpText}>
          {totalXp} / {levelInfo.xpForNextLevel} XP
        </Text>
      </View>
      <ProgressBar
        progress={levelInfo.progress}
        color={colors.xpGold}
        height={6}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  levelText: {
    color: colors.xpGold,
    fontWeight: '700',
    fontSize: fontSize.sm,
  },
  titleText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  xpText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
  },
});
