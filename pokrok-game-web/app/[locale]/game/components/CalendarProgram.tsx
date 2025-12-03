'use client'

import { useTranslations, useLocale } from 'next-intl'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle, Circle, Target, Footprints, Check } from 'lucide-react'

// --- DATUM UTIL ---
function normalizeDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  // If it's already a YYYY-MM-DD string, return it directly
  if (typeof date === 'string') {
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return date;
    }
    // If it's an ISO string with time, extract date part directly
    // This avoids timezone conversion issues
    if (date.includes('T')) {
      const datePart = date.split('T')[0];
      if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return datePart;
      }
    }
    // Try to parse as Date, but use UTC date components to avoid timezone shift
    // PostgreSQL DATE is stored without time, so when returned as ISO string with time,
    // the date part represents the actual stored date regardless of timezone
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) {
      // Use UTC date components for ISO strings to preserve the date as stored
      // This handles the case where PostgreSQL returns DATE as ISO string with midnight UTC
      if (date.includes('T') && date.includes('Z')) {
        // UTC ISO string - use UTC components to preserve the date
        const y = parsed.getUTCFullYear();
        const m = String(parsed.getUTCMonth() + 1).padStart(2, '0');
        const d = String(parsed.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      } else {
        // Local date string or without timezone - use local components
        const y = parsed.getFullYear();
        const m = String(parsed.getMonth() + 1).padStart(2, '0');
        const d = String(parsed.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    }
    return '';
  }
  
  // If it's a Date object, check if it's likely from PostgreSQL DATE (midnight UTC)
  // PostgreSQL DATE values are often returned as Date objects with midnight UTC
  if (date instanceof Date && !isNaN(date.getTime())) {
    // Check if this looks like a PostgreSQL DATE (midnight UTC, no time component)
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const seconds = date.getUTCSeconds();
    const milliseconds = date.getUTCMilliseconds();
    
    // If it's exactly midnight UTC with no time component, use UTC date components
    // This preserves the date as stored in PostgreSQL
    if (hours === 0 && minutes === 0 && seconds === 0 && milliseconds === 0) {
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, '0');
      const d = String(date.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    } else {
      // Has time component, use local date components
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }
  
  return '';
}

interface CalendarProgramProps {
  player: any
  goals: any[]
  habits: any[]
  dailySteps: any[]
  onHabitsUpdate?: (habits: any[]) => void
  onDailyStepsUpdate?: (steps: any[]) => void
  viewMode?: 'day' | 'week' | 'month' // Optional viewMode prop to control from parent
  onDateClick?: () => void // Callback for date header click
}

export function CalendarProgram({
  player,
  goals,
  habits,
  dailySteps,
  onHabitsUpdate,
  onDailyStepsUpdate,
  viewMode: viewModeProp,
  onDateClick
}: CalendarProgramProps) {
  const t = useTranslations()
  const locale = useLocale()
  const localeCode = locale === 'cs' ? 'cs-CZ' : 'en-US'
  
  // Day names for calendar display
  const dayNames = [
    t('calendar.days.sunday'),
    t('calendar.days.monday'),
    t('calendar.days.tuesday'),
    t('calendar.days.wednesday'),
    t('calendar.days.thursday'),
    t('calendar.days.friday'),
    t('calendar.days.saturday')
  ]
  const dayNamesShort = [
    t('calendar.daysShort.sunday'),
    t('calendar.daysShort.monday'),
    t('calendar.daysShort.tuesday'),
    t('calendar.daysShort.wednesday'),
    t('calendar.daysShort.thursday'),
    t('calendar.daysShort.friday'),
    t('calendar.daysShort.saturday')
  ]
  
  // Loading states for toggles
  const [loadingSteps, setLoadingSteps] = useState<Set<string>>(new Set())
  const [loadingHabits, setLoadingHabits] = useState<Set<string>>(new Set())
  // Use prop if provided, otherwise use internal state
  const [internalViewMode, setInternalViewMode] = useState<'week' | 'month'>('week') // Default to week view
  const viewMode = viewModeProp ? (viewModeProp === 'day' ? 'week' : viewModeProp) : internalViewMode // Map 'day' to 'week' for calendar
  const setViewMode = viewModeProp ? (() => {}) : setInternalViewMode // If prop provided, disable internal state changes
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    // Get start of current week (Monday)
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    const weekStart = new Date(today)
    weekStart.setDate(diff)
    return weekStart
  })
  const [selectedDate, setSelectedDate] = useState<string | null>(() => {
    // Default to today's date
    return normalizeDate(new Date())
  })
  const [workflowResponses, setWorkflowResponses] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)

  // Color helper for compact numbers
  const getStatusColor = (completed: number, total: number) => {
    if (total === 0) return 'text-orange-500'
    if (completed === 0) return 'text-red-500'
    if (completed < total) return 'text-orange-500'
    return 'text-green-600'
  }

  // Helper: is habit scheduled for a specific date
  const isHabitScheduledForDate = useCallback((habit: any, date: Date, dateStr: string) => {
    // Always show flag wins
    if (habit.always_show) return true

    // If completed on that date, show regardless of schedule
    try {
      const completions = typeof habit.habit_completions === 'string'
        ? JSON.parse(habit.habit_completions)
        : habit.habit_completions
      if (completions && (completions[dateStr] === true || completions[dateStr] === 'true')) return true
    } catch {}

    // Daily frequency
    if (habit.frequency === 'daily') return true

    // Weekly / selected days handling (accept many formats)
    const jsDay = date.getDay() // 0=Sun..6=Sat
    const enDays = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
    const dayTokens = [
      String(jsDay),                    // '0'..'6'
      String(jsDay === 0 ? 7 : jsDay), // '1'..'7' (Mon=1)
      enDays[jsDay],
      dayNames[jsDay],
      dayNamesShort[jsDay]
    ].map(s => (typeof s === 'string' ? s.toLowerCase() : s))

    let selectedDays: any = habit.selected_days
    if (typeof selectedDays === 'string') {
      // Try JSON parse first; if fails, split by comma
      try {
        const parsed = JSON.parse(selectedDays)
        selectedDays = parsed
      } catch {
        selectedDays = selectedDays.split(',').map((s: string) => s.trim())
      }
    }
    if (Array.isArray(selectedDays)) {
      const normalized = selectedDays.map(v => (typeof v === 'string' ? v.toLowerCase() : String(v)))
      if (dayTokens.some(t => normalized.includes(t))) return true
    }

    // Specific date lists (selected_dates, dates)
    const specificDates = habit.selected_dates || habit.dates
    if (specificDates) {
      const list = Array.isArray(specificDates) ? specificDates : []
      if (list.includes(dateStr)) return true
    }

    return false
  }, [dayNames, dayNamesShort])

  // Get month/year for display
  const monthYear = currentMonth.toLocaleDateString(localeCode, { month: 'long', year: 'numeric' })
  
  // Get first day of month and number of days - memoized to prevent unnecessary re-renders
  const firstDayOfMonth = useMemo(() => new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1), [currentMonth])
  const lastDayOfMonth = useMemo(() => new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0), [currentMonth])
  const daysInMonth = lastDayOfMonth.getDate()
  const startingDayOfWeek = firstDayOfMonth.getDay() // 0 = Sunday, adjust to Monday = 0
  const adjustedStartingDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1

  // Load workflow responses for the month or week
  useEffect(() => {
    const loadWorkflowResponses = async () => {
      if (!player?.user_id) return
      
      setLoading(true)
      try {
        let startDate: string
        let endDate: string
        
        if (viewMode === 'week') {
          const weekEnd = new Date(currentWeekStart)
          weekEnd.setDate(weekEnd.getDate() + 6)
          startDate = normalizeDate(currentWeekStart)
          endDate = normalizeDate(weekEnd)
        } else {
          startDate = normalizeDate(firstDayOfMonth)
          endDate = normalizeDate(lastDayOfMonth)
        }
        
        const response = await fetch(`/api/workflows/responses?userId=${player.user_id}&startDate=${startDate}&endDate=${endDate}`)
        if (response.ok) {
          const responses = await response.json()
          const responsesByDate: Record<string, any> = {}
          responses.forEach((r: any) => {
            responsesByDate[r.date] = r
          })
          setWorkflowResponses(responsesByDate)
        }
      } catch (error) {
        console.error('Error loading workflow responses:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadWorkflowResponses()
  }, [player?.user_id, viewMode, currentMonth, currentWeekStart, firstDayOfMonth, lastDayOfMonth])

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
    setSelectedDate(null)
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
    setSelectedDate(null)
  }

  // Navigate weeks
  const goToPreviousWeek = () => {
    const newWeekStart = new Date(currentWeekStart)
    newWeekStart.setDate(newWeekStart.getDate() - 7)
    setCurrentWeekStart(newWeekStart)
    setSelectedDate(null)
  }

  const goToNextWeek = () => {
    const newWeekStart = new Date(currentWeekStart)
    newWeekStart.setDate(newWeekStart.getDate() + 7)
    setCurrentWeekStart(newWeekStart)
    setSelectedDate(null)
  }

  const goToToday = () => {
    if (viewMode === 'week') {
      // Get start of current week (Monday)
      const today = new Date()
      const day = today.getDay()
      const diff = today.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
      const weekStart = new Date(today)
      weekStart.setDate(diff)
      setCurrentWeekStart(weekStart)
    } else {
      setCurrentMonth(new Date())
    }
    setSelectedDate(null)
  }

  // Get week range for display
  const getWeekRange = () => {
    const weekEnd = new Date(currentWeekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    const startStr = currentWeekStart.toLocaleDateString(localeCode, { day: 'numeric', month: 'long' })
    const endStr = weekEnd.toLocaleDateString(localeCode, { day: 'numeric', month: 'long', year: 'numeric' })
    return `${startStr} - ${endStr}`
  }

  // Get days of week
  const getWeekDays = () => {
    const days: Date[] = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(currentWeekStart)
      day.setDate(currentWeekStart.getDate() + i)
      days.push(day)
    }
    return days
  }

  // Get day stats
  const getDayStats = (date: Date) => {
    const dateStr = normalizeDate(date)
    const dateObj = new Date(date)
    dateObj.setHours(0, 0, 0, 0)
    // Get habits for this day (scheduled or completed that day)
    const dayHabits = habits.filter(h => isHabitScheduledForDate(h, dateObj, dateStr))
    // Count all habits (including always_show) for progress calculation
    // always_show habits are included in stats if they are scheduled for this day
    const countableHabits = dayHabits
    const completedHabits = countableHabits.filter(h => {
      // Handle different formats of habit_completions
      if (!h.habit_completions) return false
      // If it's a string, try to parse it
      if (typeof h.habit_completions === 'string') {
        try {
          const parsed = JSON.parse(h.habit_completions)
          return parsed[dateStr] === true
        } catch {
          return false
        }
      }
      // If it's an object, check directly
      if (typeof h.habit_completions === 'object') {
        return h.habit_completions[dateStr] === true || h.habit_completions[dateStr] === 'true'
      }
      return false
    }).length
    
    // Get steps for this day
    // All steps (completed and incomplete) are shown based on their scheduled date (date field)
    // This ensures tasks appear on the day they were scheduled, not when they were completed
    const daySteps = dailySteps.filter(s => {
      const stepDate = normalizeDate(s.date)
      
      // All steps are shown based on their scheduled date, regardless of completion status
      return stepDate === dateStr
    })
    const completedSteps = daySteps.filter(s => {
      // Count as completed if the step is completed (regardless of when it was completed)
      return s.completed === true
    }).length
    
    return {
      totalHabits: countableHabits.length, // Use countableHabits instead of dayHabits for stats
      completedHabits,
      totalSteps: daySteps.length,
      completedSteps,
      hasWorkflow: !!workflowResponses[dateStr]
    }
  }

  // Toggle habit completion
  const toggleHabit = async (habitId: string, date: string) => {
    // Add to loading set
    setLoadingHabits(prev => new Set(prev).add(habitId))
    
    try {
      const response = await fetch('/api/habits/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habitId,
          date,
          completed: (() => {
            const habit = habits.find(h => h.id === habitId)
            if (!habit?.habit_completions) return false
            const completions = typeof habit.habit_completions === 'string' 
              ? JSON.parse(habit.habit_completions) 
              : habit.habit_completions
            return completions[date] === true || completions[date] === 'true'
          })()
        })
      })
      
      if (response.ok) {
        const updatedHabit = await response.json()
        if (onHabitsUpdate && updatedHabit) {
          // Update the habit with the full updated data including habit_completions
          const updatedHabits = habits.map(h => 
            h.id === habitId ? { ...h, ...updatedHabit, habit_completions: updatedHabit.habit_completions || h.habit_completions } : h
          )
          onHabitsUpdate(updatedHabits)
        }
      }
    } catch (error) {
      console.error('Error toggling habit:', error)
    } finally {
      // Remove from loading set
      setLoadingHabits(prev => {
        const newSet = new Set(prev)
        newSet.delete(habitId)
        return newSet
      })
    }
  }

  // Toggle step completion
  const toggleStep = async (stepId: string) => {
    // Add to loading set
    setLoadingSteps(prev => new Set(prev).add(stepId))
    
    try {
      const step = dailySteps.find(s => s.id === stepId)
      if (!step) return
      
      const newCompletedStatus = !step.completed
      const completedAtValue = newCompletedStatus ? new Date().toISOString() : null
      
      const response = await fetch(`/api/daily-steps`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId,
          completed: newCompletedStatus,
          completedAt: completedAtValue
        })
      })
      
      if (response.ok) {
        const updatedStep = await response.json()
        if (onDailyStepsUpdate) {
          // Ensure completed_at is properly set
          const stepWithDate = {
            ...updatedStep,
            completed_at: newCompletedStatus ? (updatedStep.completed_at || completedAtValue) : null
          }
          const updatedSteps = dailySteps.map(s => s.id === stepId ? stepWithDate : s)
          onDailyStepsUpdate(updatedSteps)
        }
      }
    } catch (error) {
      console.error('Error toggling step:', error)
    } finally {
      // Remove from loading set
      setLoadingSteps(prev => {
        const newSet = new Set(prev)
        newSet.delete(stepId)
        return newSet
      })
    }
  }

  // Get selected day data
  const selectedDayData = useMemo(() => {
    if (!selectedDate) return null
    // Vytvoř datum v lokální časové zóně z komponent (vyhne se UTC posunu u 'YYYY-MM-DD')
    const [y, m, d] = selectedDate.split('-').map(n => parseInt(n, 10))
    const date = new Date(y, (m || 1) - 1, d || 1)
    const dateStr = selectedDate
    const dayNames = [
      t('calendar.days.sunday'),
      t('calendar.days.monday'),
      t('calendar.days.tuesday'),
      t('calendar.days.wednesday'),
      t('calendar.days.thursday'),
      t('calendar.days.friday'),
      t('calendar.days.saturday')
    ]
    const dayName = dayNames[date.getDay()]
    // Get habits (scheduled or completed on this day)
    const dayHabits = habits.filter(h => isHabitScheduledForDate(h, date, dateStr))
    // Get steps - all steps are shown based on their scheduled date (date field)
    // This ensures tasks appear on the day they were scheduled, not when they were completed
    const daySteps = dailySteps.filter(s => {
      const stepDate = normalizeDate(s.date)
      
      // All steps are shown based on their scheduled date, regardless of completion status
      return stepDate === dateStr
    })
    // Get workflow response
    const workflowResponse = workflowResponses[dateStr]
    return {
      date,
      dateStr,
      dayName,
      habits: dayHabits,
      steps: daySteps,
      workflowResponse
    }
  }, [selectedDate, habits, dailySteps, workflowResponses, isHabitScheduledForDate, t])

  // Render calendar day (compact for month view)
  const renderCalendarDay = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const dateStr = normalizeDate(date)
    const today = normalizeDate(new Date())
    const isToday = dateStr === today
    const isSelected = selectedDate === dateStr
    const stats = getDayStats(date)
    const isPast = date < new Date() && !isToday
    
    // Calculate total tasks and completion
    const totalTasks = stats.totalHabits + stats.totalSteps
    const completedTasks = stats.completedHabits + stats.completedSteps
    const completionPercentage = totalTasks > 0 ? Math.min(Math.round((completedTasks / totalTasks) * 100), 100) : 0
    
    return (
      <div
        key={day}
        onClick={() => setSelectedDate(dateStr)}
        className={`p-1 md:p-1.5 lg:p-2 xl:p-2.5 border border-gray-300 rounded md:rounded-md lg:rounded-lg cursor-pointer transition-all hover:shadow-md hover:border-orange-400 flex flex-col select-none overflow-hidden ${
          isSelected ? 'ring-1 md:ring-2 ring-orange-500 bg-orange-50 border-orange-500 shadow-sm md:shadow-md' : 'bg-white'
        } ${isToday ? 'border-orange-500 border-2 bg-orange-50' : ''} ${isPast ? 'opacity-75' : ''}`}
        style={{ minHeight: 0, height: '100%' }}
      >
        {/* Day number - top */}
        <div className="flex justify-between items-center mb-0.5 md:mb-1 lg:mb-1.5 flex-shrink-0">
          <span className={`leading-none ${isToday ? 'text-orange-600' : 'text-gray-900'} font-bold text-xs md:text-sm lg:text-base xl:text-lg`}>{day}</span>
          {isToday && (
            <span className="w-1 h-1 md:w-1.5 md:h-1.5 lg:w-2 lg:h-2 bg-orange-500 rounded-full"></span>
          )}
        </div>
        
        {/* Progress bar - responsive height */}
        <div className="w-full bg-gray-200 rounded-full h-1 md:h-1.5 lg:h-2 xl:h-2.5 overflow-hidden mb-0.5 md:mb-1 lg:mb-1.5 flex-shrink-0">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${
              totalTasks === 0 ? 'bg-orange-400' :
              completedTasks === 0 && totalTasks > 0 ? 'bg-red-500' :
              completionPercentage === 100 ? 'bg-green-500' :
              'bg-orange-500'
            }`}
            style={{ width: totalTasks === 0 ? '100%' : `${Math.min(completionPercentage, 100)}%` }}
          />
        </div>
        
        {/* Completion info - responsive text size */}
        <div className="flex items-center justify-between mt-auto flex-shrink-0 gap-0.5 md:gap-1">
          <span className="text-[9px] md:text-xs lg:text-sm font-semibold text-gray-700">
            {completionPercentage}%
          </span>
          <span className="text-[9px] md:text-xs lg:text-sm text-gray-500 font-medium">
            {completedTasks}/{totalTasks}
          </span>
        </div>
        
        {/* Additional info on larger screens - habits and steps counts */}
        <div className="hidden lg:flex items-center justify-between mt-1 lg:mt-1.5 xl:mt-2 gap-1 text-[9px] lg:text-[10px] xl:text-xs text-gray-500">
          <div className="flex items-center gap-0.5 lg:gap-1">
            <span className="w-1 h-1 lg:w-1.5 lg:h-1.5 rounded-full bg-blue-400"></span>
            <span>{stats.totalHabits}</span>
          </div>
          <div className="flex items-center gap-0.5 lg:gap-1">
            <span className="w-1 h-1 lg:w-1.5 lg:h-1.5 rounded-full bg-purple-400"></span>
            <span>{stats.totalSteps}</span>
          </div>
        </div>
      </div>
    )
  }

  // Calculate monthly statistics
  const getMonthStats = () => {
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
    const monthStartStr = normalizeDate(monthStart)
    const monthEndStr = normalizeDate(monthEnd)
    
    let totalHabits = 0
    let completedHabits = 0
    let totalSteps = 0
    let completedSteps = 0
    
    // Calculate for each day in the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      const stats = getDayStats(date)
      totalHabits += stats.totalHabits
      completedHabits += stats.completedHabits
      totalSteps += stats.totalSteps
      completedSteps += stats.completedSteps
    }
    
    const totalTasks = totalHabits + totalSteps
    const completedTasks = completedHabits + completedSteps
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    
    return {
      totalHabits,
      completedHabits,
      totalSteps,
      completedSteps,
      totalTasks,
      completedTasks,
      completionPercentage
    }
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" style={{ height: '100%' }}>
      {/* Navigation for week view - simplified */}
      {viewMode === 'week' && (
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <button
            onClick={goToPreviousWeek}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          {onDateClick ? (
            <button
              onClick={onDateClick}
              className="text-xl font-semibold text-gray-800 capitalize cursor-pointer hover:opacity-80 transition-opacity"
            >
              {getWeekRange()}
            </button>
          ) : (
          <h3 className="text-xl font-semibold text-gray-800 capitalize">
            {getWeekRange()}
          </h3>
          )}
          <button
            onClick={goToNextWeek}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Navigation for month view */}
      {viewMode === 'month' && (
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          {onDateClick ? (
            <button
              onClick={onDateClick}
              className="text-xl font-semibold text-gray-800 capitalize cursor-pointer hover:opacity-80 transition-opacity"
            >
              {monthYear}
            </button>
          ) : (
          <h3 className="text-xl font-semibold text-gray-800 capitalize">
            {monthYear}
          </h3>
          )}
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Responsive layout: full width for week view, 2 columns for month view */}
            {viewMode === 'week' ? (
        // Week view - clean structure with full height columns
        <div className="flex-1 flex flex-col px-2 py-2" style={{ flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="grid grid-cols-7 gap-2" style={{ flex: '1 1 0%', minHeight: 0, gridTemplateRows: '1fr', alignContent: 'stretch', alignItems: 'stretch' }}>
            {getWeekDays().map((day, index) => {
                const dayNumber = day.getDate()
                const dateStr = normalizeDate(day)
                const today = normalizeDate(new Date())
                const isToday = dateStr === today
                const isSelected = selectedDate === dateStr
                const stats = getDayStats(day)
                const isPast = day < new Date() && !isToday
                
                const dayName = dayNames[day.getDay()]
                
                const dayHabits = habits.filter(h => {
                  const dateObj = new Date(day)
                  dateObj.setHours(0, 0, 0, 0)
                  return isHabitScheduledForDate(h, dateObj, dateStr)
                })
                
                const daySteps = dailySteps.filter(s => {
                  const stepDate = normalizeDate(s.date)
                  return stepDate === dateStr
                })
                
                const totalTasks = stats.totalHabits + stats.totalSteps
                const completedTasks = stats.completedHabits + stats.completedSteps
                const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
                
                return (
                  <div
                    key={index}
                  className={`flex flex-col border border-gray-200 rounded-lg transition-all hover:shadow-md select-none ${
                      isSelected ? 'ring-2 ring-orange-500 bg-orange-50' : 'bg-white'
                    } ${isToday ? 'border-orange-400 border-2' : ''} ${isPast ? 'opacity-90' : ''}`}
                  style={{ minHeight: 0, display: 'flex', flexDirection: 'column', alignSelf: 'stretch' }}
                  >
                    {/* Header: Day name, number, and progress bar */}
                    <div 
                      onClick={() => setSelectedDate(dateStr)}
                    className="p-2 cursor-pointer flex-shrink-0"
                    >
                    <div className="mb-1">
                      <div className="text-xs text-gray-500 font-normal mb-0.5">{dayName}</div>
                        <div className={`text-xl font-bold ${isToday ? 'text-orange-600' : 'text-gray-800'}`}>{dayNumber}</div>
                    </div>
                    
                    {/* Progress bar */}
                    {totalTasks > 0 ? (
                      <div className="mb-1">
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                          <div 
                              className={`h-1.5 rounded-full transition-all ${
                              completedTasks === 0 ? 'bg-red-500' :
                              completionPercentage === 100 ? 'bg-green-500' :
                              'bg-orange-500'
                            }`}
                            style={{ width: `${completionPercentage}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-600 text-center">
                          {completionPercentage}% ({completedTasks}/{totalTasks})
                        </div>
                      </div>
                    ) : (
                      <div className="mb-1">
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                          <div 
                              className="h-1.5 rounded-full transition-all bg-orange-500"
                            style={{ width: '100%' }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-600 text-center">
                          0% (0/0)
                        </div>
                      </div>
                    )}
        </div>

                    {/* Steps section */}
                  <div className="flex-1 px-2 pb-1 border-t border-gray-100 flex flex-col" style={{ minHeight: '200px', flexBasis: 0 }}>
                    <div className="text-xs font-semibold text-gray-600 mb-1 mt-1.5 flex-shrink-0">Kroky</div>
                      {daySteps.length > 0 ? (
                        <div className="space-y-1 flex-1 overflow-y-auto min-h-0">
                          {daySteps.map(step => (
                      <div
                        key={step.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleStep(step.id)
                              }}
                            className={`flex items-center gap-2 p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-orange-50/30 hover:border-orange-200 transition-all duration-200 cursor-pointer shadow-sm ${
                                step.completed ? 'bg-orange-50/50 border-orange-200' : ''
                              }`}
                        >
                          {loadingSteps.has(step.id) ? (
                                <svg className="animate-spin h-4 w-4 text-gray-500 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : step.completed ? (
                                <Check className="w-4 h-4 text-orange-600 flex-shrink-0" strokeWidth={3} />
                          ) : (
                                <Check className="w-4 h-4 text-gray-400 flex-shrink-0" strokeWidth={2.5} fill="none" />
                          )}
                              <span className={`text-xs flex-1 truncate font-semibold ${step.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {step.title}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                        <div className="text-xs text-gray-400 py-1 text-center">Žádné</div>
                )}
              </div>

                    {/* Habits section */}
                  <div className="flex-1 px-2 pb-2 border-t border-gray-100 flex flex-col" style={{ minHeight: '200px', flexBasis: 0 }}>
                    <div className="text-xs font-semibold text-gray-600 mb-1 mt-1.5 flex-shrink-0">{t('calendar.habits')}</div>
                      {dayHabits.length > 0 ? (
                        <div className="space-y-1.5 flex-1 overflow-y-auto min-h-0">
                          {dayHabits.map(habit => {
                      let isCompleted = false
                      if (habit.habit_completions) {
                        if (typeof habit.habit_completions === 'string') {
                          try {
                            const parsed = JSON.parse(habit.habit_completions)
                                  isCompleted = parsed[dateStr] === true
                          } catch {
                            isCompleted = false
                          }
                        } else if (typeof habit.habit_completions === 'object') {
                                isCompleted = habit.habit_completions[dateStr] === true || 
                                             habit.habit_completions[dateStr] === 'true'
                        }
                      }
                            
                      return (
                        <div
                          key={habit.id}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleHabit(habit.id, dateStr)
                                }}
                              className={`p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-orange-50/30 hover:border-orange-200 transition-all duration-200 cursor-pointer shadow-sm ${
                                  isCompleted ? 'bg-orange-50/50 border-orange-200' : ''
                                }`}
                              >
                                <div className="flex items-center gap-2">
                          <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (!loadingHabits.has(habit.id)) {
                                        toggleHabit(habit.id, dateStr)
                                      }
                                    }}
                            disabled={loadingHabits.has(habit.id)}
                                    className="flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 flex-shrink-0"
                          >
                            {loadingHabits.has(habit.id) ? (
                                      <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : isCompleted ? (
                                      <Check className="w-4 h-4 text-orange-600" strokeWidth={3} />
                                    ) : (
                                      <Check className="w-4 h-4 text-gray-400" strokeWidth={2.5} fill="none" />
                                    )}
                          </button>
                                  <span className={`text-xs flex-1 truncate font-semibold ${
                                    isCompleted 
                                      ? 'line-through text-orange-600' 
                                      : 'text-gray-900'
                                  }`}>
                            {habit.name}
                          </span>
                                </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                        <div className="text-xs text-gray-400 py-1 text-center">Žádné</div>
                )}
              </div>
            </div>
                )
            })}
          </div>
        </div>
      ) : viewMode === 'month' ? (
        // Month view - existing structure
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 flex-1 min-h-0 overflow-hidden p-4" style={{ maxHeight: '100%', height: '100%', overflow: 'hidden' }}>
          {/* Calendar Grid - Left Column (Fixed, never scrolls) */}
          <div className="flex flex-col md:w-1/2 flex-shrink-0 h-full min-h-0 max-h-full overflow-hidden" style={{ overscrollBehavior: 'none', overscrollBehaviorY: 'none' }}>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2 flex-shrink-0">
              {dayNamesShort.map((day) => (
                <div key={day} className="text-center text-xs font-bold text-gray-700 py-1">
                  {day}
                </div>
              ))}
            </div>
            
            <div 
              className="grid grid-cols-7 gap-1 flex-1 min-h-0"
              style={{ 
                gridTemplateRows: `repeat(${Math.ceil((adjustedStartingDay + daysInMonth) / 7)}, minmax(auto, 1fr))`,
                height: '100%',
                maxHeight: '100%',
                alignContent: 'stretch',
                overflow: 'hidden'
              }}
            >
              {/* Month view - start from first day of month, no empty cells */}
              <>
                {/* Days of month - first day starts at correct grid position */}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1
                  const isFirstDay = day === 1
                  return (
                    <div
                      key={day}
                      style={isFirstDay ? { gridColumnStart: adjustedStartingDay + 1 } : {}}
                    >
                      {renderCalendarDay(day)}
          </div>
                  )
                })}
              </>
        </div>
        </div>

          {/* Selected Day Detail (show for month view only - right side column - Scrollable) */}
          <div 
            className="flex flex-col lg:flex-row gap-3 lg:gap-4 md:w-1/2 flex-1" 
            style={{ 
              height: '100%', 
              maxHeight: '100%', 
              overflow: 'hidden',
              minHeight: 0
            }}
          >
            {/* Main detail panel - fixed container with scrollbar, constrained to parent height */}
            <div 
              className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col flex-1" 
              style={{ 
                height: '100%', 
                maxHeight: '100%',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0
              }}
            >
              {selectedDayData ? (
                <>
                  {/* Header - fixed at top, never scrolls */}
                  <div 
                    className="flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50"
                    style={{ flexShrink: 0 }}
                  >
                    <h3 className="text-lg font-bold text-gray-900">
                      {selectedDayData.date.toLocaleDateString(localeCode, { weekday: 'long' })} {selectedDayData.date.getDate()}. {selectedDayData.date.getMonth() + 1}. {selectedDayData.date.getFullYear()}
                    </h3>
                  </div>

                  {/* Scrollable content - ONLY this div scrolls, header stays fixed */}
                  <div 
                    className="flex-1 min-h-0 p-4"
                    style={{ 
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      overscrollBehavior: 'contain',
                      WebkitOverflowScrolling: 'touch',
                      flex: '1 1 auto',
                      minHeight: 0
                    }}
                  >
                  {/* Habits - Top section */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">{t('calendar.habits')}</h4>
                    {selectedDayData.habits.length > 0 ? (
                      <div className="space-y-2">
                        {selectedDayData.habits.map(habit => {
                          // Handle different formats of habit_completions
                          let isCompleted = false
                          if (habit.habit_completions) {
                            if (typeof habit.habit_completions === 'string') {
                              try {
                                const parsed = JSON.parse(habit.habit_completions)
                                isCompleted = parsed[selectedDayData.dateStr] === true
                              } catch {
                                isCompleted = false
                              }
                            } else if (typeof habit.habit_completions === 'object') {
                              isCompleted = habit.habit_completions[selectedDayData.dateStr] === true || 
                                           habit.habit_completions[selectedDayData.dateStr] === 'true'
                            }
                          }
                          return (
                            <div
                              key={habit.id}
                              className={`flex items-center gap-2 p-3 rounded-lg border border-gray-200 bg-white hover:bg-orange-50/30 hover:border-orange-200 transition-all duration-200 cursor-pointer shadow-sm ${
                                isCompleted ? 'bg-orange-50/50 border-orange-200' : ''
                              }`}
                            >
                              <button
                                onClick={() => toggleHabit(habit.id, selectedDayData.dateStr)}
                                disabled={loadingHabits.has(habit.id)}
                                className="flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 flex-shrink-0"
                              >
                                {loadingHabits.has(habit.id) ? (
                                  <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                ) : isCompleted ? (
                                  <Check className="w-5 h-5 text-orange-600" strokeWidth={3} />
                                ) : (
                                  <Check className="w-5 h-5 text-gray-400" strokeWidth={2.5} fill="none" />
                                )}
                              </button>
                              <span className={`flex-1 text-sm font-semibold ${isCompleted ? 'line-through text-orange-600' : 'text-gray-900'}`}>
                                {habit.name}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-6 text-sm bg-gray-50 rounded-lg">
                        {t('calendar.noSteps')} {t('calendar.habits')}
                      </div>
                    )}
                  </div>

                  {/* Steps - Bottom section */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">Kroky</h4>
                    {selectedDayData.steps.length > 0 ? (
                      <div className="space-y-2">
                        {selectedDayData.steps.map(step => (
                          <div
                            key={step.id}
                            className={`flex items-center gap-2 p-3 rounded-lg border border-gray-200 bg-white hover:bg-orange-50/30 hover:border-orange-200 transition-all duration-200 cursor-pointer shadow-sm ${
                              step.completed ? 'bg-orange-50/30 border-orange-200' : ''
                            }`}
                          >
                            <button
                              onClick={() => toggleStep(step.id)}
                              disabled={loadingSteps.has(step.id)}
                              className="flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 flex-shrink-0"
                            >
                              {loadingSteps.has(step.id) ? (
                                <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : step.completed ? (
                                <Check className="w-5 h-5 text-orange-600" strokeWidth={3} />
                              ) : (
                                <Check className="w-5 h-5 text-gray-400" strokeWidth={2.5} fill="none" />
                              )}
                            </button>
                            <span className={`flex-1 text-sm font-semibold ${step.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                              {step.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-6 text-sm bg-gray-50 rounded-lg">
                        {t('calendar.noSteps')}
                      </div>
                    )}
                  </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-center text-gray-500 py-8 px-4">
                  <div>
                    <p className="text-sm mb-2">Vyberte den v kalendáři</p>
                    <p className="text-xs text-gray-400">pro zobrazení detailu</p>
                  </div>
                </div>
              )}
            </div>
                </div>
                              </div>
      ) : (
        // Year view or other
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 xl:gap-6 items-start flex-1 min-h-0">
          {/* Year view content */}
                  </div>
                )}
    </div>
  )
}
