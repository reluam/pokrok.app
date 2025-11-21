'use client'

import { DayView } from '../views/DayView'

interface MainPanelDayProps {
  goals?: any[]
  habits: any[]
  dailySteps: any[]
  aspirations: any[]
  dayAspirationBalances: Record<string, any>
  selectedDayDate: Date
  setSelectedDayDate: (date: Date) => void
  setShowDatePickerModal: (show: boolean) => void
  handleItemClick: (item: any, type: 'step' | 'habit' | 'goal' | 'stat') => void
  handleHabitToggle: (habitId: string, date?: string) => Promise<void>
  handleStepToggle: (stepId: string, completed: boolean) => Promise<void>
  setSelectedItem: (item: any) => void
  setSelectedItemType: (type: 'step' | 'habit' | 'goal' | 'stat' | null) => void
  onOpenStepModal?: (date?: string) => void
  loadingHabits: Set<string>
  loadingSteps: Set<string>
  player?: any
  onNavigateToHabits?: () => void
  onNavigateToSteps?: () => void
}

export function MainPanelDay({
  goals = [],
  habits,
  dailySteps,
  aspirations,
  dayAspirationBalances,
  selectedDayDate,
  setSelectedDayDate,
  setShowDatePickerModal,
  handleItemClick,
  handleHabitToggle,
  handleStepToggle,
  setSelectedItem,
  setSelectedItemType,
  onOpenStepModal,
  loadingHabits,
  loadingSteps,
  player,
  onNavigateToHabits,
  onNavigateToSteps
}: MainPanelDayProps) {
  return (
    <DayView
      goals={goals}
      habits={habits}
      dailySteps={dailySteps}
      aspirations={aspirations}
      dayAspirationBalances={dayAspirationBalances}
      selectedDayDate={selectedDayDate}
      setSelectedDayDate={setSelectedDayDate}
      setShowDatePickerModal={setShowDatePickerModal}
      handleItemClick={handleItemClick}
      handleHabitToggle={handleHabitToggle}
      handleStepToggle={handleStepToggle}
      setSelectedItem={setSelectedItem}
      setSelectedItemType={setSelectedItemType}
      onOpenStepModal={onOpenStepModal}
      loadingHabits={loadingHabits}
      loadingSteps={loadingSteps}
      player={player}
      onNavigateToHabits={onNavigateToHabits}
      onNavigateToSteps={onNavigateToSteps}
    />
  )
}

