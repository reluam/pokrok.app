import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import {
  Check,
  Lock,
  Play,
  ChevronRight,
  Lightbulb,
  Atom,
  Brain,
  TrendingUp,
  Network,
  BarChart3,
  AlertTriangle,
  Users,
  Filter,
  Dice1,
  Clock,
  User,
  Eye,
  Activity,
  Wind,
  Zap,
  Compass,
  Trophy,
  BookOpen,
} from 'lucide-react-native';
import {
  colors,
  fontSize,
  spacing,
  borderRadius,
} from '@/lib/constants';
import type { Course, Track, MentalModel } from '@/types';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Lightbulb,
  Atom,
  Brain,
  TrendingUp,
  Network,
  BarChart3,
  AlertTriangle,
  Users,
  Filter,
  Dice1,
  Clock,
  User,
  Eye,
  Activity,
  Wind,
  Zap,
  Compass,
  Trophy,
  BookOpen,
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const PAGE_WIDTH = SCREEN_WIDTH;
const HORIZONTAL_PADDING = spacing.lg;

export interface CourseLessonRow {
  modelId: string;
  name: string;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
}

export interface ContinueLearningItem {
  course: Course;
  track: Track | undefined;
  progress: number; // 0..1
  level: number; // current level number (e.g. how many models completed + 1)
  completedModels: number;
  totalModels: number;
  lessons: CourseLessonRow[];
  nextModel: MentalModel | null;
}

interface Props {
  items: ContinueLearningItem[];
  onStart: (modelId: string) => void;
  language: 'cs' | 'en';
}

/**
 * Brilliant-style horizontal pager for in-progress courses.
 *
 * Each page shows:
 *  - Course title (centered, bold)
 *  - LEVEL N badge
 *  - Big circular icon as the course "hero"
 *  - Pagination dots (one per course)
 *  - White card listing concepts in this course with status checkmarks
 *  - Big primary CTA button to continue
 */
export function ContinueLearningCard({ items, onStart, language }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);

  const t = (cs: string, en: string) => (language === 'en' ? en : cs);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const next = Math.round(x / PAGE_WIDTH);
    if (next !== page) setPage(next);
  };

  const locTitle = (c: { title: string; title_en?: string }) =>
    language === 'en' && c.title_en ? c.title_en : c.title;

  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={PAGE_WIDTH}
        decelerationRate="fast"
        onMomentumScrollEnd={onMomentumEnd}
      >
        {items.map((item) => {
          const accent = item.track?.color ?? colors.primary;
          return (
            <View key={item.course.id} style={[styles.page, { width: PAGE_WIDTH }]}>
              {/* Track label (small uppercase) */}
              {item.track && (
                <Text style={[styles.trackLabel, { color: accent }]}>
                  {locTitle(item.track).toUpperCase()}
                </Text>
              )}

              {/* Course title */}
              <Text style={styles.courseTitle} numberOfLines={2}>
                {locTitle(item.course)}
              </Text>

              {/* LEVEL badge */}
              <Text style={[styles.levelLabel, { color: accent }]}>
                {t('LEVEL', 'LEVEL')} {item.level}
              </Text>

              {/* Hero icon */}
              <View
                style={[
                  styles.heroIconWrap,
                  { backgroundColor: accent + '18', borderColor: accent },
                ]}
              >
                {(() => {
                  const Icon = ICON_MAP[item.course.icon_name] ?? BookOpen;
                  return <Icon size={64} color={accent} strokeWidth={2.2} />;
                })()}
              </View>

              {/* Pagination dots */}
              {items.length > 1 && (
                <View style={styles.dotsRow}>
                  {items.map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        i === page && [styles.dotActive, { backgroundColor: accent }],
                      ]}
                    />
                  ))}
                </View>
              )}

              {/* Lessons card */}
              <View style={styles.lessonsCard}>
                {item.lessons.slice(0, 4).map((lesson) => {
                  const done = lesson.status === 'completed';
                  const locked = lesson.status === 'locked';
                  return (
                    <View key={lesson.modelId} style={styles.lessonRow}>
                      <View
                        style={[
                          styles.lessonStatusIcon,
                          done && { backgroundColor: accent },
                          locked && styles.lessonStatusLocked,
                        ]}
                      >
                        {done ? (
                          <Check size={16} color="#fff" strokeWidth={3} />
                        ) : locked ? (
                          <Lock size={14} color={colors.textMuted} />
                        ) : (
                          <Play size={12} color={accent} fill={accent} />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.lessonName,
                          locked && { color: colors.textMuted },
                        ]}
                        numberOfLines={1}
                      >
                        {lesson.name}
                      </Text>
                    </View>
                  );
                })}
                {item.lessons.length > 4 && (
                  <Text style={styles.moreText}>
                    +{item.lessons.length - 4} {t('dalších', 'more')}
                  </Text>
                )}
              </View>

              {/* CTA button */}
              {item.nextModel && (
                <TouchableOpacity
                  style={[styles.cta, { backgroundColor: accent }]}
                  activeOpacity={0.85}
                  onPress={() => onStart(item.nextModel!.id)}
                >
                  <Text style={styles.ctaText}>
                    {t('Pokračovat', 'Continue')}
                  </Text>
                  <ChevronRight size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: -HORIZONTAL_PADDING, // bleed to edges of parent (which has lg padding)
  },
  page: {
    paddingHorizontal: HORIZONTAL_PADDING,
    alignItems: 'center',
    gap: spacing.sm,
  },
  trackLabel: {
    fontSize: fontSize.xs,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: spacing.xs,
  },
  courseTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '900',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: fontSize.xxl * 1.1,
    paddingHorizontal: spacing.md,
  },
  levelLabel: {
    fontSize: fontSize.sm,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: spacing.xs,
  },
  heroIconWrap: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    marginVertical: spacing.md,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderLight,
  },
  dotActive: {
    width: 22,
  },
  lessonsCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.xxl,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 2,
    borderColor: colors.border,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  lessonStatusIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonStatusLocked: {
    backgroundColor: colors.surface,
    opacity: 0.6,
  },
  lessonName: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  moreText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    paddingTop: spacing.xs,
  },
  cta: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md + 2,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  ctaText: {
    color: '#fff',
    fontSize: fontSize.lg,
    fontWeight: '800',
  },
});
