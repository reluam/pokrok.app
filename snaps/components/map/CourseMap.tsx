import React, { useRef, useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  LayoutChangeEvent,
} from 'react-native';
import { router } from 'expo-router';
import { impactAsync } from '@/lib/haptics';
import { MapNode } from './MapNode';
import { PathConnector } from './PathConnector';
import { CourseSection } from './CourseSection';
import { useLessonStore } from '@/stores/lesson-store';
import { useUserStore, type Language } from '@/stores/user-store';
import { colors, fontSize, spacing, borderRadius } from '@/lib/constants';
import type { NodeStatus, Track } from '@/types';

function localized(obj: { title: string; title_en?: string; subtitle: string; subtitle_en?: string }, lang: Language) {
  return {
    title: lang === 'en' && obj.title_en ? obj.title_en : obj.title,
    subtitle: lang === 'en' && obj.subtitle_en ? obj.subtitle_en : obj.subtitle,
  };
}

const OFFSETS = [0, 65, 0, -65];
function getOffset(index: number): number {
  return OFFSETS[index % OFFSETS.length];
}

// Rotating set of node icons — gives the path visual variety like Duo's
// (mic / video / dumbbell / headphones / etc).
const NODE_ICON_ROTATION = [
  'Star',
  'BookOpen',
  'Lightbulb',
  'Brain',
  'Activity',
  'Compass',
  'Eye',
  'Trophy',
];
function getNodeIcon(globalIndex: number, fallback?: string): string {
  return NODE_ICON_ROTATION[globalIndex % NODE_ICON_ROTATION.length] ?? fallback ?? 'Star';
}

function TrackTab({
  track,
  isActive,
  onPress,
  language,
}: {
  track: Track;
  isActive: boolean;
  onPress: () => void;
  language: Language;
}) {
  const { title, subtitle } = localized(track, language);
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.trackTab,
        isActive && styles.trackTabActive,
      ]}
    >
      <Text
        style={[
          styles.trackTabText,
          isActive && styles.trackTabTextActive,
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.trackTabSub,
          isActive && styles.trackTabSubActive,
        ]}
        numberOfLines={1}
      >
        {subtitle}
      </Text>
    </Pressable>
  );
}

