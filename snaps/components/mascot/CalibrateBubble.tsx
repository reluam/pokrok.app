import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { Calibrate, CalibrateMood } from './Calibrate';
import { colors, fontSize, spacing, borderRadius } from '@/lib/constants';

interface CalibrateBubbleProps {
  message: string;
  title?: string;
  mood?: CalibrateMood;
  size?: number;
  cta?: string;
  onPress?: () => void;
  style?: ViewStyle;
  /** Optional eye-tracking targets, range -1..1 */
  lookX?: SharedValue<number>;
  lookY?: SharedValue<number>;
  /** When true, renders without card / bubble backgrounds — text sits on the page */
  transparent?: boolean;
}

/**
 * Calibrate mascot inside a friendly speech-bubble card.
 *
 * Layout: character on the left, speech bubble on the right with a small
 * triangular pointer pointing back at the character. Optional CTA at the
 * bottom turns the whole card into a tappable surface.
 */
export function CalibrateBubble({
  message,
  title,
  mood = 'idle',
  size = 88,
  cta,
  onPress,
  style,
  lookX,
  lookY,
  transparent = false,
}: CalibrateBubbleProps) {
  const Wrapper: React.ComponentType<any> = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      style={[transparent ? styles.cardPlain : styles.card, style]}
      activeOpacity={onPress ? 0.85 : 1}
      onPress={onPress}
    >
      <View style={[styles.characterCol, { width: size }]}>
        <Calibrate size={size} mood={mood} lookX={lookX} lookY={lookY} />
      </View>

      <View style={styles.bubbleCol}>
        {transparent ? (
          <View style={styles.bubblePlain}>
            {title && <Text style={styles.title}>{title}</Text>}
            <Text style={styles.message}>{message}</Text>
            {cta && (
              <View style={styles.ctaRow}>
                <Text style={styles.cta}>{cta} →</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.bubble}>
            {/* Pointer triangle */}
            <View style={styles.pointerOuter} />
            <View style={styles.pointerInner} />

            {title && <Text style={styles.title}>{title}</Text>}
            <Text style={styles.message}>{message}</Text>
            {cta && (
              <View style={styles.ctaRow}>
                <Text style={styles.cta}>{cta} →</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.xxl,
    padding: spacing.md,
    paddingRight: spacing.lg,
    gap: spacing.sm,
    borderWidth: 2,
    borderColor: colors.border,
  },
  cardPlain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: 100,
  },
  bubblePlain: {
    paddingLeft: spacing.xs,
    gap: spacing.xs,
  },
  characterCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleCol: {
    flex: 1,
    paddingLeft: spacing.xs,
  },
  bubble: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  // Outer triangle = border color
  pointerOuter: {
    position: 'absolute',
    left: -10,
    top: 18,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderRightWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: colors.border,
  },
  // Inner triangle = bubble fill, slightly smaller and offset to overlap
  pointerInner: {
    position: 'absolute',
    left: -7,
    top: 20,
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderRightWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: colors.primaryLight,
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: '800',
    color: colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  message: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 22,
  },
  ctaRow: {
    marginTop: spacing.xs,
  },
  cta: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.primaryDark,
  },
});
