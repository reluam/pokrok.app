import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { CheckCircle2, XCircle } from 'lucide-react-native';
import { notificationSuccess, notificationError } from '@/lib/haptics';
import { colors, fontSize, spacing, borderRadius } from '@/lib/constants';
import type { ScenarioOption } from '@/types';
import { renderInlineMarkdown } from './MarkdownText';

interface ScenarioStepProps {
  situation: string;
  question: string;
  options: ScenarioOption[];
  /** Optional small label above the question (e.g. "Zamysli se", "Kvíz") */
  label?: string;
  onAnswer: (correct: boolean, firstTry: boolean) => void;
}

/**
 * Question step. Used for engagement (during theory), legacy scenario, and
 * scored quiz. Plain visual — no card behind the situation, no decorative
 * speech-bubble icons. The engine decides whether the answer affects score.
 */
export function ScenarioStep({
  situation,
  question,
  options,
  label,
  onAnswer,
}: ScenarioStepProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [attempts, setAttempts] = useState(0);

  // Shuffle options once per question so the correct answer is at a random
  // position. We derive the dependency from option *content* (not the array
  // reference) so that parent re-renders that create a new — but identical —
  // options array don't trigger a re-shuffle mid-question.
  const optionsKey = options.map((o) => o.text).join('|');
  const shuffledOptions = useMemo(() => {
    const arr = [...options];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsKey]);

  const handleSelect = (index: number) => {
    if (hasAnswered) return;

    setSelectedIndex(index);
    setAttempts((a) => a + 1);

    const option = shuffledOptions[index];
    if (option.correct) {
      setHasAnswered(true);
      notificationSuccess();
      onAnswer(true, attempts === 0);
    } else {
      notificationError();
      setTimeout(() => setSelectedIndex(null), 1400);
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {label ? <Text style={styles.label}>{label}</Text> : null}

      {situation ? (
        <Text style={styles.situation}>{renderInlineMarkdown(situation)}</Text>
      ) : null}

      <Text style={styles.question}>{renderInlineMarkdown(question)}</Text>

      <View style={styles.options}>
        {shuffledOptions.map((option, index) => {
          const isSelected = selectedIndex === index;
          const isCorrect = option.correct;
          const showResult = isSelected;

          return (
            <Pressable
              key={index}
              style={({ pressed }) => [
                styles.option,
                pressed && !hasAnswered && styles.optionPressed,
                showResult && isCorrect && styles.correctOption,
                showResult && !isCorrect && styles.wrongOption,
              ]}
              onPress={() => handleSelect(index)}
              disabled={hasAnswered}
            >
              <View style={styles.optionRow}>
                <View
                  style={[
                    styles.optionMarker,
                    showResult && isCorrect && styles.correctMarker,
                    showResult && !isCorrect && styles.wrongMarker,
                  ]}
                >
                  {showResult && isCorrect ? (
                    <CheckCircle2 size={18} color="#fff" strokeWidth={3} />
                  ) : showResult && !isCorrect ? (
                    <XCircle size={18} color="#fff" strokeWidth={3} />
                  ) : (
                    <Text style={styles.optionLetter}>
                      {String.fromCharCode(65 + index)}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.optionText,
                    showResult && isCorrect && styles.correctText,
                    showResult && !isCorrect && styles.wrongText,
                  ]}
                >
                  {renderInlineMarkdown(option.text)}
                </Text>
              </View>
              {showResult && (
                <Text
                  style={[
                    styles.explanation,
                    { color: isCorrect ? '#166534' : '#991B1B' },
                  ]}
                >
                  {renderInlineMarkdown(option.explanation)}
                </Text>
              )}
            </Pressable>
          );
        })}
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
  },
  label: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: fontSize.sm,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
  },
  situation: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    lineHeight: 24,
    fontWeight: '500',
    marginBottom: spacing.lg,
  },
  question: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: '800',
    lineHeight: 26,
    marginBottom: spacing.lg,
  },
  options: {
    gap: spacing.md,
  },
  option: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.md + 2,
    borderWidth: 2,
    borderColor: colors.border,
  },
  optionPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: colors.primaryLight,
  },
  correctOption: {
    backgroundColor: colors.successLight,
    borderColor: colors.success,
  },
  wrongOption: {
    backgroundColor: colors.errorLight,
    borderColor: colors.error,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  optionMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  correctMarker: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  wrongMarker: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  optionLetter: {
    color: colors.textSecondary,
    fontWeight: '800',
    fontSize: fontSize.sm,
  },
  optionText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSize.md,
    lineHeight: 22,
    fontWeight: '600',
  },
  correctText: {
    color: '#166534',
  },
  wrongText: {
    color: '#991B1B',
  },
  explanation: {
    marginTop: spacing.md,
    fontSize: fontSize.sm,
    lineHeight: 20,
    fontWeight: '500',
  },
});
