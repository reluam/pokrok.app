'use client'

interface StatisticsViewProps {
  player: any
  goals: any[]
  habits: any[]
  onBack?: () => void
}

export function StatisticsView({ 
  player, 
  goals, 
  habits,
  onBack
}: StatisticsViewProps) {
  const completedGoals = goals.filter(goal => goal.status === 'completed' || goal.completed).length
  const activeGoals = goals.filter(goal => goal.status !== 'completed' && !goal.completed).length
  const totalHabitStreak = habits.reduce((sum, habit) => sum + (habit.streak || habit.current_streak || 0), 0)
  const maxHabitStreak = Math.max(...habits.map(habit => habit.max_streak || habit.maxStreak || 0), 0)
  
  const goalsByCategory = goals.reduce((acc, goal) => {
    acc[goal.category] = (acc[goal.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const habitsByCategory = habits.reduce((acc, habit) => {
    acc[habit.category] = (acc[habit.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Get level and experience from player or use defaults
  const level = player?.level || 1
  const experience = player?.experience || 0
  const completedTasks = 0 // This would need to be passed as prop if needed
  const currentDay = player?.current_day || 1

  const nextLevelXP = level * 100
  const currentLevelXP = (level - 1) * 100
  const progressToNextLevel = ((experience - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900" style={{
          textShadow: '2px 2px 0px #000000',
          color: '#2d5016'
        }}>
          STATISTIKY
        </h1>
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors"
          >
            ← Zpět
          </button>
        )}
      </div>

      {/* Player Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">{level}</div>
          <div className="text-sm opacity-90">Level</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">{experience}</div>
          <div className="text-sm opacity-90">XP</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">{completedTasks}</div>
          <div className="text-sm opacity-90">Dokončené úkoly</div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">{currentDay}</div>
          <div className="text-sm opacity-90">Den hry</div>
        </div>
      </div>

      {/* Level Progress */}
      <div className="bg-white rounded-lg p-4 mb-6 border-2 border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-3">PROGRESS K DALŠÍMU LEVELU</h2>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(progressToNextLevel, 100)}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-sm text-gray-600 mt-2">
          <span>{experience - currentLevelXP} / {nextLevelXP - currentLevelXP} XP</span>
          <span>{Math.round(progressToNextLevel)}%</span>
        </div>
      </div>

      {/* Goals Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">CÍLE</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Celkem cílů:</span>
              <span className="font-bold text-gray-900">{goals.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Dokončené:</span>
              <span className="font-bold text-green-600">{completedGoals}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Aktivní:</span>
              <span className="font-bold text-blue-600">{activeGoals}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Úspěšnost:</span>
              <span className="font-bold text-purple-600">
                {goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">NÁVYKY</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Celkem návyků:</span>
              <span className="font-bold text-gray-900">{habits.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Celkový streak:</span>
              <span className="font-bold text-green-600">{totalHabitStreak}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Nejlepší streak:</span>
              <span className="font-bold text-purple-600">{maxHabitStreak}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Průměrný streak:</span>
              <span className="font-bold text-blue-600">
                {habits.length > 0 ? Math.round(totalHabitStreak / habits.length) : 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">CÍLE PODLE KATEGORIÍ</h2>
          {Object.keys(goalsByCategory).length === 0 ? (
            <p className="text-gray-500 text-sm">Zatím nemáš žádné cíle</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(goalsByCategory).map(([category, count]) => (
                <div key={category} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 capitalize">{category}:</span>
                  <span className="font-bold text-gray-900">{count as number}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">NÁVYKY PODLE KATEGORIÍ</h2>
          {Object.keys(habitsByCategory).length === 0 ? (
            <p className="text-gray-500 text-sm">Zatím nemáš žádné návyky</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(habitsByCategory).map(([category, count]) => (
                <div key={category} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 capitalize">{category}:</span>
                  <span className="font-bold text-gray-900">{count as number}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
