import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { User, LogOut, Trophy, Flame, Zap, BookOpen } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LevelBadge } from '@/components/gamification/LevelBadge';
import { XpBar } from '@/components/gamification/XpBar';
import { useUserStore } from '@/stores/user-store';
import { getLevelInfo } from '@/lib/xp-engine';
import { colors, fontSize, spacing, borderRadius } from '@/lib/constants';

export default function ProfileScreen() {
  const displayName = useUserStore((s) => s.displayName);
  const email = useUserStore((s) => s.email);
  const stats = useUserStore((s) => s.stats);
  const levelTitle = useUserStore((s) => s.levelTitle);
  const logout = useUserStore((s) => s.logout);
  const levelInfo = getLevelInfo(stats.total_xp);

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <User size={40} color={colors.textSecondary} />
          </View>
          <Text style={styles.name}>{displayName}</Text>
          {email && <Text style={styles.email}>{email}</Text>}
          <LevelBadge level={levelInfo.level} title={levelTitle} size="lg" />
        </View>

        {/* XP Progress */}
        <Card>
          <XpBar levelInfo={levelInfo} totalXp={stats.total_xp} />
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Zap size={24} color={colors.xpGold} />
            <Text style={styles.statValue}>{stats.total_xp}</Text>
            <Text style={styles.statLabel}>Celkem XP</Text>
          </Card>
          <Card style={styles.statCard}>
            <Flame size={24} color={colors.streak} />
            <Text style={styles.statValue}>{stats.current_streak}</Text>
            <Text style={styles.statLabel}>Aktuální streak</Text>
          </Card>
          <Card style={styles.statCard}>
            <BookOpen size={24} color={colors.primary} />
            <Text style={styles.statValue}>{stats.models_mastered}</Text>
            <Text style={styles.statLabel}>Modely</Text>
          </Card>
          <Card style={styles.statCard}>
            <Trophy size={24} color={colors.success} />
            <Text style={styles.statValue}>{stats.longest_streak}</Text>
            <Text style={styles.statLabel}>Max streak</Text>
          </Card>
        </View>

        {/* Achievements Preview */}
        <Card>
          <Text style={styles.achievementTitle}>Ocenění</Text>
          <View style={styles.achievementRow}>
            {levelInfo.level >= 1 && (
              <View style={styles.achievementItem}>
                <Text style={styles.achievementEmoji}>🧠</Text>
                <Text style={styles.achievementLabel}>Začátečník</Text>
              </View>
            )}
            {stats.current_streak >= 3 && (
              <View style={styles.achievementItem}>
                <Text style={styles.achievementEmoji}>🔥</Text>
                <Text style={styles.achievementLabel}>3denní streak</Text>
              </View>
            )}
            {stats.models_mastered >= 1 && (
              <View style={styles.achievementItem}>
                <Text style={styles.achievementEmoji}>📚</Text>
                <Text style={styles.achievementLabel}>První model</Text>
              </View>
            )}
            {stats.total_xp >= 100 && (
              <View style={styles.achievementItem}>
                <Text style={styles.achievementEmoji}>⚡</Text>
                <Text style={styles.achievementLabel}>100 XP</Text>
              </View>
            )}
          </View>
        </Card>

        <Button
          title="Odhlásit se"
          onPress={handleLogout}
          variant="ghost"
          size="lg"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  profileHeader: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  email: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    width: '47%',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  achievementTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  achievementRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  achievementItem: {
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    minWidth: 70,
  },
  achievementEmoji: {
    fontSize: 24,
  },
  achievementLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
