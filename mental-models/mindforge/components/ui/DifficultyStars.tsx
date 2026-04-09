import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { colors } from '@/lib/constants';

interface DifficultyStarsProps {
  difficulty: number;
  size?: number;
}

export function DifficultyStars({ difficulty, size = 12 }: DifficultyStarsProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={size}
          color={i < difficulty ? colors.xpGold : colors.surface}
          fill={i < difficulty ? colors.xpGold : 'transparent'}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 2,
  },
});
