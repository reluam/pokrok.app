import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { CheckCircle, XCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, fontSize, spacing, borderRadius } from '@/lib/constants';
import type { ScenarioOption } from '@/types';

interface ScenarioStepProps {
  situation: string;
  question: string;
  options: ScenarioOption[];
  onAnswer: (correct: boolean, firstTry: boolean) => void;
}

export function ScenarioStep({
  situation,
  question,
  options,
  onAnswer,
}: ScenarioStepProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleSelect = (index: number) => {
    if (hasAnswered) return;

    setSelectedIndex(index);
    setAttempts((a) => a + 1);

    const option = options[index];
    if (option.correct) {
      setHasAnswered(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onAnswer(true, attempts === 0);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Allow re-tries — only mark first attempt
      setTimeout(() => setSelectedIndex(null), 1200);
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.situationCard}>
        <Text style={styles.situation}>{situation}</Text>
      </View>

      <Text style={styles.question}>{question}</Text>

      <View style={styles.options}>
        {options.map((option, index) => {
          const isSelected = selectedIndex === index;
          const isCorrect = option.correct;
          const showResult = isSelected;

          let borderColor: string = colors.surface;
          if (showResult && isCorrect) borderColor = colors.success;
          if (showResult && !isCorrect) borderColor = colors.error;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.option,
                { borderColor },
                showResult && isCorrect && styles.correctOption,
                showResult && !isCorrect && styles.wrongOption,
              ]}
              onPress={() => handleSelect(index)}
              disabled={hasAnswered}
              activeOpacity={0.7}
            >
              <Text style={styles.optionText}>{option.text}</Text>
              {showResult && (
                <View style={styles.feedback}>
                  {isCorrect ? (
                    <CheckCircle size={20} color={colors.success} />
                  ) : (
                    <XCircle size={20} color={colors.error} />
                  )}
                  <Text
                    style={[
                      styles.explanation,
                      { color: isCorrect ? colors.success : colors.error },
                    ]}
                  >
                    {option.explanation}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
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
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  situationCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  situation: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    lineHeight: 24,
  },
  question: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
  options: {
    gap: spacing.sm,
  },
  option: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 2,
  },
  correctOption: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  wrongOption: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  optionText: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    lineHeight: 22,
  },
  feedback: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  explanation: {
    flex: 1,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
});
