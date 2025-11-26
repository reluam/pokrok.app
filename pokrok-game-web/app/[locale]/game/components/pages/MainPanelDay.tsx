'use client'

import { UnifiedDayView } from '../views/UnifiedDayView'

interface MainPanelDayProps {
  goals?: any[]
  habits: any[]
  dailySteps: any[]
  selectedDayDate?: Date
  setSelectedDayDate?: (date: Date) => void
  setShowDatePickerModal?: (show: boolean) => void
  handleItemClick: (item: any, type: 'step' | 'habit' | 'goal' | 'stat') => void
  handleHabitToggle: (habitId: string, date?: string) => Promise<void>
  handleStepToggle: (stepId: string, completed: boolean) => Promise<void>
  setSelectedItem?: (item: any) => void
  setSelectedItemType?: (type: 'step' | 'habit' | 'goal' | 'stat' | null) => void
  onOpenStepModal?: (date?: string) => void
  loadingHabits: Set<string>
  loadingSteps: Set<string>
  player?: any
  onNavigateToHabits?: () => void
  onNavigateToSteps?: () => void
  onStepDateChange?: (stepId: string, newDate: string) => Promise<void>
}

export function MainPanelDay({
  goals = [],
  habits,
  dailySteps,
  handleItemClick,
  handleHabitToggle,
  handleStepToggle,
  onOpenStepModal,
  loadingHabits,
  loadingSteps,
  player,
  onNavigateToHabits,
  onNavigateToSteps,
  onStepDateChange
}: MainPanelDayProps) {
  return (
    <UnifiedDayView
      goals={goals}
      habits={habits}
      dailySteps={dailySteps}
      handleItemClick={handleItemClick}
      handleHabitToggle={handleHabitToggle}
      handleStepToggle={handleStepToggle}
      onOpenStepModal={onOpenStepModal}
      loadingHabits={loadingHabits}
      loadingSteps={loadingSteps}
      player={player}
      onNavigateToHabits={onNavigateToHabits}
      onNavigateToSteps={onNavigateToSteps}
      onStepDateChange={onStepDateChange}
    />
  )
}
