import React from 'react';
import { View, Text, StyleSheet, type TextStyle } from 'react-native';
import { spacing } from '@/lib/constants';

/**
 * Tiny markdown renderer for lesson content. Supports a deliberate subset:
 *
 *   **bold**           → <Text style={{ fontWeight: '800' }}>...</Text>
 *   blank line         → paragraph break
 *
 * Anything else passes through as plain text. We avoid a full markdown
 * library because (a) we don't need it, and (b) react-native libraries for
 * markdown tend to bring in extra deps and weight.
 */

/**
 * Render a single string with inline markdown (currently just **bold**).
 * Returns an array of React nodes suitable for nesting inside <Text>.
 */
export function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*\n]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <Text key={i} style={styles.bold}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    return part;
  });
}

interface MarkdownTextProps {
  content: string;
  /** Style applied to each paragraph's <Text>. */
  style?: TextStyle | TextStyle[];
}

/**
 * Render a markdown content block as paragraphs separated by blank lines.
 */
export function MarkdownText({ content, style }: MarkdownTextProps) {
  // Normalize line endings, then split on one or more blank lines
  const normalized = content.replace(/\r\n/g, '\n');
  const paragraphs = normalized.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  return (
    <View>
      {paragraphs.map((p, i) => (
        <Text
          key={i}
          style={[
            style,
            i > 0 && { marginTop: spacing.md },
          ]}
        >
          {renderInlineMarkdown(p.trim())}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bold: {
    fontWeight: '800',
  },
});
