'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { CalendarDays, CalendarRange, Calendar, CalendarCheck } from 'lucide-react'
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
  visibleSections
}: CalendarViewProps) {
  const t = useTranslations()
  const [currentViewType, setCurrentViewType] = useState<CalendarViewType>('day')

  const viewOptions: Array<{ type: CalendarViewType; icon: any; labelKey: string }> = [
    { type: 'day', icon: CalendarDays, labelKey: 'navigation.focusDay' },
    { type: 'week', icon: CalendarRange, labelKey: 'navigation.focusWeek' },
    { type: 'month', icon: Calendar, labelKey: 'navigation.focusMonth' },
    { type: 'year', icon: CalendarCheck, labelKey: 'navigation.focusYear' }
  ]

  return (
    <div className="w-full h-full flex flex-col bg-primary-50">
      {/* View type switcher */}
      <div className="flex-shrink-0 bg-white border-b-2 border-primary-500 py-2">
        <div className="flex items-center justify-start md:justify-center gap-2 overflow-x-auto scrollbar-hide px-4">
          <div className="flex items-center gap-2 min-w-max md:min-w-0">
            {viewOptions.map((option) => {
              const IconComponent = option.icon
              const isActive = currentViewType === option.type
              
              return (
                <button
                  key={option.type}
                  onClick={() => setCurrentViewType(option.type)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-playful-sm transition-all border-2 font-playful text-sm whitespace-nowrap flex-shrink-0 ${
                    isActive
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'bg-white text-black border-primary-300 hover:bg-primary-50'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{t(option.labelKey)}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Render selected view */}
      <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        {currentViewType === 'day' && (
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
        
        {currentViewType === 'week' && (
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
        
        {currentViewType === 'month' && (
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
        
        {currentViewType === 'year' && (
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

