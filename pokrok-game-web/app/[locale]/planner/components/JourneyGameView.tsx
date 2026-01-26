'use client'

import { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef, memo, Fragment } from 'react'
import { createPortal } from 'react-dom'
import { useUser } from '@clerk/nextjs'
import { useTranslations, useLocale } from 'next-intl'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverlay, useDroppable, useDraggable } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SettingsPage } from './SettingsPage'
import { Footprints, Calendar, Target, CheckCircle, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Edit, Trash2, Plus, Clock, Star, Zap, Check, Settings, HelpCircle, LayoutDashboard, Sparkles, CheckSquare, Menu, Moon, Search, Flame, Trophy, Folder } from 'lucide-react'
import { DailyReviewWorkflow } from './DailyReviewWorkflow'
import { CalendarProgram } from './CalendarProgram'
import { getIconEmoji, getIconComponent, AVAILABLE_ICONS } from '@/lib/icon-utils'
import { getLocalDateString, normalizeDate } from './utils/dateHelpers'
import { isHabitScheduledForDay, getHabitStartDate } from './utils/habitHelpers'
import { ManagementPage } from './pages/ManagementPage'
import { UnifiedDayView } from './views/UnifiedDayView'
import { FocusManagementView } from './views/FocusManagementView'
import { HelpView } from './views/HelpView'
import { HabitsManagementView } from './views/HabitsManagementView'
import { StepsManagementView } from './views/StepsManagementView'
import { TodayFocusSection } from './views/TodayFocusSection'
import { GoalEditingForm } from './journey/GoalEditingForm'
import { DroppableColumn } from './journey/DroppableColumn'
import { DraggableStep } from './journey/DraggableStep'
import { SortableGoal } from './journey/SortableGoal'
import { ActionButtons } from './layout/ActionButtons'
import { StatisticsContent } from './content/StatisticsContent'
import { DailyPlanContent } from './content/DailyPlanContent'
import { DisplayContent } from './content/DisplayContent'
import { WorkflowContent } from './content/WorkflowContent'
import { CalendarContent } from './content/CalendarContent'
import { HabitsPage } from './views/HabitsPage'
import { HabitDetailPage } from './views/HabitDetailPage'
import { ItemDetailRenderer } from './details/ItemDetailRenderer'
import { PageContent } from './pages/PageContent'
import { DatePickerModal } from './modals/DatePickerModal'
import { AreasManagementModal } from './modals/AreasManagementModal'
import { AreaEditModal } from './modals/AreaEditModal'
import { HeaderNavigation } from './layout/HeaderNavigation'
import { AssistantPanel } from './assistant/AssistantPanel'
import { DeleteHabitModal } from './modals/DeleteHabitModal'
import { HabitModal } from './modals/HabitModal'
import { StepModal } from './modals/StepModal'
import { DeleteStepModal } from './modals/DeleteStepModal'
import { LoadingSpinner } from './ui/LoadingSpinner'
// Removed: ImportantStepsPlanningView import - now handled as workflow view in navigation

interface JourneyGameViewProps {
  player?: any
  userId?: string | null
  habits?: any[]
  dailySteps?: any[]
  isLoadingSteps?: boolean
  onNavigateToGoals?: () => void
  onNavigateToHabits?: () => void
  onNavigateToSteps?: () => void
  onNavigateToDailyPlan?: () => void
  onNavigateToStatistics?: () => void
  onNavigateToAchievements?: () => void
  onNavigateToSettings?: () => void
  onHabitsUpdate?: (habits: any[]) => void
  onDailyStepsUpdate?: (steps: any[]) => void
  hasCompletedOnboarding?: boolean | null
  onOnboardingComplete?: () => void
}

