import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { TextStep } from './TextStep';
import { KeyInsightStep } from './KeyInsightStep';
import { ScenarioStep } from './ScenarioStep';
import { LessonIntroStep } from './LessonIntroStep';
import { XpReward } from '@/components/gamification/XpReward';
import { colors, spacing } from '@/lib/constants';
import { calculateLessonXp } from '@/lib/xp-engine';
import { useUserStore } from '@/stores/user-store';
import { useLessonStore } from '@/stores/lesson-store';
import type { LessonContent, ScenarioOption } from '@/types';

const BUTTON_LABELS = {
  cs: { continue: 'Pokračovat', finish: 'Dokončit' },
  en: { continue: 'Continue', finish: 'Finish' },
} as const;

function pickLocalized<T extends string | undefined>(cs: T, en: T | undefined, lang: 'cs' | 'en'): T {
  if (lang === 'en' && en) return en;
  return cs;
}

function localizeOptions(options: ScenarioOption[], lang: 'cs' | 'en'): ScenarioOption[] {
  if (lang === 'cs') return options;
  return options.map((o) => ({
    ...o,
    text: o.text_en || o.text,
    explanation: o.explanation_en || o.explanation,
  }));
}

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
  const saveCheckpoint = useLessonStore((s) => s.saveCheckpoint);
  const getCheckpoint = useLessonStore((s) => s.getCheckpoint);
  const savedCp = getCheckpoint(lessonId);

  const [currentStep, setCurrentStep] = useState(savedCp?.currentStep ?? 0);
  // Quiz scoring — always starts fresh (checkpoints track position, not answers)
  const [quizCorrect, setQuizCorrect] = useState(0);
  const [quizFirstTry, setQuizFirstTry] = useState(0);
  const [scenarioAnswered, setScenarioAnswered] = useState(false);
  const [finished, setFinished] = useState(false);

  const addXp = useUserStore((s) => s.addXp);
  const updateStreak = useUserStore((s) => s.updateStreak);
  const streakDays = useUserStore((s) => s.stats.current_streak);
  const userId = useUserStore((s) => s.userId);
  const language = useUserStore((s) => s.language);
  const completeLesson = useLessonStore((s) => s.completeLesson);
  const push = useLessonStore((s) => s.push);

  const steps = content.steps;
  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const progress = (currentStep + 1) / steps.length;
  const labels = BUTTON_LABELS[language];

  // Total quiz steps in this lesson (used for percentage scoring)
  const totalQuizSteps = steps.filter((s) => s.type === 'quiz').length;
  // For lessons with no quiz steps (legacy or pure-text lessons), fall back to
  // counting scenario steps so existing content still scores something.
  const hasNoQuiz = totalQuizSteps === 0;
  const totalScored = hasNoQuiz
    ? steps.filter((s) => s.type === 'scenario').length
    : totalQuizSteps;

  // Score = % of scored questions answered correctly on the first try
  const scorePct =
    totalScored > 0 ? Math.round((quizFirstTry / totalScored) * 100) : 100;
  const allFirstTry = totalScored > 0 ? quizFirstTry === totalScored : true;

  const xpResult = calculateLessonXp({
    baseXp: xpReward,
    firstTryCorrect: allFirstTry,
    streakDays,
  });

  // Use a ref to always have fresh scoring values available in handleNext
  const scoringRef = useRef({ scorePct, xpTotal: xpResult.total });
  scoringRef.current = { scorePct, xpTotal: xpResult.total };

  const handleNext = useCallback(async () => {
    if (finished) {
      onComplete();
      return;
    }

    if (isLastStep) {
      // Read fresh scoring from ref (not stale closure)
      const { scorePct: score, xpTotal } = scoringRef.current;
      completeLesson(lessonId, modelId, score);
      addXp(xpTotal);
      updateStreak();
      // Push to server BEFORE showing finish screen
      if (userId) {
        const freshStats = useUserStore.getState().stats;
        await push(userId, freshStats);
      }
      setFinished(true);
      return;
    }

    const next = currentStep + 1;
    setCurrentStep(next);
    setScenarioAnswered(false);
    saveCheckpoint(lessonId, {
      currentStep: next,
      answeredSteps: [],
      firstTrySteps: [],
    });
    if (userId) {
      setTimeout(() => {
        const freshStats = useUserStore.getState().stats;
        push(userId, freshStats);
      }, 100);
    }
  }, [
    finished,
    isLastStep,
    currentStep,
    lessonId,
    modelId,
    completeLesson,
    addXp,
    updateStreak,
    onComplete,
    saveCheckpoint,
    push,
    userId,
  ]);

  const handleScenarioAnswer = useCallback(
    (correct: boolean, firstTry: boolean) => {
      const isScored =
        step?.type === 'quiz' || (hasNoQuiz && step?.type === 'scenario');
      if (correct) {
        setScenarioAnswered(true);
        if (isScored) {
          setQuizCorrect((c) => c + 1);
          if (firstTry) setQuizFirstTry((f) => f + 1);
        }
        // Save checkpoint after answering + push to server
        saveCheckpoint(lessonId, {
          currentStep,
          answeredSteps: [],
          firstTrySteps: [],
        });
        if (userId) {
          const freshStats = useUserStore.getState().stats;
          push(userId, freshStats);
        }
      }
    },
    [step?.type, hasNoQuiz, currentStep, lessonId, saveCheckpoint, push, userId]
  );

  const canProceed =
    step?.type === 'lesson_intro' ||
    step?.type === 'text' ||
    step?.type === 'key_insight' ||
    scenarioAnswered ||
    finished;

  if (finished) {
    return (
      <View style={styles.container}>
        <XpReward breakdown={xpResult.breakdown} total={xpResult.total} />
        <View style={styles.footer}>
          <Button title={labels.continue} onPress={onComplete} size="lg" />
        </View>
      </View>
    );
  }

  // Localize the current step's content based on user's language preference.
  // EN content falls back to CZ when not present.
  const renderStep = () => {
    if (step.type === 'lesson_intro') {
      return (
        <LessonIntroStep
          title={pickLocalized(step.title, step.title_en, language)}
          description={pickLocalized(step.description, step.description_en, language)}
          icon={step.icon}
        />
      );
    }
    if (step.type === 'text') {
      return <TextStep content={pickLocalized(step.content, step.content_en, language)} />;
    }
    if (step.type === 'key_insight') {
      return <KeyInsightStep content={pickLocalized(step.content, step.content_en, language)} />;
    }
    if (
      step.type === 'scenario' ||
      step.type === 'quiz' ||
      step.type === 'engagement'
    ) {
      // Quiz steps can optionally include a situation framing too.
      const situation =
        step.type === 'scenario' || step.type === 'quiz'
          ? pickLocalized(step.situation || '', step.situation_en, language)
          : '';
      // Engagement steps get a different label to make it clear they're
      // for reflection, not scoring.
      const label =
        step.type === 'engagement'
          ? language === 'en'
            ? 'Think about it'
            : 'Zamysli se'
          : step.type === 'quiz'
          ? language === 'en'
            ? 'Quiz'
            : 'Kvíz'
          : '';
      return (
        <ScenarioStep
          key={currentStep}
          situation={situation}
          question={pickLocalized(step.question, step.question_en, language)}
          options={localizeOptions(step.options, language)}
          label={label}
          onAnswer={handleScenarioAnswer}
        />
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <ProgressBar
        progress={progress}
        height={18}
        color={colors.primary}
        backgroundColor={colors.surface}
        style={styles.progressBar}
      />

      <View style={styles.content}>{renderStep()}</View>

      <View style={styles.footer}>
        <Button
          title={isLastStep ? labels.finish : labels.continue}
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
