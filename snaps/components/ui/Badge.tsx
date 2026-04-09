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
  color = colors.surface,
  textColor = colors.textSecondary,
}: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
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
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
});
