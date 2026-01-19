'use client'

import { useState, useMemo, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { getLocalDateString, normalizeDate } from '../utils/dateHelpers'
import { Check, Plus, Filter, ChevronDown, ChevronUp, Repeat, Star, Calendar, Clock, Target, MapPin, X, RotateCw, CalendarDays, Trash2 } from 'lucide-react'
import { getIconComponent } from '@/lib/icon-utils'
import { DeleteStepModal } from '../modals/DeleteStepModal'

// Add keyframes for modal animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes modalExpand {
      from {
        transform: translate(var(--modal-translate-x, 0px), var(--modal-translate-y, 0px)) scale(0);
        opacity: 0;
      }
      to {
        transform: translate(0px, 0px) scale(1);
        opacity: 1;
      }
    }
  `
  if (!document.head.querySelector('style[data-modal-animation]')) {
    style.setAttribute('data-modal-animation', 'true')
    document.head.appendChild(style)
  }
}

interface StepsManagementViewProps {
  dailySteps: any[]
  goals: any[]
  areas?: any[]
  onDailyStepsUpdate?: (steps: any[]) => void
  userId?: string | null
  player?: any
  onOpenStepModal?: (step?: any) => void
  hideHeader?: boolean
  hideFilters?: boolean
  showCompleted?: boolean
  goalFilter?: string | null
  areaFilter?: string | null
  dateFilter?: string | null
  onStepImportantChange?: (stepId: string, isImportant: boolean) => Promise<void>
  handleStepToggle?: (stepId: string, completed: boolean, completionDate?: string) => Promise<void>
  loadingSteps?: Set<string>
  createNewStepTrigger?: number // Trigger to create new step (increment to trigger)
  onNewStepCreated?: () => void // Callback when a new step is successfully created
}

export function StepsManagementView({
  dailySteps = [],
  goals = [],
  areas = [],
  onDailyStepsUpdate,
  userId,
  player,
  onOpenStepModal,
  hideHeader = false,
  hideFilters = false,
  showCompleted: showCompletedProp,
  goalFilter: goalFilterProp,
  areaFilter: areaFilterProp,
  dateFilter: dateFilterProp,
  onStepImportantChange,
  handleStepToggle,
  loadingSteps: loadingStepsProp,
  createNewStepTrigger,
  onNewStepCreated
}: StepsManagementViewProps) {
  const t = useTranslations()
  const locale = useLocale()
  const localeCode = locale === 'cs' ? 'cs-CZ' : 'en-US'
  
  // Local state for filters
  const [showCompleted, setShowCompleted] = useState(false)
  const [stepsGoalFilter, setStepsGoalFilter] = useState<string | null>(null)
  const [stepsAreaFilter, setStepsAreaFilter] = useState<string | null>(null)
  const [stepsDateFilter, setStepsDateFilter] = useState<string | null>(null)
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [displayedStepsCount, setDisplayedStepsCount] = useState(50)
  const [loadingSteps, setLoadingSteps] = useState<Set<string>>(new Set())
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null)
  const [editingStepData, setEditingStepData] = useState<any>(null)
  
  // Inline modal states for header icons (date/time only now)
  const [inlineModalType, setInlineModalType] = useState<'date' | 'time' | null>(null)
  const [inlineModalPosition, setInlineModalPosition] = useState<{ top: number; left: number; width?: number; height?: number; bottom?: number } | null>(null)
  const [clickedIconId, setClickedIconId] = useState<string | null>(null)
  
  // Date picker states
  const [datePickerMonth, setDatePickerMonth] = useState(new Date())
  const [savingDateStepId, setSavingDateStepId] = useState<string | null>(null)
  const [savingDateStr, setSavingDateStr] = useState<string | null>(null) // Track which date is being saved
  
  // Dropdown states for area/goal (per step)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null) // Format: 'area-stepId' or 'goal-stepId'
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom') // Position of dropdown (bottom by default, top if doesn't fit)
  
  // Repeating step expanded row state
  const [expandedRepeatingStepId, setExpandedRepeatingStepId] = useState<string | null>(null)
  
  // Repeating step form state (local changes, saved on Save button)
  const [repeatingModalFrequency, setRepeatingModalFrequency] = useState<string>('weekly')
  const [repeatingModalSelectedDays, setRepeatingModalSelectedDays] = useState<number[]>([])
  const [repeatingStartDate, setRepeatingStartDate] = useState<string>('')
  const [repeatingEndDate, setRepeatingEndDate] = useState<string | null>(null)
  
  // Pending saves tracking
  const [pendingSaves, setPendingSaves] = useState<Set<string>>(new Set())
  const [showRefreshModal, setShowRefreshModal] = useState(false)
  const [refreshPending, setRefreshPending] = useState(false)
  
  // Delete confirmation modal state
  const [deleteStepToConfirm, setDeleteStepToConfirm] = useState<any | null>(null)
  const [isDeletingStep, setIsDeletingStep] = useState(false)
  
  // Track if a new step is being saved
  const [isSavingNewStep, setIsSavingNewStep] = useState(false)
  
  // Ref for description textarea auto-resize
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null)
  
  // AbortController map for canceling pending requests
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map())
  
  // Debounce timers for auto-save
  const debounceTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
  
  // Track last processed createNewStepTrigger to prevent duplicates
  const lastCreateNewStepTriggerRef = useRef<number>(0)
  
  // New step creation state
  const [newStepId, setNewStepId] = useState<string | null>(null)
  const [newStepOriginalTitle, setNewStepOriginalTitle] = useState<string>('')
  
  // Editing states for inline title
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null)
  const [editingTitleValue, setEditingTitleValue] = useState<string>('')
  
  // Local copy of dailySteps for immediate updates
  const [localDailySteps, setLocalDailySteps] = useState<any[]>(dailySteps)
  
  // Keep a ref to the latest dailySteps prop to avoid stale closures
  const dailyStepsRef = useRef<any[]>(dailySteps)
  useEffect(() => {
    dailyStepsRef.current = dailySteps
  }, [dailySteps])
  
  // State to track when a new step is saved and needs parent update
  const [newStepSaved, setNewStepSaved] = useState<{ savedStep: any; tempId: string } | null>(null)
  
  // Ref to track current localDailySteps to avoid stale closures
  const localDailyStepsRef = useRef<any[]>(localDailySteps)
  useEffect(() => {
    localDailyStepsRef.current = localDailySteps
  }, [localDailySteps])
  
  // Helper function to merge steps with dailySteps prop for parent update
  // This ensures that all sections get the updated step list, not just filtered steps
  // Uses ref to get the latest value, avoiding stale closures
  const mergeStepsForParentUpdate = useCallback((updatedSteps: any[], excludeStepIds: string[] = []): any[] => {
    // Merge updated steps with existing dailySteps (from ref to get latest value)
    const existingStepsMap = new Map<string, any>()
    const currentDailySteps = dailyStepsRef.current
    if (Array.isArray(currentDailySteps)) {
      currentDailySteps.forEach((step: any) => {
        if (step && step.id && !excludeStepIds.includes(step.id)) {
          existingStepsMap.set(step.id, step)
        }
      })
    }
    
    // Update/add steps from updatedSteps (remove _isNew and _isTemporary flags)
    updatedSteps.forEach((step: any) => {
      if (step && step.id && !step._isTemporary && !excludeStepIds.includes(step.id)) {
        const { _isNew, _isTemporary, ...cleanedStep } = step
        existingStepsMap.set(cleanedStep.id, cleanedStep)
      }
    })
    
    // Convert back to array - this contains ALL steps with updates applied
    return Array.from(existingStepsMap.values())
  }, []) // No dependencies - uses ref
  
  // Handle immediate parent update for newly saved steps (runs after render completes)
  useEffect(() => {
    if (newStepSaved && onDailyStepsUpdate) {
      const { savedStep, tempId } = newStepSaved
      setNewStepSaved(null) // Clear after use
      
      // Get all saved steps from current localDailySteps (using ref to avoid stale closures)
      const currentLocalSteps = localDailyStepsRef.current
      const allSavedStepsFromLocal = [savedStep, ...currentLocalSteps.filter((s: any) => s.id !== tempId && !s._isTemporary)]
        .filter((s: any) => !s._isTemporary)
        .map((s: any) => {
          const { _isNew, _isTemporary, ...rest } = s
          return rest
        })
      
      // Create a map with ALL existing steps from dailySteps (using ref for latest value)
      const allStepsMap = new Map<string, any>()
      
      // First, add all steps from dailySteps (from ref to get latest value, all views)
      const currentDailySteps = dailyStepsRef.current
      if (Array.isArray(currentDailySteps)) {
        currentDailySteps.forEach((step: any) => {
          if (step && step.id) {
            allStepsMap.set(step.id, step)
          }
        })
      }
      
      // Then, overwrite/add with steps from current view (includes new step)
      allSavedStepsFromLocal.forEach((step: any) => {
        if (step && step.id) {
          allStepsMap.set(step.id, step)
        }
      })
      
      const allStepsWithNew = Array.from(allStepsMap.values())
      
      // Update parent - useEffect runs after render, so it's safe
      if (onDailyStepsUpdate) {
        onDailyStepsUpdate(allStepsWithNew)
      }
      
      // Also dispatch custom event as backup mechanism
      window.dispatchEvent(new CustomEvent('dailyStepsUpdated', { 
        detail: { steps: allStepsWithNew, source: 'StepsManagementView-useEffect' } 
      }))
    }
  }, [newStepSaved, onDailyStepsUpdate]) // Trigger when newStepSaved changes (new step saved)
  
  // Track when localDailySteps changes to update parent state (including new step saves)
  // This effect handles ALL updates to ensure they're propagated immediately
  const prevLocalDailyStepsRef = useRef<any[]>(localDailySteps)
  useLayoutEffect(() => {
    if (!onDailyStepsUpdate) {
      prevLocalDailyStepsRef.current = localDailySteps
      return
    }
    
    const prevSteps = prevLocalDailyStepsRef.current
    const currentSteps = localDailySteps
    
    // Get saved steps (without _isTemporary flag)
    const prevSavedSteps = prevSteps.filter((s: any) => !s._isTemporary)
    const currentSavedSteps = currentSteps.filter((s: any) => !s._isTemporary)
    
    // Check if steps changed (including new step saves)
    // Compare by creating sets of IDs and checking for differences
    const prevStepIds = new Set(prevSavedSteps.map((s: any) => s?.id).filter(Boolean))
    const currentStepIds = new Set(currentSavedSteps.map((s: any) => s?.id).filter(Boolean))
    const hasNewSteps = Array.from(currentStepIds).some(id => !prevStepIds.has(id))
    const hasRemovedSteps = Array.from(prevStepIds).some(id => !currentStepIds.has(id))
    const hasChangedSteps = prevSavedSteps.some((prevStep) => {
      const currentStep = currentSavedSteps.find((s: any) => s?.id === prevStep?.id)
      return !currentStep || JSON.stringify(prevStep) !== JSON.stringify(currentStep)
    })
    const stepsChanged = hasNewSteps || hasRemovedSteps || hasChangedSteps || prevSavedSteps.length !== currentSavedSteps.length
    
    // Update parent if steps changed (including new step saves)
    // useLayoutEffect runs synchronously before browser paint, ensuring updates happen immediately
    if (stepsChanged && currentSavedSteps.length > 0) {
      // Remove internal flags and merge with dailySteps prop
      const cleanedSavedSteps = currentSavedSteps.map((s: any) => {
        const { _isNew, _isTemporary, ...rest } = s
        return rest
      })
      
      // Merge with dailySteps (using ref for latest value) to ensure we have all steps
      const existingStepsMap = new Map<string, any>()
      const currentDailySteps = dailyStepsRef.current
      if (Array.isArray(currentDailySteps)) {
        currentDailySteps.forEach((step: any) => {
          if (step && step.id) {
            existingStepsMap.set(step.id, step)
          }
        })
      }
      
      // Overwrite with updated steps from localDailySteps (includes new steps)
      cleanedSavedSteps.forEach((step: any) => {
        if (step && step.id) {
          existingStepsMap.set(step.id, step)
        }
      })
      
      const allStepsUpdated = Array.from(existingStepsMap.values())
      
      // Update parent state IMMEDIATELY - useLayoutEffect runs synchronously before browser paint
      // This ensures the update happens before any view switches
      if (onDailyStepsUpdate) {
        onDailyStepsUpdate(allStepsUpdated)
      }
      
      // Also dispatch custom event as backup mechanism
      window.dispatchEvent(new CustomEvent('dailyStepsUpdated', { 
        detail: { steps: allStepsUpdated, source: 'StepsManagementView-useLayoutEffect' } 
      }))
    }
    
    prevLocalDailyStepsRef.current = localDailySteps
  }, [localDailySteps, onDailyStepsUpdate]) // Removed mergeStepsForParentUpdate from deps since it uses ref
  
  // Sync localDailySteps with prop when it changes, but preserve temporary steps, new steps, and recently collapsed steps
  useEffect(() => {
    setLocalDailySteps(prev => {
      // Find temporary steps that should be preserved (not saved yet)
      const temporarySteps = prev.filter((s: any) => s._isTemporary)
      const temporaryStepIds = new Set(temporarySteps.map((s: any) => s.id))
      
      // Find steps with _isNew flag (should stay at top) - include all newly saved steps, not just expanded ones
      const newSteps = prev.filter((s: any) => s._isNew && !s._isTemporary)
      const newStepIds = new Set(newSteps.map((s: any) => s.id))
      
      // Preserve all existing non-temporary steps that aren't in dailySteps yet (e.g., just collapsed)
      // BUT: Don't preserve steps that were recently deleted (check if they exist in dailySteps prop)
      // If a step is not in dailySteps prop, it might be deleted, so don't preserve it unless we're sure it's just collapsed
      const existingStepsToPreserve = prev.filter((s: any) => 
        !s._isTemporary && 
        !s._isNew && 
        !dailySteps.find((ds: any) => ds.id === s.id) &&
        expandedStepId === s.id // Only preserve if currently expanded (just collapsed)
      )
      const preservedStepIds = new Set(existingStepsToPreserve.map((s: any) => s.id))
      
      // Remove any steps from prev that are not in dailySteps prop and are not temporary/new/preserved
      // This ensures deleted steps are immediately removed
      const stepsToRemove = prev.filter((s: any) => 
        !s._isTemporary &&
        !s._isNew &&
        !preservedStepIds.has(s.id) &&
        !dailySteps.find((ds: any) => ds.id === s.id)
      )
      // Filter out steps that should be removed (deleted steps)
      const filteredPrev = prev.filter((s: any) => !stepsToRemove.find(toRemove => toRemove.id === s.id))
      
      // Get steps from prop that are not temporary, not new, and not preserved
      // Also include newly saved steps (marked with _isNew but not _isTemporary) from localDailySteps
      const newlySavedStepIds = new Set(
        filteredPrev
          .filter((s: any) => s._isNew && !s._isTemporary)
          .map((s: any) => s.id)
      )
      const propSteps = dailySteps.filter((s: any) => 
        !temporaryStepIds.has(s.id) && 
        !newStepIds.has(s.id) && 
        !preservedStepIds.has(s.id) &&
        !newlySavedStepIds.has(s.id) // Don't add newly saved step from prop if it's already in localDailySteps
      )
      
      // Update existing steps from prop, but preserve _isNew flag if expanded
      const updatedPropSteps = propSteps.map((propStep: any) => {
        const existing = filteredPrev.find((s: any) => s.id === propStep.id)
        if (existing && existing._isNew && expandedStepId === propStep.id) {
          // Preserve _isNew flag and merge with prop data
          return {
            ...propStep,
            _isNew: true
          }
        }
        // Merge with existing to preserve any local state
        // Preserve local changes if they differ from prop (indicates unsaved changes or recent save)
        if (existing) {
          const isCurrentlyEditing = editingStepData && editingStepData.id === propStep.id
          // Check if local values differ from prop (indicates recent changes)
          const hasLocalChanges = 
            existing.title !== propStep.title ||
            existing.description !== propStep.description ||
            existing.date !== propStep.date ||
            existing.estimated_time !== propStep.estimated_time ||
            JSON.stringify(existing.checklist || []) !== JSON.stringify(propStep.checklist || []) ||
            existing.goal_id !== propStep.goal_id ||
            existing.area_id !== propStep.area_id
          
          // Preserve local changes if currently editing OR if local values differ (recent changes)
          const preserveLocalChanges = isCurrentlyEditing || hasLocalChanges
          
          return {
            ...propStep,
            ...existing,
            // But use prop data for server fields (unless we should preserve local changes)
            id: propStep.id,
            user_id: propStep.user_id,
            goal_id: preserveLocalChanges && existing.goal_id !== propStep.goal_id ? existing.goal_id : propStep.goal_id,
            area_id: preserveLocalChanges && existing.area_id !== propStep.area_id ? existing.area_id : propStep.area_id,
            // Preserve local changes if they differ
            title: preserveLocalChanges && existing.title !== propStep.title ? existing.title : propStep.title,
            description: preserveLocalChanges && existing.description !== propStep.description ? existing.description : propStep.description,
            date: preserveLocalChanges && existing.date !== propStep.date ? existing.date : propStep.date,
            estimated_time: preserveLocalChanges && existing.estimated_time !== propStep.estimated_time ? existing.estimated_time : propStep.estimated_time,
            checklist: preserveLocalChanges && JSON.stringify(existing.checklist || []) !== JSON.stringify(propStep.checklist || []) ? existing.checklist : propStep.checklist,
            completed: propStep.completed,
            is_important: propStep.is_important,
            is_urgent: propStep.is_urgent,
            xp_reward: propStep.xp_reward,
            require_checklist_complete: propStep.require_checklist_complete,
            frequency: propStep.frequency,
            selected_days: propStep.selected_days,
            recurring_start_date: propStep.recurring_start_date,
            recurring_end_date: propStep.recurring_end_date,
            current_instance_date: propStep.current_instance_date
          }
        }
        return propStep
      })
      
      // Add new steps from prop that don't exist in localDailySteps yet
      const newPropSteps = dailySteps.filter((propStep: any) => 
        !filteredPrev.find((s: any) => s.id === propStep.id) && 
        !temporaryStepIds.has(propStep.id) && 
        !newStepIds.has(propStep.id) &&
        !preservedStepIds.has(propStep.id)
      )
      
      // Combine: temporary steps first, then new steps, then preserved steps, then updated prop steps, then new prop steps
      return [...temporarySteps, ...newSteps, ...existingStepsToPreserve, ...updatedPropSteps, ...newPropSteps]
    })
  }, [dailySteps, expandedStepId])
  
  // Initialize repeating step form state when expanded row opens
  useEffect(() => {
    if (expandedRepeatingStepId && editingStepData && editingStepData.id === expandedRepeatingStepId) {
      // Initialize form state with current step data
      setRepeatingModalFrequency(editingStepData.frequency || 'weekly')
      setRepeatingModalSelectedDays(editingStepData.selected_days || [])
      setRepeatingStartDate(editingStepData.repeating_start_date || getLocalDateString(new Date()))
      setRepeatingEndDate(editingStepData.repeating_end_date || null)
    } else if (!expandedRepeatingStepId) {
      // Reset state when expanded row closes
      setRepeatingModalFrequency('weekly')
      setRepeatingModalSelectedDays([])
      setRepeatingStartDate('')
      setRepeatingEndDate(null)
    }
  }, [expandedRepeatingStepId, editingStepData?.id]) // When expanded row opens/closes or step changes
  
  // Preserve expandedStepId when editingStepData changes (after save)
  useEffect(() => {
    if (expandedStepId && editingStepData && editingStepData.id === expandedStepId) {
      // Keep step expanded even after save
      // This prevents the step from disappearing when it's saved
    }
  }, [editingStepData, expandedStepId])
  
  // Preserve expandedRepeatingStepId when editingStepData changes (after save)
  useEffect(() => {
    if (expandedRepeatingStepId && editingStepData && editingStepData.id === expandedRepeatingStepId) {
      // Keep repeating row expanded even after save
      // This prevents the row from disappearing when it's saved
    }
  }, [editingStepData, expandedRepeatingStepId])
  
  // Handle refresh with pending saves
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingSaves.size > 0) {
        e.preventDefault()
        e.returnValue = ''
        setShowRefreshModal(true)
        setRefreshPending(true)
        return ''
      }
    }
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Detect F5 or Ctrl+R / Cmd+R
      if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.key === 'r')) {
        if (pendingSaves.size > 0) {
          e.preventDefault()
          setShowRefreshModal(true)
          setRefreshPending(true)
        }
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('keydown', handleKeyDown)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [pendingSaves])
  
  // Wait for pending saves to complete before refresh
  useEffect(() => {
    if (refreshPending && pendingSaves.size === 0) {
      // All saves completed, proceed with refresh
      setRefreshPending(false)
      setShowRefreshModal(false)
      window.location.reload()
    }
  }, [refreshPending, pendingSaves])
  
  // Auto-resize description textarea
  useEffect(() => {
    const textarea = descriptionTextareaRef.current
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto'
      // Set height to scrollHeight (content height) or minimum one line
      const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight) || 20
      const minHeight = lineHeight + 16 // padding
      textarea.style.height = `${Math.max(minHeight, textarea.scrollHeight)}px`
    }
  }, [editingStepData?.description, expandedStepId])
  
  // Handle create new step trigger from parent
  useEffect(() => {
    // Only create new step if trigger changed and is greater than last processed value
    // Also check that there's no temporary step already in process
    if (createNewStepTrigger !== undefined && 
        createNewStepTrigger > 0 && 
        createNewStepTrigger > lastCreateNewStepTriggerRef.current) {
      // Check if there's already a temporary step
      const hasTemporaryStep = localDailySteps.some((s: any) => s._isTemporary)
      
      if (!hasTemporaryStep) {
        lastCreateNewStepTriggerRef.current = createNewStepTrigger
        handleCreateNewStep()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createNewStepTrigger, localDailySteps])
  
  // Close modals when step context changes (only if step is expanded)
  useEffect(() => {
    // Close inline modals when expanded step changes (but allow modals for collapsed steps)
    if (inlineModalType && editingStepData && expandedStepId !== null && expandedStepId !== editingStepData.id) {
      setInlineModalType(null)
      setInlineModalPosition(null)
      setClickedIconId(null)
    }
    // Close dropdowns when expanded step changes (but allow dropdowns for collapsed steps)
    if (openDropdownId && editingStepData && expandedStepId !== null) {
      const dropdownStepId = openDropdownId.split('-').slice(1).join('-')
      if (expandedStepId !== dropdownStepId) {
        setOpenDropdownId(null)
      }
    }
  }, [expandedStepId, inlineModalType, openDropdownId, editingStepData])
  
  // Detect dropdown position - show above if doesn't fit below
  useLayoutEffect(() => {
    if (openDropdownId && typeof window !== 'undefined') {
      const timeoutId = setTimeout(() => {
        const buttonElement = document.querySelector(`[data-dropdown-trigger="${openDropdownId}"]`) as HTMLElement
        const dropdownElement = document.querySelector(`[data-dropdown="${openDropdownId}"]`) as HTMLElement
        if (buttonElement && dropdownElement) {
          const buttonRect = buttonElement.getBoundingClientRect()
          // Get actual dropdown height after render
          const dropdownHeight = dropdownElement.scrollHeight || dropdownElement.offsetHeight || 200
          const spaceBelow = window.innerHeight - buttonRect.bottom
          const spaceAbove = buttonRect.top
          
          // If dropdown doesn't fit below but fits above, show it above
          if (spaceBelow < dropdownHeight + 10 && spaceAbove > dropdownHeight + 10) {
            setDropdownPosition('top')
          } else {
            setDropdownPosition('bottom')
          }
        }
      }, 50) // Wait a bit longer for dropdown to render and measure its height
      
      return () => clearTimeout(timeoutId)
    } else {
      setDropdownPosition('bottom')
    }
  }, [openDropdownId, expandedStepId])
  
  // Use props if provided, otherwise use local state
  const effectiveShowCompleted = showCompletedProp !== undefined ? showCompletedProp : showCompleted
  const effectiveGoalFilter = goalFilterProp !== undefined ? goalFilterProp : stepsGoalFilter
  const effectiveAreaFilter = areaFilterProp !== undefined ? areaFilterProp : stepsAreaFilter
  const effectiveDateFilter = dateFilterProp !== undefined ? dateFilterProp : stepsDateFilter
  const effectiveLoadingSteps = loadingStepsProp || loadingSteps

            const today = new Date()
            today.setHours(0, 0, 0, 0)
  const todayStr = getLocalDateString(today)
  
  // Calculate next instance date for recurring step
  const calculateNextInstanceDate = (startDate: string, frequency: string, selectedDays: number[]): string => {
    if (!startDate) return getLocalDateString(today)
    
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const now = new Date(today)
    
    if (frequency === 'daily') {
      // For daily, next instance is today if start date is today or earlier, otherwise start date
      if (start <= now) {
        return getLocalDateString(now)
      }
      return getLocalDateString(start)
    } else if (frequency === 'weekly') {
      // For weekly, find next occurrence from selected days
      if (selectedDays.length === 0) {
        // If no days selected, use start date
        return getLocalDateString(start <= now ? now : start)
      }
      
      // Find next day of week from selected days
      const currentDayOfWeek = now.getDay() === 0 ? 7 : now.getDay() // Monday = 1, Sunday = 7
      const sortedDays = [...selectedDays].sort((a, b) => {
        const aDay = a === 0 ? 7 : a
        const bDay = b === 0 ? 7 : b
        return aDay - bDay
      })
      
      // Find next day this week
      for (const day of sortedDays) {
        const dayOfWeek = day === 0 ? 7 : day
        if (dayOfWeek >= currentDayOfWeek) {
          const daysToAdd = dayOfWeek - currentDayOfWeek
          const nextDate = new Date(now)
          nextDate.setDate(now.getDate() + daysToAdd)
          if (nextDate >= start) {
            return getLocalDateString(nextDate)
          }
        }
      }
      
      // If no day found this week, use first day of next week
      const firstDay = sortedDays[0] === 0 ? 7 : sortedDays[0]
      const daysUntilNextWeek = 7 - currentDayOfWeek + firstDay
      const nextDate = new Date(now)
      nextDate.setDate(now.getDate() + daysUntilNextWeek)
      return getLocalDateString(nextDate >= start ? nextDate : start)
    } else if (frequency === 'monthly') {
      // For monthly, find next occurrence from selected days
      if (selectedDays.length === 0) {
        // If no days selected, use start date
        return getLocalDateString(start <= now ? now : start)
      }
      
      // Find next day of month from selected days
      const currentDay = now.getDate()
      const sortedDays = [...selectedDays].sort((a, b) => a - b)
      
      // Find next day this month
      for (const day of sortedDays) {
        if (day >= currentDay) {
          const nextDate = new Date(now.getFullYear(), now.getMonth(), day)
          if (nextDate >= start) {
            return getLocalDateString(nextDate)
          }
        }
      }
      
      // If no day found this month, use first day of next month
      const firstDay = sortedDays[0]
      const nextDate = new Date(now.getFullYear(), now.getMonth() + 1, firstDay)
      return getLocalDateString(nextDate >= start ? nextDate : start)
    }
    
    return getLocalDateString(start <= now ? now : start)
  }

  // Create maps for quick lookup (same as UpcomingView)
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

  // Format date for display - same logic as UpcomingView
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

  // Filter and sort steps - BASED ON UpcomingView's allFeedSteps logic
  const allSteps = useMemo(() => {
    const stepsWithDates: Array<{ step: any; date: Date; isImportant: boolean; isUrgent: boolean; isOverdue: boolean; goal: any; area: any }> = []
    
    // Ensure localDailySteps is an array
    if (!Array.isArray(localDailySteps)) {
      console.error('localDailySteps is not an array:', localDailySteps)
      return []
    }
    
    // Process non-repeating steps (EXACTLY like UpcomingView)
    localDailySteps
      .filter(step => {
        // Exclude hidden steps (recurring step templates) - only if explicitly set to true
        if (step.is_hidden === true) return false
        // Include only non-recurring steps that are NOT instances of recurring steps
        // Instances have parent_recurring_step_id set (link to template)
        return (!step.frequency || step.frequency === null) && !step.parent_recurring_step_id
      })
      .forEach(step => {
        // Skip completed steps if showCompleted is false (EXACTLY like UpcomingView line 276)
        if (!effectiveShowCompleted) {
          if (step.completed) return
        }
        
        // If step has no date, skip it (we need date for display)
        if (!step.date) return
      
        const stepDate = new Date(normalizeDate(step.date))
        stepDate.setHours(0, 0, 0, 0)
        const isOverdue = stepDate < today && !step.completed
        
        // Filter by goal
        if (effectiveGoalFilter) {
          if (effectiveGoalFilter === 'none') {
            if (step.goal_id || step.goalId) return
        } else {
            if ((step.goal_id || step.goalId) !== effectiveGoalFilter) return
          }
        }

        // Filter by area
        if (effectiveAreaFilter) {
          const stepGoalId = step.goal_id || step.goalId
          const stepAreaId = step.area_id || step.areaId
          
          if (effectiveAreaFilter === 'none') {
            // Show steps without area
            if (stepAreaId) return
            if (stepGoalId) {
              const stepGoal = goalMap.get(stepGoalId)
              if (stepGoal && (stepGoal.area_id || stepGoal.areaId)) return
            }
      } else {
            // Show steps with specific area
            if (stepAreaId === effectiveAreaFilter) {
              // Step is directly assigned to the area
            } else if (stepGoalId) {
              const stepGoal = goalMap.get(stepGoalId)
              if (stepGoal && (stepGoal.area_id || stepGoal.areaId) === effectiveAreaFilter) {
                // Goal belongs to the area
              } else {
        return
              }
            } else {
              return
            }
          }
        }

        // Filter by date
        if (effectiveDateFilter) {
          let stepDateField: string | null = null
          if (step.completed && step.completed_at) {
            stepDateField = step.completed_at.includes('T') ? step.completed_at.split('T')[0] : step.completed_at
        } else {
            stepDateField = step.date
          }
          const stepDateStr = stepDateField ? (stepDateField.includes('T') ? stepDateField.split('T')[0] : stepDateField) : null
          if (stepDateStr !== effectiveDateFilter) return
        }
        
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
    
    // Process recurring steps (EXACTLY like UpcomingView)
    localDailySteps
      .filter(step => {
        const isRecurringStep = step.frequency && step.frequency !== null
        if (!isRecurringStep) return false
        // Exclude hidden steps
        if (step.is_hidden === true) return false
        // Skip completed recurring steps if showCompleted is false
        if (!effectiveShowCompleted) {
          if (step.completed) return false
        }
        return true
      })
      .forEach(step => {
        // For recurring steps, use current_instance_date
        const stepDateField = step.current_instance_date || step.date
        if (!stepDateField) {
          // Skip recurring steps without date - they can't be displayed
          return
        }
        
        const stepDate = new Date(normalizeDate(stepDateField))
        stepDate.setHours(0, 0, 0, 0)
        const isOverdue = stepDate < today && !step.completed
        
        // Filter by goal
        if (effectiveGoalFilter) {
          if (effectiveGoalFilter === 'none') {
            if (step.goal_id || step.goalId) return
        } else {
            if ((step.goal_id || step.goalId) !== effectiveGoalFilter) return
          }
        }

        // Filter by area
        if (effectiveAreaFilter) {
          const stepGoalId = step.goal_id || step.goalId
          const stepAreaId = step.area_id || step.areaId
          
          if (effectiveAreaFilter === 'none') {
            // Show steps without area
            if (stepAreaId) return
            if (stepGoalId) {
              const stepGoal = goalMap.get(stepGoalId)
              if (stepGoal && (stepGoal.area_id || stepGoal.areaId)) return
            }
        } else {
            // Show steps with specific area
            if (stepAreaId === effectiveAreaFilter) {
              // Step is directly assigned to the area
            } else if (stepGoalId) {
              const stepGoal = goalMap.get(stepGoalId)
              if (stepGoal && (stepGoal.area_id || stepGoal.areaId) === effectiveAreaFilter) {
                // Goal belongs to the area
              } else {
      return
    }
      } else {
              return
            }
          }
        }

        // Filter by date
        if (effectiveDateFilter) {
          const stepDateStr = stepDateField ? (stepDateField.includes('T') ? stepDateField.split('T')[0] : stepDateField) : null
          if (stepDateStr !== effectiveDateFilter) return
        }
        
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
    
    // Sort: new expanded steps at top, then by date (oldest first), completed steps at end
    stepsWithDates.sort((a, b) => {
      // New steps (temporary or just saved) that are CURRENTLY EXPANDED go to the top
      // This allows them to stay visible while editing, but they'll sort normally when collapsed
      const aIsNewExpanded = a.step._isNew && expandedStepId === a.step.id
      const bIsNewExpanded = b.step._isNew && expandedStepId === b.step.id
      
      if (aIsNewExpanded && !bIsNewExpanded) return -1
      if (!aIsNewExpanded && bIsNewExpanded) return 1
      
      // For non-completed steps, sort by date FIRST (oldest first, newest last)
      // Then by priority (important + urgent), then by created_at DESC (newest first) for consistency with API
      if (!a.step.completed && !b.step.completed) {
        const dateDiff = a.date.getTime() - b.date.getTime()
        if (dateDiff !== 0) return dateDiff
        
        // Same date - sort by priority (important + urgent) first
        const aPriority = (a.isImportant ? 2 : 0) + (a.isUrgent ? 1 : 0)
        const bPriority = (b.isImportant ? 2 : 0) + (b.isUrgent ? 1 : 0)
        if (aPriority !== bPriority) {
          return bPriority - aPriority // Higher priority first (important steps on top)
        }
        
        // Same priority - sort by created_at DESC (newest first) to match API ordering
        // This ensures newly created steps appear first within the same date/priority group
        // If created_at is not available, use current timestamp for new steps (they should appear first)
        const aCreated = a.step.created_at ? new Date(a.step.created_at).getTime() : (a.step._isNew ? Date.now() : 0)
        const bCreated = b.step.created_at ? new Date(b.step.created_at).getTime() : (b.step._isNew ? Date.now() : 0)
        if (aCreated !== bCreated) {
          return bCreated - aCreated // Newest first (DESC order)
        }
        
        // If created_at is the same (shouldn't happen, but fallback), sort by ID for stability
        return (a.step.id || '').localeCompare(b.step.id || '')
      }
      
      // Completed steps go to the end (if showCompleted is true)
      if (a.step.completed && !b.step.completed) return 1
      if (!a.step.completed && b.step.completed) return -1

      // For completed steps, sort by completed_at (newest first)
      if (a.step.completed && b.step.completed) {
        const aCompleted = a.step.completed_at ? new Date(normalizeDate(a.step.completed_at)).getTime() : 0
        const bCompleted = b.step.completed_at ? new Date(normalizeDate(b.step.completed_at)).getTime() : 0
        return bCompleted - aCompleted
      }

      // Fallback: sort by date
      return a.date.getTime() - b.date.getTime()
    })
    
    // Deduplicate steps by ID before returning
    const stepMap = new Map<string, any>()
    stepsWithDates.forEach(item => {
      if (item.step && item.step.id) {
        const existing = stepMap.get(item.step.id)
        const isRecurring = item.step.frequency && item.step.frequency !== null
        const existingIsRecurring = existing?.frequency && existing.frequency !== null
        
        // Priority: _isNew/_isTemporary > recurring > non-recurring
        if (!existing) {
          // No existing step, add this one
          stepMap.set(item.step.id, {
            ...item.step,
            _isOverdue: item.isOverdue,
            _goal: item.goal,
            _area: item.area,
            _date: item.date
          })
        } else if (item.step._isNew || item.step._isTemporary) {
          // Prefer new/temporary steps
          stepMap.set(item.step.id, {
            ...item.step,
            _isOverdue: item.isOverdue,
            _goal: item.goal,
            _area: item.area,
            _date: item.date
          })
        } else if (isRecurring && !existingIsRecurring) {
          // Prefer recurring step over non-recurring
          stepMap.set(item.step.id, {
            ...item.step,
            _isOverdue: item.isOverdue,
            _goal: item.goal,
            _area: item.area,
            _date: item.date
          })
        } else if (!isRecurring && existingIsRecurring) {
          // Keep existing recurring step, don't overwrite with non-recurring
          // (do nothing, keep existing)
        } else {
          // Both are same type, prefer the one with more metadata
          stepMap.set(item.step.id, {
            ...item.step,
            _isOverdue: item.isOverdue,
            _goal: item.goal,
            _area: item.area,
            _date: item.date
          })
        }
      }
    })
    
    // Return all steps with additional metadata (same format as UpcomingView)
    return Array.from(stepMap.values())
  }, [localDailySteps, effectiveShowCompleted, effectiveGoalFilter, effectiveAreaFilter, effectiveDateFilter, goalMap, areaMap, today])

  // Paginated steps
  const paginatedSteps = useMemo(() => {
    return allSteps.slice(0, displayedStepsCount)
  }, [allSteps, displayedStepsCount])

  // Reset pagination when filters change
  useEffect(() => {
    setDisplayedStepsCount(50)
  }, [effectiveShowCompleted, effectiveGoalFilter, effectiveAreaFilter, effectiveDateFilter])

  const hasMoreSteps = allSteps.length > displayedStepsCount

  // Create new step inline
  const handleCreateNewStep = () => {
    const currentUserId = userId || player?.user_id
    if (!currentUserId) return
    
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const today = getLocalDateString(new Date())
    
    // Pre-fill area_id if areaFilter is set and not "none"
    let prefillAreaId: string | null = null
    if (effectiveAreaFilter && effectiveAreaFilter !== 'none' && effectiveAreaFilter !== null) {
      prefillAreaId = effectiveAreaFilter
    }
    
    // Pre-fill goal_id if goalFilter is set and not "none"
    let prefillGoalId: string | null = null
    if (effectiveGoalFilter && effectiveGoalFilter !== 'none' && effectiveGoalFilter !== null) {
      prefillGoalId = effectiveGoalFilter
    }
    
    const newStep = {
      id: tempId,
      user_id: currentUserId,
      title: '', // Empty title - user must enter a name
      description: '',
      date: today,
      completed: false,
      is_important: false,
      is_urgent: false,
      estimated_time: 30,
      xp_reward: 1,
      checklist: [],
      require_checklist_complete: false,
      frequency: null,
      selected_days: [],
      recurring_start_date: null,
      recurring_end_date: null,
      isRepeating: false,
      goalId: prefillGoalId || '',
      areaId: prefillAreaId || '',
      goal_id: prefillGoalId, // Pre-fill goal if goalFilter is set
      area_id: prefillAreaId, // Pre-fill area if areaFilter is set
      _isNew: true, // Flag to mark as new temporary step
      _isTemporary: true // Flag to mark as temporary (not saved yet)
    }
    
    // Add to localDailySteps at the beginning
    setLocalDailySteps(prev => [newStep, ...prev])
    
    // Set as expanded and editing
    setExpandedStepId(tempId)
    setNewStepId(tempId)
    setNewStepOriginalTitle('') // Empty - will be compared to check if title was changed
    setEditingStepData(newStep)
    setEditingTitleId(tempId)
    setEditingTitleValue('') // Empty - user must enter a name
  }
  
  // Handle saving new step (create via API)
  const handleSaveNewStep = async (stepData: any) => {
    if (!stepData || !stepData.id) return
    
    const currentUserId = userId || player?.user_id
    if (!currentUserId) return
    
    setIsSavingNewStep(true)
    
    try {
      // Determine goalId and areaId
      let finalGoalId = (stepData.goalId && stepData.goalId.trim() !== '') ? stepData.goalId : null
      let finalAreaId = (stepData.areaId && stepData.areaId.trim() !== '') ? stepData.areaId : null
      
      // If goal is selected, get area from goal
      if (finalGoalId) {
        const selectedGoal = goals.find((g: any) => g.id === finalGoalId)
        if (selectedGoal?.area_id) {
          finalAreaId = selectedGoal.area_id
        }
      }
      
      // Ensure date is always a string (YYYY-MM-DD)
      let dateValue: string | null = null
      if (!stepData.isRepeating && stepData.date) {
        if (typeof stepData.date === 'string') {
          dateValue = stepData.date
        } else {
          dateValue = getLocalDateString(new Date(stepData.date))
        }
      }
      
      const requestBody = {
        userId: currentUserId,
        goalId: finalGoalId,
        areaId: finalAreaId,
        title: stepData.title,
        description: stepData.description || '',
        date: dateValue,
        isImportant: stepData.is_important || false,
        isUrgent: stepData.is_urgent || false,
        estimatedTime: stepData.estimated_time || 30,
        xpReward: stepData.xp_reward || 1,
        checklist: stepData.checklist || [],
        requireChecklistComplete: stepData.require_checklist_complete || false,
        frequency: stepData.isRepeating ? (stepData.frequency || null) : null,
        selectedDays: stepData.isRepeating ? (stepData.selected_days || []) : [],
        recurringStartDate: stepData.isRepeating ? (stepData.recurring_start_date || null) : null,
        recurringEndDate: stepData.isRepeating ? (stepData.recurring_end_date || null) : null,
        recurringDisplayMode: stepData.isRepeating ? (stepData.recurring_display_mode || 'all') : 'all'
      }
      
      const response = await fetch('/api/daily-steps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        const newStep = await response.json()
        const tempId = stepData.id
        
        // Replace temporary step with real step from server
        // Keep _isNew flag so it stays at top until collapsed
        // Ensure area_id and goal_id are preserved from the saved step
        const savedStep = {
          ...newStep,
          _isNew: true, // Keep flag so it stays at top until collapsed
          _isTemporary: false, // Remove temporary flag since it's now saved
          // Ensure areaId and goalId are also set for filtering
          areaId: newStep.area_id || stepData.areaId || '',
          goalId: newStep.goal_id || stepData.goalId || ''
        }
        
        // Update local state with saved step
        // Insert at correct position based on date (unless it's expanded, then keep at top temporarily)
        setLocalDailySteps(prev => {
          const filtered = prev.filter((s: any) => s.id !== tempId)
          
          // Don't manually insert - let the sorting in allSteps useMemo handle it
          // Just add to the list, sorting will put it in the correct position
          // New expanded steps will stay at top due to sorting logic
          return [...filtered, savedStep]
        })
        
        // Update parent state using requestAnimationFrame for better synchronization
        // Also dispatch custom event as backup mechanism for cross-component updates
        const updateParentAndBroadcast = () => {
          // Get current localDailySteps from ref to avoid stale closure
          const currentLocalSteps = localDailyStepsRef.current
          // Get all saved steps (without temporary flags) and remove internal flags
          const allSavedStepsFromLocal = [savedStep, ...currentLocalSteps.filter((s: any) => s.id !== tempId && !s._isTemporary)]
            .filter((s: any) => !s._isTemporary)
            .map((s: any) => {
              const { _isNew, _isTemporary, ...rest } = s
              return rest
            })
          
          // Create a map with ALL existing steps from dailySteps (using ref for latest value)
          const allStepsMap = new Map<string, any>()
          
          // First, add all steps from dailySteps (from ref to get latest value, all views)
          const currentDailySteps = dailyStepsRef.current
          if (Array.isArray(currentDailySteps)) {
            currentDailySteps.forEach((step: any) => {
              if (step && step.id) {
                allStepsMap.set(step.id, step)
              }
            })
          }
          
          // Then, overwrite/add with steps from current view (includes new step)
          allSavedStepsFromLocal.forEach((step: any) => {
            if (step && step.id) {
              allStepsMap.set(step.id, step)
            }
          })
          
          const allStepsWithNew = Array.from(allStepsMap.values())
          
          // Update parent callback if provided
          if (onDailyStepsUpdate) {
            onDailyStepsUpdate(allStepsWithNew)
          }
          
          // Also dispatch custom event as backup mechanism for cross-component synchronization
          // This ensures all views get updated even if prop chain is broken
          window.dispatchEvent(new CustomEvent('dailyStepsUpdated', { 
            detail: { steps: allStepsWithNew, source: 'StepsManagementView' } 
          }))
        }
        
        // Use requestAnimationFrame for better timing - runs before next paint
        requestAnimationFrame(() => {
          updateParentAndBroadcast()
        })
        
        // Also store in state to trigger useEffect as backup
        setNewStepSaved({ savedStep, tempId })
        
        // Update editingStepData with real step
        const updatedEditingStepData = {
          ...newStep,
          goalId: newStep.goal_id || '',
          areaId: newStep.area_id || '',
          isRepeating: newStep.frequency && newStep.frequency !== null,
          frequency: newStep.frequency || null,
          selected_days: newStep.selected_days || [],
          repeating_start_date: newStep.recurring_start_date || null,
          repeating_end_date: newStep.recurring_end_date || null,
          _isNew: true,
          _isTemporary: false
        }
        setEditingStepData(updatedEditingStepData)
        
        // Update expandedStepId to real step id (but only if user hasn't clicked outside)
        // If user clicked outside, the step should be closed after saving
        // We'll close it in onBlur handler instead, so we keep it expanded here for now
        setExpandedStepId(newStep.id)
        setNewStepId(null)
        setNewStepOriginalTitle('')
        
        // Close the step after saving if title input is no longer focused
        // This allows immediate closing when user clicks outside
        setTimeout(() => {
          // Check if title is still being edited (if not, close the step)
          if (!editingTitleId || editingTitleId !== newStep.id) {
            setExpandedStepId(null)
            setEditingStepData(null)
            setEditingTitleId(null)
            setEditingTitleValue('')
          }
        }, 100)
        
        // Reset trigger processing to prevent re-creating step when returning to section
        // This ensures that if user navigates away and comes back, a new step won't be created
        if (createNewStepTrigger !== undefined) {
          lastCreateNewStepTriggerRef.current = createNewStepTrigger
        }
        
        // Notify parent that a new step was successfully created
        // This allows parent to reset the trigger
        if (onNewStepCreated) {
          setTimeout(() => {
            onNewStepCreated()
          }, 0)
        }
        
        // Don't fetch from server - we already have the saved step and updated parent via onDailyStepsUpdate above
        // The parent will refresh all sections with the updated steps
      } else {
        console.error('Error creating step:', await response.text())
        // Remove temporary step on error
        setLocalDailySteps(prev => prev.filter(s => s.id !== stepData.id))
        setExpandedStepId(null)
        setEditingStepData(null)
        setNewStepId(null)
        setNewStepOriginalTitle('')
      }
    } catch (error) {
      console.error('Error creating step:', error)
      // Remove temporary step on error
      setLocalDailySteps(prev => prev.filter(s => s.id !== stepData.id))
      setExpandedStepId(null)
      setEditingStepData(null)
      setNewStepId(null)
      setNewStepOriginalTitle('')
    } finally {
      setIsSavingNewStep(false)
    }
  }

  // Handle saving step changes with debouncing and request cancellation
  const handleSaveStep = async (stepData: any, immediate: boolean = false) => {
    if (!stepData || !stepData.id) return
    
    // If this is a new temporary step that hasn't been saved yet, don't save it here
    // It will be saved via handleSaveNewStep when title is changed
    if (stepData._isTemporary) {
      // Just update local state for temporary steps
      setLocalDailySteps(prev => prev.map(s => {
        if (s.id === stepData.id) {
          return { ...s, ...stepData }
        }
        return s
      }))
      setEditingStepData(stepData)
      return
    }
    
    const currentUserId = userId || player?.user_id
    if (!currentUserId) return
    
    const stepId = stepData.id
    
    // Cancel previous pending request for this step
    const previousController = abortControllersRef.current.get(stepId)
    if (previousController) {
      previousController.abort()
      abortControllersRef.current.delete(stepId)
    }
    
    // Clear previous debounce timer for this step
    const previousTimer = debounceTimersRef.current.get(stepId)
    if (previousTimer) {
      clearTimeout(previousTimer)
      debounceTimersRef.current.delete(stepId)
    }
    
    // Create new AbortController for this request
    const abortController = new AbortController()
    abortControllersRef.current.set(stepId, abortController)
    
    // Debounced save function
    const performSave = async () => {
      // Add to pending saves
      setPendingSaves(prev => new Set(prev).add(stepId))
      
      try {
      // Determine goalId and areaId
      let finalGoalId = (stepData.goalId && stepData.goalId.trim() !== '') ? stepData.goalId : null
      let finalAreaId = (stepData.areaId && stepData.areaId.trim() !== '') ? stepData.areaId : null
      
      // If goal is selected, get area from goal
      if (finalGoalId) {
        const selectedGoal = goals.find((g: any) => g.id === finalGoalId)
        if (selectedGoal?.area_id) {
          finalAreaId = selectedGoal.area_id
        }
      }
      
      // Ensure date is always a string (YYYY-MM-DD) or null
      let dateValue: string | null = null
      if (stepData.isRepeating) {
        // For recurring steps, use date from stepData (which should be set to current_instance_date)
        // This ensures the step displays as a future step with the correct date
        if (stepData.date) {
          if (typeof stepData.date === 'string') {
            dateValue = stepData.date
          } else {
            dateValue = getLocalDateString(new Date(stepData.date))
          }
        } else if (stepData.current_instance_date) {
          // Fallback to current_instance_date if date is not set
          if (typeof stepData.current_instance_date === 'string') {
            dateValue = stepData.current_instance_date
          } else {
            dateValue = getLocalDateString(new Date(stepData.current_instance_date))
          }
        }
      } else if (stepData.date) {
        // For non-recurring steps, use the date as normal
        if (typeof stepData.date === 'string') {
          dateValue = stepData.date
        } else {
          dateValue = getLocalDateString(new Date(stepData.date))
        }
      }
      
      const requestBody = {
        stepId: stepData.id,
        userId: currentUserId,
        goalId: finalGoalId,
        areaId: finalAreaId,
        title: stepData.title,
        description: stepData.description || '',
        date: dateValue,
        isImportant: stepData.is_important || false,
        isUrgent: stepData.is_urgent || false,
        estimatedTime: stepData.estimated_time || 0,
        checklist: stepData.checklist || [],
        requireChecklistComplete: stepData.require_checklist_complete || false,
        frequency: stepData.isRepeating ? (stepData.frequency || null) : null,
        selectedDays: stepData.isRepeating ? (stepData.selected_days || []) : [],
        recurringStartDate: stepData.isRepeating ? (stepData.recurring_start_date || null) : null,
        recurringEndDate: stepData.isRepeating ? (stepData.recurring_end_date || null) : null,
        recurringDisplayMode: stepData.isRepeating ? (stepData.recurring_display_mode || 'all') : 'all'
      }
      
      const response = await fetch('/api/daily-steps', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: abortController.signal,
      })

      if (response.ok) {
        const updatedStep = await response.json()
        
        // Update localDailySteps immediately for instant UI update
        setLocalDailySteps((prevSteps) => {
          const index = prevSteps.findIndex((s: any) => s.id === stepData.id)
          if (index !== -1) {
            const newSteps = [...prevSteps]
            newSteps[index] = {
              ...newSteps[index],
              ...updatedStep,
              // Ensure date is updated
              date: updatedStep.date || newSteps[index].date
            }
            return newSteps
          }
          return prevSteps
        })
        
        // Update editingStepData if it's the same step
        // Preserve expandedStepId and expandedRepeatingStepId to prevent flicker
        const currentExpandedStepId = expandedStepId
        const currentExpandedRepeatingStepId = expandedRepeatingStepId
        const isRepeatingStep = stepData.isRepeating || (stepData.frequency && stepData.frequency !== null)
        const isRepeatingAfterUpdate = updatedStep.frequency && updatedStep.frequency !== null
        
        if (editingStepData && editingStepData.id === stepData.id) {
          setEditingStepData({
            ...editingStepData,
            ...updatedStep,
            goalId: updatedStep.goal_id || '',
            areaId: updatedStep.area_id || '',
            isRepeating: isRepeatingAfterUpdate,
            frequency: updatedStep.frequency || null,
            selected_days: updatedStep.selected_days || [],
            repeating_start_date: updatedStep.recurring_start_date || null,
            repeating_end_date: updatedStep.recurring_end_date || null
          })
          
          // Restore expandedStepId after state update
          if (currentExpandedStepId === stepData.id) {
            setTimeout(() => setExpandedStepId(currentExpandedStepId), 0)
          }
          // Only restore expandedRepeatingStepId if step is still repeating
          if (currentExpandedRepeatingStepId === stepData.id && isRepeatingAfterUpdate) {
            setTimeout(() => setExpandedRepeatingStepId(currentExpandedRepeatingStepId), 0)
          } else if (currentExpandedRepeatingStepId === stepData.id && !isRepeatingAfterUpdate) {
            // If step is no longer repeating, ensure expandedRepeatingStepId is cleared
            setTimeout(() => setExpandedRepeatingStepId(null), 0)
          }
        }
        
        // Check if step was repeating before (to prevent refresh when disabling repeating)
        const wasRepeating = localDailySteps.find((s: any) => s.id === stepData.id)?.frequency && 
                             localDailySteps.find((s: any) => s.id === stepData.id)?.frequency !== null
        
        // For repeating steps or steps that were repeating, don't refresh from server
        // This prevents the step from disappearing and reappearing
        if (isRepeatingStep || wasRepeating) {
          // Update localDailySteps with server response, but preserve current_instance_date
          setLocalDailySteps((prevSteps) => {
            const index = prevSteps.findIndex((s: any) => s.id === stepData.id)
            if (index !== -1) {
              const newSteps = [...prevSteps]
              const currentStep = newSteps[index]
              const isStillRepeating = updatedStep.frequency && updatedStep.frequency !== null
              newSteps[index] = {
                ...currentStep,
                ...updatedStep,
                // Preserve current_instance_date to prevent flicker (unless step is no longer repeating)
                current_instance_date: isStillRepeating ? (currentStep.current_instance_date || currentStep.date) : undefined,
                // Ensure date is updated
                date: updatedStep.date || currentStep.date,
                // Ensure frequency is properly set (null if not repeating)
                frequency: updatedStep.frequency || null,
                selected_days: isStillRepeating ? (updatedStep.selected_days || []) : [],
                recurring_start_date: isStillRepeating ? (updatedStep.recurring_start_date || null) : null,
                recurring_end_date: isStillRepeating ? (updatedStep.recurring_end_date || null) : null
              }
              return newSteps
            }
            return prevSteps
          })
        } else {
          // For non-repeating steps that were never repeating, update local state immediately
          // Don't refresh from server to prevent temporary steps from disappearing
          setLocalDailySteps((prevSteps) => {
            const index = prevSteps.findIndex((s: any) => s.id === stepData.id)
            if (index !== -1) {
              const newSteps = [...prevSteps]
              newSteps[index] = {
                ...newSteps[index],
                ...updatedStep,
                // Preserve any local flags
                _isNew: newSteps[index]._isNew,
                _isTemporary: newSteps[index]._isTemporary
              }
              return newSteps
            }
            return prevSteps
          })
          
          // Only update parent if not a temporary step
          if (!stepData._isTemporary && onDailyStepsUpdate) {
            // Update parent with current localDailySteps (after update)
            // Use a callback to get the latest state
            setLocalDailySteps((prevSteps) => {
              // Filter out temporary steps
              const savedSteps = prevSteps.filter((s: any) => !s._isTemporary)
              
              // Remove internal flags and merge with dailySteps prop
              const cleanedSavedSteps = savedSteps.map((s: any) => {
                const { _isNew, _isTemporary, ...rest } = s
                return rest
              })
              
              // Merge with dailySteps (using ref for latest value) to ensure we have all steps
              const existingStepsMap = new Map<string, any>()
              const currentDailySteps = dailyStepsRef.current
              if (Array.isArray(currentDailySteps)) {
                currentDailySteps.forEach((step: any) => {
                  if (step && step.id) {
                    existingStepsMap.set(step.id, step)
                  }
                })
              }
              
              // Overwrite with updated steps from localDailySteps
              cleanedSavedSteps.forEach((step: any) => {
                if (step && step.id) {
                  existingStepsMap.set(step.id, step)
                }
              })
              
              const allStepsUpdated = Array.from(existingStepsMap.values())
              
              // Update parent immediately using queueMicrotask for faster update
              queueMicrotask(() => {
                if (onDailyStepsUpdate) {
                  onDailyStepsUpdate(allStepsUpdated)
                }
              })
              return prevSteps // Return unchanged to preserve temporary steps
            })
          }
        }
      }
    } catch (error: any) {
      // Ignore abort errors (they're expected when canceling old requests)
      if (error?.name === 'AbortError') {
        return // Request was canceled, ignore
      }
      console.error('Error saving step:', error)
    } finally {
      // Clean up abort controller
      abortControllersRef.current.delete(stepId)
      
      // Remove from pending saves
      setPendingSaves(prev => {
        const newSet = new Set(prev)
        newSet.delete(stepId)
        return newSet
      })
    }
    }
    
    // Apply debouncing for non-immediate saves (e.g., typing in description)
    // Immediate saves (e.g., changing goal, toggling repeating) happen right away
    if (immediate) {
      performSave()
    } else {
      // Debounce auto-save by 500ms
      const timer = setTimeout(() => {
        performSave()
        debounceTimersRef.current.delete(stepId)
      }, 500)
      debounceTimersRef.current.set(stepId, timer)
    }
  }

  // Handle step deletion request (opens confirmation modal)
  const handleDeleteStep = (stepId: string) => {
    if (!stepId) return
    
    const step = localDailySteps.find((s: any) => s.id === stepId)
    if (!step) return
    
    setDeleteStepToConfirm(step)
  }
  
  // Confirm and perform step deletion
  const handleConfirmDeleteStep = async () => {
    if (!deleteStepToConfirm) return
    
    const stepId = deleteStepToConfirm.id
    const currentUserId = userId || player?.user_id
    if (!currentUserId) {
      setDeleteStepToConfirm(null)
      return
    }
    
    setIsDeletingStep(true)
    
    // Optimistically remove from local state immediately
    const updatedSteps = localDailySteps.filter(s => s.id !== stepId)
    setLocalDailySteps(updatedSteps)
    
    // Close expanded step if it was this one
    if (expandedStepId === stepId) {
      setExpandedStepId(null)
      setEditingStepData(null)
    }
    
    // Update parent immediately (optimistic update)
    if (onDailyStepsUpdate) {
      // For deletion, we need to remove the step from ALL steps, not just localDailySteps
      // Get all steps from dailySteps (using ref for latest value) and remove the deleted one
      const currentDailySteps = dailyStepsRef.current
      const allStepsWithoutDeleted = Array.isArray(currentDailySteps) 
        ? currentDailySteps.filter((s: any) => s && s.id && s.id !== stepId)
        : []
      
      // Also remove _isNew and _isTemporary flags from remaining steps
      const cleanedSteps = allStepsWithoutDeleted.map((s: any) => {
        const { _isNew, _isTemporary, ...rest } = s
        return rest
      })
      
      // Update immediately using queueMicrotask for faster update (before browser paint)
      queueMicrotask(() => {
        onDailyStepsUpdate(cleanedSteps)
      })
    }
    
    try {
      const response = await fetch(`/api/daily-steps?stepId=${stepId}&userId=${currentUserId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        // If deletion failed, revert the optimistic update by reloading
        console.error('Error deleting step:', await response.text())
        alert(t('steps.deleteError') || 'Chyba při odstraňování kroku')
        
        // Reload steps from server to revert the optimistic update
        const stepsResponse = await fetch(`/api/daily-steps?userId=${currentUserId}`)
        if (stepsResponse.ok) {
          const stepsData = await stepsResponse.json()
          const stepsArray = Array.isArray(stepsData) ? stepsData : (stepsData.steps || stepsData.dailySteps || [])
          setLocalDailySteps(stepsArray)
          if (onDailyStepsUpdate) {
            setTimeout(() => {
              onDailyStepsUpdate(stepsArray)
            }, 0)
          }
        }
      }
    } catch (error) {
      console.error('Error deleting step:', error)
      alert(t('steps.deleteError') || 'Chyba při odstraňování kroku')
      
      // Reload steps from server to revert the optimistic update
      const stepsResponse = await fetch(`/api/daily-steps?userId=${currentUserId}`)
      if (stepsResponse.ok) {
        const stepsData = await stepsResponse.json()
        const stepsArray = Array.isArray(stepsData) ? stepsData : (stepsData.steps || stepsData.dailySteps || [])
        setLocalDailySteps(stepsArray)
        if (onDailyStepsUpdate) {
          onDailyStepsUpdate(stepsArray)
        }
      }
    } finally {
      setIsDeletingStep(false)
      setDeleteStepToConfirm(null)
    }
  }

  // Internal step toggle handler - same approach as UpcomingView
  const handleInternalStepToggle = async (stepId: string, completed: boolean, completionDate?: string) => {
    // Use handleStepToggle from props if available
    if (handleStepToggle) {
      return handleStepToggle(stepId, completed, completionDate)
    }
    
    // Otherwise use internal handler
    setLoadingSteps(prev => new Set(prev).add(stepId))
    
    try {
      const step = localDailySteps.find((s: any) => s.id === stepId)
      if (!step) {
        setLoadingSteps(prev => {
          const newSet = new Set(prev)
          newSet.delete(stepId)
          return newSet
        })
        return
      }

      const isRecurringStep = step?.frequency && step.frequency !== null
      // Use provided completionDate, or calculate it for recurring steps
      let finalCompletionDate: string | undefined = completionDate
      if (!finalCompletionDate && isRecurringStep && completed && step.current_instance_date) {
        finalCompletionDate = step.current_instance_date
      }

      const response = await fetch('/api/daily-steps', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId,
          completed,
          completedAt: completed ? new Date().toISOString() : null,
          completionDate: finalCompletionDate || undefined
        }),
      })

      if (response.ok) {
        // Refresh steps list
        const currentUserId = userId || player?.user_id
        if (currentUserId) {
          const stepsResponse = await fetch(`/api/daily-steps?userId=${currentUserId}`)
          if (stepsResponse.ok) {
            const stepsData = await stepsResponse.json()
            const stepsArray = Array.isArray(stepsData) ? stepsData : (stepsData.steps || stepsData.dailySteps || [])
            // Also update localDailySteps with fresh data from server
            setLocalDailySteps(stepsArray)
            if (onDailyStepsUpdate) {
              setTimeout(() => {
                onDailyStepsUpdate(stepsArray)
              }, 0)
            }
          }
          }
        } else {
        console.error('Failed to update step')
      }
    } catch (error) {
      console.error('Error toggling step:', error)
    } finally {
      setLoadingSteps(prev => {
        const newSet = new Set(prev)
        newSet.delete(stepId)
        return newSet
      })
    }
  }

  return (
    <div className="w-full flex flex-col bg-primary-50">
      {!hideHeader && (
        <>
          {/* Filters Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 px-4 py-3 bg-white border-b-2 border-primary-500">
        {/* Mobile: Filters button and Add Step button row */}
        <div className="md:hidden flex items-center gap-3 w-full">
          {!hideFilters && (
            <button
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className="btn-playful-base flex items-center gap-2 px-3 py-2 text-sm font-medium text-black font-playful bg-white hover:bg-primary-50"
            >
              <Filter className="w-4 h-4" />
              <span>Filtry</span>
              {filtersExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          )}
          <button
            onClick={handleCreateNewStep}
            className="flex items-center justify-center gap-2 px-4 py-2 text-primary-600 hover:bg-primary-50 text-sm font-medium transition-colors rounded-playful-lg flex-1"
          >
            <Plus className="w-4 h-4" />
            {t('steps.add')}
          </button>
        </div>
        
        {!hideFilters && (
          <>
            {/* Mobile: Collapsible filters expanded content */}
            <div className="md:hidden flex flex-col gap-3 w-full">
              
              {filtersExpanded && (
                <div className="flex flex-col gap-2 pt-2 border-t-2 border-primary-500">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={effectiveShowCompleted}
                  onChange={(e) => setShowCompleted(e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-2 border-primary-500 rounded-playful-sm focus:ring-primary-500"
                />
                <span className="text-sm text-black font-playful">{t('steps.filters.showCompleted')}</span>
              </label>
              
              <select
                value={effectiveGoalFilter || ''}
                onChange={(e) => setStepsGoalFilter(e.target.value || null)}
                    className="w-full px-3 py-1.5 text-sm border-2 border-primary-500 rounded-playful-md font-playful focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="">{t('steps.filters.goal.all')}</option>
                <option value="none">{t('steps.filters.goal.withoutGoal') || 'Bez cíle'}</option>
                {goals.map((goal: any) => (
                  <option key={goal.id} value={goal.id}>{goal.title}</option>
                ))}
              </select>
              
                      {areas && areas.length > 0 && (
                        <select
                          value={effectiveAreaFilter || ''}
                          onChange={(e) => setStepsAreaFilter(e.target.value || null)}
                          className="w-full px-3 py-1.5 text-sm border-2 border-primary-500 rounded-playful-md font-playful focus:ring-2 focus:ring-primary-500 bg-white"
                        >
                          <option value="">{t('steps.filters.area.all')}</option>
                          <option value="none">{t('steps.filters.area.withoutArea')}</option>
                          {areas.map((area: any) => (
                            <option key={area.id} value={area.id}>{area.name}</option>
                          ))}
                        </select>
                      )}
                      
                  <div className="flex items-center gap-2">
              <input
                type="date"
                value={effectiveDateFilter || ''}
                onChange={(e) => setStepsDateFilter(e.target.value || null)}
                      className="flex-1 px-3 py-1.5 text-sm border-2 border-primary-500 rounded-playful-md font-playful focus:ring-2 focus:ring-primary-500 bg-white"
                    />
                    {stepsDateFilter && (
                      <button
                        onClick={() => setStepsDateFilter(null)}
                        className="btn-playful-base px-2 py-1.5 text-xs text-gray-600 hover:text-primary-600 bg-white hover:bg-primary-50"
                      >
                        {t('common.clear')}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Desktop: Always visible filters and Add button */}
            <div className="hidden md:flex md:items-center gap-3 flex-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={effectiveShowCompleted}
                  onChange={(e) => setShowCompleted(e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-2 border-primary-500 rounded-playful-sm focus:ring-primary-500"
                />
                <span className="text-sm text-black font-playful">{t('steps.filters.showCompleted')}</span>
              </label>
              
              <select
                value={effectiveGoalFilter || ''}
                onChange={(e) => setStepsGoalFilter(e.target.value || null)}
                className="px-3 py-1.5 text-sm border-2 border-primary-500 rounded-playful-md font-playful focus:ring-2 focus:ring-primary-500 bg-white min-w-[150px]"
              >
                <option value="">{t('steps.filters.goal.all')}</option>
                <option value="none">{t('steps.filters.goal.withoutGoal') || 'Bez cíle'}</option>
                {goals.map((goal: any) => (
                  <option key={goal.id} value={goal.id}>{goal.title}</option>
                ))}
              </select>
              
                  {areas && areas.length > 0 && (
                    <select
                      value={effectiveAreaFilter || ''}
                      onChange={(e) => setStepsAreaFilter(e.target.value || null)}
                      className="px-3 py-1.5 text-sm border-2 border-primary-500 rounded-playful-md font-playful focus:ring-2 focus:ring-primary-500 bg-white min-w-[150px]"
                    >
                      <option value="">{t('steps.filters.area.all')}</option>
                      <option value="none">{t('steps.filters.area.withoutArea')}</option>
                      {areas.map((area: any) => (
                        <option key={area.id} value={area.id}>{area.name}</option>
                      ))}
                    </select>
                  )}
                  
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={effectiveDateFilter || ''}
                  onChange={(e) => setStepsDateFilter(e.target.value || null)}
                  className="px-3 py-1.5 text-sm border-2 border-primary-500 rounded-playful-md font-playful focus:ring-2 focus:ring-primary-500 bg-white"
                />
              {stepsDateFilter && (
                <button
                  onClick={() => setStepsDateFilter(null)}
                  className="px-2 py-1.5 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {t('common.clear')}
                </button>
              )}
              </div>
            </div>
          </>
        )}
        
        {/* Desktop: Add Step button - always on the right */}
        <button
          onClick={handleCreateNewStep}
          className="hidden md:flex items-center gap-2 px-4 py-2 text-primary-600 hover:bg-primary-50 text-sm font-medium transition-colors rounded-playful-lg"
        >
          <Plus className="w-4 h-4" />
          {t('steps.add')}
        </button>
      </div>
        </>
      )}
      
      {/* Steps List - using same design as UpcomingView feed */}
      <div className={`space-y-2 ${hideHeader ? 'p-4 sm:p-6 lg:p-8 pt-2' : 'p-4 sm:p-6 lg:p-8 pt-2'}`}>
        {paginatedSteps.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-600">{t('views.noSteps') || 'Žádné kroky'}</p>
          </div>
        ) : (
          <>
            {paginatedSteps.map((step) => {
              const isLoading = effectiveLoadingSteps.has(step.id)
              const stepDateObj = (step as any)._date as Date | undefined
              if (stepDateObj) stepDateObj.setHours(0, 0, 0, 0)
              const stepDateStr = stepDateObj ? getLocalDateString(stepDateObj) : null
              const isToday = stepDateObj && stepDateObj.getTime() === today.getTime()
              const isOverdue = (step as any)._isOverdue || false
              const isFuture = stepDateObj && stepDateObj > today && !isOverdue && !isToday
              const stepDateFormatted = stepDateStr ? formatStepDate(stepDateStr, step.completed) : null
              const goal = (step as any)._goal
              const area = (step as any)._area
                  const isRecurringStep = step.frequency && step.frequency !== null
                  
              const isExpanded = expandedStepId === step.id
                  
                  return (
                <div
                      key={step.id}
                  className={`transition-all ${
                    step.completed
                      ? 'opacity-50'
                      : isOverdue
                        ? isExpanded ? 'bg-red-50' : 'bg-red-50'
                        : isToday
                          ? 'bg-white'
                          : isFuture
                            ? isExpanded ? 'bg-white' : 'bg-white/70 backdrop-blur-sm opacity-75 group'
                            : 'bg-white'
                  } ${isLoading ? 'opacity-50' : ''} ${isExpanded ? 'border-2 border-primary-500 rounded-playful-md relative z-40 pointer-events-auto' : 'rounded-playful-md'}`}
                  onClick={(e) => {
                    // Prevent closing when clicking on the step itself
                    if (isExpanded) {
                      e.stopPropagation()
                    }
                  }}
                >
                  {/* Collapsed view - clickable header */}
                  <div
                    onClick={async () => {
                      if (isExpanded) {
                        // When collapsing, validate recurring step first
                        // If recurring is enabled but invalid (no frequency or missing required fields), disable it
                        if (editingStepData && editingStepData.isRepeating) {
                          const hasFrequency = editingStepData.frequency && editingStepData.frequency !== null
                          const isValidRecurring = hasFrequency && 
                            (editingStepData.frequency === 'daily' || 
                             (editingStepData.frequency === 'weekly' && editingStepData.selected_days && editingStepData.selected_days.length > 0) ||
                             (editingStepData.frequency === 'monthly' && editingStepData.selected_days && editingStepData.selected_days.length > 0))
                          
                          if (!isValidRecurring) {
                            // Disable recurring if invalid
                            const updatedData = {
                              ...editingStepData,
                              isRepeating: false,
                              frequency: null,
                              selected_days: [],
                              repeating_start_date: null,
                              repeating_end_date: null
                            }
                            setEditingStepData(updatedData)
                            
                            // Update local state
                            setLocalDailySteps(prev => prev.map(s => {
                              if (s.id === step.id) {
                                return {
                                  ...s,
                                  isRepeating: false,
                                  frequency: null,
                                  selected_days: [],
                                  repeating_start_date: null,
                                  repeating_end_date: null,
                                  current_instance_date: undefined
                                }
                              }
                              return s
                            }))
                            
                            // Save the update to disable recurring
                            await handleSaveStep(updatedData, true)
                          }
                        }
                        
                        // When collapsing, remove _isNew flag so step moves to correct position
                        // But keep the step in localDailySteps - don't remove it
                        if (step._isNew) {
                          setLocalDailySteps(prev => {
                            const updated = prev.map(s => {
                              if (s.id === step.id) {
                                const { _isNew, _isTemporary, ...rest } = s
                                return rest
                              }
                              return s
                            })
                            // Update parent when _isNew flag is removed
                            if (onDailyStepsUpdate) {
                              setTimeout(() => {
                                // Remove internal flags and merge with dailySteps prop
                                const savedSteps = updated.filter((s: any) => !s._isTemporary)
                                const cleanedSavedSteps = savedSteps.map((s: any) => {
                                  const { _isNew, _isTemporary, ...rest } = s
                                  return rest
                                })
                                
                                // Merge with dailySteps (using ref for latest value) to ensure we have all steps
                                const existingStepsMap = new Map<string, any>()
                                const currentDailySteps = dailyStepsRef.current
                                if (Array.isArray(currentDailySteps)) {
                                  currentDailySteps.forEach((step: any) => {
                                    if (step && step.id) {
                                      existingStepsMap.set(step.id, step)
                                    }
                                  })
                                }
                                
                                // Overwrite with updated steps from localDailySteps
                                cleanedSavedSteps.forEach((step: any) => {
                                  if (step && step.id) {
                                    existingStepsMap.set(step.id, step)
                                  }
                                })
                                
                                const allStepsUpdated = Array.from(existingStepsMap.values())
                                // Update immediately using queueMicrotask for faster update
                                queueMicrotask(() => {
                                  onDailyStepsUpdate(allStepsUpdated)
                                })
                              })
                            }
                            return updated
                          })
                        }
                        
                        // Reset trigger processing when collapsing to prevent re-creating step
                        if (createNewStepTrigger !== undefined) {
                          lastCreateNewStepTriggerRef.current = createNewStepTrigger
                        }
                        
                        // Clear expanded state and repeating expanded state
                        setExpandedRepeatingStepId(null)
                        setExpandedStepId(null)
                        setEditingStepData(null)
                      } else {
                        setExpandedStepId(step.id)
                        setEditingStepData({
                          ...step,
                          goalId: step.goal_id || '',
                          areaId: step.area_id || '',
                          isRepeating: step.frequency && step.frequency !== null
                        })
                      }
                    }}
                    className={`flex items-center gap-3 p-3 cursor-pointer transition-[background-color,opacity,outline] rounded-playful-md min-w-0 ${
                      !isExpanded && (step.completed
                        ? ''
                        : isOverdue
                          ? 'hover:bg-red-100 hover:outline-2 hover:outline hover:outline-red-300 hover:outline-offset-[-2px]'
                          : isToday
                            ? 'hover:bg-primary-50 hover:outline-2 hover:outline hover:outline-primary-500 hover:outline-offset-[-2px]'
                            : isFuture
                              ? 'hover:bg-white/85 hover:opacity-85 hover:outline-2 hover:outline hover:outline-gray-200/50 hover:outline-offset-[-2px]'
                              : 'hover:bg-primary-50 hover:outline-2 hover:outline hover:outline-gray-300 hover:outline-offset-[-2px]')
                    }`}
                  >
                  {/* Checkbox */}
                          <button
                    onClick={(e) => {
                              e.stopPropagation()
                      // For recurring steps, pass the date of this occurrence
                      const stepDate = (step as any)._date as Date | undefined
                      const completionDate = stepDate ? getLocalDateString(stepDate) : undefined
                      handleInternalStepToggle(step.id, !step.completed, completionDate)
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
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center gap-2 mb-1 min-w-0 overflow-hidden">
                      {/* Repeating icon before title */}
                      {isRecurringStep && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                          <Repeat className={`w-3.5 h-3.5 transition-colors ${isFuture ? 'text-primary-400 group-hover:text-primary-500' : 'text-primary-600'}`} />
                              {step.completion_count > 0 && (
                            <span className={`text-[10px] font-semibold transition-colors ${isFuture ? 'text-primary-400 group-hover:text-primary-500' : 'text-primary-600'}`}>
                                  {step.completion_count}
                                </span>
                              )}
                            </div>
                          )}
                      {editingTitleId === step.id ? (
                        <input
                          type="text"
                          value={editingTitleValue}
                          onChange={(e) => setEditingTitleValue(e.target.value)}
                          placeholder={t('steps.titlePlaceholder') || 'Název kroku...'}
                          onBlur={async () => {
                            const isNewStep = step._isTemporary && newStepId === step.id
                            const titleChanged = editingTitleValue.trim() !== newStepOriginalTitle
                            
                            if (isNewStep) {
                              // For new steps, only save if title was entered (not empty)
                              if (titleChanged && editingTitleValue.trim()) {
                                // Save new step
                                const updatedStep = { ...step, title: editingTitleValue.trim() }
                                await handleSaveNewStep(updatedStep)
                                
                                // Close the step immediately after saving (user clicked outside, so they want to close it)
                                // Clear all editing state
                                setEditingTitleId(null)
                                setEditingTitleValue('')
                                setNewStepId(null)
                                setNewStepOriginalTitle('')
                                setExpandedStepId(null)
                                setEditingStepData(null)
                              } else {
                                // Remove new step if title wasn't entered (remains empty)
                                setLocalDailySteps(prev => prev.filter(s => s.id !== step.id))
                                setExpandedStepId(null)
                                setEditingStepData(null)
                                setNewStepId(null)
                                setNewStepOriginalTitle('')
                              }
                            } else {
                              // For existing steps, save if title changed
                              if (editingTitleValue.trim() && editingTitleValue !== step.title) {
                                // Use editingStepData if available to preserve all values (goalId, areaId, etc.)
                                const baseStep = editingStepData && editingStepData.id === step.id 
                                  ? editingStepData 
                                  : step
                                const updatedStep = { 
                                  ...baseStep, 
                                  title: editingTitleValue.trim(),
                                  // Ensure all required fields are present
                                  goalId: baseStep.goalId || baseStep.goal_id || '',
                                  areaId: baseStep.areaId || baseStep.area_id || '',
                                  isRepeating: baseStep.isRepeating || (baseStep.frequency && baseStep.frequency !== null)
                                }
                                // Update localDailySteps immediately to prevent flicker
                                setLocalDailySteps(prev => prev.map(s => {
                                  if (s.id === step.id) {
                                    return { ...s, title: editingTitleValue.trim() }
                                  }
                                  return s
                                }))
                                // Also update editingStepData if it's the same step
                                if (editingStepData && editingStepData.id === step.id) {
                                  setEditingStepData({ ...editingStepData, title: editingTitleValue.trim() })
                                }
                                await handleSaveStep(updatedStep, true)
                              }
                            }
                            setEditingTitleId(null)
                            setEditingTitleValue('')
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur()
                            } else if (e.key === 'Escape') {
                              const isNewStep = step._isTemporary && newStepId === step.id
                              if (isNewStep) {
                                // Remove new step on Escape
                                setLocalDailySteps(prev => prev.filter(s => s.id !== step.id))
                                setExpandedStepId(null)
                                setEditingStepData(null)
                                setNewStepId(null)
                                setNewStepOriginalTitle('')
                              }
                              setEditingTitleId(null)
                              setEditingTitleValue('')
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className={`flex-1 min-w-0 text-sm px-2 py-1 bg-transparent border-0 border-b-2 border-b-gray-300 focus:border-b-primary-500 focus:outline-none rounded-none ${
                            step.completed 
                              ? 'line-through text-gray-400' 
                              : isOverdue
                                ? 'text-red-600'
                                : isFuture
                                  ? 'text-gray-500'
                                  : 'text-black'
                          } ${step.is_important && !step.completed && !isFuture ? 'font-bold' : 'font-medium'}`}
                          autoFocus
                        />
                        ) : (
                          <span
                            onClick={(e) => {
                              e.stopPropagation()
                            if (!isExpanded) {
                              // If step is collapsed, expand it first
                              setExpandedStepId(step.id)
                              setEditingStepData({
                                ...step,
                                goalId: step.goal_id || '',
                                areaId: step.area_id || '',
                                isRepeating: step.frequency && step.frequency !== null
                              })
                            } else {
                              // If step is expanded, enable title editing
                              setEditingTitleId(step.id)
                              setEditingTitleValue(step.title)
                            }
                          }}
                          className={`flex-1 min-w-0 text-sm truncate transition-colors ${isExpanded ? 'cursor-text' : 'cursor-pointer'} ${
                            step.completed 
                              ? 'line-through text-gray-400' 
                              : isOverdue
                                ? 'text-red-600'
                                : isFuture
                                  ? 'text-gray-500 group-hover:text-gray-700'
                                  : 'text-black'
                          } ${step.is_important && !step.completed && !isFuture ? 'font-bold' : 'font-medium'}`}>
                          {step.title || (step._isTemporary ? (t('steps.titlePlaceholder') || 'Název kroku...') : '')}
                          </span>
                        )}
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

                  {/* Header - Date, Time, Star (collapsed view only) - styled like UpcomingView */}
                  {!isExpanded && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Date button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          // Set editing data without expanding the step
                          setEditingStepData({
                            ...step,
                            goalId: step.goal_id || '',
                            areaId: step.area_id || '',
                            isRepeating: step.frequency && step.frequency !== null
                          })
                          const rect = (e.target as HTMLElement).getBoundingClientRect()
                          setInlineModalPosition({ top: rect.bottom + 5, left: rect.left, width: rect.width })
                          setInlineModalType('date')
                          const currentDate = step.date ? new Date(step.date) : new Date()
                          setDatePickerMonth(new Date(currentDate))
                        }}
                        disabled={savingDateStepId === step.id}
                        className={`hidden sm:block w-28 text-xs text-center capitalize flex-shrink-0 rounded-playful-sm px-1 py-0.5 transition-colors border-2 flex items-center justify-center gap-1 ${
                          savingDateStepId === step.id
                            ? 'text-primary-600 border-primary-500'
                            : isOverdue
                            ? 'text-red-600 hover:bg-red-100 border-red-300'
                            : isToday
                              ? 'text-primary-600 hover:bg-primary-100 border-primary-500' 
                              : isFuture
                                ? 'text-gray-400 group-hover:text-gray-600 hover:bg-gray-50 border-gray-200 group-hover:border-gray-300'
                                : 'text-gray-600 hover:bg-gray-100 border-gray-300'
                        } ${savingDateStepId === step.id ? 'cursor-not-allowed' : ''}`}
                      >
                        {savingDateStepId === step.id ? (
                          <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full"></div>
                        ) : (
                          <>
                            {isOverdue ? '❗' : ''}
                            {(() => {
                              // Use editingStepData.date if available and step is being edited, otherwise use step.date
                              const dateToFormat = (savingDateStepId === step.id && editingStepData?.date) 
                                ? editingStepData.date 
                                : stepDateStr
                              return dateToFormat ? formatStepDate(dateToFormat, step.completed) : '-'
                            })()}
                          </>
                        )}
                      </button>
                    
                    {/* Time button */}
                  <button
                      onClick={(e) => {
                        e.stopPropagation()
                        // Set editing data without expanding the step
                        setEditingStepData({
                          ...step,
                          goalId: step.goal_id || '',
                          areaId: step.area_id || '',
                          isRepeating: step.frequency && step.frequency !== null
                        })
                        const rect = (e.target as HTMLElement).getBoundingClientRect()
                        setInlineModalPosition({ top: rect.bottom + 5, left: rect.left, width: rect.width })
                        setInlineModalType('time')
                      }}
                      className={`hidden sm:block w-20 text-xs text-center flex-shrink-0 rounded-playful-sm px-1 py-0.5 transition-colors border-2 text-gray-600 hover:bg-gray-100 border-gray-300`}
                    >
                      {step.estimated_time ? `${step.estimated_time} min` : '-'}
                  </button>
                    
                    {/* Important star */}
                    {onStepImportantChange && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (onStepImportantChange) {
                            onStepImportantChange(step.id, !(step.is_important === true))
                          }
                        }}
                        disabled={effectiveLoadingSteps.has(step.id)}
                        className={`flex items-center justify-center w-5 h-5 rounded-playful-sm transition-all flex-shrink-0 ${
                          step.is_important
                            ? 'text-primary-600 hover:text-primary-700 hover:scale-110'
                            : 'text-gray-400 hover:text-primary-500 hover:scale-110'
                        } ${effectiveLoadingSteps.has(step.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={step.is_important ? (t('steps.unmarkImportant') || 'Označit jako nedůležité') : (t('steps.markImportant') || 'Označit jako důležité')}
                      >
                        {effectiveLoadingSteps.has(step.id) ? (
                          <div className="animate-spin h-3 w-3 border-2 border-primary-500 border-t-transparent rounded-full"></div>
                        ) : (
                          <Star className={`w-4 h-4 ${step.is_important ? 'fill-current' : ''}`} strokeWidth={step.is_important ? 0 : 2} />
                        )}
                      </button>
                    )}
                    </div>
                  )}
              </div>

                  {/* Expanded view */}
                  {isExpanded && editingStepData && (
                    <div 
                      className="px-3 pb-3 pt-3 border-t-2 border-primary-200 mt-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Layout: Desktop - description left, checklist right; Mobile - description top, checklist below */}
                      <div className="flex flex-col lg:flex-row lg:gap-6">
                        {/* Description - editable, no border, just text on background */}
                        <div className="flex-1 mb-4 lg:mb-0 lg:pr-4 lg:border-r-2 lg:border-primary-200">
                          <label className="hidden lg:block text-xs font-semibold text-gray-600 mb-2 font-playful uppercase tracking-wide">
                            {t('steps.description') || 'Popis'}
                  </label>
                          <textarea
                            ref={descriptionTextareaRef}
                            value={editingStepData.description || ''}
                            onChange={(e) => {
                              setEditingStepData({ ...editingStepData, description: e.target.value })
                              // Auto-resize on change
                              const textarea = e.target
                              textarea.style.height = 'auto'
                              const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight) || 20
                              const minHeight = lineHeight + 16 // padding
                              textarea.style.height = `${Math.max(minHeight, textarea.scrollHeight)}px`
                            }}
                            onBlur={async () => {
                              // Auto-save on blur
                              await handleSaveStep(editingStepData)
                            }}
                            className="w-full px-3 py-2 text-sm bg-transparent text-black resize-none overflow-hidden focus:outline-none placeholder:text-gray-400"
                            placeholder={t('steps.descriptionPlaceholder') || 'Přidejte popis kroku...'}
                            rows={1}
                  />
                </div>

                        {/* Checklist - larger, styled like original modal */}
                        <div className="flex-1 lg:pl-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <label className="block text-xs font-semibold text-gray-600 font-playful uppercase tracking-wide">
                                {t('steps.checklistTitle') || 'Checklist'}
                  </label>
                              <span className="text-xs text-gray-600 font-semibold">
                                {editingStepData.checklist?.filter((item: any) => item.completed).length || 0}/{editingStepData.checklist?.length || 0} {t('steps.checklistCompleted') || 'completed'}
                              </span>
                            </div>
                            <button
                              onClick={async () => {
                                const newItem = { id: crypto.randomUUID(), text: '', completed: false }
                                const newChecklist = [...(editingStepData.checklist || []), newItem]
                                const updatedData = { ...editingStepData, checklist: newChecklist }
                                setEditingStepData(updatedData)
                                await handleSaveStep(updatedData)
                              }}
                              className="flex-shrink-0 p-1.5 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-playful-sm transition-colors"
                              title={t('steps.addChecklistItem') || 'Přidat položku'}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="space-y-2 max-h-[280px] overflow-y-auto mb-3 pr-2 pb-2">
                            {editingStepData.checklist && editingStepData.checklist.length > 0 ? (
                              editingStepData.checklist.map((item: any, index: number) => (
                                <div 
                                  key={item.id || index} 
                                  className={`box-playful-highlight flex items-center gap-2 px-2 py-1.5 ${
                                    item.completed ? 'opacity-60' : ''
                                  }`}
                                  style={{ marginRight: '4px', marginBottom: '4px' }}
                                >
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const updatedChecklist = [...editingStepData.checklist]
                                      updatedChecklist[index] = { ...item, completed: !item.completed }
                                      const updatedData = { ...editingStepData, checklist: updatedChecklist }
                                      setEditingStepData(updatedData)
                                      await handleSaveStep(updatedData)
                                    }}
                                    className={`flex-shrink-0 w-4 h-4 rounded-playful-sm border-2 flex items-center justify-center transition-colors ${
                                      item.completed 
                                        ? 'bg-white border-primary-500 text-black' 
                                        : 'border-primary-500 hover:bg-primary-50'
                                    }`}
                                  >
                                    {item.completed && (
                                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </button>
                  <textarea
                                    value={item.text || ''}
                                    onChange={(e) => {
                                      const newChecklist = [...editingStepData.checklist]
                                      newChecklist[index] = { ...item, text: e.target.value }
                                      setEditingStepData({ ...editingStepData, checklist: newChecklist })
                                    }}
                                    onBlur={async () => {
                                      await handleSaveStep(editingStepData)
                                    }}
                                    ref={(el) => {
                                      if (el) {
                                        el.style.height = 'auto'
                                        el.style.height = `${el.scrollHeight}px`
                                      }
                                    }}
                                    className="flex-1 text-sm px-1.5 py-0.5 border-0 bg-transparent focus:ring-2 focus:ring-primary-500 rounded resize-none overflow-hidden"
                                    placeholder={t('steps.checklistItemPlaceholder') || 'Checklist item...'}
                                    rows={1}
                                  />
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const newChecklist = editingStepData.checklist.filter((_: any, i: number) => i !== index)
                                      const updatedData = { ...editingStepData, checklist: newChecklist }
                                      setEditingStepData(updatedData)
                                      await handleSaveStep(updatedData)
                                    }}
                                    className="flex-shrink-0 p-0.5 text-gray-400 hover:text-red-600 transition-colors"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-8 text-gray-500">
                                <svg className="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                                <p className="text-sm font-semibold">{t('steps.checklistNoItems') || 'No items yet'}</p>
                                <p className="text-xs mt-1">{t('steps.checklistNoItemsDescription') || 'Add sub-tasks for this step'}</p>
                              </div>
                            )}
                          </div>
                        </div>
                </div>

                      {/* Repeating step settings row - expandable above icons */}
                      {expandedRepeatingStepId === step.id && (
                        <div className="border-t-2 border-primary-200 mt-4 pt-2 pb-2 mb-2 bg-primary-50 rounded-playful-sm px-2">
                          <div className="flex flex-col gap-2">
                            {/* Frequency selection and dates */}
                  <div>
                              <div className="text-xs font-bold text-black mb-1.5 font-playful">{t('steps.frequency') || 'Frekvence'}</div>
                              {/* Frequency buttons - on same row as dates on larger screens, stacked on smaller */}
                              <div className="flex flex-col sm:flex-row gap-2 sm:gap-1.5 sm:items-end">
                                {/* Frequency buttons */}
                                <div className="flex gap-1.5">
                                  {(['daily', 'weekly', 'monthly'] as const).map((freq) => (
                                    <button
                                      key={freq}
                                      type="button"
                                      onClick={async () => {
                                        const newFrequency = freq
                                        // For weekly/monthly, keep existing selected_days if switching from same frequency type
                                        // Otherwise clear (e.g., switching from weekly to monthly or vice versa)
                                        const newDays = freq === 'daily' 
                                          ? [] 
                                          : (freq === 'weekly' && repeatingModalFrequency === 'monthly') || (freq === 'monthly' && repeatingModalFrequency === 'weekly')
                                            ? [] // Clear days when switching between weekly and monthly
                                            : repeatingModalSelectedDays // Keep existing days for same frequency type
                                        
                                        setRepeatingModalFrequency(newFrequency)
                                        setRepeatingModalSelectedDays(newDays)
                                        
                                        // Validate: For weekly/monthly, selected_days must not be empty
                                        const isValidRecurring = newFrequency === 'daily' || (newDays && newDays.length > 0)
                                        
                                        if (!isValidRecurring) {
                                          // If invalid, don't save - recurring will be disabled when modal closes
                                          return
                                        }
                                        
                                        // Calculate next instance date based on new frequency and days
                                        const nextInstanceDate = calculateNextInstanceDate(
                                          repeatingStartDate,
                                          newFrequency,
                                          newDays
                                        )
                                        
                                        // Auto-save on change - update date to next instance
                                        const updatedData = {
                                          ...editingStepData,
                                          isRepeating: true,
                                          frequency: newFrequency,
                                          selected_days: newDays,
                                          repeating_start_date: repeatingStartDate,
                                          repeating_end_date: repeatingEndDate,
                                          // For recurring steps, set date to current_instance_date so it displays as future step
                                          date: nextInstanceDate
                                        }
                                        setEditingStepData(updatedData)
                                        
                                        // Update local state immediately - update both date and current_instance_date to next instance
                                        // For recurring steps, date should match current_instance_date so it displays correctly
                                        setLocalDailySteps(prev => prev.map(s => {
                                          if (s.id === editingStepData.id) {
                                            return {
                                              ...s,
                                              frequency: newFrequency,
                                              selected_days: newDays,
                                              repeating_start_date: repeatingStartDate,
                                              repeating_end_date: repeatingEndDate,
                                              // Update current_instance_date to next instance
                                              // Update both date and current_instance_date to next instance
                                              // This ensures the step displays as a future step immediately
                                              current_instance_date: nextInstanceDate,
                                              date: nextInstanceDate
                                            }
                                          }
                                          return s
                                        }))
                                        
                                        await handleSaveStep(updatedData, true)
                                      }}
                                      className={`px-1.5 py-0.5 text-xs border-2 rounded-playful-sm transition-colors ${
                                        repeatingModalFrequency === freq
                                          ? 'bg-primary-500 text-white border-primary-500 font-medium'
                                          : 'bg-white text-black border-primary-500 hover:bg-primary-50'
                                      }`}
                                    >
                                      {freq === 'daily' && (t('habits.frequency.daily') || 'Denně')}
                                      {freq === 'weekly' && (t('habits.frequency.weekly') || 'Týdně')}
                                      {freq === 'monthly' && (t('habits.frequency.monthly') || 'Měsíčně')}
                                    </button>
                                  ))}
                                </div>
                                
                                {/* Start and End dates - minimal width */}
                                <div className="flex gap-1.5 items-end">
                                  <div className="w-auto min-w-[100px]">
                                    <label className="text-[10px] text-gray-600 mb-0.5 block">{t('steps.startDate') || 'Od'}</label>
                    <input
                      type="date"
                                      value={repeatingStartDate}
                                      onChange={async (e) => {
                                        const newStartDate = e.target.value
                                        setRepeatingStartDate(newStartDate)
                                        
                                        // Validate: Must have frequency and (for weekly/monthly) selected_days
                                        const isValidRecurring = repeatingModalFrequency && 
                                          (repeatingModalFrequency === 'daily' || 
                                           (repeatingModalFrequency === 'weekly' && repeatingModalSelectedDays.length > 0) ||
                                           (repeatingModalFrequency === 'monthly' && repeatingModalSelectedDays.length > 0))
                                        
                                        if (!isValidRecurring) {
                                          // Don't save if invalid - recurring will be disabled when modal closes
                                          return
                                        }
                                        
                                        // Calculate next instance date based on new start date
                                        const nextInstanceDate = calculateNextInstanceDate(
                                          newStartDate,
                                          repeatingModalFrequency,
                                          repeatingModalSelectedDays
                                        )
                                        
                                        // Auto-save on change
                                        const updatedData = {
                                          ...editingStepData,
                                          isRepeating: true,
                                          frequency: repeatingModalFrequency,
                                          selected_days: repeatingModalSelectedDays,
                                          repeating_start_date: newStartDate,
                                          repeating_end_date: repeatingEndDate,
                                          // For recurring steps, set date to current_instance_date so it displays as future step
                                          date: nextInstanceDate
                                        }
                                        setEditingStepData(updatedData)
                                        
                                        // Update local state immediately - update both date and current_instance_date to next instance
                                        // For recurring steps, date should match current_instance_date so it displays correctly
                                        setLocalDailySteps(prev => prev.map(s => {
                                          if (s.id === editingStepData.id) {
                                            return {
                                              ...s,
                                              repeating_start_date: newStartDate,
                                              repeating_end_date: repeatingEndDate,
                                              // Update current_instance_date to next instance
                                              // Update both date and current_instance_date to next instance
                                              // This ensures the step displays as a future step immediately
                                              current_instance_date: nextInstanceDate,
                                              date: nextInstanceDate
                                            }
                                          }
                                          return s
                                        }))
                                        
                                        await handleSaveStep(updatedData, true)
                                      }}
                                      className="w-full px-1.5 py-0.5 text-[10px] border-2 border-primary-500 rounded-playful-sm bg-white"
                    />
                  </div>
                                  <div className="w-auto min-w-[100px]">
                                    <label className="text-[10px] text-gray-600 mb-0.5 block">{t('steps.endDate') || 'Do'}</label>
                                    <input
                                      type="date"
                                      value={repeatingEndDate || ''}
                                      onChange={async (e) => {
                                        const newEndDate = e.target.value || null
                                        setRepeatingEndDate(newEndDate)
                                        
                                        // Auto-save on change
                                        const updatedData = {
                                          ...editingStepData,
                                          isRepeating: true,
                                          frequency: repeatingModalFrequency,
                                          selected_days: repeatingModalSelectedDays,
                                          repeating_start_date: repeatingStartDate,
                                          repeating_end_date: newEndDate
                                        }
                                        setEditingStepData(updatedData)
                                        
                                        // Update local state immediately - keep current_instance_date
                                        setLocalDailySteps(prev => prev.map(s => {
                                          if (s.id === editingStepData.id) {
                                            return {
                                              ...s,
                                              repeating_start_date: repeatingStartDate,
                                              repeating_end_date: newEndDate,
                                              // Keep current_instance_date (end date doesn't affect next instance)
                                              current_instance_date: s.current_instance_date || s.date
                                            }
                                          }
                                          return s
                                        }))
                                        
                                        await handleSaveStep(updatedData, true)
                                      }}
                                      className="w-full px-1.5 py-0.5 text-[10px] border-2 border-primary-500 rounded-playful-sm bg-white"
                                      placeholder={t('steps.never') || 'Nikdy'}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Selected days - weekly */}
                            {repeatingModalFrequency === 'weekly' && (
                  <div>
                                <div className="text-xs font-bold text-black mb-1 font-playful">{t('steps.selectedDays') || 'Vybrané dny'}</div>
                                <div className="flex gap-0.5 justify-start flex-wrap">
                                  {(locale === 'cs' 
                                    ? ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']
                                    : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
                                  ).map((dayLabel, dayIndex) => {
                                    const dayValue = dayIndex === 6 ? 0 : dayIndex + 1
                                    const isSelected = repeatingModalSelectedDays.includes(dayValue)
                                    
                                    return (
                                      <button
                                        key={dayIndex}
                                        type="button"
                                        onClick={async () => {
                                          const newDays = isSelected
                                            ? repeatingModalSelectedDays.filter((d: number) => d !== dayValue)
                                            : [...repeatingModalSelectedDays, dayValue].sort((a: number, b: number) => {
                                                if (a === 0) return 1
                                                if (b === 0) return -1
                                                return a - b
                                              })
                                          setRepeatingModalSelectedDays(newDays)
                                          
                                          // Validate: For weekly, must have at least one selected day
                                          if (!repeatingModalFrequency || (repeatingModalFrequency === 'weekly' && newDays.length === 0)) {
                                            // If no frequency or no days selected for weekly, don't save - recurring will be disabled when modal closes
                                            return
                                          }
                                          
                                          // Calculate next instance date based on new days
                                          const nextInstanceDate = calculateNextInstanceDate(
                                            repeatingStartDate,
                                            repeatingModalFrequency,
                                            newDays
                                          )
                                          
                                          // Auto-save on change - update date to next instance
                                          const updatedData = {
                                            ...editingStepData,
                                            isRepeating: true,
                                            frequency: repeatingModalFrequency,
                                            selected_days: newDays,
                                            repeating_start_date: repeatingStartDate,
                                            recurring_end_date: repeatingEndDate,
                                            // For recurring steps, set date to current_instance_date so it displays as future step
                                            date: nextInstanceDate
                                          }
                                          setEditingStepData(updatedData)
                                          
                                          // Update local state immediately - update current_instance_date to next instance
                                          // For recurring steps, date should match current_instance_date so it displays correctly
                                          setLocalDailySteps(prev => prev.map(s => {
                                            if (s.id === editingStepData.id) {
                                              return {
                                                ...s,
                                                frequency: repeatingModalFrequency,
                                                selected_days: newDays,
                                                repeating_start_date: repeatingStartDate,
                                                repeating_end_date: repeatingEndDate,
                                              // Update both date and current_instance_date to next instance
                                              // This ensures the step displays as a future step immediately
                                              current_instance_date: nextInstanceDate,
                                              date: nextInstanceDate
                                              }
                                            }
                                            return s
                                          }))
                                          
                                          await handleSaveStep(updatedData, true)
                                        }}
                                        className={`w-6 h-6 px-0.5 py-0.5 text-[10px] border-2 rounded-playful-sm transition-colors flex items-center justify-center ${
                                          isSelected
                                            ? 'bg-primary-500 text-white border-primary-500'
                                            : 'bg-white text-black border-primary-500 hover:bg-primary-50'
                                        }`}
                                        title={dayLabel}
                                      >
                                        {dayLabel}
                                      </button>
                                    )
                                  })}
                  </div>
                </div>
                            )}

                            {/* Selected days - monthly */}
                            {repeatingModalFrequency === 'monthly' && (
                  <div>
                                <div className="text-xs font-bold text-black mb-1 font-playful">{t('steps.selectedDays') || 'Vybrané dny'}</div>
                                <div className="flex gap-0.5 justify-start flex-wrap max-h-[80px] overflow-y-auto">
                                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                                    const isSelected = repeatingModalSelectedDays.includes(day)
                                    return (
                                      <button
                                        key={day}
                                        type="button"
                                        onClick={async () => {
                                          const newDays = isSelected
                                            ? repeatingModalSelectedDays.filter((d: number) => d !== day)
                                            : [...repeatingModalSelectedDays, day].sort((a: number, b: number) => a - b)
                                          setRepeatingModalSelectedDays(newDays)
                                          
                                          // Validate: For monthly, must have at least one selected day
                                          if (!repeatingModalFrequency || (repeatingModalFrequency === 'monthly' && newDays.length === 0)) {
                                            // If no frequency or no days selected for monthly, don't save - recurring will be disabled when modal closes
                                            return
                                          }
                                          
                                          // Calculate next instance date based on new days
                                          const nextInstanceDate = calculateNextInstanceDate(
                                            repeatingStartDate,
                                            repeatingModalFrequency,
                                            newDays
                                          )
                                          
                                          // Auto-save on change - update date to next instance
                                          const updatedData = {
                                            ...editingStepData,
                                            isRepeating: true,
                                            frequency: repeatingModalFrequency,
                                            selected_days: newDays,
                                            repeating_start_date: repeatingStartDate,
                                            repeating_end_date: repeatingEndDate,
                                            // For recurring steps, set date to current_instance_date so it displays as future step
                                            date: nextInstanceDate
                                          }
                                          setEditingStepData(updatedData)
                                          
                                          // Update local state immediately - update current_instance_date to next instance
                                          // For recurring steps, date should match current_instance_date so it displays correctly
                                          setLocalDailySteps(prev => prev.map(s => {
                                            if (s.id === editingStepData.id) {
                                              return {
                                                ...s,
                                                frequency: repeatingModalFrequency,
                                                selected_days: newDays,
                                                repeating_start_date: repeatingStartDate,
                                                repeating_end_date: repeatingEndDate,
                                              // Update both date and current_instance_date to next instance
                                              // This ensures the step displays as a future step immediately
                                              current_instance_date: nextInstanceDate,
                                              date: nextInstanceDate
                                              }
                                            }
                                            return s
                                          }))
                                          
                                          await handleSaveStep(updatedData, true)
                                        }}
                                        className={`w-5 h-5 px-0 py-0 text-[10px] border-2 rounded-playful-sm transition-colors flex items-center justify-center ${
                                          isSelected
                                            ? 'bg-primary-500 text-white border-primary-500'
                                            : 'bg-white text-black border-primary-500 hover:bg-primary-50'
                                        }`}
                                      >
                                        {day}
                                      </button>
                                    )
                                  })}
                                </div>
                  </div>
                )}
                            
                            {/* Daily info */}
                            {repeatingModalFrequency === 'daily' && (
                              <div className="text-[10px] text-gray-500 italic">
                                {t('habits.frequency.daily') || 'Denně'} - {t('steps.recurring.recurring') || 'Opakující se krok se bude opakovat každý den'}
              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Divider with action icons */}
                      <div className="border-t-2 border-primary-200 mt-4 pt-3">
                        <div className="flex items-center gap-2 flex-wrap justify-between">
                          {/* Delete button - left side */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteStep(editingStepData.id)
                            }}
                            className="p-1.5 rounded-playful-sm transition-colors text-red-600 hover:bg-red-100"
                            title={t('steps.delete') || 'Odstranit'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          
                          {/* Right side icons */}
                          <div className="flex items-center gap-2 flex-wrap">
                          {/* Date button - mobile only */}
                        <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const rect = (e.target as HTMLElement).getBoundingClientRect()
                              setInlineModalPosition({ top: rect.bottom + 5, left: rect.left, width: rect.width })
                              setInlineModalType('date')
                              const currentDate = editingStepData.date ? new Date(editingStepData.date) : new Date()
                              setDatePickerMonth(new Date(currentDate))
                            }}
                            className={`sm:hidden w-28 text-xs text-center capitalize flex-shrink-0 rounded-playful-sm px-1 py-0.5 transition-colors border-2 ${
                              isOverdue
                                ? 'text-red-600 hover:bg-red-100 border-red-300'
                                : isToday
                                  ? 'text-primary-600 hover:bg-primary-100 border-primary-500' 
                                  : isFuture
                                    ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 border-gray-200'
                                    : 'text-gray-600 hover:bg-gray-100 border-gray-300'
                            }`}
                          >
                            {isOverdue ? '❗' : ''}{stepDateFormatted || '-'}
                        </button>
                          
                          {/* Time button - mobile only */}
                        <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const rect = (e.target as HTMLElement).getBoundingClientRect()
                              setInlineModalPosition({ top: rect.bottom + 5, left: rect.left, width: rect.width })
                              setInlineModalType('time')
                            }}
                            className="sm:hidden w-20 text-xs text-center flex-shrink-0 rounded-playful-sm px-1 py-0.5 transition-colors border-2 text-gray-600 hover:bg-gray-100 border-gray-300"
                          >
                            {editingStepData.estimated_time ? `${editingStepData.estimated_time} min` : '-'}
                        </button>
                          
                          {/* Area - icon + text + dropdown */}
                          {(!editingStepData.goalId || area) && (
                            <div className="relative">
                              <button
                                data-dropdown-trigger={`area-${editingStepData.id}`}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (!editingStepData.goalId) {
                                    const dropdownId = `area-${editingStepData.id}`
                                    setOpenDropdownId(openDropdownId === dropdownId ? null : dropdownId)
                                  }
                                }}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded-playful-sm transition-colors ${
                                  !area ? 'opacity-50' : editingStepData.goalId ? 'cursor-default' : 'hover:bg-gray-100'
                                }`}
                              >
                                <MapPin className={`w-4 h-4 flex-shrink-0 ${area ? '' : 'text-gray-400'}`} style={area ? { color: area.color || '#E8871E' } : {}} />
                                <span className="text-xs whitespace-nowrap max-w-[120px] truncate">
                                  {area ? area.name : (editingStepData.goalId ? (t('steps.areaLockedByGoal') || 'Oblast je určena cílem') : (t('details.goal.area') || 'Oblast'))}
                                </span>
                                {!editingStepData.goalId && (
                                  <ChevronDown className={`w-3 h-3 transition-transform ${openDropdownId === `area-${editingStepData.id}` ? (dropdownPosition === 'top' ? 'rotate-180' : 'rotate-0') : ''}`} />
                                )}
                              </button>
                              
                              {/* Area Dropdown - only if no goal */}
                              {!editingStepData.goalId && openDropdownId === `area-${editingStepData.id}` && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-40 bg-transparent cursor-pointer" 
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setOpenDropdownId(null)
                                    }}
                                  />
                                  <div 
                                    data-dropdown={`area-${editingStepData.id}`}
                                    className={`absolute ${dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'} left-0 z-50 bg-white border-2 border-primary-500 rounded-playful-md shadow-lg min-w-[160px] max-h-[200px] overflow-y-auto opacity-100`}
                                    style={{ backgroundColor: 'white' }}
                                  >
                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation()
                                        const updatedData = { ...editingStepData, areaId: '' }
                                        setEditingStepData(updatedData)
                                        await handleSaveStep(updatedData, true)
                                        setOpenDropdownId(null)
                                      }}
                                      className="w-full px-3 py-2 text-xs text-left hover:bg-primary-50 border-b border-primary-200 last:border-b-0"
                                    >
                                      {t('details.goal.noArea') || 'Bez výzvy'}
                    </button>
                                    {areas.map((a) => (
                  <button
                                        key={a.id}
                                        onClick={async (e) => {
                                          e.stopPropagation()
                                          const updatedData = { ...editingStepData, areaId: a.id }
                                          setEditingStepData(updatedData)
                                          await handleSaveStep(updatedData, true)
                                          setOpenDropdownId(null)
                                        }}
                                        className="w-full px-3 py-2 text-xs text-left hover:bg-primary-50 border-b border-primary-200 last:border-b-0 flex items-center gap-2"
                                        style={{ color: a.color || '#E8871E' }}
                                      >
                                        <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: a.color || '#E8871E' }} />
                                        {a.name}
                                      </button>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                          
                          {/* Goal - icon + text + dropdown */}
                          <div className="relative">
                            <button
                              data-dropdown-trigger={`goal-${editingStepData.id}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                const dropdownId = `goal-${editingStepData.id}`
                                setOpenDropdownId(openDropdownId === dropdownId ? null : dropdownId)
                              }}
                              className={`flex items-center gap-1.5 px-2 py-1 rounded-playful-sm hover:bg-gray-100 transition-colors ${
                                !goal ? 'opacity-50' : ''
                              }`}
                            >
                              <Target className={`w-4 h-4 flex-shrink-0 ${goal && area ? '' : 'text-gray-400'}`} style={goal && area ? { color: area.color || '#E8871E' } : {}} />
                              <span className="text-xs whitespace-nowrap max-w-[120px] truncate">
                                {goal ? goal.title : (t('steps.noGoal') || 'Bez cíle')}
                              </span>
                              <ChevronDown className={`w-3 h-3 transition-transform ${openDropdownId === `goal-${editingStepData.id}` ? (dropdownPosition === 'top' ? 'rotate-180' : 'rotate-0') : ''}`} />
                            </button>
                            
                            {/* Goal Dropdown */}
                            {openDropdownId === `goal-${editingStepData.id}` && (
                              <>
                                <div 
                                  className="fixed inset-0 z-40 bg-transparent cursor-pointer" 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setOpenDropdownId(null)
                                  }}
                                />
                                <div 
                                  data-dropdown={`goal-${editingStepData.id}`}
                                  className={`absolute ${dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'} left-0 z-50 bg-white border-2 border-primary-500 rounded-playful-md shadow-lg min-w-[180px] max-h-[200px] overflow-y-auto opacity-100`}
                                  style={{ backgroundColor: 'white' }}
                                >
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation()
                                      const selectedGoal = null
                                      const updatedData = {
                                        ...editingStepData,
                        goalId: '',
                                        areaId: editingStepData.areaId || ''
                                      }
                                      setEditingStepData(updatedData)
                                      await handleSaveStep(updatedData, true)
                                      setOpenDropdownId(null)
                                    }}
                                    className="w-full px-3 py-2 text-xs text-left hover:bg-primary-50 border-b border-primary-200 last:border-b-0"
                                  >
                                    {t('steps.noGoal') || 'Bez cíle'}
                  </button>
                                  {goals.map((g: any) => {
                                    const goalArea = areas.find(a => a.id === g.area_id)
                                    return (
                  <button
                                        key={g.id}
                                        onClick={async (e) => {
                                          e.stopPropagation()
                                          const updatedData = {
                                            ...editingStepData,
                                            goalId: g.id,
                                            areaId: g.area_id || editingStepData.areaId || ''
                                          }
                                          setEditingStepData(updatedData)
                                          await handleSaveStep(updatedData, true)
                                          setOpenDropdownId(null)
                                        }}
                                        className="w-full px-3 py-2 text-xs text-left hover:bg-primary-50 border-b border-primary-200 last:border-b-0 flex items-center gap-2"
                                        style={goalArea ? { color: goalArea.color || '#E8871E' } : {}}
                                      >
                                        <Target className="w-3 h-3 flex-shrink-0" style={goalArea ? { color: goalArea.color || '#E8871E' } : {}} />
                                        {g.title}
                  </button>
                                    )
                                  })}
                </div>
                              </>
                            )}
              </div>
                          
                          {/* Repeating icon - toggle expanded row */}
                          <button
                            onClick={async (e) => {
                              e.stopPropagation()
                              const currentStepId = editingStepData.id
                              const currentIsRecurring = isRecurringStep
                              
                              if (expandedRepeatingStepId === currentStepId) {
                                // Close expanded row and disable repeating
                                const updatedData = {
                                  ...editingStepData,
                                  isRepeating: false,
                                  frequency: null,
                                  selected_days: [],
                                  repeating_start_date: null,
                                  repeating_end_date: null
                                }
                                setEditingStepData(updatedData)
                                
                                // Update local state immediately to prevent flicker
                                setLocalDailySteps(prev => prev.map(s => {
                                  if (s.id === currentStepId) {
                                    return {
                                      ...s,
                                      isRepeating: false,
                                      frequency: null,
                                      selected_days: [],
                                      repeating_start_date: null,
                                      repeating_end_date: null,
                                      // Keep date and current_instance_date
                                      date: s.date || s.current_instance_date,
                                      current_instance_date: undefined
                                    }
                                  }
                                  return s
                                }))
                                
                                // Clear expandedRepeatingStepId before saving to prevent it from being restored
                                setExpandedRepeatingStepId(null)
                                await handleSaveStep(updatedData, true)
                                // Ensure it stays cleared after save
                                setExpandedRepeatingStepId(null)
                              } else if (currentIsRecurring) {
                                // Step is already repeating, just open/close the expanded row
                                setExpandedRepeatingStepId(currentStepId)
                                // Initialize form state with current values
                                setRepeatingModalFrequency(editingStepData.frequency || 'weekly')
                                setRepeatingModalSelectedDays(editingStepData.selected_days || [])
                                setRepeatingStartDate(editingStepData.repeating_start_date || getLocalDateString(new Date()))
                                setRepeatingEndDate(editingStepData.repeating_end_date || null)
                              } else {
                                // Step is not repeating, enable it and open expanded row
                                setExpandedRepeatingStepId(currentStepId)
                                const defaultFrequency = 'weekly'
                                const defaultDays: number[] = []
                                const defaultStartDate = getLocalDateString(new Date())
                                const updatedData = {
                                  ...editingStepData,
                                  isRepeating: true,
                                  frequency: defaultFrequency,
                                  selected_days: defaultDays,
                                  repeating_start_date: defaultStartDate,
                                  repeating_end_date: null
                                }
                                setRepeatingModalFrequency(defaultFrequency)
                                setRepeatingModalSelectedDays(defaultDays)
                                setRepeatingStartDate(defaultStartDate)
                                setRepeatingEndDate(null)
                                setEditingStepData(updatedData)
                                
                                // Don't save yet - wait for frequency to be selected
                                // If user closes without selecting frequency, recurring will be disabled
                              }
                              }}
                            className={`p-1.5 rounded-playful-sm transition-colors ${
                              isRecurringStep
                                ? 'text-primary-600 hover:bg-primary-100' 
                                : 'text-gray-400 hover:text-primary-500 hover:bg-gray-100'
                            }`}
                            title={t('steps.repeating') || 'Opakování'}
                          >
                            <Repeat className="w-4 h-4" />
                          </button>
            </div>
          </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            
            {/* Load More button */}
            {hasMoreSteps && (
              <div className="text-center py-4">
                      <button
                  onClick={() => setDisplayedStepsCount(prev => prev + 50)}
                  className="btn-playful-base px-6 py-2 text-sm font-medium text-black font-playful bg-white hover:bg-primary-50 border-2 border-primary-500"
                >
                  {t('steps.loadMore') || 'Načíst více'} ({allSteps.length - displayedStepsCount} {t('steps.remainingSteps') || 'zbývá'})
                      </button>
                    </div>
            )}
          </>
        )}
      </div>
      
      {/* Overlay to close expanded step when clicking outside */}
      {/* Only show overlay when step is expanded and no modals are open */}
      {/* Use pointer-events: none to allow scrolling, but allow clicks on the overlay itself */}
      {expandedStepId && !inlineModalType && !openDropdownId && (
        <div 
          className="fixed inset-0 z-30"
          style={{
            pointerEvents: 'auto',
            touchAction: 'pan-y pinch-zoom', // Allow vertical scrolling on touch devices
          }}
          onClick={async (e) => {
            e.stopPropagation()
            // Don't close if a new step is being saved
            if (isSavingNewStep) {
              return
            }
            
            // Only close if not clicking on a modal or dropdown
            if (!inlineModalType && !openDropdownId) {
              // Check if this is a new temporary step
              const isNewStep = editingStepData && editingStepData._isTemporary && newStepId === editingStepData.id
              
              if (isNewStep) {
                // Wait a bit for onBlur to complete if title input was focused
                // This ensures that if user clicked outside the input, onBlur runs first and saves the step
                await new Promise(resolve => setTimeout(resolve, 200))
                
                // Check again if step is being saved
                if (isSavingNewStep) {
                  return
                }
                
                // Re-check the step state after potential onBlur update
                const currentStep = localDailySteps.find((s: any) => s.id === editingStepData.id)
                
                // Check if step was already saved (no longer temporary) - onBlur should have handled it
                const wasSaved = currentStep && !currentStep._isTemporary
                
                // If step was saved by onBlur, it should already be closed, but double-check
                if (wasSaved) {
                  // Step was saved, just ensure it's closed (onBlur should have closed it)
                  setExpandedStepId(null)
                  setEditingStepData(null)
                  setEditingTitleId(null)
                  setEditingTitleValue('')
                  setExpandedRepeatingStepId(null)
                  return
                }
                
                // If it's still a new step, check if it has a title
                const currentTitleValue = editingTitleValue.trim()
                const stepTitle = currentStep?.title ? currentStep.title.trim() : (editingStepData.title ? editingStepData.title.trim() : '')
                const hasTitle = currentTitleValue || stepTitle
                
                // If it's still a new step without a title, remove it
                if (!hasTitle) {
                  // Remove new step if title wasn't entered
                  setLocalDailySteps(prev => prev.filter(s => s.id !== editingStepData.id))
                  setExpandedStepId(null)
                  setEditingStepData(null)
                  setNewStepId(null)
                  setNewStepOriginalTitle('')
                  setEditingTitleId(null)
                  setEditingTitleValue('')
                  setExpandedRepeatingStepId(null)
                  return
                }
                
                // If it's still a new step with a title but wasn't saved (shouldn't happen if onBlur worked)
                // Fallback: save it now and close
                const finalTitleValue = currentTitleValue || stepTitle
                if (finalTitleValue) {
                  const updatedStep = { ...editingStepData, title: finalTitleValue }
                  await handleSaveNewStep(updatedStep)
                  // Close after saving
                  setTimeout(() => {
                    setExpandedStepId(null)
                    setEditingStepData(null)
                    setEditingTitleId(null)
                    setEditingTitleValue('')
                    setExpandedRepeatingStepId(null)
                  }, 100)
                  return
                }
              }
              
              // Validate recurring step before closing
              if (editingStepData && editingStepData.isRepeating) {
                const hasFrequency = editingStepData.frequency && editingStepData.frequency !== null
                const isValidRecurring = hasFrequency && 
                  (editingStepData.frequency === 'daily' || 
                   (editingStepData.frequency === 'weekly' && editingStepData.selected_days && editingStepData.selected_days.length > 0) ||
                   (editingStepData.frequency === 'monthly' && editingStepData.selected_days && editingStepData.selected_days.length > 0))
                
                if (!isValidRecurring) {
                  // Disable recurring if invalid
                  const updatedData = {
                    ...editingStepData,
                    isRepeating: false,
                    frequency: null,
                    selected_days: [],
                    repeating_start_date: null,
                    repeating_end_date: null
                  }
                  setEditingStepData(updatedData)
                  
                  // Update local state
                  const stepToUpdate = localDailySteps.find((s: any) => s.id === editingStepData.id)
                  if (stepToUpdate) {
                    setLocalDailySteps(prev => prev.map(s => {
                      if (s.id === editingStepData.id) {
                        return {
                          ...s,
                          isRepeating: false,
                          frequency: null,
                          selected_days: [],
                          repeating_start_date: null,
                          repeating_end_date: null,
                          current_instance_date: undefined
                        }
                      }
                      return s
                    }))
                    
                    // Save the update to disable recurring
                    await handleSaveStep(updatedData, true)
                  }
                }
              }
              
              // Clear expanded state
              setExpandedRepeatingStepId(null)
              setExpandedStepId(null)
              setEditingStepData(null)
            }
          }}
        />
      )}
      
      {/* Inline Modals for header icons */}
      {inlineModalType && inlineModalPosition && editingStepData && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-transparent cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              setInlineModalType(null)
              setInlineModalPosition(null)
              setClickedIconId(null)
            }}
          />
          <div 
            className="fixed z-50 box-playful-highlight p-4 bg-white"
            style={{
              top: (() => {
                const modalHeight = 350
                const viewportHeight = window.innerHeight
                
                // For date/time modals (top buttons), show directly below
                if (inlineModalType === 'date' || inlineModalType === 'time') {
                  const requestedTop = inlineModalPosition.top // This is rect.bottom + 5
                  if (requestedTop + modalHeight <= viewportHeight - 10) {
                    return `${requestedTop}px`
                  }
                  // Move up if needed
                  return `${Math.max(10, viewportHeight - modalHeight - 10)}px`
                }
                
                // For bottom icons (area, goal, repeating), position modal ABOVE the icon
                // Modal should start with its bottom edge at the icon's top edge
                let buttonTop = inlineModalPosition.top ?? 0
                let buttonBottom = inlineModalPosition.bottom ?? 0
                
                // Always get fresh position from DOM to ensure accuracy
                if (clickedIconId && typeof window !== 'undefined') {
                  try {
                    const iconElement = document.querySelector(`[data-icon-id="${clickedIconId}"]`) as HTMLElement
                    if (iconElement) {
                      const rect = iconElement.getBoundingClientRect()
                      buttonTop = rect.top
                      buttonBottom = rect.bottom
                    }
                  } catch (e) {
                    // Fallback to stored position if DOM query fails
                  }
                }
                
                if (buttonBottom === 0 || buttonTop === 0) {
                  // Position not set, use center of viewport as fallback
                  return `${Math.max(10, (viewportHeight - modalHeight) / 2)}px`
                }
                
                // Position modal so its bottom edge is at icon's top edge
                // This means modal top = icon top - modal height
                let modalTop = buttonTop - modalHeight
                
                // If modal would go off-screen at the top, adjust it down
                // But keep it as close to the icon as possible
                if (modalTop < 10) {
                  // Modal doesn't fit above, try to fit it in viewport
                  // First, check if it fits below the icon
                  const positionBelow = buttonBottom + 10 // Small gap below icon
                  
                  if (positionBelow + modalHeight <= viewportHeight - 10) {
                    // Fits below, position it there
                    return `${positionBelow}px`
                  } else {
                    // Doesn't fit below either, position it to fit in viewport
                    // Prefer to keep it above the icon, so adjust it down minimally
                    return `${10}px`
                  }
                }
                
                // Modal fits above, return the calculated position
                return `${modalTop}px`
              })(),
              left: (() => {
                const modalWidth = 230
                const viewportWidth = window.innerWidth
                const requestedLeft = inlineModalPosition.left || 0
                
                // Calculate available width - account for assistant panel on the right
                // Assistant is 288px when expanded, 48px when minimized, or 0 if hidden
                // Use conservative estimate: assume assistant might be visible (300px to be safe)
                let assistantWidth = 0
                if (typeof window !== 'undefined') {
                  try {
                    // Try to find assistant panel - it has classes w-72 (288px) or w-12 (48px) and is on the right
                    const assistantPanels = document.querySelectorAll('[class*="w-72"], [class*="w-12"]')
                    Array.from(assistantPanels).some((panel) => {
                      const rect = (panel as HTMLElement).getBoundingClientRect()
                      // Assistant is always on the right side of the screen
                      if (rect.right >= viewportWidth - 10 && rect.width > 0) {
                        assistantWidth = rect.width
                        return true // Stop iteration
                      }
                      return false
                    })
                    // If not found, use conservative estimate
                    if (assistantWidth === 0) {
                      assistantWidth = 300 // Conservative estimate for expanded assistant (288px) + margin
                    }
                  } catch (e) {
                    // If we can't determine, use conservative estimate
                    assistantWidth = 300
                  }
                }
                
                // Available width is viewport minus assistant and margins
                const availableWidth = viewportWidth - assistantWidth - 20 // 20px for margins
                
                // For date/time modals, center below the button
                if (inlineModalType === 'date' || inlineModalType === 'time') {
                  const buttonWidth = inlineModalPosition.width || 112 // Default button width
                  const centeredLeft = requestedLeft + (buttonWidth / 2) - (modalWidth / 2)
                  // Ensure it stays within available width
                  if (centeredLeft < 10) {
                    return `${10}px`
                  }
                  if (centeredLeft + modalWidth > availableWidth) {
                    return `${availableWidth - modalWidth}px`
                  }
                  return `${centeredLeft}px`
                }
                
                // For bottom icons, center the modal horizontally under the icon
                let buttonWidth = inlineModalPosition.width || 36
                let buttonLeft = inlineModalPosition.left || 0
                
                // Get fresh position from DOM if available
                if (clickedIconId && typeof window !== 'undefined') {
                  try {
                    const iconElement = document.querySelector(`[data-icon-id="${clickedIconId}"]`) as HTMLElement
                    if (iconElement) {
                      const rect = iconElement.getBoundingClientRect()
                      buttonLeft = rect.left
                      buttonWidth = rect.width
                    }
                  } catch (e) {
                    // Fallback to stored position if DOM query fails
                  }
                }
                
                // Center modal under icon: icon center - modal center
                const iconCenterX = buttonLeft + (buttonWidth / 2)
                const modalCenterX = modalWidth / 2
                let centeredLeft = iconCenterX - modalCenterX
                
                // Ensure modal stays within available width
                // If it would go off-screen on the left, align it to the left edge
                if (centeredLeft < 10) {
                  centeredLeft = 10
                }
                
                // If it would go off-screen on the right, align it to the right edge of available space
                if (centeredLeft + modalWidth > availableWidth) {
                  centeredLeft = availableWidth - modalWidth
                }
                
                return `${centeredLeft}px`
              })(),
              width: '230px',
              transformOrigin: (() => {
                // Calculate transform origin based on icon position relative to modal
                if (!clickedIconId || !inlineModalPosition || typeof window === 'undefined') {
                  return 'center center'
                }
                
                const modalWidth = 230
                const modalHeight = 350
                const viewportHeight = window.innerHeight
                const viewportWidth = window.innerWidth
                
                // Calculate modal position (same logic as top/left)
                let modalTop = 0
                let modalLeft = 0
                
                // Calculate modal top (same as top style calculation)
                if (inlineModalType === 'date' || inlineModalType === 'time') {
                  const requestedTop = inlineModalPosition.top
                  if (requestedTop + modalHeight <= viewportHeight - 10) {
                    modalTop = requestedTop
                  } else {
                    modalTop = Math.max(10, viewportHeight - modalHeight - 10)
                  }
                } else {
                  // For bottom icons
                  let buttonTop = inlineModalPosition.top ?? 0
                  let buttonBottom = inlineModalPosition.bottom ?? 0
                  
                  if (clickedIconId) {
                    try {
                      const iconElement = document.querySelector(`[data-icon-id="${clickedIconId}"]`) as HTMLElement
                      if (iconElement) {
                        const rect = iconElement.getBoundingClientRect()
                        buttonTop = rect.top
                        buttonBottom = rect.bottom
                      }
                    } catch (e) {}
                  }
                  
                  if (buttonBottom === 0 || buttonTop === 0) {
                    modalTop = Math.max(10, (viewportHeight - modalHeight) / 2)
                  } else {
                    modalTop = buttonTop - modalHeight
                    if (modalTop < 10) {
                      const positionBelow = buttonBottom + 10
                      if (positionBelow + modalHeight <= viewportHeight - 10) {
                        modalTop = positionBelow
                      } else {
                        modalTop = 10
                      }
                    }
                  }
                }
                
                // Calculate modal left (same as left style calculation)
                let assistantWidth = 0
                try {
                  const assistantPanels = document.querySelectorAll('[class*="w-72"], [class*="w-12"]')
                  Array.from(assistantPanels).some((panel) => {
                    const rect = (panel as HTMLElement).getBoundingClientRect()
                    if (rect.right >= viewportWidth - 10 && rect.width > 0) {
                      assistantWidth = rect.width
                      return true // Stop iteration
                    }
                    return false
                  })
                  if (assistantWidth === 0) {
                    assistantWidth = 300
                  }
                } catch (e) {
                  assistantWidth = 300
                }
                
                const availableWidth = viewportWidth - assistantWidth - 20
                
                if (inlineModalType === 'date' || inlineModalType === 'time') {
                  const buttonWidth = inlineModalPosition.width || 112
                  const iconCenterX = (inlineModalPosition.left || 0) + (buttonWidth / 2)
                  modalLeft = iconCenterX - (modalWidth / 2)
                  if (modalLeft < 10) {
                    modalLeft = 10
                  } else if (modalLeft + modalWidth > availableWidth) {
                    modalLeft = availableWidth - modalWidth
                  }
                } else {
                  let buttonWidth = inlineModalPosition.width || 36
                  let buttonLeft = inlineModalPosition.left || 0
                  
                  if (clickedIconId) {
                    try {
                      const iconElement = document.querySelector(`[data-icon-id="${clickedIconId}"]`) as HTMLElement
                      if (iconElement) {
                        const rect = iconElement.getBoundingClientRect()
                        buttonLeft = rect.left
                        buttonWidth = rect.width
                      }
                    } catch (e) {}
                  }
                  
                  const iconCenterX = buttonLeft + (buttonWidth / 2)
                  modalLeft = iconCenterX - (modalWidth / 2)
                  if (modalLeft < 10) {
                    modalLeft = 10
                  } else if (modalLeft + modalWidth > availableWidth) {
                    modalLeft = availableWidth - modalWidth
                  }
                }
                
                // Get icon position (always use fresh from DOM)
                let iconTop = inlineModalPosition.top ?? 0
                let iconLeft = inlineModalPosition.left ?? 0
                let iconWidth = inlineModalPosition.width ?? 36
                let iconHeight = inlineModalPosition.height ?? 36
                
                try {
                  const iconElement = document.querySelector(`[data-icon-id="${clickedIconId}"]`) as HTMLElement
                  if (iconElement) {
                    const rect = iconElement.getBoundingClientRect()
                    iconTop = rect.top
                    iconLeft = rect.left
                    iconWidth = rect.width
                    iconHeight = rect.height
                  }
                } catch (e) {}
                
                // Calculate icon center relative to modal
                // This is the transform origin point
                const iconCenterX = iconLeft + (iconWidth / 2) - modalLeft
                const iconCenterY = iconTop + (iconHeight / 2) - modalTop
                
                return `${iconCenterX}px ${iconCenterY}px`
              })(),
              ['--modal-translate-x' as any]: (() => {
                // Calculate initial translate X: difference between icon center and modal center
                if (!clickedIconId || !inlineModalPosition || typeof window === 'undefined') {
                  return '0px'
                }
                
                const modalWidth = 230
                const viewportWidth = window.innerWidth
                
                // Get icon position - ALWAYS use fresh from DOM for accuracy
                let iconLeft = 0
                let iconWidth = 36
                
                try {
                  const iconElement = document.querySelector(`[data-icon-id="${clickedIconId}"]`) as HTMLElement
                  if (iconElement) {
                    const rect = iconElement.getBoundingClientRect()
                    iconLeft = rect.left
                    iconWidth = rect.width
                  } else {
                    // Fallback to stored position
                    iconLeft = inlineModalPosition.left ?? 0
                    iconWidth = inlineModalPosition.width ?? 36
                  }
                } catch (e) {
                  // Fallback to stored position
                  iconLeft = inlineModalPosition.left ?? 0
                  iconWidth = inlineModalPosition.width ?? 36
                }
                
                // Calculate final modal left (EXACT same as left style calculation)
                let assistantWidth = 0
                try {
                  const assistantPanels = document.querySelectorAll('[class*="w-72"], [class*="w-12"]')
                  Array.from(assistantPanels).some((panel) => {
                    const rect = (panel as HTMLElement).getBoundingClientRect()
                    if (rect.right >= viewportWidth - 10 && rect.width > 0) {
                      assistantWidth = rect.width
                      return true // Stop iteration
                    }
                    return false
                  })
                  if (assistantWidth === 0) {
                    assistantWidth = 300
                  }
                } catch (e) {
                  assistantWidth = 300
                }
                
                const availableWidth = viewportWidth - assistantWidth - 20
                
                let modalLeft = 0
                if (inlineModalType === 'date' || inlineModalType === 'time') {
                  const buttonWidth = inlineModalPosition.width || 112
                  const centeredLeft = (inlineModalPosition.left || 0) + (buttonWidth / 2) - (modalWidth / 2)
                  if (centeredLeft < 10) {
                    modalLeft = 10
                  } else if (centeredLeft + modalWidth > availableWidth) {
                    modalLeft = availableWidth - modalWidth
                  } else {
                    modalLeft = centeredLeft
                  }
                } else {
                  // For bottom icons (goal, area, repeating) - center under icon
                  const iconCenterX = iconLeft + (iconWidth / 2)
                  const modalCenterX = modalWidth / 2
                  let centeredLeft = iconCenterX - modalCenterX
                  
                  if (centeredLeft < 10) {
                    centeredLeft = 10
                  } else if (centeredLeft + modalWidth > availableWidth) {
                    centeredLeft = availableWidth - modalWidth
                  }
                  
                  modalLeft = centeredLeft
                }
                
                // Initial translate: icon center - modal center in final position
                const iconCenterX = iconLeft + (iconWidth / 2)
                const modalCenterX = modalLeft + (modalWidth / 2)
                const translateX = iconCenterX - modalCenterX
                
                return `${translateX}px`
              })(),
              ['--modal-translate-y' as any]: (() => {
                // Calculate initial translate Y: difference between icon center and modal center
                if (!clickedIconId || !inlineModalPosition || typeof window === 'undefined') {
                  return '0px'
                }
                
                const modalHeight = 350
                const viewportHeight = window.innerHeight
                
                // Get icon position - ALWAYS use fresh from DOM for accuracy
                let iconTop = 0
                let iconBottom = 0
                let iconHeight = 36
                
                try {
                  const iconElement = document.querySelector(`[data-icon-id="${clickedIconId}"]`) as HTMLElement
                  if (iconElement) {
                    const rect = iconElement.getBoundingClientRect()
                    iconTop = rect.top
                    iconBottom = rect.bottom
                    iconHeight = rect.height
                  } else {
                    // Fallback to stored position
                    iconTop = inlineModalPosition.top ?? 0
                    iconBottom = inlineModalPosition.bottom ?? 0
                    iconHeight = inlineModalPosition.height ?? 36
                  }
                } catch (e) {
                  // Fallback to stored position
                  iconTop = inlineModalPosition.top ?? 0
                  iconBottom = inlineModalPosition.bottom ?? 0
                  iconHeight = inlineModalPosition.height ?? 36
                }
                
                // Calculate final modal top (EXACT same as top style calculation)
                let modalTop = 0
                
                if (inlineModalType === 'date' || inlineModalType === 'time') {
                  const requestedTop = inlineModalPosition.top
                  if (requestedTop + modalHeight <= viewportHeight - 10) {
                    modalTop = requestedTop
                  } else {
                    modalTop = Math.max(10, viewportHeight - modalHeight - 10)
                  }
                } else {
                  // For bottom icons (goal, area, repeating)
                  if (iconBottom === 0 || iconTop === 0) {
                    modalTop = Math.max(10, (viewportHeight - modalHeight) / 2)
                  } else {
                    // Position modal so its bottom edge is at icon's top edge
                    modalTop = iconTop - modalHeight
                    
                    if (modalTop < 10) {
                      // Modal doesn't fit above, try to fit it in viewport
                      const positionBelow = iconBottom + 10
                      if (positionBelow + modalHeight <= viewportHeight - 10) {
                        modalTop = positionBelow
                      } else {
                        modalTop = 10
                      }
                    }
                  }
                }
                
                // Initial translate: icon center - modal center in final position
                const iconCenterY = iconTop + (iconHeight / 2)
                const modalCenterY = modalTop + (modalHeight / 2)
                const translateY = iconCenterY - modalCenterY
                
                return `${translateY}px`
              })(),
              animation: 'modalExpand 200ms ease-out forwards'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Date Modal */}
            {inlineModalType === 'date' && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-bold text-black font-playful">{t('steps.date') || 'Datum'}</div>
                  {savingDateStepId === editingStepData?.id && (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full"></div>
                      <span className="text-xs text-gray-600">{t('steps.saving') || 'Ukládám...'}</span>
                    </div>
                  )}
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
                <div className="grid grid-cols-7 gap-0.5">
                  {(() => {
                    const year = datePickerMonth.getFullYear()
                    const month = datePickerMonth.getMonth()
                    const firstDay = new Date(year, month, 1)
                    const lastDay = new Date(year, month + 1, 0)
                    const startDay = (firstDay.getDay() + 6) % 7 // Monday = 0
                    const days: (Date | null)[] = []
                    
                    for (let i = 0; i < startDay; i++) {
                      days.push(null)
                    }
                    
                    for (let d = 1; d <= lastDay.getDate(); d++) {
                      days.push(new Date(year, month, d))
                    }
                    
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    const selectedDate = editingStepData.date ? new Date(editingStepData.date) : null
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
                          onClick={async () => {
                            const dayDateStr = getLocalDateString(day)
                            const stepId = editingStepData.id
                            
                            // Set loading state IMMEDIATELY before async operations
                            setSavingDateStepId(stepId)
                            setSavingDateStr(dayDateStr)
                            
                            const updatedData = {
                              ...editingStepData,
                              date: dayDateStr
                            }
                            setEditingStepData(updatedData)
                            
                            try {
                              // Add minimum delay to ensure loading is visible
                              await Promise.all([
                                handleSaveStep(updatedData, true),
                                new Promise(resolve => setTimeout(resolve, 500)) // Minimum 500ms to show loading
                              ])
                            } finally {
                              // Clear loading state and close modal
                              setSavingDateStepId(null)
                              setSavingDateStr(null)
                              setInlineModalType(null)
                              setInlineModalPosition(null)
                            }
                          }}
                          disabled={savingDateStepId === editingStepData.id}
                          className={`w-7 h-7 rounded-playful-sm text-xs font-medium transition-colors border-2 flex items-center justify-center ${
                            savingDateStepId === editingStepData.id && savingDateStr === getLocalDateString(day)
                              ? 'bg-primary-200 border-primary-600'
                              : isSelected
                              ? 'bg-white text-black font-bold border-primary-500'
                              : isToday
                                ? 'bg-primary-100 text-primary-600 font-bold border-primary-500'
                                : 'hover:bg-primary-50 text-black border-gray-300'
                          } ${savingDateStepId === editingStepData.id && savingDateStr === getLocalDateString(day) ? 'cursor-not-allowed opacity-90' : ''}`}
                        >
                          {savingDateStepId === editingStepData.id && savingDateStr === getLocalDateString(day) ? (
                            <div className="animate-spin h-4 w-4 border-2 border-primary-600 border-t-transparent rounded-full"></div>
                          ) : (
                            <span>{day.getDate()}</span>
                          )}
                        </button>
                      )
                    })
                  })()}
                </div>
              </>
            )}
            
            {/* Time Modal */}
            {inlineModalType === 'time' && (
              <>
                <div className="text-sm font-bold text-black mb-3 font-playful">{t('steps.estimatedTimeLabel') || 'Estimated time (min)'}</div>
                <input
                  type="number"
                  min="0"
                  value={editingStepData.estimated_time || 0}
                  onChange={async (e) => {
                    const newTime = parseInt(e.target.value) || 0
                    const updatedData = { ...editingStepData, estimated_time: newTime }
                    setEditingStepData(updatedData)
                    // Save immediately on change
                    await handleSaveStep(updatedData, true)
                  }}
                  onBlur={() => {
                    setInlineModalType(null)
                    setInlineModalPosition(null)
                  }}
                  className="w-full px-3 py-2 text-sm border-2 border-primary-500 rounded-playful-md bg-white text-black"
                  placeholder="0"
                  autoFocus
                />
              </>
            )}
            
            
                    </div>
                  </>
      )}
      {/* Legacy Date Picker Modal removed – inline modals are used instead */}
      
      {/* Delete Step Confirmation Modal */}
      {deleteStepToConfirm && (
        <DeleteStepModal
          show={!!deleteStepToConfirm}
          stepTitle={deleteStepToConfirm.title || t('steps.untitled') || 'Bez názvu'}
          isDeleting={isDeletingStep}
          onClose={() => {
            if (!isDeletingStep) {
              setDeleteStepToConfirm(null)
            }
          }}
          onConfirm={handleConfirmDeleteStep}
          isRecurring={!!(deleteStepToConfirm.frequency && deleteStepToConfirm.frequency !== null)}
        />
      )}
      
      {/* Refresh Modal with Pending Saves */}
      {showRefreshModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-playful-md border-2 border-primary-500 p-6 max-w-md w-full mx-4 shadow-lg">
            <h3 className="text-lg font-bold mb-4 text-black">
              {t('steps.refreshPendingTitle') || 'Ne všechna data jsou uložena'}
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              {pendingSaves.size > 0
                ? t('steps.refreshPendingMessage', { count: pendingSaves.size })
                : t('steps.refreshSavedMessage')}
            </p>
            
            {pendingSaves.size > 0 ? (
              <div className="flex items-center gap-3 mb-4">
                <RotateCw className="w-5 h-5 text-primary-600 animate-spin" />
                <span className="text-sm text-gray-600">
                  {t('steps.saving') || 'Ukládání...'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3 mb-4">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-600">
                  {t('steps.saved') || 'Uloženo'}
                </span>
              </div>
            )}
            
            <div className="flex gap-3 justify-end">
              {pendingSaves.size > 0 ? (
                <button
                  onClick={() => {
                    setShowRefreshModal(false)
                    setRefreshPending(false)
                  }}
                  className="px-4 py-2 text-sm border-2 border-gray-300 rounded-playful-sm hover:bg-gray-50 transition-colors"
                >
                  {t('steps.cancel') || 'Zrušit'}
                </button>
              ) : (
                <>
                      <button
                    onClick={() => {
                      setShowRefreshModal(false)
                      setRefreshPending(false)
                    }}
                    className="px-4 py-2 text-sm border-2 border-gray-300 rounded-playful-sm hover:bg-gray-50 transition-colors"
                  >
                    {t('steps.stay') || 'Zůstat'}
                      </button>
                        <button
                    onClick={() => {
                      window.location.reload()
                    }}
                    className="px-4 py-2 text-sm bg-primary-500 text-white rounded-playful-sm hover:bg-primary-600 transition-colors"
                  >
                    {t('steps.refresh') || 'Obnovit'}
                        </button>
                </>
              )}
          </div>
          </div>
        </div>
      )}
    </div>
  )
}
