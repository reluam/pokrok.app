import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, fontSize, spacing } from '@/lib/constants';

interface BadgeProps {
  label: string;
  color?: string;
  textColor?: string;
}

export function Badge({
  label,
  color = colors.primary,
  textColor = colors.primary,
}: BadgeProps) {
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    backgroundColor: colors.card,
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
});
