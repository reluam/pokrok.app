'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { getLocalDateString, normalizeDate } from '../utils/dateHelpers'
import { Timeline } from './Timeline'
import { TodayFocusSection } from './TodayFocusSection'

interface WeekViewProps {
  player?: any
  goals?: any[]
  habits?: any[]
  dailySteps?: any[]
  onHabitsUpdate?: (habits: any[]) => void
  onDailyStepsUpdate?: (steps: any[]) => void
  setShowDatePickerModal: (show: boolean) => void
  handleItemClick?: (item: any, type: 'step' | 'habit' | 'goal' | 'stat') => void
  handleHabitToggle?: (habitId: string, date?: string) => Promise<void>
  handleStepToggle?: (stepId: string, completed: boolean) => Promise<void>
  loadingHabits?: Set<string>
  loadingSteps?: Set<string>
  onOpenStepModal?: (date?: string) => void
  onNavigateToHabits?: () => void
  onNavigateToSteps?: () => void
}

export function WeekView({
  player,
  goals = [],
  habits = [],
  dailySteps = [],
  onHabitsUpdate,
  onDailyStepsUpdate,
  setShowDatePickerModal,
  handleItemClick = () => {},
  handleHabitToggle,
  handleStepToggle,
  loadingHabits = new Set(),
  loadingSteps = new Set(),
  onOpenStepModal,
  onNavigateToHabits,
  onNavigateToSteps
}: WeekViewProps) {
  const t = useTranslations()
  const locale = useLocale()
  
  // Get current week start (Monday) - use today's week
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    const weekStart = new Date(d)
    weekStart.setDate(diff)
    weekStart.setHours(0, 0, 0, 0)
    return weekStart
  }
  
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    return getWeekStart(new Date())
  })
  
  // Handle navigation between weeks
  const handlePrevWeek = useCallback(() => {
    const newStart = new Date(currentWeekStart)
    newStart.setDate(newStart.getDate() - 7)
    setCurrentWeekStart(newStart)
    setSelectedDayDate(null) // Reset selection when changing weeks
  }, [currentWeekStart])

  const handleNextWeek = useCallback(() => {
    const newStart = new Date(currentWeekStart)
    newStart.setDate(newStart.getDate() + 7)
    setCurrentWeekStart(newStart)
    setSelectedDayDate(null) // Reset selection when changing weeks
  }, [currentWeekStart])

  // Selected day for detail view (null = show week summary)
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null)
  
  // Update week start when selected day changes (if selecting a day from different week)
  const updateWeekIfNeeded = useCallback((selectedDate: Date | null) => {
    if (selectedDate) {
      const selectedWeekStart = getWeekStart(selectedDate)
      const currentWeekStartStr = getLocalDateString(currentWeekStart)
      const selectedWeekStartStr = getLocalDateString(selectedWeekStart)
      
      if (currentWeekStartStr !== selectedWeekStartStr) {
        setCurrentWeekStart(selectedWeekStart)
      }
    }
  }, [currentWeekStart])
  
  // Update week when selected day changes
  useEffect(() => {
    if (selectedDayDate) {
      updateWeekIfNeeded(selectedDayDate)
    }
  }, [selectedDayDate, updateWeekIfNeeded])
  
  // Handle date click on timeline
  const handleTimelineDateClick = useCallback((date: Date) => {
    const dateStr = getLocalDateString(date)
    const currentSelectedStr = selectedDayDate ? getLocalDateString(selectedDayDate) : null
    
    // If clicking the same day, toggle back to week view
    if (currentSelectedStr === dateStr) {
      setSelectedDayDate(null)
    } else {
      setSelectedDayDate(date)
    }
  }, [selectedDayDate])
  
  // Get week days
  const weekDays = useMemo(() => {
    const days: Date[] = []
    const start = new Date(currentWeekStart)
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      days.push(date)
    }
    return days
  }, [currentWeekStart])
  
  // Filter data based on selected day or week
  const displayData = useMemo(() => {
    if (selectedDayDate) {
      // Show data for selected day only
      const dateStr = getLocalDateString(selectedDayDate)
      const dayOfWeek = selectedDayDate.getDay()
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const dayName = dayNames[dayOfWeek]
      
      // Filter habits for selected day
      const dayHabits = habits.filter(habit => {
        if (habit.always_show) return true
        if (habit.frequency === 'daily') return true
        if (habit.frequency === 'custom' && habit.selected_days && habit.selected_days.includes(dayName)) return true
        return false
      })
      
      // Filter steps for selected day
      const daySteps = dailySteps.filter(step => {
        if (!step.date) return false
        const stepDate = normalizeDate(step.date)
        return stepDate === dateStr
      })
      
      return {
        habits: dayHabits,
        steps: daySteps,
        isWeekView: false
      }
    } else {
      // Show data for entire week
      const weekHabits: any[] = []
      const weekSteps: any[] = []
      
      weekDays.forEach(day => {
        const dateStr = getLocalDateString(day)
        const dayOfWeek = day.getDay()
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        const dayName = dayNames[dayOfWeek]
        
        // Get habits for this day
        const dayHabits = habits.filter(habit => {
          if (habit.always_show) return true
          if (habit.frequency === 'daily') return true
          if (habit.frequency === 'custom' && habit.selected_days && habit.selected_days.includes(dayName)) return true
          return false
        })
        
        // Get steps for this day
        const daySteps = dailySteps.filter(step => {
          if (!step.date) return false
          const stepDate = normalizeDate(step.date)
          return stepDate === dateStr
        })
        
        weekHabits.push(...dayHabits)
        weekSteps.push(...daySteps)
      })
      
      // Remove duplicates
      const uniqueHabits = Array.from(new Map(weekHabits.map(h => [h.id, h])).values())
      const uniqueSteps = Array.from(new Map(weekSteps.map(s => [s.id, s])).values())
      
      return {
        habits: uniqueHabits,
        steps: uniqueSteps,
        isWeekView: true
      }
    }
  }, [selectedDayDate, habits, dailySteps, weekDays])
  
  // Track displayed steps for TodayFocusSection
  const [displayedStepIds, setDisplayedStepIds] = useState<Set<string>>(new Set())
  
  const handleDisplayedStepsChange = useCallback((stepIds: Set<string>) => {
    setDisplayedStepIds(stepIds)
  }, [])
  
  // Get steps that are not displayed in TodayFocusSection
  const additionalSteps = useMemo(() => {
    return displayData.steps.filter(step => !displayedStepIds.has(step.id))
  }, [displayData.steps, displayedStepIds])
  
  return (
    <div className="w-full h-full flex flex-col p-6 space-y-6 overflow-y-auto">
      {/* Timeline */}
      <div className="flex-shrink-0">
        <Timeline
          selectedDate={currentWeekStart}
          viewMode="week"
          onDateClick={handleTimelineDateClick}
          selectedDayDate={selectedDayDate}
          habits={habits}
          dailySteps={dailySteps}
          onPrevClick={handlePrevWeek}
          onNextClick={handleNextWeek}
        />
      </div>
      
      {/* Content based on selection */}
      {selectedDayDate ? (
        // Show day detail view
        <div className="flex-1 space-y-6">
          <TodayFocusSection
            goals={goals}
            dailySteps={displayData.steps}
            habits={displayData.habits}
            selectedDayDate={selectedDayDate}
            handleStepToggle={handleStepToggle || (async () => {})}
            handleHabitToggle={handleHabitToggle}
            handleItemClick={handleItemClick}
            loadingSteps={loadingSteps}
            loadingHabits={loadingHabits}
            player={player}
            todaySteps={additionalSteps}
            onOpenStepModal={onOpenStepModal}
            onDisplayedStepsChange={handleDisplayedStepsChange}
            onNavigateToHabits={onNavigateToHabits}
            onNavigateToSteps={onNavigateToSteps}
          />
        </div>
      ) : (
        // Show week summary view
        <div className="flex-1 space-y-6">
          {/* Week Focus Section - show all week's steps and goals with habits table */}
          {/* Pass all dailySteps, not just week steps - filtering happens in TodayFocusSection */}
          <TodayFocusSection
            goals={goals}
            dailySteps={dailySteps}
            habits={habits}
            selectedDayDate={currentWeekStart} // Use week start as reference
            handleStepToggle={handleStepToggle || (async () => {})}
            handleHabitToggle={handleHabitToggle}
            handleItemClick={handleItemClick}
            loadingSteps={loadingSteps}
            loadingHabits={loadingHabits}
            player={player}
            todaySteps={[]} // Not used in week view
            onOpenStepModal={onOpenStepModal}
            onDisplayedStepsChange={handleDisplayedStepsChange}
            isWeekView={true}
            weekStartDate={currentWeekStart}
            weekSelectedDayDate={selectedDayDate}
            onNavigateToHabits={onNavigateToHabits}
            onNavigateToSteps={onNavigateToSteps}
          />
        </div>
      )}
    </div>
  )
}

