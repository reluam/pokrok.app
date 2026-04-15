import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, Brain } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ScenarioStep } from '@/components/lesson/ScenarioStep';
import { useLessonStore } from '@/stores/lesson-store';
import { useUserStore } from '@/stores/user-store';
import { colors, fontSize, spacing, borderRadius } from '@/lib/constants';
import type { MentalModel, SpacedRepetitionCard } from '@/types';

export default function PracticeScreen() {
  const getDueReviews = useLessonStore((s) => s.getDueReviews);
  const recordReview = useLessonStore((s) => s.recordReview);
  const getLessonsForModel = useLessonStore((s) => s.getLessonsForModel);
  const addXp = useUserStore((s) => s.addXp);
  const language = useUserStore((s) => s.language);
  const t = (cs: string, en: string) => (language === 'en' ? en : cs);

  const [reviews] = useState(() => getDueReviews());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answered, setAnswered] = useState(false);

  const handleAnswer = useCallback(
    (correct: boolean, firstTry: boolean) => {
      const review = reviews[currentIndex];
      if (!review) return;

      const quality = correct ? (firstTry ? 5 : 3) : 1;
      recordReview(review.model.id, quality);
      addXp(correct ? 5 : 0);
      setAnswered(true);
    },
    [currentIndex, reviews, recordReview, addXp]
  );

  const handleNext = () => {
    setAnswered(false);
    setCurrentIndex((i) => i + 1);
  };

  // All done
  if (reviews.length === 0 || currentIndex >= reviews.length) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.emptyContainer}>
          <CheckCircle size={64} color={colors.success} />
          <Text style={styles.emptyTitle}>
            {reviews.length === 0
              ? t('Zatím nemáš co opakovat', 'Nothing to review yet')
              : t('Vše opakováno!', 'All reviewed!')}
          </Text>
          <Text style={styles.emptySubtitle}>
            {reviews.length === 0
              ? t(
                  'Dokonči pár lekcí a modely se ti začnou vracet k opakování.',
                  'Finish a few lessons and models will start coming back for review.',
                )
              : t('Skvěle! Další opakování zítra.', 'Great work! Next review tomorrow.')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const review = reviews[currentIndex];
  const modelLessons = getLessonsForModel(review.model.id);
  // Find a scenario lesson for review
  const scenarioLesson = modelLessons.find((l) => l.lesson_type === 'scenario');
  const scenarioStep = scenarioLesson?.content.steps.find(
    (s) => s.type === 'scenario' || s.type === 'quiz'
  );
  // Localize step content based on language
  const stepSituation =
    scenarioStep && 'situation' in scenarioStep
      ? language === 'en' && scenarioStep.situation_en
        ? scenarioStep.situation_en
        : (scenarioStep.situation ?? '')
      : '';
  const stepQuestion = scenarioStep
    ? language === 'en' && scenarioStep.question_en
      ? scenarioStep.question_en
      : scenarioStep.question
    : '';
  const stepOptions = scenarioStep
    ? language === 'en'
      ? scenarioStep.options.map((o) => ({
          ...o,
          text: o.text_en || o.text,
          explanation: o.explanation_en || o.explanation,
        }))
      : scenarioStep.options
    : [];
  const fallbackText =
    language === 'en' && review.model.short_description_en
      ? review.model.short_description_en
      : review.model.short_description;
  const modelPrimary = language === 'en' ? review.model.name : review.model.name_cz;
  const modelSecondary = language === 'en' ? review.model.name_cz : review.model.name;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('Opakování', 'Practice')}</Text>
        <Text style={styles.counter}>
          {currentIndex + 1} / {reviews.length}
        </Text>
      </View>

      <Card style={styles.modelHeader}>
        <Brain size={24} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.modelName}>{modelPrimary}</Text>
          <Text style={styles.modelNameCz}>{modelSecondary}</Text>
        </View>
      </Card>

      {scenarioStep && (scenarioStep.type === 'scenario' || scenarioStep.type === 'quiz') ? (
        <ScenarioStep
          situation={stepSituation}
          question={stepQuestion}
          options={stepOptions}
          onAnswer={handleAnswer}
        />
      ) : (
        <View style={styles.fallbackReview}>
          <Text style={styles.fallbackText}>{fallbackText}</Text>
          <Button
            title={t('Pamatuji si', 'I remember')}
            onPress={() => {
              recordReview(review.model.id, 4);
              addXp(5);
              handleNext();
            }}
            size="lg"
          />
          <Button
            title={t('Potřebuji zopakovat', 'Need to review')}
            onPress={() => {
              recordReview(review.model.id, 1);
              handleNext();
            }}
            variant="secondary"
            size="lg"
          />
        </View>
      )}

      {answered && (
        <View style={styles.nextContainer}>
          <Button title={t('Další', 'Next')} onPress={handleNext} size="lg" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  counter: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  modelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  modelName: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modelNameCz: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  fallbackReview: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
    justifyContent: 'center',
  },
  fallbackText: {
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    lineHeight: 28,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  nextContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});
