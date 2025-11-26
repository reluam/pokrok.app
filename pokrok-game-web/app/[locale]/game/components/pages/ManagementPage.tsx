'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { AspiraceView } from '../views/AspiraceView'
import { HabitsManagementView } from '../views/HabitsManagementView'
import { GoalsManagementView } from '../views/GoalsManagementView'
import { StepsManagementView } from '../views/StepsManagementView'
import { AutomationManagementView } from '../views/AutomationManagementView'

interface ManagementPageProps {
  goals?: any[]
  habits?: any[]
  dailySteps?: any[]
  aspirations?: any[]
  setAspirations?: (aspirations: any[]) => void
  overviewAspirations?: any[]
  overviewBalances?: Record<string, any>
  isLoadingOverview?: boolean
  showAddAspirationModal?: boolean
  setShowAddAspirationModal?: (show: boolean) => void
  editingAspiration?: any | null
  setEditingAspiration?: (aspiration: any | null) => void
  setOverviewAspirations?: (aspirations: any[]) => void
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
  aspirations = [],
  setAspirations,
  overviewAspirations = [],
  overviewBalances = {},
  isLoadingOverview = false,
  showAddAspirationModal = false,
  setShowAddAspirationModal,
  editingAspiration = null,
  setEditingAspiration,
  setOverviewAspirations,
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
  const [currentManagementProgram, setCurrentManagementProgram] = useState<'aspirace' | 'goals' | 'habits' | 'steps' | 'automations'>('aspirace')

  const renderAspiraceContent = () => {
    return (
      <AspiraceView
        overviewAspirations={overviewAspirations}
        overviewBalances={overviewBalances}
        aspirations={aspirations}
        setAspirations={setAspirations || (() => {})}
        goals={goals}
        habits={habits}
        onGoalsUpdate={onGoalsUpdate}
        onHabitsUpdate={onHabitsUpdate}
        isLoadingOverview={isLoadingOverview}
        showAddAspirationModal={showAddAspirationModal}
        setShowAddAspirationModal={setShowAddAspirationModal || (() => {})}
        editingAspiration={editingAspiration}
        setEditingAspiration={setEditingAspiration || (() => {})}
        setOverviewAspirations={setOverviewAspirations || (() => {})}
        setOverviewBalances={setOverviewBalances || (() => {})}
      />
    )
  }

  const renderGoalsContent = () => {
    return (
      <GoalsManagementView
        goals={goals}
        aspirations={aspirations}
        onGoalsUpdate={onGoalsUpdate}
        setOverviewBalances={setOverviewBalances}
        userId={userId}
        player={player}
      />
    )
  }

  const renderHabitsContent = () => {
    return (
      <HabitsManagementView
        habits={habits}
        aspirations={aspirations}
        onHabitsUpdate={onHabitsUpdate}
        handleHabitToggle={handleHabitToggle}
        loadingHabits={loadingHabits}
        setOverviewBalances={setOverviewBalances}
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
            onClick={() => setCurrentManagementProgram('aspirace')}
            className={`flex-1 text-center px-2 py-1 text-sm font-medium transition-all border-b-2 ${
              currentManagementProgram === 'aspirace'
                ? 'text-orange-600 border-orange-600'
                : 'text-gray-600 border-transparent hover:text-gray-800 hover:border-gray-300'
            }`}
          >
            {t('game.menu.aspirace')}
          </button>
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
        {currentManagementProgram === 'aspirace' && renderAspiraceContent()}
        {currentManagementProgram === 'goals' && renderGoalsContent()}
        {currentManagementProgram === 'habits' && renderHabitsContent()}
        {currentManagementProgram === 'steps' && renderStepsContent()}
        {currentManagementProgram === 'automations' && renderAutomationsContent()}
      </div>
    </div>
  )
}