export function JourneyGameView({ 
  player, 
  userId: userIdProp,
  habits = [], 
  dailySteps = [],
  isLoadingSteps = false,
  onNavigateToGoals,
  onNavigateToHabits,
  onNavigateToSteps,
  onNavigateToDailyPlan,
  onNavigateToStatistics,
  onNavigateToAchievements,
  onNavigateToSettings,
  onHabitsUpdate,
  onDailyStepsUpdate,
  hasCompletedOnboarding,
  onOnboardingComplete
}: JourneyGameViewProps) {
  const t = useTranslations()
  const locale = useLocale()
  const localeCode = locale === 'cs' ? 'cs-CZ' : 'en-US'
  
  // Top menu items (Habits) - defined at top level for use in header
  const topMenuItems = [
    { id: 'habits' as const, label: t('navigation.habits'), icon: CheckSquare },
  ]
  
  const { user } = useUser()
  const [userId, setUserId] = useState<string | null>(userIdProp || null)
  const [characterDialogue, setCharacterDialogue] = useState("Ahoj! Jsem tvůj průvodce na cestě k úspěchu. Co chceš dělat dnes?")
  const [showDialogue, setShowDialogue] = useState(true)
  
  // Update userId when prop changes
  useEffect(() => {
    if (userIdProp) {
      setUserId(userIdProp)
    }
  }, [userIdProp])
  
  // Load userId from API as fallback if not provided as prop
  const isLoadingUserRef = useRef(false)
  useEffect(() => {
    if (userId || !user?.id || isLoadingUserRef.current) return
    
    isLoadingUserRef.current = true
    const loadUserId = async () => {
      try {
        console.log('Loading userId for authenticated user')
        let response = await fetch(`/api/user`)
        let retryCount = 0
        const maxRetries = 3
        
        // Retry if user not found (might be creating)
        while (!response.ok && response.status === 404 && retryCount < maxRetries) {
          console.log(`User not found, retrying (attempt ${retryCount + 1}/${maxRetries})...`)
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))) // Exponential backoff
          response = await fetch(`/api/user`)
          retryCount++
        }
        
        if (response.ok) {
          const dbUser = await response.json()
          console.log('User loaded from DB:', dbUser)
          setUserId(dbUser.id)
        } else {
          console.error('Failed to load user, status:', response.status)
          const errorText = await response.text()
          console.error('Error response:', errorText)
          isLoadingUserRef.current = false // Reset on error to allow retry
        }
      } catch (error) {
        console.error('Error loading userId:', error)
        isLoadingUserRef.current = false // Reset on error to allow retry
      }
    }
    
    loadUserId()
  }, [user?.id, userId])

  const [currentPage, setCurrentPage] = useState<'main' | 'habits' | 'statistics' | 'achievements' | 'settings' | 'workflows' | 'help' | 'areas'>(() => {
    // Default to 'main' (Main Panel) when user first logs in
    if (typeof window !== 'undefined') {
      try {
        const savedPage = localStorage.getItem('journeyGame_currentPage')
        if (savedPage && ['main', 'habits', 'statistics', 'achievements', 'settings', 'workflows', 'help', 'areas'].includes(savedPage)) {
          return savedPage as 'main' | 'habits' | 'statistics' | 'achievements' | 'settings' | 'workflows' | 'help' | 'areas'
        }
      } catch (error) {
        console.error('Error loading currentPage:', error)
      }
    }
    return 'main'
  })

  // Removed: Important steps planning overlay - now handled as workflow view in navigation
  
  // Navigation within main panel - now supports goal IDs (e.g., 'goal-{id}')
  const [mainPanelSection, setMainPanelSection] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedSection = localStorage.getItem('journeyGame_mainPanelSection')
        if (savedSection) {
          // Migrate old time-based views (focus-day, focus-week) to focus-upcoming
          if (['focus-day', 'focus-week'].includes(savedSection)) {
            return 'focus-upcoming'
          }
          // Migrate old calendar views (focus-month, focus-year, focus-calendar) to overview
          if (['focus-month', 'focus-year', 'focus-calendar'].includes(savedSection)) {
            return 'overview'
          }
          return savedSection
        }
      } catch (error) {
        console.error('Error loading mainPanelSection:', error)
      }
    }
    // Default to 'focus-upcoming' (UpcomingView) when user first logs in
    return 'focus-upcoming'
  })
  
  // Goals removed - no selectedGoalId
  
  // Local state for dailySteps to allow updates from child components
  const [localDailySteps, setLocalDailySteps] = useState<any[]>(dailySteps)
  
  // Sync localDailySteps with prop
  useEffect(() => {
    setLocalDailySteps(dailySteps)
  }, [dailySteps])
  
  // Listen for dailyStepsUpdated event to update local state
  useEffect(() => {
    const handleDailyStepsUpdated = (event: any) => {
      const { steps, source } = event.detail || {}
      if (steps && Array.isArray(steps)) {
        console.log('[JourneyGameView] dailyStepsUpdated event received:', { 
          stepsCount: steps.length, 
          source 
        })
        setLocalDailySteps(steps)
        // DON'T call onDailyStepsUpdate if event came from GameWorldView
        // This would cause infinite loop: GameWorldView -> event -> JourneyGameView -> onDailyStepsUpdate -> GameWorldView -> event...
        // GameWorldView already has the updated state, we just need to sync local state
        if (source === 'GameWorldView') {
          console.log('[JourneyGameView] Event from GameWorldView - skipping onDailyStepsUpdate to avoid loop')
          return
        }
        
        // Only call onDailyStepsUpdate for events from other sources (e.g., UpcomingView)
        if (onDailyStepsUpdate) {
          console.log('[JourneyGameView] Calling onDailyStepsUpdate with', steps.length, 'steps')
          onDailyStepsUpdate(steps)
        } else {
          console.warn('[JourneyGameView] onDailyStepsUpdate is not defined!')
        }
      }
    }
    
    window.addEventListener('dailyStepsUpdated', handleDailyStepsUpdated)
    return () => {
      window.removeEventListener('dailyStepsUpdated', handleDailyStepsUpdated)
    }
  }, [onDailyStepsUpdate])
  
  // Also listen for assistantActionCompleted to trigger refresh
  useEffect(() => {
    const handleAssistantActionCompleted = async (event: any) => {
      const { actions } = event.detail || {}
      if (!actions || !Array.isArray(actions)) return
      
      const stepActions = actions.filter((action: any) => 
        action.type === 'step' && (action.operation === 'create' || action.operation === 'update') && action.success
      )
      
      if (stepActions.length > 0 && userId) {
        console.log('[JourneyGameView] assistantActionCompleted: refreshing steps')
        // Reload steps from server
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const veryOldDate = new Date(today)
        veryOldDate.setDate(veryOldDate.getDate() - 90)
        const endDate = new Date(today)
        endDate.setDate(endDate.getDate() + 30)
        
        try {
          const response = await fetch(
            `/api/daily-steps?userId=${userId}&startDate=${veryOldDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`
          )
          if (response.ok) {
            const steps = await response.json()
            setLocalDailySteps(Array.isArray(steps) ? steps : [])
            if (onDailyStepsUpdate) {
              onDailyStepsUpdate(Array.isArray(steps) ? steps : [])
            }
          }
        } catch (error) {
          console.error('[JourneyGameView] Error refreshing steps after assistant action:', error)
        }
      }
    }
    
    window.addEventListener('assistantActionCompleted', handleAssistantActionCompleted)
    return () => {
      window.removeEventListener('assistantActionCompleted', handleAssistantActionCompleted)
    }
  }, [userId, onDailyStepsUpdate])
  
  // Sidebar collapsed state
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('journeyGame_sidebarCollapsed')
        return saved === 'true'
      } catch (error) {
        console.error('Error loading sidebarCollapsed:', error)
      }
    }
    return false
  })
  
  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileTopMenuOpen, setMobileTopMenuOpen] = useState(false)
  const [currentManagementProgram, setCurrentManagementProgram] = useState<'habits'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedManagementProgram = localStorage.getItem('journeyGame_currentManagementProgram')
        if (savedManagementProgram && ['habits'].includes(savedManagementProgram)) {
          return savedManagementProgram as 'habits'
        }
      } catch (error) {
        console.error('Error loading currentManagementProgram:', error)
      }
    }
    return 'habits'
  })

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [currentProgram, setCurrentProgram] = useState<'day' | 'week' | 'month' | 'year'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedProgram = localStorage.getItem('journeyGame_currentProgram')
        if (savedProgram && ['day', 'week', 'month', 'year'].includes(savedProgram)) {
          return savedProgram as 'day' | 'week' | 'month' | 'year'
        }
      } catch (error) {
        console.error('Error loading currentProgram:', error)
      }
    }
    return 'day'
  })

  // Load default view from user settings (only if not restored from localStorage)
  useEffect(() => {
    if (!userId) return
    
    // Check if we already restored from localStorage
    const savedProgram = localStorage.getItem('journeyGame_currentProgram')
    if (savedProgram) return // Skip if already restored
    
    const loadDefaultView = async () => {
      try {
        const response = await fetch('/api/cesta/user-settings')
        if (response.ok) {
          const data = await response.json()
          if (data.settings?.default_view) {
            setCurrentProgram(data.settings.default_view as 'day' | 'week' | 'month' | 'year')
          }
        }
      } catch (error) {
        console.error('Error loading default view:', error)
      }
    }
    
    loadDefaultView()
  }, [userId])

  // Ensure Main Panel is open when user first logs in (after sign-in/sign-up)
  // Always ensure Main Panel Upcoming view is open when user logs in from Clerk
  // This overrides any previous localStorage values
  useEffect(() => {
    if (typeof window !== 'undefined' && userId) {
      // Always set to Main Panel Upcoming view when user is loaded
      // This ensures that after login/register, user always sees the main view
      setCurrentPage('main')
      setMainPanelSection('focus-upcoming')
      // Also update localStorage to persist this preference
      localStorage.setItem('journeyGame_currentPage', 'main')
      localStorage.setItem('journeyGame_mainPanelSection', 'focus-upcoming')
    }
  }, [userId])

  // Save navigation state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('journeyGame_currentPage', currentPage)
      localStorage.setItem('journeyGame_currentProgram', currentProgram)
      localStorage.setItem('journeyGame_currentManagementProgram', currentManagementProgram)
      if (mainPanelSection !== null) {
        localStorage.setItem('journeyGame_mainPanelSection', mainPanelSection)
      }
      localStorage.setItem('journeyGame_sidebarCollapsed', sidebarCollapsed.toString())
    } catch (error) {
      console.error('Error saving navigation state:', error)
    }
  }, [currentPage, currentProgram, currentManagementProgram, mainPanelSection, sidebarCollapsed])

  // Listen for workflows settings open event from sidebar
  useEffect(() => {
    const handleOpenWorkflowsSettings = () => {
      setCurrentPage('workflows')
    }

    window.addEventListener('openWorkflowsSettings', handleOpenWorkflowsSettings)
    return () => {
      window.removeEventListener('openWorkflowsSettings', handleOpenWorkflowsSettings)
    }
  }, [])

  // Listen for storage changes to update mainPanelSection from external navigation
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'journeyGame_mainPanelSection' && e.newValue) {
        setMainPanelSection(e.newValue)
        setCurrentPage('main')
      }
    }

    window.addEventListener('storage', handleStorageChange)
    // Also listen for custom storage event (for same-window updates)
    window.addEventListener('localStorageChange', (e: any) => {
      if (e.detail?.key === 'journeyGame_mainPanelSection' && e.detail?.newValue) {
        setMainPanelSection(e.detail.newValue)
        setCurrentPage('main')
      }
    })

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('localStorageChange', handleStorageChange as any)
    }
  }, [])

  const [editingGoal, setEditingGoal] = useState<any>(null)
  const [editingStep, setEditingStep] = useState<any>(null)
  const [displayMode, setDisplayMode] = useState<'character' | 'progress' | 'motivation' | 'stats' | 'dialogue'>('character')
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [selectedItemType, setSelectedItemType] = useState<'step' | 'habit' | 'goal' | 'stat' | null>(null)
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null) // Selected habit for settings display
  
  // Step modal state (same as in StepsManagementView)
  const [showStepModal, setShowStepModal] = useState(false)
  const [stepModalData, setStepModalData] = useState({
    id: null as string | null,
    title: '',
    description: '',
    date: '',
    areaId: '',
    completed: false,
    is_important: false,
    is_urgent: false,
    deadline: '',
    estimated_time: 0,
    checklist: [] as Array<{ id: string; title: string; completed: boolean }>,
    require_checklist_complete: false,
    isRepeating: false,
    frequency: null as string | null,
    selected_days: [] as string[],
    recurring_start_date: null as string | null,
    recurring_end_date: null as string | null,
    recurring_display_mode: 'next_only' as string
  })
  const [checklistSaving, setChecklistSaving] = useState(false)
  const checklistSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [lastAddedChecklistItemId, setLastAddedChecklistItemId] = useState<string | null>(null)
  const [stepModalSaving, setStepModalSaving] = useState(false)
  const [showDeleteStepModal, setShowDeleteStepModal] = useState(false)
  const [isDeletingStep, setIsDeletingStep] = useState(false)
  const [habitModalSaving, setHabitModalSaving] = useState(false)
  const [showHabitModal, setShowHabitModal] = useState(false)
  const [habitModalData, setHabitModalData] = useState<any>(null)
  const [selectedDayDate, setSelectedDayDate] = useState<Date>(new Date()) // Currently displayed day in day view
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear()) // Currently displayed year in year view
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date()) // Currently displayed month in month view
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date()) // Currently displayed week in week view
  const [showDatePickerModal, setShowDatePickerModal] = useState<boolean>(false) // Show date picker modal for navigation
  const [expandedLeftSection, setExpandedLeftSection] = useState<null>(null) // Goals removed
  const [expandedRightSection, setExpandedRightSection] = useState<'habits' | 'steps' | null>(null)
  const [leftSectionHeights, setLeftSectionHeights] = useState({}) // Goals removed
  const [rightSectionHeights, setRightSectionHeights] = useState({ habits: 0, steps: 0 })
  const [leftSidebarWidth, setLeftSidebarWidth] = useState<'288px' | '48px' | '0px'>('288px')
  const [rightSidebarWidth, setRightSidebarWidth] = useState<'288px' | '48px' | '0px'>('288px')
  const [expandedAreas, setExpandedAreas] = useState<Set<string | null>>(new Set())
  // State for expanded goal status sections (paused/completed) per area
  const [expandedGoalSections, setExpandedGoalSections] = useState<Set<string>>(new Set()) // Format: "areaId-paused" or "areaId-completed"
  // State for expanded Focus section in sidebar
  const [pendingWorkflow, setPendingWorkflow] = useState<any>(null)
  
  // Auto-expand/collapse areas based on current page
  useEffect(() => {
    if (mainPanelSection?.startsWith('area-')) {
      // If we're on an area page, expand that area and collapse all others
      const areaId = mainPanelSection.replace('area-', '')
      setExpandedAreas(new Set([areaId]))
    } else if (mainPanelSection?.startsWith('goal-')) {
      // If we're on a goal page, check if the goal belongs to an area
      const goalId = mainPanelSection.replace('goal-', '')
      // Goals removed - no goal expansion logic
      if (false) {
        // Goal belongs to an area - expand that area and collapse all others
        setExpandedAreas(new Set([]))
      } else {
        // Goal doesn't belong to any area - collapse all areas
        setExpandedAreas(new Set())
      }
    } else {
      // If we're on any other page, collapse all areas
      setExpandedAreas(new Set())
    }
  }, [mainPanelSection])
  
  // Responsive logic
  useEffect(() => {
    const handleResize = () => {
      const availableWidth = window.innerWidth
      const minDisplayWidth = 430
      
      // Start with both sidebars maximized (288px)
      const sidebarsWidth = 288 + 288
      const margins = 40 // Left + right margins
      const availableForDisplay = availableWidth - sidebarsWidth - margins
      
      if (availableForDisplay >= minDisplayWidth) {
        // Both sidebars can stay maximized
        setLeftSidebarWidth('288px')
        setRightSidebarWidth('288px')
      } else {
        // Try with left minimized
        const leftMinWidth = 48
        const leftMinRightMaxDisplay = availableWidth - leftMinWidth - 288 - margins
        
        if (leftMinRightMaxDisplay >= minDisplayWidth) {
          // Left minimized, right maximized
          setLeftSidebarWidth('48px')
          setRightSidebarWidth('288px')
        } else {
          // Try with both minimized
          const bothMinDisplay = availableWidth - 48 - 48 - margins
          
          if (bothMinDisplay >= minDisplayWidth) {
            // Both minimized
            setLeftSidebarWidth('48px')
            setRightSidebarWidth('48px')
          } else {
            // Not enough space at all - hide everything
            setLeftSidebarWidth('0px')
            setRightSidebarWidth('0px')
          }
        }
      }
    }
    
    // Run immediately on mount
    handleResize()
    
    // Also listen for resize events
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, []) // Empty dependency array - only run on mount and resize
  
  // When sidebars are maximized, show all sections by default
  // expandedLeftSection and expandedRightSection will be managed by hover when minimized
  
  const habitsRef = useRef<HTMLDivElement>(null)
  const goalsRef = useRef<HTMLDivElement>(null)
  const stepsRef = useRef<HTMLDivElement>(null)
  
  const [sortedGoals, setSortedGoals] = useState<any[]>([])
  // Global cache for steps - persists across re-renders
  const stepsCacheRef = useRef<Record<string, { data: any[], loaded: boolean }>>({})
  // State to track cache updates for reactivity
  const [stepsCacheVersion, setStepsCacheVersion] = useState<Record<string, number>>({})
  const [showCreateGoal, setShowCreateGoal] = useState(false)
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    target_date: null,
    status: 'active',
    icon: 'Target',
    steps: [] as Array<{ id: string; title: string; description?: string; date?: string; isEditing?: boolean }>,
  })
  const [showGoalDatePicker, setShowGoalDatePicker] = useState(false)
  const [showStatusPicker, setShowStatusPicker] = useState(false)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [iconPickerPosition, setIconPickerPosition] = useState<{ top: number; left: number } | null>(null)
  const [iconPickerSearchQuery, setIconPickerSearchQuery] = useState('')
  const [datePickerButtonRef, setDatePickerButtonRef] = useState<HTMLButtonElement | null>(null)
  const [statusPickerButtonRef, setStatusPickerButtonRef] = useState<HTMLButtonElement | null>(null)
  const [iconPickerButtonRef, setIconPickerButtonRef] = useState<HTMLButtonElement | null>(null)
  const [datePickerPosition, setDatePickerPosition] = useState<{ top: number; left: number } | null>(null)
  const [statusPickerPosition, setStatusPickerPosition] = useState<{ top: number; left: number } | null>(null)
  // Goal detail page inline editing state
  const [editingGoalDetailTitle, setEditingGoalDetailTitle] = useState(false)
  const [editingGoalDetailDescription, setEditingGoalDetailDescription] = useState(false)
  const [goalDetailTitleValue, setGoalDetailTitleValue] = useState('')
  const [goalDetailDescriptionValue, setGoalDetailDescriptionValue] = useState('')
  const [showGoalDetailDatePicker, setShowGoalDetailDatePicker] = useState(false)
  const [goalDetailDatePickerPosition, setGoalDetailDatePickerPosition] = useState<{ top: number; left: number } | null>(null)
  const [goalDetailDatePickerMonth, setGoalDetailDatePickerMonth] = useState<Date>(new Date())
  const [selectedGoalDate, setSelectedGoalDate] = useState<Date | null>(null)
  const [showGoalDetailStartDatePicker, setShowGoalDetailStartDatePicker] = useState(false)
  const [goalDetailStartDatePickerPosition, setGoalDetailStartDatePickerPosition] = useState<{ top: number; left: number } | null>(null)
  const [goalDetailStartDatePickerMonth, setGoalDetailStartDatePickerMonth] = useState<Date>(new Date())
  const [selectedGoalStartDate, setSelectedGoalStartDate] = useState<Date | null>(null)
  const [showGoalDetailStatusPicker, setShowGoalDetailStatusPicker] = useState(false)
  const [goalDetailStatusPickerPosition, setGoalDetailStatusPickerPosition] = useState<{ top: number; left: number } | null>(null)
  const [expandedSidebarSections, setExpandedSidebarSections] = useState<Set<'paused' | 'completed'>>(new Set())
  const [showGoalDetailIconPicker, setShowGoalDetailIconPicker] = useState(false)
  const [goalDetailIconPickerPosition, setGoalDetailIconPickerPosition] = useState<{ top: number; left: number } | null>(null)
  const [iconSearchQuery, setIconSearchQuery] = useState('')
  const [showDeleteGoalModal, setShowDeleteGoalModal] = useState(false)
  const [deleteGoalWithSteps, setDeleteGoalWithSteps] = useState(false)
  const [isDeletingGoal, setIsDeletingGoal] = useState(false)
  const [showDeleteAreaModal, setShowDeleteAreaModal] = useState(false)
  const [areaToDelete, setAreaToDelete] = useState<string | null>(null)
  const [deleteAreaWithRelated, setDeleteAreaWithRelated] = useState(false)
  const [showDeleteHabitModal, setShowDeleteHabitModal] = useState(false)
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null)
  const [isDeletingHabit, setIsDeletingHabit] = useState(false)
  const [isDeletingArea, setIsDeletingArea] = useState(false)
  const [assistantMinimized, setAssistantMinimized] = useState(false)
  const [assistantSmallScreen, setAssistantSmallScreen] = useState(false)
  const [showCreateMenu, setShowCreateMenu] = useState(false)
  const createMenuButtonRef = useRef<HTMLButtonElement>(null)
  const createMenuRef = useRef<HTMLDivElement>(null)
  
  // Onboarding state
  const areaButtonRefs = useRef<Map<string, React.RefObject<HTMLButtonElement>>>(new Map())
  const goalButtonRefs = useRef<Map<string, React.RefObject<HTMLButtonElement>>>(new Map())
  const goalsSectionRef = useRef<HTMLDivElement>(null)
  
  // Areas state - must be declared before useEffect that uses it
  const [areas, setAreas] = useState<any[]>([])
  
  // Get selected area ID from mainPanelSection
  const selectedAreaId = mainPanelSection?.startsWith('area-') ? mainPanelSection.replace('area-', '') : null
  
  // Create refs for areas
  useEffect(() => {
    areas.forEach(area => {
      if (!areaButtonRefs.current.has(area.id)) {
        areaButtonRefs.current.set(area.id, { current: null } as React.RefObject<HTMLButtonElement>)
      }
    })
  }, [areas])

  // Create refs for goals
  // Goals removed - no goal button refs needed
  const [showGoalDetailAreaPicker, setShowGoalDetailAreaPicker] = useState(false)
  const [showAreasManagementModal, setShowAreasManagementModal] = useState(false)
  const [editingArea, setEditingArea] = useState<any | null>(null)
  const [showAreaEditModal, setShowAreaEditModal] = useState(false)
  const [areaModalName, setAreaModalName] = useState('')
  const [areaModalDescription, setAreaModalDescription] = useState('')
  const [areaModalColor, setAreaModalColor] = useState('#ea580c')
  const [areaModalIcon, setAreaModalIcon] = useState('LayoutDashboard')
  const [isSavingArea, setIsSavingArea] = useState(false)
  const [showAreaIconPicker, setShowAreaIconPicker] = useState(false)
  const [goalDetailAreaPickerPosition, setGoalDetailAreaPickerPosition] = useState<{ top: number; left: number } | null>(null)
  const goalAreaRef = useRef<HTMLButtonElement>(null)
  
  // Area detail page inline editing state
  const [editingAreaDetailTitle, setEditingAreaDetailTitle] = useState(false)
  const [areaDetailTitleValue, setAreaDetailTitleValue] = useState('')
  const [editingAreaDetailDescription, setEditingAreaDetailDescription] = useState(false)
  const [areaDetailDescriptionValue, setAreaDetailDescriptionValue] = useState('')
  const [showAreaDetailIconPicker, setShowAreaDetailIconPicker] = useState(false)
  const [areaDetailIconPickerPosition, setAreaDetailIconPickerPosition] = useState<{ top: number; left: number } | null>(null)
  const [showAreaDetailColorPicker, setShowAreaDetailColorPicker] = useState(false)
  const [areaDetailColorPickerPosition, setAreaDetailColorPickerPosition] = useState<{ top: number; left: number } | null>(null)
  const areaIconRef = useRef<HTMLSpanElement>(null)
  const areaTitleRef = useRef<HTMLHeadingElement>(null)
  const areaDescriptionRef = useRef<HTMLParagraphElement>(null)
  const areaColorRef = useRef<HTMLButtonElement>(null)
  
  // Load areas
  useEffect(() => {
    const loadAreas = async () => {
      const currentUserId = userId || player?.user_id
      if (!currentUserId) return
      
      try {
        const response = await fetch(`/api/cesta/areas?userId=${currentUserId}`)
        if (response.ok) {
          const data = await response.json()
          setAreas(data.areas || [])
        }
      } catch (error) {
        console.error('Error loading areas:', error)
      }
    }
    
    loadAreas()
  }, [userId, player?.user_id])
  const goalTitleRef = useRef<HTMLInputElement | HTMLHeadingElement>(null)
  const goalDescriptionRef = useRef<HTMLTextAreaElement | HTMLParagraphElement>(null)
  const goalDateRef = useRef<HTMLSpanElement>(null)
  const goalStartDateRef = useRef<HTMLSpanElement>(null)
  const goalStatusRef = useRef<HTMLButtonElement>(null)
  const goalIconRef = useRef<HTMLSpanElement>(null)
  const [showCreateStep, setShowCreateStep] = useState(false)
  const [newStep, setNewStep] = useState({
    title: '',
    description: '',
    goalId: null,
    isImportant: false,
    isUrgent: false,
    estimatedTime: 30,
    xpReward: 1,
    date: getLocalDateString() // Default to today
  })
  
  // Filters for steps page
  const [stepsShowCompleted, setStepsShowCompleted] = useState(false)
  const [stepsDateFilter, setStepsDateFilter] = useState<'all' | 'overdue' | 'today' | 'future'>('all')
  const [stepsGoalFilter, setStepsGoalFilter] = useState<string | null>(null)
  
  // Goals filters
  const [goalsStatusFilter, setGoalsStatusFilter] = useState<'all' | 'active' | 'completed' | 'paused'>('all')
  
  // Track which step's goal picker is open
  const [openGoalPickerForStep, setOpenGoalPickerForStep] = useState<string | null>(null)
  
  // Quick edit modals for goals
  const [quickEditGoalId, setQuickEditGoalId] = useState<string | null>(null)
  const [quickEditGoalField, setQuickEditGoalField] = useState<'status' | 'date' | null>(null)
  const [quickEditGoalPosition, setQuickEditGoalPosition] = useState<{ top: number; left: number } | null>(null)
  
  // Initialize date value when date modal opens
  useEffect(() => {
    if (quickEditGoalField === 'date' && quickEditGoalId) {
      // Goals removed - no goal quick edit
      if (false) {
        const initialDate = new Date()
        setSelectedDateForGoal(initialDate)
      }
    }
  }, [quickEditGoalField, quickEditGoalId])
  
  // Track which step's tag modals are open
  const [openTimeModalForStep, setOpenTimeModalForStep] = useState<string | null>(null)
  const [openDateModalForStep, setOpenDateModalForStep] = useState<string | null>(null)
  const [openImportantModalForStep, setOpenImportantModalForStep] = useState<string | null>(null)
  const [openUrgentModalForStep, setOpenUrgentModalForStep] = useState<string | null>(null)
  
  // Temporary values for tag modals
  const [tempTimeValue, setTempTimeValue] = useState<number>(0)
  const [tempDateValue, setTempDateValue] = useState<string>('')
  const [selectedDateForStep, setSelectedDateForStep] = useState<Date>(new Date())
  const [selectedDateForGoal, setSelectedDateForGoal] = useState<Date>(new Date())
  
  // Refs for tag elements to calculate modal positions
  const timeTagRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const dateTagRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const goalTagRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  
  // Modal positions
  const [timeModalPosition, setTimeModalPosition] = useState<{ top: number; left: number } | null>(null)
  const [dateModalPosition, setDateModalPosition] = useState<{ top: number; left: number } | null>(null)
  const [goalModalPosition, setGoalModalPosition] = useState<{ top: number; left: number } | null>(null)
  
  // Steps view mode: 'kanban' or 'list'
  const [stepsViewMode, setStepsViewMode] = useState<'kanban' | 'list'>('kanban')

  // Calculate dropdown positions when they open
  useLayoutEffect(() => {
    if (showGoalDatePicker && datePickerButtonRef) {
      const rect = datePickerButtonRef.getBoundingClientRect()
      // rect.bottom zahrnuje border, takže odečteme border šířku (2px) aby se dropdown dotýkal tlačítka
      setDatePickerPosition({
        top: rect.bottom - 2,
        left: rect.left
      })
    } else {
      setDatePickerPosition(null)
    }
  }, [showGoalDatePicker, datePickerButtonRef])

  useLayoutEffect(() => {
    if (showStatusPicker && statusPickerButtonRef) {
      const rect = statusPickerButtonRef.getBoundingClientRect()
      // rect.bottom zahrnuje border, takže odečteme border šířku (2px) aby se dropdown dotýkal tlačítka
      setStatusPickerPosition({
        top: rect.bottom - 2,
        left: rect.left
      })
    } else {
      setStatusPickerPosition(null)
    }
  }, [showStatusPicker, statusPickerButtonRef])

  const handleCharacterClick = () => {
    // Cycle through different display modes
    const modes = ['character', 'progress', 'motivation', 'stats', 'dialogue'] as const
    const currentIndex = modes.indexOf(displayMode)
    const nextIndex = (currentIndex + 1) % modes.length
    setDisplayMode(modes[nextIndex])
  }

  const handleItemClick = (item: any, type: 'step' | 'habit' | 'goal' | 'stat') => {
    if (type === 'step') {
      handleOpenStepModal(undefined, item)
    } else if (type === 'habit') {
      handleOpenHabitModal(item)
    } else {
      // For goals and stats, keep old behavior
      setSelectedItem(item)
      setSelectedItemType(type)
    }
  }

  const handleCloseDetail = () => {
    setSelectedItem(null)
    setSelectedItemType(null)
    // Stay in current program, don't change displayMode
  }

  const handleHabitCalendarToggle = async (habitId: string, date: string, currentState: 'completed' | 'missed' | 'planned' | 'not-scheduled' | 'today', isScheduled: boolean) => {
    // Create loading key for this specific habit-day combination
    const loadingKey = `${habitId}-${date}`
    
    // Prevent duplicate requests - check both ref and state
    if (loadingHabitsRef.current.has(loadingKey) || loadingHabits.has(loadingKey)) {
      return
    }
    
    // Find the habit in current habits array to get actual current state
    const habit = habits.find((h: any) => h.id === habitId)
    if (!habit) {
      console.error('Habit not found:', habitId)
      return
    }
    
    // Get actual current completion state from habit_completions
    const habitCompletions = habit.habit_completions || {}
    const isCurrentlyCompleted = habitCompletions[date] === true
    
    // Simple toggle: if completed, uncomplete; if not completed, complete
    const newState = !isCurrentlyCompleted
    
    // Set loading state IMMEDIATELY and synchronously
    loadingHabitsRef.current.add(loadingKey)
    setLoadingHabits(prev => {
      if (prev.has(loadingKey)) return prev
      const newSet = new Set(prev)
      newSet.add(loadingKey)
      return newSet
    })
    
    try {
      // Send API request
      const response = await fetch('/api/habits/calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          habitId,
          date,
          completed: newState
        }),
      })
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      const result = await response.json()
      
      // Use habits returned from API if available (avoids cache issues)
      if (result.habits && Array.isArray(result.habits)) {
        // API returned all habits directly - use them
        if (onHabitsUpdate) {
          onHabitsUpdate(result.habits)
        }
        
        // Update habit modal data if it's the same habit
        if (habitModalData && habitModalData.id === habitId) {
          const freshHabit = result.habits.find((h: any) => h.id === habitId)
          if (freshHabit) {
            setHabitModalData(freshHabit)
          }
        }
        
        // Update selected item if it's the same habit
        if (selectedItem && selectedItem.id === habitId) {
          const freshHabit = result.habits.find((h: any) => h.id === habitId)
          if (freshHabit) {
            setSelectedItem({
              ...selectedItem,
              habit_completions: freshHabit.habit_completions || {}
            })
          }
        }
      } else {
        // Fallback: Refresh ALL habits from server with cache-busting
        if (onHabitsUpdate) {
          const cacheBuster = Date.now()
          const habitsResponse = await fetch(`/api/habits?t=${cacheBuster}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache'
            }
          })
          if (habitsResponse.ok) {
            const updatedHabits = await habitsResponse.json()
            onHabitsUpdate(updatedHabits)
            
            // Update habit modal data if it's the same habit
            if (habitModalData && habitModalData.id === habitId) {
              const freshHabit = updatedHabits.find((h: any) => h.id === habitId)
              if (freshHabit) {
                setHabitModalData(freshHabit)
          }
        }
        
        // Update selected item if it's the same habit
        if (selectedItem && selectedItem.id === habitId) {
              const freshHabit = updatedHabits.find((h: any) => h.id === habitId)
              if (freshHabit) {
          setSelectedItem({
            ...selectedItem,
                  habit_completions: freshHabit.habit_completions || {}
          })
        }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error updating habit calendar:', error)
      // On error, refresh habits anyway to get current state (with cache-busting)
      if (onHabitsUpdate) {
        try {
          const cacheBuster = Date.now()
          const habitsResponse = await fetch(`/api/habits?t=${cacheBuster}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache'
            }
          })
          if (habitsResponse.ok) {
            const updatedHabits = await habitsResponse.json()
            onHabitsUpdate(updatedHabits)
          }
        } catch (fetchError) {
          console.error('Error fetching habits after error:', fetchError)
        }
      }
    } finally {
      // ALWAYS remove from loading set - use both ref and state
      loadingHabitsRef.current.delete(loadingKey)
      setLoadingHabits(prev => {
        if (!prev.has(loadingKey)) return prev
        const newSet = new Set(prev)
        newSet.delete(loadingKey)
        return newSet
      })
    }
  }

  const handleStepToggle = async (stepId: string, completed: boolean, completionDate?: string) => {
    // Check if we're on goal detail page or in Focus section
    const isGoalDetailPage = false // Goals removed
    const isFocusSection = mainPanelSection === 'overview'
    const step = dailySteps.find(s => s.id === stepId)
    const wasCompleted = step?.completed || false
    const isAnimating = animatingSteps.has(stepId)
    
    // If toggling a step (completing or uncompleting) on goal detail page or in Focus section, start animation first
    if ((completed !== wasCompleted) && !isAnimating && (isGoalDetailPage || isFocusSection)) {
      // Add to animating set
      setAnimatingSteps(prev => new Set(prev).add(stepId))
      
      // Optimistically update the step locally for immediate visual feedback
      if (step) {
        const optimisticStep = { ...step, completed: completed }
        const updatedSteps = dailySteps.map(s => s.id === stepId ? optimisticStep : s)
        if (onDailyStepsUpdate) {
          onDailyStepsUpdate(updatedSteps)
        }
        // Update cache for the goal to force re-render (only if on goal detail page)
        if (step.goal_id && isGoalDetailPage) {
          // Update cache directly
          if (stepsCacheRef.current[step.goal_id]) {
            stepsCacheRef.current[step.goal_id].data = stepsCacheRef.current[step.goal_id].data.map(
              (s: any) => s.id === stepId ? optimisticStep : s
            )
          }
          // Invalidate cache version to trigger re-render
          setStepsCacheVersion(prev => ({
            ...prev,
            [step.goal_id]: (prev[step.goal_id] || 0) + 1
          }))
        }
      }
      
      // Wait for animation (0.3s) before making API call
      setTimeout(async () => {
        // Remove from animating set
        setAnimatingSteps(prev => {
          const newSet = new Set(prev)
          newSet.delete(stepId)
          return newSet
        })
        
    // Add to loading set
    setLoadingSteps(prev => new Set(prev).add(stepId))
    
    try {
      const response = await fetch('/api/daily-steps', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stepId: stepId,
          completed: completed,
          completedAt: completed ? new Date().toISOString() : null,
          completionDate: completionDate || undefined
        }),
      })

      if (response.ok) {
        const responseData = await response.json()
        const updatedStep = responseData.goal ? responseData : responseData // Handle both formats
        // Update the step in dailySteps array
        const updatedSteps = dailySteps.map(step => 
          step.id === updatedStep.id ? updatedStep : step
        )
        if (onDailyStepsUpdate) {
          onDailyStepsUpdate(updatedSteps)
        }
        // Update selected item if it's the same step
        if (selectedItem && selectedItem.id === stepId) {
          setSelectedItem(updatedStep)
        }
        // Goals removed - no goal updates
            // Cache update removed - steps are now linked to areas, not goals
            if (false) { // Disabled - goals removed
              // Update cache directly
              if (false) {
                stepsCacheRef.current[updatedStep.goal_id].data = stepsCacheRef.current[updatedStep.goal_id].data.map(
                  (s: any) => s.id === updatedStep.id ? updatedStep : s
                )
              }
              // Invalidate cache version to trigger re-render
              setStepsCacheVersion(prev => ({
                ...prev,
                [updatedStep.goal_id]: (prev[updatedStep.goal_id] || 0) + 1
              }))
        }
      } else {
        console.error('Failed to update step')
            // Revert optimistic update on error
            if (step) {
              const revertedStep = { ...step, completed: false }
              const updatedSteps = dailySteps.map(s => s.id === stepId ? revertedStep : s)
              if (onDailyStepsUpdate) {
                onDailyStepsUpdate(updatedSteps)
              }
            }
        alert('Nepodařilo se aktualizovat krok')
      }
    } catch (error) {
      console.error('Error updating step:', error)
            // Revert optimistic update on error
            if (step) {
              const revertedStep = { ...step, completed: !completed }
              const updatedSteps = dailySteps.map(s => s.id === stepId ? revertedStep : s)
              if (onDailyStepsUpdate) {
                onDailyStepsUpdate(updatedSteps)
              }
            }
      alert('Chyba při aktualizaci kroku')
    } finally {
      // Remove from loading set
      setLoadingSteps(prev => {
        const newSet = new Set(prev)
        newSet.delete(stepId)
        return newSet
      })
        }
      }, 300) // 0.3s animation delay
    } else {
      // For uncompleting or non-goal-detail toggles, do immediate update
      // Add to loading set
      setLoadingSteps(prev => new Set(prev).add(stepId))
      
      try {
        // Check if this is a recurring step or instance
        const step = dailySteps.find(s => s.id === stepId)
        const isRecurring = step?.frequency && step.frequency !== null
        // Instances have parent_recurring_step_id set
        const isInstance = step?.parent_recurring_step_id !== null && step?.parent_recurring_step_id !== undefined
        
        // For recurring steps or instances, use completionDate instead of completedAt
        const requestBody: any = {
          stepId: stepId,
          completed: completed
        }
        
        if (completed) {
          if (isRecurring || isInstance) {
            // Use completionDate for recurring steps (YYYY-MM-DD format)
            // Use provided completionDate if available, otherwise use today
            const completionDateValue = completionDate || getLocalDateString(new Date())
            requestBody.completionDate = completionDateValue
          } else {
            // Use completedAt for regular steps (ISO string)
            requestBody.completedAt = new Date().toISOString()
          }
        } else {
          requestBody.completedAt = null
        }
        
        const response = await fetch('/api/daily-steps', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        })

          if (response.ok) {
            const updatedStep = await response.json()
            
            // If this was a recurring step or instance, reload all steps to get the newly created instance
            if (completed && (isRecurring || isInstance)) {
              // Reload all steps to get the newly created instance
              const currentUserId = userId || player?.user_id
              if (currentUserId && onDailyStepsUpdate) {
                const reloadResponse = await fetch(`/api/daily-steps?userId=${currentUserId}`)
                if (reloadResponse.ok) {
                  const allSteps = await reloadResponse.json()
                  onDailyStepsUpdate(Array.isArray(allSteps) ? allSteps : [])
                } else {
                  // Fallback: update only the completed step
                  const updatedSteps = dailySteps.map(step => 
                    step.id === updatedStep.id ? updatedStep : step
                  )
                  onDailyStepsUpdate(updatedSteps)
                }
              } else {
                // Fallback: update only the completed step
                const updatedSteps = dailySteps.map(step => 
                  step.id === updatedStep.id ? updatedStep : step
                )
                if (onDailyStepsUpdate) {
                  onDailyStepsUpdate(updatedSteps)
                }
              }
            } else {
              // For non-recurring steps, just update the step in the array
              const updatedSteps = dailySteps.map(step => 
                step.id === updatedStep.id ? updatedStep : step
              )
              if (onDailyStepsUpdate) {
                onDailyStepsUpdate(updatedSteps)
              }
            }
            // Update selected item if it's the same step
            if (selectedItem && selectedItem.id === stepId) {
              setSelectedItem(updatedStep)
            }
            // Update cache for the goal to force re-render (only if on goal detail page)
            if (updatedStep.goal_id && isGoalDetailPage) {
              // Update cache directly
              if (stepsCacheRef.current[updatedStep.goal_id]) {
                stepsCacheRef.current[updatedStep.goal_id].data = stepsCacheRef.current[updatedStep.goal_id].data.map(
                  (s: any) => s.id === updatedStep.id ? updatedStep : s
                )
              }
              // Invalidate cache version to trigger re-render
              setStepsCacheVersion(prev => ({
                ...prev,
                [updatedStep.goal_id]: (prev[updatedStep.goal_id] || 0) + 1
              }))
            }
          } else {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
            console.error('Failed to update step:', errorData)
            console.error('Response status:', response.status)
            alert(`Nepodařilo se aktualizovat krok: ${errorData.error || errorData.details || 'Neznámá chyba'}`)
          }
      } catch (error) {
        console.error('Error updating step:', error)
        alert('Chyba při aktualizaci kroku')
      } finally {
        // Remove from loading set
        setLoadingSteps(prev => {
          const newSet = new Set(prev)
          newSet.delete(stepId)
          return newSet
        })
      }
    }
  }

  // Auto-cycle display mode
  useEffect(() => {
    const interval = setInterval(() => {
      const modes = ['character', 'progress', 'motivation', 'stats', 'dialogue'] as const
      const currentIndex = modes.indexOf(displayMode)
      const nextIndex = (currentIndex + 1) % modes.length
      setDisplayMode(modes[nextIndex])
    }, 8000) // Change every 8 seconds

    return () => clearInterval(interval)
  }, [displayMode])

  // Measure heights of expanded sections on first load
  useEffect(() => {
    const timer = setTimeout(() => {
      if (goalsRef.current) {
        const height = goalsRef.current.scrollHeight
        setLeftSectionHeights(prev => ({ ...prev, goals: height }))
      }
      if (habitsRef.current) {
        const height = habitsRef.current.scrollHeight
        setRightSectionHeights(prev => ({ ...prev, habits: height }))
      }
      if (stepsRef.current) {
        const height = stepsRef.current.scrollHeight
        setRightSectionHeights(prev => ({ ...prev, steps: height }))
      }
    }, 100)
    
    return () => clearTimeout(timer)
  }, [habits, dailySteps])


  // Also measure when sections expand
  useEffect(() => {
    // Goals removed - no goals section height calculation
    if (habitsRef.current && expandedRightSection === 'habits') {
      const height = habitsRef.current.scrollHeight
      setRightSectionHeights(prev => ({ ...prev, habits: height }))
    }
    if (stepsRef.current && expandedRightSection === 'steps') {
      const height = stepsRef.current.scrollHeight
      setRightSectionHeights(prev => ({ ...prev, steps: height }))
    }
  }, [expandedLeftSection, expandedRightSection])

  // Click outside handler for editing steps
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      
      // Check if click is outside any editing step form
      const isEditingStep = newGoal.steps.some(s => s.isEditing)
      
      if (isEditingStep) {
        const stepElements = document.querySelectorAll('[data-step-id]')
        
        let clickedInside = false
        
        stepElements.forEach(el => {
          if (el.contains(target)) {
            clickedInside = true
          }
        })
        
        if (!clickedInside) {
          // Close all editing forms
          setNewGoal(prev => ({
            ...prev,
            steps: prev.steps.map(s => ({ ...s, isEditing: false }))
          }))
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [newGoal.steps])

  const initializeEditingGoal = (goal: any, options?: { autoAddStep?: boolean }) => {
    setEditingGoal({
      ...goal,
      title: goal.title || '',
      description: goal.description || '',
      target_date: goal.target_date || null,
      status: goal.status || 'active',
      autoAddStep: options?.autoAddStep || false
    })
  }

  const getMotivationalDialogue = () => {
    const dialogues = [
      "Každý den je nová příležitost k růstu!",
      "Malé kroky vedou k velkým změnám.",
      "Ty máš sílu dosáhnout svých cílů!",
      "Dnes je skvělý den pro pokrok!",
      "Věř si a pokračuj v cestě!",
      "Každý úspěch začíná rozhodnutím zkusit to."
    ]
    return dialogues[Math.floor(Math.random() * dialogues.length)]
  }

  const [editingStepTitle, setEditingStepTitle] = useState(false)
  const [stepTitle, setStepTitle] = useState('')
  const [stepDescription, setStepDescription] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [showTimeEditor, setShowTimeEditor] = useState(false)
  const [stepEstimatedTime, setStepEstimatedTime] = useState<number>(0)
  // XP is always 1, not editable
  const [stepXpReward] = useState<number>(1)
  const [stepIsImportant, setStepIsImportant] = useState<boolean>(false)
  const [stepIsUrgent, setStepIsUrgent] = useState<boolean>(false)
  const [stepGoalId, setStepGoalId] = useState<string | null>(null)
  const [showStepGoalPicker, setShowStepGoalPicker] = useState(false)
  const [stepDeadline, setStepDeadline] = useState<string>('')

  // Habit detail tabs
  const [habitDetailTab, setHabitDetailTab] = useState<'calendar' | 'settings'>('calendar')
  const [editingHabitName, setEditingHabitName] = useState<string>('')
  const [editingHabitDescription, setEditingHabitDescription] = useState<string>('')
  const [editingHabitFrequency, setEditingHabitFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [editingHabitSelectedDays, setEditingHabitSelectedDays] = useState<string[]>([])
  const [editingHabitMonthWeek, setEditingHabitMonthWeek] = useState<string>('')
  const [editingHabitMonthDay, setEditingHabitMonthDay] = useState<string>('')
  const [editingHabitMonthlyType, setEditingHabitMonthlyType] = useState<'specificDays' | 'weekdayInMonth'>('specificDays')
  const [editingHabitWeekdayInMonthSelections, setEditingHabitWeekdayInMonthSelections] = useState<Array<{week: string, day: string}>>([])
  const [editingHabitAutoAdjust31, setEditingHabitAutoAdjust31] = useState<boolean>(true)
  const [editingHabitAreaId, setEditingHabitAreaId] = useState<string | null>(null)
  const [editingHabitCategory, setEditingHabitCategory] = useState<string>('')
  const [editingHabitDifficulty, setEditingHabitDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [editingHabitReminderTime, setEditingHabitReminderTime] = useState<string>('')
  const [editingHabitNotificationEnabled, setEditingHabitNotificationEnabled] = useState<boolean>(false)
  const [editingHabitIcon, setEditingHabitIcon] = useState<string>('Target')

  // Goal editing states
  const [goalTitle, setGoalTitle] = useState('')
  const [goalDescription, setGoalDescription] = useState('')
  const [goalDate, setGoalDate] = useState('')
  const [goalStatus, setGoalStatus] = useState('')
  const [showGoalStatusEditor, setShowGoalStatusEditor] = useState(false)
  
  // Drag & drop state
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  
  // Loading states for toggles
  const [loadingSteps, setLoadingSteps] = useState<Set<string>>(new Set())
  const [animatingSteps, setAnimatingSteps] = useState<Set<string>>(new Set()) // Steps currently animating completion
  const [loadingHabits, setLoadingHabits] = useState<Set<string>>(new Set())
  // Use ref for synchronous loading check to prevent race conditions
  const loadingHabitsRef = useRef<Set<string>>(new Set())
  
  // State for habit detail page timeline (per habit ID)
  const [habitTimelineOffsets, setHabitTimelineOffsets] = useState<Record<string, number>>({})
  const [habitVisibleDaysMap, setHabitVisibleDaysMap] = useState<Record<string, number>>({})
  
  // Hooks for habits page timeline (must be at top level)
  const habitsPageTimelineContainerRef = useRef<HTMLDivElement>(null)
  const [habitsPageVisibleDays, setHabitsPageVisibleDays] = useState(20)
  const [habitsPageTimelineOffset, setHabitsPageTimelineOffset] = useState(0)
  
  // Calculate visible days for habits page timeline
  useEffect(() => {
    const calculateVisibleDays = () => {
      if (habitsPageTimelineContainerRef.current) {
        const containerWidth = habitsPageTimelineContainerRef.current.offsetWidth
        // Each day is 32px wide + 4px gap (gap-1) = 36px total per day
        // Subtract space for habit name column (190px) + gap (8px) = 198px
        const availableWidth = containerWidth - 198
        const daysThatFit = Math.floor(availableWidth / 36)
        const newVisibleDays = Math.max(7, daysThatFit)
        setHabitsPageVisibleDays(newVisibleDays)
      }
    }
    
    // Only calculate if we're on habits page
    if (mainPanelSection === 'habits') {
      // Use requestAnimationFrame to ensure DOM is rendered
      const timeoutId = setTimeout(() => {
        calculateVisibleDays()
      }, 0)
      
      // Also calculate on resize
      window.addEventListener('resize', calculateVisibleDays)
      
      return () => {
        clearTimeout(timeoutId)
        window.removeEventListener('resize', calculateVisibleDays)
      }
    }
  }, [mainPanelSection])

  useEffect(() => {
    if (selectedItem && selectedItemType === 'step') {
      // Check if this is a new step (placeholder)
      const isNewStep = selectedItem.id === 'new-step'
      setStepTitle(isNewStep ? t('details.step.newStep') : (selectedItem.title || ''))
      setStepDescription(selectedItem.description || '')
      setEditingStepTitle(isNewStep) // Start editing for new steps
      // For new steps, ensure we use getLocalDateString() if date is missing
      // For existing steps, normalize the date from the database
      if (isNewStep) {
        setSelectedDate(selectedItem.date || getLocalDateString())
      } else {
        // Normalize date from database to ensure correct format
        // API should return date as YYYY-MM-DD string - use it directly
        const dateValue = selectedItem.date
        if (dateValue) {
          // If it's already a YYYY-MM-DD string, use it directly (API normalizes it)
          if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
            setSelectedDate(dateValue)
          } else {
            // Date object or other format - normalize using local date components
            // But try to extract YYYY-MM-DD from ISO string first
            if (typeof dateValue === 'string' && dateValue.includes('T')) {
              const datePart = dateValue.split('T')[0]
              if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
                setSelectedDate(datePart)
              } else {
                setSelectedDate(getLocalDateString(new Date(dateValue)))
              }
            } else {
              setSelectedDate(getLocalDateString(new Date(dateValue)))
            }
          }
        } else {
          setSelectedDate('')
        }
      }
      setShowDatePicker(false)
      setShowTimeEditor(false)
      setStepEstimatedTime(selectedItem.estimated_time || 0)
      // XP is always 1, not editable
      setStepIsImportant(selectedItem.is_important || false)
      setStepIsUrgent(selectedItem.is_urgent || false)
      setStepGoalId(selectedItem.goal_id || null)
      setStepDeadline(selectedItem.deadline ? (typeof selectedItem.deadline === 'string' ? selectedItem.deadline.split('T')[0] : new Date(selectedItem.deadline).toISOString().split('T')[0]) : '')
    }
    
    if (selectedItem && selectedItemType === 'goal') {
      setGoalTitle(selectedItem.title || '')
      setGoalDescription(selectedItem.description || '')
      setGoalDate(selectedItem.target_date || '')
      setShowGoalDatePicker(false)
      setShowGoalStatusEditor(false)
      setGoalStatus(selectedItem.status || 'active')
    }
    
    if (selectedItem && selectedItemType === 'habit') {
      setEditingHabitName(selectedItem.name || '')
      setEditingHabitDescription(selectedItem.description || '')
      setEditingHabitFrequency(selectedItem.frequency || 'daily')
      setEditingHabitSelectedDays(selectedItem.selected_days || [])
      setEditingHabitCategory(selectedItem.category || '')
      setEditingHabitDifficulty(selectedItem.difficulty || 'medium')
      setEditingHabitReminderTime(selectedItem.reminder_time || '')
    }
  }, [selectedItem, selectedItemType, t])

  // Handle step modal
  const handleOpenStepModal = (date?: string, step?: any) => {
    // Handle case where step is passed as first parameter (from StepsManagementView)
    if (date && typeof date === 'object' && !step) {
      step = date
      date = undefined
    }
    
    if (step) {
      // Open existing step for editing - always use modal for editing
      const stepDate = step.date ? (typeof step.date === 'string' && step.date.match(/^\d{4}-\d{2}-\d{2}$/) ? step.date : step.date.split('T')[0]) : getLocalDateString(selectedDayDate)
      
      // If step has goal but no area, get area from goal
      let stepAreaId = step.area_id || ''
      if (step.goal_id && !stepAreaId) {
        // Goals removed - no goal lookup needed
        if (false) {
          stepAreaId = ''
        }
      }
      
      setStepModalData({
        id: step.id,
        title: step.title || '',
        description: step.description || '',
        date: stepDate,
        areaId: stepAreaId,
        completed: step.completed || false,
        is_important: step.is_important || false,
        is_urgent: step.is_urgent || false,
        deadline: step.deadline ? (typeof step.deadline === 'string' ? step.deadline.split('T')[0] : new Date(step.deadline).toISOString().split('T')[0]) : '',
        estimated_time: step.estimated_time || 0,
        checklist: step.checklist || [],
        require_checklist_complete: step.require_checklist_complete || false,
        isRepeating: !!(step.frequency && step.frequency !== null),
        frequency: step.frequency || null,
        selected_days: step.selected_days || [],
        recurring_start_date: step.recurring_start_date || null,
        recurring_end_date: step.recurring_end_date || null,
        recurring_display_mode: step.recurring_display_mode || 'all'
      })
      setShowStepModal(true)
    } else {
      // Create new step - always use today's date as default
      const defaultDate = date || getLocalDateString(new Date())
      
      // Check if we're creating step from an area
      let defaultAreaId = ''
      if (mainPanelSection?.startsWith('area-')) {
        // Check if we're on an area page and should assign the step to that area
        defaultAreaId = mainPanelSection.replace('area-', '')
      }
      
        setStepModalData({
          id: null,
          title: '',
          description: '',
          date: defaultDate,
          areaId: defaultAreaId,
          completed: false,
          is_important: false,
          is_urgent: false,
          deadline: '',
          estimated_time: 0,
          checklist: [],
          require_checklist_complete: false,
          isRepeating: false,
          frequency: null,
          selected_days: [],
          recurring_start_date: null,
          recurring_end_date: null,
          recurring_display_mode: 'next_only'
        })
        setShowStepModal(true)
    }
  }

  // Handle step modal save
  const handleSaveStepModal = async () => {
    if (!stepModalData.title.trim()) {
      alert('Název kroku je povinný')
      return
    }

    const currentUserId = userId || player?.user_id
    if (!currentUserId) {
      alert('Uživatel není nalezen')
      return
    }

    setStepModalSaving(true)
    try {
      const isNewStep = !stepModalData.id
      
      // Determine areaId - required
      let finalAreaId = (stepModalData.areaId && stepModalData.areaId.trim() !== '') ? stepModalData.areaId : null
      
      // Validate areaId is provided
      if (!finalAreaId) {
        alert('Oblast je povinná')
        setStepModalSaving(false)
        return
      }
      
      // Ensure date is always a string (YYYY-MM-DD) or null
      let dateValue: string | null = null
      if (!stepModalData.isRepeating) {
        if (stepModalData.date) {
          if (stepModalData.date && typeof stepModalData.date === 'string') {
            dateValue = stepModalData.date
          } else {
            dateValue = getLocalDateString(new Date())
          }
        } else {
          dateValue = getLocalDateString(new Date())
        }
      }
      
      const requestBody = {
        ...(isNewStep ? {} : { stepId: stepModalData.id }),
        userId: currentUserId,
        areaId: finalAreaId,
        title: stepModalData.title,
        description: stepModalData.description || '',
        date: dateValue,
        isImportant: stepModalData.is_important,
        isUrgent: stepModalData.is_urgent,
        estimatedTime: stepModalData.estimated_time,
        checklist: stepModalData.checklist,
        requireChecklistComplete: stepModalData.require_checklist_complete,
        frequency: stepModalData.isRepeating ? (stepModalData.frequency || null) : null,
        selectedDays: stepModalData.isRepeating ? (stepModalData.selected_days || []) : [],
        recurringStartDate: stepModalData.isRepeating ? (stepModalData.recurring_start_date || null) : null,
        recurringEndDate: stepModalData.isRepeating ? (stepModalData.recurring_end_date || null) : null,
        recurringDisplayMode: stepModalData.isRepeating ? (stepModalData.recurring_display_mode || 'all') : 'all'
      }
      
      console.log('🚀 Saving step:', {
        isNewStep,
        stepId: stepModalData.id,
        stepModalData: {
          areaId: stepModalData.areaId,
          title: stepModalData.title
        },
        requestBody: {
          areaId: requestBody.areaId,
          stepId: requestBody.stepId
        }
      })
      
      const response = await fetch('/api/daily-steps', {
        method: isNewStep ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        const updatedStep = await response.json()
        
        // If this was a recurring step, reload all steps to get the instance
        if (isNewStep && updatedStep.frequency && updatedStep.frequency !== null) {
          // Reload all steps to get the newly created instance
          const reloadResponse = await fetch(`/api/daily-steps?userId=${currentUserId}`)
          if (reloadResponse.ok) {
            const allSteps = await reloadResponse.json()
            if (onDailyStepsUpdate) {
              onDailyStepsUpdate(Array.isArray(allSteps) ? allSteps : [])
            }
          }
        } else if (isNewStep) {
          // For new steps (including duplicates), reload all steps to ensure consistency
          // This ensures the new step appears in the list even if it's outside the current date range
          // Use the same date range as initial load to ensure consistency
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const veryOldDate = new Date(today)
          veryOldDate.setFullYear(veryOldDate.getFullYear() - 10)
          const endDate = new Date(today)
          endDate.setDate(endDate.getDate() + 30)
          
          const reloadResponse = await fetch(
            `/api/daily-steps?userId=${currentUserId}&startDate=${veryOldDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`
          )
          if (reloadResponse.ok) {
            const allSteps = await reloadResponse.json()
            if (onDailyStepsUpdate) {
              onDailyStepsUpdate(Array.isArray(allSteps) ? allSteps : [])
            }
          } else {
            // Fallback: add the step to the current list
            if (onDailyStepsUpdate) {
              onDailyStepsUpdate([...dailySteps, updatedStep])
            }
          }
        } else {
          // Update existing step
          if (onDailyStepsUpdate) {
            const updatedSteps = dailySteps.map(step => 
              step.id === updatedStep.id ? updatedStep : step
            )
            onDailyStepsUpdate(updatedSteps)
          }
        }
        
        // Cache update removed - steps are now linked to areas, not goals
        
        // Dispatch custom event when step is created (for important steps planning)
        if (isNewStep && updatedStep) {
          window.dispatchEvent(new CustomEvent('stepCreated', { detail: { stepId: updatedStep.id, date: updatedStep.date } }))
        }
        
        // Close modal after successful save
        setShowStepModal(false)
        setStepModalData({
          id: null,
          title: '',
          description: '',
          date: '',
          areaId: '',
          completed: false,
          is_important: false,
          is_urgent: false,
          deadline: '',
          estimated_time: 0,
          checklist: [],
          require_checklist_complete: false,
          isRepeating: false,
          frequency: null,
          selected_days: [],
          recurring_start_date: null,
          recurring_end_date: null,
          recurring_display_mode: 'next_only'
        })
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Neznámá chyba' }))
        alert(`Chyba při ${isNewStep ? 'vytváření' : 'aktualizaci'} kroku: ${errorData.error || 'Nepodařilo se uložit krok'}`)
      }
    } catch (error) {
      console.error('Error saving step:', error)
      alert(`Chyba při ${stepModalData.id ? 'aktualizaci' : 'vytváření'} kroku`)
    } finally {
      setStepModalSaving(false)
    }
  }

  // Handle habit modal
  const handleOpenHabitModal = (habit: any) => {
    setHabitModalData(habit)
    setEditingHabitName(habit?.name || '')
    setEditingHabitDescription(habit?.description || '')
    setEditingHabitFrequency(habit?.frequency || 'daily')
    setEditingHabitSelectedDays(habit?.selected_days || [])
    setEditingHabitCategory(habit?.category || '')
    setEditingHabitDifficulty(habit?.difficulty || 'medium')
    setEditingHabitReminderTime(habit?.reminder_time || '')
    setEditingHabitNotificationEnabled(habit?.notification_enabled || false)
    setEditingHabitIcon(habit?.icon || 'Target')
    
    // Parse monthly frequency selections
    if (habit?.frequency === 'monthly' && habit?.selected_days) {
      const monthWeekDays = habit.selected_days.filter((d: string) => d.includes('_'))
      if (monthWeekDays.length > 0) {
        // Group by unique combinations - collect all weeks and days
        const weekSet = new Set<string>()
        const daySet = new Set<string>()
        monthWeekDays.forEach((d: string) => {
          const [week, day] = d.split('_')
          if (week) weekSet.add(week)
          if (day) daySet.add(day)
        })
        // Create a single selection with all weeks and days
        setEditingHabitWeekdayInMonthSelections([{ 
          week: Array.from(weekSet).join(','), 
          day: Array.from(daySet).join(',') 
        }])
        setEditingHabitMonthlyType('weekdayInMonth')
      } else {
        setEditingHabitWeekdayInMonthSelections([])
        setEditingHabitMonthlyType('specificDays')
      }
    } else {
      // For new habits or non-monthly habits, if frequency is monthly and type is weekdayInMonth, initialize with one empty selection
      if (editingHabitFrequency === 'monthly' && editingHabitMonthlyType === 'weekdayInMonth') {
        setEditingHabitWeekdayInMonthSelections([{ week: '', day: '' }])
      } else {
        setEditingHabitWeekdayInMonthSelections([])
        setEditingHabitMonthlyType('specificDays')
      }
    }
    
    // Initialize autoAdjust31 for new habits
    if (!habit) {
      setEditingHabitAutoAdjust31(true)
    }
    
    // If creating new habit and we're on an area page, automatically assign the area
    if (!habit && mainPanelSection?.startsWith('area-')) {
      const areaId = mainPanelSection.replace('area-', '')
      setEditingHabitAreaId(areaId)
    } else {
      setEditingHabitAreaId(habit?.area_id || null)
    }
    
    setShowHabitModal(true)
  }

  const handleSaveHabitModal = async () => {
    if (!editingHabitName.trim()) {
      alert('Název návyku je povinný')
      return
    }
    
    if (!editingHabitIcon) {
      alert('Ikona je povinná')
      return
    }


    setHabitModalSaving(true)
    try {
      const isNewHabit = !habitModalData?.id
      const response = await fetch('/api/habits', {
        method: isNewHabit ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(isNewHabit ? {} : { habitId: habitModalData.id }),
          name: editingHabitName,
          description: editingHabitDescription,
          frequency: editingHabitFrequency,
          reminderTime: editingHabitReminderTime || null,
          notificationEnabled: editingHabitNotificationEnabled,
          selectedDays: editingHabitSelectedDays,
          category: editingHabitCategory,
          difficulty: editingHabitDifficulty,
          areaId: editingHabitAreaId || null,
          icon: editingHabitIcon
        }),
      })

      if (response.ok) {
        const updatedHabit = await response.json()
        
        // Update habits in parent component
        if (onHabitsUpdate) {
          if (isNewHabit) {
            // Add new habit to the list
            onHabitsUpdate([...habits, updatedHabit])
          } else {
            // Update existing habit
          const updatedHabits = habits.map(habit => 
            habit.id === updatedHabit.id ? updatedHabit : habit
          )
          onHabitsUpdate(updatedHabits)
          }
        }
        
        // Close modal after successful save
        setShowHabitModal(false)
        setHabitModalData(null)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Neznámá chyba' }))
        console.error('Error updating habit:', { status: response.status, error: errorData, habitId: habitModalData?.id })
        alert(`Chyba při ${isNewHabit ? 'vytváření' : 'aktualizaci'} návyku: ${errorData.error || 'Nepodařilo se uložit návyk'}`)
      }
    } catch (error) {
      console.error('Error saving habit:', error)
      alert(`Chyba při ${habitModalData?.id ? 'aktualizaci' : 'vytváření'} návyku`)
    } finally {
      setHabitModalSaving(false)
    }
  }

  const handleDeleteHabit = async () => {
    if (!habitModalData?.id) return

    // Open delete confirmation modal
    setHabitToDelete(habitModalData.id)
    setShowDeleteHabitModal(true)
  }

  const handleConfirmDeleteHabit = async () => {
    if (!habitToDelete) return

    setIsDeletingHabit(true)
    try {
      const response = await fetch('/api/habits', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          habitId: habitToDelete
        }),
      })

      if (response.ok) {
        // Remove habit from parent component
        if (onHabitsUpdate) {
          onHabitsUpdate(habits.filter(habit => habit.id !== habitToDelete))
        }
        
        // Close modals after successful deletion
        setShowHabitModal(false)
        setHabitModalData(null)
        setShowDeleteHabitModal(false)
        setHabitToDelete(null)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Neznámá chyba' }))
        alert(t('habits.deleteError') || `Nepodařilo se smazat návyk: ${errorData.error || 'Neznámá chyba'}`)
      }
    } catch (error) {
      console.error('Error deleting habit:', error)
      alert(t('habits.deleteError') || 'Chyba při mazání návyku')
    }
  }

  // Handle areas management - open as page instead of modal
  const handleOpenAreasManagementModal = () => {
    setCurrentPage('areas')
    setMainPanelSection(null)
  }

  const handleOpenAreaEditModal = (area?: any) => {
    if (area) {
      setEditingArea(area)
      setAreaModalName(area.name || '')
      setAreaModalDescription(area.description || '')
      setAreaModalColor(area.color || '#ea580c')
      setAreaModalIcon(area.icon || 'LayoutDashboard')
    } else {
      setEditingArea(null)
      setAreaModalName('')
      setAreaModalDescription('')
      setAreaModalColor('#ea580c')
      setAreaModalIcon('LayoutDashboard')
    }
    setShowAreaEditModal(true)
  }

  const handleSaveArea = async () => {
    if (!areaModalName.trim()) {
      alert(t('areas.nameRequired') || 'Název oblasti je povinný')
      return
    }

    // Validate name length
    if (areaModalName.trim().length > 255) {
      const nameTooLongMsg = t('areas.nameTooLong') || 'Název oblasti je příliš dlouhý. Maximální délka je 255 znaků. Aktuální délka: {length} znaků.'
      alert(nameTooLongMsg.replace('{length}', String(areaModalName.trim().length)))
      return
    }

    // Validate icon length
    const iconToSave = areaModalIcon || 'LayoutDashboard'
    if (iconToSave.length > 50) {
      const iconTooLongMsg = t('areas.iconTooLong') || 'Název ikony je příliš dlouhý. Maximální délka je 50 znaků. Aktuální délka: {length} znaků. Prosím vyberte kratší ikonu.'
      alert(iconTooLongMsg.replace('{length}', String(iconToSave.length)))
      return
    }

    if (!userId) {
      alert(t('common.error') || 'Chyba: Uživatel není nalezen')
      return
    }

    setIsSavingArea(true)
    try {
      const isNewArea = !editingArea
      const response = await fetch('/api/cesta/areas', {
        method: isNewArea ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(isNewArea ? {} : { id: editingArea.id }),
          name: areaModalName.trim(),
          description: areaModalDescription.trim() || null,
          color: areaModalColor,
          icon: iconToSave,
          order: isNewArea ? (areas.length || 0) : (editingArea?.order ?? undefined)
        }),
      })

      if (response.ok) {
        // Reload areas
        const areasResponse = await fetch('/api/cesta/areas')
        if (areasResponse.ok) {
          const data = await areasResponse.json()
          setAreas(data.areas || [])
        }
        
        // Close edit modal but keep management modal open
        setShowAreaEditModal(false)
        setEditingArea(null)
        setAreaModalName('')
        setAreaModalDescription('')
        setAreaModalColor('#ea580c')
        setAreaModalIcon('LayoutDashboard')
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Neznámá chyba' }))
        const errorMessage = errorData.details 
          ? `${errorData.error || 'Chyba'}: ${errorData.details}`
          : (errorData.error || 'Nepodařilo se uložit oblast')
        alert(`Chyba při ${isNewArea ? 'vytváření' : 'aktualizaci'} oblasti: ${errorMessage}`)
      }
    } catch (error) {
      console.error('Error saving area:', error)
      alert(`Chyba při ${editingArea ? 'aktualizaci' : 'vytváření'} oblasti`)
    } finally {
      setIsSavingArea(false)
    }
  }

  const handleDeleteArea = (areaId: string) => {
    setAreaToDelete(areaId)
    setDeleteAreaWithRelated(false) // Reset checkbox when opening modal
    setShowDeleteAreaModal(true)
  }

  const handleDeleteAreaConfirm = async (areaId?: string, deleteRelated?: boolean) => {
    // Log only primitive values to avoid circular reference issues
    console.log('Delete area: Function called', 'areaId:', areaId, 'deleteRelated:', deleteRelated, 'areaToDelete:', areaToDelete, 'deleteAreaWithRelated:', deleteAreaWithRelated)
    
    const targetAreaId = areaId || areaToDelete
    const shouldDeleteRelated = deleteRelated !== undefined ? deleteRelated : deleteAreaWithRelated
    
    console.log('Delete area: Resolved values', 'targetAreaId:', targetAreaId, 'shouldDeleteRelated:', shouldDeleteRelated)
    
    if (!targetAreaId) {
      console.log('Delete area: No target area ID, returning')
      return
    }

    console.log('Delete area: Setting isDeletingArea to true')
    setIsDeletingArea(true)
    
    try {
      console.log('Delete area: Starting delete request', 'targetAreaId:', targetAreaId, 'shouldDeleteRelated:', shouldDeleteRelated)
      
      // Prepare request body safely
      let requestBody: string
      try {
        const bodyData = { 
          id: targetAreaId,
          deleteRelated: shouldDeleteRelated
        }
        requestBody = JSON.stringify(bodyData)
        console.log('Delete area: Request body prepared:', requestBody)
      } catch (stringifyError) {
        console.error('Delete area: Failed to stringify request body')
        throw new Error('Failed to prepare request body')
      }
      
      let response: Response
      try {
        response = await fetch('/api/cesta/areas', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
          body: requestBody,
        })
        console.log('Delete area: Fetch completed', 'status:', response.status, 'statusText:', response.statusText, 'ok:', response.ok)
      } catch (fetchError) {
        console.error('Delete area: Fetch failed')
        if (fetchError instanceof Error) {
          throw new Error(`Network error: ${fetchError.message}`)
        }
        throw new Error('Network error: Unknown error')
      }

      console.log('Delete area response status:', response.status, response.statusText, 'ok:', response.ok)

      if (response.ok) {
        console.log('Delete area: Success, reloading data...')
        
        try {
        // Reload areas
        const areasResponse = await fetch('/api/cesta/areas')
        if (areasResponse.ok) {
            try {
          const data = await areasResponse.json()
          setAreas(data.areas || [])
              console.log('Delete area: Areas reloaded successfully')
            } catch (parseError) {
              console.error('Delete area: Failed to parse areas response')
              if (parseError instanceof Error) {
                console.error('Parse error:', parseError.message)
              }
            }
          } else {
            console.error('Delete area: Failed to reload areas, status:', areasResponse.status)
          }
        } catch (e) {
          console.error('Delete area: Error reloading areas')
          if (e instanceof Error) {
            console.error('Reload error:', e.message)
          }
        }
        
        // If we're on the area page, navigate back to overview
        if (mainPanelSection === `area-${targetAreaId}`) {
          setMainPanelSection('overview')
        }
        
        setShowDeleteAreaModal(false)
        setAreaToDelete(null)
        const wasRelatedDeleted = shouldDeleteRelated
        setDeleteAreaWithRelated(false)
        
        // Goals removed - no need to reload goals
        
        try {
        const stepsResponse = await fetch('/api/daily-steps')
        if (stepsResponse.ok && onDailyStepsUpdate) {
            try {
          const stepsData = await stepsResponse.json()
          // API returns array directly, not wrapped in { steps: [...] }
          onDailyStepsUpdate(Array.isArray(stepsData) ? stepsData : (stepsData.steps || []))
            } catch (parseError) {
              console.error('Delete area: Failed to parse steps response')
            }
          }
        } catch (e) {
          console.error('Delete area: Error fetching steps')
        }
        
        try {
        const habitsResponse = await fetch('/api/habits')
        if (habitsResponse.ok && onHabitsUpdate) {
            try {
          const habitsData = await habitsResponse.json()
          // API returns array directly, not wrapped in { habits: [...] }
          onHabitsUpdate(Array.isArray(habitsData) ? habitsData : (habitsData.habits || []))
            } catch (parseError) {
              console.error('Delete area: Failed to parse habits response')
            }
          }
        } catch (e) {
          console.error('Delete area: Error fetching habits')
        }
        
        console.log('Delete area: All data reloaded successfully')
      } else {
        let errorMessage = 'Neznámá chyba'
        try {
          const responseText = await response.text()
          console.log('Delete area: Error response text:', responseText)
          
          if (responseText) {
            try {
              const errorData = JSON.parse(responseText)
              console.log('Delete area: Parsed error data:', errorData)
              errorMessage = errorData.error || errorData.details || errorMessage
            } catch (parseError) {
              // If response is not valid JSON, use the text as error message
              console.log('Delete area: Response is not JSON, using text as error')
              errorMessage = responseText.substring(0, 200) || response.statusText || `HTTP ${response.status}`
            }
          } else {
            errorMessage = response.statusText || `HTTP ${response.status}`
          }
        } catch (e) {
          // If we can't read response at all, use status
          console.log('Delete area: Failed to read error response')
          errorMessage = response.statusText || `HTTP ${response.status}`
        }
        console.error('Delete area failed with status:', response.status, 'Error:', errorMessage)
        alert(t('areas.deleteError') || `Nepodařilo se smazat oblast: ${errorMessage}`)
      }
    } catch (error) {
      // Safely log error without circular references
      // NEVER try to JSON.stringify the error object or create objects with error properties
      console.log('Delete area catch block - error type:', typeof error, 'is Error:', error instanceof Error)
      
      let errorMessage = 'Neznámá chyba'
      
      try {
        if (error instanceof Error) {
          // Extract only primitive string values - never the error object itself
          const msg = (error.message && typeof error.message === 'string') ? error.message : ''
          const name = (error.name && typeof error.name === 'string') ? error.name : 'Error'
          const stack = (error.stack && typeof error.stack === 'string') ? error.stack.substring(0, 500) : ''
          
          // Log only primitive values, never the error object
          console.log('Error name:', name)
          console.log('Error message:', msg)
          if (stack) {
            console.log('Error stack:', stack)
          }
          
          if (msg && msg.length > 0 && !msg.includes('circular') && !msg.includes('HTMLButtonElement') && !msg.includes('FiberNode')) {
            errorMessage = `${name}: ${msg}`
          } else if (name) {
            errorMessage = name
          }
        } else if (typeof error === 'string' && error.length < 200) {
          errorMessage = error
        } else {
          // For non-Error, non-string errors, try String() conversion
          // This is safe as it doesn't use JSON.stringify
          try {
            const errorStr = String(error)
            if (errorStr && errorStr.length < 200 && !errorStr.includes('[object Object]')) {
              errorMessage = errorStr
            }
          } catch (e) {
            // If even String() fails, just use default message
            console.log('Could not convert error to string')
          }
        }
      } catch (e) {
        // If anything fails, just use default message
        console.log('Error extracting error message')
      }
      
      console.error('Error deleting area:', errorMessage)
      alert(t('areas.deleteError') || `Chyba při mazání oblasti: ${errorMessage}`)
    } finally {
      setIsDeletingArea(false)
    }
  }


  const handleSaveStep = async () => {
    if (!selectedItem || selectedItemType !== 'step') return

    try {
      const isNewStep = selectedItem.id === 'new-step'
      
      // For new step, create it
      if (isNewStep) {
        // Use userId from state (loaded from API) or fallback to player?.user_id
        const currentUserId = userId || player?.user_id
        
        if (!currentUserId) {
          console.error('Cannot create step: userId not available')
          alert('Chyba: Uživatel není načten. Zkuste to prosím znovu.')
          return
        }

        const response = await fetch('/api/daily-steps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUserId,
            title: stepTitle,
            description: stepDescription,
            date: selectedDate || getLocalDateString(),
            estimated_time: stepEstimatedTime,
            xp_reward: 1 // Always 1 XP
          })
        })

        if (response.ok) {
          // Get the newly created step from the response
          const newStep = await response.json()
          
          // API should return date as YYYY-MM-DD string - use it directly
          // If it's already a YYYY-MM-DD string, use it as-is
          // This preserves the exact date sent by the client
          let normalizedDate = newStep.date
          if (!normalizedDate) {
            // Fallback: use the date we sent
            normalizedDate = selectedDate || getLocalDateString()
          } else if (typeof normalizedDate === 'string' && normalizedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // Already YYYY-MM-DD format - use directly
            normalizedDate = normalizedDate
          } else {
            // Date object or other format - normalize using local date components
            const dateObj = new Date(normalizedDate)
            normalizedDate = getLocalDateString(dateObj)
          }
          
          console.log('handleSaveStep - Date sent:', selectedDate || getLocalDateString())
          console.log('handleSaveStep - Date received:', newStep.date)
          console.log('handleSaveStep - Date normalized:', normalizedDate)
          
          // Update the steps list
          const currentUserId = userId || player?.user_id
          if (currentUserId) {
            const updatedSteps = await fetch(`/api/daily-steps?userId=${currentUserId}`)
            .then(res => res.json())
          onDailyStepsUpdate?.(updatedSteps)
          }
          
          // Update selectedItem to the newly created step (keep it open)
          setSelectedItem({ ...newStep, date: normalizedDate })
          setSelectedItemType('step')
          
          // Update state variables to match the new step
          setStepTitle(newStep.title || '')
          setStepDescription(newStep.description || '')
          setSelectedDate(normalizedDate)
          setStepEstimatedTime(newStep.estimated_time || 0)
          // XP is always 1, not editable
          
          // Keep editing mode closed after initial save
          setEditingStepTitle(false)
        }
      } else {
        // For existing step, update it
        const response = await fetch('/api/daily-steps', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stepId: selectedItem.id,
            title: stepTitle,
            description: stepDescription,
            estimated_time: stepEstimatedTime,
            xp_reward: 1, // Always 1 XP
            is_important: stepIsImportant,
            is_urgent: stepIsUrgent,
            goal_id: stepGoalId,
            deadline: stepDeadline || null
          })
        })

        if (response.ok) {
          // Optimistically update the selected item
          setSelectedItem({ 
            ...selectedItem, 
            title: stepTitle,
            description: stepDescription,
            estimated_time: stepEstimatedTime,
            xp_reward: stepXpReward
          })
          
          const currentUserId = userId || player?.user_id
          if (currentUserId) {
            const updatedSteps = await fetch(`/api/daily-steps?userId=${currentUserId}`)
            .then(res => res.json())
          onDailyStepsUpdate?.(updatedSteps)
          }
          setEditingStepTitle(false)
        }
      }
    } catch (error) {
      console.error('Error saving step:', error)
    }
  }

  const handleToggleStepCompleted = async (completed: boolean) => {
    if (!selectedItem || selectedItemType !== 'step') return

    // Check if require_checklist_complete is enabled and not all items are completed
    if (completed && selectedItem.require_checklist_complete && selectedItem.checklist?.length > 0) {
      const allChecklistCompleted = selectedItem.checklist.every((item: any) => item.completed)
      if (!allChecklistCompleted) {
        alert(t('steps.checklistNotComplete'))
        return
      }
    }

    try {
      const response = await fetch('/api/daily-steps', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId: selectedItem.id,
          completed
        })
      })

      if (response.ok) {
        const updatedStep = await response.json()
        // Update the selected item with full data from server (including checklist)
        setSelectedItem({ ...selectedItem, ...updatedStep })
        
        // Also update the dailySteps list - fetch all steps, not just today's
        const updatedSteps = await fetch(`/api/daily-steps?userId=${player?.user_id}`)
          .then(res => res.json())
        onDailyStepsUpdate?.(updatedSteps)
      }
    } catch (error) {
      console.error('Error toggling step completion:', error)
      // Revert on error
      setSelectedItem({ ...selectedItem, completed: !completed })
    }
  }

  const handleRescheduleStep = async (newDate: string) => {
    if (!selectedItem || selectedItemType !== 'step') return

    try {
      // Ensure date is in YYYY-MM-DD format using getLocalDateString if needed
      const formattedDate = newDate || getLocalDateString()
      
      // Send only date to trigger date-only update path in API
      const response = await fetch('/api/daily-steps', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId: selectedItem.id,
          date: formattedDate
        })
      })

      if (response.ok) {
        const updatedStep = await response.json()
        
        // API should return date as YYYY-MM-DD string - use it directly
        let normalizedDate = updatedStep.date
        if (normalizedDate && typeof normalizedDate === 'string' && normalizedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // Already YYYY-MM-DD format - use directly
          normalizedDate = normalizedDate
        } else if (normalizedDate) {
          // Date object or other format - normalize
          if (typeof normalizedDate === 'string' && normalizedDate.includes('T')) {
            normalizedDate = normalizedDate.split('T')[0]
          } else {
            normalizedDate = getLocalDateString(new Date(normalizedDate))
          }
        } else {
          // Fallback: use the date we sent
          normalizedDate = formattedDate
        }
        
        console.log('handleRescheduleStep - Date sent:', formattedDate)
        console.log('handleRescheduleStep - Date received:', updatedStep.date)
        console.log('handleRescheduleStep - Date normalized:', normalizedDate)
        
        // Update selected item with new date
        setSelectedItem({ ...selectedItem, date: normalizedDate })
        
        // Update the steps list - fetch all steps - use userId state instead of player?.user_id
        const currentUserId = userId || player?.user_id
        if (currentUserId) {
          const stepsResponse = await fetch(`/api/daily-steps?userId=${currentUserId}`)
          if (stepsResponse.ok) {
            const updatedSteps = await stepsResponse.json()
            // Ensure we have an array before updating
            if (Array.isArray(updatedSteps)) {
              onDailyStepsUpdate?.(updatedSteps)
            } else {
              console.error('Error: API returned non-array response:', updatedSteps)
            }
          } else {
            console.error('Error fetching updated steps:', stepsResponse.status)
          }
        } else {
          console.error('Cannot refresh steps: userId is not available')
        }
        
        setShowDatePicker(false)
        // Don't close the detail view, just update the date
        setSelectedDate(normalizedDate)
      } else {
        const errorData = await response.json()
        console.error('Error rescheduling step:', errorData)
        alert('Nepodařilo se aktualizovat datum kroku')
      }
    } catch (error) {
      console.error('Error rescheduling step:', error)
      alert(t('details.step.updateDateErrorGeneric'))
    }
  }

  // Handle step date change from date picker in focus section
  const handleStepDateChange = async (stepId: string, newDate: string) => {
    try {
      const response = await fetch('/api/daily-steps', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId,
          date: newDate
        })
      })

      if (response.ok) {
        // Refresh steps list - use userId state instead of player?.user_id
        const currentUserId = userId || player?.user_id
        if (!currentUserId) {
          console.error('Cannot refresh steps: userId is not available')
          return
        }
        
        const stepsResponse = await fetch(`/api/daily-steps?userId=${currentUserId}`)
        if (stepsResponse.ok) {
          const updatedSteps = await stepsResponse.json()
          // Ensure we have an array before updating
          if (Array.isArray(updatedSteps)) {
            onDailyStepsUpdate?.(updatedSteps)
          } else {
            console.error('Error: API returned non-array response:', updatedSteps)
          }
        } else {
          console.error('Error fetching updated steps:', stepsResponse.status)
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error updating step date:', errorData)
        alert(t('details.step.updateDateErrorGeneric') || 'Nepodařilo se aktualizovat datum kroku')
      }
    } catch (error) {
      console.error('Error updating step date:', error)
      alert(t('details.step.updateDateErrorGeneric') || 'Nepodařilo se aktualizovat datum kroku')
    }
  }
  
  // Handle step time change from time picker in focus section
  const handleStepImportantChange = async (stepId: string, isImportant: boolean) => {
    // Add to loading set
    setLoadingSteps(prev => new Set(prev).add(stepId))
    
    try {
      const response = await fetch('/api/daily-steps', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId,
          isImportant: isImportant
        })
      })

      if (response.ok) {
        // Refresh steps list - use userId state instead of player?.user_id
        const currentUserId = userId || player?.user_id
        if (!currentUserId) {
          console.error('Cannot refresh steps: userId is not available')
          setLoadingSteps(prev => {
            const newSet = new Set(prev)
            newSet.delete(stepId)
            return newSet
          })
          return
        }
        
        const stepsResponse = await fetch(`/api/daily-steps?userId=${currentUserId}`)
        if (stepsResponse.ok) {
          const stepsData = await stepsResponse.json()
          const stepsArray = Array.isArray(stepsData) ? stepsData : (stepsData.steps || stepsData.dailySteps || [])
          if (onDailyStepsUpdate) {
            onDailyStepsUpdate(stepsArray)
          }
        }
      } else {
        console.error('Failed to update step importance')
      }
    } catch (error) {
      console.error('Error updating step importance:', error)
    } finally {
      // Remove from loading set
      setLoadingSteps(prev => {
        const newSet = new Set(prev)
        newSet.delete(stepId)
        return newSet
      })
    }
  }

  const handleStepTimeChange = async (stepId: string, minutes: number) => {
    try {
      const response = await fetch('/api/daily-steps', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId,
          estimated_time: minutes
        })
      })

      if (response.ok) {
        // Refresh steps list - use userId state instead of player?.user_id
        const currentUserId = userId || player?.user_id
        if (!currentUserId) {
          console.error('Cannot refresh steps: userId is not available')
          return
        }
        
        const stepsResponse = await fetch(`/api/daily-steps?userId=${currentUserId}`)
        if (stepsResponse.ok) {
          const updatedSteps = await stepsResponse.json()
          // Ensure we have an array before updating
          if (Array.isArray(updatedSteps)) {
            onDailyStepsUpdate?.(updatedSteps)
          } else {
            console.error('Error: API returned non-array response:', updatedSteps)
          }
        } else {
          console.error('Error fetching updated steps:', stepsResponse.status)
        }
      } else {
        console.error('Error updating step time')
      }
    } catch (error) {
      console.error('Error updating step time:', error)
    }
  }

  const handleSaveGoal = async () => {
    // Goals removed - no goal editing
    return
  }

  // renderItemDetail has been extracted to ./details/ItemDetailRenderer.tsx

  // renderActionButtons has been extracted to ./layout/ActionButtons.tsx

  // renderChillContent has been extracted to ./content/ChillContent.tsx
  // renderDisplayContent has been extracted to ./content/DisplayContent.tsx
  // renderWorkflowContent has been extracted to ./content/WorkflowContent.tsx
  // renderCalendarContent has been extracted to ./content/CalendarContent.tsx

  // renderDailyPlanContent has been extracted to ./content/DailyPlanContent.tsx

  // renderStatisticsContent has been extracted to ./content/StatisticsContent.tsx

  // Old renderGoalsContent and renderHabitsContent removed - now using new versions in renderManagementContent
  // renderStepsContent removed - now in ManagementPage


  // SortableGoal has been extracted to ./journey/SortableGoal.tsx

  const handleHabitToggle = async (habitId: string, date?: string) => {
      // Use provided date or default to today
      const dateToUse = date || (() => {
      const now = new Date()
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      })()
    
    // Create loading key: always use habitId-date format for consistency
    const loadingKey = `${habitId}-${dateToUse}`
    
    // Prevent duplicate requests - check both ref and state
    if (loadingHabitsRef.current.has(loadingKey) || loadingHabits.has(loadingKey)) {
      return
    }
    
    // Find the habit in current habits array to get actual current state
    const habit = habits.find((h: any) => h.id === habitId)
    if (!habit) {
      console.error('Habit not found:', habitId)
      return
    }
    
    // Get actual current completion state from habit_completions
    const habitCompletions = habit.habit_completions || {}
    const isCurrentlyCompleted = habitCompletions[dateToUse] === true
    
    // Simple toggle: if completed, uncomplete; if not completed, complete
    const newState = !isCurrentlyCompleted
    
    // Set loading state IMMEDIATELY and synchronously
    loadingHabitsRef.current.add(loadingKey)
    setLoadingHabits(prev => {
      if (prev.has(loadingKey)) return prev
      const newSet = new Set(prev)
      newSet.add(loadingKey)
      return newSet
    })
    
    try {
      // Send API request using calendar endpoint (same as handleHabitCalendarToggle)
      const response = await fetch('/api/habits/calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          habitId,
          date: dateToUse,
          completed: newState
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
        const result = await response.json()
        
      // Use habits returned from API if available (avoids cache issues)
      if (result.habits && Array.isArray(result.habits)) {
        // API returned all habits directly - use them (cache already invalidated)
        if (onHabitsUpdate) {
          onHabitsUpdate(result.habits)
        }
        
        // Update habit modal data if it's the same habit
        if (habitModalData && habitModalData.id === habitId) {
          const freshHabit = result.habits.find((h: any) => h.id === habitId)
          if (freshHabit) {
            setHabitModalData(freshHabit)
          }
        }
        
        // Update selected item if it's the same habit
        if (selectedItem && selectedItem.id === habitId) {
          const freshHabit = result.habits.find((h: any) => h.id === habitId)
          if (freshHabit) {
            setSelectedItem({
              ...selectedItem,
              habit_completions: freshHabit.habit_completions || {}
            })
          }
        }
      } else {
        // Fallback: Refresh ALL habits from server with cache-busting
        if (onHabitsUpdate) {
          const cacheBuster = Date.now()
          const habitsResponse = await fetch(`/api/habits?t=${cacheBuster}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache'
            }
          })
          if (habitsResponse.ok) {
            const updatedHabits = await habitsResponse.json()
            onHabitsUpdate(updatedHabits)
            
            // Update habit modal data if it's the same habit
            if (habitModalData && habitModalData.id === habitId) {
              const freshHabit = updatedHabits.find((h: any) => h.id === habitId)
              if (freshHabit) {
                setHabitModalData(freshHabit)
          }
        }
        
        // Update selected item if it's the same habit
        if (selectedItem && selectedItem.id === habitId) {
              const freshHabit = updatedHabits.find((h: any) => h.id === habitId)
              if (freshHabit) {
          setSelectedItem({
            ...selectedItem,
                  habit_completions: freshHabit.habit_completions || {}
          })
        }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error updating habit:', error)
      // On error, refresh habits anyway to get current state (with cache-busting)
      if (onHabitsUpdate) {
        try {
          const cacheBuster = Date.now()
          const habitsResponse = await fetch(`/api/habits?t=${cacheBuster}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache'
            }
          })
          if (habitsResponse.ok) {
            const updatedHabits = await habitsResponse.json()
            onHabitsUpdate(updatedHabits)
          }
        } catch (fetchError) {
          console.error('Error fetching habits after error:', fetchError)
        }
      }
    } finally {
      // ALWAYS remove from loading set - use both ref and state
      loadingHabitsRef.current.delete(loadingKey)
      setLoadingHabits(prev => {
        if (!prev.has(loadingKey)) return prev
        const newSet = new Set(prev)
        newSet.delete(loadingKey)
        return newSet
      })
    }
  }

  // Goals removed - no goal delete handler needed
  const handleDeleteGoalForDetail = async (goalId: string, deleteSteps: boolean) => {
    // Goals removed
    return
  }

  // Handle goal update for detail page (inline editing)
  const handleUpdateGoalForDetail = async (goalId: string, updates: any) => {
    // Only validate title if it's being updated
    if (updates.title !== undefined && (!updates.title || !updates.title.trim())) {
      alert(t('goals.goalTitleRequired'))
      return
    }

    try {
      console.log('Updating goal from detail view:', goalId, updates)
      
      const response = await fetch('/api/goals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goalId,
          ...updates
        }),
      })

      if (response.ok) {
        const updatedGoal = await response.json()
        // Goals removed - no goals to update
        // Update selectedItem to reflect changes if it's the same goal
        if (selectedItem && selectedItem.id === goalId) {
          setSelectedItem(updatedGoal)
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Neznámá chyba' }))
        const errorMessage = errorData.error || `HTTP ${response.status}`
        console.error('Failed to update goal:', errorMessage)
        alert(`Nepodařilo se aktualizovat cíl: ${errorMessage}`)
            }
          } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('Error updating goal:', errorMessage)
      alert('Chyba při aktualizaci cíle')
      console.error('Error updating goal:', error)
      alert('Chyba při aktualizaci cíle')
    }
  }

  const handleUpdateAreaForDetail = async (areaId: string, updates: any) => {
    // Validate name if it's being updated
    if (updates.name !== undefined) {
      if (!updates.name || !updates.name.trim()) {
        alert(t('areas.nameRequired') || 'Název oblasti je povinný')
        return
      }
      if (updates.name.trim().length > 255) {
        const nameTooLongMsg = t('areas.nameTooLong') || 'Název oblasti je příliš dlouhý. Maximální délka je 255 znaků. Aktuální délka: {length} znaků.'
        alert(nameTooLongMsg.replace('{length}', String(updates.name.trim().length)))
        return
      }
    }

    // Validate icon if it's being updated
    if (updates.icon !== undefined) {
      const iconToSave = updates.icon || 'LayoutDashboard'
      if (iconToSave.length > 50) {
        const iconTooLongMsg = t('areas.iconTooLong') || 'Název ikony je příliš dlouhý. Maximální délka je 50 znaků. Aktuální délka: {length} znaků. Prosím vyberte kratší ikonu.'
        alert(iconTooLongMsg.replace('{length}', String(iconToSave.length)))
        return
      }
    }

    try {
      const response = await fetch('/api/cesta/areas', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: areaId,
          ...updates
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const updatedArea = data.area
        // Update areas in state
        setAreas(prevAreas => prevAreas.map(a => a.id === areaId ? updatedArea : a))
        
        // Update area detail page state if we're currently viewing this area
        if (mainPanelSection?.startsWith('area-') && mainPanelSection.replace('area-', '') === areaId) {
          // Update local state values to reflect the changes
          if (updates.name !== undefined) {
            setAreaDetailTitleValue(updatedArea.name)
          }
          if (updates.description !== undefined) {
            setAreaDetailDescriptionValue(updatedArea.description || '')
          }
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Neznámá chyba' }))
        const errorMessage = errorData.details 
          ? `${errorData.error || 'Chyba'}: ${errorData.details}`
          : (errorData.error || 'Nepodařilo se uložit oblast')
        alert(errorMessage)
            }
          } catch (error) {
      console.error('Error updating area:', error)
      alert('Chyba při aktualizaci oblasti')
    }
  }

  const handleUpdateGoal = async (goalId: string, updates: any) => {
    if (!updates.title || !updates.title.trim()) {
      alert('Název cíle je povinný')
      return
    }

    try {
      console.log('Updating goal:', goalId, updates)
      
      const response = await fetch('/api/goals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goalId,
          ...updates
        }),
      })

      if (response.ok) {
        const updatedGoal = await response.json()
        
        // Goals removed - no goals to update
        
        setEditingGoal(null)
      } else {
        console.error('Failed to update goal')
        alert('Nepodařilo se aktualizovat cíl')
      }
    } catch (error) {
      console.error('Error updating goal:', error)
      alert('Chyba při aktualizaci cíle')
    }
  }

  const handleCreateGoal = async () => {
    // Get userId from state
    if (!userId) {
      alert('Chyba: Uživatel není nalezen')
      return
    }

    // Check if we're on an area page and should assign the goal to that area
    let areaId: string | null = null
    if (mainPanelSection?.startsWith('area-')) {
      areaId = mainPanelSection.replace('area-', '')
    }

    try {
      // Create goal with placeholder values
      const response = await fetch('/api/cesta/goals-with-steps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: t('goals.newGoalTitle') || 'Nový cíl',
          description: '',
          targetDate: null,
          status: 'active',
          icon: 'Target',
          steps: [],
          areaId: areaId || null
        }),
      })

      if (response.ok) {
        const data = await response.json()
        
        // Goals removed - no goals to update
        
        // Redirect to goal detail page immediately
        if (data.goal && data.goal.id) {
          setMainPanelSection(`goal-${data.goal.id}`)
            }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to create goal:', errorData)
        alert(`Nepodařilo se vytvořit cíl: ${errorData.error || 'Neznámá chyba'}`)
      }
    } catch (error) {
      console.error('Error creating goal:', error)
      alert('Chyba při vytváření cíle')
    }
  }

  const handleCreateStep = async () => {
    if (!newStep.title.trim()) {
      alert('Název kroku je povinný')
      return
    }

    // Use userId from state (loaded from API) or fallback to player?.user_id
    const currentUserId = userId || player?.user_id
    
    if (!currentUserId) {
      alert('Chyba: Uživatel není nalezen')
      return
    }

    try {
      console.log('Creating step:', newStep)
      
      const response = await fetch('/api/daily-steps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUserId,
          goalId: newStep.goalId || null,
          title: newStep.title,
          description: newStep.description,
          date: newStep.date ? new Date(newStep.date).toISOString() : new Date().toISOString(),
          isImportant: newStep.isImportant,
          isUrgent: newStep.isUrgent,
          estimatedTime: newStep.estimatedTime,
          xpReward: newStep.xpReward
        }),
      })

      if (response.ok) {
        const createdStep = await response.json()
        console.log('Step created successfully:', createdStep)
        
        // Reset form
        setNewStep({
          title: '',
          description: '',
          goalId: null,
          isImportant: false,
          isUrgent: false,
          estimatedTime: 30,
          xpReward: 1,
          date: new Date().toISOString().split('T')[0]
        })
        setShowCreateStep(false)
        
        // Reload steps data instead of full page reload
        const currentDate = new Date().toISOString().split('T')[0]
        const stepsResponse = await fetch(`/api/daily-steps?userId=${player.user_id}&date=${currentDate}`)
        if (stepsResponse.ok) {
          const steps = await stepsResponse.json()
          // Update dailySteps in parent component
          if (onDailyStepsUpdate) {
            onDailyStepsUpdate(steps)
          }
        }
      } else {
        console.error('Failed to create step, status:', response.status)
        alert('Nepodařilo se vytvořit krok')
      }
    } catch (error) {
      console.error('Error creating step:', error)
      alert('Chyba při vytváření kroku')
    }
  }

  const initializeEditingStep = (step: any) => {
    setEditingStep({
      id: step.id,
      title: step.title,
      description: step.description || '',
      goalId: step.goal_id || null,
      isImportant: step.is_important || false,
      isUrgent: step.is_urgent || false,
      estimatedTime: step.estimated_time || 30,
      xpReward: step.xp_reward || 1,
      date: step.date ? new Date(step.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    })
  }

  const handleUpdateStep = async () => {
    if (!editingStep || !editingStep.title.trim()) {
      alert('Název kroku je povinný')
      return
    }

    try {
      console.log('Updating step:', editingStep)
      
      // Format date as YYYY-MM-DD for consistency with API
      let formattedDate = editingStep.date || ''
      if (formattedDate && formattedDate.includes('T')) {
        // If it's already an ISO string, extract date part
        formattedDate = formattedDate.split('T')[0]
      } else if (formattedDate) {
        // If it's already YYYY-MM-DD, use it as is
        formattedDate = formattedDate
      } else {
        // Default to today in YYYY-MM-DD format
        const today = new Date()
        formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      }
      
      const requestBody = {
        stepId: editingStep.id,
        title: editingStep.title,
        description: editingStep.description || undefined,
        goalId: editingStep.goalId || undefined,
        isImportant: editingStep.isImportant,
        isUrgent: editingStep.isUrgent,
        estimatedTime: editingStep.estimatedTime,
        xpReward: editingStep.xpReward,
        date: formattedDate
      }
      
      console.log('Request body:', requestBody)
      
      const response = await fetch('/api/daily-steps', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        const updatedStep = await response.json()
        console.log('Step updated successfully:', updatedStep)
        
        // Close editing form
        setEditingStep(null)
        
        // Update the step in dailySteps array instead of reloading
        const updatedSteps = dailySteps.map(step => 
          step.id === updatedStep.id ? updatedStep : step
        )
        // Update dailySteps in parent component
        if (onDailyStepsUpdate) {
          onDailyStepsUpdate(updatedSteps)
        }
      } else {
        const errorText = await response.text()
        console.error('Failed to update step, status:', response.status, 'Error:', errorText)
        alert('Nepodařilo se aktualizovat krok')
      }
    } catch (error) {
      console.error('Error updating step:', error)
      alert('Chyba při aktualizaci kroku')
    }
  }

  const handleDeleteStep = async (stepId: string) => {
    // This function is called from StepModal, which will show the confirmation modal
    // The actual deletion is handled by handleConfirmDeleteStep
    setShowDeleteStepModal(true)
  }

  const handleFinishRecurringStep = async () => {
    if (!stepModalData.id) return

    // Check if it's a recurring step
    if (!stepModalData.frequency || stepModalData.frequency === null) {
      return
    }

    // Show confirmation dialog
    const confirmMessage = t('steps.finishRecurringConfirm') || (locale === 'cs'
      ? 'Opravdu chcete dokončit tento opakující se krok? Krok bude ukončen k dnešnímu datu a již se nebude opakovat. Statistiky zůstanou zachovány.'
      : 'Are you sure you want to finish this recurring step? The step will be ended as of today and will no longer repeat. Statistics will be preserved.')

    if (!confirm(confirmMessage)) {
      return
    }

    setIsDeletingStep(true)
    try {
      const response = await fetch('/api/daily-steps', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId: stepModalData.id,
          finishRecurring: true
        })
      })

      if (response.ok) {
        const updatedStep = await response.json()
        
        // Update local state
        const updatedSteps = dailySteps.map((s: any) => 
          s.id === stepModalData.id ? updatedStep : s
        )
        
        if (onDailyStepsUpdate) {
          onDailyStepsUpdate(updatedSteps)
        }
        
        // Close modal
        setShowStepModal(false)
        setStepModalData({
          id: null,
          title: '',
          description: '',
          date: '',
          areaId: '',
          completed: false,
          is_important: false,
          is_urgent: false,
          deadline: '',
          estimated_time: 0,
          checklist: [],
          require_checklist_complete: false,
          isRepeating: false,
          frequency: null,
          selected_days: [],
          recurring_start_date: null,
          recurring_end_date: null,
          recurring_display_mode: 'next_only'
        })
        
        // Close editing form if it was open for this step
        if (editingStep && editingStep.id === stepModalData.id) {
          setEditingStep(null)
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Neznámá chyba' }))
        alert(t('steps.finishRecurringError') || `Nepodařilo se dokončit opakující se krok: ${errorData.error || 'Neznámá chyba'}`)
      }
    } catch (error) {
      console.error('Error finishing recurring step:', error)
      alert(t('steps.finishRecurringError') || 'Chyba při dokončování opakujícího se kroku')
    } finally {
      setIsDeletingStep(false)
    }
  }

  const handleConfirmDeleteStep = async () => {
    if (!stepModalData.id) return

    setIsDeletingStep(true)
    try {
      const stepId = stepModalData.id
      
      // Find the step to get its goalId before deletion
      const stepToDelete = dailySteps.find((s: any) => s.id === stepId)
      const goalId = stepToDelete?.goal_id || stepToDelete?.goalId
      
      const response = await fetch(`/api/daily-steps?stepId=${stepId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Close modals
        setShowDeleteStepModal(false)
        setShowStepModal(false)
        setStepModalData({
          id: null,
          title: '',
          description: '',
          date: '',
          areaId: '',
          completed: false,
          is_important: false,
          is_urgent: false,
          deadline: '',
          estimated_time: 0,
          checklist: [],
          require_checklist_complete: false,
          isRepeating: false,
          frequency: null,
          selected_days: [],
          recurring_start_date: null,
          recurring_end_date: null,
          recurring_display_mode: 'next_only'
        })
        
        // Close editing form if it was open for this step
        if (editingStep && editingStep.id === stepId) {
          setEditingStep(null)
        }
        
        // Update cache for the goal if goalId is available
        if (goalId) {
          try {
            const stepsResponse = await fetch(`/api/daily-steps?goalId=${goalId}`)
            if (stepsResponse.ok) {
              const stepsData = await stepsResponse.json()
              const stepsArray = Array.isArray(stepsData) ? stepsData : []
              stepsCacheRef.current[goalId] = { data: stepsArray, loaded: true }
              // Trigger reactivity - update stepsCacheVersion to force re-render in SortableGoal
              setStepsCacheVersion((prev: Record<string, number>) => {
                const newVersion = (prev[goalId] || 0) + 1
                return { ...prev, [goalId]: newVersion }
              })
            }
          } catch (error) {
            console.error('Error updating steps cache after deletion:', error)
          }
        }
        
        // Immediately update local dailySteps state by filtering out deleted step
        // Also handle recurring step template deletion - remove all non-completed instances
        let updatedSteps = dailySteps.filter((s: any) => s.id !== stepId)
        
        // If this was a recurring step template, also remove all non-completed instances
        if (stepToDelete && stepToDelete.is_hidden === true && stepToDelete.frequency !== null) {
          const titlePrefix = stepToDelete.title
          updatedSteps = updatedSteps.filter((s: any) => {
            // Keep completed instances, remove non-completed instances
            if (s.title && s.title.startsWith(titlePrefix + ' - ')) {
              return s.completed === true
            }
            return true
          })
        }
        
        if (onDailyStepsUpdate) {
          onDailyStepsUpdate(updatedSteps)
        }
        
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to delete step, status:', response.status, errorData)
        alert(t('steps.deleteError') || 'Nepodařilo se smazat krok')
      }
    } catch (error) {
      console.error('Error deleting step:', error)
      alert(t('steps.deleteError') || 'Chyba při mazání kroku')
    } finally {
      setIsDeletingStep(false)
    }
  }

  const handleStepDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string)
  }

  const handleStepDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    // Reset active drag ID
    setActiveDragId(null)
    
    if (!over) {
      console.log('handleStepDragEnd: No over target')
      return
    }
    
    const stepId = active.id as string
    let targetColumn = over.id as string
    
    console.log('handleStepDragEnd: stepId =', stepId, 'over.id =', targetColumn)
    
    // Find the step
    const step = dailySteps.find(s => s.id === stepId)
    if (!step) {
      console.log('handleStepDragEnd: Step not found')
      return
    }
    
    // If dropped on a step (not column), find which column that step belongs to
    if (!targetColumn.startsWith('column-')) {
      console.log('handleStepDragEnd: Dropped on step, finding column...')
      const targetStep = dailySteps.find(s => s.id === targetColumn)
      if (targetStep) {
        // Determine which column this step belongs to
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        if (targetStep.completed) {
          targetColumn = 'column-completed'
        } else if (!targetStep.date) {
          targetColumn = 'column-no-date'
        } else {
          const stepDate = new Date(targetStep.date)
          stepDate.setHours(0, 0, 0, 0)
          const stepTime = stepDate.getTime()
          const todayTime = today.getTime()
          
          if (stepTime < todayTime) {
            targetColumn = 'column-overdue'
          } else if (stepTime === todayTime) {
            targetColumn = 'column-today'
          } else {
            targetColumn = 'column-future'
          }
        }
      } else {
        console.log('handleStepDragEnd: Target step not found, cannot determine column')
        return
      }
    }
    
    console.log('handleStepDragEnd: Determined target column =', targetColumn)
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Helper function to format date as YYYY-MM-DD in local timezone
    const formatLocalDate = (date: Date): string => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    let newDate: string | null = null
    
    if (targetColumn === 'column-overdue') {
      // Set to yesterday to make it overdue
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      newDate = formatLocalDate(yesterday)
    } else if (targetColumn === 'column-today') {
      newDate = formatLocalDate(today)
    } else if (targetColumn === 'column-future') {
      // Set to tomorrow
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      newDate = formatLocalDate(tomorrow)
    } else if (targetColumn === 'column-no-date') {
      newDate = null
    } else if (targetColumn === 'column-completed') {
      // Just mark as completed, don't change date
      if (!step.completed) {
        await handleStepToggle(stepId, true)
      }
      return
    } else {
      console.log('handleStepDragEnd: Unknown target column:', targetColumn)
      return
    }
    
    console.log('handleStepDragEnd: Setting newDate =', newDate, 'current step.date =', step.date)
    
    // Don't update if date is the same
    const currentDateStr = step.date ? (typeof step.date === 'string' ? step.date : new Date(step.date).toISOString().split('T')[0]) : null
    if (currentDateStr === newDate) {
      console.log('handleStepDragEnd: Date unchanged, skipping update')
      return
    }
    
    // Update step date
    try {
      console.log('handleStepDragEnd: Sending PUT request with stepId =', stepId, 'date =', newDate)
      const response = await fetch('/api/daily-steps', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stepId: stepId,
          date: newDate,
        }),
      })

      if (response.ok) {
        const updatedStep = await response.json()
        console.log('handleStepDragEnd: Step updated successfully:', updatedStep)
        console.log('handleStepDragEnd: Updated step date:', updatedStep.date)
        
        // Update the step in dailySteps array
        const updatedSteps = dailySteps.map(s => {
          if (s.id === updatedStep.id) {
            console.log('handleStepDragEnd: Replacing step:', s.id, 'old date:', s.date, 'new date:', updatedStep.date)
            return updatedStep
          }
          return s
        })
        
        console.log('handleStepDragEnd: Calling onDailyStepsUpdate with', updatedSteps.length, 'steps')
        if (onDailyStepsUpdate) {
          onDailyStepsUpdate(updatedSteps)
        } else {
          console.warn('handleStepDragEnd: onDailyStepsUpdate is not defined!')
        }
      } else {
        const errorText = await response.text()
        console.error('Failed to update step date, status:', response.status, 'error:', errorText)
        alert('Nepodařilo se aktualizovat datum kroku')
      }
    } catch (error) {
      console.error('Error updating step date:', error)
      alert('Chyba při aktualizaci data kroku')
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    console.log('handleDeleteGoal called with goalId:', goalId)
    console.log('editingGoal:', editingGoal)
    
    if (!confirm('Opravdu chcete smazat tento cíl? Tato akce je nevratná.')) {
      return
    }

    try {
      console.log('Sending DELETE request for goalId:', goalId)
      const response = await fetch('/api/goals', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ goalId }),
      })

      console.log('DELETE response status:', response.status)
      
      if (response.ok) {
        console.log('Goal deleted successfully, updating states...')
        
        // Goals removed - no goals to update
        
        // Goals removed - no sortedGoals to update
        // Update localStorage
        try {
          const goalOrder: string[] = []
          localStorage.setItem('goals-order', JSON.stringify(goalOrder))
        } catch (error) {
          console.error('Error updating localStorage after delete:', error)
        }
        
        // Close editing form if it was open for this goal
        if (editingGoal && editingGoal.id === goalId) {
          setEditingGoal(null)
        }
        
        console.log('All states updated successfully')
      } else {
        console.error('Failed to delete goal, status:', response.status)
        alert('Nepodařilo se smazat cíl')
      }
    } catch (error) {
      console.error('Error deleting goal:', error)
      alert('Chyba při mazání cíle')
    }
  }

  // Filter habits for main page display
  const getTodaysHabits = () => {
    const today = new Date().getDay() // 0 = Sunday, 1 = Monday, etc.
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const todayName = dayNames[today]
    
    return habits.filter(habit => {
      // Check if habit should be shown today based on frequency
      switch (habit.frequency) {
        case 'daily':
          return true
        case 'weekly':
          // For weekly habits, check if today is in selected days
          if (habit.selected_days && habit.selected_days.length > 0) {
            return habit.selected_days.includes(todayName)
          }
          return false
        case 'monthly':
          // For monthly habits, show on the same day of month as created
          const createdDate = new Date(habit.created_at)
          return new Date().getDate() === createdDate.getDate()
        case 'custom':
          // For custom habits, check if today is in selected days
          if (habit.selected_days && habit.selected_days.length > 0) {
            return habit.selected_days.includes(todayName)
          }
          return false
        default:
          return false
      }
    })
  }

  const todaysHabits = getTodaysHabits().sort((a: any, b: any) => {
    // Sort by reminder_time (habits with time come first, sorted by time)
    const aTime = a.reminder_time || ''
    const bTime = b.reminder_time || ''
    
    // If both have times, sort by time
    if (aTime && bTime) {
      return aTime.localeCompare(bTime)
    }
    // If only one has time, it comes first
    if (aTime && !bTime) return -1
    if (!aTime && bTime) return 1
    
    // If neither has time, keep original order
    return 0
  })

  // Goals removed - no goal sorting needed

  // Goals removed - no goal step preloading needed

  // Load steps for goal detail page when it's opened
  useEffect(() => {
    if (mainPanelSection?.startsWith('goal-')) {
      const goalId = mainPanelSection.replace('goal-', '')
      // Goals removed - no goal lookup
      const goal = null
      
      if (goal && goalId && !stepsCacheRef.current[goalId]?.loaded) {
        // Load steps for this goal
        const loadSteps = async () => {
          try {
            const stepsResponse = await fetch(`/api/daily-steps?goalId=${goalId}`)
            if (stepsResponse.ok) {
              const stepsData = await stepsResponse.json()
              const stepsArray = Array.isArray(stepsData) ? stepsData : []
              stepsCacheRef.current[goalId] = { data: stepsArray, loaded: true }
              // Trigger reactivity
              setStepsCacheVersion((prev: Record<string, number>) => ({ ...prev, [goalId]: (prev[goalId] || 0) + 1 }))
        }
      } catch (error) {
            console.error(`Error loading steps for goal ${goalId}:`, error)
          }
        }
        
        loadSteps()
      }
            }
  }, [mainPanelSection])

  // Update goal detail page state when goal changes
  useEffect(() => {
    if (mainPanelSection?.startsWith('goal-')) {
      // Goals removed - no goal detail to load
    }
  }, [mainPanelSection])

  // Update area detail page state when area changes
  useEffect(() => {
    if (mainPanelSection?.startsWith('area-')) {
      const areaId = mainPanelSection.replace('area-', '')
      const area = areas.find(a => a.id === areaId)
      
      if (area) {
        // Only update if not currently editing to avoid interrupting user input
        if (!editingAreaDetailTitle) {
          setAreaDetailTitleValue(area.name)
        }
        if (!editingAreaDetailDescription) {
          setAreaDetailDescriptionValue(area.description || '')
        }
        // Always close pickers when area changes
        setShowAreaDetailIconPicker(false)
        setShowAreaDetailColorPicker(false)
      }
    }
  }, [mainPanelSection, areas, editingAreaDetailTitle, editingAreaDetailDescription])



  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10, // User must drag at least 10px before drag starts
        delay: 100, // Wait 100ms before allowing drag to start (allows clicks)
        tolerance: 5, // Allow 5px tolerance for mouse movement during delay
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Goals removed - no goal drag handling needed
  const handleDragEnd = (event: any) => {
    // Goals removed - no drag handling
  }

  // GoalEditingForm has been extracted to ./journey/GoalEditingForm.tsx

  // Get status color function
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  // Calculate stats
  const todayStr = getLocalDateString()
  const completedSteps = dailySteps.filter(step => step.completed).length
  const totalSteps = dailySteps.length
  
  // Calculate completed habits for today
  const completedHabits = todaysHabits.filter(habit => {
    return habit.habit_completions && habit.habit_completions[todayStr] === true
  }).length
  const totalHabits = todaysHabits.length
  
  // Calculate progress percentage from both habits and steps
  const totalTasks = totalHabits + totalSteps
  const completedTasks = completedHabits + completedSteps
  const progressPercentage = totalTasks > 0 ? Math.min(Math.round((completedTasks / totalTasks) * 100), 100) : 0
  
  const completedGoals = 0 // Goals removed
  const activeHabits = completedHabits

  // Get current day and time
  const currentDay = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % 365 + 1
  const currentHour = new Date().getHours()
  const timeOfDay = currentHour < 6 ? 'night' : currentHour < 12 ? 'morning' : currentHour < 18 ? 'afternoon' : 'evening'

  // Calculate statistics
  const totalXp = useMemo(() => {
    let xp = 0
    // XP from completed daily steps
    dailySteps.forEach(step => {
      if (step.completed && step.xp_reward) {
        xp += step.xp_reward
      }
    })
    // XP from completed habits
    habits.forEach(habit => {
      if (habit.habit_completions) {
        Object.values(habit.habit_completions).forEach(completed => {
          if (completed && habit.xp_reward) {
            xp += habit.xp_reward
          }
        })
      }
    })
    return xp
  }, [dailySteps, habits])

  // Calculate login streak (days in a row with activity)
  const loginStreak = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let streak = 0
    let checkDate = new Date(today)
    
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0]
      // Check if there was activity (completed habit or step) on this date
      const hasActivity = habits.some(habit => habit.habit_completions?.[dateStr]) ||
                         dailySteps.some(step => {
                           const stepDate = step.date ? new Date(step.date).toISOString().split('T')[0] : null
                           return stepDate === dateStr && step.completed
                         })
      
      if (hasActivity) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }
    
    return streak
  }, [habits, dailySteps])

  // Total completed habits
  const totalCompletedHabits = useMemo(() => {
    let count = 0
    habits.forEach(habit => {
      if (habit.habit_completions) {
        count += Object.values(habit.habit_completions).filter(completed => completed === true).length
      }
    })
    return count
  }, [habits])

  // Total completed steps
  const totalCompletedSteps = dailySteps.filter(step => step.completed).length

  // Total completed goals
  const totalCompletedGoals = 0 // Goals removed

  // Check for pending workflows
  useEffect(() => {
    if (!player?.user_id) return

    const checkPendingWorkflows = async () => {
      try {
        const response = await fetch(`/api/workflows/pending?userId=${player.user_id}`)
        if (response.ok) {
          const pending = await response.json()
          if (pending.length > 0 && !pendingWorkflow) {
            // Show first pending workflow as program
            setPendingWorkflow(pending[0])
            // Keep current program, workflow will show as overlay
          } else if (pending.length === 0 && pendingWorkflow) {
            // No pending workflows, clear workflow
            setPendingWorkflow(null)
          }
        }
      } catch (error) {
        console.error('Error checking pending workflows:', error)
      }
    }

    // Check immediately
    checkPendingWorkflows()

    // Check every minute for new workflows
    const interval = setInterval(checkPendingWorkflows, 60000)
    return () => clearInterval(interval)
  }, [player, pendingWorkflow, currentProgram])

  // Handle workflow completion
  const handleWorkflowComplete = async (workflowId: string, xp: number) => {
    try {
      // Add XP to player
      if (player?.id) {
        const response = await fetch('/api/player', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: player.id,
            xp: (player.xp || 0) + xp,
            experience: (player.experience || 0) + xp
          })
        })
        if (response.ok) {
          const updatedPlayer = await response.json()
          // Update player in parent if callback exists
        }
      }

      // Hide workflow
      setPendingWorkflow(null)
    } catch (error) {
      console.error('Error completing workflow:', error)
    }
  }

  // Handle workflow skip
  const handleWorkflowSkip = async (workflowId: string) => {
    try {
      // Mark as skipped (completed_at = null but don't give XP)
      await fetch(`/api/workflows/${workflowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed_at: null })
      })

      // Hide workflow
      setPendingWorkflow(null)
    } catch (error) {
      console.error('Error skipping workflow:', error)
    }
  }

  // Handle goal progress update from workflow
  const handleGoalProgressUpdate = async (goalId: string, progress: number) => {
    try {
      const response = await fetch('/api/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId,
          progressPercentage: progress
        })
      })
      if (response.ok) {
        const updatedGoal = await response.json()
        // Goals removed - no goals to update
      }
    } catch (error) {
      console.error('Error updating goal progress:', error)
    }
  }

  // DraggableStep has been extracted to ./journey/DraggableStep.tsx

  // DroppableColumn has been extracted to ./journey/DroppableColumn.tsx

  // renderGoalsContent has been removed - now using GoalsManagementView component
  // The old renderGoalsContent function has been removed as it was dead code (not used anywhere)
  // renderHabitsContent removed - now in HabitsManagementView

  // Refs and state for habit detail page timeline (must be at top level)
  const habitDetailTimelineContainerRef = useRef<HTMLDivElement>(null)
  const [habitDetailVisibleDays, setHabitDetailVisibleDays] = useState<Record<string, number>>({})
  
  // Calculate visible days for habit detail timeline
  useEffect(() => {
    const calculateVisibleDays = (habitId: string) => {
      if (habitDetailTimelineContainerRef.current) {
        const containerWidth = habitDetailTimelineContainerRef.current.offsetWidth
        const daysThatFit = Math.floor(containerWidth / 36)
        setHabitDetailVisibleDays(prev => ({
          ...prev,
          [habitId]: Math.max(7, daysThatFit)
        }))
      }
    }
    
    // Only calculate if we're on a habit detail page
    if (mainPanelSection?.startsWith('habit-')) {
      const habitId = mainPanelSection.replace('habit-', '')
      calculateVisibleDays(habitId)
      window.addEventListener('resize', () => calculateVisibleDays(habitId))
      return () => window.removeEventListener('resize', () => calculateVisibleDays(habitId))
    }
  }, [mainPanelSection])

  // renderHabitsPage has been extracted to ./views/HabitsPage.tsx
  // renderPageContent has been extracted to ./pages/PageContent.tsx

  return (
    <div className="bg-primary-50 h-screen w-full flex flex-col overflow-hidden" style={{
      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: '14px',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.04)'
    }}>
      <HeaderNavigation
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        mainPanelSection={mainPanelSection}
        setMainPanelSection={setMainPanelSection}
        topMenuItems={topMenuItems}
        totalXp={totalXp}
        loginStreak={loginStreak}
        totalCompletedSteps={totalCompletedSteps}
        totalCompletedHabits={totalCompletedHabits}
        mobileTopMenuOpen={mobileTopMenuOpen}
        setMobileTopMenuOpen={setMobileTopMenuOpen}
      />

      {/* Main Content Area */}
      <div 
        className="relative flex flex-1 overflow-hidden min-h-0"
        style={assistantSmallScreen && assistantMinimized && typeof window !== 'undefined' && window.innerWidth >= 640 ? { paddingRight: '48px' } : undefined}
      >
        <div className="flex-1 min-w-0 overflow-hidden h-full">
          <PageContent
          currentPage={currentPage}
          mainPanelSection={mainPanelSection}
          setMainPanelSection={setMainPanelSection}
          selectedItem={selectedItem}
          selectedItemType={selectedItemType}
          habits={habits}
          dailySteps={localDailySteps}
          isLoadingSteps={isLoadingSteps}
          player={player}
          userId={userId}
          areas={areas}
          onAreasUpdate={setAreas}
          editingStepTitle={editingStepTitle}
          setEditingStepTitle={setEditingStepTitle}
          stepTitle={stepTitle}
          setStepTitle={setStepTitle}
          stepDescription={stepDescription}
          setStepDescription={setStepDescription}
          showTimeEditor={showTimeEditor}
          setShowTimeEditor={setShowTimeEditor}
          stepEstimatedTime={stepEstimatedTime}
          setStepEstimatedTime={setStepEstimatedTime}
          showDatePicker={showDatePicker}
          setShowDatePicker={setShowDatePicker}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          stepIsImportant={stepIsImportant}
          setStepIsImportant={setStepIsImportant}
          stepIsUrgent={stepIsUrgent}
          setStepIsUrgent={setStepIsUrgent}
          showStepGoalPicker={showStepGoalPicker}
          setShowStepGoalPicker={setShowStepGoalPicker}
          stepGoalId={stepGoalId}
          setStepGoalId={setStepGoalId}
          habitDetailTab={habitDetailTab}
          setHabitDetailTab={setHabitDetailTab}
          currentMonth={currentMonth}
          setCurrentMonth={setCurrentMonth}
          editingHabitName={editingHabitName}
          setEditingHabitName={setEditingHabitName}
          editingHabitDescription={editingHabitDescription}
          setEditingHabitDescription={setEditingHabitDescription}
          editingHabitFrequency={editingHabitFrequency}
          setEditingHabitFrequency={setEditingHabitFrequency}
          editingHabitSelectedDays={editingHabitSelectedDays}
          setEditingHabitSelectedDays={setEditingHabitSelectedDays}
          editingHabitCategory={editingHabitCategory}
          setEditingHabitCategory={setEditingHabitCategory}
          editingHabitDifficulty={editingHabitDifficulty}
          setEditingHabitDifficulty={setEditingHabitDifficulty}
          editingHabitReminderTime={editingHabitReminderTime}
          setEditingHabitReminderTime={setEditingHabitReminderTime}
          handleCloseDetail={handleCloseDetail}
          handleToggleStepCompleted={handleToggleStepCompleted}
          handleSaveStep={handleSaveStep}
          handleRescheduleStep={handleRescheduleStep}
          handleHabitCalendarToggle={handleHabitCalendarToggle}
          handleUpdateGoalForDetail={handleUpdateGoalForDetail}
          handleDeleteGoalForDetail={handleDeleteGoalForDetail}
          setSelectedItem={setSelectedItem}
          onHabitsUpdate={onHabitsUpdate}
          stepsCacheRef={stepsCacheRef}
          setStepsCacheVersion={setStepsCacheVersion}
          completedSteps={completedSteps}
          activeHabits={activeHabits}
          completedGoals={completedGoals}
          progressPercentage={progressPercentage}
          handleItemClick={handleItemClick}
          handleHabitToggle={handleHabitToggle}
          handleStepToggle={handleStepToggle}
          loadingHabits={loadingHabits}
          loadingSteps={loadingSteps}
          animatingSteps={animatingSteps}
          onOpenStepModal={handleOpenStepModal}
          onNavigateToHabits={onNavigateToHabits}
          onNavigateToSteps={onNavigateToSteps}
          onStepDateChange={handleStepDateChange}
          onStepTimeChange={handleStepTimeChange}
          onStepImportantChange={handleStepImportantChange}
          handleCreateGoal={handleCreateGoal}
          handleOpenStepModal={handleOpenStepModal}
          handleOpenHabitModal={handleOpenHabitModal}
          expandedAreas={expandedAreas}
          setExpandedAreas={setExpandedAreas}
          expandedGoalSections={expandedGoalSections}
          setExpandedGoalSections={setExpandedGoalSections}
          handleOpenAreasManagementModal={handleOpenAreasManagementModal}
          handleOpenAreaEditModal={handleOpenAreaEditModal}
          handleDeleteArea={handleDeleteArea}
          handleDeleteAreaConfirm={handleDeleteAreaConfirm}
          showDeleteAreaModal={showDeleteAreaModal}
          setShowDeleteAreaModal={setShowDeleteAreaModal}
          setAreaToDelete={setAreaToDelete}
          deleteAreaWithRelated={deleteAreaWithRelated}
          setDeleteAreaWithRelated={setDeleteAreaWithRelated}
          isDeletingArea={isDeletingArea}
          setIsDeletingArea={setIsDeletingArea}
          handleUpdateAreaForDetail={handleUpdateAreaForDetail}
          showAreaDetailIconPicker={showAreaDetailIconPicker}
          areaDetailIconPickerPosition={areaDetailIconPickerPosition}
          setShowAreaDetailIconPicker={setShowAreaDetailIconPicker}
          iconSearchQuery={iconSearchQuery}
          setIconSearchQuery={setIconSearchQuery}
          showAreaDetailColorPicker={showAreaDetailColorPicker}
          areaDetailColorPickerPosition={areaDetailColorPickerPosition}
          setAreaDetailColorPickerPosition={setAreaDetailColorPickerPosition}
          setShowAreaDetailColorPicker={setShowAreaDetailColorPicker}
          areaDetailTitleValue={areaDetailTitleValue}
          setAreaDetailTitleValue={setAreaDetailTitleValue}
          editingAreaDetailTitle={editingAreaDetailTitle}
          setEditingAreaDetailTitle={setEditingAreaDetailTitle}
          areaDetailDescriptionValue={areaDetailDescriptionValue}
          setAreaDetailDescriptionValue={setAreaDetailDescriptionValue}
          editingAreaDetailDescription={editingAreaDetailDescription}
          setEditingAreaDetailDescription={setEditingAreaDetailDescription}
          areaIconRef={areaIconRef}
          areaTitleRef={areaTitleRef}
          areaDescriptionRef={areaDescriptionRef}
          areaColorRef={areaColorRef}
          setAreaDetailIconPickerPosition={setAreaDetailIconPickerPosition}
          habitsRef={habitsRef}
          stepsRef={stepsRef}
          handleWorkflowComplete={handleWorkflowComplete}
          handleWorkflowSkip={handleWorkflowSkip}
          handleGoalProgressUpdate={handleGoalProgressUpdate}
          pendingWorkflow={pendingWorkflow}
          setCurrentPage={setCurrentPage}
          // Goal detail page props
          goalDetailTitleValue={goalDetailTitleValue}
          setGoalDetailTitleValue={setGoalDetailTitleValue}
          editingGoalDetailTitle={editingGoalDetailTitle}
          setEditingGoalDetailTitle={setEditingGoalDetailTitle}
          goalDetailDescriptionValue={goalDetailDescriptionValue}
          setGoalDetailDescriptionValue={setGoalDetailDescriptionValue}
          editingGoalDetailDescription={editingGoalDetailDescription}
          setEditingGoalDetailDescription={setEditingGoalDetailDescription}
          showGoalDetailDatePicker={showGoalDetailDatePicker}
          setShowGoalDetailDatePicker={setShowGoalDetailDatePicker}
          goalDetailDatePickerPosition={goalDetailDatePickerPosition}
          setGoalDetailDatePickerPosition={setGoalDetailDatePickerPosition}
          goalDetailDatePickerMonth={goalDetailDatePickerMonth}
          setGoalDetailDatePickerMonth={setGoalDetailDatePickerMonth}
          selectedGoalDate={selectedGoalDate}
          setSelectedGoalDate={setSelectedGoalDate}
          showGoalDetailStartDatePicker={showGoalDetailStartDatePicker}
          setShowGoalDetailStartDatePicker={setShowGoalDetailStartDatePicker}
          goalDetailStartDatePickerPosition={goalDetailStartDatePickerPosition}
          setGoalDetailStartDatePickerPosition={setGoalDetailStartDatePickerPosition}
          goalDetailStartDatePickerMonth={goalDetailStartDatePickerMonth}
          setGoalDetailStartDatePickerMonth={setGoalDetailStartDatePickerMonth}
          selectedGoalStartDate={selectedGoalStartDate}
          setSelectedGoalStartDate={setSelectedGoalStartDate}
          showGoalDetailStatusPicker={showGoalDetailStatusPicker}
          setShowGoalDetailStatusPicker={setShowGoalDetailStatusPicker}
          goalDetailStatusPickerPosition={goalDetailStatusPickerPosition}
          setGoalDetailStatusPickerPosition={setGoalDetailStatusPickerPosition}
          showGoalDetailAreaPicker={showGoalDetailAreaPicker}
          setShowGoalDetailAreaPicker={setShowGoalDetailAreaPicker}
          goalDetailAreaPickerPosition={goalDetailAreaPickerPosition}
          setGoalDetailAreaPickerPosition={setGoalDetailAreaPickerPosition}
          showGoalDetailIconPicker={showGoalDetailIconPicker}
          setShowGoalDetailIconPicker={setShowGoalDetailIconPicker}
          goalDetailIconPickerPosition={goalDetailIconPickerPosition}
          setGoalDetailIconPickerPosition={setGoalDetailIconPickerPosition}
          showDeleteGoalModal={showDeleteGoalModal}
          setShowDeleteGoalModal={setShowDeleteGoalModal}
          deleteGoalWithSteps={deleteGoalWithSteps}
          setDeleteGoalWithSteps={setDeleteGoalWithSteps}
          isDeletingGoal={isDeletingGoal}
          setIsDeletingGoal={setIsDeletingGoal}
          goalIconRef={goalIconRef}
          goalTitleRef={goalTitleRef}
          goalDescriptionRef={goalDescriptionRef}
          goalDateRef={goalDateRef}
          goalStartDateRef={goalStartDateRef}
          goalStatusRef={goalStatusRef}
          goalAreaRef={goalAreaRef}
          selectedDayDate={selectedDayDate}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          setSelectedDayDate={setSelectedDayDate}
          setShowDatePickerModal={setShowDatePickerModal}
          setSelectedItemType={setSelectedItemType}
          showStepModal={showStepModal}
          setShowStepModal={setShowStepModal}
          stepModalData={stepModalData}
          setStepModalData={setStepModalData}
          stepsCacheVersion={stepsCacheVersion}
          habitsPageVisibleDays={habitsPageVisibleDays}
          setHabitsPageVisibleDays={setHabitsPageVisibleDays}
          habitsPageTimelineOffset={habitsPageTimelineOffset}
          setHabitsPageTimelineOffset={setHabitsPageTimelineOffset}
          showCreateMenu={showCreateMenu}
          setShowCreateMenu={setShowCreateMenu}
          createMenuButtonRef={createMenuButtonRef}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          createMenuRef={createMenuRef}
          goalsSectionRef={goalsSectionRef}
          areaButtonRefs={areaButtonRefs.current}
          goalButtonRefs={goalButtonRefs.current}
          onGoalClick={(goalId: string) => {
            setMainPanelSection(`goal-${goalId}`)
          }}
        />
        </div>

        {/* Assistant Panel - Temporarily hidden */}
        {false && (
        <AssistantPanel
          currentPage={currentPage}
          mainPanelSection={mainPanelSection}
          userId={userId || player?.user_id || null}
            sidebarCollapsed={sidebarCollapsed}
            onOpenStepModal={mainPanelSection === 'focus-upcoming' || mainPanelSection?.startsWith('area-') || mainPanelSection?.startsWith('goal-') ? () => {
              // For inline mode (focus-upcoming, area-*, goal-*), trigger inline creation via custom event
              // PageContent listens for this event and increments createNewStepTriggerForSection
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('triggerInlineStepCreation', {
                  detail: { section: mainPanelSection }
                }))
              }
            } : handleOpenStepModal}
          onNavigateToGoal={(goalId: string) => {
            setMainPanelSection(`goal-${goalId}`)
          }}
          onNavigateToArea={(areaId: string) => {
            setMainPanelSection(`area-${areaId}`)
          }}
          onNavigateToHabits={(habitId?: string) => {
            setCurrentPage('habits')
            if (habitId) {
              setMainPanelSection(`habit-${habitId}`)
            }
          }}
          onOpenHabitModal={handleOpenHabitModal}
          onOpenAreasManagementModal={handleOpenAreasManagementModal}
          onCreateGoal={handleCreateGoal}
          onMinimizeStateChange={(isMinimized, isSmallScreen) => {
            setAssistantMinimized(isMinimized)
            setAssistantSmallScreen(isSmallScreen)
          }}
        />
        )}
      </div>

      {/* Date Picker Modal */}
      <DatePickerModal
        show={showDatePickerModal}
        onClose={() => setShowDatePickerModal(false)}
        currentProgram={currentProgram}
        selectedDayDate={selectedDayDate}
        setSelectedDayDate={setSelectedDayDate}
        selectedWeek={selectedWeek}
        setSelectedWeek={setSelectedWeek}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
      />

      <StepModal
        show={showStepModal}
        stepModalData={stepModalData}
        onClose={() => {
          setShowStepModal(false)
          setStepModalData({
            id: null,
            title: '',
            description: '',
            date: '',
            areaId: '',
            completed: false,
            is_important: false,
            is_urgent: false,
            deadline: '',
            estimated_time: 0,
            checklist: [],
            require_checklist_complete: false,
            isRepeating: false,
            frequency: null,
            selected_days: [],
            recurring_start_date: null,
            recurring_end_date: null,
            recurring_display_mode: 'next_only'
          })
        }}
        onSave={handleSaveStepModal}
        onDelete={async () => {
          if (stepModalData.id) {
            handleDeleteStep(stepModalData.id)
          }
        }}
        onFinishRecurring={handleFinishRecurringStep}
        isSaving={stepModalSaving}
        areas={areas}
        userId={userId}
        player={player}
        dailySteps={localDailySteps}
        onDailyStepsUpdate={onDailyStepsUpdate}
        selectedItem={selectedItem}
        setSelectedItem={setSelectedItem}
        stepsCacheRef={stepsCacheRef}
        setStepsCacheVersion={setStepsCacheVersion}
        checklistSaving={checklistSaving}
        setChecklistSaving={setChecklistSaving}
        checklistSaveTimeoutRef={checklistSaveTimeoutRef}
        lastAddedChecklistItemId={lastAddedChecklistItemId}
        setLastAddedChecklistItemId={setLastAddedChecklistItemId}
        setStepModalData={setStepModalData}
      />

      <DeleteStepModal
        show={showDeleteStepModal}
        stepTitle={stepModalData.title || ''}
        isDeleting={isDeletingStep}
        onClose={() => setShowDeleteStepModal(false)}
        onConfirm={handleConfirmDeleteStep}
        isRecurring={stepModalData.frequency !== null && stepModalData.frequency !== undefined}
      />

      <HabitModal
        show={showHabitModal}
        habitModalData={habitModalData}
        onClose={() => {
          setShowHabitModal(false)
          setHabitModalData(null)
        }}
        onSave={handleSaveHabitModal}
        onDelete={handleDeleteHabit}
        isSaving={habitModalSaving}
        areas={areas}
        editingHabitName={editingHabitName}
        setEditingHabitName={setEditingHabitName}
        editingHabitDescription={editingHabitDescription}
        setEditingHabitDescription={setEditingHabitDescription}
        editingHabitFrequency={editingHabitFrequency}
        setEditingHabitFrequency={setEditingHabitFrequency}
        editingHabitSelectedDays={editingHabitSelectedDays}
        setEditingHabitSelectedDays={setEditingHabitSelectedDays}
        editingHabitMonthlyType={editingHabitMonthlyType}
        setEditingHabitMonthlyType={setEditingHabitMonthlyType}
        editingHabitWeekdayInMonthSelections={editingHabitWeekdayInMonthSelections}
        setEditingHabitWeekdayInMonthSelections={setEditingHabitWeekdayInMonthSelections}
        editingHabitAutoAdjust31={editingHabitAutoAdjust31}
        setEditingHabitAutoAdjust31={setEditingHabitAutoAdjust31}
        editingHabitReminderTime={editingHabitReminderTime}
        setEditingHabitReminderTime={setEditingHabitReminderTime}
        editingHabitNotificationEnabled={editingHabitNotificationEnabled}
        setEditingHabitNotificationEnabled={setEditingHabitNotificationEnabled}
        editingHabitAreaId={editingHabitAreaId}
        setEditingHabitAreaId={setEditingHabitAreaId}
        editingHabitMonthWeek={editingHabitMonthWeek}
        setEditingHabitMonthWeek={setEditingHabitMonthWeek}
        editingHabitMonthDay={editingHabitMonthDay}
        setEditingHabitMonthDay={setEditingHabitMonthDay}
        editingHabitIcon={editingHabitIcon}
        setEditingHabitIcon={setEditingHabitIcon}
      />

      {/* Areas Management Modal */}
      <AreasManagementModal
        show={showAreasManagementModal}
        onClose={() => setShowAreasManagementModal(false)}
        areas={areas}
        dailySteps={localDailySteps}
        habits={habits}
        onEditArea={handleOpenAreaEditModal}
        onDeleteArea={handleDeleteArea}
      />

      <AreaEditModal
        show={showAreaEditModal}
        onClose={() => {
          setShowAreaEditModal(false)
          setEditingArea(null)
        }}
        editingArea={editingArea}
        areaModalName={areaModalName}
        setAreaModalName={setAreaModalName}
        areaModalDescription={areaModalDescription}
        setAreaModalDescription={setAreaModalDescription}
        areaModalColor={areaModalColor}
        setAreaModalColor={setAreaModalColor}
        areaModalIcon={areaModalIcon}
        setAreaModalIcon={setAreaModalIcon}
        showAreaIconPicker={showAreaIconPicker}
        setShowAreaIconPicker={setShowAreaIconPicker}
        isSavingArea={isSavingArea}
          onSave={handleSaveArea}
      />

      <DeleteHabitModal
        show={showDeleteHabitModal && !!habitModalData}
        habitName={habitModalData?.name || ''}
        isDeleting={isDeletingHabit}
        onClose={() => {
          setShowDeleteHabitModal(false)
          setHabitToDelete(null)
        }}
        onConfirm={handleConfirmDeleteHabit}
      />

      {/* Onboarding Tutorial */}
    </div>
  )
}
