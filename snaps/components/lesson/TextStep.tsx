import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { colors, fontSize, spacing } from '@/lib/constants';
import { MarkdownText } from './MarkdownText';

interface TextStepProps {
  content: string;
}

/**
 * Plain prose step. Renders markdown (bold, paragraph breaks) and adds a
 * small dotted accent at the top so the text doesn't feel naked on the page.
 */
export function TextStep({ content }: TextStepProps) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Subtle 3-dot accent that ties the text to the rest of the lesson */}
      <View style={styles.accentRow}>
        <View style={[styles.dot, { backgroundColor: colors.primary }]} />
        <View style={[styles.dot, { backgroundColor: colors.teal, opacity: 0.7 }]} />
        <View style={[styles.dot, { backgroundColor: colors.purple, opacity: 0.5 }]} />
      </View>

      <MarkdownText content={content} style={styles.text} />
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
  },
  accentRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    lineHeight: 30,
    fontWeight: '500',
  },
});
