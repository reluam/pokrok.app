import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Flame,
  Brain,
  ChevronRight,
  Sparkles,
  Star,
  Trophy,
  BookOpen,
  Play,
  Check,
  Lock,
} from 'lucide-react-native';
import { useUserStore } from '@/stores/user-store';
import { useLessonStore } from '@/stores/lesson-store';
import { getLevelInfo } from '@/lib/xp-engine';
import { colors, fontSize, spacing, borderRadius } from '@/lib/constants';
import type { Course, Track, NodeStatus } from '@/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH - spacing.lg * 2;

interface CourseModelNode {
  modelId: string;
  name: string;
  status: NodeStatus;
  stepProgress?: string;
  stepPct?: number;
}

interface ContinueItem {
  course: Course;
  track: Track | undefined;
  progress: number;
  nextModelId: string | null;
  nextModelName: string;
  totalModels: number;
  completedModels: number;
  lastInteractedAt: number;
  nodes: CourseModelNode[];
}

export default function HomeScreen() {
  const displayName = useUserStore((s) => s.displayName);
  const stats = useUserStore((s) => s.stats);
  const language = useUserStore((s) => s.language);
  const t = (cs: string, en: string) => (language === 'en' ? en : cs);
  const locTitle = (obj: { title: string; title_en?: string }) =>
    language === 'en' && obj.title_en ? obj.title_en : obj.title;

  const getTracks = useLessonStore((s) => s.getTracks);
  const getCourses = useLessonStore((s) => s.getCourses);
  const getCourseProgress = useLessonStore((s) => s.getCourseProgress);
  const getModelProgress = useLessonStore((s) => s.getModelProgress);
  const getNodeStatus = useLessonStore((s) => s.getNodeStatus);
  const isCourseUnlocked = useLessonStore((s) => s.isCourseUnlocked);
  const getNextLessonForModel = useLessonStore((s) => s.getNextLessonForModel);
  const getLessonsForModel = useLessonStore((s) => s.getLessonsForModel);
  const getModel = useLessonStore((s) => s.getModel);
  const getLesson = useLessonStore((s) => s.getLesson);
  const getDueReviews = useLessonStore((s) => s.getDueReviews);
  const pull = useLessonStore((s) => s.pull);
  const push = useLessonStore((s) => s.push);
  const checkpoints = useLessonStore((s) => s.checkpoints);
  const userId = useUserStore((s) => s.userId);
  const progressMap = useLessonStore((s) => s.progress);

  const levelInfo = getLevelInfo(stats.total_xp);

  const setStats = useUserStore((s) => s.setStats);
  const [refreshing, setRefreshing] = useState(false);

  const doPull = useCallback(async () => {
    if (!userId || userId === 'demo-user') return;
    const serverStats = await pull(userId);
    if (serverStats) setStats(serverStats);
  }, [userId, pull, setStats]);

  // NO pull on mount — prevents overwriting freshly completed lessons.
  // Pull only on explicit pull-to-refresh.
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await doPull();
    setRefreshing(false);
  }, [doPull]);

  // PUSH to server when progress or checkpoints change
  const fingerprint = JSON.stringify({
    p: Object.keys(progressMap).sort(),
    c: Object.entries(checkpoints).map(([k, v]) => `${k}:${(v as any)?.currentStep ?? 0}`).sort(),
  });
  const prevFingerprint = useRef(fingerprint);
  useEffect(() => {
    if (prevFingerprint.current === fingerprint) return;
    prevFingerprint.current = fingerprint;
    if (!userId || userId === 'demo-user') return;
    const timer = setTimeout(() => {
      const freshStats = useUserStore.getState().stats;
      push(userId, freshStats);
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fingerprint]);

  const allTracks = getTracks();
  const dueReviews = getDueReviews();

  const continueItems = useMemo<ContinueItem[]>(() => {
    const items: ContinueItem[] = [];

    for (const course of getCourses()) {
      if (!isCourseUnlocked(course.id)) continue;
      const progress = getCourseProgress(course.id);
      if (progress >= 1) continue;

      let nextModelId: string | null = null;
      for (const node of course.nodes) {
        const status = getNodeStatus(node.modelId);
        if (status === 'available' || status === 'in_progress') {
          nextModelId = node.modelId;
          break;
        }
      }
      if (!nextModelId) continue;

      const completedModels = course.nodes.filter(
        (n) => getModelProgress(n.modelId) >= 1,
      ).length;

      let lastInteractedAt = 0;
      for (const node of course.nodes) {
        for (const lesson of getLessonsForModel(node.modelId)) {
          const p = progressMap[lesson.id];
          if (p?.completed_at) {
            const ts = new Date(p.completed_at).getTime();
            if (ts > lastInteractedAt) lastInteractedAt = ts;
          }
        }
      }

      const nextModel = nextModelId ? getModel(nextModelId) : undefined;

      const nodes: CourseModelNode[] = course.nodes.map((n) => {
        const m = getModel(n.modelId);
        const status = getNodeStatus(n.modelId);
        let stepProgress: string | undefined;
        let stepPct: number | undefined;
        if (status === 'in_progress' || status === 'available') {
          for (const ml of getLessonsForModel(n.modelId)) {
            const cp = checkpoints[ml.id];
            if (cp) {
              const total = getLesson(ml.id)?.content.steps.length ?? 0;
              if (total > 0) {
                stepProgress = `${cp.currentStep + 1}/${total}`;
                stepPct = Math.round(((cp.currentStep + 1) / total) * 100);
              }
              break;
            }
          }
        }
        return {
          modelId: n.modelId,
          name: m ? (language === 'en' ? m.name : m.name_cz) : n.modelId,
          status,
          stepProgress,
          stepPct,
        };
      });

      items.push({
        course,
        track: allTracks.find((t) => t.id === course.trackId),
        progress,
        nextModelId,
        nextModelName: nextModel
          ? language === 'en' ? nextModel.name : nextModel.name_cz
          : '',
        totalModels: course.nodes.length,
        completedModels,
        lastInteractedAt,
        nodes,
      });
    }

    items.sort((a, b) => {
      if (b.lastInteractedAt !== a.lastInteractedAt)
        return b.lastInteractedAt - a.lastInteractedAt;
      return b.progress - a.progress;
    });

    return items.slice(0, 8);
  }, [
    allTracks, getCourses, getCourseProgress, getModelProgress,
    getNodeStatus, isCourseUnlocked, getLessonsForModel, getModel,
    getLesson, progressMap, checkpoints, language,
  ]);

  const handleStartLesson = (modelId: string) => {
    const lesson = getNextLessonForModel(modelId);
    if (lesson) router.push(`/lesson/${lesson.id}`);
  };

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => { scrollY.value = event.contentOffset.y; },
  });

  const firstName = displayName?.split(' ')[0] || '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Stats row — 4 badges */}
        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <Star size={18} color={colors.xpGold} />
            <Text style={[styles.statValue, { color: colors.xpGold }]}>
              {stats.total_xp}
            </Text>
          </View>
          <View style={styles.statBadge}>
            <Trophy size={18} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {levelInfo.level}
            </Text>
          </View>
          <View style={styles.statBadge}>
            <Flame
              size={18}
              color={stats.current_streak > 0 ? colors.streak : colors.textMuted}
              fill={stats.current_streak > 0 ? colors.streak : 'transparent'}
            />
            <Text style={[styles.statValue, {
              color: stats.current_streak > 0 ? colors.streak : colors.textMuted,
            }]}>
              {stats.current_streak}
            </Text>
          </View>
          <View style={styles.statBadge}>
            <BookOpen size={18} color={colors.teal} />
            <Text style={[styles.statValue, { color: colors.teal }]}>
              {stats.models_mastered}
            </Text>
          </View>
        </View>

        {/* Level progress bar */}
        <View style={styles.levelBar}>
          <View style={styles.levelBarHeader}>
            <Text style={styles.levelBarTitle}>{levelInfo.title}</Text>
            <Text style={styles.levelBarXp}>
              {stats.total_xp}/{levelInfo.xpForNextLevel} XP
            </Text>
          </View>
          <View style={styles.levelBarTrack}>
            <View style={[styles.levelBarFill, {
              width: `${Math.max(levelInfo.progress * 100, 2)}%`,
            }]} />
          </View>
        </View>


        {/* Due Reviews */}
        {dueReviews.length > 0 && (
          <TouchableOpacity
            style={styles.reviewStrip}
            activeOpacity={0.85}
            onPress={() => router.push('/(tabs)/practice')}
          >
            <View style={styles.reviewStripIcon}>
              <Brain size={20} color={colors.primary} />
            </View>
            <View style={styles.reviewStripInfo}>
              <Text style={styles.reviewStripTitle}>{t('K opakování', 'For review')}</Text>
              <Text style={styles.reviewStripSub}>
                {dueReviews.length}{' '}
                {t('konceptů čeká', 'concepts waiting')}
              </Text>
            </View>
            <ChevronRight size={20} color={colors.primary} />
          </TouchableOpacity>
        )}

        {/* Continue Learning */}
        {continueItems.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>
              {t('Pokračuj v učení', 'Continue learning')}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={CARD_WIDTH + spacing.md}
              decelerationRate="fast"
              contentContainerStyle={styles.pagerContent}
              style={styles.pager}
            >
              {continueItems.map((item) => {
                const accent = item.track?.color ?? colors.primary;
                return (
                  <View key={item.course.id} style={[styles.courseCard, { width: CARD_WIDTH }]}>
                    {/* Track + title */}
                    {item.track && (
                      <View style={styles.trackRow}>
                        <View style={[styles.trackDot, { backgroundColor: accent }]} />
                        <Text style={[styles.trackLabel, { color: accent }]}>
                          {locTitle(item.track)}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.courseTitle}>{locTitle(item.course)}</Text>

                    {/* Progress */}
                    <View style={styles.progressRow}>
                      <Text style={styles.progressText}>
                        {item.completedModels}/{item.totalModels}{' '}
                        {t('konceptů', 'concepts')}
                      </Text>
                      <Text style={styles.progressText}>
                        {Math.round(item.progress * 100)}%
                      </Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, {
                        width: `${item.progress * 100}%`,
                        backgroundColor: accent,
                      }]} />
                    </View>

                    {/* Node path */}
                    <View style={styles.nodeList}>
                      {item.nodes.map((node, i) => {
                        const isNext = node.modelId === item.nextModelId;
                        const isCompleted = node.status === 'completed';
                        const isLocked = node.status === 'locked';
                        const isLast = i === item.nodes.length - 1;

                        return (
                          <View key={node.modelId}>
                            <View style={styles.nodeRow}>
                              {/* Dot */}
                              <View style={[styles.nodeDot,
                                isCompleted && { backgroundColor: colors.success, borderColor: colors.success },
                                isNext && { backgroundColor: colors.primary, borderColor: colors.primary },
                                isLocked && { backgroundColor: colors.surface, borderColor: '#E5E7EB' },
                              ]}>
                                {isCompleted ? (
                                  <Check size={10} color="#fff" />
                                ) : isLocked ? (
                                  <Lock size={8} color={colors.textMuted} />
                                ) : isNext ? (
                                  <Play size={8} color="#fff" fill="#fff" />
                                ) : null}
                              </View>

                              {/* Label */}
                              {isNext ? (
                                <Pressable
                                  onPress={() => handleStartLesson(node.modelId)}
                                  style={[styles.nodeNextBtn, { backgroundColor: accent + '18' }]}
                                >
                                  <Text style={[styles.nodeNextName, { color: accent }]} numberOfLines={1}>
                                    {node.name}
                                  </Text>
                                  {node.stepProgress ? (
                                    <View style={styles.nodeProgressWrap}>
                                      <View style={styles.nodeProgressTrack}>
                                        <View style={[styles.nodeProgressFill, {
                                          width: `${node.stepPct ?? 0}%`,
                                          backgroundColor: accent,
                                        }]} />
                                      </View>
                                      <Text style={styles.nodeStepText}>{node.stepProgress}</Text>
                                    </View>
                                  ) : null}
                                  <ChevronRight size={14} color={accent} />
                                </Pressable>
                              ) : (
                                <View style={styles.nodeLabel}>
                                  <Text
                                    style={[
                                      styles.nodeName,
                                      isCompleted && styles.nodeNameDone,
                                      isLocked && styles.nodeNameLocked,
                                    ]}
                                    numberOfLines={1}
                                  >
                                    {node.name}
                                  </Text>
                                  {node.stepProgress ? (
                                    <Text style={styles.nodeStepText}>{node.stepProgress}</Text>
                                  ) : null}
                                </View>
                              )}
                            </View>
                            {/* Connector */}
                            {!isLast && (
                              <View style={styles.nodeConnectorWrap}>
                                <View style={[styles.nodeConnector,
                                  isCompleted && { backgroundColor: colors.success },
                                ]} />
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Sparkles size={32} color={colors.primary} />
            <Text style={styles.emptyTitle}>{t('Začni objevovat', 'Start exploring')}</Text>
            <Text style={styles.emptySub}>
              {t('Vyber si v knihovně svůj první koncept.', 'Pick your first concept in the library.')}
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              activeOpacity={0.85}
              onPress={() => router.push('/(tabs)/library')}
            >
              <Text style={styles.emptyButtonText}>{t('Otevřít knihovnu', 'Open library')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl + spacing.lg,
    gap: spacing.md,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  statBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: fontSize.sm,
    fontWeight: '800',
  },

  // Level progress
  levelBar: {},
  levelBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  levelBarTitle: {
    fontSize: fontSize.xs,
    fontWeight: '800',
    color: colors.primary,
  },
  levelBarXp: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textMuted,
  },
  levelBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surface,
    overflow: 'hidden' as const,
  },
  levelBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.primary,
  },


  // Review strip
  reviewStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  reviewStripIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  reviewStripInfo: { flex: 1 },
  reviewStripTitle: {
    fontSize: fontSize.md, fontWeight: '800', color: colors.textPrimary,
  },
  reviewStripSub: {
    fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 1,
  },

  // Section
  sectionTitle: {
    fontSize: fontSize.lg, fontWeight: '800', color: colors.textPrimary,
    marginTop: spacing.sm,
  },

  // Pager
  pager: { marginHorizontal: -spacing.lg },
  pagerContent: { paddingHorizontal: spacing.lg, gap: spacing.md },

  // Course card
  courseCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xxl,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  trackRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  trackDot: { width: 8, height: 8, borderRadius: 4 },
  trackLabel: {
    fontSize: fontSize.xs, fontWeight: '800',
    textTransform: 'uppercase', letterSpacing: 1,
  },
  courseTitle: {
    fontSize: fontSize.xl, fontWeight: '800', color: colors.textPrimary,
    marginTop: spacing.xs, lineHeight: 28,
  },

  // Progress
  progressRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  progressText: {
    fontSize: fontSize.xs, fontWeight: '700', color: colors.textMuted,
  },
  progressBar: {
    height: 6, borderRadius: 3, backgroundColor: colors.surface,
    marginTop: spacing.xs, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },

  // Node path
  nodeList: { marginTop: spacing.lg },
  nodeRow: { flexDirection: 'row', alignItems: 'center' },
  nodeDot: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: '#E5E7EB', backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center',
  },
  nodeConnectorWrap: {
    paddingLeft: 11, // center under 24px dot
    height: 12,
  },
  nodeConnector: {
    width: 2, height: '100%', backgroundColor: '#E5E7EB',
  },
  nodeNextBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    marginLeft: spacing.sm, paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2, borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  nodeNextName: {
    fontSize: fontSize.sm, fontWeight: '700', flexShrink: 1,
  },
  nodeProgressWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  nodeProgressTrack: {
    flex: 1, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.06)', overflow: 'hidden',
  },
  nodeProgressFill: { height: '100%', borderRadius: 2 },
  nodeStepText: {
    fontSize: 10, fontWeight: '700', color: colors.textMuted,
  },
  nodeLabel: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    marginLeft: spacing.sm, paddingVertical: spacing.xs + 2, gap: spacing.xs,
  },
  nodeName: {
    fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary,
    flexShrink: 1,
  },
  nodeNameDone: { color: colors.textSecondary },
  nodeNameLocked: { color: colors.textMuted, opacity: 0.5 },

  // Empty state
  emptyState: {
    backgroundColor: colors.card, borderRadius: borderRadius.xxl,
    padding: spacing.xl, alignItems: 'center', gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSize.lg, fontWeight: '800', color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  emptySub: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center' },
  emptyButton: {
    marginTop: spacing.sm, paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 4, borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
  },
  emptyButtonText: { color: '#fff', fontWeight: '800', fontSize: fontSize.sm },
});
