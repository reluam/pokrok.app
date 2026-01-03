'use client'

import { useMemo, useEffect, useRef, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { getLocalDateString, normalizeDate } from '../../../main/components/utils/dateHelpers'
import { isHabitScheduledForDay } from '../utils/habitHelpers'
import { isStepScheduledForDay } from '../utils/stepHelpers'
import { Check, Target, ArrowRight, ChevronDown, ChevronUp, Plus, CheckSquare, Trash2, Footprints } from 'lucide-react'
import { getIconEmoji, getIconComponent } from '@/lib/icon-utils'

interface TodayFocusSectionProps {
  goals: any[]
  dailySteps: any[]
  habits?: any[]
  selectedDayDate: Date
  handleStepToggle: (stepId: string, completed: boolean) => Promise<void>
  handleHabitToggle?: (habitId: string, date?: string) => Promise<void>
  handleItemClick: (item: any, type: 'step' | 'habit' | 'goal' | 'stat') => void
  loadingSteps: Set<string>
  animatingSteps?: Set<string>
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
  onDeleteStep?: (stepId: string) => Promise<void>
  onDailyStepsUpdate?: (steps: any[]) => void
  visibleSections?: Record<string, boolean> // View settings for showing/hiding sections
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
  animatingSteps = new Set(),
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
  onStepTimeChange,
  onDeleteStep,
  onDailyStepsUpdate,
  visibleSections = {
    futureSteps: true,
    overdueSteps: true
  }
}: TodayFocusSectionProps) {
  const t = useTranslations()
  const locale = useLocale()
  const localeCode = locale === 'cs' ? 'cs-CZ' : 'en-US'
  
  // State for showing/hiding completed habits in day view
  const [showCompletedHabits, setShowCompletedHabits] = useState(false)
  
  // State for showing/hiding completed steps in week view
  const [showCompletedSteps, setShowCompletedSteps] = useState(false)
  
  // State for date format setting
  const [dateFormat, setDateFormat] = useState<'DD.MM.YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'DD MMM YYYY'>('DD.MM.YYYY')
  
  // Load date format setting
  useEffect(() => {
    const loadDateFormat = async () => {
      if (!player?.user_id) return
      try {
        const response = await fetch('/api/cesta/user-settings')
        if (response.ok) {
          const data = await response.json()
          if (data.settings?.date_format) {
            setDateFormat(data.settings.date_format)
          }
        }
      } catch (error) {
        console.error('Error loading date format:', error)
      }
    }
    loadDateFormat()
  }, [player?.user_id])
  
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
  
  const displayDate = useMemo(() => {
    const date = new Date(selectedDayDate)
    date.setHours(0, 0, 0, 0)
    return date
  }, [selectedDayDate])
  const displayDateStr = getLocalDateString(displayDate)
  
  // Get focus title based on selected date
  const getFocusTitle = useMemo(() => {
    if (isWeekView) {
      return t('focus.weeklyFocus')
    }
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    // Check if it's today
    if (displayDate.getTime() === today.getTime()) {
      return t('focus.todayFocus') || 'Dnešní fokus'
    }
    
    // Check if it's yesterday
    if (displayDate.getTime() === yesterday.getTime()) {
      return t('focus.yesterdayFocus') || 'Včerejší fokus'
    }
    
    // Check if it's tomorrow
    if (displayDate.getTime() === tomorrow.getTime()) {
      return t('focus.tomorrowFocus') || 'Zítřejší fokus'
    }
    
    // Otherwise, use day name in genitive
    const dayNames = localeCode === 'cs-CZ'
      ? ['neděle', 'pondělí', 'úterý', 'středy', 'čtvrtka', 'pátku', 'soboty']
      : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    
    const dayIndex = displayDate.getDay()
    const dayName = dayNames[dayIndex]
    
    return localeCode === 'cs-CZ'
      ? `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} fokus`
      : `${dayName}'s Focus`
  }, [displayDate, isWeekView, localeCode, t])
  
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
  
  // Helper function to check if a date is in the current week (Monday to Sunday)
  const isDateInCurrentWeek = (date: Date): boolean => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Get Monday of current week
    const dayOfWeek = today.getDay()
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // If Sunday, go back 6 days, otherwise go to Monday
    const monday = new Date(today)
    monday.setDate(today.getDate() + diff)
    monday.setHours(0, 0, 0, 0)
    
    // Get Sunday of current week
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(0, 0, 0, 0)
    
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)
    
    return checkDate.getTime() >= monday.getTime() && checkDate.getTime() <= sunday.getTime()
  }
  
  // Helper function to format date - show weekday only if in current week
  const formatStepDate = (date: Date): string => {
    const dateObj = new Date(date)
    dateObj.setHours(0, 0, 0, 0)
    
    if (isDateInCurrentWeek(dateObj)) {
      // Show weekday if in current week
      return dateObj.toLocaleDateString(localeCode, { weekday: 'long' })
    } else {
      // Show formatted date with year if outside current week
      const day = dateObj.getDate()
      const month = dateObj.getMonth() + 1
      const year = dateObj.getFullYear()
      
      switch (dateFormat) {
        case 'DD.MM.YYYY':
          return `${day.toString().padStart(2, '0')}.${month.toString().padStart(2, '0')}.${year}`
        case 'MM/DD/YYYY':
          return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year}`
        case 'YYYY-MM-DD':
          return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
        case 'DD MMM YYYY':
          const monthNames = localeCode === 'cs-CZ' 
            ? ['led', 'úno', 'bře', 'dub', 'kvě', 'čer', 'čvc', 'srp', 'zář', 'říj', 'lis', 'pro']
            : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          return `${day} ${monthNames[month - 1]} ${year}`
        default:
          return `${day.toString().padStart(2, '0')}.${month.toString().padStart(2, '0')}.${year}`
      }
    }
  }
  
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
    let filtered: any[] = []
    
    // If week view, habits are already filtered in WeekView, so just use them
    if (isWeekView) {
      filtered = habits
    } else {
      // Otherwise, filter for selected day using helper function
      filtered = habits.filter(habit => {
        return isHabitScheduledForDay(habit, displayDate)
      })
    }
    
    // Sort by order (if exists) or created_at to maintain fixed order
    // Use reminder_time as secondary criterion, then id as final tiebreaker
    return filtered.sort((a: any, b: any) => {
      // Primary: order (if exists) or created_at timestamp
      const aOrder = a.order !== undefined ? a.order : (a.created_at ? new Date(a.created_at).getTime() : 0)
      const bOrder = b.order !== undefined ? b.order : (b.created_at ? new Date(b.created_at).getTime() : 0)
      
      if (aOrder !== bOrder) {
        return aOrder - bOrder
      }
      
      // Secondary: reminder_time (habits with time come first, sorted by time)
      const aTime = a.reminder_time || ''
      const bTime = b.reminder_time || ''
      
      if (aTime && bTime) {
        const timeCompare = aTime.localeCompare(bTime)
        if (timeCompare !== 0) return timeCompare
      } else if (aTime && !bTime) {
        return -1
      } else if (!aTime && bTime) {
        return 1
      }
      
      // Final tiebreaker: use id for absolute stability (id never changes)
      return a.id.localeCompare(b.id)
    })
  }, [habits, isWeekView, displayDate])
  
  // Get active focus goals - use status instead of focus_status
  // Active status = in focus, paused/completed = out of focus
  const activeFocusGoals = useMemo(() => {
    return goals
      .filter(g => g.status === 'active')
      .sort((a, b) => (a.focus_order || 999) - (b.focus_order || 999))
  }, [goals])
  
  // Get steps from active focus goals for today (with goals)
  // If on area page, show all steps from area goals, not just focus goals
  const focusSteps = useMemo(() => {
    const activeFocusGoalIds = new Set(activeFocusGoals.map(g => g.id))
    // If all goals are from an area (all have area_id), show all steps from these goals
    const allGoalsHaveArea = goals.length > 0 && goals.every(g => g.area_id)
    const goalIds = allGoalsHaveArea ? new Set(goals.map(g => g.id)) : activeFocusGoalIds
    
    return dailySteps
      .filter(step => {
        // Check if step belongs to a goal (focus goal or area goal)
        const belongsToGoal = step.goal_id && goalIds.has(step.goal_id)
        if (!belongsToGoal) return false
        
        // In week view, check if step is scheduled for any day in the week
        if (isWeekView && weekStart && weekEnd) {
          // Check each day in the week
          for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart)
            day.setDate(weekStart.getDate() + i)
            if (isStepScheduledForDay(step, day)) {
              return true
            }
          }
          return false
        }
        
        // In day view, check if step is scheduled for the selected day
        return isStepScheduledForDay(step, displayDate)
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
        // For repeating steps without date, use created_at
        const dateA = a.date ? new Date(normalizeDate(a.date)) : (a.created_at ? new Date(a.created_at) : new Date(0))
        const dateB = b.date ? new Date(normalizeDate(b.date)) : (b.created_at ? new Date(b.created_at) : new Date(0))
        return dateA.getTime() - dateB.getTime()
      })
  }, [dailySteps, activeFocusGoals, displayDate, isWeekView, weekStart, weekEnd, goals])
  
  // Get all today's steps (including from active focus goals), sorted by priority
  // Combine focusSteps and other steps
  // If on area page, show all steps from area goals, not just focus goals
  const allTodaysSteps = useMemo(() => {
    // Combine focusSteps and steps without goals
    const activeFocusGoalIds = new Set(activeFocusGoals.map(g => g.id))
    // If all goals are from an area (all have area_id), show all steps from these goals
    const allGoalsHaveArea = goals.length > 0 && goals.every(g => g.area_id)
    const goalIds = allGoalsHaveArea ? new Set(goals.map(g => g.id)) : activeFocusGoalIds
    
    const stepsWithoutGoals = dailySteps
      .filter(step => {
        // Check if step doesn't belong to any goal (or goal is not in area/focus)
        const hasNoGoal = !step.goal_id || !goalIds.has(step.goal_id)
        if (!hasNoGoal) return false
        
        // In week view, check if step is scheduled for any day in the week
        if (isWeekView && weekStart && weekEnd) {
          // Check each day in the week
          for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart)
            day.setDate(weekStart.getDate() + i)
            if (isStepScheduledForDay(step, day)) {
              return true
            }
          }
          return false
        }
        
        // In day view, check if step is scheduled for the selected day
        return isStepScheduledForDay(step, displayDate)
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
        // For repeating steps without date, use created_at
        const dateA = a.date ? new Date(normalizeDate(a.date)) : (a.created_at ? new Date(a.created_at) : new Date(0))
        const dateB = b.date ? new Date(normalizeDate(b.date)) : (b.created_at ? new Date(b.created_at) : new Date(0))
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
        // For repeating steps without date, use created_at
        const dateA = a.date ? new Date(normalizeDate(a.date)) : (a.created_at ? new Date(a.created_at) : new Date(0))
        const dateB = b.date ? new Date(normalizeDate(b.date)) : (b.created_at ? new Date(b.created_at) : new Date(0))
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
  // Use helper function for habit scheduling check
  
  const isHabitCompletedForDay = (habit: any, day: Date): boolean => {
    const dateStr = getLocalDateString(day)
    return habit.habit_completions && habit.habit_completions[dateStr] === true
  }
  
  // Get week habits for week view - MUST be before any early returns
  const weekHabits = useMemo(() => {
    if (!isWeekView) return []
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    
    const filtered = habits.filter(habit => {
      if (habit.always_show) return true
      if (habit.frequency === 'daily') return true
      // Include both custom (legacy) and weekly habits
      if ((habit.frequency === 'custom' || habit.frequency === 'weekly') && habit.selected_days) {
        return weekDays.some(day => {
          const dayName = dayNames[day.getDay()]
          return habit.selected_days?.includes(dayName)
        })
      }
      return false
    })
    
    // Sort by order (if exists) or created_at to maintain fixed order
    // Use reminder_time as secondary criterion, then id as final tiebreaker
    return filtered.sort((a: any, b: any) => {
      // Primary: order (if exists) or created_at timestamp
      const aOrder = a.order !== undefined ? a.order : (a.created_at ? new Date(a.created_at).getTime() : 0)
      const bOrder = b.order !== undefined ? b.order : (b.created_at ? new Date(b.created_at).getTime() : 0)
      
      if (aOrder !== bOrder) {
        return aOrder - bOrder
      }
      
      // Secondary: reminder_time (habits with time come first, sorted by time)
      const aTime = a.reminder_time || ''
      const bTime = b.reminder_time || ''
      
      if (aTime && bTime) {
        const timeCompare = aTime.localeCompare(bTime)
        if (timeCompare !== 0) return timeCompare
      } else if (aTime && !bTime) {
        return -1
      } else if (!aTime && bTime) {
        return 1
      }
      
      // Final tiebreaker: use id for absolute stability (id never changes)
      return a.id.localeCompare(b.id)
    })
  }, [isWeekView, habits, weekDays])
  
  // Calculate overdue and future steps (outside current week/day)
  const { overdueStepsList, futureStepsList } = useMemo(() => {
    // Get all steps that are not in the current week (for week view) or not today (for day view)
    // Exclude repeating steps (they are shown in the main list)
    const allSteps = dailySteps.filter(step => {
      if (step.completed) return false
      
      // Repeating steps are shown in main list, not in overdue/future
      if (step.frequency && step.frequency !== null) return false
      
      // Non-repeating steps must have a date
      if (!step.date) return false
      
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
    
    // Separate steps into overdue steps and future steps
    const overdueStepsList: any[] = []
    const futureStepsList: any[] = []
    
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
    
    return { overdueStepsList, futureStepsList }
  }, [dailySteps, isWeekView, weekStart, weekEnd, displayDate])
  
  // Handle step deletion
  const handleDeleteStep = async (stepId: string) => {
    const step = dailySteps.find(s => s.id === stepId)
    const stepTitle = step?.title || t('steps.step') || 'krok'
    if (!confirm(t('steps.deleteConfirmText', { stepTitle }) || `Opravdu chcete smazat krok "${stepTitle}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/daily-steps?stepId=${stepId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Call onDeleteStep if provided (for parent component to handle)
        if (onDeleteStep) {
          await onDeleteStep(stepId)
        }
        // Also update dailySteps by removing the deleted step
        if (onDailyStepsUpdate) {
          onDailyStepsUpdate(dailySteps.filter(s => s.id !== stepId))
        }
      } else {
        alert(t('steps.deleteError') || 'Nepodařilo se smazat krok')
      }
    } catch (error) {
      console.error('Error deleting step:', error)
      alert(t('steps.deleteError') || 'Chyba při mazání kroku')
    }
  }

  // Render step function
  const renderOtherStep = useMemo(() => {
    const actualToday = new Date()
    actualToday.setHours(0, 0, 0, 0)
    
    const StepComponent = (step: any) => {
      const stepDate = normalizeDate(step.date)
      const stepDateObj = new Date(stepDate)
      stepDateObj.setHours(0, 0, 0, 0)
      
      // Overdue = before actual today (not before displayed week/day)
      const isOverdue = stepDateObj.getTime() < actualToday.getTime()
      
      const stepDateFormatted = step.date ? formatStepDate(stepDateObj) : null
      
      return (
        <div
          key={step.id}
          onClick={() => handleItemClick(step, 'step')}
          className={`box-playful-highlight flex items-center gap-3 p-3 cursor-pointer ${
            animatingSteps.has(step.id)
              ? step.completed
                ? 'border-primary-500 bg-primary-100 animate-pulse'
                : 'border-primary-500 bg-primary-100 animate-pulse'
              : isOverdue && !step.completed
                ? 'border-primary-500 bg-red-50 hover:bg-red-100'
                : 'border-primary-500 bg-white hover:bg-primary-50'
          } ${step.completed && !animatingSteps.has(step.id) ? 'opacity-50' : ''}`}
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
            className={`w-6 h-6 rounded-playful-sm border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
              animatingSteps.has(step.id)
                ? step.completed
                  ? 'bg-white border-primary-500'
                  : 'bg-white border-primary-500'
                : step.completed 
                  ? 'bg-white border-primary-500' 
                  : isOverdue
                    ? 'border-primary-500 hover:bg-primary-100'
                    : 'border-primary-500 hover:bg-primary-100'
            }`}
          >
            {loadingSteps.has(step.id) ? (
              <svg className="animate-spin h-3 w-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : animatingSteps.has(step.id) || step.completed ? (
              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
            ) : null}
          </button>
          
          {/* Title */}
          <span className={`flex-1 font-medium text-sm truncate flex items-center gap-2 ${
            step.completed ? 'line-through text-gray-400' : isOverdue ? 'text-red-600' : 'text-black'
          }`}>
            {step.title}
            {step.checklist && step.checklist.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-playful-sm flex-shrink-0 border-2 ${
                step.checklist.filter((c: any) => c.completed).length === step.checklist.length
                  ? 'bg-primary-100 text-primary-600 border-primary-500'
                  : 'bg-gray-100 text-gray-500 border-gray-300'
              }`}>
                {step.checklist.filter((c: any) => c.completed).length}/{step.checklist.length}
              </span>
            )}
          </span>
          
          {/* Meta info - hidden on mobile */}
          <button 
            onClick={(e) => openDatePicker(e, step)}
            className={`hidden sm:block w-20 text-xs text-center capitalize flex-shrink-0 rounded-playful-sm px-1 py-0.5 transition-colors border-2 ${
              isOverdue && !step.completed ? 'text-red-600 hover:bg-red-100 border-red-300' : 'text-gray-600 hover:bg-gray-100 border-gray-300'
            }`}
          >
            {isOverdue && !step.completed && '❗'}
            {stepDateFormatted || '-'}
          </button>
          {isOverdue && !step.completed ? (
            <button 
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteStep(step.id)
              }}
              className="hidden sm:block w-14 text-xs text-center flex-shrink-0 rounded-playful-sm px-1 py-0.5 transition-colors border-2 text-red-600 hover:bg-red-100 border-red-300"
              title={t('steps.deleteStep') || 'Smazat krok'}
            >
              <Trash2 className="w-3.5 h-3.5 mx-auto" />
            </button>
          ) : (
            <button 
              onClick={(e) => openTimePicker(e, step)}
              className="hidden sm:block w-14 text-xs text-center flex-shrink-0 rounded-playful-sm px-1 py-0.5 transition-colors border-2 text-gray-600 hover:bg-gray-100 border-gray-300"
            >
              {step.estimated_time ? `${step.estimated_time} min` : '-'}
            </button>
          )}
        </div>
      )
    }
    StepComponent.displayName = 'StepComponent'
    return StepComponent
  }, [animatingSteps, loadingSteps, handleStepToggle, handleItemClick, formatStepDate, openDatePicker, openTimePicker, handleDeleteStep, t, onDailyStepsUpdate, onDeleteStep, dailySteps])
  
  // Only show empty state if there are no steps AND no habits
  // Don't hide habits just because there are no steps
  const hasHabits = isWeekView ? weekHabits.length > 0 : todaysHabits.length > 0
  if (allTodaysSteps.length === 0 && !hasHabits) {
    return (
      <div className="card-playful-base">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-bold text-black font-playful">
              {isWeekView ? t('focus.weeklyFocus') : t('focus.dailyFocus')}
            </h3>
          </div>
          {onOpenStepModal && (
            <button
              onClick={() => {
                // Always use today's date for new steps, not the selected day
                const dateToUse = getLocalDateString(new Date())
                onOpenStepModal(dateToUse)
              }}
              className="btn-playful-base px-3 py-1.5 text-sm font-semibold text-black bg-primary-50 hover:bg-primary-100"
              title={t('focus.addStep')}
            >
              <Plus className="w-4 h-4" />
              {t('focus.addStep')}
            </button>
          )}
        </div>
        <div className="text-center py-8">
          <p className="mb-2 text-black">{t('focus.noSteps')}</p>
          <p className="text-sm text-gray-600 mb-6">{t('focus.allStepsCompleted')}</p>
          
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
                className="btn-playful-base px-4 py-2 text-sm font-semibold text-black bg-primary-50 hover:bg-primary-100"
              >
                <Plus className="w-4 h-4" />
                {t('focus.addStep')}
              </button>
            )}
            {!onOpenStepModal && onNavigateToSteps && (
              <button
                onClick={() => onNavigateToSteps()}
                className="btn-playful-base px-4 py-2 text-sm font-semibold text-black bg-primary-50 hover:bg-primary-100"
              >
                <Plus className="w-4 h-4" />
                {t('focus.addStep')}
              </button>
            )}
            {onNavigateToHabits && (
              <button
                onClick={() => onNavigateToHabits()}
                className="btn-playful-base px-4 py-2 text-sm font-semibold text-black bg-primary-50 hover:bg-primary-100"
              >
                <Plus className="w-4 h-4" />
                {t('habits.addHabit')}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col gap-6">
      {/* Steps This Week Box */}
      <div className="card-playful-base w-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Footprints className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-bold text-black font-playful">
                {isWeekView ? t('focus.stepsThisWeek') : t('focus.stepsToday')}
              </h3>
              {allTodaysSteps.length > 0 && (
                <span className="text-sm text-gray-600">
                  {allTodaysSteps.filter(s => s.completed).length}/{allTodaysSteps.length}
                </span>
              )}
            </div>
            {onOpenStepModal && (
              <button
                onClick={() => {
                  // Always use today's date for new steps, not the selected day
                  const dateToUse = getLocalDateString(new Date())
                  onOpenStepModal(dateToUse)
                }}
                className="btn-playful-base px-3 py-1.5 text-sm font-semibold text-black bg-primary-50 hover:bg-primary-100"
                title={t('focus.addStep')}
              >
                <Plus className="w-4 h-4" />
                {t('focus.addStep')}
              </button>
            )}
          </div>
          
          {allTodaysSteps.length > 0 ? (
            <>
              <div className="flex items-center mb-3">
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
                    
                    // Format date for display - show day name only if in current week
                    const stepDateFormatted = formatStepDate(stepDateObj)
                    
                    // Get goal for this step if it has one
                    const stepGoal = step.goal_id ? goals.find(g => g.id === step.goal_id) : null
                    const GoalIconComponent = stepGoal ? getIconComponent(stepGoal.icon) : null
                    
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
                        className={`box-playful-highlight flex items-center gap-3 p-3 cursor-pointer ${
                          animatingSteps.has(step.id)
                            ? step.completed
                              ? 'border-primary-500 bg-primary-100 animate-pulse'
                              : 'border-primary-500 bg-primary-100 animate-pulse'
                            : isOverdue && !step.completed
                              ? 'border-primary-500 bg-red-50 hover:bg-red-100'
                              : isToday && !step.completed
                                ? 'border-primary-500 bg-primary-50 hover:bg-primary-100'
                                : 'border-primary-500 bg-white hover:bg-primary-50'
                        } ${step.completed && !animatingSteps.has(step.id) ? 'opacity-50' : ''}`}
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
                          className={`w-6 h-6 rounded-playful-sm border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                            animatingSteps.has(step.id)
                              ? step.completed
                                ? 'bg-white border-primary-500'
                                : 'bg-white border-primary-500'
                              : step.completed 
                                ? 'bg-white border-primary-500' 
                                : isOverdue
                                  ? 'border-primary-500 hover:bg-primary-100'
                                  : isToday
                                    ? 'border-primary-500 hover:bg-primary-100'
                                    : 'border-primary-500 hover:bg-primary-100'
                          }`}
                        >
                          {loadingSteps.has(step.id) ? (
                            <svg className="animate-spin h-3 w-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : animatingSteps.has(step.id) || step.completed ? (
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
                                ? 'text-primary-600'
                                : 'text-black'
                        } ${step.is_important && !step.completed ? 'font-bold' : 'font-medium'}`}>
                          {step.title}
                          {step.checklist && step.checklist.length > 0 && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-playful-sm flex-shrink-0 border-2 ${
                              step.checklist.filter((c: any) => c.completed).length === step.checklist.length
                                ? 'bg-primary-100 text-primary-600 border-primary-500'
                                : 'bg-gray-100 text-gray-500 border-gray-300'
                            }`}>
                              {step.checklist.filter((c: any) => c.completed).length}/{step.checklist.length}
                            </span>
                          )}
                        </span>
                        
                        {/* Meta info - fixed width columns - hidden on mobile */}
                        <button
                          onClick={(e) => openDatePicker(e, step)}
                          className={`hidden sm:block w-20 text-xs text-center capitalize flex-shrink-0 rounded-playful-sm px-1 py-0.5 transition-colors border-2 ${
                            isOverdue && !step.completed 
                              ? 'text-red-600 hover:bg-red-100 border-red-300' 
                              : isToday
                                ? 'text-primary-600 hover:bg-primary-100 border-primary-500' 
                                : 'text-gray-600 hover:bg-gray-100 border-gray-300'
                          }`}
                        >
                          {isOverdue && !step.completed && '❗'}
                          {isToday ? t('focus.today') : stepDateFormatted || '-'}
                        </button>
                        <button 
                          onClick={(e) => openTimePicker(e, step)}
                          className={`hidden sm:block w-14 text-xs text-center flex-shrink-0 rounded-playful-sm px-1 py-0.5 transition-colors border-2 ${
                            isOverdue && !step.completed 
                              ? 'text-red-600 hover:bg-red-100 border-red-300' 
                              : isToday
                                ? 'text-primary-600 hover:bg-primary-100 border-primary-500' 
                                : 'text-gray-600 hover:bg-gray-100 border-gray-300'
                          }`}
                        >
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
                        className="w-full mt-3 pt-3 border-t-2 border-primary-200 text-xs text-gray-600 text-center hover:text-primary-600 transition-colors flex items-center justify-center gap-1"
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
                            const stepDateFormatted = formatStepDate(stepDateObj)
                            
                            return (
                              <div 
                                key={step.id}
                                onClick={() => handleItemClick(step, 'step')}
                                className={`box-playful-highlight flex items-center gap-3 p-3 cursor-pointer bg-white hover:bg-primary-50 opacity-50`}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (!loadingSteps.has(step.id)) {
                                      handleStepToggle(step.id, !step.completed)
                                    }
                                  }}
                                  disabled={loadingSteps.has(step.id)}
                                  className={`w-6 h-6 rounded-playful-sm border-2 flex items-center justify-center transition-colors flex-shrink-0 bg-white border-primary-500`}
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
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-playful-sm bg-primary-100 text-primary-600 flex-shrink-0 no-underline border-2 border-primary-500">
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
            </>
          ) : (
                <div className="text-center py-8 text-gray-500 font-playful">
                  <p className="text-sm">{isWeekView ? t('focus.noStepsThisWeek') || 'Žádné kroky tento týden' : t('focus.noStepsToday') || 'Žádné kroky dnes'}</p>
                </div>
              )}
          </div>
      
      {/* Overdue Steps and Future Steps - side by side boxes */}
      {((overdueStepsList.length > 0 || futureStepsList.length > 0) || isWeekView) && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Overdue Steps Box */}
          {visibleSections.overdueSteps !== false && (overdueStepsList.length > 0 || isWeekView) && (
            <div className="card-playful-base flex-1 min-w-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Footprints className="w-5 h-5 text-red-600" />
                  <h3 className="text-lg font-bold text-black font-playful">
                    {t('focus.overdueSteps')}
                  </h3>
                </div>
              </div>
              
              <div className="space-y-2">
                {overdueStepsList.length > 0 ? (
                  overdueStepsList.map(renderOtherStep)
                ) : (
                  <div className="text-gray-600 text-xs text-center py-3">
                    {t('focus.noOverdueSteps')}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Future Steps Box */}
          {visibleSections.futureSteps !== false && (futureStepsList.length > 0 || isWeekView) && (
            <div className="card-playful-base flex-1 min-w-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Footprints className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-bold text-black font-playful">
                    {t('focus.futureSteps')}
                  </h3>
                </div>
              </div>
              
              <div className="space-y-2">
                {futureStepsList.length > 0 ? (
                  futureStepsList.map(renderOtherStep)
                ) : (
                  <div className="text-gray-600 text-xs text-center py-3">
                    {t('focus.noFutureSteps')}
                  </div>
                )}
              </div>
            </div>
          )}
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
            className="fixed z-50 box-playful-highlight p-4 bg-white"
            style={{
              top: `${Math.min(datePickerPosition.top, window.innerHeight - 380)}px`,
              left: `${Math.min(Math.max(datePickerPosition.left - 100, 10), window.innerWidth - 250)}px`,
              width: '230px'
            }}
          >
            <div className="text-sm font-bold text-black mb-3 font-playful">Date</div>
            
            {/* Day names */}
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map(day => (
                <div key={day} className="text-center text-xs text-gray-600 font-medium py-1">
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
                      className={`w-7 h-7 rounded-playful-sm text-xs font-medium transition-colors border-2 ${
                        isSelected
                          ? 'bg-white text-black font-bold border-primary-500'
                          : isToday
                            ? 'bg-primary-100 text-primary-600 font-bold border-primary-500'
                            : 'hover:bg-primary-50 text-black border-gray-300'
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
                className="p-1 hover:bg-primary-50 rounded-playful-sm border-2 border-primary-500 transition-colors"
              >
                <ChevronDown className="w-4 h-4 rotate-90 text-black" />
              </button>
              <span className="text-xs font-semibold text-black">
                {datePickerMonth.toLocaleDateString(localeCode, { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => {
                  const newMonth = new Date(datePickerMonth)
                  newMonth.setMonth(newMonth.getMonth() + 1)
                  setDatePickerMonth(newMonth)
                }}
                className="p-1 hover:bg-primary-50 rounded-playful-sm border-2 border-primary-500 transition-colors"
              >
                <ChevronDown className="w-4 h-4 -rotate-90 text-black" />
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
                className="btn-playful-base flex-1 px-3 py-1.5 bg-white text-black text-xs font-semibold hover:bg-primary-50"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setDatePickerStep(null)
                  setDatePickerPosition(null)
                }}
                className="btn-playful-base px-3 py-1.5 bg-white text-black text-xs font-semibold hover:bg-primary-50"
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
            className="fixed z-50 box-playful-highlight p-4 bg-white"
            style={{
              top: `${timePickerPosition.top}px`,
              left: `${timePickerPosition.left}px`,
              width: '160px'
            }}
          >
            <div className="text-sm font-bold text-black mb-3 font-playful">Čas (min)</div>
            
            {/* Time options */}
            <div className="grid grid-cols-3 gap-1 mb-3">
              {[5, 10, 15, 20, 30, 45, 60, 90, 120].map(minutes => (
                <button
                  key={minutes}
                  onClick={() => handleTimeSelect(minutes)}
                  className={`py-1.5 rounded-playful-sm text-xs font-semibold transition-colors border-2 ${
                    timePickerStep?.estimated_time === minutes
                      ? 'bg-white text-black border-primary-500'
                      : 'hover:bg-primary-100 text-black border-gray-300'
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
                className="flex-1 px-2 py-1.5 text-xs border-2 border-primary-500 rounded-playful-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                className="btn-playful-base px-2 py-1.5 bg-white text-black text-xs font-semibold hover:bg-primary-50"
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
              className="w-full px-3 py-1.5 bg-white text-black text-xs font-semibold rounded-playful-md hover:bg-primary-50 transition-colors border-4 border-primary-500"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  )
}
