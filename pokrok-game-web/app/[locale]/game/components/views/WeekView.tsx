'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Check, X, ChevronLeft, ChevronRight, Footprints } from 'lucide-react'
import { getLocalDateString, normalizeDate } from '../utils/dateHelpers'
import { isHabitScheduledForDay } from '../utils/habitHelpers'
import { TodayFocusSection } from './TodayFocusSection'
import { getIconComponent } from '@/lib/icon-utils'

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
  visibleSections?: Record<string, boolean>
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
  onNavigateToSteps,
  visibleSections: visibleSectionsProp = undefined
}: WeekViewProps) {
  const t = useTranslations()
  const locale = useLocale()
  const localeCode = locale === 'cs' ? 'cs-CZ' : 'en-US'
  
  // Always show all sections in calendar views - ignore visibleSections prop
  // Calendar view can only be turned on/off as a whole, not individual sections
  const visibleSections = useMemo(() => ({
    quickOverview: true,
    weeklyFocus: true,
    habits: true,
    futureSteps: true,
    overdueSteps: true
  }), [])

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
  
  const today = useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }, [])
  const todayStr = getLocalDateString(today)
  
  // Day names - use translations
  const dayNamesShort = [
    t('daysShort.sun'), t('daysShort.mon'), t('daysShort.tue'), t('daysShort.wed'),
    t('daysShort.thu'), t('daysShort.fri'), t('daysShort.sat')
  ]
  
  // Calculate stats for a specific day - habits and steps together
  const getDayStats = useCallback((date: Date) => {
    const dateStr = getLocalDateString(date)
    
    // Habits for this day - use helper function
    const dayHabits = habits.filter(habit => {
      return isHabitScheduledForDay(habit, date)
    })
    
    const completedHabits = dayHabits.filter(h => 
      h.habit_completions && h.habit_completions[dateStr] === true
    ).length
    const totalHabits = dayHabits.length
    
    // Steps for this day
    const daySteps = dailySteps.filter(step => {
      if (!step.date) return false
      return normalizeDate(step.date) === dateStr
    })
    
    const completedSteps = daySteps.filter(s => s.completed).length
    const totalSteps = daySteps.length
    
    // Total tasks (habits + steps)
    const totalTasks = totalHabits + totalSteps
    const completedTasks = completedHabits + completedSteps
    
    return {
      total: totalTasks,
      completed: completedTasks,
      isComplete: totalTasks > 0 && completedTasks === totalTasks,
      // Also return separate counts for display
      totalSteps,
      completedSteps,
      totalHabits,
      completedHabits
    }
  }, [habits, dailySteps])
  
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
  
  // Handle day click - toggle between day and week view
  const handleDayClick = useCallback((date: Date) => {
    const dateStr = getLocalDateString(date)
    const currentSelectedStr = selectedDayDate ? getLocalDateString(selectedDayDate) : null
    
    if (currentSelectedStr === dateStr) {
      // Click on same day = back to week view
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
  
  const weekEndDate = weekDays[6]
  
  // Format header text
  const headerText = useMemo(() => {
    // If a day is selected, show that day's date
    if (selectedDayDate) {
      return selectedDayDate.toLocaleDateString(localeCode, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    }
    // Week range - "1. - 7. December 2025"
    const startDay = currentWeekStart.getDate()
    const endDay = weekEndDate.getDate()
    const month = weekEndDate.toLocaleDateString(localeCode, { month: 'long' })
    const year = weekEndDate.getFullYear()
    return `${startDay}. - ${endDay}. ${month} ${year}`
  }, [currentWeekStart, weekEndDate, localeCode, selectedDayDate])
  
  // Check if we're in current week
  const currentWeekStartDate = getWeekStart(new Date())
  const isCurrentWeek = getLocalDateString(currentWeekStart) === getLocalDateString(currentWeekStartDate)
  
  // Go to current week
  const handleGoToCurrentWeek = useCallback(() => {
    setCurrentWeekStart(currentWeekStartDate)
    setSelectedDayDate(null)
  }, [currentWeekStartDate])
  
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
    <div className="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 overflow-y-auto bg-primary-50">
      {/* Header with date/week */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-black capitalize font-playful">
            {headerText}
          </h1>
          {selectedDayDate && (
            <span 
              onClick={() => setSelectedDayDate(null)}
              className="text-xs sm:text-sm text-gray-600 cursor-pointer hover:text-gray-800 transition-colors"
            >
              {t('focus.clickAgainToDeselect') || 'Klikni znovu pro zrušení výběru'}
            </span>
          )}
        </div>
        {!isCurrentWeek && !selectedDayDate && (
          <button
            onClick={handleGoToCurrentWeek}
            className="btn-playful-base px-3 py-1.5 text-xs sm:text-sm font-semibold text-black bg-primary-50 hover:bg-primary-100"
          >
            {t('focus.today')}
          </button>
        )}
      </div>
      
      {/* Timeline */}
      {((visibleSections?.quickOverview ?? true) !== false) && (
        <div className="box-playful-highlight p-4 sm:p-6">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Prev button */}
          <button
            onClick={handlePrevWeek}
            className="btn-playful-base w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white hover:bg-primary-50 flex-shrink-0 p-0"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
          </button>
          
          {/* Days */}
          <div className="flex items-center gap-2 flex-1 justify-center min-w-0">
            {/* Timeline line */}
            <div className="relative flex items-center w-full max-w-2xl z-0">
              <div className="absolute left-2 right-2 h-1 bg-primary-200 top-4" />
              
              <div className="relative flex justify-between w-full z-0">
                {weekDays.map((day) => {
                  const dateStr = getLocalDateString(day)
                  const isToday = dateStr === todayStr
                  const isSelected = selectedDayDate && getLocalDateString(selectedDayDate) === dateStr
                  const stats = getDayStats(day)
                  const isPast = day < today
                  const isFuture = day > today
                  
                  // Calculate completion percentage (only for past days)
                  // Use exact percentage for pie chart, rounded for display
                  const completionPercentageExact = stats.total > 0 && isPast
                    ? (stats.completed / stats.total) * 100 
                    : 0
                  const completionPercentage = Math.round(completionPercentageExact)
                  
                  // Determine color based on day type and completion percentage - Playful style
                  let dotBg = 'bg-gray-200'
                  let dotBorder = 'border-4 border-gray-300'
                  let textColor = 'text-gray-500'
                  let dayNumberColor = 'text-gray-700'
                  let fractionColor = 'text-gray-400'
                  
                  if (isToday) {
                    // Today - primary color
                    dotBg = 'bg-primary-500'
                    dotBorder = isSelected ? 'border-4 border-primary-700' : 'border-4 border-primary-500'
                    textColor = isSelected ? 'text-primary-600' : 'text-black'
                    dayNumberColor = isSelected ? 'text-primary-600' : 'text-black'
                    fractionColor = isSelected ? 'text-primary-600' : 'text-gray-500'
                  } else if (isFuture) {
                    // Future days - gray
                    dotBg = 'bg-gray-200'
                    dotBorder = 'border-4 border-gray-300'
                    textColor = 'text-gray-500'
                    dayNumberColor = 'text-gray-700'
                    fractionColor = 'text-gray-400'
                  } else if (isPast) {
                    // Past days - always show percentage (even if 0 steps)
                    if (stats.total > 0) {
                      if (completionPercentage === 100) {
                        // 100% - primary full with checkmark
                        dotBg = 'bg-primary-600'
                        dotBorder = isSelected ? 'border-4 border-primary-700' : 'border-4 border-primary-600'
                        textColor = isSelected ? 'text-primary-600' : 'text-black'
                        dayNumberColor = isSelected ? 'text-primary-600' : 'text-black'
                        fractionColor = isSelected ? 'text-primary-600' : 'text-gray-500'
                      } else if (completionPercentage === 0) {
                        // 0% - white background with X mark in primary color
                        dotBg = 'bg-white'
                        dotBorder = isSelected ? 'border-4 border-primary-700' : 'border-4 border-primary-500'
                        textColor = isSelected ? 'text-primary-600' : 'text-black'
                        dayNumberColor = isSelected ? 'text-primary-600' : 'text-black'
                        fractionColor = isSelected ? 'text-primary-600' : 'text-gray-500'
                      } else {
                        // 1-99% - white with primary border
                        dotBg = 'bg-white'
                        dotBorder = isSelected ? 'border-4 border-primary-700' : 'border-4 border-primary-500'
                        textColor = isSelected ? 'text-primary-600' : 'text-black'
                        dayNumberColor = isSelected ? 'text-primary-600' : 'text-black'
                        fractionColor = isSelected ? 'text-primary-600' : 'text-gray-500'
                      }
                    } else {
                      // Past with no tasks - show 0% with white background and primary border
                      dotBg = 'bg-white'
                      dotBorder = isSelected ? 'border-4 border-primary-700' : 'border-4 border-primary-500'
                      textColor = isSelected ? 'text-primary-600' : 'text-black'
                      dayNumberColor = isSelected ? 'text-primary-600' : 'text-black'
                      fractionColor = isSelected ? 'text-primary-600' : 'text-gray-500'
                    }
                  }
                  
                  return (
                    <div
                      key={dateStr}
                      onClick={() => handleDayClick(day)}
                      className="flex flex-col items-center group min-w-0 flex-1 cursor-pointer"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleDayClick(day)
                        }
                      }}
                    >
                      {/* Dot */}
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all relative z-10 ${dotBg} ${dotBorder}`}>
                        {isPast && (
                          <>
                            {stats.total > 0 && completionPercentage === 100 && (
                              <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={3} />
                            )}
                            {stats.total > 0 && completionPercentage === 0 && (
                              <X className="w-6 h-6 sm:w-7 sm:h-7 text-primary-600" strokeWidth={3} />
                            )}
                            {stats.total > 0 && completionPercentage > 0 && completionPercentage < 100 && (
                              <div className="text-xs sm:text-sm font-bold text-primary-600">
                                {completionPercentage}%
                              </div>
                            )}
                            {stats.total === 0 && (
                              <X className="w-6 h-6 sm:w-7 sm:h-7 text-primary-600" strokeWidth={3} />
                            )}
                          </>
                        )}
                      </div>
                      
                      {/* Day name */}
                      <span className={`text-xs sm:text-sm font-semibold mt-2 uppercase ${textColor}`}>
                        {dayNamesShort[day.getDay()]}
                      </span>
                      
                      {/* Day number */}
                      <span className={`text-base sm:text-lg font-bold ${dayNumberColor}`}>
                        {day.getDate()}
                      </span>
                      
                      {/* Steps count - always show (only steps, not habits) */}
                      <div className="flex items-center gap-1 justify-center">
                        <Footprints className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary-600" />
                        <span className={`text-[10px] sm:text-xs ${fractionColor}`}>
                          {stats.completedSteps}/{stats.totalSteps}
                        </span>
                      </div>
                      
                      {/* Compact habit icons and checkboxes */}
                      {(() => {
                        // Get habits scheduled for this day
                        const dayHabits = habits.filter(habit => isHabitScheduledForDay(habit, day))
                        
                        if (dayHabits.length === 0) return null
                        
                        return (
                          <div className="flex flex-col items-center gap-0.5 sm:gap-1 mt-1.5">
                            {/* Icons row */}
                            <div className="flex items-center justify-center gap-0.5 sm:gap-1 flex-wrap max-w-full">
                              {dayHabits.slice(0, 4).map((habit) => {
                                const IconComponent = getIconComponent(habit.icon || 'Target')
                                return (
                                  <div
                                    key={habit.id}
                                    className="flex-shrink-0 w-3 h-3 sm:w-4 sm:h-4 flex items-center justify-center"
                                    title={habit.name}
                                  >
                                    <IconComponent className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                                  </div>
                                )
                              })}
                              {dayHabits.length > 4 && (
                                <span className="text-[8px] sm:text-[10px] text-gray-500 ml-0.5">
                                  +{dayHabits.length - 4}
                                </span>
                              )}
                            </div>
                            
                            {/* Checkboxes row */}
                            <div className="flex items-center justify-center gap-0.5 sm:gap-1 flex-wrap max-w-full">
                              {dayHabits.slice(0, 4).map((habit) => {
                                const habitDateStr = getLocalDateString(day)
                                const isHabitCompleted = habit.habit_completions && habit.habit_completions[habitDateStr] === true
                                const isHabitLoading = loadingHabits.has(`${habit.id}-${habitDateStr}`)
                                const isHabitFuture = day > today
                                
                                return (
                                  <button
                                    key={habit.id}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (handleHabitToggle && !isHabitLoading && !isHabitFuture) {
                                        handleHabitToggle(habit.id, habitDateStr)
                                      }
                                    }}
                                    disabled={isHabitLoading || isHabitFuture}
                                    className={`flex-shrink-0 w-3 h-3 sm:w-4 sm:h-4 rounded-sm flex items-center justify-center transition-all border ${
                                      isHabitCompleted
                                        ? 'bg-primary-500 border-primary-600'
                                        : isHabitFuture
                                        ? 'bg-gray-200 border-gray-300 opacity-50'
                                        : 'bg-white border-primary-400 hover:bg-primary-50'
                                    }`}
                                    title={isHabitFuture ? (t('focus.futureDay') || 'Budoucí den') : habit.name}
                                  >
                                    {isHabitLoading ? (
                                      <svg className="animate-spin h-2 w-2 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                    ) : isHabitCompleted ? (
                                      <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" strokeWidth={3} />
                                    ) : null}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          
          {/* Next button */}
          <button
            onClick={handleNextWeek}
            className="btn-playful-base w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white hover:bg-primary-50 flex-shrink-0 p-0"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
          </button>
        </div>
      </div>
      )}
      
      {/* Content based on selection - always show unless explicitly hidden */}
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
            visibleSections={visibleSections}
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
            visibleSections={visibleSections}
          />
        </div>
      )}
    </div>
  )
}

