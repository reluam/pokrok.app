import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Shield } from 'lucide-react-native';
import { colors, fontSize, spacing, borderRadius } from '@/lib/constants';
import type { LevelTitle } from '@/types';

interface LevelBadgeProps {
  level: number;
  title: LevelTitle;
  size?: 'sm' | 'lg';
}

const titleColors: Record<LevelTitle, string> = {
  Začátečník: colors.textSecondary,
  Myslitel: colors.primary,
  Stratég: colors.success,
  Filozof: '#A855F7',
  Master: colors.xpGold,
};

export function LevelBadge({ level, title, size = 'sm' }: LevelBadgeProps) {
  const color = titleColors[title];
  const iconSize = size === 'lg' ? 24 : 16;

  return (
    <View style={[styles.container, { borderColor: color }]}>
      <Shield size={iconSize} color={color} fill={color} />
      <Text style={[styles.level, size === 'lg' && styles.levelLg, { color }]}>
        {level}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  level: {
    fontWeight: '800',
    fontSize: fontSize.sm,
  },
  levelLg: {
    fontSize: fontSize.lg,
  },
});
