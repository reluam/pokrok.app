import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BookOpen, ArrowRight } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StreakBadge } from '@/components/gamification/StreakBadge';
import { XpBar } from '@/components/gamification/XpBar';
import { useUserStore } from '@/stores/user-store';
import { useLessonStore } from '@/stores/lesson-store';
import { getLevelInfo } from '@/lib/xp-engine';
import { CATEGORY_LABELS } from '@/lib/constants';
import { colors, fontSize, spacing } from '@/lib/constants';

export default function HomeScreen() {
  const displayName = useUserStore((s) => s.displayName);
  const stats = useUserStore((s) => s.stats);
  const levelInfo = getLevelInfo(stats.total_xp);

  const getRecommendedModel = useLessonStore((s) => s.getRecommendedModel);
  const getDueReviews = useLessonStore((s) => s.getDueReviews);
  const getModelProgress = useLessonStore((s) => s.getModelProgress);

  const recommended = getRecommendedModel();
  const dueReviews = getDueReviews();

  const getNextLessonForModel = useLessonStore((s) => s.getNextLessonForModel);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Ahoj, {displayName}! 👋</Text>
            <Text style={styles.subGreeting}>Co se dnes naučíš?</Text>
          </View>
          <StreakBadge streak={stats.current_streak} />
        </View>

        {/* XP Bar */}
        <Card>
          <XpBar levelInfo={levelInfo} totalXp={stats.total_xp} />
        </Card>

        {/* Today's Lesson */}
        {recommended && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dnešní lekce</Text>
            <Card
              variant="elevated"
              onPress={() => {
                const lesson = getNextLessonForModel(recommended.id);
                if (lesson) router.push(`/lesson/${lesson.id}`);
              }}
            >
              <View style={styles.recommendedRow}>
                <BookOpen size={32} color={colors.primary} />
                <View style={styles.recommendedInfo}>
                  <Text style={styles.modelName}>{recommended.name}</Text>
                  <Text style={styles.modelNameCz}>{recommended.name_cz}</Text>
                  <Badge
                    label={CATEGORY_LABELS[recommended.category] ?? recommended.category}
                    color={colors.primaryDark + '30'}
                    textColor={colors.primary}
                  />
                </View>
                <ArrowRight size={20} color={colors.textSecondary} />
              </View>
              <ProgressBar
                progress={getModelProgress(recommended.id)}
                height={4}
                style={{ marginTop: spacing.md }}
              />
            </Card>
          </View>
        )}

        {/* Due Reviews */}
        {dueReviews.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              K opakování ({dueReviews.length})
            </Text>
            {dueReviews.slice(0, 3).map(({ model }) => (
              <Card
                key={model.id}
                onPress={() => router.push('/(tabs)/practice')}
                style={styles.reviewCard}
              >
                <View style={styles.reviewRow}>
                  <View>
                    <Text style={styles.reviewName}>{model.name_cz}</Text>
                    <Text style={styles.reviewSub}>{model.name}</Text>
                  </View>
                  <ArrowRight size={16} color={colors.textSecondary} />
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tvůj progres</Text>
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{stats.models_mastered}</Text>
              <Text style={styles.statLabel}>Zvládnuté modely</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{stats.longest_streak}</Text>
              <Text style={styles.statLabel}>Nejdelší streak</Text>
            </Card>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subGreeting: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  section: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  recommendedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  recommendedInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  modelName: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modelNameCz: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  reviewCard: {
    marginTop: 4,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewName: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: fontSize.md,
  },
  reviewSub: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.primary,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
