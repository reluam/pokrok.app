import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { colors } from '@/lib/constants';

interface ProgressBarProps {
  progress: number; // 0-1
  height?: number;
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
}

export function ProgressBar({
  progress,
  height = 16,
  color = colors.primary,
  backgroundColor = colors.surface,
  style,
}: ProgressBarProps) {
  const clampedProgress = Math.min(1, Math.max(0, progress));

  return (
    <View
      style={[
        styles.track,
        {
          height,
          backgroundColor,
          borderRadius: height / 2,
        },
        style,
      ]}
    >
      {clampedProgress > 0 && (
        <View
          style={{
            height: '100%',
            backgroundColor: color,
            width: `${clampedProgress * 100}%`,
            borderRadius: height / 2,
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.border,
  },
});
