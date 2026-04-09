import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { colors, borderRadius } from '@/lib/constants';

interface ProgressBarProps {
  progress: number; // 0-1
  height?: number;
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
}

export function ProgressBar({
  progress,
  height = 8,
  color = colors.primary,
  backgroundColor = colors.surface,
  style,
}: ProgressBarProps) {
  const clampedProgress = Math.min(1, Math.max(0, progress));

  return (
    <View style={[styles.track, { height, backgroundColor }, style]}>
      <View
        style={[
          styles.fill,
          {
            height,
            backgroundColor: color,
            width: `${clampedProgress * 100}%`,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    borderRadius: borderRadius.full,
  },
});
