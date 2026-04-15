import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { X } from 'lucide-react-native';
import { LessonEngine } from '@/components/lesson/LessonEngine';
import { useLessonStore } from '@/stores/lesson-store';
import { useUserStore } from '@/stores/user-store';
import { colors, fontSize, spacing, borderRadius } from '@/lib/constants';

const LESSON_TYPE_LABELS = {
  cs: {
    intro: 'Úvod',
    scenario: 'Scénář',
    quiz: 'Kvíz',
    application: 'Aplikace',
    deep_dive: 'Hluboký ponor',
    comparison: 'Srovnání',
  },
  en: {
    intro: 'Intro',
    scenario: 'Scenario',
    quiz: 'Quiz',
    application: 'Application',
    deep_dive: 'Deep dive',
    comparison: 'Comparison',
  },
} as const;

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const getLesson = useLessonStore((s) => s.getLesson);
  const getModel = useLessonStore((s) => s.getModel);
  const language = useUserStore((s) => s.language);

  const lesson = id ? getLesson(id) : undefined;
  const model = lesson ? getModel(lesson.model_id) : undefined;

  if (!lesson || !model) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {language === 'en' ? 'Lesson not found' : 'Lekce nebyla nalezena'}
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>{language === 'en' ? 'Back' : 'Zpět'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const typeLabels = LESSON_TYPE_LABELS[language];
  const modelDisplayName = language === 'en' ? model.name : model.name_cz;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.lessonTypeBadge}>
            {typeLabels[lesson.lesson_type as keyof typeof typeLabels] ?? lesson.lesson_type}
          </Text>
          <Text style={styles.modelName} numberOfLines={1}>
            {modelDisplayName}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeButton}
          hitSlop={8}
        >
          <X size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <LessonEngine
        lessonId={lesson.id}
        modelId={lesson.model_id}
        content={lesson.content}
        xpReward={lesson.xp_reward}
        onComplete={() => router.back()}
      />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  headerInfo: {
    flex: 1,
    gap: 4,
  },
  lessonTypeBadge: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modelName: {
    fontSize: fontSize.md,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  errorText: {
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  backLink: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: '700',
  },
});
