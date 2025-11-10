'use client'

import { DayView } from '../views/DayView'

interface MainPanelDayProps {
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
  loadingHabits: Set<string>
  loadingSteps: Set<string>
  player?: any
}

export function MainPanelDay({
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
  loadingHabits,
  loadingSteps,
  player
}: MainPanelDayProps) {
  return (
    <DayView
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
      loadingHabits={loadingHabits}
      loadingSteps={loadingSteps}
      player={player}
    />
  )
}

