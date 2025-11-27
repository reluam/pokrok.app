'use client'

import { useMemo, useEffect, useRef, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { getLocalDateString, normalizeDate } from '../utils/dateHelpers'
import { Check, Target, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react'
import { getIconEmoji } from '@/lib/icon-utils'

interface TodayFocusSectionProps {
  goals: any[]
  dailySteps: any[]
  habits?: any[]
  selectedDayDate: Date
  handleStepToggle: (stepId: string, completed: boolean) => Promise<void>
  handleHabitToggle?: (habitId: string, date?: string) => Promise<void>
  handleItemClick: (item: any, type: 'step' | 'habit' | 'goal' | 'stat') => void
  loadingSteps: Set<string>
  loadingHabits?: Set<string>
  player?: any
  todaySteps?: any[]
  onOpenStepModal?: (date?: string) => void
  onDisplayedStepsChange?: (stepIds: Set<string>) => void
  isWeekView?: boolean // If true, show all habits from the week, not just one day
  weekStartDate?: Date // For week view - start of the week
  weekSelectedDayDate?: Date | null // For week view - selected day for highlighting
  onNavigateToHabits?: () => void
  onNavigateToSteps?: () => void
  onStepDateChange?: (stepId: string, newDate: string) => Promise<void>
  onStepTimeChange?: (stepId: string, minutes: number) => Promise<void>
}

export function TodayFocusSection({
  goals,
  dailySteps,
  habits = [],
  selectedDayDate,
  handleStepToggle,
  handleHabitToggle,
  handleItemClick,
  loadingSteps,
  loadingHabits = new Set(),
  player,
  todaySteps = [],
  onOpenStepModal,
  onDisplayedStepsChange,
  isWeekView = false,
  weekStartDate,
  weekSelectedDayDate = null,
  onNavigateToHabits,
  onNavigateToSteps,
  onStepDateChange,
  onStepTimeChange
}: TodayFocusSectionProps) {
  const t = useTranslations()
  const locale = useLocale()
  const localeCode = locale === 'cs' ? 'cs-CZ' : 'en-US'
  
  // State for showing/hiding completed habits in day view
  const [showCompletedHabits, setShowCompletedHabits] = useState(false)
  
  // State for showing/hiding completed steps in week view
  const [showCompletedSteps, setShowCompletedSteps] = useState(false)
  
  // State for date picker
  const [datePickerStep, setDatePickerStep] = useState<any | null>(null)
  const [datePickerPosition, setDatePickerPosition] = useState<{ top: number; left: number } | null>(null)
  const [datePickerMonth, setDatePickerMonth] = useState<Date>(new Date())
  
  // State for time picker
  const [timePickerStep, setTimePickerStep] = useState<any | null>(null)
  const [timePickerPosition, setTimePickerPosition] = useState<{ top: number; left: number } | null>(null)
  
  // Open date picker for a step
  const openDatePicker = (e: React.MouseEvent, step: any) => {
    e.stopPropagation()
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    // Position picker so it doesn't go off screen
    const top = Math.min(rect.bottom + 5, window.innerHeight - 400)
    const left = Math.min(rect.left, window.innerWidth - 320)
    setDatePickerPosition({ top, left })
    setDatePickerStep(step)
    if (step.date) {
      setDatePickerMonth(new Date(normalizeDate(step.date)))
    } else {
      setDatePickerMonth(new Date())
    }
  }
  
  // Handle date selection
  const handleDateSelect = async (date: Date) => {
    if (datePickerStep && onStepDateChange) {
      const dateStr = getLocalDateString(date)
      await onStepDateChange(datePickerStep.id, dateStr)
    }
    setDatePickerStep(null)
    setDatePickerPosition(null)
  }
  
  // Open time picker for a step
  const openTimePicker = (e: React.MouseEvent, step: any) => {
    e.stopPropagation()
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    const top = Math.min(rect.bottom + 5, window.innerHeight - 200)
    const left = Math.min(rect.left, window.innerWidth - 180)
    setTimePickerPosition({ top, left })
    setTimePickerStep(step)
  }
  
  // Handle time selection
  const handleTimeSelect = async (minutes: number) => {
    if (timePickerStep && onStepTimeChange) {
      await onStepTimeChange(timePickerStep.id, minutes)
    }
    setTimePickerStep(null)
    setTimePickerPosition(null)
  }
  
  const displayDate = new Date(selectedDayDate)
  displayDate.setHours(0, 0, 0, 0)
  const displayDateStr = getLocalDateString(displayDate)
  
  // Reset showCompletedHabits when date changes
  useEffect(() => {
    setShowCompletedHabits(false)
  }, [displayDateStr])
  
  // Get week days for week view
  const weekDays = useMemo(() => {
    if (!isWeekView || !weekStartDate) return []
    const days: Date[] = []
    const start = new Date(weekStartDate)
    start.setHours(0, 0, 0, 0)
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      days.push(date)
    }
    return days
  }, [isWeekView, weekStartDate])
  
  // Get week start and end dates for filtering
  const weekStart = useMemo(() => {
    if (!isWeekView || !weekStartDate) return null
    const start = new Date(weekStartDate)
    start.setHours(0, 0, 0, 0)
    return start
  }, [isWeekView, weekStartDate])
  
  const weekEnd = useMemo(() => {
    if (!weekStart) return null
    const end = new Date(weekStart)
    end.setDate(end.getDate() + 6)
    end.setHours(0, 0, 0, 0)
    return end
  }, [weekStart])
  
  const dayNamesShort = [
    t('calendar.daysShort.sunday'),
    t('calendar.daysShort.monday'),
    t('calendar.daysShort.tuesday'),
    t('calendar.daysShort.wednesday'),
    t('calendar.daysShort.thursday'),
    t('calendar.daysShort.friday'),
    t('calendar.daysShort.saturday')
  ]
  
  // Filter habits for selected day or week
  const dayOfWeek = displayDate.getDay()
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const dayName = dayNames[dayOfWeek]
  
  const todaysHabits = useMemo(() => {
    // If week view, habits are already filtered in WeekView, so just use them
    if (isWeekView) {
      return habits
    }
    
    // Otherwise, filter for selected day
    return habits.filter(habit => {
      if (habit.always_show) return true
      if (habit.frequency === 'daily') return true
      if (habit.frequency === 'custom' && habit.selected_days && habit.selected_days.includes(dayName)) return true
      return false
    })
  }, [habits, dayName, isWeekView])
  
  // Get active focus goals
  const activeFocusGoals = useMemo(() => {
    return goals
      .filter(g => g.focus_status === 'active_focus')
      .sort((a, b) => (a.focus_order || 999) - (b.focus_order || 999))
  }, [goals])
  
  // Get steps from active focus goals for today (with goals)
  const focusSteps = useMemo(() => {
    const activeFocusGoalIds = new Set(activeFocusGoals.map(g => g.id))
    
    return dailySteps
      .filter(step => {
        if (!step.date) return false
        
        // In week view, show all steps from the current week (including completed)
        if (isWeekView && weekStart && weekEnd) {
          const stepDate = normalizeDate(step.date)
          const stepDateObj = new Date(stepDate)
          stepDateObj.setHours(0, 0, 0, 0)
          
          // Check if step is within the current week (inclusive)
          const isInWeek = stepDateObj.getTime() >= weekStart.getTime() && stepDateObj.getTime() <= weekEnd.getTime()
          
          // Check if step belongs to an active focus goal
          const belongsToActiveGoal = step.goal_id && activeFocusGoalIds.has(step.goal_id)
          
          return isInWeek && belongsToActiveGoal
        }
        
        // In day view, filter by exact date only
        const stepDate = normalizeDate(step.date)
        const stepDateObj = new Date(stepDate)
        stepDateObj.setHours(0, 0, 0, 0)
        
        // Only include steps for the selected day (not overdue, not future)
        const isSelectedDay = stepDateObj.getTime() === displayDate.getTime()
        
        // Check if step belongs to an active focus goal
        const belongsToActiveGoal = step.goal_id && activeFocusGoalIds.has(step.goal_id)
        
        return isSelectedDay && belongsToActiveGoal
      })
      .sort((a, b) => {
        // Sort by goal focus_order first, then by date
        const goalA = activeFocusGoals.find(g => g.id === a.goal_id)
        const goalB = activeFocusGoals.find(g => g.id === b.goal_id)
        const orderA = goalA?.focus_order || 999
        const orderB = goalB?.focus_order || 999
        
        if (orderA !== orderB) {
          return orderA - orderB
        }
        
        // If same goal, sort by date (overdue first)
        const dateA = new Date(normalizeDate(a.date))
        const dateB = new Date(normalizeDate(b.date))
        return dateA.getTime() - dateB.getTime()
      })
  }, [dailySteps, activeFocusGoals, displayDate, isWeekView, weekStart, weekEnd])
  
  // Get all today's steps (including from active focus goals), sorted by priority
  // Combine focusSteps and other steps
  const allTodaysSteps = useMemo(() => {
    // Combine focusSteps and steps without goals
    const activeFocusGoalIds = new Set(activeFocusGoals.map(g => g.id))
    
    const stepsWithoutGoals = dailySteps
      .filter(step => {
        if (!step.date) return false
        
        // In week view, show all steps from the current week (including completed)
        if (isWeekView && weekStart && weekEnd) {
          const stepDate = normalizeDate(step.date)
          const stepDateObj = new Date(stepDate)
          stepDateObj.setHours(0, 0, 0, 0)
          
          // Check if step is within the current week (inclusive)
          const isInWeek = stepDateObj.getTime() >= weekStart.getTime() && stepDateObj.getTime() <= weekEnd.getTime()
          
          // Check if step doesn't belong to any goal (or goal is not in active focus)
          const hasNoGoal = !step.goal_id || !activeFocusGoalIds.has(step.goal_id)
          
          return isInWeek && hasNoGoal
        }
        
        // In day view, filter by date (including completed)
        const stepDate = normalizeDate(step.date)
        const stepDateObj = new Date(stepDate)
        stepDateObj.setHours(0, 0, 0, 0)
        
        // Only include steps from today (not overdue, not future)
        const isToday = stepDateObj.getTime() === displayDate.getTime()
        
        // Check if step doesn't belong to any goal (or goal is not in active focus)
        const hasNoGoal = !step.goal_id || !activeFocusGoalIds.has(step.goal_id)
        
        return isToday && hasNoGoal
      })
    
    // Combine all steps
    const allSteps = [...focusSteps, ...stepsWithoutGoals]
    
    return allSteps.sort((a, b) => {
      // First: completed steps go to bottom
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1
      }
      
      // In week view: sort by date first, then by importance
      if (isWeekView) {
        const dateA = new Date(normalizeDate(a.date))
        const dateB = new Date(normalizeDate(b.date))
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime()
        }
        // Same date - sort by importance
        const aPriority = (a.is_important ? 2 : 0) + (a.is_urgent ? 1 : 0)
        const bPriority = (b.is_important ? 2 : 0) + (b.is_urgent ? 1 : 0)
        return bPriority - aPriority
      }
      
      // In day view: sort by goal focus_order first (if has goal)
      const goalA = goals.find(g => g.id === a.goal_id)
      const goalB = goals.find(g => g.id === b.goal_id)
      const orderA = goalA?.focus_order || 999
      const orderB = goalB?.focus_order || 999
      
      if (orderA !== orderB) {
        return orderA - orderB
      }
      
      // Then by priority: important + urgent > urgent > important > others
        const aPriority = (a.is_important ? 2 : 0) + (a.is_urgent ? 1 : 0)
        const bPriority = (b.is_important ? 2 : 0) + (b.is_urgent ? 1 : 0)
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority
        }
        
        // If same priority, sort by date
        const dateA = new Date(normalizeDate(a.date))
        const dateB = new Date(normalizeDate(b.date))
        return dateA.getTime() - dateB.getTime()
      })
  }, [focusSteps, dailySteps, activeFocusGoals, displayDate, isWeekView, weekStart, weekEnd, goals])
  
  // Keep todaysSteps for backward compatibility (used in displayedStepIds)
  const todaysSteps = allTodaysSteps
  
  // Calculate max width for habits column based on longest habit name
  const maxHabitWidth = useMemo(() => {
    if (todaysHabits.length === 0) return 180
    // Estimate width based on text length (rough approximation)
    const maxLength = Math.max(...todaysHabits.map(h => h.name?.length || 0))
    // Add padding, icon space, and streak indicator (rough estimate: ~120px base + ~7px per character)
    return Math.max(180, 120 + (maxLength * 7))
  }, [todaysHabits])
  
  // Notify parent about which steps are displayed in this section
  const displayedStepIds = useMemo(() => {
    const ids = new Set<string>()
    allTodaysSteps.forEach(step => ids.add(step.id))
    return ids
  }, [allTodaysSteps])
  
  const prevDisplayedStepIdsRef = useRef<Set<string>>(new Set())
  
  useEffect(() => {
    if (onDisplayedStepsChange) {
      // Only call callback if the set of IDs actually changed
      const prevIds = prevDisplayedStepIdsRef.current
      const prevIdsArray = Array.from(prevIds).sort()
      const currentIdsArray = Array.from(displayedStepIds).sort()
      
      if (prevIdsArray.length !== currentIdsArray.length || 
          prevIdsArray.some((id, i) => id !== currentIdsArray[i])) {
        prevDisplayedStepIdsRef.current = new Set(displayedStepIds)
        onDisplayedStepsChange(displayedStepIds)
      }
    }
  }, [displayedStepIds, onDisplayedStepsChange])
  
  // Helper functions for week view habits table
  const isHabitScheduledForDay = (habit: any, day: Date): boolean => {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayName = dayNames[day.getDay()]
    
    if (habit.always_show) return true
    if (habit.frequency === 'daily') return true
    if (habit.frequency === 'custom' && habit.selected_days && habit.selected_days.includes(dayName)) return true
    return false
  }
  
  const isHabitCompletedForDay = (habit: any, day: Date): boolean => {
    const dateStr = getLocalDateString(day)
    return habit.habit_completions && habit.habit_completions[dateStr] === true
  }
  
  // Get week habits for week view - MUST be before any early returns
  const weekHabits = useMemo(() => {
    if (!isWeekView) return []
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    
    return habits.filter(habit => {
      if (habit.always_show) return true
      if (habit.frequency === 'daily') return true
      if (habit.frequency === 'custom' && habit.selected_days) {
        return weekDays.some(day => {
          const dayName = dayNames[day.getDay()]
          return habit.selected_days?.includes(dayName)
        })
      }
      return false
    })
  }, [isWeekView, habits, weekDays])
  
  // Only show empty state if there are no steps AND no habits
  // Don't hide habits just because there are no steps
  const hasHabits = isWeekView ? weekHabits.length > 0 : todaysHabits.length > 0
  if (allTodaysSteps.length === 0 && !hasHabits) {
    return (
      <div className="bg-white rounded-xl p-6 border border-orange-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-bold text-orange-800">
              {isWeekView ? t('focus.weeklyFocus') : t('focus.dailyFocus')}
            </h3>
          </div>
          {onOpenStepModal && (
            <button
              onClick={() => {
                const dateToUse = isWeekView && weekSelectedDayDate 
                  ? getLocalDateString(weekSelectedDayDate)
                  : displayDateStr
                onOpenStepModal(dateToUse)
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors border border-orange-200"
              title={t('focus.addStep')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              {t('focus.addStep')}
            </button>
          )}
        </div>
        <div className="text-center py-8">
          <p className="mb-2 text-gray-500">{t('focus.noSteps')}</p>
          <p className="text-sm text-gray-400 mb-6">{t('focus.allStepsCompleted')}</p>
          
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            {onOpenStepModal && (
              <button
                onClick={() => {
                  const dateToUse = isWeekView && weekSelectedDayDate 
                    ? getLocalDateString(weekSelectedDayDate)
                    : displayDateStr
                  onOpenStepModal(dateToUse)
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors border border-orange-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                {t('focus.addStep')}
              </button>
            )}
            {!onOpenStepModal && onNavigateToSteps && (
              <button
                onClick={() => onNavigateToSteps()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors border border-orange-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                {t('focus.addStep')}
              </button>
            )}
            {onNavigateToHabits && (
              <button
                onClick={() => onNavigateToHabits()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors border border-orange-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Přidat návyk
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-6">
        {/* Left: Today's Focus Box - Habits and Today's Steps */}
        <div className="bg-white rounded-xl p-6 border border-orange-200 shadow-sm flex-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-bold text-orange-800">
                {isWeekView ? t('focus.weeklyFocus') : t('focus.dailyFocus')}
              </h3>
            </div>
            {onOpenStepModal && (
              <button
                onClick={() => {
                  // For week view, use selected day if available, otherwise use today
                  const dateToUse = isWeekView && weekSelectedDayDate 
                    ? getLocalDateString(weekSelectedDayDate)
                    : displayDateStr
                  onOpenStepModal(dateToUse)
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors border border-orange-200"
                title={t('focus.addStep')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                {t('focus.addStep')}
              </button>
            )}
          </div>
          
          {/* Two Column Layout - Mobile/Tablet: stacked, Large Desktop: side by side */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column: Habits - Week view shows compact table on desktop, vertical day layout on mobile */}
            {isWeekView && weekStartDate && (
              <div className="flex-shrink-0 lg:border-r lg:border-gray-200 lg:pr-6 pb-6 lg:pb-0 border-b lg:border-b-0 w-full lg:w-auto" style={{ minWidth: '200px' }}>
                <h4 
                  onClick={() => onNavigateToHabits?.()}
                  className={`text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 ${onNavigateToHabits ? 'cursor-pointer hover:text-orange-600 transition-colors' : ''}`}
                >
                  {t('navigation.habits')}
                </h4>
                {weekHabits.length > 0 ? (
                  <>
                    {/* Mobile/Tablet: Compact colored squares */}
                    <div className="lg:hidden">
                      {/* Header with day names */}
                      <div className="flex items-center gap-1 mb-2 pl-[100px]">
                          {weekDays.map((day) => {
                            const dateStr = getLocalDateString(day)
                            const isSelected = weekSelectedDayDate && getLocalDateString(weekSelectedDayDate) === dateStr
                            const dayName = dayNamesShort[day.getDay()]
                          const isToday = day.toDateString() === new Date().toDateString()
                            
                            return (
                            <div
                                key={dateStr}
                              className={`w-6 h-6 flex flex-col items-center justify-center text-[8px] rounded ${
                                isSelected 
                                  ? 'bg-orange-500 text-white font-bold' 
                                  : isToday 
                                    ? 'bg-orange-100 text-orange-700 font-semibold'
                                    : 'text-gray-400'
                              }`}
                            >
                              <span className="uppercase leading-none">{dayName}</span>
                              <span className="text-[7px] leading-none">{day.getDate()}</span>
                                </div>
                          )
                        })}
                      </div>
                      
                      {/* Habits with colored squares */}
                      <div className="space-y-1.5">
                        {weekHabits.map((habit) => (
                          <div key={habit.id} className="flex items-center gap-1">
                              <button
                                onClick={() => handleItemClick(habit, 'habit')}
                              className="w-[96px] text-left text-[10px] font-medium text-gray-600 hover:text-orange-600 transition-colors truncate flex-shrink-0"
                                title={habit.name}
                              >
                                {habit.name}
                              </button>
                            <div className="flex gap-0.5">
                            {weekDays.map((day) => {
                              const dateStr = getLocalDateString(day)
                              const isScheduled = isHabitScheduledForDay(habit, day)
                              const isCompleted = isHabitCompletedForDay(habit, day)
                              const isSelected = weekSelectedDayDate && getLocalDateString(weekSelectedDayDate) === dateStr
                                const isLoading = loadingHabits.has(habit.id)
                              const today = new Date()
                              today.setHours(0, 0, 0, 0)
                              const isFuture = day > today
                              
                              return (
                                  <button
                                  key={dateStr}
                                    onClick={() => {
                                      if (handleHabitToggle && !isLoading && !isFuture) {
                                        handleHabitToggle(habit.id, dateStr)
                                      }
                                    }}
                                    disabled={isLoading}
                                    className={`w-6 h-6 rounded flex items-center justify-center transition-all ${
                                      isCompleted
                                        ? 'bg-orange-500 hover:bg-orange-600 cursor-pointer shadow-sm'
                                        : !isScheduled 
                                          ? `bg-gray-100 ${isFuture ? 'cursor-not-allowed' : 'hover:bg-orange-200 cursor-pointer'}` 
                                          : `bg-gray-200 ${isFuture ? 'cursor-not-allowed' : 'hover:bg-orange-200 cursor-pointer'}`
                                    } ${isSelected ? 'ring-2 ring-orange-400 ring-offset-1' : ''}`}
                                  >
                                    {isLoading ? (
                                      <svg className="animate-spin h-2.5 w-2.5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                    ) : isCompleted ? (
                                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                    ) : null}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Desktop: Compact colored squares layout */}
                    <div className="hidden lg:block overflow-y-auto max-h-[500px]">
                      {/* Header with day names - aligned with checkboxes */}
                      <div className="flex items-center gap-1 mb-1">
                        <div className="w-[100px] flex-shrink-0" /> {/* Spacer for habit name */}
                        {weekDays.map((day) => {
                          const dateStr = getLocalDateString(day)
                          const isSelected = weekSelectedDayDate && getLocalDateString(weekSelectedDayDate) === dateStr
                          const dayName = dayNamesShort[day.getDay()]
                          const isToday = day.toDateString() === new Date().toDateString()
                          
                          return (
                            <div
                              key={dateStr}
                              className={`w-7 h-7 flex flex-col items-center justify-center text-[9px] rounded ${
                                isSelected 
                                  ? 'bg-orange-500 text-white font-bold' 
                                  : isToday 
                                    ? 'bg-orange-100 text-orange-700 font-semibold'
                                    : 'text-gray-400'
                              }`}
                            >
                              <span className="uppercase leading-none">{dayName}</span>
                              <span className="text-[8px] leading-none">{day.getDate()}</span>
                            </div>
                          )
                        })}
                      </div>
                      
                      {/* Habits with colored squares - name on left, checkboxes on right */}
                      <div className="space-y-1">
                        {weekHabits.map((habit) => (
                          <div key={habit.id} className="flex items-center gap-1">
                                    <button
                              onClick={() => handleItemClick(habit, 'habit')}
                              className="w-[100px] text-left text-[11px] font-medium text-gray-600 hover:text-orange-600 transition-colors truncate flex-shrink-0"
                              title={habit.name}
                            >
                              {habit.name}
                            </button>
                            <div className="flex gap-1">
                              {weekDays.map((day) => {
                                const dateStr = getLocalDateString(day)
                                const isScheduled = isHabitScheduledForDay(habit, day)
                                const isCompleted = isHabitCompletedForDay(habit, day)
                                const isSelected = weekSelectedDayDate && getLocalDateString(weekSelectedDayDate) === dateStr
                                const isLoading = loadingHabits.has(habit.id)
                                const today = new Date()
                                today.setHours(0, 0, 0, 0)
                                const isFuture = day > today
                                
                                return (
                                  <button
                                    key={dateStr}
                                      onClick={() => {
                                      if (handleHabitToggle && !isLoading && !isFuture) {
                                          handleHabitToggle(habit.id, dateStr)
                                        }
                                      }}
                                    disabled={isLoading}
                                    className={`w-7 h-7 rounded flex items-center justify-center transition-all ${
                                        isCompleted
                                        ? 'bg-orange-500 hover:bg-orange-600 cursor-pointer shadow-sm'
                                        : !isScheduled 
                                          ? `bg-gray-100 ${isFuture ? 'cursor-not-allowed' : 'hover:bg-orange-200 cursor-pointer'}` 
                                          : `bg-gray-200 ${isFuture ? 'cursor-not-allowed' : 'hover:bg-orange-200 cursor-pointer'}`
                                    } ${isSelected ? 'ring-2 ring-orange-400 ring-offset-1' : ''}`}
                                    title={isCompleted ? 'Splněno' : 'Klikni pro splnění'}
                                  >
                                    {isLoading ? (
                                      <svg className="animate-spin h-3 w-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                      ) : isCompleted ? (
                                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                      ) : null}
                                    </button>
                              )
                            })}
                            </div>
                          </div>
                        ))}
                  </div>
                  </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-xs text-gray-400 mb-2">Žádné návyky</p>
                    {onNavigateToHabits && (
                      <button
                        onClick={() => onNavigateToHabits()}
                        className="text-xs text-orange-600 hover:text-orange-700 font-medium underline"
                      >
                        Přidat návyk
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            {!isWeekView && (
            <div className="flex-shrink-0 lg:border-r lg:border-gray-200 lg:pr-6 pb-6 lg:pb-0 border-b lg:border-b-0 w-full lg:w-auto" style={{ width: `auto`, maxWidth: '100%' }}>
              <h4 
                onClick={() => onNavigateToHabits?.()}
                className={`text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 ${onNavigateToHabits ? 'cursor-pointer hover:text-orange-600 transition-colors' : ''}`}
              >
                {t('navigation.habits')}
              </h4>
              {todaysHabits.length > 0 ? (
                <div>
                  {/* Header with day name */}
                  <div className="flex items-center gap-1 mb-1">
                    <div className="w-[100px] flex-shrink-0" />
                    <div className="w-7 h-7 flex flex-col items-center justify-center text-[9px] rounded bg-orange-100 text-orange-700 font-semibold">
                      <span className="uppercase leading-none">{dayNamesShort[selectedDayDate.getDay()]}</span>
                      <span className="text-[8px] leading-none">{selectedDayDate.getDate()}</span>
                    </div>
                  </div>
                  
                  {/* Habits */}
                  <div className="space-y-1">
                  {todaysHabits.map((habit) => {
                    const isCompleted = habit.habit_completions && habit.habit_completions[displayDateStr] === true
                      const isScheduled = (() => {
                        if (habit.frequency === 'daily') return true
                        if (habit.frequency === 'custom' && habit.selected_days && habit.selected_days.includes(dayName)) return true
                        return false
                      })()
                      const isLoading = loadingHabits.has(habit.id)
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      const isFuture = selectedDayDate > today
                    
                    return (
                        <div key={habit.id} className="flex items-center gap-1">
                      <button
                            onClick={() => handleItemClick(habit, 'habit')}
                            className="w-[100px] text-left text-[11px] font-medium text-gray-600 hover:text-orange-600 transition-colors truncate flex-shrink-0"
                            title={habit.name}
                          >
                            {habit.name}
                          </button>
                          <button
                            onClick={() => {
                              if (handleHabitToggle && !isLoading && !isFuture) {
                              handleHabitToggle(habit.id, displayDateStr)
                            }
                          }}
                            disabled={isLoading}
                            className={`w-7 h-7 rounded flex items-center justify-center transition-all flex-shrink-0 ${
                              isCompleted
                                ? 'bg-orange-500 hover:bg-orange-600 cursor-pointer shadow-sm'
                                : isFuture
                                  ? 'bg-gray-100 cursor-not-allowed'
                                  : !isScheduled 
                                    ? 'bg-gray-100 hover:bg-orange-200 cursor-pointer' 
                                    : 'bg-gray-200 hover:bg-orange-200 cursor-pointer'
                            }`}
                            title={isCompleted ? 'Splněno' : 'Klikni pro splnění'}
                          >
                            {isLoading ? (
                              <svg className="animate-spin h-3 w-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : isCompleted ? (
                              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                            ) : null}
                      </button>
                        </div>
                    )
                  })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-gray-400 mb-2">Žádné návyky</p>
                  {onNavigateToHabits && (
                    <button
                      onClick={() => onNavigateToHabits()}
                      className="text-xs text-orange-600 hover:text-orange-700 font-medium underline"
                    >
                      Přidat návyk
                    </button>
                  )}
                </div>
              )}
            </div>
            )}
            
            {/* Right Column: Today's Steps (with goals if they have one) */}
            <div className={`flex-1 min-w-0 ${isWeekView ? '' : ''}`}>
              <div className="flex items-center mb-3">
              <h4 
                onClick={() => onNavigateToSteps?.()}
                  className={`text-xs font-semibold text-gray-500 uppercase tracking-wide ${onNavigateToSteps ? 'cursor-pointer hover:text-orange-600 transition-colors' : ''}`}
              >
                {isWeekView ? t('focus.stepsThisWeek') : t('focus.stepsToday')}
              </h4>
                <span className="text-xs text-gray-400 ml-2">
                  {allTodaysSteps.filter(s => s.completed).length}/{allTodaysSteps.length}
                </span>
                <span className="flex-1"></span>
                {/* Spacer to align with day column */}
                <span className="w-20 flex-shrink-0"></span>
                {/* Total time - aligned with time column */}
                <span className="w-14 text-xs text-gray-500 text-center flex-shrink-0">
                  {allTodaysSteps.filter(s => !s.completed).reduce((sum, s) => sum + (s.estimated_time || 0), 0) > 0 
                    ? `${allTodaysSteps.filter(s => !s.completed).reduce((sum, s) => sum + (s.estimated_time || 0), 0)} min`
                    : ''}
                </span>
              </div>
              {allTodaysSteps.length > 0 ? (
                <div className="space-y-2">
                  {allTodaysSteps
                    .filter(step => !step.completed)
                    .map(step => {
                    const stepDate = normalizeDate(step.date)
                    const stepDateObj = new Date(stepDate)
                    stepDateObj.setHours(0, 0, 0, 0)
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    const isOverdue = stepDateObj < today
                    
                    // Format date for display - show day name
                    const stepDateFormatted = stepDateObj.toLocaleDateString(localeCode, { 
                      weekday: 'long'
                    })
                    
                    // Get goal for this step if it has one
                    const stepGoal = step.goal_id ? goals.find(g => g.id === step.goal_id) : null
                    const goalIcon = stepGoal ? getIconEmoji(stepGoal.icon) || '🎯' : null
                    
                    // Check if step date is in current day/week
                    let isStepInCurrentPeriod = false
                    if (isWeekView && weekStart && weekEnd) {
                      isStepInCurrentPeriod = stepDateObj.getTime() >= weekStart.getTime() && stepDateObj.getTime() <= weekEnd.getTime()
                    } else {
                      isStepInCurrentPeriod = stepDateObj.getTime() === displayDate.getTime()
                    }
                    
                    // Only show goal info if step has goal and is in current period
                    const showGoalInfo = stepGoal && isStepInCurrentPeriod
                    
                    const isToday = stepDate === getLocalDateString(new Date())
                    const isFuture = stepDateObj > today
                    
                    return (
                      <div 
                        key={step.id}
                                onClick={() => handleItemClick(step, 'step')}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                          isOverdue && !step.completed
                            ? 'border-red-300 bg-red-50/30 hover:bg-red-50'
                            : isToday && !step.completed
                              ? 'border-orange-400 bg-orange-50/30 hover:bg-orange-50'
                                        : 'border-gray-200 bg-white hover:bg-gray-50'
                        } ${step.completed ? 'opacity-50' : ''}`}
                              >
                        {/* Checkbox */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (!loadingSteps.has(step.id)) {
                                        handleStepToggle(step.id, !step.completed)
                                      }
                                    }}
                                    disabled={loadingSteps.has(step.id)}
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                                      step.completed 
                              ? 'bg-orange-500 border-orange-500' 
                              : isOverdue
                                ? 'border-red-400 hover:bg-red-100'
                                : isToday
                                  ? 'border-orange-400 hover:bg-orange-100'
                                  : 'border-gray-300 hover:border-orange-400'
                          }`}
                                  >
                                    {loadingSteps.has(step.id) ? (
                            <svg className="animate-spin h-3 w-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                    ) : step.completed ? (
                            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                          ) : null}
                                  </button>
                        
                        {/* Title */}
                        <span className={`flex-1 text-sm truncate flex items-center gap-2 ${
                                      step.completed 
                                        ? 'line-through text-gray-400' 
                                        : isOverdue 
                              ? 'text-red-600' 
                              : stepDate === getLocalDateString(new Date())
                                ? 'text-orange-600'
                                : 'text-gray-500'
                        } ${step.is_important && !step.completed ? 'font-bold' : 'font-medium'}`}>
                                      {step.title}
                                      {step.checklist && step.checklist.length > 0 && (
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                                          step.checklist.filter((c: any) => c.completed).length === step.checklist.length
                                            ? 'bg-orange-100 text-orange-600'
                                            : 'bg-gray-100 text-gray-500'
                                        }`}>
                                          {step.checklist.filter((c: any) => c.completed).length}/{step.checklist.length}
                                      </span>
                                    )}
                                    </span>
                        
                        {/* Meta info - fixed width columns - hidden on mobile */}
                          <button
                            onClick={(e) => openDatePicker(e, step)}
                          className={`hidden sm:block w-20 text-xs text-center capitalize flex-shrink-0 rounded px-1 py-0.5 transition-colors ${
                          isOverdue && !step.completed 
                            ? 'text-red-500 hover:bg-red-100' 
                            : isToday
                              ? 'text-orange-600 hover:bg-orange-100' 
                              : 'text-gray-500 hover:bg-gray-100'
                        }`}>
                          {isOverdue && !step.completed && '❗'}
                          {isToday ? t('focus.today') : stepDateFormatted || '-'}
                          </button>
                        <button 
                          onClick={(e) => openTimePicker(e, step)}
                          className={`hidden sm:block w-14 text-xs text-center flex-shrink-0 rounded px-1 py-0.5 transition-colors ${
                            isOverdue && !step.completed 
                              ? 'text-red-500 hover:bg-red-100' 
                              : isToday
                                ? 'text-orange-600 hover:bg-orange-100' 
                                : 'text-gray-500 hover:bg-gray-100'
                          }`}>
                          {step.estimated_time ? `${step.estimated_time} min` : '-'}
                        </button>
                                  </div>
                    )
                  })}
                  
                  {/* Completed steps count - clickable to show/hide */}
                  {allTodaysSteps.filter(s => s.completed).length > 0 && (
                    <>
                      <button
                        onClick={() => setShowCompletedSteps(!showCompletedSteps)}
                        className="w-full mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400 text-center hover:text-orange-500 transition-colors flex items-center justify-center gap-1"
                      >
                        <span>✓ {allTodaysSteps.filter(s => s.completed).length} {allTodaysSteps.filter(s => s.completed).length === 1 ? 'splněný krok' : 'splněných kroků'}</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${showCompletedSteps ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {/* Completed steps list */}
                      {showCompletedSteps && (
                        <div className="mt-2 space-y-2">
                          {allTodaysSteps.filter(s => s.completed).map(step => {
                            const stepDate = normalizeDate(step.date)
                            const stepDateObj = new Date(stepDate)
                            stepDateObj.setHours(0, 0, 0, 0)
                            const stepDateFormatted = stepDateObj.toLocaleDateString(localeCode, { weekday: 'long' })
                            
                            return (
                              <div 
                                key={step.id}
                        onClick={() => handleItemClick(step, 'step')}
                                className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 transition-all cursor-pointer opacity-50"
                              >
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (!loadingSteps.has(step.id)) {
                                handleStepToggle(step.id, !step.completed)
                              }
                            }}
                            disabled={loadingSteps.has(step.id)}
                                  className="w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 bg-orange-500 border-orange-500"
                          >
                            {loadingSteps.has(step.id) ? (
                                    <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                            )}
                          </button>
                                <span className="flex-1 text-sm truncate line-through text-gray-400 font-medium flex items-center gap-2">
                            {step.title}
                            {step.checklist && step.checklist.length > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 flex-shrink-0 no-underline">
                                {step.checklist.length}/{step.checklist.length}
                              </span>
                            )}
                          </span>
                                <span className="hidden sm:block w-20 text-xs text-center capitalize flex-shrink-0 text-gray-400">
                                    {stepDateFormatted}
                                  </span>
                                <span className="hidden sm:block w-14 text-xs text-gray-400 text-center flex-shrink-0">
                                  {step.estimated_time ? `${step.estimated_time} min` : '-'}
                                </span>
                      </div>
                    )
                  })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-gray-400 mb-2">
                    {isWeekView ? t('focus.noStepsThisWeek') : t('focus.noStepsToday')}
                  </p>
                  {onOpenStepModal && (
                    <button
                      onClick={() => {
                        const dateToUse = isWeekView && weekSelectedDayDate 
                          ? getLocalDateString(weekSelectedDayDate)
                          : displayDateStr
                        onOpenStepModal(dateToUse)
                      }}
                      className="text-xs text-orange-600 hover:text-orange-700 font-medium underline"
                    >
                      {t('focus.addStep')}
                    </button>
                  )}
                  {!onOpenStepModal && onNavigateToSteps && (
                    <button
                      onClick={() => onNavigateToSteps()}
                      className="text-xs text-orange-600 hover:text-orange-700 font-medium underline"
                    >
                      {t('focus.addStep')}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Additional Steps Section - Divided */}
      {(() => {
        // Get all steps that are not in the current week (for week view) or not today (for day view)
        const allSteps = dailySteps.filter(step => {
          if (!step.date || step.completed) return false
          
          const stepDate = normalizeDate(step.date)
          const stepDateObj = new Date(stepDate)
          stepDateObj.setHours(0, 0, 0, 0)
          
          if (isWeekView && weekStart && weekEnd) {
            // In week view, exclude steps from current week
            return stepDateObj < weekStart || stepDateObj > weekEnd
          } else {
            // In day view, exclude steps from today
            return stepDateObj.getTime() !== displayDate.getTime()
          }
        })
        
        return allSteps.length > 0
      })() && (
        <div className="w-full">
          <div className="bg-white rounded-xl p-6 border-2 border-gray-300 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-medium text-gray-500">{t('focus.otherSteps')}</h3>
              {onOpenStepModal && (
                <button
                  onClick={() => onOpenStepModal(displayDateStr)}
                  className="w-5 h-5 rounded-full bg-gray-300 text-white hover:bg-gray-400 transition-colors flex items-center justify-center text-xs font-bold"
                  title={t('focus.addStep')}
                >
                  +
                </button>
              )}
            </div>
            
            <div className="flex flex-col lg:grid lg:grid-cols-2 gap-3">
              {(() => {
                // Separate steps into overdue steps and future steps
                const overdueStepsList: any[] = []
                const futureStepsList: any[] = []
                
                // Get all steps that are not in the current week (for week view) or not today (for day view)
                const allSteps = dailySteps.filter(step => {
                  if (!step.date || step.completed) return false
                  
                  const stepDate = normalizeDate(step.date)
                  const stepDateObj = new Date(stepDate)
                  stepDateObj.setHours(0, 0, 0, 0)
                  
                  if (isWeekView && weekStart && weekEnd) {
                    // In week view, exclude steps from current week
                    return stepDateObj.getTime() < weekStart.getTime() || stepDateObj.getTime() > weekEnd.getTime()
                  } else {
                    // In day view, exclude steps from today
                    return stepDateObj.getTime() !== displayDate.getTime()
                  }
                })
                
                // Get actual today's date for overdue comparison
                const actualToday = new Date()
                actualToday.setHours(0, 0, 0, 0)
                
                allSteps.forEach(step => {
                  const stepDate = normalizeDate(step.date)
                  const stepDateObj = new Date(stepDate)
                  stepDateObj.setHours(0, 0, 0, 0)
                  
                  if (isWeekView && weekStart && weekEnd) {
                    // In week view: 
                    // - overdue = before TODAY (not before week start!) - only truly late steps
                    // - future = after week end
                    const isOverdue = stepDateObj.getTime() < actualToday.getTime()
                    const isFuture = stepDateObj.getTime() > weekEnd.getTime()
                    
                    if (isOverdue) {
                      overdueStepsList.push(step)
                    } else if (isFuture) {
                      futureStepsList.push(step)
                    }
                  } else {
                    // In day view: overdue = before today, future = after today
                  const isOverdue = stepDateObj < displayDate
                  const isFuture = stepDateObj > displayDate
                  
                  if (isOverdue) {
                    overdueStepsList.push(step)
                  } else if (isFuture) {
                    futureStepsList.push(step)
                    }
                  }
                })
                
                const renderStep = (step: typeof allSteps[0]) => {
                  const stepDate = normalizeDate(step.date)
                  const stepDateObj = new Date(stepDate)
                  stepDateObj.setHours(0, 0, 0, 0)
                  
                  // Overdue = before actual today (not before displayed week/day)
                  const isOverdue = stepDateObj.getTime() < actualToday.getTime()
                  
                  const stepDateFormatted = step.date ? new Date(normalizeDate(step.date)).toLocaleDateString('cs-CZ', { weekday: 'long' }) : null
                
                  return (
                    <div
                      key={step.id}
                      onClick={() => handleItemClick(step, 'step')}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                        isOverdue && !step.completed
                          ? 'border-red-300 bg-red-50/30 hover:bg-red-50'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      } ${step.completed ? 'opacity-50' : ''}`}
                    >
                      {/* Checkbox */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (!loadingSteps.has(step.id)) {
                              handleStepToggle(step.id, !step.completed)
                            }
                          }}
                          disabled={loadingSteps.has(step.id)}
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                          step.completed 
                            ? 'bg-orange-500 border-orange-500' 
                            : isOverdue
                              ? 'border-red-400 hover:bg-red-100'
                              : 'border-gray-300 hover:border-orange-400'
                        }`}
                        >
                          {loadingSteps.has(step.id) ? (
                          <svg className="animate-spin h-3 w-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : step.completed ? (
                          <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                        ) : null}
                        </button>
                      
                      {/* Title */}
                      <span className={`flex-1 font-medium text-sm truncate flex items-center gap-2 ${
                        step.completed ? 'line-through text-gray-400' : isOverdue ? 'text-red-600' : 'text-gray-900'
                      }`}>
                          {step.title}
                          {step.checklist && step.checklist.length > 0 && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                              step.checklist.filter((c: any) => c.completed).length === step.checklist.length
                                ? 'bg-orange-100 text-orange-600'
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              {step.checklist.filter((c: any) => c.completed).length}/{step.checklist.length}
                            </span>
                          )}
                        </span>
                      
                      {/* Meta info - hidden on mobile */}
                      <button 
                        onClick={(e) => openDatePicker(e, step)}
                        className={`hidden sm:block w-20 text-xs text-center capitalize flex-shrink-0 rounded px-1 py-0.5 transition-colors ${
                          isOverdue && !step.completed ? 'text-red-500 hover:bg-red-100' : 'text-gray-500 hover:bg-gray-100'
                        }`}>
                        {isOverdue && !step.completed && '❗'}
                        {stepDateFormatted || '-'}
                      </button>
                      <button 
                        onClick={(e) => openTimePicker(e, step)}
                        className={`hidden sm:block w-14 text-xs text-center flex-shrink-0 rounded px-1 py-0.5 transition-colors ${
                          isOverdue && !step.completed ? 'text-red-500 hover:bg-red-100' : 'text-gray-500 hover:bg-gray-100'
                        }`}>
                        {step.estimated_time ? `${step.estimated_time} min` : '-'}
                      </button>
                    </div>
                  )
                }
                
                  return (
                    <>
                      {/* Overdue steps column */}
                      <div className="flex flex-col">
                        <h4 className="text-[10px] font-medium text-gray-400 mb-2 uppercase tracking-wide">{t('focus.overdueSteps')}</h4>
                        <div className="space-y-1.5">
                          {overdueStepsList.length > 0 ? (
                            overdueStepsList.map(renderStep)
                          ) : (
                            <div className="text-gray-400 text-xs text-center py-3">
                              {t('focus.noOverdueSteps')}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Future steps column */}
                      <div className="flex flex-col">
                        <h4 className="text-[10px] font-medium text-gray-400 mb-2 uppercase tracking-wide">{t('focus.futureSteps')}</h4>
                        <div className="space-y-1.5">
                          {futureStepsList.length > 0 ? (
                            futureStepsList.map(renderStep)
                          ) : (
                            <div className="text-gray-400 text-xs text-center py-3">
                              {t('focus.noFutureSteps')}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )
              })()}
            </div>
          </div>
        </div>
      )}
      
      {/* Date Picker Modal */}
      {datePickerStep && datePickerPosition && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => {
              setDatePickerStep(null)
              setDatePickerPosition(null)
            }}
          />
          <div 
            className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-4"
            style={{
              top: `${Math.min(datePickerPosition.top, window.innerHeight - 380)}px`,
              left: `${Math.min(Math.max(datePickerPosition.left - 100, 10), window.innerWidth - 250)}px`,
              width: '230px'
            }}
          >
            <div className="text-sm font-bold text-gray-800 mb-3">Date</div>
            
            {/* Day names */}
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map(day => (
                <div key={day} className="text-center text-xs text-gray-400 font-medium py-1">
                  {day}
    </div>
              ))}
            </div>
            
            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-0.5 mb-3">
              {(() => {
                const year = datePickerMonth.getFullYear()
                const month = datePickerMonth.getMonth()
                const firstDay = new Date(year, month, 1)
                const lastDay = new Date(year, month + 1, 0)
                const startDay = (firstDay.getDay() + 6) % 7 // Monday = 0
                const days: (Date | null)[] = []
                
                // Empty cells before first day
                for (let i = 0; i < startDay; i++) {
                  days.push(null)
                }
                
                // Days of month
                for (let d = 1; d <= lastDay.getDate(); d++) {
                  days.push(new Date(year, month, d))
                }
                
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const stepCurrentDate = datePickerStep?.date ? new Date(normalizeDate(datePickerStep.date)) : null
                if (stepCurrentDate) stepCurrentDate.setHours(0, 0, 0, 0)
                
                return days.map((day, i) => {
                  if (!day) {
                    return <div key={`empty-${i}`} className="w-7 h-7" />
                  }
                  
                  const isToday = day.getTime() === today.getTime()
                  const isSelected = stepCurrentDate && day.getTime() === stepCurrentDate.getTime()
                  
                  return (
                    <button
                      key={day.getTime()}
                      onClick={() => handleDateSelect(day)}
                      className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-orange-500 text-white'
                          : isToday
                            ? 'bg-orange-100 text-orange-600 font-bold'
                            : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      {day.getDate()}
                    </button>
                  )
                })
              })()}
            </div>
            
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => {
                  const newMonth = new Date(datePickerMonth)
                  newMonth.setMonth(newMonth.getMonth() - 1)
                  setDatePickerMonth(newMonth)
                }}
                className="p-1 hover:bg-gray-100 rounded text-gray-400"
              >
                <ChevronDown className="w-4 h-4 rotate-90" />
              </button>
              <span className="text-xs font-medium text-gray-600">
                {datePickerMonth.toLocaleDateString(localeCode, { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => {
                  const newMonth = new Date(datePickerMonth)
                  newMonth.setMonth(newMonth.getMonth() + 1)
                  setDatePickerMonth(newMonth)
                }}
                className="p-1 hover:bg-gray-100 rounded text-gray-400"
              >
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </button>
            </div>
            
            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (datePickerStep?.date) {
                    const currentDate = new Date(normalizeDate(datePickerStep.date))
                    handleDateSelect(currentDate)
                  }
                }}
                className="flex-1 px-3 py-1.5 bg-orange-500 text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setDatePickerStep(null)
                  setDatePickerPosition(null)
                }}
                className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
      
      {/* Time Picker Modal */}
      {timePickerStep && timePickerPosition && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => {
              setTimePickerStep(null)
              setTimePickerPosition(null)
            }}
          />
          <div 
            className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-4"
            style={{
              top: `${timePickerPosition.top}px`,
              left: `${timePickerPosition.left}px`,
              width: '160px'
            }}
          >
            <div className="text-sm font-bold text-gray-800 mb-3">Čas (min)</div>
            
            {/* Time options */}
            <div className="grid grid-cols-3 gap-1 mb-3">
              {[5, 10, 15, 20, 30, 45, 60, 90, 120].map(minutes => (
                <button
                  key={minutes}
                  onClick={() => handleTimeSelect(minutes)}
                  className={`py-1.5 rounded text-xs font-medium transition-colors ${
                    timePickerStep?.estimated_time === minutes
                      ? 'bg-orange-500 text-white'
                      : 'hover:bg-orange-100 text-gray-600'
                  }`}
                >
                  {minutes}
                </button>
              ))}
            </div>
            
            {/* Custom input */}
            <div className="flex gap-2 mb-3">
              <input
                type="number"
                min="1"
                max="480"
                placeholder="Vlastní"
                defaultValue={timePickerStep?.estimated_time || ''}
                className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const value = parseInt((e.target as HTMLInputElement).value)
                    if (value > 0) {
                      handleTimeSelect(value)
                    }
                  }
                }}
                id="custom-time-input"
              />
              <button
                onClick={() => {
                  const input = document.getElementById('custom-time-input') as HTMLInputElement
                  const value = parseInt(input?.value)
                  if (value > 0) {
                    handleTimeSelect(value)
                  }
                }}
                className="px-2 py-1.5 bg-orange-500 text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition-colors"
              >
                OK
              </button>
            </div>
            
            {/* Cancel button */}
            <button
              onClick={() => {
                setTimePickerStep(null)
                setTimePickerPosition(null)
              }}
              className="w-full px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  )
}

