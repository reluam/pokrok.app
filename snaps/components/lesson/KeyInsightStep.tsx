import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Lightbulb } from 'lucide-react-native';
import { colors, fontSize, spacing, borderRadius } from '@/lib/constants';

interface KeyInsightStepProps {
  content: string;
}

export function KeyInsightStep({ content }: KeyInsightStepProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconRow}>
          <Lightbulb size={24} color={colors.xpGold} />
          <Text style={styles.label}>Klíčový poznatek</Text>
        </View>
        <Text style={styles.text}>{content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.xpGold,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  label: {
    color: colors.xpGold,
    fontWeight: '700',
    fontSize: fontSize.md,
  },
  text: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    lineHeight: 28,
  },
});
