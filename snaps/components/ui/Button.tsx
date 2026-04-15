import React, { useRef } from 'react';
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  Animated,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { colors, borderRadius, fontSize, spacing } from '@/lib/constants';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

const VARIANT_COLORS = {
  primary: {
    bg: '#FFFFFF',
    border: colors.primary,
    shadow: colors.primary,
    text: colors.primary,
  },
  success: {
    bg: '#FFFFFF',
    border: colors.success,
    shadow: colors.success,
    text: colors.success,
  },
  secondary: {
    bg: '#FFFFFF',
    border: colors.textMuted,
    shadow: colors.textMuted,
    text: colors.textPrimary,
  },
  outline: {
    bg: '#FFFFFF',
    border: colors.primary,
    shadow: colors.primary,
    text: colors.primary,
  },
  ghost: {
    bg: 'transparent',
    border: 'transparent',
    shadow: 'transparent',
    text: colors.primary,
  },
};

const SIZE_PADDING = {
  sm: { horizontal: spacing.md, vertical: spacing.sm },
  md: { horizontal: spacing.lg, vertical: spacing.md },
  lg: { horizontal: spacing.xl, vertical: spacing.md + 4 },
};

const SHADOW_OFFSET = 4;

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const offset = useRef(new Animated.Value(0)).current;
  const palette = VARIANT_COLORS[variant];
  const padding = SIZE_PADDING[size];
  const isGhost = variant === 'ghost';

  const handlePressIn = () => {
    Animated.timing(offset, {
      toValue: SHADOW_OFFSET,
      duration: 70,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(offset, {
      toValue: 0,
      speed: 30,
      bounciness: 8,
      useNativeDriver: true,
    }).start();
  };

  if (isGhost) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        style={[styles.ghost, { paddingHorizontal: padding.horizontal, paddingVertical: padding.vertical }, style]}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text style={[styles.text, styles[`${size}Text` as keyof typeof styles] as TextStyle, { color: palette.text }]}>
            {title}
          </Text>
        )}
      </Pressable>
    );
  }

  return (
    <View style={[styles.wrapper, (disabled || loading) && styles.disabled, style]}>
      {/* Bottom shadow layer */}
      <View
        style={[
          styles.shadowLayer,
          {
            backgroundColor: palette.shadow,
            borderColor: palette.border,
          },
        ]}
      />
      {/* Top button layer */}
      <Animated.View
        style={{
          transform: [{ translateY: offset }],
        }}
      >
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          style={[
            styles.button,
            {
              backgroundColor: palette.bg,
              borderColor: palette.border,
              paddingHorizontal: padding.horizontal,
              paddingVertical: padding.vertical,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={palette.text} />
          ) : (
            <Text
              style={[
                styles.text,
                styles[`${size}Text` as keyof typeof styles] as TextStyle,
                { color: palette.text },
              ]}
            >
              {title}
            </Text>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  shadowLayer: {
    position: 'absolute',
    top: SHADOW_OFFSET,
    left: 0,
    right: 0,
    bottom: -SHADOW_OFFSET,
    borderRadius: borderRadius.full,
    borderWidth: 2,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    borderWidth: 2,
  },
  ghost: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '700',
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
