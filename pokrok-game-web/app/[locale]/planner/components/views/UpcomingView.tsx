'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { getLocalDateString, normalizeDate } from '../../../main/components/utils/dateHelpers'
import { isHabitScheduledForDay } from '../utils/habitHelpers'
import { isStepScheduledForDay } from '../utils/stepHelpers'
import { Check, Plus, Footprints, Trash2, ChevronDown, Repeat } from 'lucide-react'
import { getIconComponent } from '@/lib/icon-utils'

interface UpcomingViewProps {
  goals?: any[]
  habits: any[]
  dailySteps: any[]
  areas?: any[]
  selectedDayDate: Date
  setSelectedDayDate: (date: Date) => void
  handleItemClick: (item: any, type: 'step' | 'habit' | 'goal' | 'stat') => void
  handleHabitToggle: (habitId: string, date?: string) => Promise<void>
  handleStepToggle: (stepId: string, completed: boolean, completionDate?: string) => Promise<void>
  setSelectedItem: (item: any) => void
  setSelectedItemType: (type: 'step' | 'habit' | 'goal' | 'stat' | null) => void
  onOpenStepModal?: (date?: string, step?: any) => void
  onStepDateChange?: (stepId: string, newDate: string) => Promise<void>
  onStepTimeChange?: (stepId: string, minutes: number) => Promise<void>
  loadingHabits: Set<string>
  loadingSteps: Set<string>
  player?: any
  userId?: string | null
  maxUpcomingSteps?: number // Max number of upcoming steps to show (default: 5)
}