export function CourseMap() {
  const scrollRef = useRef<ScrollView>(null);
  const activeNodeY = useRef<number | null>(null);

  const getTracks = useLessonStore((s) => s.getTracks);
  const getCourses = useLessonStore((s) => s.getCourses);
  const getNodeStatus = useLessonStore((s) => s.getNodeStatus);
  const getModelProgress = useLessonStore((s) => s.getModelProgress);
  const getCourseProgress = useLessonStore((s) => s.getCourseProgress);
  const isCourseUnlocked = useLessonStore((s) => s.isCourseUnlocked);
  const getModel = useLessonStore((s) => s.getModel);
  const getNextLessonForModel = useLessonStore((s) => s.getNextLessonForModel);
  // Subscribe to progress data so the map re-renders after a lesson is completed.
  // The selectors above only return functions, which never change reference.
  useLessonStore((s) => s.progress);
  useLessonStore((s) => s.spacedRepetition);
  const language = useUserStore((s) => s.language);

  const allTracks = getTracks();
  const [activeTrackId, setActiveTrackId] = useState(allTracks[0]?.id ?? 'track-cb');

  const trackCourses = getCourses(activeTrackId);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (activeNodeY.current != null && scrollRef.current) {
        scrollRef.current.scrollTo({
          y: Math.max(0, activeNodeY.current - 200),
          animated: true,
        });
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [activeTrackId]);

  const handleNodePress = useCallback(
    (modelId: string, status: NodeStatus) => {
      if (status === 'locked') return;
      impactAsync('Medium');
      const lesson = getNextLessonForModel(modelId);
      if (lesson) {
        router.push(`/lesson/${lesson.id}`);
      }
    },
    [getNextLessonForModel]
  );

  const handleActiveLayout = useCallback((event: LayoutChangeEvent) => {
    activeNodeY.current = event.nativeEvent.layout.y;
  }, []);

  const handleTrackChange = useCallback((trackId: string) => {
    impactAsync('Light');
    setActiveTrackId(trackId);
    activeNodeY.current = null;
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  // ── Build a flat list of children (header, body, header, body, ...) so we
  //    can use ScrollView's stickyHeaderIndices. The native sticky behavior
  //    pins the current section's header at the top of the viewport and
  //    swaps it with the next one when that header pushes it up.
  let globalNodeIndex = 0;
  const children: React.ReactNode[] = [];
  const stickyHeaderIndices: number[] = [];

  trackCourses.forEach((course, courseIndex) => {
    const courseProgress = getCourseProgress(course.id);
    const unlocked = isCourseUnlocked(course.id);
    const completedCount = course.nodes.filter(
      (n) => getModelProgress(n.modelId) >= 1
    ).length;
    const courseLoc = localized(course, language);

    // Header (sticky)
    stickyHeaderIndices.push(children.length);
    children.push(
      <View key={`${course.id}-header`} style={styles.stickyHeaderWrap}>
        <CourseSection
          section={1}
          unit={courseIndex + 1}
          title={courseLoc.title}
          subtitle={courseLoc.subtitle}
          color={course.color}
          progress={courseProgress}
          isUnlocked={unlocked}
          completedCount={completedCount}
          totalCount={course.nodes.length}
          iconName={course.icon_name}
          showStats
        />
      </View>
    );

    // Body — nodes for this course
    children.push(
      <View key={`${course.id}-body`} style={styles.nodesContainer}>
        {course.nodes.map((node, nodeIndex) => {
          const model = getModel(node.modelId);
          if (!model) return null;

          const status = getNodeStatus(node.modelId);
          const progress = getModelProgress(node.modelId);
          const offset = getOffset(globalNodeIndex);
          const isActive = status === 'available' || status === 'in_progress';

          const isLast = nodeIndex === course.nodes.length - 1;
          const nextStatus = isLast
            ? 'locked'
            : getNodeStatus(course.nodes[nodeIndex + 1].modelId);
          const connectorCompleted =
            status === 'completed' && nextStatus !== 'locked';

          const currentGlobalIndex = globalNodeIndex;
          const nodeIcon = getNodeIcon(currentGlobalIndex, course.icon_name);
          globalNodeIndex++;

          return (
            <View key={node.modelId}>
              <View
                style={[styles.nodeWrapper, { marginLeft: offset }]}
                onLayout={isActive ? handleActiveLayout : undefined}
              >
                <MapNode
                  name={model.name}
                  nameCz={model.name_cz}
                  status={status}
                  progress={progress}
                  courseColor={course.color}
                  iconName={nodeIcon}
                  onPress={() => handleNodePress(node.modelId, status)}
                  language={language}
                />
              </View>

              {!isLast && (
                <PathConnector
                  fromX={offset}
                  toX={getOffset(currentGlobalIndex + 1)}
                  completed={connectorCompleted}
                  courseColor={course.color}
                />
              )}
            </View>
          );
        })}
      </View>
    );
  });

  return (
    <View style={styles.root}>
      {/* Track selector — fixed above the scrollable path */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.trackScroll}
        contentContainerStyle={styles.trackScrollContent}
      >
        {allTracks.map((track) => (
          <TrackTab
            key={track.id}
            track={track}
            isActive={track.id === activeTrackId}
            onPress={() => handleTrackChange(track.id)}
            language={language}
          />
        ))}
      </ScrollView>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={stickyHeaderIndices}
      >
        {children}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  trackScroll: {
    maxHeight: 80,
    paddingTop: spacing.sm,
  },
  trackScrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  trackTab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.background,
    minWidth: 140,
  },
  trackTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  trackTabText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  trackTabTextActive: {
    color: '#FFFFFF',
  },
  trackTabSub: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  trackTabSubActive: {
    color: 'rgba(255,255,255,0.85)',
  },
  stickyHeaderWrap: {
    backgroundColor: colors.background,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  nodesContainer: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  nodeWrapper: {
    alignItems: 'center',
  },
});
