import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { colors, fontSize, spacing, borderRadius } from '@/lib/constants';
import { useUserStore } from '@/stores/user-store';
import { MarkdownText } from './MarkdownText';

interface KeyInsightStepProps {
  content: string;
}

/**
 * Highlighted "takeaway" step. Wrapped in a soft yellow callout so it stands
 * apart from the surrounding theory and quiz steps. Renders markdown (bold).
 */
export function KeyInsightStep({ content }: KeyInsightStepProps) {
  const language = useUserStore((s) => s.language);
  const label = language === 'en' ? 'Key takeaway' : 'Klíčový poznatek';

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.callout}>
        <View style={styles.labelRow}>
          <Sparkles size={18} color={colors.xpGold} />
          <Text style={styles.label}>{label}</Text>
        </View>
        <MarkdownText content={content} style={styles.text} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    flexGrow: 1,
    justifyContent: 'center',
  },
  callout: {
    backgroundColor: colors.xpGoldLight,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.xpGold,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  label: {
    color: '#B45309',
    fontWeight: '800',
    fontSize: fontSize.sm,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  text: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    lineHeight: 30,
    fontWeight: '600',
  },
});