export function UpcomingView({
  goals = [],
  habits,
  dailySteps,
  areas = [],
  selectedDayDate,
  setSelectedDayDate,
  handleItemClick,
  handleHabitToggle,
  handleStepToggle,
  setSelectedItem,
  setSelectedItemType,
  onOpenStepModal,
  onStepDateChange,
  onStepTimeChange,
  loadingHabits,
  loadingSteps,
  player,
  userId,
  maxUpcomingSteps = 5
}: UpcomingViewProps) {
  const t = useTranslations()
  const locale = useLocale()
  const localeCode = locale === 'cs' ? 'cs-CZ' : 'en-US'
  
  // View mode: 'feed' or 'areas'
  const [viewMode, setViewMode] = useState<'feed' | 'areas'>('feed')
  const [feedDisplayCount, setFeedDisplayCount] = useState(20) // Number of steps to display in feed
  const [isLoadingViewMode, setIsLoadingViewMode] = useState(true)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  
  // Date and time picker state
  const [datePickerStep, setDatePickerStep] = useState<any | null>(null)
  const [datePickerPosition, setDatePickerPosition] = useState<{ top: number; left: number } | null>(null)
  const [datePickerMonth, setDatePickerMonth] = useState<Date>(new Date())
  const [selectedDateInPicker, setSelectedDateInPicker] = useState<Date | null>(null)
  const [timePickerStep, setTimePickerStep] = useState<any | null>(null)
  const [timePickerPosition, setTimePickerPosition] = useState<{ top: number; left: number } | null>(null)
  const [selectedTimeInPicker, setSelectedTimeInPicker] = useState<number | null>(null)

  // Load saved view mode preference
  useEffect(() => {
    const loadViewMode = async () => {
      if (!userId) {
        setIsLoadingViewMode(false)
        return
      }
      
      try {
        const response = await fetch(`/api/view-settings?view_type=upcoming`)
        if (response.ok) {
          const data = await response.json()
          if (data?.settings?.upcomingViewMode && (data.settings.upcomingViewMode === 'feed' || data.settings.upcomingViewMode === 'areas')) {
            setViewMode(data.settings.upcomingViewMode)
          }
        }
      } catch (error) {
        console.error('Error loading view mode preference:', error)
      } finally {
        setIsLoadingViewMode(false)
      }
    }
    
    loadViewMode()
  }, [userId])

  // Save view mode preference when it changes
  useEffect(() => {
    if (isLoadingViewMode || !userId) return
    
    const saveViewMode = async () => {
      try {
        const response = await fetch(`/api/view-settings?view_type=upcoming`)
        let currentSettings = {}
        
        if (response.ok) {
          const data = await response.json()
          currentSettings = data?.settings || {}
        }
        
        // Update settings with new view mode
        const updatedSettings = {
          ...currentSettings,
          upcomingViewMode: viewMode
        }
        
        await fetch('/api/view-settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            view_type: 'upcoming',
            settings: updatedSettings
          })
        })
      } catch (error) {
        console.error('Error saving view mode preference:', error)
      }
    }
    
    saveViewMode()
  }, [viewMode, userId, isLoadingViewMode])
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = getLocalDateString(today)
  
  // Get today's habits
  const todaysHabits = useMemo(() => {
    return habits.filter(habit => {
      return isHabitScheduledForDay(habit, today)
    })
  }, [habits, today])
  
  // Create instances for recurring steps when they should be displayed
  useEffect(() => {
    if (!userId || !dailySteps.length) return

    const createMissingInstances = async () => {
      const recurringSteps = dailySteps.filter(step => step.frequency && step.frequency !== null)
      
      for (const step of recurringSteps) {
        // Check if last_instance_date is older than today (step is overdue)
        const lastInstanceDate = step.last_instance_date ? new Date(step.last_instance_date) : null
        
        if (lastInstanceDate && lastInstanceDate < today) {
          // Find next occurrence starting from today
          let checkDate = new Date(today)
          
          // Check up to 365 days ahead to find next occurrence
          for (let i = 0; i < 365; i++) {
            if (isStepScheduledForDay(step, checkDate)) {
              // Check if instance already exists
              const dateStr = checkDate.toISOString().split('T')[0]
              const dateFormatted = checkDate.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' })
              const instanceTitle = `${step.title} - ${dateFormatted}`
              
              const hasInstance = dailySteps.some(s => 
                s.title === instanceTitle && 
                s.date === dateStr &&
                s.user_id === step.user_id
              )
              
              if (!hasInstance) {
                // Create instance via API
                try {
                  const response = await fetch('/api/daily-steps', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      userId: step.user_id,
                      goalId: step.goal_id || null,
                      areaId: step.area_id || null,
                      title: instanceTitle,
                      description: step.description || '',
                      date: dateStr,
                      isImportant: step.is_important || false,
                      isUrgent: step.is_urgent || false,
                      estimatedTime: step.estimated_time || 30,
                      xpReward: step.xp_reward || 1,
                      checklist: step.checklist || [],
                      requireChecklistComplete: step.require_checklist_complete || false,
                      frequency: null, // Not recurring
                      selectedDays: []
                    }),
                  })
                  
                  if (response.ok) {
                    // Update last_instance_date via API
                    await fetch(`/api/daily-steps?stepId=${step.id}`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        lastInstanceDate: dateStr
                      }),
                    })
                    console.log(`Created instance for recurring step ${step.title} on ${dateStr}`)
                  }
                } catch (error) {
                  console.error(`Error creating instance for step ${step.id}:`, error)
                }
              }
              break // Only create first occurrence
            }
            checkDate.setDate(checkDate.getDate() + 1)
          }
        }
      }
    }

    createMissingInstances()
  }, [dailySteps, today, userId])
  
  // Helper function to check if a repeating step is completed for a specific date
  // Checks both the recurring step itself and completed instances
  const isStepCompletedForDate = (step: any, date: Date): boolean => {
    const dateStr = getLocalDateString(date)
    
    // Check if there's a completed instance for this date
    // Completed instances have title format "Original Title - DD.MM.YYYY"
    const dateFormatted = date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' })
    const enDateFormatted = date.toLocaleDateString('en-US', { day: 'numeric', month: 'numeric', year: 'numeric' })
    
    const hasCompletedInstance = dailySteps.some((s: any) => {
      if (!s.completed || s.frequency !== null) return false
      // Check if this is a completed instance of the recurring step
      const instanceDate = s.date ? normalizeDate(s.date) : null
      if (!instanceDate) return false
      
      const instanceDateStr = getLocalDateString(new Date(instanceDate))
      if (instanceDateStr !== dateStr) return false
      
      // Check if title matches (could be "Original Title - Date" format)
      const baseTitle = step.title
      return s.title === baseTitle || 
             s.title.startsWith(baseTitle + ' - ') ||
             s.title === `${baseTitle} - ${dateFormatted}` ||
             s.title === `${baseTitle} - ${enDateFormatted}`
    })
    
    if (hasCompletedInstance) return true
    
    // Also check the recurring step itself (legacy check)
    if (!step.completed) return false
    
    // If step has completed_at, check if it matches the date
    if (step.completed_at) {
      const completedDate = new Date(step.completed_at)
      completedDate.setHours(0, 0, 0, 0)
      const checkDate = new Date(date)
      checkDate.setHours(0, 0, 0, 0)
      return completedDate.getTime() === checkDate.getTime()
    }
    
    return false
  }
  
  // Helper function to get the next occurrence date for a repeating step
  const getNextOccurrenceDate = (step: any, fromDate: Date = today): Date | null => {
    if (!step.frequency || step.frequency === null) {
      // Non-repeating step - return its date if it's in the future
      if (step.date) {
      const stepDate = new Date(normalizeDate(step.date))
      stepDate.setHours(0, 0, 0, 0)
        return stepDate >= fromDate ? stepDate : null
      }
      return null
    }
    
    // For repeating steps, find the next occurrence that is NOT completed
    let checkDate = new Date(fromDate)
    checkDate.setHours(0, 0, 0, 0)
    
    // Check up to 365 days ahead
    for (let i = 0; i < 365; i++) {
      if (isStepScheduledForDay(step, checkDate)) {
        // Check if this step is completed for this specific date (including instances)
        if (!isStepCompletedForDate(step, checkDate)) {
          return checkDate
        }
      }
      checkDate.setDate(checkDate.getDate() + 1)
    }
    
    return null
  }
  
  // Calculate one month from today
  const oneMonthFromToday = useMemo(() => {
    const date = new Date(today)
    date.setMonth(date.getMonth() + 1)
    return date
  }, [today])

  // Create maps for quick lookup
  const goalMap = useMemo(() => {
    const map = new Map<string, any>()
    goals.forEach(goal => {
      map.set(goal.id, goal)
    })
    return map
  }, [goals])

  const areaMap = useMemo(() => {
    const map = new Map<string, any>()
    areas.forEach(area => {
      map.set(area.id, area)
    })
    return map
  }, [areas])

  // Get all steps for Feed view - sorted by date, with overdue first, then important first within each day
  // No limit, but filtered to max one month ahead (except overdue steps - show all overdue)
  const allFeedSteps = useMemo(() => {
    const stepsWithDates: Array<{ step: any; date: Date; isImportant: boolean; isOverdue: boolean; goal: any; area: any }> = []
    
    // Process non-repeating steps (exclude instances of recurring steps - they are handled separately)
    // Also exclude hidden recurring step templates
    dailySteps
      .filter(step => {
        // Exclude hidden steps (recurring step templates) - only if explicitly set to true
        if (step.is_hidden === true) return false
        // Include only non-recurring steps that are NOT instances of recurring steps
        // Instances have parent_recurring_step_id set (link to template)
        return (!step.frequency || step.frequency === null) && !step.parent_recurring_step_id
      })
      .forEach(step => {
        // Skip completed steps
        if (step.completed) return
        
        // If step has no date, skip it (we need date for Upcoming view)
        if (!step.date) return
      
      const stepDate = new Date(normalizeDate(step.date))
      stepDate.setHours(0, 0, 0, 0)
      
        const isOverdue = stepDate < today
        
        // Filter out steps more than one month ahead (but keep all overdue steps)
        if (!isOverdue && stepDate > oneMonthFromToday) return
        const goal = step.goal_id ? goalMap.get(step.goal_id) : null
        // Get area from goal if exists, otherwise from step directly
        const area = goal?.area_id 
          ? areaMap.get(goal.area_id) 
          : (step.area_id ? areaMap.get(step.area_id) : null)
        
        stepsWithDates.push({
          step,
          date: stepDate,
          isImportant: step.is_important || false,
          isOverdue,
          goal,
          area
        })
    })
    
    // Process repeating steps - show actual instances from database
    // Filter out recurring step templates (is_hidden = true)
    // Show only instances (they have frequency = null and parent_recurring_step_id set)
    // Exclude completed instances
    // Always show only the nearest incomplete instance for each recurring step
    
    // First, collect all incomplete instances
    const allRecurringInstancesFeed = dailySteps
      .filter(step => {
        // Show instances (non-recurring steps with parent_recurring_step_id set)
        // Exclude completed instances and hidden steps (only if explicitly set to true)
        if (!step.frequency && step.date && step.parent_recurring_step_id && !step.completed && step.is_hidden !== true) {
          const stepDate = new Date(normalizeDate(step.date))
          stepDate.setHours(0, 0, 0, 0)
          const isOverdue = stepDate < today
          // Include if overdue or within one month
          return isOverdue || stepDate <= oneMonthFromToday
        }
        return false
      })
      .map(step => {
        const stepDate = new Date(normalizeDate(step.date))
        stepDate.setHours(0, 0, 0, 0)
        const isOverdue = stepDate < today
        
        // Find the original recurring step by parent_recurring_step_id
        const originalStep = dailySteps.find(s => 
          s.id === step.parent_recurring_step_id &&
          s.frequency !== null &&
          s.is_hidden === true // Recurring step template is hidden
        )
        
        if (!originalStep) return null // Skip if template not found
        
        return {
          step,
          date: stepDate,
          isOverdue,
          originalStep
        }
      })
      .filter(item => item !== null) as Array<{ step: any; date: Date; isOverdue: boolean; originalStep: any }>
    
    // Group instances by original recurring step
    const instancesByRecurringStepFeed = new Map<string, typeof allRecurringInstancesFeed>()
    allRecurringInstancesFeed.forEach(item => {
      if (item.originalStep) {
        const key = item.originalStep.id
        if (!instancesByRecurringStepFeed.has(key)) {
          instancesByRecurringStepFeed.set(key, [])
        }
        instancesByRecurringStepFeed.get(key)!.push(item)
      }
    })
    
    // For each recurring step, show only the nearest incomplete instance
    instancesByRecurringStepFeed.forEach((instances, recurringStepId) => {
      const originalStep = instances[0]?.originalStep
      if (!originalStep) {
        // If we can't find the original step, skip these instances
        return
      }
      
      // Sort instances by date (oldest first) - this ensures we get the nearest one
      instances.sort((a, b) => a.date.getTime() - b.date.getTime())
      
      // Show only the first (nearest) incomplete instance
      const nearestInstance = instances[0]
      if (!nearestInstance) return
      
      const goal = originalStep.goal_id ? goalMap.get(originalStep.goal_id) : (nearestInstance.step.goal_id ? goalMap.get(nearestInstance.step.goal_id) : null)
      const area = goal?.area_id 
        ? areaMap.get(goal.area_id) 
        : (originalStep.area_id ? areaMap.get(originalStep.area_id) : (nearestInstance.step.area_id ? areaMap.get(nearestInstance.step.area_id) : null))
      
      stepsWithDates.push({
        step: nearestInstance.step,
        date: nearestInstance.date,
        isImportant: nearestInstance.step.is_important || false,
        isOverdue: nearestInstance.isOverdue,
        goal,
        area
      })
    })
    
    // Sort: overdue first, then by date, then by importance within same date
    stepsWithDates.sort((a, b) => {
      // Overdue steps first
      if (a.isOverdue && !b.isOverdue) return -1
      if (!a.isOverdue && b.isOverdue) return 1
      
      // Same overdue status - sort by date
      const dateDiff = a.date.getTime() - b.date.getTime()
      if (dateDiff !== 0) return dateDiff
      
      // Same date - important first
      if (a.isImportant && !b.isImportant) return -1
      if (!a.isImportant && b.isImportant) return 1
      return 0
    })
    
    // Return all steps with additional metadata (no limit)
    return stepsWithDates.map(item => ({
      ...item.step,
      _isOverdue: item.isOverdue,
      _goal: item.goal,
      _area: item.area,
      _date: item.date
    }))
  }, [dailySteps, today, oneMonthFromToday, goalMap, areaMap])
  
  // Get upcoming steps - sorted by date, with overdue first, then important first within each day
  // Limited to 15 steps total and max one month ahead (except overdue steps - show all overdue)
  const upcomingSteps = useMemo(() => {
    const stepsWithDates: Array<{ step: any; date: Date; isImportant: boolean; isOverdue: boolean; goal: any; area: any }> = []
    const addedStepIds = new Set<string>() // Track which steps have already been added to prevent duplicates
    
    // Process non-repeating steps (exclude instances of recurring steps - they are handled separately)
    // Also exclude hidden recurring step templates
    dailySteps
      .filter(step => {
        // Exclude hidden steps (recurring step templates) - only if explicitly set to true
        if (step.is_hidden === true) return false
        // Include only non-recurring steps that are NOT instances of recurring steps
        // Instances have parent_recurring_step_id set (link to template)
        if (!step.frequency && step.date && !step.completed && !step.parent_recurring_step_id) {
      const stepDate = new Date(normalizeDate(step.date))
      stepDate.setHours(0, 0, 0, 0)
          const isOverdue = stepDate < today
          // Include if overdue or within one month
          return isOverdue || stepDate <= oneMonthFromToday
        }
        return false
      })
      .forEach(step => {
        // Skip if already added
        if (addedStepIds.has(step.id)) return
        addedStepIds.add(step.id)
        
        const stepDate = new Date(normalizeDate(step.date))
        stepDate.setHours(0, 0, 0, 0)
        const isOverdue = stepDate < today
        
        // Find the original recurring step if this is an instance
        // Instances have parent_recurring_step_id set
        let originalStep = null
        if (step.parent_recurring_step_id) {
          originalStep = dailySteps.find(s => 
            s.id === step.parent_recurring_step_id &&
            s.frequency !== null &&
            s.is_hidden === true // Recurring step template is hidden
          )
        }
        
        const goal = originalStep?.goal_id ? goalMap.get(originalStep.goal_id) : (step.goal_id ? goalMap.get(step.goal_id) : null)
        const area = goal?.area_id 
          ? areaMap.get(goal.area_id) 
          : (originalStep?.area_id ? areaMap.get(originalStep.area_id) : (step.area_id ? areaMap.get(step.area_id) : null))
        
        stepsWithDates.push({
          step,
          date: stepDate,
          isImportant: step.is_important || false,
          isOverdue,
          goal,
          area
        })
      })
    
    // Process repeating steps - show actual instances from database
    // Filter out recurring step templates (is_hidden = true)
    // Show only instances (they have frequency = null and parent_recurring_step_id set)
    // Exclude completed instances
    // Always show only the nearest incomplete instance for each recurring step
    
    // First, collect all incomplete instances
    const allRecurringInstances = dailySteps
      .filter(step => {
        // Show instances (non-recurring steps with parent_recurring_step_id set)
        // Exclude completed instances and hidden steps (only if explicitly set to true)
        if (!step.frequency && step.date && step.parent_recurring_step_id && !step.completed && step.is_hidden !== true) {
          const stepDate = new Date(normalizeDate(step.date))
          stepDate.setHours(0, 0, 0, 0)
          const isOverdue = stepDate < today
          // Include if overdue or within one month
          return isOverdue || stepDate <= oneMonthFromToday
        }
        return false
      })
      .map(step => {
        const stepDate = new Date(normalizeDate(step.date))
        stepDate.setHours(0, 0, 0, 0)
        const isOverdue = stepDate < today
        
        // Find the original recurring step by parent_recurring_step_id
        const originalStep = dailySteps.find(s => 
          s.id === step.parent_recurring_step_id &&
          s.frequency !== null &&
          s.is_hidden === true // Recurring step template is hidden
        )
        
        if (!originalStep) return null // Skip if template not found
        
        return {
          step,
          date: stepDate,
          isOverdue,
          originalStep
        }
      })
      .filter(item => item !== null) as Array<{ step: any; date: Date; isOverdue: boolean; originalStep: any }>
    
    // Group instances by original recurring step
    const instancesByRecurringStepUpcoming = new Map<string, typeof allRecurringInstances>()
    allRecurringInstances.forEach(item => {
      if (item.originalStep) {
        const key = item.originalStep.id
        if (!instancesByRecurringStepUpcoming.has(key)) {
          instancesByRecurringStepUpcoming.set(key, [])
        }
        instancesByRecurringStepUpcoming.get(key)!.push(item)
      }
    })
    
    // For each recurring step, show only the nearest incomplete instance
    instancesByRecurringStepUpcoming.forEach((instances, recurringStepId) => {
      const originalStep = instances[0]?.originalStep
      if (!originalStep) {
        // If we can't find the original step, skip these instances
        return
      }
      
      // Sort instances by date (oldest first) - this ensures we get the nearest one
      instances.sort((a, b) => a.date.getTime() - b.date.getTime())
      
      // Show only the first (nearest) incomplete instance
      const nearestInstance = instances[0]
      if (!nearestInstance) return
      
      // Skip if already added (shouldn't happen, but safety check to prevent duplicate keys)
      if (addedStepIds.has(nearestInstance.step.id)) return
      addedStepIds.add(nearestInstance.step.id)
      
      const goal = originalStep.goal_id ? goalMap.get(originalStep.goal_id) : (nearestInstance.step.goal_id ? goalMap.get(nearestInstance.step.goal_id) : null)
      const area = goal?.area_id 
        ? areaMap.get(goal.area_id) 
        : (originalStep.area_id ? areaMap.get(originalStep.area_id) : (nearestInstance.step.area_id ? areaMap.get(nearestInstance.step.area_id) : null))
      
      stepsWithDates.push({
        step: nearestInstance.step,
        date: nearestInstance.date,
        isImportant: nearestInstance.step.is_important || false,
        isOverdue: nearestInstance.isOverdue,
        goal,
        area
      })
    })
    
    // Sort: overdue first, then by date, then by importance within same date
    stepsWithDates.sort((a, b) => {
      // Overdue steps first
      if (a.isOverdue && !b.isOverdue) return -1
      if (!a.isOverdue && b.isOverdue) return 1
      
      // Same overdue status - sort by date
      const dateDiff = a.date.getTime() - b.date.getTime()
      if (dateDiff !== 0) return dateDiff
      
      // Same date - important first
      if (a.isImportant && !b.isImportant) return -1
      if (!a.isImportant && b.isImportant) return 1
      return 0
    })
    
    // Limit to 15 steps total, but include ALL overdue steps
    const overdueSteps = stepsWithDates.filter(item => item.isOverdue)
    const nonOverdueSteps = stepsWithDates.filter(item => !item.isOverdue)
    const limitedNonOverdue = nonOverdueSteps.slice(0, Math.max(0, 15 - overdueSteps.length))
    const limitedSteps = [...overdueSteps, ...limitedNonOverdue]
    
    // Return steps with additional metadata
    return limitedSteps.map(item => ({
      ...item.step,
      _isOverdue: item.isOverdue,
      _goal: item.goal,
      _area: item.area
    }))
  }, [dailySteps, today, oneMonthFromToday, goalMap, areaMap])
  
  // Group steps by area, then by goal
  const stepsByArea = useMemo(() => {
    const grouped: Record<string, Record<string, Array<{ step: any; goal: any }>>> = {}
    const noAreaSteps: Array<{ step: any; goal: any }> = []
    
    upcomingSteps.forEach(step => {
      const area = (step as any)._area
      const goal = (step as any)._goal
      
      if (area) {
        if (!grouped[area.id]) {
          grouped[area.id] = {}
        }
        const goalId = goal?.id || 'no-goal'
        if (!grouped[area.id][goalId]) {
          grouped[area.id][goalId] = []
        }
        grouped[area.id][goalId].push({ step, goal })
      } else {
        noAreaSteps.push({ step, goal })
      }
    })
    
    return { grouped, noAreaSteps }
  }, [upcomingSteps])
  
  // Helper function to check if a date is in the current or next week (Monday to Sunday)
  const isDateInCurrentOrNextWeek = (date: Date): boolean => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Get Monday of current week
    const dayOfWeek = today.getDay()
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // If Sunday, go back 6 days, otherwise go to Monday
    const monday = new Date(today)
    monday.setDate(today.getDate() + diff)
    monday.setHours(0, 0, 0, 0)
    
    // Get Sunday of next week (14 days from Monday of current week)
    const sundayNextWeek = new Date(monday)
    sundayNextWeek.setDate(monday.getDate() + 13) // 7 days for current week + 6 days for next week
    sundayNextWeek.setHours(0, 0, 0, 0)
    
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)
    
    return checkDate.getTime() >= monday.getTime() && checkDate.getTime() <= sundayNextWeek.getTime()
  }
  
  const formatStepDate = (dateStr: string | null) => {
    if (!dateStr) return ''
    const date = new Date(normalizeDate(dateStr))
    const dateObj = new Date(date)
    dateObj.setHours(0, 0, 0, 0)
    
    // Check if date is today
    const isToday = dateObj.getTime() === today.getTime()
    if (isToday) {
      return t('focus.today') || 'Dnes'
    }
    
    // Check if date is in current or next week
    if (isDateInCurrentOrNextWeek(dateObj)) {
      // Show weekday name
      return dateObj.toLocaleDateString(locale === 'cs' ? 'cs-CZ' : 'en-US', { weekday: 'long' })
    }
    
    // Show formatted date with year if outside current and next week
    return date.toLocaleDateString(locale === 'cs' ? 'cs-CZ' : 'en-US', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    })
  }

  // Open date picker for a step
  const openDatePicker = (e: React.MouseEvent, step: any) => {
    e.stopPropagation()
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    // Position picker so it doesn't go off screen
    const top = Math.min(rect.bottom + 5, window.innerHeight - 400)
    const left = Math.min(rect.left, window.innerWidth - 320)
    setDatePickerPosition({ top, left })
    setDatePickerStep(step)
    // Initialize selected date with current step date
    if (step.date) {
      const stepDate = new Date(normalizeDate(step.date))
      setSelectedDateInPicker(stepDate)
      setDatePickerMonth(stepDate)
    } else {
      const today = new Date()
      setSelectedDateInPicker(today)
      setDatePickerMonth(today)
    }
  }
  
  // Handle date selection (just selects, doesn't save)
  const handleDateSelect = (date: Date) => {
    setSelectedDateInPicker(date)
  }
  
  // Save selected date and close picker
  const handleSaveDate = async () => {
    if (datePickerStep && selectedDateInPicker && onStepDateChange) {
      const dateStr = getLocalDateString(selectedDateInPicker)
      await onStepDateChange(datePickerStep.id, dateStr)
    }
    setDatePickerStep(null)
    setDatePickerPosition(null)
    setSelectedDateInPicker(null)
  }
  
  // Cancel date picker
  const handleCancelDate = () => {
    setDatePickerStep(null)
    setDatePickerPosition(null)
    setSelectedDateInPicker(null)
  }
  
  // Open time picker for a step
  const openTimePicker = (e: React.MouseEvent, step: any) => {
    e.stopPropagation()
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    const top = Math.min(rect.bottom + 5, window.innerHeight - 200)
    const left = Math.min(rect.left, window.innerWidth - 180)
    setTimePickerPosition({ top, left })
    setTimePickerStep(step)
    // Initialize selected time with current step time
    setSelectedTimeInPicker(step.estimated_time || null)
  }
  
  // Handle time selection (just selects, doesn't save)
  const handleTimeSelect = (minutes: number) => {
    setSelectedTimeInPicker(minutes)
  }
  
  // Save selected time and close picker
  const handleSaveTime = async () => {
    if (timePickerStep && selectedTimeInPicker !== null && onStepTimeChange) {
      await onStepTimeChange(timePickerStep.id, selectedTimeInPicker)
    }
    setTimePickerStep(null)
    setTimePickerPosition(null)
    setSelectedTimeInPicker(null)
  }
  
  // Cancel time picker
  const handleCancelTime = () => {
    setTimePickerStep(null)
    setTimePickerPosition(null)
    setSelectedTimeInPicker(null)
  }

  // Lazy loading for Feed view
  useEffect(() => {
    if (viewMode !== 'feed') return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Load more steps when the observer element is visible
          setFeedDisplayCount((prev) => Math.min(prev + 20, allFeedSteps.length))
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current)
      }
    }
  }, [viewMode, allFeedSteps.length])

  // Reset display count when switching to feed view
  useEffect(() => {
    if (viewMode === 'feed') {
      setFeedDisplayCount(20)
    }
  }, [viewMode])

  // Get displayed feed steps (limited by feedDisplayCount)
  const displayedFeedSteps = useMemo(() => {
    return allFeedSteps.slice(0, feedDisplayCount)
  }, [allFeedSteps, feedDisplayCount])
  
  return (
    <div className="w-full h-full flex flex-col bg-primary-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-primary-50 pb-2 pt-4 px-6">
        {/* Desktop: Single row with title, switcher, and add button */}
        <div className="hidden md:grid grid-cols-3 items-center">
        <h1 className="text-2xl font-bold text-black font-playful">
            {t('views.upcoming.title') || 'Nadcházející'}
        </h1>
          {/* View mode switcher - centered */}
          <div className="flex justify-center">
            <div className="flex items-center gap-2 bg-white border-2 border-primary-300 rounded-playful-md p-1">
              <button
                onClick={() => setViewMode('feed')}
                className={`px-3 py-1 text-sm font-semibold rounded-playful-sm transition-colors ${
                  viewMode === 'feed'
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 hover:bg-primary-50'
                }`}
              >
                {t('views.feed') || 'Feed'}
              </button>
              <button
                onClick={() => setViewMode('areas')}
                className={`px-3 py-1 text-sm font-semibold rounded-playful-sm transition-colors ${
                  viewMode === 'areas'
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 hover:bg-primary-50'
                }`}
              >
                {t('views.areas') || 'Oblasti'}
              </button>
            </div>
          </div>
          <div className="flex justify-end">
            {onOpenStepModal && (
              <button
                onClick={() => onOpenStepModal()}
                className="btn-playful-base px-3 py-1.5 text-sm font-semibold text-black bg-white hover:bg-primary-50 flex items-center gap-2"
                title={t('steps.addStep') || 'Přidat krok'}
              >
                <Plus className="w-4 h-4" />
                <span>{t('steps.addStep') || 'Přidat krok'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile: Two rows - first row with title and add button, second row with switcher */}
        <div className="flex flex-col gap-3 md:hidden">
          {/* First row: Title left, Add button right */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-black font-playful">
              {t('views.upcoming.title') || 'Nadcházející'}
            </h1>
            {onOpenStepModal && (
              <button
                onClick={() => onOpenStepModal()}
                className="btn-playful-base px-3 py-1.5 text-sm font-semibold text-black bg-white hover:bg-primary-50 flex items-center gap-2"
                title={t('steps.addStep') || 'Přidat krok'}
              >
                <Plus className="w-4 h-4" />
                <span>{t('steps.addStep') || 'Přidat krok'}</span>
              </button>
            )}
          </div>
          {/* Second row: View mode switcher - centered */}
          <div className="flex justify-center">
            <div className="flex items-center gap-2 bg-white border-2 border-primary-300 rounded-playful-md p-1">
              <button
                onClick={() => setViewMode('feed')}
                className={`px-3 py-1 text-sm font-semibold rounded-playful-sm transition-colors ${
                  viewMode === 'feed'
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 hover:bg-primary-50'
                }`}
              >
                {t('views.feed') || 'Feed'}
              </button>
              <button
                onClick={() => setViewMode('areas')}
                className={`px-3 py-1 text-sm font-semibold rounded-playful-sm transition-colors ${
                  viewMode === 'areas'
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 hover:bg-primary-50'
                }`}
              >
                {t('views.areas') || 'Oblasti'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pt-2 space-y-6">
        {/* Today's Habits - only show if there are habits */}
        {todaysHabits.length > 0 && (
          <div>
            <div className="flex flex-wrap gap-3">
              {todaysHabits.map((habit) => {
                const isCompleted = habit.habit_completions && habit.habit_completions[todayStr] === true
                const isLoading = loadingHabits.has(habit.id)
                
                return (
                <div
                  key={habit.id}
                  onClick={() => handleItemClick(habit, 'habit')}
                    className={`flex items-center gap-2 p-3 rounded-playful-md cursor-pointer transition-all flex-shrink-0 ${
                      isCompleted
                        ? 'bg-primary-100 opacity-75 hover:outline-2 hover:outline hover:outline-primary-300 hover:outline-offset-[-2px]'
                        : 'bg-white hover:bg-primary-50 hover:outline-2 hover:outline hover:outline-primary-500 hover:outline-offset-[-2px]'
                    } ${isLoading ? 'opacity-50' : ''}`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                        handleHabitToggle(habit.id, todayStr)
                    }}
                      disabled={isLoading}
                    className={`flex-shrink-0 w-6 h-6 rounded-playful-sm border-2 flex items-center justify-center transition-colors ${
                        isCompleted
                          ? 'bg-primary-500 border-primary-500'
                        : 'border-primary-500 hover:bg-primary-50'
                    }`}
                  >
                      {isLoading ? (
                        <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      ) : isCompleted ? (
                        <Check className="w-4 h-4 text-white" />
                      ) : null}
                    </button>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {habit.icon && (
                        <div className="flex-shrink-0">
                          {(() => {
                            const IconComponent = getIconComponent(habit.icon)
                            return <IconComponent className="w-5 h-5 text-primary-600" />
                          })()}
                        </div>
                      )}
                      <span className={`text-sm font-medium text-black whitespace-nowrap ${
                        isCompleted ? 'line-through' : ''
                      }`}>
                        {habit.name}
                      </span>
                    </div>
                </div>
                )
              })}
            </div>
          </div>
        )}
        
        {/* Feed View or Areas View */}
        {viewMode === 'feed' ? (
          /* Feed View */
          displayedFeedSteps.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-600">{t('views.noSteps') || 'Žádné nadcházející kroky'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Check if there are any overdue or today's steps */}
              {(() => {
                const hasOverdueOrTodaySteps = displayedFeedSteps.some((step) => {
                  if (step.completed) return false
                  const stepDateObj = (step as any)._date as Date | undefined
                  if (!stepDateObj) return false
                  const stepDate = new Date(stepDateObj)
                  stepDate.setHours(0, 0, 0, 0)
                  const isToday = stepDate.getTime() === today.getTime()
                  const isOverdue = (step as any)._isOverdue || false
                  return isOverdue || isToday
                })
                
                const hasFutureSteps = displayedFeedSteps.some((step) => {
                  if (step.completed) return false
                  const stepDateObj = (step as any)._date as Date | undefined
                  if (!stepDateObj) return false
                  const stepDate = new Date(stepDateObj)
                  stepDate.setHours(0, 0, 0, 0)
                  return stepDate > today && !(step as any)._isOverdue
                })
                
                // Show positive message if no overdue or today's steps, but there are future steps
                if (!hasOverdueOrTodaySteps && hasFutureSteps) {
                  return (
                    <div className="mb-4 p-4 bg-primary-100 border-2 border-primary-300 rounded-playful-md">
                      <p className="text-sm font-semibold text-primary-700 mb-1">
                        {t('views.allDone') || 'Vše je splněno! Dobrá práce! 🎉'}
                      </p>
                      <p className="text-xs text-primary-600">
                        {t('views.futureStepsNote') || 'Níže jsou úkoly do budoucna, které ale ještě vydrží.'}
                      </p>
                    </div>
                  )
                }
                return null
              })()}
              {displayedFeedSteps.map((step) => {
                const isLoading = loadingSteps.has(step.id)
                const stepDateObj = (step as any)._date as Date | undefined
                if (stepDateObj) stepDateObj.setHours(0, 0, 0, 0)
                const stepDateStr = stepDateObj ? getLocalDateString(stepDateObj) : null
                const isToday = stepDateObj && stepDateObj.getTime() === today.getTime()
                const isOverdue = (step as any)._isOverdue || false
                const isFuture = stepDateObj && stepDateObj > today && !isOverdue && !isToday
                const stepDateFormatted = stepDateStr ? formatStepDate(stepDateStr) : null
                const goal = (step as any)._goal
                const area = (step as any)._area
                
                return (
                <div
                  key={step.id}
                  onClick={() => handleItemClick(step, 'step')}
                    className={`flex items-center gap-3 p-3 cursor-pointer transition-[background-color,opacity,outline] rounded-playful-md ${
                      step.completed
                        ? 'opacity-50'
                        : isOverdue
                          ? 'bg-red-50 hover:bg-red-100 hover:outline-2 hover:outline hover:outline-red-300 hover:outline-offset-[-2px]'
                          : isToday
                            ? 'bg-white hover:bg-primary-50 hover:outline-2 hover:outline hover:outline-primary-500 hover:outline-offset-[-2px]'
                            : isFuture
                              ? 'bg-white/70 backdrop-blur-sm opacity-75 hover:bg-white/85 hover:opacity-85 hover:outline-2 hover:outline hover:outline-gray-200/50 hover:outline-offset-[-2px] group'
                              : 'bg-white hover:bg-primary-50 hover:outline-2 hover:outline hover:outline-gray-300 hover:outline-offset-[-2px]'
                    } ${isLoading ? 'opacity-50' : ''}`}
                  >
                    {/* Checkbox */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      // For recurring steps, pass the date of this occurrence
                      const stepDate = (step as any)._date as Date | undefined
                      const completionDate = stepDate ? getLocalDateString(stepDate) : undefined
                      handleStepToggle(step.id, !step.completed, completionDate)
                    }}
                      disabled={isLoading}
                      className={`w-6 h-6 rounded-playful-sm border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                      step.completed
                          ? 'bg-primary-500 border-primary-500' 
                          : 'border-primary-500 hover:bg-primary-100'
                      }`}
                    >
                      {isLoading ? (
                        <svg className="animate-spin h-3 w-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      ) : step.completed ? (
                        <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                      ) : null}
                  </button>
                    
                    {/* Goal icon in area color */}
                    {goal && goal.icon && (
                      <div className="flex-shrink-0">
                        {(() => {
                          const GoalIconComponent = getIconComponent(goal.icon)
                          return (
                            <GoalIconComponent 
                              className={`w-5 h-5 transition-opacity ${isFuture ? 'opacity-60 group-hover:opacity-80' : ''}`}
                              style={{ color: area?.color || '#E8871E' }} 
                            />
                          )
                        })()}
                </div>
                    )}
                    
                    {/* Step info */}
                  <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {step.frequency && step.frequency !== null && (
                          <Repeat className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${isFuture ? 'text-primary-400 group-hover:text-primary-500' : 'text-primary-600'}`} />
                        )}
                        <span className={`text-sm truncate transition-colors ${
                          step.completed 
                            ? 'line-through text-gray-400' 
                            : isOverdue
                              ? 'text-red-600'
                              : isFuture
                                ? 'text-gray-500 group-hover:text-gray-700'
                                : 'text-black'
                        } ${step.is_important && !step.completed && !isFuture ? 'font-bold' : 'font-medium'}`}>
                          {step.title}
                        </span>
                        {step.checklist && step.checklist.length > 0 && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-playful-sm flex-shrink-0 border-2 ${
                            step.checklist.filter((c: any) => c.completed).length === step.checklist.length
                              ? 'bg-primary-100 text-primary-600 border-primary-500'
                              : 'bg-gray-100 text-gray-500 border-gray-300'
                          }`}>
                            {step.checklist.filter((c: any) => c.completed).length}/{step.checklist.length}
                          </span>
                        )}
            </div>
                      {/* Goal name */}
                      {goal && (
                        <div className={`flex items-center gap-1 text-xs transition-colors ${isFuture ? 'text-gray-400 group-hover:text-gray-500' : 'text-gray-500'}`}>
                          <span>{goal.title}</span>
          </div>
        )}
                    </div>
                    
                    {/* Date and time */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {step.frequency && step.frequency !== null ? (
                        // Recurring step - show icon and time only, no date picker
                        <>
                          <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500">
                            <Repeat className="w-3 h-3" />
                            <span>{step.frequency === 'daily' ? (locale === 'cs' ? 'Denně' : 'Daily') : 
                                   step.frequency === 'weekly' ? (locale === 'cs' ? 'Týdně' : 'Weekly') :
                                   step.frequency === 'monthly' ? (locale === 'cs' ? 'Měsíčně' : 'Monthly') : ''}</span>
                          </div>
                          <button 
                            onClick={(e) => openTimePicker(e, step)}
                            className={`hidden sm:block w-20 text-xs text-center flex-shrink-0 rounded-playful-sm px-1 py-0.5 transition-colors border-2 text-gray-600 hover:bg-gray-100 border-gray-300`}
                          >
                            {step.estimated_time ? `${step.estimated_time} min` : '-'}
                          </button>
                        </>
                      ) : (
                        // Non-recurring step - show date and time pickers
                        <>
                          <button
                            onClick={(e) => openDatePicker(e, step)}
                            className={`hidden sm:block w-28 text-xs text-center capitalize flex-shrink-0 rounded-playful-sm px-1 py-0.5 transition-colors border-2 ${
                              isOverdue
                                ? 'text-red-600 hover:bg-red-100 border-red-300'
                                : isToday
                                  ? 'text-primary-600 hover:bg-primary-100 border-primary-500' 
                                  : isFuture
                                    ? 'text-gray-400 group-hover:text-gray-600 hover:bg-gray-50 border-gray-200 group-hover:border-gray-300'
                                    : 'text-gray-600 hover:bg-gray-100 border-gray-300'
                            }`}
                          >
                            {isOverdue ? '❗' : ''}{stepDateFormatted || '-'}
                          </button>
                          <button 
                            onClick={(e) => openTimePicker(e, step)}
                            className={`hidden sm:block w-20 text-xs text-center flex-shrink-0 rounded-playful-sm px-1 py-0.5 transition-colors border-2 text-gray-600 hover:bg-gray-100 border-gray-300`}
                          >
                            {step.estimated_time ? `${step.estimated_time} min` : '-'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
              
              {/* Lazy loading trigger */}
              {feedDisplayCount < allFeedSteps.length && (
                <div ref={loadMoreRef} className="text-center py-4">
                  <div className="inline-block animate-spin h-5 w-5 border-2 border-primary-500 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
          )
        ) : (
          /* Areas View */
          upcomingSteps.length === 0 ? (
          <div className="card-playful-base">
          <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Footprints className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-bold text-black font-playful">
                  {t('views.upcomingSteps') || 'Nadcházející kroky'}
            </h2>
              </div>
            {onOpenStepModal && (
              <button
                onClick={() => onOpenStepModal()}
                  className="btn-playful-base px-3 py-1.5 text-sm font-semibold text-black bg-white hover:bg-primary-50 flex items-center gap-2"
                  title={t('steps.addStep') || 'Přidat krok'}
              >
                <Plus className="w-4 h-4" />
                  <span>{t('steps.addStep') || 'Přidat krok'}</span>
              </button>
            )}
          </div>
            <p className="text-sm text-gray-600">{t('views.noSteps') || 'Žádné nadcházející kroky'}</p>
            </div>
          ) : (
          <>
            {/* Render steps grouped by area, then by goal */}
            {Object.entries(stepsByArea.grouped).map(([areaId, goalsMap]) => {
              const area = areaMap.get(areaId)
              if (!area) return null
              
              // Check if there are any overdue or today's steps in this area
              let hasOverdueOrTodaySteps = false
              let hasFutureSteps = false
              
              Object.values(goalsMap).forEach(steps => {
                steps.forEach(({ step }) => {
                  const stepDate = step.date ? normalizeDate(step.date) : null
                  const stepDateObj = stepDate ? new Date(stepDate) : null
                  if (stepDateObj) stepDateObj.setHours(0, 0, 0, 0)
                  const isToday = stepDateObj && stepDateObj.getTime() === today.getTime()
                  const isOverdue = (step as any)._isOverdue || false
                  
                  if (!step.completed) {
                    if (isOverdue || isToday) {
                      hasOverdueOrTodaySteps = true
                    } else if (stepDateObj && stepDateObj > today) {
                      hasFutureSteps = true
                    }
                  }
                })
              })
              
              return (
                <div key={areaId} className="card-playful-base">
                  <div className="flex items-center gap-2 mb-4">
                    {area.icon && (() => {
                      const IconComponent = getIconComponent(area.icon)
                      return <IconComponent className="w-5 h-5" style={{ color: area.color || '#E8871E' }} />
                    })()}
                    <h2 className="text-lg font-bold text-black font-playful">
                      {area.name}
            </h2>
            </div>
                  
                  {/* Show positive message if no overdue or today's steps, but there are future steps */}
                  {!hasOverdueOrTodaySteps && hasFutureSteps && (
                    <div className="mb-4 p-4 bg-primary-100 border-2 border-primary-300 rounded-playful-md">
                      <p className="text-sm font-semibold text-primary-700 mb-1">
                        {t('views.allDone') || 'Vše je splněno! Dobrá práce! 🎉'}
                      </p>
                      <p className="text-xs text-primary-600">
                        {t('views.futureStepsNote') || 'Níže jsou úkoly do budoucna, které ale ještě vydrží.'}
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    {Object.entries(goalsMap).map(([goalId, steps]) => {
                      const goal = goalId !== 'no-goal' ? goalMap.get(goalId) : null
                      
                      return (
                        <div key={goalId} className="space-y-2">
                          {/* Goal title */}
                          {goal && (
                            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                              {goal.icon && (() => {
                                const GoalIconComponent = getIconComponent(goal.icon)
                                return <GoalIconComponent className="w-4 h-4 text-primary-600" />
                              })()}
                              {goal.title}
                            </h3>
                          )}
                          
                          {/* Steps for this goal */}
                          {steps.map(({ step, goal: stepGoal }) => {
                            const isLoading = loadingSteps.has(step.id)
                            const stepDate = step.date ? normalizeDate(step.date) : null
                            const stepDateObj = stepDate ? new Date(stepDate) : null
                            if (stepDateObj) stepDateObj.setHours(0, 0, 0, 0)
                            const isToday = stepDateObj && stepDateObj.getTime() === today.getTime()
                            const isOverdue = (step as any)._isOverdue || false
                            const isFuture = stepDateObj && stepDateObj > today && !isOverdue && !isToday
                            const stepDateFormatted = stepDate ? formatStepDate(stepDate) : null
                            
                            // Get area from goal for icon color
                            const stepAreaForColor = stepGoal?.area_id ? areaMap.get(stepGoal.area_id) : null
                            
                            return isFuture ? (
                  // Wrapper div with background color border to cover any flash
                  <div key={step.id} className="border-2 border-primary-50 rounded-playful-lg">
                    <div
                      onClick={() => handleItemClick(step, 'step')}
                      className={`flex items-center gap-3 p-3 cursor-pointer box-playful-pressed-future opacity-75 hover:opacity-85 hover:bg-white/85 group ${isLoading ? 'opacity-50' : ''}`}
                      style={{ border: '2px solid #fbc98d' }}
                    >
                      {/* Checkbox */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStepToggle(step.id, !step.completed)
                    }}
                                  disabled={isLoading}
                                  className={`w-6 h-6 rounded-playful-sm border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                      step.completed
                                      ? 'bg-white border-primary-500' 
                                      : 'border-primary-500 hover:bg-primary-100'
                    }`}
                  >
                                  {isLoading ? (
                                    <svg className="animate-spin h-3 w-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                                  ) : step.completed ? (
                                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                  ) : null}
                  </button>
                                
                                {/* Goal icon in area color */}
                                {stepGoal && stepGoal.icon && (
                                  <div className="flex-shrink-0">
                                    {(() => {
                                      const GoalIconComponent = getIconComponent(stepGoal.icon)
                                      return (
                                        <GoalIconComponent 
                                          className="w-5 h-5 transition-opacity opacity-60 group-hover:opacity-80"
                                          style={{ color: stepAreaForColor?.color || '#E8871E' }} 
                                        />
                                      )
                                    })()}
                                  </div>
                                )}
                                
                                {/* Title */}
                  <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    {step.frequency && step.frequency !== null && (
                                      <Repeat className="w-3.5 h-3.5 flex-shrink-0 transition-colors text-primary-400 group-hover:text-primary-500" />
                                    )}
                                    <span className={`text-sm truncate transition-colors ${
                                      step.completed 
                                        ? 'line-through text-gray-400' 
                                        : isOverdue
                                          ? 'text-red-600'
                                          : 'text-gray-500 group-hover:text-gray-700'
                                    } ${step.is_important && !step.completed ? 'font-bold' : 'font-medium'}`}>
                                      {step.title}
                                    </span>
                                    {step.checklist && step.checklist.length > 0 && (
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded-playful-sm flex-shrink-0 border-2 ${
                                        step.checklist.filter((c: any) => c.completed).length === step.checklist.length
                                          ? 'bg-primary-100 text-primary-600 border-primary-500'
                                          : 'bg-gray-100 text-gray-500 border-gray-300'
                                      }`}>
                                        {step.checklist.filter((c: any) => c.completed).length}/{step.checklist.length}
                                      </span>
                                    )}
                                  </div>
                                  {/* Goal name */}
                                  {stepGoal && (
                                    <div className="flex items-center gap-1 text-xs transition-colors text-gray-400 group-hover:text-gray-500">
                                      <span>{stepGoal.title}</span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Meta info - hidden on mobile */}
                                {step.frequency && step.frequency !== null ? (
                                  // Recurring step - show icon and time only, no date picker
                                  <>
                                    <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500">
                                      <Repeat className="w-3 h-3" />
                                      <span>{step.frequency === 'daily' ? (locale === 'cs' ? 'Denně' : 'Daily') : 
                                             step.frequency === 'weekly' ? (locale === 'cs' ? 'Týdně' : 'Weekly') :
                                             step.frequency === 'monthly' ? (locale === 'cs' ? 'Měsíčně' : 'Monthly') : ''}</span>
                                    </div>
                                    <button 
                                      onClick={(e) => openTimePicker(e, step)}
                                      className={`hidden sm:block w-20 text-xs text-center flex-shrink-0 rounded-playful-sm px-1 py-0.5 transition-colors border-2 text-gray-600 hover:bg-gray-100 border-gray-300`}
                                    >
                                      {step.estimated_time ? `${step.estimated_time} min` : '-'}
                                    </button>
                                  </>
                                ) : (
                                  // Non-recurring step - show date and time pickers
                                  <>
                                    <button
                                      onClick={(e) => openDatePicker(e, step)}
                                      className={`hidden sm:block w-28 text-xs text-center capitalize flex-shrink-0 rounded-playful-sm px-1 py-0.5 transition-colors border-2 text-gray-400 group-hover:text-gray-600 hover:bg-gray-50 border-gray-200 group-hover:border-gray-300`}
                                    >
                                      {isOverdue ? '❗' : ''}{stepDateFormatted || '-'}
                                    </button>
                                    <button 
                                      onClick={(e) => openTimePicker(e, step)}
                                      className={`hidden sm:block w-20 text-xs text-center flex-shrink-0 rounded-playful-sm px-1 py-0.5 transition-colors border-2 text-gray-600 hover:bg-gray-100 border-gray-300`}
                                    >
                                      {step.estimated_time ? `${step.estimated_time} min` : '-'}
                                    </button>
                                  </>
                    )}
                    </div>
                  </div>
                            ) : (
                <div
                  key={step.id}
                  onClick={() => handleItemClick(step, 'step')}
                                className={`flex items-center gap-3 p-3 cursor-pointer ${
                                  step.completed
                                    ? 'box-playful-pressed bg-white opacity-50'
                                    : isOverdue
                                      ? 'border-2 border-red-500 bg-red-50 hover:bg-red-100 rounded-playful-lg'
                                      : isToday
                                        ? 'box-playful-pressed bg-white hover:bg-primary-50'
                                        : 'box-playful-pressed bg-white hover:bg-primary-50'
                                } ${isLoading ? 'opacity-50' : ''}`}
                              >
                                {/* Checkbox */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStepToggle(step.id, !step.completed)
                    }}
                                  disabled={isLoading}
                                  className={`w-6 h-6 rounded-playful-sm border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                      step.completed
                                      ? 'bg-white border-primary-500' 
                                      : 'border-primary-500 hover:bg-primary-100'
                    }`}
                  >
                                  {isLoading ? (
                                    <svg className="animate-spin h-3 w-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                                  ) : step.completed ? (
                                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                  ) : null}
                  </button>
                                
                                {/* Goal icon in area color */}
                                {stepGoal && stepGoal.icon && (
                                  <div className="flex-shrink-0">
                                    {(() => {
                                      const GoalIconComponent = getIconComponent(stepGoal.icon)
                                      return (
                                        <GoalIconComponent 
                                          className={`w-5 h-5 transition-opacity ${isFuture ? 'opacity-60 group-hover:opacity-80' : ''}`}
                                          style={{ color: stepAreaForColor?.color || '#E8871E' }} 
                                        />
                                      )
                                    })()}
                                  </div>
                                )}
                                
                                {/* Title */}
                  <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    {step.frequency && step.frequency !== null && (
                                      <Repeat className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${isFuture ? 'text-primary-400 group-hover:text-primary-500' : 'text-primary-600'}`} />
                                    )}
                                    <span className={`text-sm truncate transition-colors ${
                                      step.completed 
                                        ? 'line-through text-gray-400' 
                                        : isOverdue
                                          ? 'text-red-600'
                                          : isFuture
                                            ? 'text-gray-500 group-hover:text-gray-700'
                                            : 'text-black'
                                    } ${step.is_important && !step.completed && !isFuture ? 'font-bold' : 'font-medium'}`}>
                                      {step.title}
                                    </span>
                                    {step.checklist && step.checklist.length > 0 && (
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded-playful-sm flex-shrink-0 border-2 ${
                                        step.checklist.filter((c: any) => c.completed).length === step.checklist.length
                                          ? 'bg-primary-100 text-primary-600 border-primary-500'
                                          : 'bg-gray-100 text-gray-500 border-gray-300'
                                      }`}>
                                        {step.checklist.filter((c: any) => c.completed).length}/{step.checklist.length}
                      </span>
                    )}
                  </div>
                                  {/* Goal name */}
                                  {stepGoal && (
                                    <div className={`flex items-center gap-1 text-xs transition-colors ${isFuture ? 'text-gray-400 group-hover:text-gray-500' : 'text-gray-500'}`}>
                                      <span>{stepGoal.title}</span>
                </div>
                                  )}
            </div>
                                
                                {/* Meta info - hidden on mobile */}
                                {step.frequency && step.frequency !== null ? (
                                  // Recurring step - show icon and time only, no date picker
                                  <>
                                    <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500">
                                      <Repeat className="w-3 h-3" />
                                      <span>{step.frequency === 'daily' ? (locale === 'cs' ? 'Denně' : 'Daily') : 
                                             step.frequency === 'weekly' ? (locale === 'cs' ? 'Týdně' : 'Weekly') :
                                             step.frequency === 'monthly' ? (locale === 'cs' ? 'Měsíčně' : 'Monthly') : ''}</span>
                                    </div>
                                    <button 
                                      onClick={(e) => openTimePicker(e, step)}
                                      className={`hidden sm:block w-20 text-xs text-center flex-shrink-0 rounded-playful-sm px-1 py-0.5 transition-colors border-2 text-gray-600 hover:bg-gray-100 border-gray-300`}
                                    >
                                      {step.estimated_time ? `${step.estimated_time} min` : '-'}
                                    </button>
                                  </>
                                ) : (
                                  // Non-recurring step - show date and time pickers
                                  <>
                                    <button
                                      onClick={(e) => openDatePicker(e, step)}
                                      className={`hidden sm:block w-28 text-xs text-center capitalize flex-shrink-0 rounded-playful-sm px-1 py-0.5 transition-colors border-2 ${
                                        isOverdue
                                          ? 'text-red-600 hover:bg-red-100 border-red-300'
                                          : isToday
                                            ? 'text-primary-600 hover:bg-primary-100 border-primary-500' 
                                            : isFuture
                                              ? 'text-gray-400 group-hover:text-gray-600 hover:bg-gray-50 border-gray-200 group-hover:border-gray-300'
                                              : 'text-gray-600 hover:bg-gray-100 border-gray-300'
                                      }`}
                                    >
                                      {isOverdue ? '❗' : ''}{stepDateFormatted || '-'}
                                    </button>
                                    <button 
                                      onClick={(e) => openTimePicker(e, step)}
                                      className={`hidden sm:block w-20 text-xs text-center flex-shrink-0 rounded-playful-sm px-1 py-0.5 transition-colors border-2 ${
                                        isOverdue
                                          ? 'text-red-600 hover:bg-red-100 border-red-300'
                                          : 'text-gray-600 hover:bg-gray-100 border-gray-300'
                                      }`}
                                    >
                                      {step.estimated_time ? `${step.estimated_time} min` : '-'}
                                    </button>
                                  </>
          )}
        </div>
                            )
                          })}
                </div>
                      )
                    })}
            </div>
        </div>
              )
            })}
            
            {/* Steps without area - grouped by goal */}
            {stepsByArea.noAreaSteps.length > 0 && (() => {
              // Group no-area steps by goal
              const noAreaStepsByGoal: Record<string, Array<{ step: any; goal: any }>> = {}
              stepsByArea.noAreaSteps.forEach(({ step, goal }) => {
                const goalId = goal?.id || 'no-goal'
                if (!noAreaStepsByGoal[goalId]) {
                  noAreaStepsByGoal[goalId] = []
                }
                noAreaStepsByGoal[goalId].push({ step, goal })
              })
              
              // Check if there are any overdue or today's steps in no-area steps
              let hasOverdueOrTodaySteps = false
              let hasFutureSteps = false
              
              Object.values(noAreaStepsByGoal).forEach(steps => {
                steps.forEach(({ step }) => {
                  const stepDate = step.date ? normalizeDate(step.date) : null
                  const stepDateObj = stepDate ? new Date(stepDate) : null
                  if (stepDateObj) stepDateObj.setHours(0, 0, 0, 0)
                  const isToday = stepDateObj && stepDateObj.getTime() === today.getTime()
                  const isOverdue = (step as any)._isOverdue || false
                  
                  if (!step.completed) {
                    if (isOverdue || isToday) {
                      hasOverdueOrTodaySteps = true
                    } else if (stepDateObj && stepDateObj > today) {
                      hasFutureSteps = true
                    }
                  }
                })
              })
              
              return (
                <div className="card-playful-base">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Footprints className="w-5 h-5 text-primary-600" />
                      <h2 className="text-lg font-bold text-black font-playful">
                        {t('views.otherSteps') || 'Ostatní kroky'}
            </h2>
                    </div>
                  </div>
                  
                  {/* Show positive message if no overdue or today's steps, but there are future steps */}
                  {!hasOverdueOrTodaySteps && hasFutureSteps && (
                    <div className="mb-4 p-4 bg-primary-100 border-2 border-primary-300 rounded-playful-md">
                      <p className="text-sm font-semibold text-primary-700 mb-1">
                        {t('views.allDone') || 'Vše je splněno! Dobrá práce! 🎉'}
                      </p>
                      <p className="text-xs text-primary-600">
                        {t('views.futureStepsNote') || 'Níže jsou úkoly do budoucna, které ale ještě vydrží.'}
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    {Object.entries(noAreaStepsByGoal).map(([goalId, steps]) => {
                      const goal = goalId !== 'no-goal' ? goalMap.get(goalId) : null
                      
                      return (
                        <div key={goalId} className="space-y-2">
                          {/* Goal title */}
                          {goal && (
                            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                              {goal.icon && (() => {
                                const GoalIconComponent = getIconComponent(goal.icon)
                                return <GoalIconComponent className="w-4 h-4 text-primary-600" />
                              })()}
                              {goal.title}
                            </h3>
                          )}
                          
                          {/* Steps for this goal */}
                          {steps.map(({ step, goal: stepGoal }) => {
                    const isLoading = loadingSteps.has(step.id)
                    const stepDate = step.date ? normalizeDate(step.date) : null
                    const stepDateObj = stepDate ? new Date(stepDate) : null
                    if (stepDateObj) stepDateObj.setHours(0, 0, 0, 0)
                    const isToday = stepDateObj && stepDateObj.getTime() === today.getTime()
                    const isOverdue = (step as any)._isOverdue || false
                    const isFuture = stepDateObj && stepDateObj > today && !isOverdue && !isToday
                    const stepDateFormatted = stepDate ? formatStepDate(stepDate) : null
                    
                    // Get area from goal for icon color
                    const stepAreaForColor = stepGoal?.area_id ? areaMap.get(stepGoal.area_id) : null
                    
                    return (
                <div
                  key={step.id}
                  onClick={() => handleItemClick(step, 'step')}
                        className={`flex items-center gap-3 p-3 cursor-pointer ${
                          step.completed
                            ? 'box-playful-pressed bg-white opacity-50'
                            : isOverdue
                              ? 'border-2 border-red-500 bg-red-50 hover:bg-red-100 rounded-playful-lg'
                              : isToday
                                ? 'box-playful-pressed bg-white hover:bg-primary-50'
                                : isFuture
                                  ? 'box-playful-pressed-future opacity-75 hover:opacity-85 hover:bg-white/85 group'
                                  : 'box-playful-pressed bg-white hover:bg-primary-50'
                        } ${isLoading ? 'opacity-50' : ''}`}
                        style={isFuture ? { border: '2px solid #fbc98d' } : undefined}
                >
                        {/* Checkbox */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStepToggle(step.id, !step.completed)
                    }}
                          disabled={isLoading}
                          className={`w-6 h-6 rounded-playful-sm border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                      step.completed
                              ? 'bg-white border-primary-500' 
                              : 'border-primary-500 hover:bg-primary-100'
                    }`}
                  >
                          {isLoading ? (
                            <svg className="animate-spin h-3 w-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                          ) : step.completed ? (
                            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                          ) : null}
                  </button>
                        
                        {/* Goal icon in area color */}
                        {stepGoal && stepGoal.icon && (
                          <div className="flex-shrink-0">
                            {(() => {
                              const GoalIconComponent = getIconComponent(stepGoal.icon)
                              return (
                                <GoalIconComponent 
                                  className={`w-5 h-5 transition-opacity ${isFuture ? 'opacity-60 group-hover:opacity-80' : ''}`}
                                  style={{ color: stepAreaForColor?.color || '#E8871E' }} 
                                />
                              )
                            })()}
                          </div>
                        )}
                        
                        {/* Title */}
                  <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {step.frequency && step.frequency !== null && (
                              <Repeat className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${isFuture ? 'text-primary-400 group-hover:text-primary-500' : 'text-primary-600'}`} />
                            )}
                            <span className={`text-sm truncate transition-colors ${
                              step.completed 
                                ? 'line-through text-gray-400' 
                                : isOverdue
                                  ? 'text-red-600'
                                  : isFuture
                                    ? 'text-gray-500 group-hover:text-gray-700'
                                    : 'text-black'
                            } ${step.is_important && !step.completed && !isFuture ? 'font-bold' : 'font-medium'}`}>
                              {step.title}
                            </span>
                            {step.checklist && step.checklist.length > 0 && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-playful-sm flex-shrink-0 border-2 ${
                                step.checklist.filter((c: any) => c.completed).length === step.checklist.length
                                  ? 'bg-primary-100 text-primary-600 border-primary-500'
                                  : 'bg-gray-100 text-gray-500 border-gray-300'
                              }`}>
                                {step.checklist.filter((c: any) => c.completed).length}/{step.checklist.length}
                      </span>
                    )}
                  </div>
                          {/* Goal name */}
                          {stepGoal && (
                            <div className={`flex items-center gap-1 text-xs transition-colors ${isFuture ? 'text-gray-400 group-hover:text-gray-500' : 'text-gray-500'}`}>
                              <span>{stepGoal.title}</span>
                </div>
                          )}
            </div>
                        
                        {/* Meta info - hidden on mobile */}
                        {step.frequency && step.frequency !== null ? (
                          // Recurring step - show icon and time only, no date picker
                          <>
                            <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500">
                              <Repeat className="w-3 h-3" />
                              <span>{step.frequency === 'daily' ? (locale === 'cs' ? 'Denně' : 'Daily') : 
                                     step.frequency === 'weekly' ? (locale === 'cs' ? 'Týdně' : 'Weekly') :
                                     step.frequency === 'monthly' ? (locale === 'cs' ? 'Měsíčně' : 'Monthly') : ''}</span>
          </div>
                            <button 
                              onClick={(e) => openTimePicker(e, step)}
                              className={`hidden sm:block w-20 text-xs text-center flex-shrink-0 rounded-playful-sm px-1 py-0.5 transition-colors border-2 text-gray-600 hover:bg-gray-100 border-gray-300`}
                            >
                              {step.estimated_time ? `${step.estimated_time} min` : '-'}
                            </button>
                          </>
                        ) : (
                          // Non-recurring step - show date and time pickers
                          <>
                            <button
                              onClick={(e) => openDatePicker(e, step)}
                              className={`hidden sm:block w-28 text-xs text-center capitalize flex-shrink-0 rounded-playful-sm px-1 py-0.5 transition-colors border-2 ${
                                isOverdue
                                  ? 'text-red-600 hover:bg-red-100 border-red-300'
                                  : isToday
                                    ? 'text-primary-600 hover:bg-primary-100 border-primary-500' 
                                    : isFuture
                                      ? 'text-gray-400 group-hover:text-gray-600 hover:bg-gray-50 border-gray-200 group-hover:border-gray-300'
                                      : 'text-gray-600 hover:bg-gray-100 border-gray-300'
                              }`}
                            >
                              {isOverdue ? '❗' : ''}{stepDateFormatted || '-'}
                            </button>
                            <button 
                              onClick={(e) => openTimePicker(e, step)}
                              className={`hidden sm:block w-20 text-xs text-center flex-shrink-0 rounded-playful-sm px-1 py-0.5 transition-colors border-2 ${
                                isOverdue
                                  ? 'text-red-600 hover:bg-red-100 border-red-300'
                                  : 'text-gray-600 hover:bg-gray-100 border-gray-300'
                              }`}
                            >
                              {step.estimated_time ? `${step.estimated_time} min` : '-'}
                            </button>
                          </>
        )}
      </div>
                    )
                  })}
    </div>
  )
                    })}
                  </div>
                </div>
              )
            })()}
          </>
        )
                    )}
                  </div>
      
      {/* Date Picker Modal */}
      {datePickerStep && datePickerPosition && (
        <>
            <div 
            className="fixed inset-0 z-40"
            onClick={handleCancelDate}
          />
          <div 
            className="fixed z-50 box-playful-highlight p-4 bg-white"
            style={{
              top: `${Math.min(datePickerPosition.top, window.innerHeight - 380)}px`,
              left: `${Math.min(Math.max(datePickerPosition.left - 100, 10), window.innerWidth - 250)}px`,
              width: '230px'
            }}
          >
            <div className="text-sm font-bold text-black mb-3 font-playful">{locale === 'cs' ? 'Datum' : 'Date'}</div>
            
            {/* Day names */}
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {locale === 'cs' 
                ? ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map(day => (
                    <div key={day} className="text-center text-xs text-gray-600 font-medium py-1">
                      {day}
                </div>
                  ))
                : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => (
                    <div key={day} className="text-center text-xs text-gray-600 font-medium py-1">
                      {day}
            </div>
                  ))
              }
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
                const selectedDate = selectedDateInPicker ? new Date(selectedDateInPicker) : null
                if (selectedDate) selectedDate.setHours(0, 0, 0, 0)
                
                return days.map((day, i) => {
                  if (!day) {
                    return <div key={`empty-${i}`} className="w-7 h-7" />
                  }
                  
                  const isToday = day.getTime() === today.getTime()
                  const isSelected = selectedDate && day.getTime() === selectedDate.getTime()
                  
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
                onClick={handleSaveDate}
                className="btn-playful-base flex-1 px-3 py-1.5 bg-white text-black text-xs font-semibold hover:bg-primary-50"
              >
                {locale === 'cs' ? 'Uložit' : 'Save'}
              </button>
              <button
                onClick={handleCancelDate}
                className="btn-playful-base px-3 py-1.5 bg-white text-black text-xs font-semibold hover:bg-primary-50"
              >
                {locale === 'cs' ? 'Zrušit' : 'Cancel'}
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
            onClick={handleCancelTime}
          />
          <div 
            className="fixed z-50 box-playful-highlight p-4 bg-white"
            style={{
              top: `${timePickerPosition.top}px`,
              left: `${timePickerPosition.left}px`,
              width: '160px'
            }}
          >
            <div className="text-sm font-bold text-black mb-3 font-playful">{locale === 'cs' ? 'Čas (min)' : 'Time (min)'}</div>
            
            {/* Time options */}
            <div className="grid grid-cols-3 gap-1 mb-3">
              {[5, 10, 15, 20, 30, 45, 60, 90, 120].map(minutes => (
                <button
                  key={minutes}
                  onClick={() => handleTimeSelect(minutes)}
                  className={`py-1.5 rounded-playful-sm text-xs font-semibold transition-colors border-2 ${
                    selectedTimeInPicker === minutes
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
                placeholder={locale === 'cs' ? 'Vlastní' : 'Custom'}
                value={selectedTimeInPicker !== null ? selectedTimeInPicker : ''}
                onChange={(e) => {
                  const value = parseInt(e.target.value)
                  if (!isNaN(value) && value > 0) {
                    setSelectedTimeInPicker(value)
                  } else if (e.target.value === '') {
                    setSelectedTimeInPicker(null)
                  }
                }}
                className="flex-1 px-2 py-1.5 text-xs border-2 border-primary-500 rounded-playful-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                id="custom-time-input-upcoming"
              />
            </div>
            
            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleSaveTime}
                className="btn-playful-base flex-1 px-3 py-1.5 bg-white text-black text-xs font-semibold hover:bg-primary-50"
              >
                {locale === 'cs' ? 'Uložit' : 'Save'}
              </button>
              <button
                onClick={handleCancelTime}
                className="btn-playful-base px-3 py-1.5 bg-white text-black text-xs font-semibold hover:bg-primary-50"
              >
                {locale === 'cs' ? 'Zrušit' : 'Cancel'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
