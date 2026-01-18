'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { getLocalDateString, normalizeDate } from '../utils/dateHelpers'
import { isHabitScheduledForDay } from '../utils/habitHelpers'
import { isStepScheduledForDay } from '../utils/stepHelpers'
import { Check, Plus, Footprints, Trash2, ChevronDown, Repeat, Star } from 'lucide-react'
import { getIconComponent } from '@/lib/icon-utils'
import { StepsManagementView } from './StepsManagementView'

interface UpcomingViewProps {
  goals?: any[]
  habits: any[]
  dailySteps: any[]
  isLoadingSteps?: boolean
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
  onStepImportantChange?: (stepId: string, isImportant: boolean) => Promise<void>
  loadingHabits: Set<string>
  loadingSteps: Set<string>
  player?: any
  userId?: string | null
  maxUpcomingSteps?: number // Max number of upcoming steps to show (default: 5)
  createNewStepTrigger?: number // Optional external trigger for creating new steps
  onNewStepCreatedForUpcoming?: () => void // Callback when a new step is created
  onDailyStepsUpdate?: (steps: any[]) => void // Callback to update parent's dailySteps
}

export function UpcomingView({
  goals = [],
  habits,
  dailySteps,
  isLoadingSteps = false,
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
  onStepImportantChange,
  loadingHabits,
  loadingSteps,
  player,
  userId,
  maxUpcomingSteps = 5, // Default max upcoming steps
  createNewStepTrigger: externalCreateNewStepTrigger, // Optional external trigger
  onNewStepCreatedForUpcoming, // Callback when a new step is created
  onDailyStepsUpdate: onDailyStepsUpdateProp // Callback to update parent's dailySteps
}: UpcomingViewProps) {
  const t = useTranslations()
  const locale = useLocale()
  const localeCode = locale === 'cs' ? 'cs-CZ' : 'en-US'
  
  // View mode: 'feed' or 'areas'
  const [viewMode, setViewMode] = useState<'feed' | 'areas'>('feed')
  const [feedDisplayCount, setFeedDisplayCount] = useState(20) // Number of steps to display in feed
  const [isLoadingViewMode, setIsLoadingViewMode] = useState(true)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  
  // State for StepsManagementView integration
  const [createNewStepTrigger, setCreateNewStepTrigger] = useState(0)
  const [localDailySteps, setLocalDailySteps] = useState<any[]>(dailySteps)
  
  // Sync localDailySteps with prop, removing duplicates and deleted steps
  // Also track deleted step IDs to prevent them from reappearing
  const deletedStepIdsRef = useRef<Set<string>>(new Set())
  const prevDailyStepsHashRef = useRef<string>('') // Serialized hash of IDs and key properties for change detection
  
  // Listen for custom events as backup mechanism for step updates
  useEffect(() => {
    const handleDailyStepsUpdated = (event: any) => {
      const { steps } = event.detail || {}
      if (steps && Array.isArray(steps)) {
        // Update local state from event
        const currentStepsHash = JSON.stringify({
          length: steps.length,
          steps: steps.map((s: any) => ({
            id: s?.id,
            completed: s?.completed,
            date: s?.date,
            goal_id: s?.goal_id,
            area_id: s?.area_id,
            title: s?.title
          })).sort((a, b) => (a?.id || '').localeCompare(b?.id || ''))
        })
        
        if (currentStepsHash !== prevDailyStepsHashRef.current) {
          prevDailyStepsHashRef.current = currentStepsHash
          
          setLocalDailySteps(prev => {
            // Create a map to deduplicate steps by ID
            const stepMap = new Map<string, any>()
            
            // Add all steps from event, filtering out deleted ones
            steps.forEach((step: any) => {
              if (step && step.id && !deletedStepIdsRef.current.has(step.id)) {
                stepMap.set(step.id, step)
              }
            })
            
            // Filter out deleted steps from previous state
            prev.forEach((step: any) => {
              if (step && step.id && !deletedStepIdsRef.current.has(step.id)) {
                if (!stepMap.has(step.id)) {
                  stepMap.set(step.id, step)
                }
              }
            })
            
            return Array.from(stepMap.values())
          })
        }
      }
    }
    
    // Listen for assistant action completion events
    const handleAssistantActionCompleted = async (event: any) => {
      const { actions } = event.detail || {}
      if (!actions || !Array.isArray(actions)) {
        console.log('[UpcomingView] assistantActionCompleted: no actions or invalid format')
        return
      }
      
      console.log('[UpcomingView] assistantActionCompleted:', { actionsCount: actions.length, actions })
      
      // Find all step-related actions (create, update, complete)
      const stepActions = actions.filter((action: any) => 
        action.type === 'step' && (action.operation === 'create' || action.operation === 'update') && action.success && action.data?.step
      )
      
      // Find completed step actions
      const completedStepActions = actions.filter((action: any) => 
        action.type === 'step' && action.operation === 'complete' && action.success
      )
      
      console.log('[UpcomingView] Step actions found:', { 
        stepActions: stepActions.length, 
        completedStepActions: completedStepActions.length 
      })
      
      if (stepActions.length > 0 || completedStepActions.length > 0) {
        // Fetch updated steps from server
        try {
          const currentUserId = userId || player?.user_id
          if (!currentUserId) {
            console.error('Cannot fetch updated steps: userId is not available')
            return
          }
          
          // Use the same date range as initial load (90 days back, 30 days forward)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const veryOldDate = new Date(today)
          veryOldDate.setDate(veryOldDate.getDate() - 90)
          const endDate = new Date(today)
          endDate.setDate(endDate.getDate() + 30)
          
          const startDateStr = getLocalDateString(veryOldDate)
          const endDateStr = getLocalDateString(endDate)
          
          const response = await fetch(`/api/daily-steps?userId=${currentUserId}&startDate=${startDateStr}&endDate=${endDateStr}`)
          if (response.ok) {
            const updatedSteps = await response.json()
            
            // Track new step IDs for animation
            const newStepIds = new Set<string>()
            stepActions.forEach((action: any) => {
              if (action.data?.step?.id) {
                newStepIds.add(action.data.step.id)
              }
            })
            
            // Update local state with animation - replace all steps with fresh data from server
            const finalSteps = updatedSteps.map((step: any) => {
              if (step && step.id && !deletedStepIdsRef.current.has(step.id)) {
                // Mark as new for animation
                if (newStepIds.has(step.id)) {
                  step._isNew = true
                  // Remove animation flag after animation completes
                  setTimeout(() => {
                    setLocalDailySteps(current => 
                      current.map(s => s.id === step.id ? { ...s, _isNew: false } : s)
                    )
                  }, 1000)
                }
                return step
              }
              return null
            }).filter((step: any) => step !== null)
            
            console.log('[UpcomingView] Updating steps after assistant action:', { 
              finalStepsCount: finalSteps.length,
              newStepIds: Array.from(newStepIds)
            })
            
            setLocalDailySteps(finalSteps)
            
            // Notify parent component - this is critical for updating the parent state
            if (onDailyStepsUpdateProp) {
              console.log('[UpcomingView] Calling onDailyStepsUpdateProp with', finalSteps.length, 'steps')
              onDailyStepsUpdateProp(finalSteps)
            } else {
              console.warn('[UpcomingView] onDailyStepsUpdateProp is not defined!')
            }
            
            // Also dispatch event to ensure all components are updated
            console.log('[UpcomingView] Dispatching dailyStepsUpdated event')
            window.dispatchEvent(new CustomEvent('dailyStepsUpdated', { 
              detail: { steps: finalSteps, source: 'UpcomingView-assistant' } 
            }))
          }
        } catch (error) {
          console.error('Error fetching updated steps after assistant action:', error)
        }
      }
      
      // Handle habit completion updates
      const habitActions = actions.filter((action: any) => 
        action.type === 'habit' && action.operation === 'complete' && action.success
      )
      
      if (habitActions.length > 0) {
        // Trigger a refresh of habits (parent component should handle this)
        window.dispatchEvent(new CustomEvent('habitsUpdated'))
      }
    }
    
    window.addEventListener('dailyStepsUpdated', handleDailyStepsUpdated)
    window.addEventListener('assistantActionCompleted', handleAssistantActionCompleted)
    return () => {
      window.removeEventListener('dailyStepsUpdated', handleDailyStepsUpdated)
      window.removeEventListener('assistantActionCompleted', handleAssistantActionCompleted)
    }
  }, [onDailyStepsUpdateProp])
  
  useEffect(() => {
    // Create a hash of step IDs and their key properties (including completed status) to detect changes
    // This ensures we detect when a step's completed status changes, not just when IDs are added/removed
    // Also include title and length to catch new steps
    const currentStepsHash = JSON.stringify({
      length: (dailySteps || []).length,
      steps: (dailySteps || []).map((s: any) => ({
        id: s?.id,
        completed: s?.completed,
        date: s?.date,
        goal_id: s?.goal_id,
        area_id: s?.area_id,
        title: s?.title // Include title to catch new steps
      })).sort((a, b) => (a?.id || '').localeCompare(b?.id || ''))
    })
    
    // Check if dailySteps prop actually changed (by IDs and key properties)
    if (currentStepsHash === prevDailyStepsHashRef.current) {
      return // No change, skip update
    }
    
    prevDailyStepsHashRef.current = currentStepsHash
    
    setLocalDailySteps(prev => {
      // Create a map to deduplicate steps by ID
      const stepMap = new Map<string, any>()
      
      // First, add all steps from dailySteps prop (these are the source of truth)
      // But exclude steps that were deleted (to prevent them from reappearing)
      if (Array.isArray(dailySteps)) {
        dailySteps.forEach(step => {
          if (step && step.id && !deletedStepIdsRef.current.has(step.id)) {
            stepMap.set(step.id, step)
          }
        })
      }
      
      // Then, preserve any temporary or new steps from localDailySteps
      if (Array.isArray(prev)) {
        prev.forEach(step => {
          if (step && step.id) {
            // Skip deleted steps
            if (deletedStepIdsRef.current.has(step.id)) {
              return
            }
            // Preserve temporary steps and new steps (if not already in map)
            if ((step._isTemporary || step._isNew) && !stepMap.has(step.id)) {
              stepMap.set(step.id, step)
            }
          }
        })
      }
      
      // Convert map back to array
      const deduplicatedSteps = Array.from(stepMap.values())
      
      // If any steps were removed from dailySteps prop, ensure they're removed from localDailySteps
      const currentIds = new Set(prev.map((s: any) => s?.id).filter(Boolean))
      const newIds = new Set(deduplicatedSteps.map((s: any) => s?.id).filter(Boolean))
      
      // Check if any steps were deleted (in prev but not in new)
      const deletedIds = Array.from(currentIds).filter(id => !newIds.has(id))
      if (deletedIds.length > 0) {
        deletedIds.forEach(id => {
          const step = prev.find((s: any) => s.id === id)
          // Only track as deleted if not temporary or new
          if (step && !step._isTemporary && !step._isNew) {
            deletedStepIdsRef.current.add(id)
          }
        })
      }
      
      // Check if there are new steps in dailySteps prop that weren't in prev
      const hasNewSteps = Array.from(newIds).some(id => !currentIds.has(id))
      
      // If new steps were added, remove them from deleted set (they were recreated)
      if (hasNewSteps) {
        Array.from(newIds).forEach(id => {
          if (!currentIds.has(id)) {
            deletedStepIdsRef.current.delete(id)
          }
        })
      }
      
      // Always update if prop changed (new steps, deleted steps, or any changes)
      return deduplicatedSteps
    })
  }, [dailySteps]) // Only depend on dailySteps prop, not localDailySteps to avoid infinite loop
  
  // Sync external trigger with internal state
  useEffect(() => {
    if (externalCreateNewStepTrigger && externalCreateNewStepTrigger > 0) {
      setCreateNewStepTrigger(externalCreateNewStepTrigger)
    }
  }, [externalCreateNewStepTrigger])
  
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
  
  // Get today's habits, sorted by reminder_time (earliest left, latest right)
  const todaysHabits = useMemo(() => {
    const filtered = habits.filter(habit => {
      return isHabitScheduledForDay(habit, today)
    })
    
    // Sort primarily by reminder_time (earliest time left, latest time right)
    // Secondary: order (if exists) or created_at, then id as final tiebreaker
    return filtered.sort((a: any, b: any) => {
      // Primary: reminder_time (habits with time come first, sorted by time - earliest left)
      const aTime = a.reminder_time || ''
      const bTime = b.reminder_time || ''
      
      if (aTime && bTime) {
        // Both have time - compare times (earlier time comes first)
        const timeCompare = aTime.localeCompare(bTime)
        if (timeCompare !== 0) return timeCompare
      } else if (aTime && !bTime) {
        // a has time, b doesn't - a comes first
        return -1
      } else if (!aTime && bTime) {
        // b has time, a doesn't - b comes first
        return 1
      }
      // Both don't have time - continue to secondary sort
      
      // Secondary: order (if exists) or created_at timestamp
      const aOrder = a.order !== undefined ? a.order : (a.created_at ? new Date(a.created_at).getTime() : 0)
      const bOrder = b.order !== undefined ? b.order : (b.created_at ? new Date(b.created_at).getTime() : 0)
      
      if (aOrder !== bOrder) {
        return aOrder - bOrder
      }
      
      // Final tiebreaker: use id for absolute stability (id never changes)
      return a.id.localeCompare(b.id)
    })
  }, [habits, today])
  
  // OLD LOGIC REMOVED: No more creating instances - recurring steps use current_instance_date
  // The API handles setting current_instance_date automatically
  
  // Helper function to check if a repeating step is completed for a specific date
  // NEW SIMPLIFIED LOGIC: Recurring steps are never completed - they just move to next occurrence
  const isStepCompletedForDate = (step: any, date: Date): boolean => {
    // Recurring steps are never completed - they just move to next occurrence
    if (step.frequency && step.frequency !== null) {
      return false
    }
    
    // For non-recurring steps, check if they're completed
    if (!step.completed) return false
    
    const dateStr = getLocalDateString(date)
    const stepDate = step.date ? normalizeDate(step.date) : null
    if (!stepDate) return false
    
    const stepDateStr = getLocalDateString(new Date(stepDate))
    return stepDateStr === dateStr
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
    
    // NEW SIMPLIFIED LOGIC: For recurring steps, use current_instance_date
    if (step.current_instance_date) {
      const instanceDate = new Date(normalizeDate(step.current_instance_date))
      instanceDate.setHours(0, 0, 0, 0)
      // Recurring steps are never completed - they just move to next occurrence
      if (instanceDate >= fromDate) {
        return instanceDate
      }
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
  // SIMPLIFIED: All steps (including recurring) already have correct date in database, no calculations needed
  const allFeedSteps = useMemo(() => {
    const stepsWithDates: Array<{ step: any; date: Date; isImportant: boolean; isUrgent: boolean; isOverdue: boolean; goal: any; area: any }> = []
    
    // Ensure dailySteps is an array
    if (!Array.isArray(dailySteps)) {
      console.error('dailySteps is not an array:', dailySteps)
      return []
    }
    
    // Process ALL steps (recurring steps already have correct date from database)
    // Exclude hidden steps and completed steps
    dailySteps
      .filter(step => {
        // Exclude hidden steps (old recurring step templates)
        if (step.is_hidden === true) return false
        // Exclude completed steps
        if (step.completed) return false
        // Exclude steps without date (we need date for Upcoming view)
        if (!step.date) return false
        // Exclude old instances (they have parent_recurring_step_id)
        if (step.parent_recurring_step_id) return false
        return true
      })
      .forEach(step => {
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
          isUrgent: step.is_urgent || false,
          isOverdue,
          goal,
          area
        })
      })
    
    // Sort: overdue first, then by date, then by importance within same date
    stepsWithDates.sort((a, b) => {
      // Overdue steps first
      if (a.isOverdue && !b.isOverdue) return -1
      if (!a.isOverdue && b.isOverdue) return 1
      
      // Same overdue status - sort by date (oldest first, newest last)
      const dateDiff = a.date.getTime() - b.date.getTime()
      if (dateDiff !== 0) return dateDiff
      
      // Same date - sort by priority (important + urgent), then by step number
      const aPriority = (a.isImportant ? 2 : 0) + (a.isUrgent ? 1 : 0)
      const bPriority = (b.isImportant ? 2 : 0) + (b.isUrgent ? 1 : 0)
      if (aPriority !== bPriority) {
        return bPriority - aPriority // Higher priority first (important steps on top)
      }
      
      // If same priority, sort by step number (e.g., 1/7, 2/7, etc.) if present
      const extractStepNumber = (title: string): number | null => {
        const match = title.match(/^(\d+)\/\d+/)
        return match ? parseInt(match[1], 10) : null
      }
      
      const aStepNum = extractStepNumber(a.step.title || '')
      const bStepNum = extractStepNumber(b.step.title || '')
      
      if (aStepNum !== null && bStepNum !== null) {
        return aStepNum - bStepNum // Sort 1, 2, 3, etc. (ascending)
      }
      
      return 0
    })
    
    // Return all steps with additional metadata (no limit)
    const result = stepsWithDates.map(item => ({
      ...item.step,
      _isOverdue: item.isOverdue,
      _goal: item.goal,
      _area: item.area,
      _date: item.date
    }))
    
    return result
  }, [dailySteps, today, oneMonthFromToday, goalMap, areaMap])
  
  // Get upcoming steps - sorted by date, with overdue first, then important first within each day
  // Limited to 15 steps total and max one month ahead (except overdue steps - show all overdue)
  // SIMPLIFIED: All steps (including recurring) already have correct date in database, no calculations needed
  const upcomingSteps = useMemo(() => {
    const stepsWithDates: Array<{ step: any; date: Date; isImportant: boolean; isUrgent: boolean; isOverdue: boolean; goal: any; area: any }> = []
    
    // Ensure dailySteps is an array
    if (!Array.isArray(dailySteps)) {
      console.error('dailySteps is not an array:', dailySteps)
      return []
    }
    
    // Process ALL steps (recurring steps already have correct date from database)
    // Exclude hidden steps and completed steps
    dailySteps
      .filter(step => {
        // Exclude hidden steps (old recurring step templates)
        if (step.is_hidden === true) return false
        // Exclude completed steps
        if (step.completed) return false
        // Exclude steps without date (we need date for Upcoming view)
        if (!step.date) return false
        // Exclude old instances (they have parent_recurring_step_id)
        if (step.parent_recurring_step_id) return false
        
        // Check date range - include if overdue or within one month
      const stepDate = new Date(normalizeDate(step.date))
      stepDate.setHours(0, 0, 0, 0)
          const isOverdue = stepDate < today
          return isOverdue || stepDate <= oneMonthFromToday
      })
      .forEach(step => {
        const stepDate = new Date(normalizeDate(step.date))
        stepDate.setHours(0, 0, 0, 0)
        const isOverdue = stepDate < today
        
        const goal = step.goal_id ? goalMap.get(step.goal_id) : null
        // Get area from goal if exists, otherwise from step directly
        const area = goal?.area_id 
          ? areaMap.get(goal.area_id) 
          : (step.area_id ? areaMap.get(step.area_id) : null)
        
        stepsWithDates.push({
          step,
          date: stepDate,
          isImportant: step.is_important || false,
          isUrgent: step.is_urgent || false,
          isOverdue,
        goal,
        area
      })
    })
    
    // Sort: overdue first, then by date, then by importance within same date
    stepsWithDates.sort((a, b) => {
      // Overdue steps first
      if (a.isOverdue && !b.isOverdue) return -1
      if (!a.isOverdue && b.isOverdue) return 1
      
      // Same overdue status - sort by date (oldest first, newest last)
      const dateDiff = a.date.getTime() - b.date.getTime()
      if (dateDiff !== 0) return dateDiff
      
      // Same date - sort by priority (important + urgent), then by step number
      const aPriority = (a.isImportant ? 2 : 0) + (a.isUrgent ? 1 : 0)
      const bPriority = (b.isImportant ? 2 : 0) + (b.isUrgent ? 1 : 0)
      if (aPriority !== bPriority) {
        return bPriority - aPriority // Higher priority first (important steps on top)
      }
      
      // If same priority, sort by step number (e.g., 1/7, 2/7, etc.) if present
      const extractStepNumber = (title: string): number | null => {
        const match = title.match(/^(\d+)\/\d+/)
        return match ? parseInt(match[1], 10) : null
      }
      
      const aStepNum = extractStepNumber(a.step.title || '')
      const bStepNum = extractStepNumber(b.step.title || '')
      
      if (aStepNum !== null && bStepNum !== null) {
        return aStepNum - bStepNum // Sort 1, 2, 3, etc. (ascending)
      }
      
      return 0
    })
    
    // Limit to 15 steps total, but include ALL overdue steps
    const overdueSteps = stepsWithDates.filter(item => item.isOverdue)
    const nonOverdueSteps = stepsWithDates.filter(item => !item.isOverdue)
    const limitedNonOverdue = nonOverdueSteps.slice(0, Math.max(0, 15 - overdueSteps.length))
    const limitedSteps = [...overdueSteps, ...limitedNonOverdue]
    
    // Return steps with additional metadata
    const result = limitedSteps.map(item => ({
      ...item.step,
      _isOverdue: item.isOverdue,
      _goal: item.goal,
      _area: item.area
    }))
    
    return result
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

  // Group habits by area for Areas view
  // Note: habits are already sorted by reminder_time in todaysHabits
  const habitsByArea = useMemo(() => {
    const grouped: Record<string, any[]> = {}
    const noAreaHabits: any[] = []
    
    todaysHabits.forEach(habit => {
      if (habit.area_id) {
        if (!grouped[habit.area_id]) {
          grouped[habit.area_id] = []
        }
        grouped[habit.area_id].push(habit)
      } else {
        noAreaHabits.push(habit)
      }
    })
    
    // Sort habits within each area group by reminder_time (already sorted in todaysHabits, but ensure consistency)
    Object.keys(grouped).forEach(areaId => {
      grouped[areaId].sort((a: any, b: any) => {
        const aTime = a.reminder_time || ''
        const bTime = b.reminder_time || ''
        if (aTime && bTime) {
          return aTime.localeCompare(bTime)
        } else if (aTime && !bTime) {
          return -1
        } else if (!aTime && bTime) {
          return 1
        }
        return a.id.localeCompare(b.id)
      })
    })
    
    // Sort noAreaHabits by reminder_time
    noAreaHabits.sort((a: any, b: any) => {
      const aTime = a.reminder_time || ''
      const bTime = b.reminder_time || ''
      if (aTime && bTime) {
        return aTime.localeCompare(bTime)
      } else if (aTime && !bTime) {
        return -1
      } else if (!aTime && bTime) {
        return 1
      }
      return a.id.localeCompare(b.id)
    })
    
    return { grouped, noAreaHabits }
  }, [todaysHabits])
  
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
  
  const formatStepDate = (dateStr: string | null, isCompleted: boolean = false) => {
    if (!dateStr) return ''
    const date = new Date(normalizeDate(dateStr))
    const dateObj = new Date(date)
    dateObj.setHours(0, 0, 0, 0)
    
    // For completed steps, always show the date (not "Today" or weekday name)
    if (isCompleted) {
      return date.toLocaleDateString(locale === 'cs' ? 'cs-CZ' : 'en-US', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
      })
    }
    
    // For non-completed steps, show "Today" if it's today's date
    const isToday = dateObj.getTime() === today.getTime()
    if (isToday) {
      return t('focus.today') || 'Dnes'
    }
    
    // Calculate days difference
    const diffTime = dateObj.getTime() - today.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    // For overdue steps (in the past): use weekday name only if within 6 days
    if (diffDays < 0 && diffDays >= -6) {
      return dateObj.toLocaleDateString(locale === 'cs' ? 'cs-CZ' : 'en-US', { weekday: 'long' })
    }
    
    // For future steps: use weekday name only if within 6 days
    if (diffDays > 0 && diffDays <= 6) {
      return dateObj.toLocaleDateString(locale === 'cs' ? 'cs-CZ' : 'en-US', { weekday: 'long' })
    }
    
    // For dates outside the 6-day range (both past and future), always show date
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
      try {
      const dateStr = getLocalDateString(selectedDateInPicker)
      await onStepDateChange(datePickerStep.id, dateStr)
        // Close picker only on success
    setDatePickerStep(null)
    setDatePickerPosition(null)
    setSelectedDateInPicker(null)
      } catch (error) {
        // Error is already handled in handleStepDateChange
        // Keep picker open so user can try again
        console.error('Error saving date:', error)
      }
    }
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
              <button
              onClick={() => setCreateNewStepTrigger(prev => prev + 1)}
                className="btn-playful-base px-3 py-1.5 text-sm font-semibold text-black bg-white hover:bg-primary-50 flex items-center gap-2"
                title={t('steps.addStep') || 'Přidat krok'}
              >
                <Plus className="w-4 h-4" />
                <span>{t('steps.addStep') || 'Přidat krok'}</span>
              </button>
          </div>
        </div>

        {/* Mobile: Two rows - first row with title and add button, second row with switcher */}
        <div className="flex flex-col gap-3 md:hidden">
          {/* First row: Title left, Add button right */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-black font-playful">
              {t('views.upcoming.title') || 'Nadcházející'}
            </h1>
              <button
              onClick={() => setCreateNewStepTrigger(prev => prev + 1)}
                className="btn-playful-base px-3 py-1.5 text-sm font-semibold text-black bg-white hover:bg-primary-50 flex items-center gap-2"
                title={t('steps.addStep') || 'Přidat krok'}
              >
                <Plus className="w-4 h-4" />
                <span>{t('steps.addStep') || 'Přidat krok'}</span>
              </button>
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
      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* Loading indicator for steps */}
        {isLoadingSteps && (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mb-4"></div>
              <p className="text-sm text-gray-600 font-medium">
                {t('common.loadingData') || 'Načítání kroků...'}
              </p>
            </div>
          </div>
        )}
        
        {/* Today's Habits - only show if there are habits and not loading */}
        {!isLoadingSteps && todaysHabits.length > 0 && (
          <div className="p-4 sm:p-6 lg:p-8 pt-2 pb-4">
            <div className="flex flex-wrap gap-3">
              {todaysHabits.map((habit) => {
                const isCompleted = habit.habit_completions && habit.habit_completions[todayStr] === true
                const loadingKey = `${habit.id}-${todayStr}`
                const isLoading = loadingHabits.has(loadingKey)
                
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
                      isLoading
                        ? 'border-primary-500 bg-white'
                        : isCompleted
                          ? 'bg-primary-500 border-primary-500'
                        : 'border-primary-500 hover:bg-primary-50'
                    } ${isLoading ? 'cursor-not-allowed' : ''}`}
                  >
                      {isLoading ? (
                        <div className="animate-spin h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full"></div>
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
        
        {/* Feed View or Areas View - only show if not loading */}
        {!isLoadingSteps && viewMode === 'feed' ? (
          /* Feed View - using StepsManagementView */
          <StepsManagementView
            dailySteps={localDailySteps}
            goals={goals}
            areas={areas}
            userId={userId}
            player={player}
            onDailyStepsUpdate={(steps) => {
              // Track deleted steps - if a step was in prev but not in new, mark it as deleted
              const currentStepIds = new Set(localDailySteps.map((s: any) => s?.id).filter(Boolean))
              const newStepIds = new Set(steps.map((s: any) => s?.id).filter(Boolean))
              const deletedIds = Array.from(currentStepIds).filter(id => !newStepIds.has(id))
              deletedIds.forEach(id => {
                deletedStepIdsRef.current.add(id)
              })
              
              // Update local state immediately
              setLocalDailySteps(steps)
              
              // Also propagate to parent component (GameWorldView) if available
              // This ensures that when a step is created in upcoming view, it appears everywhere
              if (onDailyStepsUpdateProp) {
                onDailyStepsUpdateProp(steps)
              }
            }}
            onOpenStepModal={(step) => {
              if (onOpenStepModal) {
                onOpenStepModal(undefined, step)
              }
            }}
            onStepImportantChange={onStepImportantChange}
            handleStepToggle={handleStepToggle}
            loadingSteps={loadingSteps}
            createNewStepTrigger={createNewStepTrigger}
            onNewStepCreated={() => {
              // Reset trigger in parent component
              if (onNewStepCreatedForUpcoming) {
                onNewStepCreatedForUpcoming()
              }
            }}
            hideHeader={true}
            showCompleted={false}
          />
        ) : !isLoadingSteps ? (
          /* Areas View - using StepsManagementView with new step at top */
          <>
            {/* New step will appear here if created - above all areas */}
            {createNewStepTrigger > 0 && (
              <div className="mb-4">
                <StepsManagementView
                  dailySteps={localDailySteps}
                  goals={goals}
                  areas={areas}
                  userId={userId}
                  player={player}
                  onDailyStepsUpdate={(steps) => {
                    // Track deleted steps
                    const currentStepIds = new Set(localDailySteps.map((s: any) => s?.id).filter(Boolean))
                    const newStepIds = new Set(steps.map((s: any) => s?.id).filter(Boolean))
                    const deletedIds = Array.from(currentStepIds).filter(id => !newStepIds.has(id))
                    deletedIds.forEach(id => {
                      deletedStepIdsRef.current.add(id)
                    })
                    setLocalDailySteps(steps)
                    if (onDailyStepsUpdateProp) {
                      onDailyStepsUpdateProp(steps)
                    }
                  }}
                  onOpenStepModal={(step) => {
                    if (onOpenStepModal) {
                      onOpenStepModal(undefined, step)
                    }
                  }}
                  onStepImportantChange={onStepImportantChange}
                  handleStepToggle={handleStepToggle}
                  loadingSteps={loadingSteps}
                  createNewStepTrigger={createNewStepTrigger}
                  hideHeader={true}
                  showCompleted={false}
                />
                </div>
              )}
            
            {/* Existing areas view - keep for now, will be replaced with StepsManagementView per area */}
            {upcomingSteps.length === 0 ? (
          <div className="card-playful-base">
          <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Footprints className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-bold text-black font-playful">
                  {t('views.upcomingSteps') || 'Nadcházející kroky'}
            </h2>
              </div>
          </div>
            <p className="text-sm text-gray-600">{t('views.noSteps') || 'Žádné nadcházející kroky'}</p>
            </div>
          ) : (
          <>
                {/* Render steps grouped by area, then by goal - using StepsManagementView for each area */}
            {Object.entries(stepsByArea.grouped).map(([areaId, goalsMap]) => {
              const area = areaMap.get(areaId)
              if (!area) return null
              
                  // Get all steps for this area
                  const areaSteps: any[] = []
              Object.values(goalsMap).forEach(steps => {
                steps.forEach(({ step }) => {
                      areaSteps.push(step)
                    })
                  })
                  
                  // Also include steps without goal in this area
                  if (stepsByArea.noAreaSteps) {
                    stepsByArea.noAreaSteps.forEach(({ step }) => {
                      if (step.area_id === areaId) {
                        areaSteps.push(step)
                      }
                    })
                  }
              
              return (
                    <div key={areaId} className="mb-6">
                      {/* Area header */}
                      <div className="mb-3 px-4 sm:px-6 lg:px-8">
                        <h2 className="text-xl font-bold text-black font-playful">
                          {area.name}
                        </h2>
                      </div>
                      <StepsManagementView
                        dailySteps={areaSteps}
                        goals={goals}
                        areas={areas}
                        userId={userId}
                        player={player}
                        onDailyStepsUpdate={(steps) => {
                          setLocalDailySteps(steps)
                        }}
                        onOpenStepModal={(step) => {
                          if (onOpenStepModal) {
                            onOpenStepModal(undefined, step)
                          }
                        }}
                        onStepImportantChange={onStepImportantChange}
                        handleStepToggle={handleStepToggle}
                        loadingSteps={loadingSteps}
                        createNewStepTrigger={0} // Don't create new steps in area view
                        hideHeader={true}
                        showCompleted={false}
                        areaFilter={areaId} // Filter by this area
                      />
        </div>
              )
            })}
            
                {/* Steps without area */}
                {stepsByArea.noAreaSteps && stepsByArea.noAreaSteps.length > 0 && (
                  <div className="mb-6">
                    {/* Area header for steps without area */}
                    <div className="mb-3 px-4 sm:px-6 lg:px-8">
                      <h2 className="text-xl font-bold text-black font-playful">
                        {t('areas.noArea') || 'Bez oblasti'}
                      </h2>
                    </div>
                    <StepsManagementView
                      dailySteps={stepsByArea.noAreaSteps.map(({ step }) => step)}
                      goals={goals}
                      areas={areas}
                      userId={userId}
                      player={player}
                      onDailyStepsUpdate={(steps) => {
                        setLocalDailySteps(steps)
                      }}
                      onOpenStepModal={(step) => {
                        if (onOpenStepModal) {
                          onOpenStepModal(undefined, step)
                        }
                      }}
                      onStepImportantChange={onStepImportantChange}
                      handleStepToggle={handleStepToggle}
                      loadingSteps={loadingSteps}
                      createNewStepTrigger={0}
                      hideHeader={true}
                      showCompleted={false}
                      areaFilter="none" // Filter for steps without area
                    />
                          </div>
                        )}
                          </>
        )}
          </>
                    ) : null}
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
            
            {/* Day names */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map(day => (
                <div key={day} className="text-center text-[10px] font-semibold text-gray-500">
                      {day}
                </div>
              ))}
          </div>
            
            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {(() => {
                const firstDayOfMonth = new Date(datePickerMonth.getFullYear(), datePickerMonth.getMonth(), 1)
                const lastDayOfMonth = new Date(datePickerMonth.getFullYear(), datePickerMonth.getMonth() + 1, 0)
                const daysInMonth = lastDayOfMonth.getDate()
                const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7 // Convert to Monday = 0
                
                const days: Date[] = []
                
                // Add empty cells for days before the first day of the month
                for (let i = 0; i < startingDayOfWeek; i++) {
                  days.push(new Date(0)) // Placeholder
                }
                
                // Add all days of the month
                for (let day = 1; day <= daysInMonth; day++) {
                  days.push(new Date(datePickerMonth.getFullYear(), datePickerMonth.getMonth(), day))
                }
                
                return days.map((day, index) => {
                  if (day.getTime() === 0) {
                    return <div key={index} className="w-7 h-7" />
                  }
                  
                  const isToday = day.getTime() === today.getTime()
                  const isSelected = selectedDateInPicker && day.getTime() === selectedDateInPicker.getTime()
                  
                  return (
                    <button
                      key={day.getTime()}
                      onClick={async () => {
                        if (datePickerStep && onStepDateChange) {
                          try {
                            const dateStr = getLocalDateString(day)
                            await onStepDateChange(datePickerStep.id, dateStr)
                            // Close picker only on success
                            setDatePickerStep(null)
                            setDatePickerPosition(null)
                            setSelectedDateInPicker(null)
                          } catch (error) {
                            console.error('Error saving date:', error)
                          }
                        }
                      }}
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

