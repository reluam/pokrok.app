'use client'

import { useTranslations } from 'next-intl'

interface AchievementsViewProps {
  player: any
  goals?: any[]
  habits?: any[]
  level?: number
  experience?: number
  completedTasks?: number
  onBack?: () => void
}

export function AchievementsView({ 
  player, 
  goals = [], 
  habits = [], 
  level = 1, 
  experience = 0,
  completedTasks = 0,
  onBack 
}: AchievementsViewProps) {
  const t = useTranslations()
  const completedGoals = goals.filter(goal => goal.status === 'completed' || goal.completed).length
  const totalHabitStreak = habits.reduce((sum, habit) => sum + (habit.streak || 0), 0)
  const maxHabitStreak = Math.max(...habits.map(habit => habit.max_streak || habit.maxStreak || 0), 0)

  const achievements = [
    {
      id: 'first_goal',
      title: t('achievements.firstGoal.title'),
      description: t('achievements.firstGoal.description'),
      icon: '🎯',
      unlocked: goals.length >= 1,
      progress: Math.min(goals.length, 1),
      maxProgress: 1
    },
    {
      id: 'first_habit',
      title: t('achievements.firstHabit.title'),
      description: t('achievements.firstHabit.description'),
      icon: '⚡',
      unlocked: habits.length >= 1,
      progress: Math.min(habits.length, 1),
      maxProgress: 1
    },
    {
      id: 'goal_completer',
      title: t('achievements.goalCompleter.title'),
      description: t('achievements.goalCompleter.description'),
      icon: '✅',
      unlocked: completedGoals >= 1,
      progress: Math.min(completedGoals, 1),
      maxProgress: 1
    },
    {
      id: 'habit_master',
      title: t('achievements.habitMaster.title'),
      description: t('achievements.habitMaster.description'),
      icon: '🔥',
      unlocked: maxHabitStreak >= 7,
      progress: Math.min(maxHabitStreak, 7),
      maxProgress: 7
    },
    {
      id: 'task_crusher',
      title: t('achievements.taskCrusher.title'),
      description: t('achievements.taskCrusher.description'),
      icon: '💪',
      unlocked: completedTasks >= 10,
      progress: Math.min(completedTasks, 10),
      maxProgress: 10
    },
    {
      id: 'level_up',
      title: t('achievements.levelUp.title'),
      description: t('achievements.levelUp.description'),
      icon: '📈',
      unlocked: level >= 5,
      progress: Math.min(level, 5),
      maxProgress: 5
    },
    {
      id: 'goal_setter',
      title: t('achievements.goalSetter.title'),
      description: t('achievements.goalSetter.description'),
      icon: '🎯',
      unlocked: goals.length >= 5,
      progress: Math.min(goals.length, 5),
      maxProgress: 5
    },
    {
      id: 'habit_builder',
      title: t('achievements.habitBuilder.title'),
      description: t('achievements.habitBuilder.description'),
      icon: '⚡',
      unlocked: habits.length >= 5,
      progress: Math.min(habits.length, 5),
      maxProgress: 5
    },
    {
      id: 'streak_legend',
      title: t('achievements.streakLegend.title'),
      description: t('achievements.streakLegend.description'),
      icon: '👑',
      unlocked: maxHabitStreak >= 30,
      progress: Math.min(maxHabitStreak, 30),
      maxProgress: 30
    },
    {
      id: 'xp_collector',
      title: t('achievements.xpCollector.title'),
      description: t('achievements.xpCollector.description'),
      icon: '💎',
      unlocked: experience >= 1000,
      progress: Math.min(experience, 1000),
      maxProgress: 1000
    }
  ]

  const unlockedAchievements = achievements.filter(achievement => achievement.unlocked)
  const lockedAchievements = achievements.filter(achievement => !achievement.unlocked)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900" style={{
          textShadow: '2px 2px 0px #000000',
          color: '#2d5016'
        }}>
          {t('achievements.title')}
        </h1>
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors"
          >
            ← {t('common.back')}
          </button>
        )}
      </div>

      {/* Achievement Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">{unlockedAchievements.length}</div>
          <div className="text-sm opacity-90">{t('achievements.unlocked')}</div>
        </div>
        <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">{lockedAchievements.length}</div>
          <div className="text-sm opacity-90">{t('achievements.locked')}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">{Math.round((unlockedAchievements.length / achievements.length) * 100)}%</div>
          <div className="text-sm opacity-90">Procent dokončení</div>
        </div>
      </div>

      {/* Unlocked Achievements */}
      {unlockedAchievements.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">{t('achievements.unlocked')} {t('achievements.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unlockedAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-500 rounded-lg p-4"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div>
                    <h3 className="font-bold text-gray-900">{achievement.title}</h3>
                    <p className="text-sm text-gray-600">{achievement.description}</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: '100%' }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {achievement.progress} / {achievement.maxProgress}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked Achievements */}
      {lockedAchievements.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">{t('achievements.locked')} {t('achievements.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lockedAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="bg-gray-100 border-2 border-gray-300 rounded-lg p-4 opacity-60"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-2xl grayscale">{achievement.icon}</div>
                  <div>
                    <h3 className="font-bold text-gray-700">{achievement.title}</h3>
                    <p className="text-sm text-gray-500">{achievement.description}</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gray-400 h-2 rounded-full"
                    style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {achievement.progress} / {achievement.maxProgress}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {achievements.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg mb-4">Zatím nemáš žádné úspěchy</p>
          <p className="text-sm">Začni plnit cíle a budovat návyky!</p>
        </div>
      )}
    </div>
  )
}
