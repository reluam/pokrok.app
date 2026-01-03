'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Check, X, ChevronLeft, ChevronRight, Flame, CheckCircle2, Target } from 'lucide-react'
import { getLocalDateString, normalizeDate } from '../../../main/components/utils/dateHelpers'
import { isHabitScheduledForDay } from '../utils/habitHelpers'
import { TodayFocusSection } from './TodayFocusSection'

interface UnifiedDayViewProps {
  player?: any
  goals?: any[]
  habits?: any[]
  dailySteps?: any[]
  handleItemClick?: (item: any, type: 'step' | 'habit' | 'goal' | 'stat') => void
  handleHabitToggle?: (habitId: string, date?: string) => Promise<void>
  handleStepToggle?: (stepId: string, completed: boolean) => Promise<void>
  loadingHabits?: Set<string>
  loadingSteps?: Set<string>
  animatingSteps?: Set<string>
  onOpenStepModal?: (date?: string) => void
  onNavigateToHabits?: () => void
  onNavigateToSteps?: () => void
  onStepDateChange?: (stepId: string, newDate: string) => Promise<void>
  onStepTimeChange?: (stepId: string, minutes: number) => Promise<void>
  onDailyStepsUpdate?: (steps: any[]) => void
}

export function UnifiedDayView({
  player,
  goals = [],
  habits = [],
  dailySteps = [],
  handleItemClick = () => {},
  handleHabitToggle,
  handleStepToggle,
  loadingHabits = new Set(),
  loadingSteps = new Set(),
  animatingSteps = new Set(),
  onOpenStepModal,
  onNavigateToHabits,
  onNavigateToSteps,
  onStepDateChange,
  onStepTimeChange,
  onDailyStepsUpdate
}: UnifiedDayViewProps) {
  const t = useTranslations()
  const locale = useLocale()
  const localeCode = locale === 'cs' ? 'cs-CZ' : 'en-US'
  
  // Get current week start (Monday)
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
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
  
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getWeekStart(new Date()))
  
  // null = week view, Date = specific day view
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null)
  
  // Navigation
  const handlePrevWeek = useCallback(() => {
    const newStart = new Date(currentWeekStart)
    newStart.setDate(newStart.getDate() - 7)
    setCurrentWeekStart(newStart)
    setSelectedDayDate(null)
  }, [currentWeekStart])

  const handleNextWeek = useCallback(() => {
    const newStart = new Date(currentWeekStart)
    newStart.setDate(newStart.getDate() + 7)
    setCurrentWeekStart(newStart)
    setSelectedDayDate(null)
  }, [currentWeekStart])
  
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
  
  // Week days
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
  
  // Day names - use translations
  const dayNamesShort = [
    t('daysShort.sun'), t('daysShort.mon'), t('daysShort.tue'), t('daysShort.wed'),
    t('daysShort.thu'), t('daysShort.fri'), t('daysShort.sat')
  ]
  
  // Calculate stats for a specific day
  const getDayStats = useCallback((date: Date) => {
    const dateStr = getLocalDateString(date)
    
    // Habits for this day - use helper function
    const dayHabits = habits.filter(habit => {
      return isHabitScheduledForDay(habit, date)
    })
    
    const completedHabits = dayHabits.filter(h => 
      h.habit_completions && h.habit_completions[dateStr] === true
    ).length
    
    // Steps for this day
    const daySteps = dailySteps.filter(step => {
      if (!step.date) return false
      return normalizeDate(step.date) === dateStr
    })
    
    const completedSteps = daySteps.filter(s => s.completed).length
    const totalTasks = dayHabits.length + daySteps.length
    const completedTasks = completedHabits + completedSteps
    
    return {
      total: totalTasks,
      completed: completedTasks,
      isComplete: totalTasks > 0 && completedTasks === totalTasks
    }
  }, [habits, dailySteps])
  
  // Calculate week stats
  const weekStats = useMemo(() => {
    let totalSteps = 0
    let completedSteps = 0
    let totalHabits = 0
    let completedHabits = 0
    let streak = 0
    
    weekDays.forEach(day => {
      const stats = getDayStats(day)
      const dateStr = getLocalDateString(day)
      const dayOfWeek = day.getDay()
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const dayName = dayNames[dayOfWeek]
      
      // Count steps
      const daySteps = dailySteps.filter(step => {
        if (!step.date) return false
        return normalizeDate(step.date) === dateStr
      })
      totalSteps += daySteps.length
      completedSteps += daySteps.filter(s => s.completed).length
      
      // Count habits - use helper function
      // Also check if habit has started (date is after or equal to start_date)
      const dayDate = new Date(day)
      dayDate.setHours(0, 0, 0, 0)
      const dayHabits = habits.filter(habit => {
        // Check if habit has started
        const habitStartDateStr = (habit as any).start_date || habit.created_at
        if (habitStartDateStr) {
          const habitStartDate = new Date(habitStartDateStr)
          habitStartDate.setHours(0, 0, 0, 0)
          if (dayDate < habitStartDate) {
            return false // Habit hasn't started yet, don't count it
          }
        }
        return isHabitScheduledForDay(habit, day)
      })
      totalHabits += dayHabits.length
      completedHabits += dayHabits.filter(h => 
        h.habit_completions && h.habit_completions[dateStr] === true
      ).length
    })
    
    // Calculate streak (consecutive completed days up to today)
    for (let i = 0; i < weekDays.length; i++) {
      const day = weekDays[i]
      if (day > today) break
      
      const stats = getDayStats(day)
      if (stats.isComplete && stats.total > 0) {
        streak++
      } else if (day <= today) {
        streak = 0 // Reset if incomplete day before today
      }
    }
    
    const totalTasks = totalSteps + totalHabits
    const completedTasks = completedSteps + completedHabits
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    
    return {
      progress,
      streak,
      completedSteps,
      totalSteps,
      completedHabits,
      totalHabits,
      completedTasks,
      totalTasks
    }
  }, [weekDays, getDayStats, dailySteps, habits, today])
  
  // Day stats for selected day
  const dayStats = useMemo(() => {
    if (!selectedDayDate) return null
    
    const dateStr = getLocalDateString(selectedDayDate)
    const dayOfWeek = selectedDayDate.getDay()
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayName = dayNames[dayOfWeek]
    
    // Steps
    const daySteps = dailySteps.filter(step => {
      if (!step.date) return false
      return normalizeDate(step.date) === dateStr
    })
    const completedSteps = daySteps.filter(s => s.completed).length
    
    // Habits - use helper function
    const dayHabits = habits.filter(habit => {
      return isHabitScheduledForDay(habit, selectedDayDate)
    })
    const completedHabits = dayHabits.filter(h => 
      h.habit_completions && h.habit_completions[dateStr] === true
    ).length
    
    const totalTasks = daySteps.length + dayHabits.length
    const completedTasks = completedSteps + completedHabits
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    
    return {
      progress,
      completedSteps,
      totalSteps: daySteps.length,
      completedHabits,
      totalHabits: dayHabits.length,
      completedTasks,
      totalTasks
    }
  }, [selectedDayDate, dailySteps, habits])
  
  // Format header text
  const headerText = useMemo(() => {
    if (selectedDayDate) {
      return selectedDayDate.toLocaleDateString(localeCode, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    } else {
      // Week range - "24. - 30. listopadu 2025"
      const startDay = currentWeekStart.getDate()
      const endDay = weekEndDate.getDate()
      const month = weekEndDate.toLocaleDateString(localeCode, { month: 'long' })
      const year = weekEndDate.getFullYear()
      return `${startDay}. - ${endDay}. ${month} ${year}`
    }
  }, [selectedDayDate, currentWeekStart, weekEndDate, localeCode])
  
  // Display stats
  const displayStats = selectedDayDate ? dayStats : weekStats
  
  // Check if we're in current week
  const currentWeekStartDate = getWeekStart(new Date())
  const isCurrentWeek = getLocalDateString(currentWeekStart) === getLocalDateString(currentWeekStartDate)
  
  // Go to current week
  const handleGoToCurrentWeek = useCallback(() => {
    setCurrentWeekStart(currentWeekStartDate)
    setSelectedDayDate(null)
  }, [currentWeekStartDate])
  
  // Track displayed steps
  const [displayedStepIds, setDisplayedStepIds] = useState<Set<string>>(new Set())
  const handleDisplayedStepsChange = useCallback((stepIds: Set<string>) => {
    setDisplayedStepIds(stepIds)
  }, [])
  
  return (
    <div className="w-full flex flex-col p-6 space-y-4 bg-primary-50/30">
      {/* Header with date/week */}
      <div className="flex items-center justify-center gap-2">
        <h1 className="text-2xl font-bold text-gray-800 capitalize">
          {headerText}
        </h1>
        {!isCurrentWeek && (
          <button
            onClick={handleGoToCurrentWeek}
            className="px-3 py-1 text-xs font-medium text-primary-600 bg-primary-100 hover:bg-primary-200 rounded-full transition-colors"
          >
            {t('focus.today')}
          </button>
        )}
      </div>
      
      {/* Timeline */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-primary-100 relative z-0">
        <div className="flex items-center justify-between">
          {/* Prev button */}
          <button
            onClick={handlePrevWeek}
            className="p-2 hover:bg-primary-100 rounded-lg transition-colors text-gray-500 hover:text-primary-600"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          {/* Days */}
          <div className="flex items-center gap-2 flex-1 justify-center">
            {/* Timeline line */}
            <div className="relative flex items-center w-full max-w-xl z-0">
              <div className="absolute left-4 right-4 h-0.5 bg-gray-200 top-3" />
              
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
                  
                  // Determine color based on day type and completion percentage
                  let dotColor = 'bg-gray-200' // Default for future
                  let textColor = 'text-gray-500' // Default - black/gray until selected
                  let dayNumberColor = 'text-gray-900' // Default - black until selected
                  let fractionColor = 'text-gray-400' // Default - gray until selected
                  
                  if (isToday) {
                    // Today - always orange dot, but text only colored when selected
                    dotColor = isSelected ? 'bg-primary-500 ring-4 ring-primary-200' : 'bg-primary-500'
                    textColor = isSelected ? 'text-primary-600' : 'text-gray-500'
                    dayNumberColor = isSelected ? 'text-primary-600' : 'text-gray-900'
                    fractionColor = isSelected ? 'text-primary-600' : 'text-gray-400'
                  } else if (isFuture) {
                    // Future days - always gray
                    dotColor = 'bg-gray-200'
                    textColor = 'text-gray-500'
                    dayNumberColor = 'text-gray-700'
                    fractionColor = 'text-gray-400'
                  } else if (isPast) {
                    // Past days - color based on completion percentage
                    if (stats.total > 0) {
                      if (completionPercentage === 100) {
                        // 100% - primary full with checkmark
                        dotColor = isSelected ? 'bg-primary-600 ring-4 ring-primary-200' : 'bg-primary-600'
                        textColor = isSelected ? 'text-primary-600' : 'text-gray-500'
                        dayNumberColor = isSelected ? 'text-primary-600' : 'text-gray-900'
                        fractionColor = isSelected ? 'text-primary-600' : 'text-gray-400'
                      } else if (completionPercentage === 0) {
                        // 0% - white background with X mark in primary color
                        dotColor = isSelected ? 'bg-white ring-4 ring-primary-200' : 'bg-white'
                        textColor = isSelected ? 'text-primary-600' : 'text-gray-500'
                        dayNumberColor = isSelected ? 'text-primary-600' : 'text-gray-900'
                        fractionColor = isSelected ? 'text-primary-600' : 'text-gray-400'
                      } else {
                        // 1-99% - pie chart (will be rendered separately)
                        dotColor = 'bg-transparent' // Transparent background for pie chart
                        textColor = isSelected ? 'text-primary-600' : 'text-gray-500'
                        dayNumberColor = isSelected ? 'text-primary-600' : 'text-gray-900'
                        fractionColor = isSelected ? 'text-primary-600' : 'text-gray-400'
                      }
                    } else {
                      // Past with no tasks - gray
                      dotColor = 'bg-gray-300'
                      textColor = 'text-gray-500'
                      dayNumberColor = 'text-gray-900'
                      fractionColor = 'text-gray-400'
                    }
                  }
                  
                  return (
                    <button
                      key={dateStr}
                      onClick={() => handleDayClick(day)}
                      className="flex flex-col items-center group"
                    >
                      {/* Dot */}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all relative z-0 ${dotColor === 'bg-transparent' ? 'bg-white' : dotColor}`}>
                        {isPast && stats.total > 0 && (
                          <>
                            {completionPercentage === 100 && (
                              <Check className="w-3 h-3 text-white" strokeWidth={3} />
                            )}
                            {completionPercentage === 0 && (
                              <X className="w-6 h-6 text-primary-600" strokeWidth={2.5} />
                            )}
                            {completionPercentage > 0 && completionPercentage < 100 && (() => {
                              const radius = 10
                              const circumference = 2 * Math.PI * radius
                              // Use exact percentage for accurate pie chart
                              const completedLength = circumference * (completionPercentageExact / 100)
                              const remainingLength = circumference - completedLength
                              
                              return (
                                // Pie chart using SVG - only completed portion on white background
                                <svg className="w-6 h-6 absolute inset-0" viewBox="0 0 24 24">
                                  {/* Gray circle border - same thickness and color as timeline */}
                                  <circle
                                    cx="12"
                                    cy="12"
                                    r={radius}
                                    fill="none"
                                    stroke="#e5e7eb"
                                    strokeWidth="2"
                                  />
                                  {/* Completed portion (pie slice) - primary color only */}
                                  <circle
                                    cx="12"
                                    cy="12"
                                    r={radius}
                                    fill="none"
                                    stroke="var(--color-primary-500, #E8871E)"
                                    strokeWidth="4"
                                    strokeDasharray={`${completedLength} ${remainingLength}`}
                                    strokeDashoffset={0}
                                    transform="rotate(-90 12 12)"
                                    strokeLinecap="round"
                                  />
                                </svg>
                              )
                            })()}
                          </>
                        )}
                      </div>
                      
                      {/* Day name */}
                      <span className={`text-xs font-semibold mt-1 uppercase ${textColor}`}>
                        {dayNamesShort[day.getDay()]}
                      </span>
                      
                      {/* Day number */}
                      <span className={`text-lg font-bold ${dayNumberColor}`}>
                        {day.getDate()}
                      </span>
                      
                      {/* Tasks count */}
                      <span className={`text-[10px] ${fractionColor}`}>
                        {stats.completed}/{stats.total}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          
          {/* Next button */}
          <button
            onClick={handleNextWeek}
            className="p-2 hover:bg-primary-100 rounded-lg transition-colors text-gray-500 hover:text-primary-600"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Stats bar */}
      {displayStats && (
        <div className="flex items-center justify-around py-1">
          {/* Progress */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-primary-500">{displayStats.progress}%</span>
              <div className="w-24 h-1.5 bg-primary-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-500 rounded-full transition-all"
                  style={{ width: `${displayStats.progress}%` }}
                />
              </div>
            </div>
            <span className="text-[10px] text-gray-500">{t('progress.title')}</span>
          </div>
          
          {/* Completed */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-primary-500" />
              <span className="text-xl font-bold text-gray-800">{displayStats.completedTasks}</span>
              <span className="text-xs text-gray-400">/{displayStats.totalTasks}</span>
            </div>
            <span className="text-[10px] text-gray-500">{t('progress.completed')}</span>
          </div>
        </div>
      )}
      
      {/* Focus Section */}
      <TodayFocusSection
        goals={goals}
        dailySteps={dailySteps}
        habits={habits}
        selectedDayDate={selectedDayDate || currentWeekStart}
        handleStepToggle={handleStepToggle || (async () => {})}
        handleHabitToggle={handleHabitToggle}
        handleItemClick={handleItemClick}
        loadingSteps={loadingSteps}
        animatingSteps={animatingSteps}
        loadingHabits={loadingHabits}
        player={player}
        todaySteps={[]}
        onOpenStepModal={onOpenStepModal}
        onDisplayedStepsChange={handleDisplayedStepsChange}
        isWeekView={!selectedDayDate}
        weekStartDate={currentWeekStart}
        weekSelectedDayDate={selectedDayDate}
        onNavigateToHabits={onNavigateToHabits}
        onNavigateToSteps={onNavigateToSteps}
        onStepDateChange={onStepDateChange}
        onStepTimeChange={onStepTimeChange}
        onDailyStepsUpdate={onDailyStepsUpdate}
      />
    </div>
  )
}

