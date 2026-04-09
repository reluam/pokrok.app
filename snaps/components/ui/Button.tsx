import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { colors, borderRadius, fontSize, spacing } from '@/lib/constants';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const buttonStyles: ViewStyle[] = [
    styles.base,
    styles[`${variant}Bg` as keyof typeof styles] as ViewStyle,
    styles[`${size}Size` as keyof typeof styles] as ViewStyle,
    (disabled || loading) && styles.disabled,
    style,
  ].filter(Boolean) as ViewStyle[];

  const textStyles: TextStyle[] = [
    styles.text,
    styles[`${variant}Text` as keyof typeof styles] as TextStyle,
    styles[`${size}Text` as keyof typeof styles] as TextStyle,
  ].filter(Boolean) as TextStyle[];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={colors.textPrimary} />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
  primaryBg: {
    backgroundColor: colors.primary,
  },
  secondaryBg: {
    backgroundColor: colors.surface,
  },
  ghostBg: {
    backgroundColor: 'transparent',
  },
  smSize: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  mdSize: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 4,
  },
  lgSize: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '600',
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: fontSize.md,
  },
  secondaryText: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
  },
  ghostText: {
    color: colors.primary,
    fontSize: fontSize.md,
  },
  smText: {
    fontSize: fontSize.sm,
  },
  mdText: {
    fontSize: fontSize.md,
  },
  lgText: {
    fontSize: fontSize.lg,
  },
});
