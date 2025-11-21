'use client'

import { useMemo, useEffect, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { getLocalDateString, normalizeDate } from '../utils/dateHelpers'
import { Check, Target, ArrowRight } from 'lucide-react'
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
  onNavigateToSteps
}: TodayFocusSectionProps) {
  const t = useTranslations()
  const locale = useLocale()
  const localeCode = locale === 'cs' ? 'cs-CZ' : 'en-US'
  
  const displayDate = new Date(selectedDayDate)
  displayDate.setHours(0, 0, 0, 0)
  const displayDateStr = getLocalDateString(displayDate)
  
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
        if (!step.date || step.completed) return false
        
        // In week view, show all steps from the current week
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
        
        // In day view, filter by date
        const stepDate = normalizeDate(step.date)
        const stepDateObj = new Date(stepDate)
        stepDateObj.setHours(0, 0, 0, 0)
        
        // Include steps from today or overdue
        const isTodayOrOverdue = stepDateObj <= displayDate
        
        // Check if step belongs to an active focus goal
        const belongsToActiveGoal = step.goal_id && activeFocusGoalIds.has(step.goal_id)
        
        return isTodayOrOverdue && belongsToActiveGoal
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
        if (!step.date || step.completed) return false
        
        // In week view, show all steps from the current week
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
        
        // In day view, filter by date
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
      // Sort by goal focus_order first (if has goal)
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
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-bold text-orange-800">
            {isWeekView ? 'Týdenní fokus' : 'Dnešní fokus'}
          </h3>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p className="mb-2">Žádné kroky na dnes.</p>
          <p className="text-sm">Všechny kroky jsou dokončené nebo nejsou naplánované.</p>
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
                {isWeekView ? 'Týdenní fokus' : 'Dnešní fokus'}
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
                title="Přidat krok"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Přidat krok
              </button>
            )}
          </div>
          
          {/* Two Column Layout */}
          <div className="flex gap-6">
            {/* Left Column: Habits - Week view shows compact table, day view shows list */}
            {isWeekView && weekStartDate && (
              <div className="flex-shrink-0 border-r border-gray-200 pr-6" style={{ minWidth: '200px' }}>
                <h4 
                  onClick={() => onNavigateToHabits?.()}
                  className={`text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2 ${onNavigateToHabits ? 'cursor-pointer hover:text-orange-600 transition-colors' : ''}`}
                >
                  Návyky
                </h4>
                {weekHabits.length > 0 ? (
                  <div className="overflow-y-auto max-h-[500px]">
                    <table className="border-collapse text-left">
                      <thead>
                        <tr>
                          <th className="text-left pb-1.5 pr-3 text-[9px] font-semibold text-gray-400"></th>
                          {weekDays.map((day) => {
                            const dateStr = getLocalDateString(day)
                            const isSelected = weekSelectedDayDate && getLocalDateString(weekSelectedDayDate) === dateStr
                            const dayName = dayNamesShort[day.getDay()]
                            
                            return (
                              <th
                                key={dateStr}
                                className={`text-center pb-1.5 px-1 text-[9px] font-semibold ${
                                  isSelected ? 'text-orange-700' : 'text-gray-400'
                                }`}
                              >
                                <div className="flex flex-col items-center">
                                  <span className="uppercase leading-tight">{dayName}</span>
                                  <span className={`text-[10px] ${isSelected ? 'font-bold' : ''}`}>{day.getDate()}</span>
                                </div>
                              </th>
                            )
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {weekHabits.map((habit) => (
                          <tr key={habit.id} className="group">
                            <td className="pr-3 py-1.5">
                              <button
                                onClick={() => handleItemClick(habit, 'habit')}
                                className="text-left text-[11px] font-medium text-gray-600 hover:text-orange-600 transition-colors truncate max-w-[180px] block"
                                title={habit.name}
                              >
                                {habit.name}
                              </button>
                            </td>
                            {weekDays.map((day) => {
                              const dateStr = getLocalDateString(day)
                              const isScheduled = isHabitScheduledForDay(habit, day)
                              const isCompleted = isHabitCompletedForDay(habit, day)
                              const isSelected = weekSelectedDayDate && getLocalDateString(weekSelectedDayDate) === dateStr
                              
                              return (
                                <td
                                  key={dateStr}
                                  className={`text-center py-1.5 px-1 ${
                                    isSelected ? 'bg-orange-50' : ''
                                  }`}
                                >
                                  {isScheduled ? (
                                    <button
                                      onClick={() => {
                                        if (handleHabitToggle && !loadingHabits.has(habit.id)) {
                                          handleHabitToggle(habit.id, dateStr)
                                        }
                                      }}
                                      disabled={loadingHabits.has(habit.id)}
                                      className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                                        isCompleted
                                          ? 'bg-orange-500 border-orange-600'
                                          : 'bg-white border-gray-300 hover:border-orange-400'
                                      } ${isSelected ? 'ring-1 ring-orange-300' : ''}`}
                                    >
                                      {loadingHabits.has(habit.id) ? (
                                        <svg className="animate-spin h-2 w-2 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                      ) : isCompleted ? (
                                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                      ) : null}
                                    </button>
                                  ) : (
                                    <span className="text-gray-200 text-[8px]">•</span>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-[10px] text-gray-400 text-center py-4">Žádné návyky</div>
                )}
              </div>
            )}
            {!isWeekView && (
            <div className="flex-shrink-0 border-r border-gray-200 pr-6" style={{ width: `${maxHabitWidth}px` }}>
              <h4 
                onClick={() => onNavigateToHabits?.()}
                className={`text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 ${onNavigateToHabits ? 'cursor-pointer hover:text-orange-600 transition-colors' : ''}`}
              >
                Návyky
              </h4>
              {todaysHabits.length > 0 ? (
                <div className="space-y-2">
                  {todaysHabits.map((habit) => {
                    const isCompleted = habit.habit_completions && habit.habit_completions[displayDateStr] === true
                    const isNotScheduled = habit.always_show ? (() => {
                      if (habit.frequency === 'daily') return false
                      if (habit.frequency === 'custom' && habit.selected_days && habit.selected_days.includes(dayName)) return false
                      return true
                    })() : false
                    
                    // Calculate streak
                    const habitCompletions = habit.habit_completions || {}
                    const completionDates = Object.keys(habitCompletions).sort()
                    let currentStreak = 0
                    const userCreatedDateFull = new Date(player?.created_at || '2024-01-01')
                    const userCreatedDate = new Date(userCreatedDateFull.getFullYear(), userCreatedDateFull.getMonth(), userCreatedDateFull.getDate())
                    
                    let lastCompletedDate = null
                    for (const dateKey of completionDates) {
                      const completion = habitCompletions[dateKey]
                      if (completion === true) {
                        const date = new Date(dateKey)
                        if (!lastCompletedDate || date > lastCompletedDate) {
                          lastCompletedDate = date
                        }
                      }
                    }
                    
                    if (lastCompletedDate) {
                      const lastCompletedDateOnly = new Date(lastCompletedDate!.getFullYear(), lastCompletedDate!.getMonth(), lastCompletedDate!.getDate())
                      for (let d = new Date(lastCompletedDateOnly); d >= userCreatedDate; d.setDate(d.getDate() - 1)) {
                        const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                        const completion = habitCompletions[dateKey]
                        
                        if (completion === true) {
                          currentStreak++
                        } else if (completion === false) {
                          break
                        }
                      }
                    }
                    
                    return (
                      <button
                        key={habit.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          // Open modal on button click (not on checkbox)
                          if (!(e.target instanceof HTMLElement && (e.target.closest('.habit-checkbox') || e.target.closest('svg')))) {
                            handleItemClick(habit, 'habit')
                          }
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 transition-all text-left ${
                          isCompleted 
                            ? 'bg-orange-100 border-orange-400 hover:bg-orange-200' 
                            : isNotScheduled 
                              ? 'bg-gray-50 border-gray-300 hover:bg-gray-100 opacity-60' 
                              : 'bg-white border-orange-300 hover:border-orange-400 hover:bg-orange-50'
                        } cursor-pointer`}
                        title="Klikněte pro úpravu návyku"
                      >
                        <div
                          onClick={(e) => {
                            e.stopPropagation()
                            if (handleHabitToggle && !loadingHabits.has(habit.id)) {
                              handleHabitToggle(habit.id, displayDateStr)
                            }
                          }}
                          className="habit-checkbox flex-shrink-0 cursor-pointer"
                        >
                          {loadingHabits.has(habit.id) ? (
                            <svg className="animate-spin h-3.5 w-3.5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : isCompleted ? (
                            <Check className="w-3.5 h-3.5 text-orange-600" strokeWidth={3} />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-gray-400" strokeWidth={2.5} fill="none" />
                          )}
                        </div>
                        <span className={`text-xs font-medium truncate flex-1 ${
                          isCompleted 
                            ? 'line-through text-orange-700' 
                            : isNotScheduled 
                              ? 'text-gray-500' 
                              : 'text-gray-900'
                        }`}>
                          {habit.name}
                        </span>
                        {currentStreak > 0 && (
                          <span className="text-orange-600 font-bold text-xs flex-shrink-0">🔥{currentStreak}</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="text-xs text-gray-400 text-center py-4">Žádné návyky</div>
              )}
            </div>
            )}
            
            {/* Right Column: Today's Steps (with goals if they have one) */}
            <div className={`flex-1 min-w-0 ${isWeekView ? '' : ''}`}>
              <h4 
                onClick={() => onNavigateToSteps?.()}
                className={`text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 ${onNavigateToSteps ? 'cursor-pointer hover:text-orange-600 transition-colors' : ''}`}
              >
                {isWeekView ? 'Kroky v týdnu' : 'Dnešní kroky'}
              </h4>
              {allTodaysSteps.length > 0 ? (
                <div className="space-y-2">
                  {allTodaysSteps.map(step => {
                    const stepDate = normalizeDate(step.date)
                    const stepDateObj = new Date(stepDate)
                    stepDateObj.setHours(0, 0, 0, 0)
                    const isOverdue = stepDateObj < displayDate
                    
                    // Format date for display in week view
                    const stepDateFormatted = isWeekView ? stepDateObj.toLocaleDateString(localeCode, { 
                      day: 'numeric', 
                      month: 'short' 
                    }) : null
                    
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
                    
                    return (
                      <div key={step.id}>
                        {showGoalInfo ? (
                          // Show with goal (like in "Cíle s nejbližšími kroky")
                          <div className="border-l-4 border-orange-400 pl-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xl">{goalIcon}</span>
                              <h4 className="font-semibold text-gray-900 truncate text-sm">{stepGoal.title}</h4>
                              {stepGoal.focus_order && (
                                <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full flex-shrink-0">
                                  #{stepGoal.focus_order}
                                </span>
                              )}
                            </div>
                            
                            <div className="ml-7">
                              <div
                                onClick={() => handleItemClick(step, 'step')}
                                className={`p-2.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                                  step.is_important && step.is_urgent
                                    ? 'border-yellow-400 bg-yellow-50/50 hover:bg-yellow-50 hover:border-yellow-500'
                                    : step.is_important
                                      ? 'border-yellow-300 bg-yellow-50/30 hover:bg-yellow-50/50 hover:border-yellow-400'
                                      : step.is_urgent
                                        ? 'border-orange-300 bg-orange-50/30 hover:bg-orange-50/50 hover:border-orange-400'
                                        : 'border-gray-200 bg-white hover:bg-gray-50'
                                } ${step.completed ? 'opacity-60' : ''} ${isOverdue ? 'border-red-300 bg-red-50/30' : ''}`}
                              >
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (!loadingSteps.has(step.id)) {
                                        handleStepToggle(step.id, !step.completed)
                                      }
                                    }}
                                    disabled={loadingSteps.has(step.id)}
                                    className="flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 flex-shrink-0"
                                  >
                                    {loadingSteps.has(step.id) ? (
                                      <svg className="animate-spin h-3.5 w-3.5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                    ) : step.completed ? (
                                      <Check className="w-3.5 h-3.5 text-orange-600" strokeWidth={3} />
                                    ) : (
                                      <Check className="w-3.5 h-3.5 text-gray-400" strokeWidth={2.5} fill="none" />
                                    )}
                                  </button>
                                  <div className="flex-1 min-w-0">
                                    <span className={`truncate block text-xs ${
                                      step.completed 
                                        ? 'line-through text-gray-400' 
                                        : isOverdue 
                                          ? 'text-red-600 font-medium' 
                                          : 'text-gray-700'
                                    }`}>
                                      {step.title}
                                    </span>
                                    {isWeekView && stepDateFormatted && (
                                      <span className="text-[9px] text-gray-500 mt-0.5 block">
                                        {stepDateFormatted}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    {step.is_important && (
                                      <span className="text-yellow-600 text-xs">⭐</span>
                                    )}
                                    {step.is_urgent && (
                                      <span className="text-orange-600 text-xs">⚡</span>
                                    )}
                                    {isOverdue && !step.completed && (
                                      <span className="text-red-500 text-xs">⚠️</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Show without goal (normal step)
                          <div
                        onClick={() => handleItemClick(step, 'step')}
                        className={`p-2.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                          step.is_important && step.is_urgent
                            ? 'border-yellow-400 bg-yellow-50/50 hover:bg-yellow-50 hover:border-yellow-500'
                            : step.is_important
                              ? 'border-yellow-300 bg-yellow-50/30 hover:bg-yellow-50/50 hover:border-yellow-400'
                              : step.is_urgent
                                ? 'border-orange-300 bg-orange-50/30 hover:bg-orange-50/50 hover:border-orange-400'
                                : 'border-gray-200 bg-white hover:bg-gray-50'
                        } ${step.completed ? 'opacity-60' : ''} ${isOverdue ? 'border-red-300 bg-red-50/30' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (!loadingSteps.has(step.id)) {
                                handleStepToggle(step.id, !step.completed)
                              }
                            }}
                            disabled={loadingSteps.has(step.id)}
                            className="flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 flex-shrink-0"
                          >
                            {loadingSteps.has(step.id) ? (
                              <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : step.completed ? (
                              <Check className="w-4 h-4 text-orange-600" strokeWidth={3} />
                            ) : (
                              <Check className="w-4 h-4 text-gray-400" strokeWidth={2.5} fill="none" />
                            )}
                          </button>
                              <div className="flex-1 min-w-0">
                                <span className={`truncate block font-medium text-sm ${
                            step.completed 
                              ? 'line-through text-gray-500' 
                              : isOverdue 
                                ? 'text-red-700 font-semibold' 
                                : 'text-gray-900'
                          }`}>
                            {step.title}
                          </span>
                                {isWeekView && stepDateFormatted && (
                                  <span className="text-[10px] text-gray-500 mt-0.5 block">
                                    {stepDateFormatted}
                                  </span>
                                )}
                              </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {step.is_important && (
                              <span className="text-yellow-600 text-xs">⭐</span>
                            )}
                            {step.is_urgent && (
                              <span className="text-orange-600 text-xs">⚡</span>
                            )}
                            {isOverdue && !step.completed && (
                              <span className="text-red-600 text-xs">⚠️</span>
                            )}
                          </div>
                        </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-xs text-gray-400 text-center py-4">
                  {isWeekView ? 'Žádné kroky v týdnu' : 'Žádné dnešní kroky'}
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
              <h3 className="text-xs font-medium text-gray-500">Další kroky</h3>
              {onOpenStepModal && (
                <button
                  onClick={() => onOpenStepModal(displayDateStr)}
                  className="w-5 h-5 rounded-full bg-gray-300 text-white hover:bg-gray-400 transition-colors flex items-center justify-center text-xs font-bold"
                  title="Přidat krok"
                >
                  +
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
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
                
                allSteps.forEach(step => {
                  const stepDate = normalizeDate(step.date)
                  const stepDateObj = new Date(stepDate)
                  stepDateObj.setHours(0, 0, 0, 0)
                  
                  if (isWeekView && weekStart && weekEnd) {
                    // In week view: overdue = before week start, future = after week end
                    const isOverdue = stepDateObj.getTime() < weekStart.getTime()
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
                  
                  let isOverdue = false
                  if (isWeekView && weekStart) {
                    isOverdue = stepDateObj.getTime() < weekStart.getTime()
                  } else {
                    isOverdue = stepDateObj < displayDate
                  }
                
                  return (
                    <div
                      key={step.id}
                      onClick={() => handleItemClick(step, 'step')}
                      className={`p-2 rounded-md border border-gray-200 bg-gray-50/80 hover:bg-gray-100/80 hover:border-gray-300 transition-all duration-200 cursor-pointer ${
                        step.completed ? 'bg-gray-100/60 border-gray-200' : ''
                      } ${isOverdue && !step.completed ? 'border-red-200 bg-red-50/15' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (!loadingSteps.has(step.id)) {
                              handleStepToggle(step.id, !step.completed)
                            }
                          }}
                          disabled={loadingSteps.has(step.id)}
                          className="flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 flex-shrink-0"
                        >
                          {loadingSteps.has(step.id) ? (
                            <svg className="animate-spin h-3.5 w-3.5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : step.completed ? (
                            <Check className="w-3.5 h-3.5 text-gray-400" strokeWidth={3} />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-gray-300" strokeWidth={2.5} fill="none" />
                          )}
                        </button>
                        <span className={`truncate flex-1 font-medium text-xs ${step.completed ? 'line-through text-gray-400' : isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
                          {step.title}
                        </span>
                        {isOverdue && !step.completed && <span className="text-red-400 text-xs flex-shrink-0">⚠️</span>}
                      </div>
                    </div>
                  )
                }
                
                  return (
                    <>
                      {/* Overdue steps column */}
                      <div className="flex flex-col">
                        <h4 className="text-[10px] font-medium text-gray-400 mb-2 uppercase tracking-wide">Zpožděné kroky</h4>
                        <div className="space-y-1.5">
                          {overdueStepsList.length > 0 ? (
                            overdueStepsList.map(renderStep)
                          ) : (
                            <div className="text-gray-400 text-xs text-center py-3">
                              Žádné zpožděné kroky
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Future steps column */}
                      <div className="flex flex-col">
                        <h4 className="text-[10px] font-medium text-gray-400 mb-2 uppercase tracking-wide">Budoucí kroky</h4>
                        <div className="space-y-1.5">
                          {futureStepsList.length > 0 ? (
                            futureStepsList.map(renderStep)
                          ) : (
                            <div className="text-gray-400 text-xs text-center py-3">
                              Žádné budoucí kroky
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
    </div>
  )
}

