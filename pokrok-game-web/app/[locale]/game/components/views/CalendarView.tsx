'use client'

import { DayView } from './DayView'
import { WeekView } from './WeekView'
import { MonthView } from './MonthView'
import { YearView } from './YearView'

type CalendarViewType = 'day' | 'week' | 'month' | 'year'

interface CalendarViewProps {
  goals?: any[]
  habits?: any[]
  dailySteps?: any[]
  selectedDayDate?: Date
  setSelectedDayDate?: (date: Date) => void
  setShowDatePickerModal?: (show: boolean) => void
  handleItemClick?: (item: any, type: 'step' | 'habit' | 'goal' | 'stat') => void
  handleHabitToggle?: (habitId: string, date?: string) => Promise<void>
  handleStepToggle?: (stepId: string, completed: boolean) => Promise<void>
  setSelectedItem?: (item: any) => void
  setSelectedItemType?: (type: 'step' | 'habit' | 'goal' | 'stat' | null) => void
  onOpenStepModal?: (date?: string) => void
  loadingHabits?: Set<string>
  loadingSteps?: Set<string>
  animatingSteps?: Set<string>
  player?: any
  onNavigateToHabits?: () => void
  onNavigateToSteps?: () => void
  onHabitsUpdate?: (habits: any[]) => void
  onDailyStepsUpdate?: (steps: any[]) => void
  setMainPanelSection?: (section: string) => void
  selectedYear?: number
  setSelectedYear?: (year: number) => void
  areas?: any[]
  userId?: string | null
  visibleSections?: Record<string, boolean>
  viewType?: CalendarViewType // View type passed from parent based on navigation
}

export function CalendarView({
  goals = [],
  habits = [],
  dailySteps = [],
  selectedDayDate,
  setSelectedDayDate,
  setShowDatePickerModal,
  handleItemClick,
  handleHabitToggle,
  handleStepToggle,
  setSelectedItem,
  setSelectedItemType,
  onOpenStepModal,
  loadingHabits = new Set(),
  loadingSteps = new Set(),
  animatingSteps = new Set(),
  player,
  onNavigateToHabits,
  onNavigateToSteps,
  onHabitsUpdate,
  onDailyStepsUpdate,
  setMainPanelSection,
  selectedYear,
  setSelectedYear,
  areas = [],
  userId,
  visibleSections,
  viewType = 'day' // Default to day if not specified
}: CalendarViewProps) {
  return (
    <div className="w-full h-full flex flex-col bg-primary-50">
      {/* Render selected view */}
      <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        {viewType === 'day' && (
          <DayView
            goals={goals}
            habits={habits}
            dailySteps={dailySteps}
            selectedDayDate={selectedDayDate || new Date()}
            setSelectedDayDate={setSelectedDayDate || (() => {})}
            setShowDatePickerModal={setShowDatePickerModal || (() => {})}
            handleItemClick={handleItemClick || (() => {})}
            handleHabitToggle={handleHabitToggle || (async () => {})}
            handleStepToggle={handleStepToggle || (async () => {})}
            setSelectedItem={setSelectedItem || (() => {})}
            setSelectedItemType={setSelectedItemType || (() => {})}
            onOpenStepModal={onOpenStepModal}
            loadingHabits={loadingHabits}
            loadingSteps={loadingSteps}
            player={player}
            onNavigateToHabits={onNavigateToHabits}
            onNavigateToSteps={onNavigateToSteps}
            userId={userId}
          />
        )}
        
        {viewType === 'week' && (
          <WeekView
            player={player}
            goals={goals}
            habits={habits}
            dailySteps={dailySteps}
            onHabitsUpdate={onHabitsUpdate}
            onDailyStepsUpdate={onDailyStepsUpdate}
            setShowDatePickerModal={setShowDatePickerModal || (() => {})}
            handleItemClick={handleItemClick || (() => {})}
            handleHabitToggle={handleHabitToggle || (async () => {})}
            handleStepToggle={handleStepToggle || (async () => {})}
            loadingHabits={loadingHabits}
            loadingSteps={loadingSteps}
            onOpenStepModal={onOpenStepModal}
            onNavigateToHabits={onNavigateToHabits}
            onNavigateToSteps={onNavigateToSteps}
          />
        )}
        
        {viewType === 'month' && (
          <MonthView
            goals={goals}
            habits={habits}
            dailySteps={dailySteps}
            selectedDayDate={selectedDayDate}
            setSelectedDayDate={setSelectedDayDate}
            setMainPanelSection={setMainPanelSection}
            player={player}
            handleHabitToggle={handleHabitToggle}
            handleStepToggle={handleStepToggle}
            handleItemClick={handleItemClick}
            loadingHabits={loadingHabits}
            loadingSteps={loadingSteps}
            animatingSteps={animatingSteps}
          />
        )}
        
        {viewType === 'year' && (
          <YearView
            goals={goals}
            habits={habits}
            dailySteps={dailySteps}
            selectedYear={selectedYear || new Date().getFullYear()}
            setSelectedYear={setSelectedYear || (() => {})}
            handleItemClick={handleItemClick || (() => {})}
            player={player}
            areas={areas}
          />
        )}
      </div>
    </div>
  )
}

