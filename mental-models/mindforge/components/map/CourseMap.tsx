import React, { useRef, useCallback, useEffect } from 'react';
import { View, ScrollView, StyleSheet, LayoutChangeEvent } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MapNode } from './MapNode';
import { PathConnector } from './PathConnector';
import { CourseSection } from './CourseSection';
import { useLessonStore } from '@/stores/lesson-store';
import { colors, spacing } from '@/lib/constants';
import type { NodeStatus } from '@/types';

// Zigzag offsets for the winding path
const OFFSETS = [0, 70, 0, -70];
function getOffset(index: number): number {
  return OFFSETS[index % OFFSETS.length];
}

export function CourseMap() {
  const scrollRef = useRef<ScrollView>(null);
  const activeNodeY = useRef<number | null>(null);

  const getCourses = useLessonStore((s) => s.getCourses);
  const getNodeStatus = useLessonStore((s) => s.getNodeStatus);
  const getModelProgress = useLessonStore((s) => s.getModelProgress);
  const getCourseProgress = useLessonStore((s) => s.getCourseProgress);
  const isCourseUnlocked = useLessonStore((s) => s.isCourseUnlocked);
  const getModel = useLessonStore((s) => s.getModel);
  const getNextLessonForModel = useLessonStore((s) => s.getNextLessonForModel);

  const allCourses = getCourses();

  // Scroll to current active node after layout
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
  }, []);

  const handleNodePress = useCallback(
    (modelId: string, status: NodeStatus) => {
      if (status === 'locked') return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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

  // Track global node index for continuous zigzag across courses
  let globalNodeIndex = 0;

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {allCourses.map((course) => {
        const courseProgress = getCourseProgress(course.id);
        const unlocked = isCourseUnlocked(course.id);
        const completedCount = course.nodes.filter(
          (n) => getModelProgress(n.modelId) >= 1
        ).length;

        return (
          <View key={course.id} style={styles.courseBlock}>
            <CourseSection
              title={course.title}
              subtitle={course.subtitle}
              color={course.color}
              progress={courseProgress}
              isUnlocked={unlocked}
              completedCount={completedCount}
              totalCount={course.nodes.length}
            />

            <View style={styles.nodesContainer}>
              {course.nodes.map((node, nodeIndex) => {
                const model = getModel(node.modelId);
                if (!model) return null;

                const status = getNodeStatus(node.modelId);
                const progress = getModelProgress(node.modelId);
                const offset = getOffset(globalNodeIndex);
                const isActive = status === 'available' || status === 'in_progress';

                // Connector to next node
                const isLast = nodeIndex === course.nodes.length - 1;
                const nextOffset = isLast ? 0 : getOffset(globalNodeIndex + 1);
                const nextStatus = isLast
                  ? 'locked'
                  : getNodeStatus(course.nodes[nodeIndex + 1].modelId);
                const connectorCompleted =
                  status === 'completed' && nextStatus !== 'locked';

                const currentGlobalIndex = globalNodeIndex;
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
                        onPress={() => handleNodePress(node.modelId, status)}
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
          </View>
        );
      })}

      {/* Bottom spacer */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  courseBlock: {
    marginBottom: spacing.lg,
  },
  nodesContainer: {
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  nodeWrapper: {
    alignItems: 'center',
  },
});
