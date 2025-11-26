'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { HabitsManagementView } from '../views/HabitsManagementView'
import { GoalsManagementView } from '../views/GoalsManagementView'
import { StepsManagementView } from '../views/StepsManagementView'
import { AutomationManagementView } from '../views/AutomationManagementView'

interface ManagementPageProps {
  goals?: any[]
  habits?: any[]
  dailySteps?: any[]
  setOverviewBalances?: (setter: (prev: Record<string, any>) => Record<string, any>) => void
  onGoalsUpdate?: (goals: any[]) => void
  onHabitsUpdate?: (habits: any[]) => void
  onDailyStepsUpdate?: (steps: any[]) => void
  handleHabitToggle?: (habitId: string, date?: string) => Promise<void>
  loadingHabits?: Set<string>
  userId?: string | null
  player?: any
}

export function ManagementPage({
  goals = [],
  habits = [],
  dailySteps = [],
  setOverviewBalances,
  onGoalsUpdate,
  onHabitsUpdate,
  onDailyStepsUpdate,
  handleHabitToggle,
  loadingHabits = new Set(),
  userId = null,
  player = null
}: ManagementPageProps) {
  const t = useTranslations()
  const [currentManagementProgram, setCurrentManagementProgram] = useState<'goals' | 'habits' | 'steps' | 'automations'>('goals')

  const renderGoalsContent = () => {
    return (
      <GoalsManagementView
        goals={goals}
        onGoalsUpdate={onGoalsUpdate}
        userId={userId}
        player={player}
      />
    )
  }

  const renderHabitsContent = () => {
    return (
      <HabitsManagementView
        habits={habits}
        onHabitsUpdate={onHabitsUpdate}
        handleHabitToggle={handleHabitToggle}
        loadingHabits={loadingHabits}
      />
    )
  }

  const renderStepsContent = () => {
    return (
      <StepsManagementView
        dailySteps={dailySteps}
        goals={goals}
        onDailyStepsUpdate={onDailyStepsUpdate}
        userId={userId}
        player={player}
      />
    )
  }

  const renderAutomationsContent = () => {
    return (
      <AutomationManagementView
        goals={goals}
        userId={userId}
        player={player}
      />
    )
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Program Selector - Link Navigation */}
      <div className="px-4 py-2 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentManagementProgram('goals')}
            className={`flex-1 text-center px-2 py-1 text-sm font-medium transition-all border-b-2 ${
              currentManagementProgram === 'goals'
                ? 'text-orange-600 border-orange-600'
                : 'text-gray-600 border-transparent hover:text-gray-800 hover:border-gray-300'
            }`}
          >
            {t('game.menu.goals')}
          </button>
          <button
            onClick={() => setCurrentManagementProgram('habits')}
            className={`flex-1 text-center px-2 py-1 text-sm font-medium transition-all border-b-2 ${
              currentManagementProgram === 'habits'
                ? 'text-orange-600 border-orange-600'
                : 'text-gray-600 border-transparent hover:text-gray-800 hover:border-gray-300'
            }`}
          >
            {t('game.menu.habits')}
          </button>
          <button
            onClick={() => setCurrentManagementProgram('steps')}
            className={`flex-1 text-center px-2 py-1 text-sm font-medium transition-all border-b-2 ${
              currentManagementProgram === 'steps'
                ? 'text-orange-600 border-orange-600'
                : 'text-gray-600 border-transparent hover:text-gray-800 hover:border-gray-300'
            }`}
          >
            {t('game.menu.steps')}
          </button>
          <button
            onClick={() => setCurrentManagementProgram('automations')}
            className={`flex-1 text-center px-2 py-1 text-sm font-medium transition-all border-b-2 ${
              currentManagementProgram === 'automations'
                ? 'text-orange-600 border-orange-600'
                : 'text-gray-600 border-transparent hover:text-gray-800 hover:border-gray-300'
            }`}
          >
            Automatizace
          </button>
        </div>
      </div>
      
      {/* Program Content */}
      <div className="flex-1 overflow-y-auto">
        {currentManagementProgram === 'goals' && renderGoalsContent()}
        {currentManagementProgram === 'habits' && renderHabitsContent()}
        {currentManagementProgram === 'steps' && renderStepsContent()}
        {currentManagementProgram === 'automations' && renderAutomationsContent()}
      </div>
    </div>
  )
}
