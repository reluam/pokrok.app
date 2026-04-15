import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '@/lib/constants';

interface PathConnectorProps {
  fromX: number;
  toX: number;
  height?: number;
  completed: boolean;
  courseColor: string;
}

export function PathConnector({
  fromX,
  toX,
  height = 56,
  completed,
  courseColor,
}: PathConnectorProps) {
  const width = 260;
  const startX = width / 2 + fromX;
  const endX = width / 2 + toX;
  const midY = height / 2;

  const pathData = `M ${startX} 0 C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${height}`;
  // Project-coloured connector — completed segments use success, the rest
  // are a faded primary so the path reads as one warm, coherent track.
  const color = completed ? colors.success : colors.primary + '40';

  return (
    <View style={[styles.container, { height }]}>
      <Svg width={width} height={height}>
        <Path
          d={pathData}
          stroke={color}
          strokeWidth={completed ? 3 : 2}
          fill="none"
          strokeDasharray={completed ? undefined : '6,6'}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    overflow: 'hidden',
  },
});
