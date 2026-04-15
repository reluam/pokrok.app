'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { allModels } from '@/data/models/index';
import { allLessons } from '@/data/lessons/index';
import { courses } from '@/data/courses';
import { tracks } from '@/data/tracks';
import { sm2, getNextReviewDate, isDueForReview } from '@/lib/spaced-repetition';
import { pullFromServer, pushToServer } from '@/lib/sync';
import type {
  Course,
  Lesson,
  MentalModel,
  NodeStatus,
  SpacedRepetitionCard,
  Track,
  UserProgress,
} from '@/types';

const mentalModels = allModels;
const lessons = allLessons;

/** In-progress lesson checkpoint saved after each step / quiz answer. */
interface LessonCheckpoint {
  currentStep: number;
  answeredSteps: number[];
  firstTrySteps: number[];
}

interface WebLessonState {
  progress: Record<string, UserProgress>;
  spacedRepetition: Record<string, SpacedRepetitionCard>;
  /** Per-lesson in-progress checkpoints. Deleted when lesson is completed. */
  checkpoints: Record<string, LessonCheckpoint>;

  getModel: (id: string) => MentalModel | undefined;
  getModels: () => MentalModel[];
  getLessonsForModel: (modelId: string) => Lesson[];
  getLesson: (lessonId: string) => Lesson | undefined;
  getModelProgress: (modelId: string) => number;
  isLessonCompleted: (lessonId: string) => boolean;
  getDueReviews: () => { model: MentalModel; card: SpacedRepetitionCard }[];

  getTracks: () => Track[];
  getCourses: (trackId?: string) => Course[];
  getNodeStatus: (modelId: string) => NodeStatus;
  getCourseProgress: (courseId: string) => number;
  isCourseUnlocked: (courseId: string) => boolean;
  getNextLessonForModel: (modelId: string) => Lesson | undefined;

  saveCheckpoint: (lessonId: string, cp: LessonCheckpoint) => void;
  getCheckpoint: (lessonId: string) => LessonCheckpoint | undefined;
  completeLesson: (lessonId: string, modelId: string, score: number) => void;
  recordReview: (modelId: string, quality: number) => void;

  /** Pull server data → overwrite local. Returns server stats or null. */
  pull: (userId: string) => Promise<Record<string, any> | null>;
  /** Push local state → overwrite server. */
  push: (userId: string, stats: Record<string, any>) => Promise<boolean>;
}

export const useWebLessonStore = create<WebLessonState>()(
  persist(
    (set, get) => ({
      progress: {},
      spacedRepetition: {},
      checkpoints: {},

      getModel: (id) => mentalModels.find((m) => m.id === id),
      getModels: () => mentalModels,

      getLessonsForModel: (modelId) =>
        lessons
          .filter((l) => l.model_id === modelId)
          .sort((a, b) => a.order_index - b.order_index),

      getLesson: (lessonId) => lessons.find((l) => l.id === lessonId),

      getModelProgress: (modelId) => {
        const modelLessons = lessons.filter((l) => l.model_id === modelId);
        if (modelLessons.length === 0) return 0;
        const completed = modelLessons.filter(
          (l) => get().progress[l.id]?.completed,
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

      getTracks: () => tracks,

      getCourses: (trackId) => {
        if (!trackId) return courses;
        return courses.filter((c) => c.trackId === trackId);
      },

      getNodeStatus: (modelId) => {
        const progress = get().getModelProgress(modelId);
        if (progress >= 1) return 'completed';
        if (progress > 0) return 'in_progress';

        for (const course of courses) {
          const nodeIndex = course.nodes.findIndex(
            (n) => n.modelId === modelId,
          );
          if (nodeIndex === -1) continue;
          if (!get().isCourseUnlocked(course.id)) return 'locked';
          if (nodeIndex === 0) return 'available';
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
          (n) => get().getModelProgress(n.modelId) >= 1,
        ).length;
        return completed / course.nodes.length;
      },

      isCourseUnlocked: (courseId) => {
        const course = courses.find((c) => c.id === courseId);
        if (!course) return false;
        const trackCourses = courses
          .filter((c) => c.trackId === course.trackId)
          .sort((a, b) => a.order - b.order);
        if (trackCourses[0]?.id === courseId) return true;
        const courseIndex = trackCourses.findIndex((c) => c.id === courseId);
        if (courseIndex <= 0) return true;
        const prevCourse = trackCourses[courseIndex - 1];
        return get().getCourseProgress(prevCourse.id) >= 1;
      },

      getNextLessonForModel: (modelId) => {
        const modelLessons = lessons
          .filter((l) => l.model_id === modelId)
          .sort((a, b) => a.order_index - b.order_index);
        return (
          modelLessons.find((l) => !get().isLessonCompleted(l.id)) ??
          modelLessons[0]
        );
      },

      saveCheckpoint: (lessonId, cp) => {
        set((state) => ({
          checkpoints: { ...state.checkpoints, [lessonId]: cp },
        }));
      },

      getCheckpoint: (lessonId) => get().checkpoints[lessonId],

      completeLesson: (lessonId, modelId, score) => {
        const now = new Date().toISOString();
        set((state) => {
          // Remove checkpoint — lesson is done
          const { [lessonId]: _, ...remainingCheckpoints } = state.checkpoints;

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

          const modelLessons = lessons.filter((l) => l.model_id === modelId);
          const allCompleted = modelLessons.every(
            (l) => newProgress[l.id]?.completed,
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

          return { progress: newProgress, spacedRepetition: newSR, checkpoints: remainingCheckpoints };
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

      pull: async (userId) => {
        const data = await pullFromServer(userId);
        if (!data) return null;
        set({
          progress: data.progress as Record<string, UserProgress>,
          spacedRepetition: data.spaced_repetition as Record<string, SpacedRepetitionCard>,
          checkpoints: data.checkpoints ?? {},
        });
        return data.stats;
      },

      push: async (userId, stats) => {
        const { progress, spacedRepetition, checkpoints } = get();
        return pushToServer(userId, {
          progress,
          stats,
          spaced_repetition: spacedRepetition,
          checkpoints,
        });
      },
    }),
    {
      name: 'calibrate-lessons',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
