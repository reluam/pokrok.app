import React from 'react';
import { View, StyleSheet, TouchableOpacity, type ViewStyle } from 'react-native';
import { colors, borderRadius, spacing } from '@/lib/constants';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'default' | 'elevated';
}

export function Card({ children, onPress, style, variant = 'default' }: CardProps) {
  const cardStyle: ViewStyle[] = [
    styles.base,
    variant === 'elevated' && styles.elevated,
    style,
  ].filter(Boolean) as ViewStyle[];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
