import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { X } from 'lucide-react-native';
import { LessonEngine } from '@/components/lesson/LessonEngine';
import { useLessonStore } from '@/stores/lesson-store';
import { colors, fontSize, spacing } from '@/lib/constants';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const getLesson = useLessonStore((s) => s.getLesson);
  const getModel = useLessonStore((s) => s.getModel);

  const lesson = id ? getLesson(id) : undefined;
  const model = lesson ? getModel(lesson.model_id) : undefined;

  if (!lesson || !model) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Lekce nebyla nalezena</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>Zpět</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.modelName}>{model.name_cz}</Text>
          <Text style={styles.lessonType}>
            {lesson.lesson_type === 'intro'
              ? 'Úvod'
              : lesson.lesson_type === 'scenario'
                ? 'Scénář'
                : lesson.lesson_type === 'quiz'
                  ? 'Kvíz'
                  : 'Aplikace'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <X size={24} color={colors.textSecondary} />
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
    paddingVertical: spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  modelName: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  lessonType: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  closeButton: {
    padding: spacing.sm,
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
  },
});
