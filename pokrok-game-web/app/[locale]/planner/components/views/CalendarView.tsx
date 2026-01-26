'use client'

import { UpcomingView } from './UpcomingView'
import { MonthView } from './MonthView'
import { YearView } from './YearView'

type CalendarViewType = 'upcoming' | 'month' | 'year'

interface CalendarViewProps {
  habits?: any[]
  dailySteps?: any[]
  isLoadingSteps?: boolean
  selectedDayDate?: Date
  setSelectedDayDate?: (date: Date) => void
  setShowDatePickerModal?: (show: boolean) => void
  handleItemClick?: (item: any, type: 'step' | 'habit' | 'goal' | 'stat') => void
  handleHabitToggle?: (habitId: string, date?: string) => Promise<void>
  handleStepToggle?: (stepId: string, completed: boolean, completionDate?: string) => Promise<void>
  setSelectedItem?: (item: any) => void
  setSelectedItemType?: (type: 'step' | 'habit' | 'goal' | 'stat' | null) => void
  onOpenStepModal?: (date?: string, step?: any) => void
  onStepDateChange?: (stepId: string, newDate: string) => Promise<void>
  onStepTimeChange?: (stepId: string, minutes: number) => Promise<void>
  onStepImportantChange?: (stepId: string, isImportant: boolean) => Promise<void>
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
  maxUpcomingSteps?: number // Max number of upcoming steps to show
  createNewStepTrigger?: number // Optional trigger for creating new steps in UpcomingView
  onNewStepCreatedForUpcoming?: () => void // Callback when a new step is created in UpcomingView
}

export function CalendarView({
  habits = [],
  dailySteps = [],
  isLoadingSteps = false,
  selectedDayDate,
  setSelectedDayDate,
  setShowDatePickerModal,
  handleItemClick,
  handleHabitToggle,
  handleStepToggle,
  setSelectedItem,
  setSelectedItemType,
  onOpenStepModal,
  onStepDateChange,
  onStepTimeChange,
  onStepImportantChange,
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
  viewType = 'upcoming', // Default to upcoming if not specified
  maxUpcomingSteps = 5, // Default max upcoming steps
  createNewStepTrigger, // Optional trigger for creating new steps in UpcomingView
  onNewStepCreatedForUpcoming // Callback when a new step is created in UpcomingView
}: CalendarViewProps) {
  return (
    <div className="w-full h-full flex flex-col bg-primary-50">
      {/* Render selected view */}
      <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        {viewType === 'upcoming' && (
          <UpcomingView
            habits={habits}
            dailySteps={dailySteps}
            isLoadingSteps={isLoadingSteps}
            areas={areas}
            selectedDayDate={selectedDayDate || new Date()}
            setSelectedDayDate={setSelectedDayDate || (() => {})}
            handleItemClick={handleItemClick || (() => {})}
            handleHabitToggle={handleHabitToggle || (async () => {})}
            handleStepToggle={handleStepToggle || (async () => {})}
            setSelectedItem={setSelectedItem || (() => {})}
            setSelectedItemType={setSelectedItemType || (() => {})}
            onOpenStepModal={onOpenStepModal}
            onStepDateChange={onStepDateChange}
            onStepTimeChange={onStepTimeChange}
            onStepImportantChange={onStepImportantChange}
            loadingHabits={loadingHabits}
            loadingSteps={loadingSteps}
            player={player}
            userId={userId}
            maxUpcomingSteps={maxUpcomingSteps}
            createNewStepTrigger={createNewStepTrigger}
            onNewStepCreatedForUpcoming={onNewStepCreatedForUpcoming}
            onDailyStepsUpdate={onDailyStepsUpdate}
              />
        )}

        {viewType === 'month' && (
              <MonthView
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