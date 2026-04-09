import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { mentalModels, lessons } from '@/data/models';
import { courses } from '@/data/courses';
import { sm2, getNextReviewDate, isDueForReview } from '@/lib/spaced-repetition';
import type { Course, Lesson, MentalModel, NodeStatus, SpacedRepetitionCard, UserProgress } from '@/types';

interface LessonState {
  progress: Record<string, UserProgress>;
  spacedRepetition: Record<string, SpacedRepetitionCard>;

  getModel: (id: string) => MentalModel | undefined;
  getModels: () => MentalModel[];
  getModelsByCategory: (category: string) => MentalModel[];
  getLessonsForModel: (modelId: string) => Lesson[];
  getLesson: (lessonId: string) => Lesson | undefined;
  getModelProgress: (modelId: string) => number;
  isLessonCompleted: (lessonId: string) => boolean;
  getDueReviews: () => { model: MentalModel; card: SpacedRepetitionCard }[];
  getRecommendedModel: () => MentalModel | undefined;

  // Course map selectors
  getCourses: () => Course[];
  getNodeStatus: (modelId: string) => NodeStatus;
  getCourseProgress: (courseId: string) => number;
  isCourseUnlocked: (courseId: string) => boolean;
  getNextLessonForModel: (modelId: string) => Lesson | undefined;

  completeLesson: (lessonId: string, modelId: string, score: number) => void;
  recordReview: (modelId: string, quality: number) => void;
}

export const useLessonStore = create<LessonState>()(
  persist(
    (set, get) => ({
      progress: {},
      spacedRepetition: {},

      getModel: (id) => mentalModels.find((m) => m.id === id),

      getModels: () => mentalModels,

      getModelsByCategory: (category) =>
        mentalModels.filter((m) => m.category === category),

      getLessonsForModel: (modelId) =>
        lessons
          .filter((l) => l.model_id === modelId)
          .sort((a, b) => a.order_index - b.order_index),

      getLesson: (lessonId) => lessons.find((l) => l.id === lessonId),

      getModelProgress: (modelId) => {
        const modelLessons = lessons.filter((l) => l.model_id === modelId);
        if (modelLessons.length === 0) return 0;
        const completed = modelLessons.filter(
          (l) => get().progress[l.id]?.completed
        ).length;
        return completed / modelLessons.length;
      },

      isLessonCompleted: (lessonId) =>
        get().progress[lessonId]?.completed ?? false,

      getDueReviews: () => {
        const { spacedRepetition } = get();
        return Object.values(spacedRepetition)
          .filter((card) => isDueForReview(card.next_review_date))
          .map((card) => ({
            model: mentalModels.find((m) => m.id === card.model_id)!,
            card,
          }))
          .filter((item) => item.model != null);
      },

      getRecommendedModel: () => {
        // Follow course path order
        for (const course of courses) {
          if (!get().isCourseUnlocked(course.id)) continue;
          for (const node of course.nodes) {
            const status = get().getNodeStatus(node.modelId);
            if (status === 'available' || status === 'in_progress') {
              return mentalModels.find((m) => m.id === node.modelId);
            }
          }
        }
        return mentalModels[0];
      },

      // Course map selectors
      getCourses: () => courses,

      getNodeStatus: (modelId) => {
        const progress = get().getModelProgress(modelId);
        if (progress >= 1) return 'completed';
        if (progress > 0) return 'in_progress';

        // Check if this node is available (first in course 1, or previous completed)
        for (const course of courses) {
          const nodeIndex = course.nodes.findIndex((n) => n.modelId === modelId);
          if (nodeIndex === -1) continue;

          // Course must be unlocked
          if (!get().isCourseUnlocked(course.id)) return 'locked';

          // First node in course is available if course is unlocked
          if (nodeIndex === 0) return 'available';

          // Previous node must be completed
          const prevModelId = course.nodes[nodeIndex - 1].modelId;
          const prevProgress = get().getModelProgress(prevModelId);
          return prevProgress >= 1 ? 'available' : 'locked';
        }

        return 'locked';
      },

      getCourseProgress: (courseId) => {
        const course = courses.find((c) => c.id === courseId);
        if (!course) return 0;
        const completed = course.nodes.filter(
          (n) => get().getModelProgress(n.modelId) >= 1
        ).length;
        return completed / course.nodes.length;
      },

      isCourseUnlocked: (courseId) => {
        const course = courses.find((c) => c.id === courseId);
        if (!course) return false;
        if (course.order === 0) return true;
        const prevCourse = courses.find((c) => c.order === course.order - 1);
        if (!prevCourse) return true;
        return get().getCourseProgress(prevCourse.id) >= 1;
      },

      getNextLessonForModel: (modelId) => {
        const modelLessons = lessons
          .filter((l) => l.model_id === modelId)
          .sort((a, b) => a.order_index - b.order_index);
        return modelLessons.find((l) => !get().isLessonCompleted(l.id)) ?? modelLessons[0];
      },

      completeLesson: (lessonId, modelId, score) => {
        const now = new Date().toISOString();
        set((state) => {
          const newProgress = {
            ...state.progress,
            [lessonId]: {
              id: lessonId,
              user_id: '',
              model_id: modelId,
              lesson_id: lessonId,
              completed: true,
              score,
              completed_at: now,
            },
          };

          // Check if all lessons for this model are completed → init spaced repetition
          const modelLessons = lessons.filter((l) => l.model_id === modelId);
          const allCompleted = modelLessons.every(
            (l) => newProgress[l.id]?.completed
          );

          let newSR = { ...state.spacedRepetition };
          if (allCompleted && !newSR[modelId]) {
            const today = new Date().toISOString().split('T')[0];
            newSR[modelId] = {
              id: modelId,
              user_id: '',
              model_id: modelId,
              ease_factor: 2.5,
              interval_days: 1,
              repetitions: 0,
              next_review_date: getNextReviewDate(1),
              last_review_date: today,
            };
          }

          return { progress: newProgress, spacedRepetition: newSR };
        });
      },

      recordReview: (modelId, quality) => {
        set((state) => {
          const card = state.spacedRepetition[modelId];
          if (!card) return state;

          const updated = sm2(card, quality);
          const today = new Date().toISOString().split('T')[0];

          return {
            spacedRepetition: {
              ...state.spacedRepetition,
              [modelId]: {
                ...card,
                ...updated,
                next_review_date: getNextReviewDate(updated.interval_days),
                last_review_date: today,
              },
            },
          };
        });
      },
    }),
    {
      name: 'snaps-lessons',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
