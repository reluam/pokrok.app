import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { TextStep } from './TextStep';
import { KeyInsightStep } from './KeyInsightStep';
import { ScenarioStep } from './ScenarioStep';
import { XpReward } from '@/components/gamification/XpReward';
import { colors, spacing } from '@/lib/constants';
import { calculateLessonXp } from '@/lib/xp-engine';
import { useUserStore } from '@/stores/user-store';
import { useLessonStore } from '@/stores/lesson-store';
import type { LessonContent } from '@/types';

interface LessonEngineProps {
  lessonId: string;
  modelId: string;
  content: LessonContent;
  xpReward: number;
  onComplete: () => void;
}

export function LessonEngine({
  lessonId,
  modelId,
  content,
  xpReward,
  onComplete,
}: LessonEngineProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [allFirstTry, setAllFirstTry] = useState(true);
  const [scenarioAnswered, setScenarioAnswered] = useState(false);
  const [finished, setFinished] = useState(false);

  const addXp = useUserStore((s) => s.addXp);
  const updateStreak = useUserStore((s) => s.updateStreak);
  const streakDays = useUserStore((s) => s.stats.current_streak);
  const completeLesson = useLessonStore((s) => s.completeLesson);

  const steps = content.steps;
  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const progress = (currentStep + 1) / steps.length;

  const xpResult = calculateLessonXp({
    baseXp: xpReward,
    firstTryCorrect: allFirstTry,
    streakDays,
  });

  const handleNext = useCallback(() => {
    if (finished) {
      onComplete();
      return;
    }

    if (isLastStep) {
      // Complete lesson
      const score = allFirstTry ? 100 : 70;
      completeLesson(lessonId, modelId, score);
      addXp(xpResult.total);
      updateStreak();
      setFinished(true);
      return;
    }

    setCurrentStep((s) => s + 1);
    setScenarioAnswered(false);
  }, [
    finished,
    isLastStep,
    allFirstTry,
    lessonId,
    modelId,
    xpResult.total,
    completeLesson,
    addXp,
    updateStreak,
    onComplete,
  ]);

  const handleScenarioAnswer = useCallback(
    (correct: boolean, firstTry: boolean) => {
      if (!firstTry) setAllFirstTry(false);
      if (correct) setScenarioAnswered(true);
    },
    []
  );

  const canProceed =
    step?.type === 'text' ||
    step?.type === 'key_insight' ||
    scenarioAnswered ||
    finished;

  if (finished) {
    return (
      <View style={styles.container}>
        <XpReward breakdown={xpResult.breakdown} total={xpResult.total} />
        <View style={styles.footer}>
          <Button title="Pokračovat" onPress={onComplete} size="lg" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ProgressBar progress={progress} height={4} style={styles.progressBar} />

      <View style={styles.content}>
        {step.type === 'text' && <TextStep content={step.content} />}
        {step.type === 'key_insight' && (
          <KeyInsightStep content={step.content} />
        )}
        {(step.type === 'scenario' || step.type === 'quiz') && (
          <ScenarioStep
            situation={'situation' in step ? step.situation : ''}
            question={step.question}
            options={step.options}
            onAnswer={handleScenarioAnswer}
          />
        )}
      </View>

      <View style={styles.footer}>
        <Button
          title={isLastStep ? 'Dokončit' : 'Pokračovat'}
          onPress={handleNext}
          disabled={!canProceed}
          size="lg"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  progressBar: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  content: {
    flex: 1,
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});
