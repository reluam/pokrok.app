'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Check, ChevronLeft, ChevronRight, Flame, CheckCircle2, Target } from 'lucide-react'
import { getLocalDateString, normalizeDate } from '../utils/dateHelpers'
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
  onOpenStepModal?: (date?: string) => void
  onNavigateToHabits?: () => void
  onNavigateToSteps?: () => void
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
  onOpenStepModal,
  onNavigateToHabits,
  onNavigateToSteps
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
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
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
  
  // Day names
  const dayNamesShort = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So']
  
  // Calculate stats for a specific day
  const getDayStats = useCallback((date: Date) => {
    const dateStr = getLocalDateString(date)
    const dayOfWeek = date.getDay()
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayName = dayNames[dayOfWeek]
    
    // Habits for this day
    const dayHabits = habits.filter(habit => {
      if (habit.frequency === 'daily') return true
      if (habit.frequency === 'custom' && habit.selected_days?.includes(dayName)) return true
      return false
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
      
      // Count habits
      const dayHabits = habits.filter(habit => {
        if (habit.frequency === 'daily') return true
        if (habit.frequency === 'custom' && habit.selected_days?.includes(dayName)) return true
        return false
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
    
    // Habits
    const dayHabits = habits.filter(habit => {
      if (habit.frequency === 'daily') return true
      if (habit.frequency === 'custom' && habit.selected_days?.includes(dayName)) return true
      return false
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
      // Week range
      const startStr = currentWeekStart.toLocaleDateString(localeCode, { day: 'numeric', month: 'short' })
      const endStr = weekEndDate.toLocaleDateString(localeCode, { day: 'numeric', month: 'short', year: 'numeric' })
      return `${startStr} - ${endStr}`
    }
  }, [selectedDayDate, currentWeekStart, weekEndDate, localeCode])
  
  // Display stats
  const displayStats = selectedDayDate ? dayStats : weekStats
  
  // Track displayed steps
  const [displayedStepIds, setDisplayedStepIds] = useState<Set<string>>(new Set())
  const handleDisplayedStepsChange = useCallback((stepIds: Set<string>) => {
    setDisplayedStepIds(stepIds)
  }, [])
  
  return (
    <div className="w-full h-full flex flex-col p-6 space-y-4 overflow-y-auto bg-orange-50/30">
      {/* Header with date/week */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 capitalize">
          {headerText}
        </h1>
      </div>
      
      {/* Timeline */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-orange-100">
        <div className="flex items-center justify-between">
          {/* Prev button */}
          <button
            onClick={handlePrevWeek}
            className="p-2 hover:bg-orange-100 rounded-lg transition-colors text-gray-500 hover:text-orange-600"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          {/* Days */}
          <div className="flex items-center gap-2 flex-1 justify-center">
            {/* Timeline line */}
            <div className="relative flex items-center w-full max-w-xl">
              <div className="absolute left-4 right-4 h-0.5 bg-gray-200 top-3" />
              
              <div className="relative flex justify-between w-full">
                {weekDays.map((day) => {
                  const dateStr = getLocalDateString(day)
                  const isToday = dateStr === todayStr
                  const isSelected = selectedDayDate && getLocalDateString(selectedDayDate) === dateStr
                  const stats = getDayStats(day)
                  const isPast = day < today
                  const isFuture = day > today
                  
                  return (
                    <button
                      key={dateStr}
                      onClick={() => handleDayClick(day)}
                      className="flex flex-col items-center z-10 group"
                    >
                      {/* Dot */}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        stats.isComplete && isPast
                          ? isSelected 
                            ? 'bg-green-500 ring-4 ring-green-200'
                            : 'bg-green-500'
                          : isSelected
                            ? 'bg-orange-500 ring-4 ring-orange-200'
                            : isToday
                              ? 'bg-orange-500'
                              : isPast && stats.total > 0
                                ? 'bg-gray-300'
                                : 'bg-gray-200'
                      }`}>
                        {stats.isComplete && isPast && (
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        )}
                      </div>
                      
                      {/* Day name */}
                      <span className={`text-xs font-semibold mt-1 uppercase ${
                        isSelected ? 'text-orange-600' : isToday ? 'text-orange-500' : 'text-gray-500'
                      }`}>
                        {dayNamesShort[day.getDay()]}
                      </span>
                      
                      {/* Day number */}
                      <span className={`text-lg font-bold ${
                        isSelected ? 'text-orange-600' : isToday ? 'text-orange-500' : 'text-gray-700'
                      }`}>
                        {day.getDate()}
                      </span>
                      
                      {/* Tasks count */}
                      <span className={`text-[10px] ${
                        stats.completed === stats.total && stats.total > 0 
                          ? 'text-green-600' 
                          : 'text-gray-400'
                      }`}>
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
            className="p-2 hover:bg-orange-100 rounded-lg transition-colors text-gray-500 hover:text-orange-600"
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
              <span className="text-xl font-bold text-orange-500">{displayStats.progress}%</span>
              <div className="w-24 h-1.5 bg-orange-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 rounded-full transition-all"
                  style={{ width: `${displayStats.progress}%` }}
                />
              </div>
            </div>
            <span className="text-[10px] text-gray-500">Pokrok</span>
          </div>
          
          {/* Completed */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-orange-500" />
              <span className="text-xl font-bold text-gray-800">{displayStats.completedTasks}</span>
              <span className="text-xs text-gray-400">/{displayStats.totalTasks}</span>
            </div>
            <span className="text-[10px] text-gray-500">Dokončeno</span>
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
      />
    </div>
  )
}

