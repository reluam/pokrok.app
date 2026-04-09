import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize, spacing } from '@/lib/constants';

interface TextStepProps {
  content: string;
}

export function TextStep({ content }: TextStepProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  text: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    lineHeight: 28,
  },
});
