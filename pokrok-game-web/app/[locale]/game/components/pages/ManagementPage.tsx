'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { AspiraceView } from '../views/AspiraceView'
import { HabitsManagementView } from '../views/HabitsManagementView'
import { GoalsManagementView } from '../views/GoalsManagementView'
import { StepsManagementView } from '../views/StepsManagementView'

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
  areas?: any[]
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
  areas = [],
  userId = null,
  player = null
}: ManagementPageProps) {
  const t = useTranslations()
  const [currentManagementProgram, setCurrentManagementProgram] = useState<'aspirace' | 'goals' | 'habits' | 'steps'>('aspirace')

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
        areas={areas}
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

  return (
    <div className="w-full h-full flex flex-col">
      {/* Program Selector */}
      <div className="flex items-center justify-center gap-2 p-4 border-b border-gray-200 bg-white">
        <button
          onClick={() => setCurrentManagementProgram('aspirace')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            currentManagementProgram === 'aspirace'
              ? 'bg-orange-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('game.menu.aspirace')}
        </button>
        <button
          onClick={() => setCurrentManagementProgram('goals')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            currentManagementProgram === 'goals'
              ? 'bg-orange-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('game.menu.goals')}
        </button>
        <button
          onClick={() => setCurrentManagementProgram('habits')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            currentManagementProgram === 'habits'
              ? 'bg-orange-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('game.menu.habits')}
        </button>
        <button
          onClick={() => setCurrentManagementProgram('steps')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            currentManagementProgram === 'steps'
              ? 'bg-orange-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('game.menu.steps')}
        </button>
      </div>
      
      {/* Program Content */}
      <div className="flex-1 overflow-y-auto">
        {currentManagementProgram === 'aspirace' && renderAspiraceContent()}
        {currentManagementProgram === 'goals' && renderGoalsContent()}
        {currentManagementProgram === 'habits' && renderHabitsContent()}
        {currentManagementProgram === 'steps' && renderStepsContent()}
      </div>
    </div>
  )
}

