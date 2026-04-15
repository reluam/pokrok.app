import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  User,
  LogOut,
  Trophy,
  Flame,
  Zap,
  BookOpen,
  Target,
  Languages,
} from 'lucide-react-native';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { useUserStore } from '@/stores/user-store';
import { getLevelInfo } from '@/lib/xp-engine';
import { colors, fontSize, spacing, borderRadius } from '@/lib/constants';

export default function ProfileScreen() {
  const displayName = useUserStore((s) => s.displayName);
  const email = useUserStore((s) => s.email);
  const stats = useUserStore((s) => s.stats);
  const logout = useUserStore((s) => s.logout);
  const language = useUserStore((s) => s.language);
  const setLanguage = useUserStore((s) => s.setLanguage);
  const levelInfo = getLevelInfo(stats.total_xp);

  const t = (cs: string, en: string) => (language === 'en' ? en : cs);

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
            <Text style={styles.avatarText}>
              {displayName?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          {email ? <Text style={styles.email}>{email}</Text> : null}
        </View>

        {/* Big level + stats card (moved from Home) */}
        <View style={styles.progressCard}>
          <View style={styles.progressTop}>
            <View style={styles.progressCircleOuter}>
              <View style={styles.progressCircleInner}>
                <Zap size={24} color={colors.xpGold} fill={colors.xpGold} />
                <Text style={styles.progressXp}>{stats.total_xp}</Text>
                <Text style={styles.progressXpLabel}>XP</Text>
              </View>
            </View>
            <View style={styles.progressInfo}>
              <Text style={styles.progressLevel}>Level {levelInfo.level}</Text>
              <Text style={styles.progressTitle}>{levelInfo.title}</Text>
              <ProgressBar
                progress={levelInfo.progress}
                color={colors.xpGold}
                backgroundColor={colors.surface}
                height={12}
                style={{ marginTop: spacing.sm }}
              />
              <Text style={styles.progressXpNeeded}>
                {stats.total_xp} / {levelInfo.xpForNextLevel} XP
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: colors.primaryLight }]}>
                <Trophy size={16} color={colors.primary} />
              </View>
              <Text style={styles.statNumber}>{stats.models_mastered}</Text>
              <Text style={styles.statLabel}>Modely</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: colors.streakLight }]}>
                <Flame size={16} color={colors.streak} />
              </View>
              <Text style={styles.statNumber}>{stats.longest_streak}</Text>
              <Text style={styles.statLabel}>Max streak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: colors.successLight }]}>
                <Target size={16} color={colors.success} />
              </View>
              <Text style={styles.statNumber}>{levelInfo.level}</Text>
              <Text style={styles.statLabel}>Level</Text>
            </View>
          </View>
        </View>

        {/* Detailed stat tiles */}
        <View style={styles.tilesGrid}>
          <View style={styles.tile}>
            <View style={[styles.tileIcon, { backgroundColor: colors.xpGoldLight }]}>
              <Zap size={20} color={colors.xpGold} />
            </View>
            <Text style={styles.tileValue}>{stats.total_xp}</Text>
            <Text style={styles.tileLabel}>Celkem XP</Text>
          </View>
          <View style={styles.tile}>
            <View style={[styles.tileIcon, { backgroundColor: colors.streakLight }]}>
              <Flame size={20} color={colors.streak} />
            </View>
            <Text style={styles.tileValue}>{stats.current_streak}</Text>
            <Text style={styles.tileLabel}>Aktuální streak</Text>
          </View>
          <View style={styles.tile}>
            <View style={[styles.tileIcon, { backgroundColor: colors.primaryLight }]}>
              <BookOpen size={20} color={colors.primary} />
            </View>
            <Text style={styles.tileValue}>{stats.models_mastered}</Text>
            <Text style={styles.tileLabel}>Zvládnuté modely</Text>
          </View>
          <View style={styles.tile}>
            <View style={[styles.tileIcon, { backgroundColor: colors.successLight }]}>
              <Trophy size={20} color={colors.success} />
            </View>
            <Text style={styles.tileValue}>{stats.longest_streak}</Text>
            <Text style={styles.tileLabel}>Nejdelší streak</Text>
          </View>
        </View>

        {/* Language switcher */}
        <View style={styles.langCard}>
          <View style={styles.langHeader}>
            <Languages size={18} color={colors.textPrimary} />
            <Text style={styles.langTitle}>{t('Jazyk', 'Language')}</Text>
          </View>
          <View style={styles.langSegment}>
            <TouchableOpacity
              style={[styles.langOption, language === 'cs' && styles.langOptionActive]}
              onPress={() => setLanguage('cs')}
            >
              <Text style={[styles.langOptionText, language === 'cs' && styles.langOptionTextActive]}>
                Čeština
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langOption, language === 'en' && styles.langOptionActive]}
              onPress={() => setLanguage('en')}
            >
              <Text style={[styles.langOptionText, language === 'en' && styles.langOptionTextActive]}>
                English
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.langHint}>
            {t(
              'EN obsah je zatím dostupný jen u některých lekcí. Pokud chybí, zobrazí se česky.',
              'EN content is only available for some lessons yet. Where missing, Czech is shown.',
            )}
          </Text>
        </View>

        {/* Achievements */}
        <View style={styles.achievementCard}>
          <Text style={styles.achievementTitle}>{t('Ocenění', 'Achievements')}</Text>
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
        </View>

        <Button
          title={t('Odhlásit se', 'Log out')}
          onPress={handleLogout}
          variant="secondary"
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
    paddingBottom: spacing.xxl + spacing.lg,
    gap: spacing.lg,
  },

  // Profile header
  profileHeader: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primaryDark,
  },
  avatarText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '800',
  },
  name: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  email: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },

  // Progress card (same as Home before)
  progressCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xxl,
    padding: spacing.lg,
    gap: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border,
  },
  progressTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  progressCircleOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: colors.xpGold,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.xpGoldLight,
  },
  progressCircleInner: {
    alignItems: 'center',
  },
  progressXp: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  progressXpLabel: {
    fontSize: fontSize.xs,
    color: colors.xpGold,
    fontWeight: '700',
  },
  progressInfo: {
    flex: 1,
  },
  progressLevel: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  progressTitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  progressXpNeeded: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: spacing.md,
    borderTopWidth: 2,
    borderTopColor: colors.borderSubtle,
  },
  statItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: '600',
  },
  statDivider: {
    width: 2,
    height: 40,
    backgroundColor: colors.borderSubtle,
  },

  // Detailed tiles
  tilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  tileIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileValue: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  tileLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: '600',
  },

  // Language switcher
  langCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  langHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  langTitle: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  langSegment: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 4,
    gap: 4,
  },
  langOption: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  langOptionActive: {
    backgroundColor: colors.primary,
  },
  langOptionText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  langOptionTextActive: {
    color: '#fff',
  },
  langHint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    lineHeight: 16,
  },

  // Achievements
  achievementCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
  },
  achievementTitle: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  achievementRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  achievementItem: {
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.sm + 2,
    minWidth: 76,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  achievementEmoji: {
    fontSize: 24,
  },
  achievementLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
});
