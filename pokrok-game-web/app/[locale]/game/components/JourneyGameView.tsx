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
import { Footprints, Calendar, Target, CheckCircle, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Edit, Trash2, Plus, Clock, Star, Zap, Check, Settings, HelpCircle, LayoutDashboard, Sparkles, CheckSquare, Menu, Moon, Search, Flame, Trophy } from 'lucide-react'
import { DailyReviewWorkflow } from './DailyReviewWorkflow'
import { CalendarProgram } from './CalendarProgram'
import { getIconEmoji, getIconComponent, AVAILABLE_ICONS } from '@/lib/icon-utils'
import { getLocalDateString, normalizeDate } from './utils/dateHelpers'
import { ManagementPage } from './pages/ManagementPage'
import { UnifiedDayView } from './views/UnifiedDayView'
import { FocusManagementView } from './views/FocusManagementView'
import { HelpView } from './views/HelpView'
import { GoalsManagementView } from './views/GoalsManagementView'
import { HabitsManagementView } from './views/HabitsManagementView'
import { StepsManagementView } from './views/StepsManagementView'
import { TodayFocusSection } from './views/TodayFocusSection'

interface JourneyGameViewProps {
  player?: any
  userId?: string | null
  goals?: any[]
  habits?: any[]
  dailySteps?: any[]
  onNavigateToGoals?: () => void
  onNavigateToHabits?: () => void
  onNavigateToSteps?: () => void
  onNavigateToDailyPlan?: () => void
  onNavigateToStatistics?: () => void
  onNavigateToAchievements?: () => void
  onNavigateToSettings?: () => void
  onHabitsUpdate?: (habits: any[]) => void
  onGoalsUpdate?: (goals: any[]) => void
  onDailyStepsUpdate?: (steps: any[]) => void
}

export function JourneyGameView({ 
  player, 
  userId: userIdProp,
  goals = [], 
  habits = [], 
  dailySteps = [],
  onNavigateToGoals,
  onNavigateToHabits,
  onNavigateToSteps,
  onNavigateToDailyPlan,
  onNavigateToStatistics,
  onNavigateToAchievements,
  onNavigateToSettings,
  onHabitsUpdate,
  onGoalsUpdate,
  onDailyStepsUpdate
}: JourneyGameViewProps) {
  const t = useTranslations()
  const locale = useLocale()
  const localeCode = locale === 'cs' ? 'cs-CZ' : 'en-US'
  
  // Top menu items (Goals, Habits, Steps) - defined at top level for use in header
  const topMenuItems = [
    { id: 'goals' as const, label: t('navigation.goals'), icon: Target },
    { id: 'habits' as const, label: t('navigation.habits'), icon: CheckSquare },
    { id: 'steps' as const, label: t('navigation.steps'), icon: Footprints },
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
        console.log('Loading userId for Clerk ID:', user.id)
        const response = await fetch(`/api/user?clerkId=${user.id}`)
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

  const [currentPage, setCurrentPage] = useState<'main' | 'statistics' | 'achievements' | 'settings' | 'help'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedPage = localStorage.getItem('journeyGame_currentPage')
        if (savedPage && ['main', 'statistics', 'achievements', 'settings', 'help'].includes(savedPage)) {
          return savedPage as 'main' | 'statistics' | 'achievements' | 'settings' | 'help'
        }
      } catch (error) {
        console.error('Error loading currentPage:', error)
      }
    }
    return 'main'
  })
  
  // Navigation within main panel - now supports goal IDs (e.g., 'goal-{id}')
  const [mainPanelSection, setMainPanelSection] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedSection = localStorage.getItem('journeyGame_mainPanelSection')
        if (savedSection) {
          return savedSection
        }
      } catch (error) {
        console.error('Error loading mainPanelSection:', error)
      }
    }
    return 'overview'
  })
  
  // Selected goal ID (extracted from mainPanelSection if it's a goal)
  const selectedGoalId = mainPanelSection.startsWith('goal-') ? mainPanelSection.replace('goal-', '') : null
  
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
  const [currentManagementProgram, setCurrentManagementProgram] = useState<'goals' | 'habits' | 'steps'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedManagementProgram = localStorage.getItem('journeyGame_currentManagementProgram')
        if (savedManagementProgram && ['goals', 'habits', 'steps'].includes(savedManagementProgram)) {
          return savedManagementProgram as 'goals' | 'habits' | 'steps'
        }
      } catch (error) {
        console.error('Error loading currentManagementProgram:', error)
      }
    }
    return 'goals'
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

  // Save navigation state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('journeyGame_currentPage', currentPage)
      localStorage.setItem('journeyGame_currentProgram', currentProgram)
      localStorage.setItem('journeyGame_currentManagementProgram', currentManagementProgram)
      localStorage.setItem('journeyGame_mainPanelSection', mainPanelSection)
      localStorage.setItem('journeyGame_sidebarCollapsed', sidebarCollapsed.toString())
    } catch (error) {
      console.error('Error saving navigation state:', error)
    }
  }, [currentPage, currentProgram, currentManagementProgram, mainPanelSection, sidebarCollapsed])

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
    goalId: '',
    completed: false,
    is_important: false,
    is_urgent: false,
    deadline: '',
    estimated_time: 0,
    checklist: [] as Array<{ id: string; title: string; completed: boolean }>,
    require_checklist_complete: false
  })
  const [checklistSaving, setChecklistSaving] = useState(false)
  const checklistSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [stepModalSaving, setStepModalSaving] = useState(false)
  const [habitModalSaving, setHabitModalSaving] = useState(false)
  const [showHabitModal, setShowHabitModal] = useState(false)
  const [habitModalData, setHabitModalData] = useState<any>(null)
  const [selectedDayDate, setSelectedDayDate] = useState<Date>(new Date()) // Currently displayed day in day view
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear()) // Currently displayed year in year view
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date()) // Currently displayed month in month view
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date()) // Currently displayed week in week view
  const [showDatePickerModal, setShowDatePickerModal] = useState<boolean>(false) // Show date picker modal for navigation
  const [expandedLeftSection, setExpandedLeftSection] = useState<'goals' | null>(null)
  const [expandedRightSection, setExpandedRightSection] = useState<'habits' | 'steps' | null>(null)
  const [leftSectionHeights, setLeftSectionHeights] = useState({ goals: 0 })
  const [rightSectionHeights, setRightSectionHeights] = useState({ habits: 0, steps: 0 })
  const [leftSidebarWidth, setLeftSidebarWidth] = useState<'288px' | '48px' | '0px'>('288px')
  const [rightSidebarWidth, setRightSidebarWidth] = useState<'288px' | '48px' | '0px'>('288px')
  const [expandedAreas, setExpandedAreas] = useState<Set<string | null>>(new Set())
  const [pendingWorkflow, setPendingWorkflow] = useState<any>(null)
  
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
  const [showGoalDetailStatusPicker, setShowGoalDetailStatusPicker] = useState(false)
  const [goalDetailStatusPickerPosition, setGoalDetailStatusPickerPosition] = useState<{ top: number; left: number } | null>(null)
  const [expandedSidebarSections, setExpandedSidebarSections] = useState<Set<'paused' | 'completed'>>(new Set())
  const [showGoalDetailIconPicker, setShowGoalDetailIconPicker] = useState(false)
  const [goalDetailIconPickerPosition, setGoalDetailIconPickerPosition] = useState<{ top: number; left: number } | null>(null)
  const [iconSearchQuery, setIconSearchQuery] = useState('')
  const [showDeleteGoalModal, setShowDeleteGoalModal] = useState(false)
  const [deleteGoalWithSteps, setDeleteGoalWithSteps] = useState(false)
  const [isDeletingGoal, setIsDeletingGoal] = useState(false)
  const [showCreateMenu, setShowCreateMenu] = useState(false)
  const createMenuButtonRef = useRef<HTMLButtonElement>(null)
  const goalTitleRef = useRef<HTMLInputElement | HTMLHeadingElement>(null)
  const goalDescriptionRef = useRef<HTMLTextAreaElement | HTMLParagraphElement>(null)
  const goalDateRef = useRef<HTMLSpanElement>(null)
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
      const goal = goals.find((g: any) => g.id === quickEditGoalId)
      if (goal) {
        const initialDate = goal.target_date ? new Date(goal.target_date) : new Date()
        setSelectedDateForGoal(initialDate)
      }
    }
  }, [quickEditGoalField, quickEditGoalId, goals])
  
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
    try {
      let newState: boolean | null = null
      
      // Determine new state based on current state and whether habit is scheduled for this day
      if (currentState === 'completed') {
        if (isScheduled) {
          newState = false // Scheduled + completed -> missed
        } else {
          newState = null // Not scheduled + completed -> not scheduled (remove completion)
        }
      } else if (currentState === 'missed') {
        newState = true // Missed -> completed
      } else if (currentState === 'planned') {
        newState = true // Planned -> completed
      } else if (currentState === 'not-scheduled') {
        newState = true // Not scheduled -> completed
      } else if (currentState === 'today') {
        // For today, cycle between completed and original state
        const habitCompletions = (habitModalData || selectedItem)?.habit_completions || {}
        const isCompletedToday = habitCompletions[date] === true
        if (isCompletedToday) {
          newState = null // Completed today -> back to original state (planned/not-scheduled)
        } else {
          newState = true // Not completed today -> completed
        }
      } else {
        newState = true // Default to completed
      }
      
      console.log('Calendar toggle:', { habitId, date, currentState, newState })
      
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
      
      console.log('Calendar response:', response.status, response.ok)
      
      if (response.ok) {
        // Update the habit in state via callback
        if (onHabitsUpdate) {
          // Refresh habits from server
          const habitsResponse = await fetch('/api/habits')
          if (habitsResponse.ok) {
            const updatedHabits = await habitsResponse.json()
            console.log('Debug - updated habits from server:', updatedHabits)
            console.log('Debug - Studená sprcha from server:', updatedHabits.find((h: any) => h.name === 'Studená sprcha'))
            console.log('Debug - Studená sprcha habit_completions from server:', updatedHabits.find((h: any) => h.name === 'Studená sprcha')?.habit_completions)
            onHabitsUpdate(updatedHabits)
            
            // Update habit modal data if it's the same habit
            if (habitModalData && habitModalData.id === habitId) {
              const freshHabit = updatedHabits.find((h: any) => h.id === habitId)
              if (freshHabit) {
                setHabitModalData(freshHabit)
              }
            }
          }
        }
        
        // Update selected item if it's the same habit
        if (selectedItem && selectedItem.id === habitId) {
          const updatedCompletions = {
            ...selectedItem.habit_completions,
            [date]: newState
          }
          setSelectedItem({
            ...selectedItem,
            habit_completions: updatedCompletions
          })
        }
        
      } else {
        const errorText = await response.text()
        console.error('Failed to update habit calendar:', response.status, errorText)
      }
    } catch (error) {
      console.error('Error updating habit calendar:', error)
    }
  }

  const handleStepToggle = async (stepId: string, completed: boolean) => {
    // Check if we're on goal detail page or in Focus section
    const isGoalDetailPage = selectedGoalId !== null
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
              completedAt: completed ? new Date().toISOString() : null
            }),
          })

          if (response.ok) {
            const updatedStep = await response.json()
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
            // Update cache for the goal to force re-render
            if (updatedStep.goal_id) {
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
        const response = await fetch('/api/daily-steps', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            stepId: stepId,
            completed: completed,
            completedAt: completed ? new Date().toISOString() : null
          }),
        })

          if (response.ok) {
            const updatedStep = await response.json()
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
            console.error('Failed to update step')
            alert('Nepodařilo se aktualizovat krok')
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
  }, [habits, goals, dailySteps])


  // Also measure when sections expand
  useEffect(() => {
    if (goalsRef.current && expandedLeftSection === 'goals') {
      const height = goalsRef.current.scrollHeight
      setLeftSectionHeights(prev => ({ ...prev, goals: height }))
    }
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
  const [editingHabitFrequency, setEditingHabitFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('daily')
  const [editingHabitSelectedDays, setEditingHabitSelectedDays] = useState<string[]>([])
  const [editingHabitAlwaysShow, setEditingHabitAlwaysShow] = useState<boolean>(false)
  const [editingHabitXpReward, setEditingHabitXpReward] = useState<number>(0)
  const [editingHabitCategory, setEditingHabitCategory] = useState<string>('')
  const [editingHabitDifficulty, setEditingHabitDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [editingHabitReminderTime, setEditingHabitReminderTime] = useState<string>('')

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
      setEditingHabitAlwaysShow(selectedItem.always_show || false)
      setEditingHabitXpReward(selectedItem.xp_reward || 0)
      setEditingHabitCategory(selectedItem.category || '')
      setEditingHabitDifficulty(selectedItem.difficulty || 'medium')
      setEditingHabitReminderTime(selectedItem.reminder_time || '')
    }
  }, [selectedItem, selectedItemType])

  // Handle step modal
  const handleOpenStepModal = (date?: string, step?: any) => {
    if (step) {
      // Open existing step for editing
      const stepDate = step.date ? (typeof step.date === 'string' && step.date.match(/^\d{4}-\d{2}-\d{2}$/) ? step.date : step.date.split('T')[0]) : getLocalDateString(selectedDayDate)
      setStepModalData({
        id: step.id,
        title: step.title || '',
        description: step.description || '',
        date: stepDate,
        goalId: step.goal_id || '',
        completed: step.completed || false,
        is_important: step.is_important || false,
        is_urgent: step.is_urgent || false,
        deadline: step.deadline ? (typeof step.deadline === 'string' ? step.deadline.split('T')[0] : new Date(step.deadline).toISOString().split('T')[0]) : '',
        estimated_time: step.estimated_time || 0,
        checklist: step.checklist || [],
        require_checklist_complete: step.require_checklist_complete || false
      })
    } else {
      // Create new step
      const defaultDate = date || getLocalDateString(selectedDayDate)
      setStepModalData({
        id: null,
        title: '',
        description: '',
        date: defaultDate,
        goalId: '',
        completed: false,
        is_important: false,
        is_urgent: false,
        deadline: '',
        estimated_time: 0,
        checklist: [],
        require_checklist_complete: false
      })
    }
    setShowStepModal(true)
  }

  // Handle habit modal
  const handleOpenHabitModal = (habit: any) => {
    setHabitModalData(habit)
    setEditingHabitName(habit?.name || '')
    setEditingHabitDescription(habit?.description || '')
    setEditingHabitFrequency(habit?.frequency || 'daily')
    setEditingHabitSelectedDays(habit?.selected_days || [])
    setEditingHabitAlwaysShow(habit?.always_show || false)
    setEditingHabitXpReward(habit?.xp_reward || 0)
    setEditingHabitCategory(habit?.category || '')
    setEditingHabitDifficulty(habit?.difficulty || 'medium')
    setEditingHabitReminderTime(habit?.reminder_time || '')
    setShowHabitModal(true)
  }

  const handleSaveHabitModal = async () => {
    if (!editingHabitName.trim()) {
      alert('Název návyku je povinný')
      return
    }

    // Validate custom frequency
    if (editingHabitFrequency === 'custom' && editingHabitSelectedDays.length === 0) {
      alert('Pro vlastní frekvenci musíte vybrat alespoň jeden den')
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
          selectedDays: editingHabitSelectedDays,
          alwaysShow: editingHabitAlwaysShow,
          xpReward: editingHabitXpReward,
          category: editingHabitCategory,
          difficulty: editingHabitDifficulty
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

    const confirmMessage = t('habits.deleteConfirm', { name: habitModalData.name }) || `Opravdu chcete smazat návyk "${habitModalData.name}"? Tato akce je nevratná.`
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      const response = await fetch('/api/habits', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          habitId: habitModalData.id
        }),
      })

      if (response.ok) {
        // Remove habit from parent component
        if (onHabitsUpdate) {
          onHabitsUpdate(habits.filter(habit => habit.id !== habitModalData.id))
        }
        
        // Close modal after successful deletion
        setShowHabitModal(false)
        setHabitModalData(null)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Neznámá chyba' }))
        alert(t('habits.deleteError') || `Nepodařilo se smazat návyk: ${errorData.error || 'Neznámá chyba'}`)
      }
    } catch (error) {
      console.error('Error deleting habit:', error)
      alert(t('habits.deleteError') || 'Chyba při mazání návyku')
    }
  }

  const handleSaveStepModal = async () => {
    if (!stepModalData.title.trim()) {
      alert('Název kroku je povinný')
      return
    }

    const currentUserId = userId || player?.user_id
    if (!currentUserId) {
      console.error('Cannot save step: userId not available', { userId, playerUserId: player?.user_id, user: user?.id })
      alert('Chyba: Uživatel není nalezen. Zkuste to prosím znovu za chvíli.')
      return
    }

    console.log('Saving step:', { 
      isUpdate: !!stepModalData.id, 
      title: stepModalData.title, 
      userId: currentUserId,
      date: stepModalData.date 
    })

    setStepModalSaving(true)
    try {
      const requestBody = stepModalData.id ? {
        stepId: stepModalData.id,
        title: stepModalData.title,
        description: stepModalData.description || '',
        date: stepModalData.date || null,
        goalId: stepModalData.goalId || null,
        completed: stepModalData.completed,
        isImportant: stepModalData.is_important,
        isUrgent: stepModalData.is_urgent,
        estimatedTime: stepModalData.estimated_time,
        checklist: stepModalData.checklist,
        requireChecklistComplete: stepModalData.require_checklist_complete
      } : {
        userId: currentUserId,
        goalId: stepModalData.goalId || null,
        title: stepModalData.title,
        description: stepModalData.description || '',
        date: stepModalData.date || null,
        isImportant: stepModalData.is_important,
        isUrgent: stepModalData.is_urgent,
        estimatedTime: stepModalData.estimated_time,
        checklist: stepModalData.checklist,
        requireChecklistComplete: stepModalData.require_checklist_complete
      }

      console.log('Sending request:', requestBody)

      const response = await fetch('/api/daily-steps', {
        method: stepModalData.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('Response status:', response.status, response.ok)

      if (response.ok) {
        const savedStep = await response.json()
        console.log('Step saved successfully:', savedStep)
        
        // Reload steps
        const stepsResponse = await fetch(`/api/daily-steps?userId=${currentUserId}`)
        if (stepsResponse.ok) {
          const steps = await stepsResponse.json()
          console.log('Steps reloaded:', steps.length)
          onDailyStepsUpdate?.(steps)
        }
        setShowStepModal(false)
        setStepModalData({
          id: null,
          title: '',
          description: '',
          date: '',
          goalId: '',
          completed: false,
          is_important: false,
          is_urgent: false,
          deadline: '',
          estimated_time: 0,
          checklist: [],
          require_checklist_complete: false
        })
      } else {
        const errorText = await response.text()
        console.error('Error response:', response.status, errorText)
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText || 'Neznámá chyba' }
        }
        alert(`Chyba při ${stepModalData.id ? 'aktualizaci' : 'vytváření'} kroku: ${errorData.error || 'Nepodařilo se uložit krok'}`)
      }
    } catch (error) {
      console.error('Error saving step:', error)
      alert(`Chyba při ${stepModalData.id ? 'aktualizaci' : 'vytváření'} kroku: ${error instanceof Error ? error.message : 'Neznámá chyba'}`)
    } finally {
      setStepModalSaving(false)
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
        
        // Update the steps list - fetch all steps
        const updatedSteps = await fetch(`/api/daily-steps?userId=${player?.user_id}`)
          .then(res => res.json())
        onDailyStepsUpdate?.(updatedSteps)
        
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
        // Refresh steps list
        const updatedSteps = await fetch(`/api/daily-steps?userId=${player?.user_id}`)
          .then(res => res.json())
        onDailyStepsUpdate?.(updatedSteps)
      } else {
        console.error('Error updating step date')
      }
    } catch (error) {
      console.error('Error updating step date:', error)
    }
  }
  
  // Handle step time change from time picker in focus section
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
        // Refresh steps list
        const updatedSteps = await fetch(`/api/daily-steps?userId=${player?.user_id}`)
          .then(res => res.json())
        onDailyStepsUpdate?.(updatedSteps)
      } else {
        console.error('Error updating step time')
      }
    } catch (error) {
      console.error('Error updating step time:', error)
    }
  }

  const handleSaveGoal = async () => {
    if (!selectedItem || selectedItemType !== 'goal') return

    try {
      const response = await fetch('/api/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId: selectedItem.id,
          title: goalTitle,
          description: goalDescription,
          target_date: goalDate,
          status: goalStatus
        })
      })

      if (response.ok) {
        const updatedGoal = await response.json()
        // Update selected item
        setSelectedItem(updatedGoal)
        // Update goals in parent component without refetching
        if (onGoalsUpdate) {
          onGoalsUpdate(goals.map(g => g.id === updatedGoal.id ? updatedGoal : g))
        }
      }
    } catch (error) {
      console.error('Error updating goal:', error)
    }
  }

  const renderItemDetail = (item: any, type: 'step' | 'habit' | 'goal' | 'stat') => {
    switch (type) {
      case 'step':
        return (
          <div className="w-full h-full flex flex-col">
            {/* Back Button */}
            <div className="px-8 pt-6 pb-2 flex-shrink-0">
              <button
                onClick={handleCloseDetail}
                className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">{t('details.backToOverview')}</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-8 pb-8">
            <div className="w-full max-w-2xl space-y-6 mx-auto">
              {/* Title with checkbox and edit button */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={item.completed || false}
                  onChange={(e) => handleToggleStepCompleted(e.target.checked)}
                  className="w-6 h-6 mt-1 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                {editingStepTitle ? (
                  <input
                    type="text"
                    value={stepTitle}
                    onChange={(e) => setStepTitle(e.target.value)}
                    onBlur={() => handleSaveStep()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveStep()
                      }
                      if (e.key === 'Escape') {
                        setEditingStepTitle(false)
                        setStepTitle(selectedItem?.title || '')
                      }
                    }}
                    className="flex-1 text-2xl font-bold text-orange-900 border-b-2 border-orange-600 focus:outline-none bg-transparent"
                    autoFocus
                  />
                ) : (
                  <>
                    <h4 className="text-2xl font-bold text-orange-900 flex-1">{stepTitle}</h4>
                    <button
                      onClick={() => setEditingStepTitle(true)}
                      className="text-gray-400 hover:text-orange-600 transition-colors"
                      title={t('details.step.editTitle')}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </>
                )}
              </div>

              {/* Description */}
              <textarea
                value={stepDescription}
                onChange={(e) => setStepDescription(e.target.value)}
                onBlur={handleSaveStep}
                placeholder={t('details.step.descriptionPlaceholder')}
                className="w-full px-4 py-3 text-orange-800 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600 bg-white bg-opacity-50 resize-none"
                rows={3}
              />

              {/* Info tags */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    setShowDatePicker(false)
                    setShowTimeEditor(!showTimeEditor)
                  }}
                  className={`text-sm px-4 py-2 rounded-full font-medium transition-colors ${
                    stepEstimatedTime > 0 
                      ? 'bg-blue-200 bg-opacity-80 text-blue-800 hover:bg-blue-300' 
                      : 'bg-gray-200 bg-opacity-80 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  ⏱️ {stepEstimatedTime > 0 ? `${stepEstimatedTime} min` : t('details.step.addTime')}
                </button>
                
                <button
                  onClick={() => {
                    setShowTimeEditor(false)
                    setShowDatePicker(!showDatePicker)
                  }}
                  className="text-sm px-4 py-2 bg-gray-200 bg-opacity-80 text-gray-800 rounded-full font-medium hover:bg-gray-300 transition-colors"
                >
                  📅 {item.date ? new Date(item.date).toLocaleDateString(localeCode) : t('common.noDate')}
                </button>
                
                <button
                  onClick={() => {
                    setStepIsImportant(!stepIsImportant)
                    handleSaveStep()
                  }}
                  className={`text-sm px-4 py-2 rounded-full font-medium transition-colors ${
                    stepIsImportant 
                      ? 'bg-red-200 bg-opacity-80 text-red-800 hover:bg-red-300' 
                      : 'bg-gray-200 bg-opacity-80 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {stepIsImportant ? '⭐' : '☆'} {t('details.step.important')}
                </button>
                
                <button
                  onClick={() => {
                    setStepIsUrgent(!stepIsUrgent)
                    handleSaveStep()
                  }}
                  className={`text-sm px-4 py-2 rounded-full font-medium transition-colors ${
                    stepIsUrgent 
                      ? 'bg-orange-200 bg-opacity-80 text-orange-800 hover:bg-orange-300' 
                      : 'bg-gray-200 bg-opacity-80 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {stepIsUrgent ? '🔥' : '⚡'} {t('details.step.urgent')}
                </button>
                
                {/* Goal picker */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowTimeEditor(false)
                      setShowDatePicker(false)
                      setShowStepGoalPicker(!showStepGoalPicker)
                    }}
                    className={`text-sm px-4 py-2 rounded-full font-medium transition-colors ${
                      stepGoalId 
                        ? 'bg-purple-200 bg-opacity-80 text-purple-800 hover:bg-purple-300' 
                        : 'bg-gray-200 bg-opacity-80 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    🎯 {stepGoalId ? goals.find(g => g.id === stepGoalId)?.title || t('details.step.goal') : t('details.step.goal')}
                  </button>
                  {showStepGoalPicker && (
                    <div className="absolute top-full left-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl z-50 min-w-[200px] max-h-64 overflow-y-auto">
                      <button
                        onClick={() => {
                          setStepGoalId(null)
                          setShowStepGoalPicker(false)
                          handleSaveStep()
                        }}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-purple-50 border-b border-gray-100 font-medium transition-colors"
                      >
                        {t('details.step.noGoal')}
                      </button>
                      {goals.map((goal) => (
                        <button
                          key={goal.id}
                          onClick={() => {
                            setStepGoalId(goal.id)
                            setShowStepGoalPicker(false)
                            handleSaveStep()
                          }}
                          className={`w-full text-left px-4 py-3 text-sm hover:bg-purple-50 transition-colors ${
                            stepGoalId === goal.id ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-gray-700'
                          }`}
                        >
                          {goal.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
              </div>

              {/* Time editor */}
              {showTimeEditor && (
                <div className="p-4 bg-white bg-opacity-95 rounded-lg border border-orange-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('details.step.estimatedTime')}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={stepEstimatedTime}
                      onChange={(e) => setStepEstimatedTime(parseInt(e.target.value) || 0)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                      min="0"
                    />
                    <button
                      onClick={() => {
                        handleSaveStep()
                        setShowTimeEditor(false)
                      }}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      {t('details.step.confirm')}
                    </button>
                    <button
                      onClick={() => setShowTimeEditor(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              )}


              {/* Date picker */}
              {showDatePicker && (
                <div className="p-4 bg-white bg-opacity-95 rounded-lg border border-orange-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('details.step.newDate')}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={selectedDate || ''}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                    />
                    <button
                      onClick={() => handleRescheduleStep(selectedDate)}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      {t('details.step.confirm')}
                    </button>
                    <button
                      onClick={() => setShowDatePicker(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              )}

              </div>
            </div>
          </div>
        )

      case 'habit':
        return (
          <div className="w-full h-full flex flex-col">
            {/* Back Button */}
            <div className="px-4 pt-4 pb-2 flex-shrink-0">
              <button
                onClick={handleCloseDetail}
                className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">{t('details.backToOverview')}</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <div className="w-full max-w-3xl mx-auto">
              <div className="space-y-4">
                {/* Header */}
                <div className="text-center">
                  <h4 className="text-2xl font-bold text-orange-900 mb-2">{item.name}</h4>
                  {item.description && item.description !== item.name && (
                    <p className="text-orange-800 text-base leading-relaxed">{item.description}</p>
                  )}
                </div>
                
                {/* Compact Stats with Icons */}
                <div className="flex justify-center gap-4">
                  {(() => {
                    // Calculate real statistics from habit_completions
                    const habitCompletions = item.habit_completions || {}
                    const now = new Date()
                    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
                    
                    // Use only the date part (without time) for comparison
                    const userCreatedDateFull = new Date(player?.created_at || '2024-01-01')
                    const userCreatedDate = new Date(userCreatedDateFull.getFullYear(), userCreatedDateFull.getMonth(), userCreatedDateFull.getDate())
                    
                    
                    // Count completed and missed days
                    let totalCompleted = 0
                    let totalMissed = 0
                    let currentStreak = 0
                    let longestStreak = 0
                    let tempStreak = 0
                    
                    // Go through all completion records in habit_completions
                    const completionDates = Object.keys(habitCompletions).sort()
                    
                    for (const dateKey of completionDates) {
                      const completion = habitCompletions[dateKey]
                      
                      if (completion === true) {
                        totalCompleted++
                      } else if (completion === false) {
                        totalMissed++
                      }
                    }
                    
                        // Calculate longest streak separately
                        tempStreak = 0
                        longestStreak = 0
                        
                        // Go through all days from user creation to today to calculate longest streak
                        for (let d = new Date(userCreatedDate); d <= now; d.setDate(d.getDate() + 1)) {
                          const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                          const completion = habitCompletions[dateKey]
                          
                          if (completion === true) {
                            tempStreak++
                            longestStreak = Math.max(longestStreak, tempStreak)
                          } else if (completion === false) {
                            // Missed day breaks the streak
                            tempStreak = 0
                          }
                          // completion === undefined (not-scheduled) doesn't break the streak, just doesn't add to it
                        }
                    
                    // Update longest streak if current streak is longer
                    longestStreak = Math.max(longestStreak, currentStreak)
                    
                    // Calculate current streak by going backwards from the last completed day
                    currentStreak = 0
                    
                    // Find the last completed day chronologically
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
                    
                    // If we have a last completed day, count streak backwards from there
                    if (lastCompletedDate) {
                      // Create date-only versions for comparison
                      const lastCompletedDateOnly = new Date(lastCompletedDate!.getFullYear(), lastCompletedDate!.getMonth(), lastCompletedDate!.getDate())
                      for (let d = new Date(lastCompletedDateOnly); d >= userCreatedDate; d.setDate(d.getDate() - 1)) {
                        const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                        const completion = habitCompletions[dateKey]
                        
                        if (completion === true) {
                          currentStreak++
                        } else if (completion === false) {
                          // Missed day breaks the streak
                          break
                        }
                        // completion === undefined (not-scheduled) doesn't break the streak, just doesn't add to it
                      }
                    }
                    
                    // Also count missed days for scheduled habits from user creation to today
                    for (let d = new Date(userCreatedDate); d <= new Date(); d.setDate(d.getDate() + 1)) {
                      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                      const completion = habitCompletions[dateKey]
                      
                      // If no completion record exists, check if it was scheduled
                      if (completion === undefined) {
                        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
                        const dayName = dayNames[d.getDay()]
                        const isScheduled = item.selected_days && item.selected_days.includes(dayName)
                        
                        if (isScheduled) {
                          // Was scheduled but not completed = missed
                          totalMissed++
                        }
                      }
                    }
                    
                    return (
                      <>
                        <div 
                          className="flex items-center gap-2 px-3 py-2 rounded-lg" 
                          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                          title={t('details.habit.currentStreak')}
                        >
                          <span className="text-lg">🔥</span>
                          <span className="text-lg font-bold text-green-600">{currentStreak}</span>
                        </div>
                        <div 
                          className="flex items-center gap-2 px-3 py-2 rounded-lg" 
                          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                          title={t('details.habit.longestStreak')}
                        >
                          <span className="text-lg">🏆</span>
                          <span className="text-lg font-bold text-blue-600">{longestStreak}</span>
                        </div>
                        <div 
                          className="flex items-center gap-2 px-3 py-2 rounded-lg" 
                          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                          title={t('details.habit.totalCompleted')}
                        >
                          <span className="text-lg">✅</span>
                          <span className="text-lg font-bold text-purple-600">{totalCompleted}</span>
                        </div>
                        <div 
                          className="flex items-center gap-2 px-3 py-2 rounded-lg" 
                          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                          title={t('details.habit.totalMissed')}
                        >
                          <span className="text-lg">❌</span>
                          <span className="text-lg font-bold text-red-600">{totalMissed}</span>
                        </div>
                      </>
                    )
                  })()}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b-2 border-orange-200">
                  <button
                    onClick={() => setHabitDetailTab('calendar')}
                    className={`px-4 py-2 font-medium transition-colors ${
                      habitDetailTab === 'calendar'
                        ? 'text-orange-600 border-b-2 border-orange-600 -mb-[2px]'
                        : 'text-gray-600 hover:text-orange-600'
                    }`}
                  >
                    📅 {t('details.habit.calendar')}
                  </button>
                  <button
                    onClick={() => setHabitDetailTab('settings')}
                    className={`px-4 py-2 font-medium transition-colors ${
                      habitDetailTab === 'settings'
                        ? 'text-orange-600 border-b-2 border-orange-600 -mb-[2px]'
                        : 'text-gray-600 hover:text-orange-600'
                    }`}
                  >
                    ⚙️ {t('details.habit.settingsTab')}
                  </button>
                </div>

                {/* Calendar Tab */}
                {habitDetailTab === 'calendar' && (
                <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                  {/* Month Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => {
                        const newDate = new Date(currentMonth)
                        newDate.setMonth(newDate.getMonth() - 1)
                        setCurrentMonth(newDate)
                      }}
                      className="px-3 py-1 rounded-lg bg-orange-200 text-orange-800 hover:bg-orange-300 transition-all duration-200"
                    >
                      ←
                    </button>
                    <h5 className="text-lg font-semibold text-orange-900">
                      {currentMonth.toLocaleDateString(localeCode, { month: 'long', year: 'numeric' })}
                    </h5>
                    <button
                      onClick={() => {
                        const newDate = new Date(currentMonth)
                        newDate.setMonth(newDate.getMonth() + 1)
                        setCurrentMonth(newDate)
                      }}
                      className="px-3 py-1 rounded-lg bg-orange-200 text-orange-800 hover:bg-orange-300 transition-all duration-200"
                    >
                      →
                    </button>
                  </div>
                  
                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1 mb-3">
                    {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map(day => (
                      <div key={day} className="text-center text-xs font-medium text-orange-800 py-1">
                        {day}
                      </div>
                    ))}
                    {/* Generate calendar days for current month */}
                    {(() => {
                      const year = currentMonth.getFullYear()
                      const month = currentMonth.getMonth()
                      const firstDay = new Date(year, month, 1)
                      const lastDay = new Date(year, month + 1, 0)
                      const daysInMonth = lastDay.getDate()
                      const startDay = (firstDay.getDay() + 6) % 7 // Convert Sunday=0 to Monday=0
                      
                      const days = []
                      
                      // Empty cells for days before month starts
                      for (let i = 0; i < startDay; i++) {
                        days.push(
                          <div key={`empty-${i}`} className="text-center text-xs py-1"></div>
                        )
                      }
                      
                      // Days of the month
                      for (let day = 1; day <= daysInMonth; day++) {
                        const date = new Date(year, month, day)
                        const today = new Date()
                        const isToday = date.toDateString() === today.toDateString()
                        const isFuture = date > today
                        const isPast = date < today
                        
                        // Get actual data from habit_completions
                        const habitCompletions = item.habit_completions || {}
                        const dateKey = getLocalDateString(date)
                        const isCompleted = habitCompletions[dateKey] === true
                        const isMissed = habitCompletions[dateKey] === false
                        
                        // Check if this day is scheduled for this habit
                        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
                        const dayName = dayNames[date.getDay()]
                        const isScheduled = item.selected_days && item.selected_days.includes(dayName)
                        
                        // Check if this date is after user account creation (not habit creation)
                        const userCreatedDateFull = new Date(player?.created_at || '2024-01-01')
                        const userCreatedDate = new Date(userCreatedDateFull.getFullYear(), userCreatedDateFull.getMonth(), userCreatedDateFull.getDate())
                        const isAfterUserCreation = date >= userCreatedDate
                        
                        // Determine day state based on new logic
                        // For past days (before today), only show "completed" or "missed"
                        // If scheduled but not completed in the past, automatically show as "missed"
                        let dayState = 'not-planned' // default
                        let className = 'text-center text-xs py-1 rounded transition-all duration-200 '
                        let onClick = () => {}
                        
                        if (isCompleted) {
                          // 1. Splněno - zeleně
                          dayState = 'completed'
                          className += 'bg-green-200 text-green-800 hover:bg-green-300 cursor-pointer'
                          onClick = () => {
                            handleHabitCalendarToggle(item.id, dateKey, 'completed', isScheduled)
                          }
                        } else if (isMissed) {
                          // 2. Vynecháno - červeně
                          dayState = 'missed'
                          className += 'bg-red-200 text-red-800 hover:bg-red-300 cursor-pointer'
                          onClick = () => {
                            handleHabitCalendarToggle(item.id, dateKey, 'missed', isScheduled)
                          }
                        } else if (isPast && isAfterUserCreation) {
                          // Past days: if scheduled but not completed, show as "missed"
                          // If not scheduled and not completed, also show as "missed" (user can mark as completed)
                          dayState = 'missed'
                          className += 'bg-red-200 text-red-800 hover:bg-red-300 cursor-pointer'
                          onClick = () => {
                            handleHabitCalendarToggle(item.id, dateKey, 'missed', isScheduled)
                          }
                        } else if (isToday) {
                          // 3. Dnešní den - podtržený, ale stejný styl jako ostatní
                          dayState = 'today'
                          if (isCompleted) {
                            className += 'bg-green-200 text-green-800 hover:bg-green-300 cursor-pointer border-b-2 border-orange-600'
                          } else if (isMissed) {
                            className += 'bg-red-200 text-red-800 hover:bg-red-300 cursor-pointer border-b-2 border-orange-600'
                          } else if (isScheduled) {
                            className += 'bg-gray-100 text-gray-500 cursor-pointer hover:bg-gray-200 border-b-2 border-orange-600'
                          } else {
                            className += 'bg-gray-200 text-gray-600 hover:bg-gray-300 cursor-pointer border-b-2 border-orange-600'
                          }
                          onClick = () => {
                            handleHabitCalendarToggle(item.id, dateKey, isCompleted ? 'completed' : isMissed ? 'missed' : isScheduled ? 'planned' : 'not-scheduled', isScheduled)
                          }
                        } else if (isScheduled && isAfterUserCreation && isFuture) {
                          // 4b. Budoucí naplánovaný den - světle šedě (nelze kliknout)
                          dayState = 'planned-future'
                          className += 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        } else if (isAfterUserCreation && isFuture) {
                          // 5b. Budoucí nenaplánovaný den - šedě (nelze kliknout)
                          dayState = 'not-scheduled-future'
                          className += 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        } else {
                          // Ostatní případy - velmi světle šedě (před vytvořením účtu)
                          dayState = 'inactive'
                          className += 'bg-gray-50 text-gray-300 cursor-not-allowed'
                        }
                        
                        days.push(
                          <div
                            key={day}
                            className={className}
                            onClick={onClick}
                            title={
                              isFuture ? t('details.habit.futureDay') :
                              dayState === 'completed' || dayState === 'missed' || dayState === 'not-scheduled' || dayState === 'planned' ? `Den ${day}.${month + 1}. - klikněte pro změnu` :
                              t('details.habit.dayBeforeAccount')
                            }
                          >
                            {day}
                          </div>
                        )
                      }
                      
                      return days
                    })()}
                  </div>
                  
                  {/* Updated Legend - 4 States */}
                  <div className="flex gap-2 justify-center text-xs flex-wrap">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-200 rounded"></div>
                      <span className="text-orange-800">Splněno</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-200 rounded"></div>
                      <span className="text-orange-800">Vynecháno</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-gray-100 rounded"></div>
                      <span className="text-orange-800">Naplánováno</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-gray-200 rounded"></div>
                      <span className="text-orange-800">Nenaplánováno</span>
                    </div>
                  </div>
                </div>
                )}

                {/* Settings Tab */}
                {habitDetailTab === 'settings' && (
                  <div className="p-4 bg-white bg-opacity-95 rounded-lg border border-orange-200 space-y-4">
                    <h5 className="text-lg font-semibold text-gray-800 mb-4">{t('details.habit.settings')}</h5>
                    
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('details.habit.name')}
                      </label>
                  <input
                    type="text"
                        value={editingHabitName || item.name}
                        onChange={(e) => setEditingHabitName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                      />
              </div>

              {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('details.habit.description')}
                      </label>
              <textarea
                        value={editingHabitDescription || item.description || ''}
                        onChange={(e) => setEditingHabitDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600 resize-none"
                rows={3}
              />
              </div>

                    {/* Frequency */}
                    <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                        Frekvence:
                  </label>
                    <select
                        value={editingHabitFrequency || item.frequency || 'daily'}
                        onChange={(e) => setEditingHabitFrequency(e.target.value as 'daily' | 'weekly' | 'monthly' | 'custom')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                    >
                        <option value="daily">Denně</option>
                        <option value="weekly">Týdně</option>
                        <option value="monthly">Měsíčně</option>
                        <option value="custom">Vlastní</option>
                    </select>
                    </div>
                    
                    {/* Selected Days */}
                    {(editingHabitFrequency === 'weekly' || item.frequency === 'weekly') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Dny v týdnu:
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                            const dayLabels: { [key: string]: string } = {
                              monday: 'Po',
                              tuesday: 'Út',
                              wednesday: 'St',
                              thursday: 'Čt',
                              friday: 'Pá',
                              saturday: 'So',
                              sunday: 'Ne'
                            }
                            const currentDays = editingHabitSelectedDays.length > 0 ? editingHabitSelectedDays : (item.selected_days || [])
                            const isSelected = currentDays.includes(day)
                            return (
                    <button
                                key={day}
                      onClick={() => {
                                  const newDays = isSelected
                                    ? currentDays.filter((d: string) => d !== day)
                                    : [...currentDays, day]
                                  setEditingHabitSelectedDays(newDays)
                      }}
                                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                                  isSelected
                                    ? 'bg-orange-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                    >
                                {dayLabels[day]}
                    </button>
                            )
                          })}
                  </div>
                </div>
              )}

                    {/* Always Show */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingHabitAlwaysShow !== undefined ? editingHabitAlwaysShow : (item.always_show || false)}
                        onChange={(e) => setEditingHabitAlwaysShow(e.target.checked)}
                        className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <label className="text-sm font-medium text-gray-700">
                        Zobrazovat vždy (i když není naplánováno)
                      </label>
                    </div>
                    
                    {/* XP Reward */}
                    <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                        XP odměna:
                  </label>
                      <input
                        type="number"
                        value={editingHabitXpReward || item.xp_reward || 0}
                        onChange={(e) => setEditingHabitXpReward(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                        min="0"
                      />
                    </div>
                    
                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('details.habit.category')}
                      </label>
                      <input
                        type="text"
                        value={editingHabitCategory || item.category || ''}
                        onChange={(e) => setEditingHabitCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                        placeholder="Např. Zdraví, Vzdělání..."
                      />
                    </div>
                    
                    {/* Difficulty */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Obtížnost:
                      </label>
                    <select
                        value={editingHabitDifficulty || item.difficulty || 'medium'}
                        onChange={(e) => setEditingHabitDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                    >
                        <option value="easy">Snadná</option>
                        <option value="medium">Střední</option>
                        <option value="hard">Těžká</option>
                    </select>
                  </div>

                    {/* Reminder Time */}
                    <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                        Čas připomínky (volitelné):
                  </label>
                    <input
                        type="time"
                        value={editingHabitReminderTime || (item.reminder_time || '')}
                        onChange={(e) => setEditingHabitReminderTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                    />
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                    <button
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/habits', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                habitId: item.id,
                                name: editingHabitName || item.name,
                                description: editingHabitDescription !== undefined ? editingHabitDescription : item.description,
                                frequency: editingHabitFrequency || item.frequency,
                                selectedDays: editingHabitSelectedDays.length > 0 ? editingHabitSelectedDays : item.selected_days,
                                alwaysShow: editingHabitAlwaysShow !== undefined ? editingHabitAlwaysShow : item.always_show,
                                xpReward: editingHabitXpReward || item.xp_reward,
                                category: editingHabitCategory || item.category,
                                difficulty: editingHabitDifficulty || item.difficulty,
                                reminderTime: editingHabitReminderTime || item.reminder_time
                              })
                            })
                            if (response.ok) {
                              const updatedHabit = await response.json()
                              if (onHabitsUpdate) {
                                onHabitsUpdate(habits.map(h => h.id === updatedHabit.id ? updatedHabit : h))
                              }
                              // Update selectedItem
                              setSelectedItem(updatedHabit)
                              alert('Návyk byl úspěšně aktualizován')
                            }
                          } catch (error) {
                            console.error('Error updating habit:', error)
                            alert('Chyba při aktualizaci návyku')
                          }
                      }}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                        {t('details.habit.saveChanges')}
                    </button>
                    </div>
                  </div>
                )}

                </div>
              </div>
            </div>
          </div>
        )

      case 'goal':
        // Create a goal object that matches GoalEditingForm's expected format
        const goalForEditing = {
          ...item
        }


        return (
          <div className="w-full h-full flex flex-col">
            {/* Back Button - positioned higher */}
            <div className="px-6 pt-4 pb-2 flex-shrink-0">
                    <button
                onClick={handleCloseDetail}
                className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors"
                    >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">{t('details.backToOverview')}</span>
                    </button>
                  </div>
            
            {/* Goal Editing Form - without max-height constraint */}
            <div className="flex-1 overflow-hidden px-6 pb-6">
              <GoalEditingForm
                goal={goalForEditing}
                userId={userId || player?.user_id}
                player={player}
                onUpdate={handleUpdateGoalForDetail}
                onCancel={handleCloseDetail}
                onDelete={handleDeleteGoalForDetail}
                setStepsCacheVersion={setStepsCacheVersion}
              />
            </div>
          </div>
        )

      case 'stat':
        return (
          <div className="w-full h-full flex flex-col justify-center items-center p-8">
            <div className="grid grid-cols-2 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-600 mb-2">{completedSteps}</div>
                <div className="text-lg text-orange-800 font-medium">Dokončené kroky</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">{activeHabits}</div>
                <div className="text-lg text-orange-800 font-medium">Splněné návyky</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">{completedGoals}</div>
                <div className="text-lg text-orange-800 font-medium">Dokončené cíle</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">{Math.round(progressPercentage)}%</div>
                <div className="text-lg text-orange-800 font-medium">Celkový pokrok</div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const renderActionButtons = () => {
    // If there's a selected item, show edit buttons
    if (selectedItem && selectedItemType) {
      switch (selectedItemType) {
        case 'step':
          return (
            <>
              <button
                onClick={() => handleStepToggle(selectedItem.id, !selectedItem.completed)}
                disabled={loadingSteps.has(selectedItem.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                  loadingSteps.has(selectedItem.id)
                    ? 'bg-gray-400 text-white cursor-wait'
                    : selectedItem.completed 
                      ? 'bg-gray-500 text-white hover:bg-gray-600' 
                      : 'bg-orange-600 text-white hover:bg-orange-600'
                }`}
              >
                {loadingSteps.has(selectedItem.id) ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Načítání...</span>
                  </>
                ) : (
                  selectedItem.completed ? t('details.step.markIncomplete') : t('details.step.markCompleted')
                )}
              </button>
              <button
                onClick={() => {
                  initializeEditingStep(selectedItem)
                  handleCloseDetail()
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all duration-300"
              >
                {t('details.step.edit')}
              </button>
              <button
                onClick={async () => {
                  await handleDeleteStep(selectedItem.id)
                  // Close detail after deletion (handleDeleteStep already handles the deletion and updates)
                  handleCloseDetail()
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-all duration-300"
              >
                {t('common.delete')}
              </button>
              <button
                onClick={handleCloseDetail}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-500 text-white hover:bg-gray-600 transition-all duration-300"
              >
                {t('common.back')}
              </button>
            </>
          )
        case 'habit':
          return (
            <>
              <button
                onClick={() => handleHabitToggle(selectedItem.id)}
                disabled={loadingHabits.has(selectedItem.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                  loadingHabits.has(selectedItem.id)
                    ? 'bg-gray-400 text-white cursor-wait'
                    : selectedItem.completed_today 
                      ? 'bg-gray-500 text-white hover:bg-gray-600' 
                      : 'bg-orange-600 text-white hover:bg-orange-600'
                }`}
              >
                {loadingHabits.has(selectedItem.id) ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Načítání...</span>
                  </>
                ) : (
                  selectedItem.completed_today ? 'Označit jako nesplněný' : 'Splnit návyk'
                )}
              </button>
              <button
                onClick={handleCloseDetail}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-500 text-white hover:bg-gray-600 transition-all duration-300"
              >
                {t('common.back')}
              </button>
            </>
          )
        case 'goal':
          return (
            <>
              <button
                onClick={() => {
                  initializeEditingGoal(selectedItem)
                  handleCloseDetail()
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all duration-300"
              >
                {t('details.step.edit')}
              </button>
              <button
                onClick={handleCloseDetail}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-500 text-white hover:bg-gray-600 transition-all duration-300"
              >
                {t('common.back')}
              </button>
            </>
          )
        case 'stat':
          return (
            <>
              <button
                onClick={handleCloseDetail}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-500 text-white hover:bg-gray-600 transition-all duration-300"
              >
                {t('common.back')}
              </button>
            </>
          )
        default:
          return null
      }
    }

    // Show program-specific buttons
    switch (currentProgram) {
      case 'day':
      case 'week':
      case 'month':
        return null // No additional buttons for these programs
      default:
        return null
    }
  }

  const renderChillContent = () => {
    const chillPlaces = [
      // Tropical Beach - Line Art Style
      {
        name: 'Tropická pláž',
        background: 'linear-gradient(180deg, #E6F3FF 0%, #87CEEB 30%, #F4A460 70%, #DEB887 100%)',
        svg: (
          <svg viewBox="0 0 400 300" className="w-full h-full">
            {/* Sky */}
            <defs>
              <pattern id="skyGradient" patternUnits="userSpaceOnUse" width="400" height="150">
                <stop offset="0%" stopColor="#E6F3FF"/>
                <stop offset="100%" stopColor="#87CEEB"/>
              </pattern>
            </defs>
            
            {/* Background sky */}
            <rect width="400" height="150" fill="url(#skyGradient)"/>
            
            {/* Ocean waves */}
            <path d="M0,150 Q50,140 100,150 T200,150 T300,150 T400,150 L400,200 L0,200 Z" fill="#4682B4" stroke="#2E5B8A" strokeWidth="1"/>
            <path d="M0,160 Q30,155 60,160 T120,160 T180,160 T240,160 T300,160 T360,160 T400,160 L400,200 L0,200 Z" fill="#5A9BD4" stroke="#2E5B8A" strokeWidth="0.5"/>
            <path d="M0,170 Q40,165 80,170 T160,170 T240,170 T320,170 T400,170 L400,200 L0,200 Z" fill="#6BB6E8" stroke="#2E5B8A" strokeWidth="0.5"/>
            
            {/* Beach */}
            <path d="M0,200 Q100,190 200,200 T400,200 L400,300 L0,300 Z" fill="#DEB887" stroke="#CD853F" strokeWidth="1"/>
            
            {/* Palm trees */}
            {/* Left palm */}
            <line x1="80" y1="200" x2="80" y2="120" stroke="#8B4513" strokeWidth="3"/>
            <path d="M80,120 Q60,100 40,120 Q60,110 80,120 Q100,100 120,120 Q100,110 80,120" fill="none" stroke="#228B22" strokeWidth="2"/>
            <path d="M80,120 Q70,100 50,110 Q70,105 80,120 Q90,100 110,110 Q90,105 80,120" fill="none" stroke="#228B22" strokeWidth="1.5"/>
            
            {/* Right palm */}
            <line x1="320" y1="200" x2="320" y2="100" stroke="#8B4513" strokeWidth="4"/>
            <path d="M320,100 Q300,80 280,100 Q300,90 320,100 Q340,80 360,100 Q340,90 320,100" fill="none" stroke="#228B22" strokeWidth="2.5"/>
            <path d="M320,100 Q310,80 290,90 Q310,85 320,100 Q330,80 350,90 Q330,85 320,100" fill="none" stroke="#228B22" strokeWidth="2"/>
            
            {/* Center palm */}
            <line x1="200" y1="200" x2="200" y2="110" stroke="#8B4513" strokeWidth="3.5"/>
            <path d="M200,110 Q180,90 160,110 Q180,100 200,110 Q220,90 240,110 Q220,100 200,110" fill="none" stroke="#228B22" strokeWidth="2.2"/>
            <path d="M200,110 Q190,90 170,100 Q190,95 200,110 Q210,90 230,100 Q210,95 200,110" fill="none" stroke="#228B22" strokeWidth="1.8"/>
            
            {/* Sun */}
            <circle cx="350" cy="50" r="15" fill="#FFD700" stroke="#FFA500" strokeWidth="1"/>
            <line x1="350" y1="20" x2="350" y2="15" stroke="#FFA500" strokeWidth="1"/>
            <line x1="365" y1="35" x2="370" y2="30" stroke="#FFA500" strokeWidth="1"/>
            <line x1="365" y1="65" x2="370" y2="70" stroke="#FFA500" strokeWidth="1"/>
            <line x1="335" y1="65" x2="330" y2="70" stroke="#FFA500" strokeWidth="1"/>
            <line x1="335" y1="35" x2="330" y2="30" stroke="#FFA500" strokeWidth="1"/>
            
            {/* Clouds */}
            <ellipse cx="100" cy="40" rx="20" ry="8" fill="none" stroke="#FFFFFF" strokeWidth="1.5"/>
            <ellipse cx="120" cy="40" rx="15" ry="6" fill="none" stroke="#FFFFFF" strokeWidth="1.5"/>
            <ellipse cx="110" cy="35" rx="12" ry="5" fill="none" stroke="#FFFFFF" strokeWidth="1.5"/>
            
            <ellipse cx="250" cy="60" rx="18" ry="7" fill="none" stroke="#FFFFFF" strokeWidth="1.5"/>
            <ellipse cx="270" cy="60" rx="12" ry="5" fill="none" stroke="#FFFFFF" strokeWidth="1.5"/>
            
            {/* Small birds */}
            <path d="M150,80 Q155,75 160,80" fill="none" stroke="#2C3E50" strokeWidth="1"/>
            <path d="M180,70 Q185,65 190,70" fill="none" stroke="#2C3E50" strokeWidth="1"/>
            <path d="M220,90 Q225,85 230,90" fill="none" stroke="#2C3E50" strokeWidth="1"/>
          </svg>
        )
      },
      // Mountain Landscape
      {
        name: 'Horské panorama',
        background: 'linear-gradient(180deg, #E6F3FF 0%, #B0C4DE 20%, #708090 40%, #2F4F4F 100%)',
        svg: (
          <svg viewBox="0 0 400 300" className="w-full h-full">
            {/* Sky */}
            <rect width="400" height="150" fill="#E6F3FF"/>
            
            {/* Mountains */}
            <path d="M0,150 L50,80 L100,120 L150,60 L200,100 L250,40 L300,80 L350,50 L400,90 L400,150 Z" fill="#708090" stroke="#2F4F4F" strokeWidth="1"/>
            <path d="M0,150 L30,100 L60,130 L90,90 L120,110 L150,70 L180,100 L210,60 L240,90 L270,50 L300,80 L330,40 L360,70 L400,60 L400,150 Z" fill="#8A9BA8" stroke="#2F4F4F" strokeWidth="0.8"/>
            
            {/* Foreground mountains */}
            <path d="M0,150 L80,100 L160,130 L240,80 L320,110 L400,90 L400,150 Z" fill="#2F4F4F" stroke="#1A252F" strokeWidth="1.2"/>
            
            {/* Sun */}
            <circle cx="350" cy="50" r="12" fill="#FFD700" stroke="#FFA500" strokeWidth="1"/>
            
            {/* Clouds */}
            <ellipse cx="100" cy="40" rx="25" ry="10" fill="none" stroke="#FFFFFF" strokeWidth="2"/>
            <ellipse cx="120" cy="40" rx="18" ry="8" fill="none" stroke="#FFFFFF" strokeWidth="2"/>
            <ellipse cx="110" cy="35" rx="15" ry="6" fill="none" stroke="#FFFFFF" strokeWidth="2"/>
            
            <ellipse cx="250" cy="60" rx="20" ry="8" fill="none" stroke="#FFFFFF" strokeWidth="1.5"/>
            <ellipse cx="270" cy="60" rx="15" ry="6" fill="none" stroke="#FFFFFF" strokeWidth="1.5"/>
            
            {/* Trees */}
            <line x1="50" y1="150" x2="50" y2="120" stroke="#8B4513" strokeWidth="2"/>
            <path d="M50,120 Q40,110 30,120 Q40,115 50,120 Q60,110 70,120 Q60,115 50,120" fill="none" stroke="#228B22" strokeWidth="1.5"/>
            
            <line x1="150" y1="150" x2="150" y2="110" stroke="#8B4513" strokeWidth="2.5"/>
            <path d="M150,110 Q140,100 130,110 Q140,105 150,110 Q160,100 170,110 Q160,105 150,110" fill="none" stroke="#228B22" strokeWidth="2"/>
            
            <line x1="300" y1="150" x2="300" y2="125" stroke="#8B4513" strokeWidth="2"/>
            <path d="M300,125 Q290,115 280,125 Q290,120 300,125 Q310,115 320,125 Q310,120 300,125" fill="none" stroke="#228B22" strokeWidth="1.5"/>
          </svg>
        )
      },
      // Forest
      {
        name: 'Tajemný les',
        background: 'linear-gradient(180deg, #E6F3FF 0%, #87CEEB 20%, #228B22 60%, #006400 100%)',
        svg: (
          <svg viewBox="0 0 400 300" className="w-full h-full">
            {/* Sky */}
            <rect width="400" height="120" fill="#E6F3FF"/>
            
            {/* Ground */}
            <rect width="400" height="180" y="120" fill="#228B22"/>
            
            {/* Trees */}
            {/* Left tree */}
            <line x1="80" y1="300" x2="80" y2="100" stroke="#8B4513" strokeWidth="4"/>
            <path d="M80,100 Q60,80 40,100 Q60,90 80,100 Q100,80 120,100 Q100,90 80,100" fill="none" stroke="#228B22" strokeWidth="3"/>
            <path d="M80,100 Q70,80 50,90 Q70,85 80,100 Q90,80 110,90 Q90,85 80,100" fill="none" stroke="#228B22" strokeWidth="2"/>
            
            {/* Center tree */}
            <line x1="200" y1="300" x2="200" y2="80" stroke="#8B4513" strokeWidth="5"/>
            <path d="M200,80 Q180,60 160,80 Q180,70 200,80 Q220,60 240,80 Q220,70 200,80" fill="none" stroke="#228B22" strokeWidth="3.5"/>
            <path d="M200,80 Q190,60 170,70 Q190,65 200,80 Q210,60 230,70 Q210,65 200,80" fill="none" stroke="#228B22" strokeWidth="2.5"/>
            
            {/* Right tree */}
            <line x1="320" y1="300" x2="320" y2="90" stroke="#8B4513" strokeWidth="4"/>
            <path d="M320,90 Q300,70 280,90 Q300,80 320,90 Q340,70 360,90 Q340,80 320,90" fill="none" stroke="#228B22" strokeWidth="3"/>
            <path d="M320,90 Q310,70 290,80 Q310,75 320,90 Q330,70 350,80 Q330,75 320,90" fill="none" stroke="#228B22" strokeWidth="2"/>
            
            {/* Sun */}
            <circle cx="350" cy="50" r="15" fill="#FFD700" stroke="#FFA500" strokeWidth="1"/>
            
            {/* Birds */}
            <path d="M150,60 Q155,55 160,60" fill="none" stroke="#2C3E50" strokeWidth="1.5"/>
            <path d="M180,70 Q185,65 190,70" fill="none" stroke="#2C3E50" strokeWidth="1.5"/>
            <path d="M220,50 Q225,45 230,50" fill="none" stroke="#2C3E50" strokeWidth="1.5"/>
            
            {/* Small plants */}
            <path d="M50,300 Q45,290 40,300 Q45,295 50,300 Q55,290 60,300 Q55,295 50,300" fill="none" stroke="#228B22" strokeWidth="1"/>
            <path d="M120,300 Q115,290 110,300 Q115,295 120,300 Q125,290 130,300 Q125,295 120,300" fill="none" stroke="#228B22" strokeWidth="1"/>
          </svg>
        )
      }
    ]

    const randomPlace = chillPlaces[Math.floor(Math.random() * chillPlaces.length)]

    return (
      <div className="w-full h-full relative overflow-hidden" style={{
        background: randomPlace.background,
        minHeight: '400px'
      }}>
        {randomPlace.svg}
        
        {/* Place name */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-lg font-semibold text-center bg-black bg-opacity-30 px-4 py-2 rounded-lg">
          {randomPlace.name}
        </div>
      </div>
    )
  }

  const renderDisplayContent = () => {
    // If there's a selected item, show its detail for editing
    if (selectedItem && selectedItemType) {
      return renderItemDetail(selectedItem, selectedItemType)
    }

    // Show unified day view
    return (
      <UnifiedDayView
        player={player}
        goals={goals}
        habits={habits}
        dailySteps={dailySteps}
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
      />
    )
  }

  const renderWorkflowContent = () => {
    if (!pendingWorkflow || pendingWorkflow.type !== 'daily_review') {
    return (
        <UnifiedDayView
            player={player}
            goals={goals}
            habits={habits}
            dailySteps={dailySteps}
          handleItemClick={handleItemClick}
          handleHabitToggle={handleHabitToggle}
          handleStepToggle={handleStepToggle}
          loadingHabits={loadingHabits}
          loadingSteps={loadingSteps}
          onOpenStepModal={handleOpenStepModal}
            onNavigateToHabits={onNavigateToHabits}
            onNavigateToSteps={onNavigateToSteps}
            onStepDateChange={handleStepDateChange}
            onStepTimeChange={handleStepTimeChange}
      />
    )
    }

    return (
      <DailyReviewWorkflow
        workflow={pendingWorkflow}
        goals={goals}
        player={player}
        onComplete={handleWorkflowComplete}
        onSkip={handleWorkflowSkip}
        onGoalProgressUpdate={handleGoalProgressUpdate}
      />
    )
  }

  const renderCalendarContent = () => {
    // Calendar will be imported and rendered here
    return (
      <CalendarProgram
        player={player}
        goals={goals}
        habits={habits}
        dailySteps={dailySteps}
        onHabitsUpdate={onHabitsUpdate}
        onDailyStepsUpdate={onDailyStepsUpdate}
      />
    )
  }

  const renderDailyPlanContent = () => {
    // Get today's date in local timezone
    const today = getLocalDateString()
    
    // Filter today's steps - normalize dates by taking only the date part, accounting for timezone
    const todaysSteps = dailySteps.filter(step => {
      if (!step.date) return false
      
      // Parse the date and get local date string
      const stepDateObj = new Date(step.date)
      const localYear = stepDateObj.getFullYear()
      const localMonth = String(stepDateObj.getMonth() + 1).padStart(2, '0')
      const localDay = String(stepDateObj.getDate()).padStart(2, '0')
      const stepDate = `${localYear}-${localMonth}-${localDay}`
      
      return stepDate === today
    })
    
    // Filter today's habits
    const dayOfWeek = new Date().getDay()
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const todayName = dayNames[dayOfWeek]
    
    const todaysHabits = habits.filter(habit => {
      // If frequency is 'daily', always include
      if (habit.frequency === 'daily') {
        return true
      }
      
      // If frequency is 'custom', check if today is in selected_days
      if (habit.frequency === 'custom' && habit.selected_days) {
        const included = habit.selected_days.includes(todayName)
        return included
      }
      
      return false
    })

    // Count all habits (including always_show) for total tasks
    // But only count completed habits (including always_show if they are completed)
    const totalHabits = todaysHabits.length
    
    // Calculate today's progress based on completed steps and habits
    const completedSteps = todaysSteps.filter(step => step.completed).length
    const completedHabits = todaysHabits.filter(habit => {
      const todayDate = today
      return habit.habit_completions && habit.habit_completions[todayDate] === true
    }).length
    
    const totalItems = todaysSteps.length + totalHabits
    const completedItems = completedSteps + completedHabits
    const todayProgressPercentage = totalItems > 0 ? Math.min((completedItems / totalItems) * 100, 100) : 0

    return (
      <div className="w-full h-full flex flex-col p-4">
        {/* Compact Progress Section */}
        <div className="flex items-center gap-3 mb-6">
          <div className="text-2xl font-bold text-orange-600">{Math.round(todayProgressPercentage)}%</div>
          <div className="flex-1 bg-orange-200 bg-opacity-50 rounded-full h-2">
            <div 
              className="bg-orange-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(todayProgressPercentage, 100)}%` }}
            ></div>
          </div>
        </div>
        
        {/* Two Column Layout */}
        <div className="grid grid-cols-2 gap-6 flex-1 overflow-hidden">
          {/* Left Column - Today's Steps */}
          <div className="flex flex-col">
            <h4 className="text-lg font-semibold text-orange-900 mb-4">Dnešní kroky:</h4>
            <div className="space-y-3 overflow-y-auto">
              {todaysSteps.map((step, index) => (
                <div
                  key={step.id}
                  onClick={() => handleItemClick(step, 'step')}
                  className={`p-3 rounded-lg border border-gray-200 bg-white hover:bg-orange-50/30 hover:border-orange-200 transition-all duration-200 cursor-pointer shadow-sm ${
                    step.completed ? 'bg-orange-50/50 border-orange-200' : ''
                  }`}
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
                    <span 
                      className={`flex-1 truncate font-semibold text-sm ${step.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}
                    >
                      {step.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Right Column - Today's Habits */}
          <div className="flex flex-col">
            <h4 className="text-lg font-semibold text-orange-900 mb-4">Návyky:</h4>
            <div className="space-y-3 overflow-y-auto">
              {todaysHabits.map((habit) => {
                const today = getLocalDateString()
                const isCompleted = habit.habit_completions && habit.habit_completions[today] === true
                
                return (
                  <div
                    key={habit.id}
                    onClick={() => handleItemClick(habit, 'habit')}
                    className={`p-3 rounded-lg border border-gray-200 bg-white hover:bg-orange-50/30 hover:border-orange-200 transition-all duration-200 cursor-pointer shadow-sm ${
                      isCompleted ? 'bg-orange-50/50 border-orange-200' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!loadingHabits.has(habit.id)) {
                            handleHabitToggle(habit.id)
                          }
                        }}
                        disabled={loadingHabits.has(habit.id)}
                        className="flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 flex-shrink-0"
                        title={isCompleted ? 'Označit jako nesplněný' : 'Označit jako splněný'}
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
                      <span className={`truncate flex-1 font-semibold text-sm ${
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
              {todaysHabits.length === 0 && (
                <div className="text-gray-400 text-sm text-center py-4">
                  Žádné návyky na dnes
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderStatisticsContent = () => {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center p-8">
        <div className="grid grid-cols-2 gap-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-orange-600 mb-2">{completedSteps}</div>
            <div className="text-lg text-orange-800 font-medium">Dokončené kroky</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">{activeHabits}</div>
            <div className="text-lg text-orange-800 font-medium">Splněné návyky</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">{completedGoals}</div>
            <div className="text-lg text-orange-800 font-medium">Dokončené cíle</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">{Math.round(progressPercentage)}%</div>
            <div className="text-lg text-orange-800 font-medium">Celkový pokrok</div>
          </div>
        </div>
      </div>
    )
  }

  // Old renderGoalsContent and renderHabitsContent removed - now using new versions in renderManagementContent
  // renderStepsContent removed - now in ManagementPage

  const renderDisplayContentOld = () => {
    // If there's a selected item, show its detail
    if (selectedItem && selectedItemType) {
      return renderItemDetail(selectedItem, selectedItemType)
    }

    switch (displayMode) {
      case 'character':
    return (
          <div className="text-center">
            {/* Journey-style Character */}
            <div 
              className="w-36 h-36 mx-auto mb-6 rounded-full border-4 border-orange-200 flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 cursor-pointer hover:scale-105 transition-all duration-500 shadow-xl"
              onClick={handleCharacterClick}
              style={{
                background: 'radial-gradient(circle at 30% 30%, #fff7ed, #fed7aa)',
                boxShadow: '0 15px 30px rgba(251, 146, 60, 0.2), inset 0 2px 0 rgba(255,255,255,0.3)'
              }}
              >
              <div className="w-28 h-28 rounded-full relative" style={{ backgroundColor: player?.appearance?.skinColor || '#FDBCB4' }}>
                {/* Hair */}
                <div
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-12 rounded-full"
                  style={{ backgroundColor: player?.appearance?.hairColor || '#8B4513' }}
                />
                {/* Eyes */}
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 flex gap-4">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: player?.appearance?.eyeColor || '#4A90E2' }}
                        />
                        <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: player?.appearance?.eyeColor || '#4A90E2' }}
                  />
                                </div>
                {/* Smile */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-12 h-3 bg-gray-700 rounded-sm" />
                            </div>
            </div>

            {/* Character Name */}
            <h2 className="text-2xl font-bold text-orange-800 mb-6" style={{
              textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
              letterSpacing: '1px'
            }}>
              {player?.name || 'Hrdina'}
            </h2>
                      </div>
                              )

      case 'progress':
    return (
          <div className="text-center">
            <h3 className="text-xl font-bold text-orange-800 mb-6" style={{ letterSpacing: '1px' }}>DNEŠNÍ CESTA</h3>
            <div className="bg-white bg-opacity-90 rounded-xl p-6 max-w-md mx-auto shadow-lg border border-orange-200" style={{
              background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
              boxShadow: '0 8px 16px rgba(251, 146, 60, 0.1)'
            }}>
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2" style={{ backgroundColor: '#e5e7eb' }}>
                  <div 
                    className="bg-orange-600 h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                    style={{ width: `${progressPercentage}%` }}
                  >
                    {progressPercentage > 20 && (
                      <span className="text-xs font-bold text-white">{Math.round(progressPercentage)}%</span>
                    )}
                  </div>
                  </div>
                <div className="text-sm text-gray-600 text-center">
                  {progressPercentage === 100 ? '🎉 Všechny kroky dokončeny!' : `${Math.round(progressPercentage)}% dokončeno`}
                </div>
              </div>
              <p className="text-sm text-gray-700 italic text-center mt-4">
                Každý krok tě přibližuje k cíli!
              </p>
                        </div>
                      </div>
        )

      case 'motivation':
        return (
          <div className="text-center">
            {/* Journey-style Character */}
            <div 
              className="w-36 h-36 mx-auto mb-6 rounded-full border-4 border-orange-200 flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 cursor-pointer hover:scale-105 transition-all duration-500 shadow-xl"
              onClick={handleCharacterClick}
              style={{
                background: 'radial-gradient(circle at 30% 30%, #fff7ed, #fed7aa)',
                boxShadow: '0 15px 30px rgba(251, 146, 60, 0.2), inset 0 2px 0 rgba(255,255,255,0.3)'
              }}
            >
              <div className="w-28 h-28 rounded-full relative" style={{ backgroundColor: player?.appearance?.skinColor || '#FDBCB4' }}>
                {/* Hair */}
                <div
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-12 rounded-full"
                  style={{ backgroundColor: player?.appearance?.hairColor || '#8B4513' }}
                />
                {/* Eyes */}
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 flex gap-4">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: player?.appearance?.eyeColor || '#4A90E2' }}
                  />
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: player?.appearance?.eyeColor || '#4A90E2' }}
                  />
                </div>
                {/* Smile */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-12 h-3 bg-gray-700 rounded-sm" />
              </div>
            </div>

            {/* Character Name */}
            <h2 className="text-2xl font-bold text-orange-800 mb-6" style={{
              textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
              letterSpacing: '1px'
            }}>
              {player?.name || 'Hrdina'}
            </h2>
          </div>
        )

      case 'progress':
        return (
          <div className="text-center">
            <h3 className="text-xl font-bold text-orange-800 mb-6" style={{ letterSpacing: '1px' }}>DNEŠNÍ CESTA</h3>
            <div className="bg-white bg-opacity-90 rounded-xl p-6 max-w-md mx-auto shadow-lg border border-orange-200" style={{
              background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
              boxShadow: '0 8px 16px rgba(251, 146, 60, 0.1)'
            }}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pokrok</span>
                  <span className="text-orange-600 text-sm font-bold">
                    {completedSteps}/{totalSteps} kroků
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-orange-400 to-orange-600 h-3 rounded-full transition-all duration-700 shadow-sm"
                    style={{ 
                      width: `${progressPercentage}%`,
                      boxShadow: '0 2px 4px rgba(251, 146, 60, 0.3)'
                    }}
                  ></div>
                </div>
                <div className="text-sm text-gray-600 text-center">
                  {progressPercentage === 100 ? '🎉 Všechny kroky dokončeny!' : `${Math.round(progressPercentage)}% dokončeno`}
                </div>
              </div>
              <p className="text-sm text-gray-700 italic text-center mt-4">
                Každý krok tě přibližuje k cíli!
              </p>
            </div>
          </div>
        )

      case 'motivation':
        return (
          <div className="text-center">
            <h3 className="text-xl font-bold text-orange-800 mb-6" style={{ letterSpacing: '1px' }}>MOTIVACE</h3>
            <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border border-orange-200 rounded-xl p-8 max-w-lg mx-auto shadow-lg" style={{
              background: 'linear-gradient(135deg, #fef3c7, #fed7aa)',
              boxShadow: '0 8px 16px rgba(251, 146, 60, 0.15)'
            }}>
              <p className="text-gray-800 text-base leading-relaxed" style={{
                letterSpacing: '0.5px',
                lineHeight: '1.6'
              }}>
                "{getMotivationalDialogue()}"
              </p>
            </div>
          </div>
        )

      case 'stats':
        return (
          <div className="text-center">
            <h3 className="text-xl font-bold text-orange-800 mb-6" style={{ letterSpacing: '1px' }}>STATISTIKY</h3>
            <div className="bg-white bg-opacity-90 rounded-xl p-6 max-w-md mx-auto shadow-lg border border-orange-200" style={{
              background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
              boxShadow: '0 8px 16px rgba(251, 146, 60, 0.1)'
            }}>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{completedSteps}</div>
                  <div className="text-sm text-gray-600">Dokončené kroky</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{activeHabits}</div>
                  <div className="text-sm text-gray-600">Splněné návyky</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{completedGoals}</div>
                  <div className="text-sm text-gray-600">Splněné cíle</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{currentDay}</div>
                  <div className="text-sm text-gray-600">Den cesty</div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'dialogue':
        return (
          <div className="text-center">
            <h3 className="text-xl font-bold text-orange-800 mb-6" style={{ letterSpacing: '1px' }}>ROZHOVOR</h3>
            <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border border-orange-200 rounded-xl p-8 max-w-lg mx-auto shadow-lg" style={{
              background: 'linear-gradient(135deg, #fef3c7, #fed7aa)',
              boxShadow: '0 8px 16px rgba(251, 146, 60, 0.15)'
            }}>
              <p className="text-gray-800 text-base leading-relaxed" style={{
                letterSpacing: '0.5px',
                lineHeight: '1.6'
              }}>
                "{getMotivationalDialogue()}"
              </p>
              <div className="text-right mt-4">
                <button
                  onClick={() => setDisplayMode('character')}
                  className="text-sm text-gray-600 hover:text-orange-700 bg-white bg-opacity-50 px-3 py-1 rounded hover:bg-opacity-70 transition-colors"
                >
                  {t('common.back')}
                </button>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

        // Sortable Goal Component - memoized to prevent re-creation on parent re-renders
        // We use useMemo to create the component only once, preventing state resets when parent re-renders
        const SortableGoal = useMemo(() => {
          return memo(function SortableGoalComponent({ goal, index, isEditing, editingGoal, setEditingGoal, handleUpdateGoal, getStatusColor, initializeEditingGoal, userId, player, stepsCacheVersion, setStepsCacheVersion }: any) {
          const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
            isDragging,
          } = useSortable({ 
            id: goal.id,
            disabled: isEditing
          })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    }

    const [steps, setSteps] = useState<any[]>([])
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [showStepForm, setShowStepForm] = useState(false)
    const [isSavingStep, setIsSavingStep] = useState(false)
    const [datePickerPosition, setDatePickerPosition] = useState<{ top: number; left: number } | null>(null)
    const [stepFormPosition, setStepFormPosition] = useState<{ top: number; left: number } | null>(null)
    const dateRef = useRef<HTMLDivElement>(null)
    const stepsRef = useRef<HTMLDivElement>(null)
    const [newStepTitle, setNewStepTitle] = useState('')

    // Initialize from cache if available and watch for cache updates
    // Extract version values using useMemo to ensure React detects changes
    const stepsCacheVersionValue = useMemo(() => {
      return stepsCacheVersion?.[goal.id] || 0
    }, [stepsCacheVersion, goal.id])
    
    useEffect(() => {
      if (goal.id && stepsCacheRef.current[goal.id]?.loaded) {
        const cachedSteps = stepsCacheRef.current[goal.id].data
        setSteps(cachedSteps)
        console.log('SortableGoal: Steps updated from cache', { goalId: goal.id, stepsCount: cachedSteps.length, cacheVersion: stepsCacheVersionValue })
      }
    }, [goal.id, stepsCacheVersionValue])

    // Load steps for this goal - only once per goal using global cache
    useEffect(() => {
      const loadSteps = async () => {
        if (!goal.id) return
        
        // Check cache first
        if (stepsCacheRef.current[goal.id]?.loaded) {
          setSteps(stepsCacheRef.current[goal.id].data)
          return
        }
        
        try {
          const response = await fetch(`/api/daily-steps?goalId=${goal.id}`)
          if (response.ok) {
            const stepsData = await response.json()
            const stepsArray = Array.isArray(stepsData) ? stepsData : []
            setSteps(stepsArray)
            // Store in global cache
            stepsCacheRef.current[goal.id] = { data: stepsArray, loaded: true }
            // Trigger reactivity
            setStepsCacheVersion((prev: Record<string, number>) => ({ ...prev, [goal.id]: (prev[goal.id] || 0) + 1 }))
          }
        } catch (error) {
          console.error('Error loading steps:', error)
        }
      }
      loadSteps()
    }, [goal.id])

    // Function to refresh steps (called when step is added/removed/completed)
    const refreshSteps = useCallback(async () => {
      if (!goal.id) return
      try {
        const response = await fetch(`/api/daily-steps?goalId=${goal.id}`)
        if (response.ok) {
          const stepsData = await response.json()
          const stepsArray = Array.isArray(stepsData) ? stepsData : []
          setSteps(stepsArray)
          // Update cache
          stepsCacheRef.current[goal.id] = { data: stepsArray, loaded: true }
          // Trigger reactivity
          setStepsCacheVersion((prev: Record<string, number>) => ({ ...prev, [goal.id]: (prev[goal.id] || 0) + 1 }))
        }
      } catch (error) {
        console.error('Error refreshing steps:', error)
      }
    }, [goal.id])

    const stepsCount = steps.length
    const targetDate = goal.target_date ? new Date(goal.target_date).toLocaleDateString(localeCode) : t('common.noDeadline');

    // Handle click vs drag detection
    const [dragStartPosition, setDragStartPosition] = useState({ x: 0, y: 0 })
    const [isDragStarted, setIsDragStarted] = useState(false)

          const handleMouseDown = (e: any) => {
            setDragStartPosition({ x: e.clientX, y: e.clientY })
            setIsDragStarted(false)
          }

          const handleMouseMove = (e: any) => {
            if (!isDragStarted) {
              const dragDistance = Math.sqrt(
                Math.pow(e.clientX - dragStartPosition.x, 2) + 
                Math.pow(e.clientY - dragStartPosition.y, 2)
              )
              
              if (dragDistance > 5) {
                setIsDragStarted(true)
              }
            }
          }

          const handleMouseUp = (e: any) => {
      // Don't close if clicking on editing form, buttons, dropdowns, or clickable info badges
      if (e.target.closest('.editing-form') !== null || 
          e.target.closest('button') !== null ||
          e.target.closest('.date-picker') !== null ||
          e.target.closest('.step-form') !== null ||
          e.target.closest('[ref="dateRef"]') !== null ||
          e.target.closest('[ref="stepsRef"]') !== null ||
          dateRef.current?.contains(e.target) ||
          stepsRef.current?.contains(e.target)) {
              return
            }
            
            if (!isDragStarted) {
              // Treat as click - open/close editing
              if (isEditing) {
                setEditingGoal(null)
              } else {
                initializeEditingGoal(goal)
              }
            }
            setIsDragStarted(false)
          }

    const handleDateClick = (e: any) => {
      e.stopPropagation()
      if (dateRef.current) {
        const rect = dateRef.current.getBoundingClientRect()
        setDatePickerPosition({ top: rect.bottom + 5, left: rect.left })
        setShowDatePicker(true)
      }
    }

    const handleStepsClick = (e: any) => {
      e.stopPropagation()
      if (stepsRef.current) {
        const rect = stepsRef.current.getBoundingClientRect()
        setStepFormPosition({ top: rect.bottom + 5, left: rect.left })
        setShowStepForm(true)
        setNewStepTitle('')
      }
    }


    const handleSaveStep = async () => {
      if (!newStepTitle.trim() || isSavingStep) {
        console.log('handleSaveStep: Skipping - no title or already saving', { newStepTitle: newStepTitle.trim(), isSavingStep })
        return
      }
      
      // Use userId from prop or fallback to player?.user_id
      const currentUserId = userId || player?.user_id
      if (!currentUserId) {
        console.error('Cannot create step: userId not available', { userId, player: player?.user_id })
        return
      }
      
      console.log('handleSaveStep: Starting save', { currentUserId, goalId: goal.id, title: newStepTitle.trim() })
      
      setIsSavingStep(true)
      try {
        const requestBody = {
          userId: currentUserId,
            goalId: goal.id,
            title: newStepTitle.trim(),
            description: '',
            date: null
        }
        console.log('handleSaveStep: Sending request', requestBody)
        
        const response = await fetch('/api/daily-steps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        })
        
        console.log('handleSaveStep: Response received', { status: response.status, ok: response.ok })
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('handleSaveStep: Error response', { status: response.status, error: errorText })
          alert(`Chyba při ukládání kroku: ${errorText}`)
          return
        }
        
        const savedStep = await response.json()
        console.log('handleSaveStep: Step saved successfully', savedStep)
        
        // Update cache first, then refresh steps
          if (goal.id) {
            const stepsResponse = await fetch(`/api/daily-steps?goalId=${goal.id}`)
            if (stepsResponse.ok) {
              const stepsData = await stepsResponse.json()
              stepsCacheRef.current[goal.id] = { data: Array.isArray(stepsData) ? stepsData : [], loaded: true }
            // Trigger reactivity - update stepsCacheVersion to force re-render
            setStepsCacheVersion((prev: Record<string, number>) => ({ ...prev, [goal.id]: (prev[goal.id] || 0) + 1 }))
            // Also update local steps state directly for immediate UI update
            setSteps(Array.isArray(stepsData) ? stepsData : [])
            console.log('handleSaveStep: Cache updated', { goalId: goal.id, stepsCount: stepsData.length })
          }
        }
        // Also refresh steps count (this updates the steps state)
        await refreshSteps()
        // Close form only after everything is done
        setShowStepForm(false)
        setNewStepTitle('')
      } catch (error) {
        console.error('handleSaveStep: Exception caught', error)
        alert(`Chyba při ukládání kroku: ${error}`)
      } finally {
        setIsSavingStep(false)
      }
    }


    const handleToggleModal = (e: any) => {
      e.stopPropagation()
      if (isEditing) {
        setEditingGoal(null)
      } else {
        initializeEditingGoal(goal)
      }
    }

        return (
          <div 
            ref={setNodeRef} 
            style={style} 
            {...attributes} 
            {...listeners}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        className="rounded-xl border bg-gray-50 border-gray-200 hover:shadow-md transition-all duration-300 cursor-grab active:cursor-grabbing"
      >
        <div className={`p-3 ${isEditing ? 'border-b border-gray-200' : ''}`}>
          <div className="flex items-center justify-between gap-4">
            {/* Left side - Title and info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-xs flex-shrink-0">
                      {index + 1}
              </span>
              <h3 className="text-base font-semibold text-gray-800 truncate flex-1">
                {goal.title}
              </h3>
                    </div>

            {/* Center - Info badges (clickable) */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Steps count - clickable */}
              <div 
                ref={stepsRef}
                onClick={handleStepsClick}
                className="flex items-center gap-1 text-sm text-gray-600 cursor-pointer hover:text-orange-600 hover:bg-orange-50 px-2 py-1 rounded transition-colors"
                title={t('goals.addStep')}
              >
                <Footprints className="w-4 h-4" />
                <span>{stepsCount}</span>
                  </div>

              {/* Date - clickable */}
              <div 
                ref={dateRef}
                onClick={handleDateClick}
                className="flex items-center gap-1 text-sm text-gray-600 cursor-pointer hover:text-orange-600 hover:bg-orange-50 px-2 py-1 rounded transition-colors"
                title={t('common.endDate')}
              >
                <Calendar className="w-4 h-4" />
                <span>{targetDate}</span>
                </div>
            </div>

            {/* Right side - Toggle edit button */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={handleToggleModal}
                className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                title={isEditing ? t('common.close') : t('common.edit')}
              >
                {isEditing ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
                </div>
              </div>
          
          {/* Date picker dropdown */}
          {showDatePicker && datePickerPosition && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowDatePicker(false)}
              />
              <div 
                className="fixed z-50 bg-white border-2 border-gray-200 rounded-xl shadow-2xl p-4 date-picker"
              style={{ 
                  top: `${datePickerPosition.top}px`,
                  left: `${datePickerPosition.left}px`
                }}
              >
                <input
                  type="date"
                  value={goal.target_date ? new Date(goal.target_date).toISOString().split('T')[0] : ''}
                  onChange={async (e) => {
                    const newDate = e.target.value ? new Date(e.target.value).toISOString() : null
                    await handleUpdateGoal(goal.id, { target_date: newDate })
                    setShowDatePicker(false)
                  }}
                  className="text-base px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                  autoFocus
                />
          </div>
            </>
          )}

          {/* Step form dropdown */}
          {showStepForm && stepFormPosition && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={(e) => {
                  if (!isSavingStep) {
                    setShowStepForm(false)
                  }
                }}
              />
              <div 
                className="fixed z-50 bg-white border-2 border-gray-200 rounded-xl shadow-2xl p-4 step-form"
                onClick={(e) => e.stopPropagation()}
                style={{
                  top: `${stepFormPosition.top}px`,
                  left: `${stepFormPosition.left}px`,
                  minWidth: '250px'
                }}
              >
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    {t('goals.stepNumber')} {stepsCount + 1}
                  </label>
                  <input
                    type="text"
                    value={newStepTitle}
                    onChange={(e) => setNewStepTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveStep()
                      } else if (e.key === 'Escape') {
                        setShowStepForm(false)
                      }
                    }}
                    placeholder={`${t('goals.stepNumber')} ${stepsCount + 1}`}
                    className="w-full text-base px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveStep}
                      disabled={!newStepTitle.trim() || isSavingStep}
                      className="flex-1 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      {isSavingStep ? 'Ukládám...' : t('common.save')}
                    </button>
                    <button
                      onClick={() => {
                        if (!isSavingStep) {
                          setShowStepForm(false)
                        }
                      }}
                      disabled={isSavingStep}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      {t('common.cancel')}
                    </button>
          </div>
                </div>
              </div>
            </>
          )}

        </div>
        
        {isEditing && (
          <GoalEditingForm 
            goal={editingGoal}
            userId={userId || player?.user_id}
            player={player}
            onUpdate={async (goalId: string, updates: any) => {
              await handleUpdateGoal(goalId, updates)
              // Refresh steps count after update
              await refreshSteps()
            }}
            onCancel={() => setEditingGoal(null)}
            onDelete={handleDeleteGoal}
            setStepsCacheVersion={setStepsCacheVersion}
          />
        )}
      </div>
    )
          }, (prevProps, nextProps) => {
            // Only re-render if goal.id, isEditing, goal itself, or cache versions changed
            const prevStepsVersion = prevProps.stepsCacheVersion?.[prevProps.goal.id] || 0
            const nextStepsVersion = nextProps.stepsCacheVersion?.[nextProps.goal.id] || 0
            
            return prevProps.goal.id === nextProps.goal.id &&
                   prevProps.isEditing === nextProps.isEditing &&
                   prevProps.goal === nextProps.goal &&
                   prevStepsVersion === nextStepsVersion
          })
        }, []) // Empty dependency array - create component only once to prevent state resets

  const handleHabitToggle = async (habitId: string, date?: string) => {
    // Add to loading set
    setLoadingHabits(prev => new Set(prev).add(habitId))
    
    try {
      // Use provided date or default to today
      const dateToUse = date || (() => {
      const now = new Date()
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      })()
      const response = await fetch('/api/habits/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ habitId, date: dateToUse }),
      })

      if (response.ok) {
        const result = await response.json()
        
        // Update habits in parent component
        if (onHabitsUpdate) {
          // Refresh habits from server to get updated habit_completions
          const habitsResponse = await fetch('/api/habits')
          if (habitsResponse.ok) {
            const updatedHabits = await habitsResponse.json()
            onHabitsUpdate(updatedHabits)
          }
        }
        
        // Update selected item if it's the same habit
        if (selectedItem && selectedItem.id === habitId) {
          const updatedCompletions = {
            ...selectedItem.habit_completions,
            [dateToUse]: result.completed
          }
          setSelectedItem({
            ...selectedItem,
            habit_completions: updatedCompletions
          })
        }
      } else {
        console.error('Failed to toggle habit')
      }
    } catch (error) {
      console.error('Error toggling habit:', error);
    } finally {
      // Remove from loading set
      setLoadingHabits(prev => {
        const newSet = new Set(prev)
        newSet.delete(habitId)
        return newSet
      })
    }
  }

  // Handle goal delete for detail page
  const handleDeleteGoalForDetail = async (goalId: string, deleteSteps: boolean) => {
    setIsDeletingGoal(true)
    try {
      const response = await fetch('/api/goals', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId, deleteSteps }),
      })

      if (response.ok) {
        // Update goals in parent component
        if (onGoalsUpdate) {
          onGoalsUpdate(goals.filter(goal => goal.id !== goalId))
        }
        // Close modal
        setShowDeleteGoalModal(false)
        setDeleteGoalWithSteps(false)
        // Redirect to goals page
        setMainPanelSection('goals')
      } else {
        console.error('Failed to delete goal')
        alert(t('details.goal.deleteError') || 'Nepodařilo se smazat cíl')
      }
    } catch (error) {
      console.error('Error deleting goal:', error)
      alert('Chyba při mazání cíle')
    } finally {
      setIsDeletingGoal(false)
    }
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
        // Update goals in parent component
        if (onGoalsUpdate) {
          const updatedGoals = goals.map(g => g.id === goalId ? updatedGoal : g)
          onGoalsUpdate(updatedGoals)
        }
        // Update selectedItem to reflect changes if it's the same goal
        if (selectedItem && selectedItem.id === goalId) {
          setSelectedItem(updatedGoal)
        }
      } else {
        console.error('Failed to update goal')
        alert('Nepodařilo se aktualizovat cíl')
      }
    } catch (error) {
      console.error('Error updating goal:', error)
      alert('Chyba při aktualizaci cíle')
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
        
        // Update goals in parent component
        if (onGoalsUpdate) {
          onGoalsUpdate(goals.map(goal => 
            goal.id === updatedGoal.id ? updatedGoal : goal
          ))
        }
        
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
          metrics: []
        }),
      })

      if (response.ok) {
        const data = await response.json()
        
        // Update goals in parent component
        if (onGoalsUpdate && data.goal) {
          onGoalsUpdate([...goals, data.goal])
        }
        
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
    if (!confirm('Opravdu chcete smazat tento krok? Tato akce je nevratná.')) {
      return
    }

    try {
      console.log('Deleting step:', stepId)
      
      // Find the step to get its goalId before deletion
      const stepToDelete = dailySteps.find((s: any) => s.id === stepId)
      const goalId = stepToDelete?.goal_id || stepToDelete?.goalId
      
      const response = await fetch(`/api/daily-steps?stepId=${stepId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        console.log('Step deleted successfully')
        
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
                console.log('handleDeleteStep: Updating stepsCacheVersion', { goalId, newVersion, stepsCount: stepsArray.length })
                return { ...prev, [goalId]: newVersion }
              })
            }
          } catch (error) {
            console.error('Error updating steps cache after deletion:', error)
          }
        }
        
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
        console.error('Failed to delete step, status:', response.status)
        alert('Nepodařilo se smazat krok')
      }
    } catch (error) {
      console.error('Error deleting step:', error)
      alert('Chyba při mazání kroku')
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
        
        // Update goals in parent component
        if (onGoalsUpdate) {
          onGoalsUpdate(goals.filter(goal => goal.id !== goalId))
        }
        
        // Update sortedGoals locally
        const newSortedGoals = sortedGoals.filter(goal => goal.id !== goalId)
        setSortedGoals(newSortedGoals)
        
        // Update localStorage
        try {
          const goalOrder = newSortedGoals.map(goal => goal.id)
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
      // Always show if "always_show" is true
      if (habit.always_show) {
        return true
      }
      
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

  const todaysHabits = getTodaysHabits()

  // Initialize sorted goals
  // Initialize sorted goals when goals change
  useEffect(() => {
    if (goals.length > 0) {
      // Try to load order from localStorage
      try {
        const savedOrder = localStorage.getItem('goals-order')
        if (savedOrder) {
          const goalIds = JSON.parse(savedOrder)
          // Create ordered goals based on saved order
          const orderedGoals = goalIds
            .map((id: string) => goals.find(goal => goal.id === id))
            .filter(Boolean)
          
          // Add any new goals that weren't in the saved order
          const newGoals = goals.filter(goal => !goalIds.includes(goal.id))
          const finalOrder = [...orderedGoals, ...newGoals]
          
          setSortedGoals(finalOrder)
        } else {
          setSortedGoals(goals)
        }
      } catch (error) {
        console.error('Error loading goals order from localStorage:', error)
        setSortedGoals(goals)
      }
    } else {
      setSortedGoals(goals)
    }
  }, [goals])

  // Preload steps for all goals when goals are loaded
  useEffect(() => {
    const preloadSteps = async () => {
      if (goals.length === 0) return
      
      const goalIds = goals.map(goal => goal.id).filter(Boolean)
      if (goalIds.length === 0) return
      
      // Check which goals need loading
      const goalsNeedingSteps = goalIds.filter(id => !stepsCacheRef.current[id]?.loaded)
      
      // Batch load steps for all goals that need them
      if (goalsNeedingSteps.length > 0) {
        try {
          // Load steps for each goal (daily-steps API doesn't support batch, so we do parallel requests)
          const stepPromises = goalsNeedingSteps.map(async (goalId) => {
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
              console.error(`Error preloading steps for goal ${goalId}:`, error)
              }
            })
          
          await Promise.all(stepPromises)
        } catch (error) {
          console.error('Error preloading steps:', error)
        }
      }
    }
    
    preloadSteps()
  }, [goals])

  // Load steps for goal detail page when it's opened
  useEffect(() => {
    if (mainPanelSection.startsWith('goal-')) {
      const goalId = mainPanelSection.replace('goal-', '')
      const goal = goals.find(g => g.id === goalId)
      
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
  }, [mainPanelSection, goals])

  // Update goal detail page state when goal changes
  useEffect(() => {
    if (mainPanelSection.startsWith('goal-')) {
      const goalId = mainPanelSection.replace('goal-', '')
      const goal = goals.find(g => g.id === goalId)
      
      if (goal) {
        setGoalDetailTitleValue(goal.title)
        setGoalDetailDescriptionValue(goal.description || '')
        setEditingGoalDetailTitle(false)
        setEditingGoalDetailDescription(false)
        setShowGoalDetailDatePicker(false)
          }
    }
  }, [mainPanelSection, goals])



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

  const handleDragEnd = (event: any) => {
    const { active, over } = event

    if (active.id !== over.id) {
      const newSortedGoals = arrayMove(sortedGoals, 
        sortedGoals.findIndex((item) => item.id === active.id),
        sortedGoals.findIndex((item) => item.id === over.id)
      )
      
      setSortedGoals(newSortedGoals)
      
      // Save order to localStorage
      try {
        const goalOrder = newSortedGoals.map(goal => goal.id)
        localStorage.setItem('goals-order', JSON.stringify(goalOrder))
      } catch (error) {
        console.error('Error saving goals order to localStorage:', error)
      }
    }
  }

  // Separate editing form component to prevent re-renders
  const GoalEditingForm = ({ goal, userId, player, onUpdate, onCancel, onDelete, setStepsCacheVersion }: any) => {
    // Store original goal data to detect changes
    const originalGoalRef = useRef({
      title: goal.title,
      description: goal.description || '',
      target_date: goal.target_date ? new Date(goal.target_date).toISOString().split('T')[0] : '',
      status: goal.status || 'active'
    })
    
    const [formData, setFormData] = useState({
      title: goal.title,
      description: goal.description || '',
      target_date: goal.target_date ? new Date(goal.target_date).toISOString().split('T')[0] : '',
      status: goal.status || 'active',
      steps: [] as Array<{ id: string; title: string; description?: string; date?: string; completed?: boolean; isEditing?: boolean }>
    })
    
    // Check if there are unsaved changes
    // Note: Steps are saved directly in the modal, so we only check goal properties
    const hasUnsavedChanges = useMemo(() => {
      const original = originalGoalRef.current
      return (
        formData.title !== original.title ||
        formData.description !== original.description ||
        formData.target_date !== original.target_date ||
        formData.status !== original.status
      )
    }, [formData])
    const [showGoalDatePicker, setShowGoalDatePicker] = useState(false)
    const [showStatusPicker, setShowStatusPicker] = useState(false)
    const [datePickerButtonRef, setDatePickerButtonRef] = useState<HTMLButtonElement | null>(null)
    const [statusPickerButtonRef, setStatusPickerButtonRef] = useState<HTMLButtonElement | null>(null)
    const [datePickerPosition, setDatePickerPosition] = useState<{ top: number; left: number } | null>(null)
    const [statusPickerPosition, setStatusPickerPosition] = useState<{ top: number; left: number } | null>(null)

    // Calculate dropdown positions when they open
    useLayoutEffect(() => {
      if (showGoalDatePicker && datePickerButtonRef) {
        const rect = datePickerButtonRef.getBoundingClientRect()
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
        setStatusPickerPosition({
          top: rect.bottom - 2,
          left: rect.left
        })
      } else {
        setStatusPickerPosition(null)
      }
    }, [showStatusPicker, statusPickerButtonRef])

    // Load steps for this goal - only once per goal using global cache
    useEffect(() => {
      const loadSteps = async () => {
        // Load steps for this goal - check cache first
        if (goal.id) {
          if (stepsCacheRef.current[goal.id]?.loaded) {
            // Use cached data
            const cachedSteps = stepsCacheRef.current[goal.id].data.map((step: any) => ({
                id: step.id,
                title: step.title,
                description: step.description || '',
                date: step.date ? new Date(step.date).toISOString().split('T')[0] : '',
                completed: step.completed || false,
                isEditing: false
              }))
            setFormData(prev => {
              // Only update if steps have changed (to preserve editing state)
              const currentStepIds = prev.steps.map(s => s.id).sort().join(',')
              const newStepIds = cachedSteps.map(s => s.id).sort().join(',')
              if (currentStepIds !== newStepIds) {
                // Merge: keep existing steps that are being edited, add new ones from cache
                const existingStepIds = new Set(prev.steps.map(s => s.id))
                const newSteps = cachedSteps.filter(s => !existingStepIds.has(s.id))
                const mergedSteps = [
                  ...prev.steps.map(s => {
                    const cached = cachedSteps.find(cs => cs.id === s.id)
                    if (cached && !s.isEditing) {
                      return cached
                    }
                    return s
                  }),
                  ...newSteps
                ]
                return { ...prev, steps: mergedSteps }
              }
              return prev
            })
          } else {
            // Load from API
            try {
              const stepsResponse = await fetch(`/api/daily-steps?goalId=${goal.id}`)
              if (stepsResponse.ok) {
                const steps = await stepsResponse.json()
                const stepsArray = Array.isArray(steps) ? steps : []
                setFormData(prev => ({
                  ...prev,
                  steps: stepsArray.map((step: any) => ({
                    id: step.id,
                    title: step.title,
                    description: step.description || '',
                    date: step.date ? new Date(step.date).toISOString().split('T')[0] : '',
                    completed: step.completed || false,
                    isEditing: false
                  }))
                }))
                // Store in cache
                stepsCacheRef.current[goal.id] = { data: stepsArray, loaded: true }
                // Trigger reactivity
                setStepsCacheVersion((prev: Record<string, number>) => ({ ...prev, [goal.id]: (prev[goal.id] || 0) + 1 }))
              }
            } catch (error) {
              console.error('Error loading steps:', error)
            }
          }
        }
      }

      loadSteps()
    }, [goal.id])

    // Watch for cache updates and sync formData.steps
    // Use stepsCacheVersion state to trigger updates reactively
    useEffect(() => {
      if (!goal.id || !stepsCacheRef.current[goal.id]?.loaded) return
      
      const cachedSteps = stepsCacheRef.current[goal.id].data.map((step: any) => ({
        id: step.id,
        title: step.title,
        description: step.description || '',
        date: step.date ? new Date(step.date).toISOString().split('T')[0] : '',
        completed: step.completed || false,
        isEditing: false
      }))
      
      setFormData(prev => {
        // Check if there are new steps in cache that aren't in formData
        const currentStepIds = new Set(prev.steps.map(s => s.id))
        const cachedStepIds = new Set(cachedSteps.map(s => s.id))
        
        // Find new steps that were added (exclude temp steps)
        const newSteps = cachedSteps.filter(s => !currentStepIds.has(s.id) && !s.id.startsWith('temp-'))
        
        // Update existing steps if they changed (but preserve editing state and temp steps)
        const updatedSteps = prev.steps.map(prevStep => {
          // Don't update steps that are being edited or are temp steps
          if (prevStep.isEditing || prevStep.id.startsWith('temp-')) {
            return prevStep
          }
          const cached = cachedSteps.find(cs => cs.id === prevStep.id)
          return cached || prevStep
        })
        
        // Combine updated steps with new steps, removing duplicates
        // But preserve temp steps and editing steps
        const allSteps = [...updatedSteps, ...newSteps]
        const seenIds = new Set<string>()
        const uniqueSteps = allSteps.filter(step => {
          // Always keep temp steps and editing steps
          if (step.id.startsWith('temp-') || step.isEditing) {
            if (seenIds.has(step.id)) {
              return false
            }
            seenIds.add(step.id)
            return true
          }
          if (seenIds.has(step.id)) {
            return false
          }
          seenIds.add(step.id)
          return true
        })
        
        // Check if any steps were removed from cache
        const removedStepIds = prev.steps
          .filter(s => !cachedStepIds.has(s.id) && !s.id.startsWith('temp-'))
          .map(s => s.id)
        
        if (removedStepIds.length > 0) {
          return {
            ...prev,
            steps: uniqueSteps.filter(s => !removedStepIds.includes(s.id))
          }
        }
        
        // Only update if there are actual changes (to avoid unnecessary re-renders)
        // But always preserve temp steps and editing steps
        const prevStepIds = prev.steps.map(s => s.id).sort().join(',')
        const newStepIds = uniqueSteps.map(s => s.id).sort().join(',')
        
        // Check if there are temp steps or editing steps that should be preserved
        const hasTempOrEditingSteps = prev.steps.some(s => s.id.startsWith('temp-') || s.isEditing)
        
        if (prevStepIds !== newStepIds || newSteps.length > 0 || hasTempOrEditingSteps) {
          // Make sure we preserve all temp and editing steps
          const finalSteps = uniqueSteps.map(step => {
            const prevStep = prev.steps.find(s => s.id === step.id)
            if (prevStep && (prevStep.id.startsWith('temp-') || prevStep.isEditing)) {
              return prevStep
            }
            return step
          })
          
          // Add any temp/editing steps that might have been lost
          const missingTempSteps = prev.steps.filter(s => 
            (s.id.startsWith('temp-') || s.isEditing) && 
            !finalSteps.find(fs => fs.id === s.id)
          )
          
          return { ...prev, steps: [...finalSteps, ...missingTempSteps] }
        }
        
        return prev
      })
    }, [goal.id, stepsCacheVersion[goal.id]])

    // Auto-add step if requested
    useEffect(() => {
      if (goal.autoAddStep) {
        // Wait a bit for steps to load, then add new step
        const timeoutId = setTimeout(() => {
          setFormData(prev => ({
            ...prev,
            steps: [...prev.steps, { id: crypto.randomUUID(), title: '', description: '', date: '', isEditing: true }]
          }))
          // Scroll to steps section
          setTimeout(() => {
            const stepsSection = document.querySelector('[data-steps-section]')
            if (stepsSection) {
              stepsSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
          }, 100)
        }, 500)
        return () => clearTimeout(timeoutId)
      }
    }, [goal.autoAddStep])

    // Handle click outside to close editing forms
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement
        // Don't close if clicking on:
        // - Step editing forms
        // - Step form dropdowns (the small modals for adding)
        // - Any button or input
        if (
          target.closest('[data-step-id]') || 
          target.closest('.step-form') ||
          target.closest('button') ||
          target.closest('input') ||
          target.closest('textarea') ||
          target.closest('select')
        ) {
          return
        }
          setFormData(prev => ({
            ...prev,
            steps: prev.steps.map(s => ({ ...s, isEditing: false }))
          }))
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSubmit = async () => {
      if (!hasUnsavedChanges) return
      
      const updates = {
        title: formData.title,
        description: formData.description,
        target_date: formData.target_date ? new Date(formData.target_date).toISOString() : null,
        status: formData.status
      }
      await onUpdate(goal.id, updates)
      
      // Update original goal ref after successful save
      originalGoalRef.current = {
        title: formData.title,
        description: formData.description,
        target_date: formData.target_date,
        status: formData.status
      }
      
      // Refresh cache after saving steps
      if (goal.id) {
        // Refresh steps cache
        try {
          const stepsResponse = await fetch(`/api/daily-steps?goalId=${goal.id}`)
          if (stepsResponse.ok) {
            const stepsData = await stepsResponse.json()
            stepsCacheRef.current[goal.id] = { data: Array.isArray(stepsData) ? stepsData : [], loaded: true }
          // Trigger reactivity
          setStepsCacheVersion((prev: Record<string, number>) => ({ ...prev, [goal.id]: (prev[goal.id] || 0) + 1 }))
          }
        } catch (error) {
          console.error('Error refreshing steps cache:', error)
        }
      }

      // Save steps - only save if they have a title
      // Note: New steps are already saved directly in the modal, so we only need to update/delete existing steps
      let stepsChanged = false
      for (const step of formData.steps) {
        if (!step.title || !step.title.trim()) {
          // Delete step if it exists and has no title
          if (step.id && !step.id.startsWith('temp-')) {
            try {
              const response = await fetch(`/api/daily-steps?stepId=${step.id}`, {
                method: 'DELETE'
              })
              if (response.ok) {
                stepsChanged = true
              }
            } catch (error) {
              console.error('Error deleting empty step:', error)
            }
          }
          continue
        }
        
        // Skip temp steps - they are already saved in the modal
        if (step.id && step.id.startsWith('temp-')) {
          continue
        }
        
        if (step.id) {
          // Existing step - update it
          try {
            const response = await fetch('/api/daily-steps', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                stepId: step.id,
                title: step.title.trim(),
                description: step.description || '',
                date: step.date || null,
                completed: step.completed || false
              })
            })
            if (response.ok) {
              stepsChanged = true
            } else {
              console.error('Error updating step:', await response.text())
            }
          } catch (error) {
            console.error('Error updating step:', error)
          }
        }
      }
      
      // Update cache if steps were changed
      if (stepsChanged && goal.id) {
        try {
          const stepsResponse = await fetch(`/api/daily-steps?goalId=${goal.id}`)
          if (stepsResponse.ok) {
            const stepsData = await stepsResponse.json()
            const stepsArray = Array.isArray(stepsData) ? stepsData : []
            stepsCacheRef.current[goal.id] = { data: stepsArray, loaded: true }
            // Trigger reactivity - update stepsCacheVersion to force re-render in SortableGoal
            setStepsCacheVersion((prev: Record<string, number>) => {
              const newVersion = (prev[goal.id] || 0) + 1
              console.log('GoalEditingForm: Updating stepsCacheVersion (handleSubmit)', { goalId: goal.id, newVersion, stepsCount: stepsArray.length })
              return { ...prev, [goal.id]: newVersion }
            })
          }
        } catch (error) {
          console.error('Error refreshing steps cache:', error)
        }
      }

    }

    return (
      <div 
        className="editing-form p-6 h-full flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
        onMouseMove={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
          {/* Left Column - Text Fields */}
        <div className="space-y-4 flex flex-col">
          <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                {t('goals.goalTitle')} <span className="text-orange-500">*</span>
              </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all bg-white shadow-sm hover:shadow-md"
                placeholder={t('goals.goalTitlePlaceholder')}
            />
          </div>
          
          <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                {t('goals.goalDescription')}
              </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all bg-white shadow-sm hover:shadow-md resize-none"
                rows={4}
                placeholder={t('goals.goalDescriptionPlaceholder')}
            />
          </div>
          
            {/* Compact Icon-based Controls */}
          <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                {t('goals.settings')}
              </label>
              <div className="flex items-center gap-3 flex-wrap">
                {/* Date Picker Icon */}
                <div className="relative">
                  <button
                    ref={setDatePickerButtonRef}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowGoalDatePicker(!showGoalDatePicker)
                      setShowStatusPicker(false)
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm border-2 rounded-xl transition-all shadow-sm hover:shadow-md ${
                      formData.target_date 
                        ? 'border-orange-300 bg-orange-50 text-orange-700' 
                        : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300'
                    }`}
                    title={t('common.endDate')}
                  >
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">
                      {formData.target_date 
                        ? new Date(formData.target_date).toLocaleDateString(localeCode, { day: '2-digit', month: '2-digit', year: 'numeric' })
                        : t('common.endDate')}
                    </span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${showGoalDatePicker ? 'rotate-180' : ''}`} />
                  </button>
                  {showGoalDatePicker && datePickerPosition && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowGoalDatePicker(false)}
                      />
                      <div 
                        className="fixed z-50 bg-white border-2 border-gray-200 rounded-xl shadow-2xl p-4"
                        style={{
                          top: `${datePickerPosition.top}px`,
                          left: `${datePickerPosition.left}px`
                        }}
                      >
            <input
              type="date"
              value={formData.target_date}
                          onChange={(e) => {
                            setFormData({...formData, target_date: e.target.value})
                            setShowGoalDatePicker(false)
                          }}
                          className="text-base px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                          autoFocus
                        />
                      </div>
                    </>
                  )}
          </div>
          
                {/* Status Picker Icon */}
                <div className="relative">
                  <button
                    ref={setStatusPickerButtonRef}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowStatusPicker(!showStatusPicker)
                      setShowGoalDatePicker(false)
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm border-2 rounded-xl transition-all shadow-sm hover:shadow-md ${
                      formData.status === 'active' 
                        ? 'border-green-300 bg-green-50 text-green-700' 
                        : formData.status === 'completed'
                        ? 'border-blue-300 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300'
                    }`}
                    title="Status"
                  >
                    {formData.status === 'active' ? (
                      <Target className="w-4 h-4" />
                    ) : formData.status === 'completed' ? (
                    <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Moon className="w-4 h-4" />
                    )}
                    <span className="font-medium">
                      {formData.status === 'active' ? t('goals.status.active') : 
                       formData.status === 'completed' ? t('goals.status.completed') : t('goals.status.paused')}
                    </span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${showStatusPicker ? 'rotate-180' : ''}`} />
                  </button>
                  {showStatusPicker && statusPickerPosition && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowStatusPicker(false)}
                      />
                      <div 
                        className="fixed z-50 bg-white border-2 border-gray-200 rounded-xl shadow-2xl min-w-[160px]"
                        style={{
                          top: `${statusPickerPosition.top}px`,
                          left: `${statusPickerPosition.left}px`
                        }}
                      >
                        {['active', 'paused', 'completed'].map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => {
                              setFormData({...formData, status: status as any})
                              setShowStatusPicker(false)
                            }}
                            className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors font-medium ${
                              formData.status === status 
                                ? status === 'active' 
                                  ? 'bg-green-50 text-green-700 font-semibold' 
                                  : status === 'completed'
                                  ? 'bg-blue-50 text-blue-700 font-semibold'
                                  : 'bg-orange-50 text-orange-700 font-semibold'
                                : 'text-gray-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {status === 'active' ? (
                                <>
                                  <Target className="w-4 h-4" />
                                  <span>{t('goals.status.active')}</span>
                                </>
                              ) : status === 'completed' ? (
                                <>
                                  <CheckCircle className="w-4 h-4" />
                                  <span>{t('goals.status.completed')}</span>
                                </>
                              ) : (
                                <>
                                  <Moon className="w-4 h-4" />
                                  <span>{t('goals.status.paused')}</span>
                                </>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Steps */}
          <div className="space-y-5 flex flex-col min-h-0">
            {/* Steps Section */}
            <div className="bg-white rounded-xl p-4 border-2 border-gray-100 shadow-sm flex flex-col flex-1 min-h-0" data-steps-section>
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <label className="block text-sm font-semibold text-gray-800">{t('goals.steps')}</label>
                <button
                  type="button"
                  data-add-step-button
                  onClick={() => {
                    setFormData({
                      ...formData,
                      steps: [...formData.steps, { id: `temp-${crypto.randomUUID()}`, title: '', description: '', date: '', completed: false, isEditing: true }]
                    })
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {t('goals.addStep')}
                </button>
              </div>
              {formData.steps.length === 0 ? (
                <div className="text-center py-6 text-gray-400 flex-shrink-0">
                  <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-xs">{t('steps.noSteps')}</p>
                </div>
              ) : (
                <div className="space-y-2 flex-1 overflow-y-auto pr-1 min-h-0">
                  {formData.steps.map((step, index) => {
                    const isEditingStep = step.isEditing
                    
                    return (
                      <div 
                        key={step.id} 
                        data-step-id={step.id}
                        className="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-orange-300 transition-colors"
                      >
                        {isEditingStep ? (
                          <>
                            <div className="flex items-start justify-between mb-2">
                              <span className="text-xs font-semibold text-gray-600 bg-white px-2 py-0.5 rounded">{t('goals.stepNumber')} {index + 1}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    steps: formData.steps.filter(s => s.id !== step.id)
                                  })
                                }}
                                className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded p-1 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <input
                              type="text"
                              value={step.title}
                              onChange={(e) => {
                                const updatedSteps = formData.steps.map(s =>
                                  s.id === step.id ? { ...s, title: e.target.value } : s
                                )
                                setFormData({ ...formData, steps: updatedSteps })
                              }}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-orange-600 focus:border-orange-600 bg-white"
                              placeholder={t('steps.stepTitle')}
                              autoFocus
                            />
                            <input
                              type="date"
                              value={step.date || ''}
                              onChange={(e) => {
                                const updatedSteps = formData.steps.map(s =>
                                  s.id === step.id ? { ...s, date: e.target.value } : s
                                )
                                setFormData({ ...formData, steps: updatedSteps })
                              }}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-orange-600 focus:border-orange-600 bg-white"
                              placeholder={t('steps.dateOptional')}
                            />
                            <textarea
                              value={step.description || ''}
                              onChange={(e) => {
                                const updatedSteps = formData.steps.map(s =>
                                  s.id === step.id ? { ...s, description: e.target.value } : s
                                )
                                setFormData({ ...formData, steps: updatedSteps })
                              }}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-orange-600 focus:border-orange-600 bg-white resize-none"
                              rows={2}
                              placeholder={t('steps.descriptionOptional')}
                            />
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!step.title || !step.title.trim()) {
                                    // Remove step if no title
                                    setFormData({
                                      ...formData,
                                      steps: formData.steps.filter(s => s.id !== step.id)
                                    })
                                    return
                                  }
                                  
                                  // Use userId from prop or fallback to player?.user_id
                                  const currentUserId = userId || player?.user_id
                                  if (!currentUserId) {
                                    console.error('Cannot save step: userId not available')
                                    alert('Chyba: Uživatel není načten. Zkuste to prosím znovu.')
                                    return
                                  }
                                  
                                  // If it's a temp step, create it in the database
                                  if (step.id.startsWith('temp-')) {
                                    try {
                                      const response = await fetch('/api/daily-steps', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          userId: currentUserId,
                                          goalId: goal.id,
                                          title: step.title.trim(),
                                          description: step.description || '',
                                          date: step.date || null
                                        })
                                      })
                                      
                                      if (response.ok) {
                                        const savedStep = await response.json()
                                        // Replace temp step with saved step
                                        const updatedSteps = formData.steps.map(s =>
                                          s.id === step.id ? { ...s, id: savedStep.id, isEditing: false } : s
                                        )
                                        setFormData({ ...formData, steps: updatedSteps })
                                        
                                        // Update cache and refresh steps count in SortableGoal
                                        if (goal.id) {
                                          const stepsResponse = await fetch(`/api/daily-steps?goalId=${goal.id}`)
                                          if (stepsResponse.ok) {
                                            const stepsData = await stepsResponse.json()
                                            const stepsArray = Array.isArray(stepsData) ? stepsData : []
                                            stepsCacheRef.current[goal.id] = { data: stepsArray, loaded: true }
                                            // Trigger reactivity - update stepsCacheVersion to force re-render in SortableGoal
                                            setStepsCacheVersion((prev: Record<string, number>) => {
                                              const newVersion = (prev[goal.id] || 0) + 1
                                              console.log('GoalEditingForm: Updating stepsCacheVersion (create)', { goalId: goal.id, newVersion, stepsCount: stepsArray.length })
                                              return { ...prev, [goal.id]: newVersion }
                                            })
                                          }
                                        }
                                      } else {
                                        const errorText = await response.text()
                                        console.error('Error saving step:', errorText)
                                        alert(`Chyba při ukládání kroku: ${errorText}`)
                                      }
                                    } catch (error) {
                                      console.error('Error saving step:', error)
                                      alert(`Chyba při ukládání kroku: ${error}`)
                                    }
                                  } else {
                                    // Existing step - update it in the database
                                    try {
                                      const response = await fetch('/api/daily-steps', {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          stepId: step.id,
                                          title: step.title.trim(),
                                          description: step.description || '',
                                          date: step.date || null,
                                          completed: step.completed || false
                                        })
                                      })
                                      
                                      if (response.ok) {
                                        // Update step in formData
                                  const updatedSteps = formData.steps.map(s =>
                                    s.id === step.id ? { ...s, isEditing: false } : s
                                  )
                                  setFormData({ ...formData, steps: updatedSteps })
                                        
                                        // Update cache and refresh steps count in SortableGoal
                                        if (goal.id) {
                                          const stepsResponse = await fetch(`/api/daily-steps?goalId=${goal.id}`)
                                          if (stepsResponse.ok) {
                                            const stepsData = await stepsResponse.json()
                                            const stepsArray = Array.isArray(stepsData) ? stepsData : []
                                            stepsCacheRef.current[goal.id] = { data: stepsArray, loaded: true }
                                            // Trigger reactivity - update stepsCacheVersion to force re-render in SortableGoal
                                            setStepsCacheVersion((prev: Record<string, number>) => {
                                              const newVersion = (prev[goal.id] || 0) + 1
                                              console.log('GoalEditingForm: Updating stepsCacheVersion (update)', { goalId: goal.id, newVersion, stepsCount: stepsArray.length })
                                              return { ...prev, [goal.id]: newVersion }
                                            })
                                          }
                                        }
                                      } else {
                                        const errorText = await response.text()
                                        console.error('Error updating step:', errorText)
                                        alert(`Chyba při aktualizaci kroku: ${errorText}`)
                                      }
                                    } catch (error) {
                                      console.error('Error updating step:', error)
                                      alert(`Chyba při aktualizaci kroku: ${error}`)
                                    }
                                  }
                                }}
                                className="px-3 py-1.5 text-xs font-medium bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                              >
                                {t('common.save')}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    steps: formData.steps.filter(s => s.id !== step.id)
                                  })
                                }}
                                className="px-3 py-1.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                              >
                                {t('common.cancel')}
                              </button>
                            </div>
                          </>
                        ) : (
                          <div 
                            className="flex items-center justify-between cursor-pointer group"
                            onClick={() => {
                              const updatedSteps = formData.steps.map(s =>
                                s.id === step.id ? { ...s, isEditing: true } : s
                              )
                              setFormData({ ...formData, steps: updatedSteps })
                            }}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <input
                                type="checkbox"
                                checked={step.completed || false}
                                onChange={async (e) => {
                                  e.stopPropagation()
                                  const updatedSteps = formData.steps.map(s =>
                                    s.id === step.id ? { ...s, completed: e.target.checked } : s
                                  )
                                  setFormData({ ...formData, steps: updatedSteps })
                                  
                                  // Save completion status immediately
                                  if (step.id && !step.id.startsWith('temp-')) {
                                    try {
                                      await fetch('/api/daily-steps', {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          stepId: step.id,
                                          completed: e.target.checked,
                                          completedAt: e.target.checked ? new Date().toISOString() : null
                                        })
                                      })
                                    } catch (error) {
                                      console.error('Error updating step completion:', error)
                                    }
                                  }
                                }}
                                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 cursor-pointer"
                              />
                              <span className="text-xs font-semibold text-gray-500 w-12">#{index + 1}</span>
                              <div className="flex-1">
                                <div className={`font-medium text-sm ${step.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                  {step.title || t('common.noTitle')}
                                </div>
                                {step.date && (
                                  <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(step.date).toLocaleDateString(localeCode, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const updatedSteps = formData.steps.map(s =>
                                    s.id === step.id ? { ...s, isEditing: true } : s
                                  )
                                  setFormData({ ...formData, steps: updatedSteps })
                                }}
                                className="text-gray-400 hover:text-orange-600 p-1"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation()
                                  // Delete from database if it exists
                                  if (step.id && !step.id.startsWith('temp-')) {
                                    try {
                                      const response = await fetch(`/api/daily-steps?stepId=${step.id}`, {
                                        method: 'DELETE'
                                      })
                                      if (response.ok && goal.id) {
                                        // Update cache after deletion
                                        const stepsResponse = await fetch(`/api/daily-steps?goalId=${goal.id}`)
                                        if (stepsResponse.ok) {
                                          const stepsData = await stepsResponse.json()
                                          const stepsArray = Array.isArray(stepsData) ? stepsData : []
                                          stepsCacheRef.current[goal.id] = { data: stepsArray, loaded: true }
                                          // Trigger reactivity - update stepsCacheVersion to force re-render in SortableGoal
                                          setStepsCacheVersion((prev: Record<string, number>) => {
                                            const newVersion = (prev[goal.id] || 0) + 1
                                            console.log('GoalEditingForm: Updating stepsCacheVersion (delete)', { goalId: goal.id, newVersion, stepsCount: stepsArray.length })
                                            return { ...prev, [goal.id]: newVersion }
                                          })
                                        }
                                      }
                                    } catch (error) {
                                      console.error('Error deleting step:', error)
                                    }
                                  }
                                  setFormData({
                                    ...formData,
                                    steps: formData.steps.filter(s => s.id !== step.id)
                                  })
                                }}
                                className="text-gray-400 hover:text-red-600 p-1"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
              </div>
        </div>
        
        <div className="flex gap-3 mt-6 pt-6 border-t-2 border-gray-200 flex-shrink-0">
            <button
              onClick={handleSubmit}
              disabled={!hasUnsavedChanges}
              className={`flex-1 px-6 py-3 text-sm font-semibold rounded-xl transition-all ${
                hasUnsavedChanges
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 cursor-pointer'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              title={hasUnsavedChanges ? t('goals.saveChanges') : 'Žádné změny k uložení'}
            >
            {t('goals.saveChanges')}
            </button>
            <button
              onClick={onCancel}
            className="px-6 py-3 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-all"
              title={t('common.cancel')}
            >
            {t('common.cancel')}
            </button>
            <button
              onClick={() => onDelete(goal.id)}
            className="px-6 py-3 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 transition-all"
              title={t('goals.delete')}
            >
            <Trash2 className="w-4 h-4 inline mr-1" />
            {t('goals.delete')}
            </button>
        </div>
      </div>
    )
  };

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
  const completedSteps = dailySteps.filter(step => step.completed).length
  const totalSteps = dailySteps.length
  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0
  const completedGoals = goals.filter(goal => goal.steps && goal.steps.every((step: any) => step.completed)).length
  const activeHabits = todaysHabits.filter(habit => habit && habit.completed_today === true).length

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
  const totalCompletedGoals = goals.filter(goal => goal.status === 'completed').length

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
        // Update goals list
        if (onGoalsUpdate) {
          const updatedGoals = goals.map(g => 
            g.id === goalId ? updatedGoal : g
          )
          onGoalsUpdate(updatedGoals)
        }
      }
    } catch (error) {
      console.error('Error updating goal progress:', error)
    }
  }

  // Draggable Step Component
  function DraggableStep({ step, isEditing, initializeEditingStep, handleStepToggle, goals, editingStep, setEditingStep, handleUpdateStep, dailySteps, onDailyStepsUpdate, isLoading }: any) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      isDragging,
    } = useDraggable({
      id: step.id,
    })

    const [showDateMenu, setShowDateMenu] = useState(false)
    const [showXpMenu, setShowXpMenu] = useState(false)

    const style = {
      transform: CSS.Translate.toString(transform),
      opacity: isDragging ? 0 : 1, // Hide original element completely when dragging
    }

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`p-3 rounded-lg border border-gray-200 bg-white hover:bg-orange-50/30 hover:border-orange-200 transition-all relative shadow-sm ${
          step.completed ? 'bg-green-50/50 border-green-200' : ''
        }`}
      >
        <div className="flex items-start gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (!isLoading) {
                handleStepToggle(step.id, !step.completed)
              }
            }}
            onPointerDown={(e) => {
              e.stopPropagation() // Prevent drag when clicking checkbox
            }}
            disabled={isLoading}
            className="flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 flex-shrink-0"
          >
            {isLoading ? (
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
          <div 
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => isEditing ? setEditingStep(null) : initializeEditingStep(step)}
          >
            <div className={`font-semibold text-sm ${step.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
              {step.title}
            </div>
            {step.description && (
              <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                {step.description}
              </div>
            )}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {step.goal_id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    initializeEditingStep(step)
                  }}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-purple-50 border border-purple-100 cursor-pointer hover:bg-purple-100 hover:border-purple-200 transition-all duration-200 shadow-sm"
                  title="Kliknutím otevřete úpravu"
                >
                  <Target className="w-3.5 h-3.5 text-purple-600" />
                  <span className="text-purple-700 font-medium truncate max-w-[100px]">
                  {goals.find((g: any) => g.id === step.goal_id)?.title || 'Cíl'}
                  </span>
                </button>
              )}
              {step.estimated_time && (
                <div className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-100 shadow-sm">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-blue-700 font-medium">{step.estimated_time || 0} min</span>
                </div>
              )}
              {step.date && (
                <div className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 shadow-sm">
                  <Calendar className="w-3.5 h-3.5 text-gray-600" />
                  <span className="text-gray-700 font-medium">
                    {new Date(step.date).toLocaleDateString(localeCode)}
                  </span>
                </div>
              )}
              {step.is_important && (
                <div className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-yellow-50 border border-yellow-200 shadow-sm">
                  <Star className="w-3.5 h-3.5 text-yellow-600 fill-yellow-600" />
                  <span className="text-yellow-700 font-medium">Důležité</span>
                </div>
              )}
              {step.is_urgent && (
                <div className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-orange-50 border border-orange-200 shadow-sm">
                  <Zap className="w-3.5 h-3.5 text-orange-600 fill-orange-600" />
                  <span className="text-orange-700 font-medium">Urgentní</span>
                </div>
              )}
              {false && step.xp_reward > 0 && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowXpMenu(!showXpMenu)
                    }}
                    className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded font-medium hover:bg-purple-200 transition-colors cursor-pointer"
                    title="Kliknutím upravíte XP"
                  >
                    ⭐ {step.xp_reward} XP
                  </button>
                  {/* XP Menu Popup */}
                  {showXpMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowXpMenu(false)}
                      />
                      <div className="absolute left-0 top-full mt-1 z-30 bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[200px]">
                        <label className="block text-xs font-medium text-gray-700 mb-1">XP Odměna</label>
                        <div className="flex gap-2 mb-2">
                          {[1, 2, 3, 4, 5].map(xp => (
                            <button
                              key={xp}
                              onClick={async (e) => {
                                e.stopPropagation()
                                try {
                                  const response = await fetch('/api/daily-steps', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      stepId: step.id,
                                      title: step.title,
                                      description: step.description,
                                      goalId: step.goal_id,
                                      isImportant: step.is_important,
                                      isUrgent: step.is_urgent,
                                      estimatedTime: step.estimated_time,
                                      xpReward: xp,
                                      date: step.date
                                    })
                                  })
                                  if (response.ok) {
                                    const updatedStep = await response.json()
                                    setShowXpMenu(false)
                                    // Refresh steps
                                    if (onDailyStepsUpdate) {
                                      const allSteps = dailySteps.map((s: any) => s.id === step.id ? updatedStep : s)
                                      onDailyStepsUpdate(allSteps)
                                    }
                                  }
                                } catch (error) {
                                  console.error('Error updating XP:', error)
                                }
                              }}
                              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                step.xp_reward === xp 
                                  ? 'bg-purple-500 text-white' 
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {xp}
                            </button>
                          ))}
                        </div>
                        <input
                          type="number"
                          min="1"
                          placeholder="Vlastní XP"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 mb-2"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                              const xpValue = parseInt((e.target as HTMLInputElement).value)
                              if (xpValue && xpValue > 0) {
                                try {
                                  const response = await fetch('/api/daily-steps', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      stepId: step.id,
                                      title: step.title,
                                      description: step.description,
                                      goalId: step.goal_id,
                                      isImportant: step.is_important,
                                      isUrgent: step.is_urgent,
                                      estimatedTime: step.estimated_time,
                                      xpReward: xpValue,
                                      date: step.date
                                    })
                                  })
                                  if (response.ok) {
                                    const updatedStep = await response.json()
                                    setShowXpMenu(false)
                                    // Refresh steps
                                    if (onDailyStepsUpdate) {
                                      const allSteps = dailySteps.map((s: any) => s.id === step.id ? updatedStep : s)
                                      onDailyStepsUpdate(allSteps)
                                    }
                                  }
                                } catch (error) {
                                  console.error('Error updating XP:', error)
                                }
                              }
                            }
                          }}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowXpMenu(false)
                          }}
                          className="w-full px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                        >
                          {t('common.back')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Drag handle - only this area activates drag */}
          <div
            {...listeners}
            {...attributes}
            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM7 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM7 14a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM13 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM13 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM13 14a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />
            </svg>
          </div>
        </div>
        {isEditing && (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="space-y-2">
              <input
                type="text"
                value={editingStep.title || ''}
                onChange={(e) => setEditingStep({...editingStep, title: e.target.value})}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                placeholder="Název"
              />
              <textarea
                value={editingStep.description || ''}
                onChange={(e) => setEditingStep({...editingStep, description: e.target.value})}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 resize-none"
                placeholder="Popis (volitelné)"
                rows={2}
              />
              <select
                value={editingStep.goalId || ''}
                onChange={(e) => setEditingStep({...editingStep, goalId: e.target.value || null})}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Vyberte cíl (volitelné)</option>
                {goals.filter((goal: any) => goal.status === 'active').map((goal: any) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.title}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600 whitespace-nowrap">⭐ XP:</label>
                <input
                  type="number"
                  min="1"
                  value={editingStep.xpReward || 1}
                  onChange={(e) => setEditingStep({...editingStep, xpReward: parseInt(e.target.value) || 1})}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <input
                type="date"
                value={editingStep.date || ''}
                onChange={(e) => setEditingStep({...editingStep, date: e.target.value})}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleUpdateStep}
                  className="px-3 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-600"
                >
                  Uložit
                </button>
                <button
                  onClick={() => setEditingStep(null)}
                  className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                >
                  Zrušit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Droppable Column Component
  function DroppableColumn({ id, children, className, style }: { id: string, children: React.ReactNode, className?: string, style?: React.CSSProperties }) {
    const { setNodeRef, isOver } = useDroppable({
      id: id,
    })

    return (
      <div
        ref={setNodeRef}
        className={`${className} ${isOver ? 'ring-4 ring-orange-400 ring-opacity-50' : ''}`}
        style={style}
      >
        {children}
      </div>
    )
  }

  const renderGoalsContent = () => {
    return (
      <div className="w-full h-full flex flex-col">
            {/* Create Goal Form */}
            {showCreateGoal && (
          <div className="p-6 bg-gradient-to-br from-white to-gray-50 border-b border-gray-200 max-h-[50vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Vytvořit nový cíl</h3>
                    <p className="text-sm text-gray-500 mt-1">Vyplňte informace o vašem cíli</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowCreateGoal(false)
                      setNewGoal({
                        title: '',
                        description: '',
                        target_date: null,
                        status: 'active',
                        icon: 'Target',
                        steps: []
                      })
                      setShowGoalDatePicker(false)
                      setShowStatusPicker(false)
                    }}
                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1.5 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column - Text Fields */}
                <div className="space-y-4">
                  <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        {t('goals.goalTitle')} <span className="text-orange-500">*</span>
                      </label>
                    <input
                      type="text"
                      value={newGoal.title}
                      onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                        className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all bg-white shadow-sm hover:shadow-md"
                        placeholder={t('goals.goalTitlePlaceholder')}
                    />
                  </div>
                  
                  <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        {t('goals.goalDescription')}
                      </label>
                    <textarea
                      value={newGoal.description || ''}
                      onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                        className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all bg-white shadow-sm hover:shadow-md resize-none"
                        rows={4}
                        placeholder={t('goals.goalDescriptionPlaceholder')}
                    />
                  </div>
                  
                    {/* Compact Icon-based Controls */}
                  <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        {t('goals.settings')}
                      </label>
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Date Picker Icon */}
                        <div className="relative">
                          <button
                            ref={setDatePickerButtonRef}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (datePickerButtonRef) {
                                const rect = datePickerButtonRef.getBoundingClientRect()
                                setDatePickerPosition({ top: rect.bottom + 5, left: rect.left })
                                setShowGoalDatePicker(true)
                              } else {
                              setShowGoalDatePicker(!showGoalDatePicker)
                              }
                              setShowStatusPicker(false)
                              setShowIconPicker(false)
                            }}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm border-2 rounded-xl transition-all shadow-sm hover:shadow-md ${
                              newGoal.target_date 
                                ? 'border-orange-300 bg-orange-50 text-orange-700' 
                                : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300'
                            }`}
                            title={t('common.endDate')}
                          >
                            <Calendar className="w-4 h-4" />
                            <span className="font-medium">
                              {newGoal.target_date 
                                ? new Date(newGoal.target_date).toLocaleDateString(localeCode, { day: '2-digit', month: '2-digit', year: 'numeric' })
                                : t('common.endDate')}
                            </span>
                            <ChevronDown className={`w-3 h-3 transition-transform ${showGoalDatePicker ? 'rotate-180' : ''}`} />
                          </button>
                          {showGoalDatePicker && datePickerPosition && (
                            <>
                              <div 
                                className="fixed inset-0 z-40" 
                                onClick={() => setShowGoalDatePicker(false)}
                              />
                              <div 
                                className="fixed z-50 bg-white border-2 border-gray-200 rounded-xl shadow-2xl p-4"
                                style={{
                                  top: `${datePickerPosition.top}px`,
                                  left: `${datePickerPosition.left}px`
                                }}
                              >
                    <input
                      type="date"
                      value={newGoal.target_date ? new Date(newGoal.target_date).toISOString().split('T')[0] : ''}
                                  onChange={(e) => {
                                    setNewGoal({...newGoal, target_date: e.target.value ? new Date(e.target.value).toISOString() : null as any})
                                    setShowGoalDatePicker(false)
                                  }}
                                  className="text-base px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                                  autoFocus
                    />
                              </div>
                            </>
                          )}
                  </div>
                  
                        {/* Icon Picker */}
                        <div className="relative">
                          <button
                            ref={setIconPickerButtonRef}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              const rect = e.currentTarget.getBoundingClientRect()
                              setIconPickerPosition({ top: rect.bottom + 5, left: rect.left })
                              setShowIconPicker(true)
                              setShowGoalDatePicker(false)
                              setShowStatusPicker(false)
                              setIconPickerSearchQuery('')
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl transition-all shadow-sm hover:shadow-md hover:border-orange-300"
                            title="Ikona"
                          >
                            {(() => {
                              const IconComponent = getIconComponent(newGoal.icon)
                              return <IconComponent className="w-4 h-4 text-gray-700" />
                            })()}
                            <ChevronDown className={`w-3 h-3 transition-transform ${showIconPicker ? 'rotate-180' : ''}`} />
                          </button>
                          {showIconPicker && iconPickerPosition && (
                            <>
                              <div 
                                className="fixed inset-0 z-40" 
                                onClick={() => setShowIconPicker(false)}
                              />
                              <div 
                                className="fixed z-50 bg-white border-2 border-gray-200 rounded-xl shadow-2xl"
                                style={{
                                  top: `${iconPickerPosition.top}px`,
                                  left: `${iconPickerPosition.left}px`,
                                  width: '320px',
                                  maxHeight: '400px',
                                  display: 'flex',
                                  flexDirection: 'column'
                                }}
                              >
                                {/* Search bar */}
                                <div className="p-3 border-b border-gray-200">
                                  <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                      type="text"
                                      value={iconPickerSearchQuery}
                                      onChange={(e) => setIconPickerSearchQuery(e.target.value)}
                                      placeholder={t('common.search') || 'Hledat...'}
                                      className="w-full pl-9 pr-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                      autoFocus
                                    />
                                  </div>
                                </div>
                                
                                {/* Icons grid */}
                                <div className="p-3 overflow-y-auto flex-1">
                                  <div className="grid grid-cols-6 gap-2">
                                    {AVAILABLE_ICONS
                                      .filter(icon => {
                                        const query = iconPickerSearchQuery.toLowerCase().trim()
                                        if (!query) return true
                                        return icon.label.toLowerCase().includes(query) ||
                                               icon.name.toLowerCase().includes(query)
                                      })
                                      .map((icon) => {
                                        const IconComponent = getIconComponent(icon.name)
                                        const isSelected = newGoal.icon === icon.name
                                        if (!IconComponent) {
                                          console.warn(`Icon component not found for: ${icon.name}`)
                                          return null
                                        }
                                        return (
                                <button
                                            key={icon.name}
                                  type="button"
                                  onClick={() => {
                                              setNewGoal({...newGoal, icon: icon.name})
                                              setShowIconPicker(false)
                                              setIconPickerSearchQuery('')
                                  }}
                                            className={`p-2 rounded-lg transition-all hover:bg-gray-100 ${
                                              isSelected 
                                                ? 'bg-orange-50 border-2 border-orange-500' 
                                                : 'border-2 border-transparent hover:border-gray-300'
                                            }`}
                                            title={icon.label}
                                          >
                                            <IconComponent className={`w-5 h-5 mx-auto ${isSelected ? 'text-orange-600' : 'text-gray-700'}`} />
                                  </button>
                                        )
                                      })
                                      .filter(Boolean)}
                                  </div>
                                  {AVAILABLE_ICONS.filter(icon => {
                                    const query = iconPickerSearchQuery.toLowerCase().trim()
                                    if (!query) return false
                                    return icon.label.toLowerCase().includes(query) ||
                                           icon.name.toLowerCase().includes(query)
                                  }).length === 0 && iconPickerSearchQuery.trim() && (
                                    <div className="text-center py-8 text-gray-500 text-sm">
                                      {t('common.noResults') || 'Žádné výsledky'}
                                  </div>
                                )}
                                </div>
                              </div>
                            </>
                          )}
                  </div>
                  
                        {/* Status Picker Icon */}
                        <div className="relative">
                          <button
                            ref={setStatusPickerButtonRef}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowStatusPicker(!showStatusPicker)
                              setShowGoalDatePicker(false)
                              setShowIconPicker(false)
                            }}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm border-2 rounded-xl transition-all shadow-sm hover:shadow-md ${
                              newGoal.status === 'active' 
                                ? 'border-green-300 bg-green-50 text-green-700' 
                                : newGoal.status === 'completed'
                                ? 'border-blue-300 bg-blue-50 text-blue-700'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300'
                            }`}
                            title="Status"
                          >
                            {newGoal.status === 'active' ? (
                              <Target className="w-4 h-4" />
                            ) : newGoal.status === 'completed' ? (
                            <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Moon className="w-4 h-4" />
                            )}
                            <span className="font-medium">
                              {newGoal.status === 'active' ? t('goals.status.active') : 
                               newGoal.status === 'completed' ? t('goals.status.completed') : t('goals.status.paused')}
                            </span>
                            <ChevronDown className={`w-3 h-3 transition-transform ${showStatusPicker ? 'rotate-180' : ''}`} />
                          </button>
                          {showStatusPicker && statusPickerPosition && (
                            <>
                              <div 
                                className="fixed inset-0 z-40" 
                                onClick={() => setShowStatusPicker(false)}
                              />
                              <div 
                                className="fixed z-50 bg-white border-2 border-gray-200 rounded-xl shadow-2xl min-w-[160px]"
                                style={{
                                  top: `${statusPickerPosition.top}px`,
                                  left: `${statusPickerPosition.left}px`
                                }}
                              >
                                {['active', 'paused', 'completed'].map((status) => (
                                  <button
                                    key={status}
                                    type="button"
                                    onClick={() => {
                                      setNewGoal({...newGoal, status: status as any})
                                      setShowStatusPicker(false)
                                    }}
                                    className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors font-medium ${
                                      newGoal.status === status 
                                        ? status === 'active' 
                                          ? 'bg-green-50 text-green-700 font-semibold' 
                                          : status === 'completed'
                                          ? 'bg-blue-50 text-blue-700 font-semibold'
                                          : 'bg-orange-50 text-orange-700 font-semibold'
                                        : 'text-gray-700'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      {status === 'active' ? (
                                        <>
                                          <Target className="w-4 h-4" />
                                          <span>{t('goals.status.active')}</span>
                                        </>
                                      ) : status === 'completed' ? (
                                        <>
                                          <CheckCircle className="w-4 h-4" />
                                          <span>{t('goals.status.completed')}</span>
                                        </>
                                      ) : (
                                        <>
                                          <Moon className="w-4 h-4" />
                                          <span>{t('goals.status.paused')}</span>
                                        </>
                                      )}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Column - Steps */}
                  <div className="space-y-5">
                    {/* Steps Section */}
                    <div className="bg-white rounded-xl p-4 border-2 border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-semibold text-gray-800">{t('goals.steps')}</label>
                    <button
                          type="button"
                          onClick={() => {
                            setNewGoal({
                              ...newGoal,
                              steps: [...newGoal.steps, { id: crypto.randomUUID(), title: '', description: '', date: '', isEditing: true }]
                            })
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                          {t('goals.addStep')}
                    </button>
                      </div>
                      {newGoal.steps.length === 0 ? (
                        <div className="text-center py-6 text-gray-400">
                          <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <p className="text-xs">{t('steps.noSteps')}</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                          {newGoal.steps.map((step, index) => {
                            const isEditing = step.isEditing || (!step.title && step.id === newGoal.steps[newGoal.steps.length - 1]?.id)
                            
                            return (
                              <div 
                                key={step.id} 
                                data-step-id={step.id}
                                className="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-orange-300 transition-colors"
                              >
                                {isEditing ? (
                                  <>
                                    <div className="flex items-start justify-between mb-2">
                                      <span className="text-xs font-semibold text-gray-600 bg-white px-2 py-0.5 rounded">{t('goals.stepNumber')} {index + 1}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setNewGoal({
                                            ...newGoal,
                                            steps: newGoal.steps.filter(s => s.id !== step.id)
                                          })
                                        }}
                                        className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded p-1 transition-colors"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    <input
                                      type="text"
                                      value={step.title}
                                      onChange={(e) => {
                                        const updatedSteps = newGoal.steps.map(s =>
                                          s.id === step.id ? { ...s, title: e.target.value } : s
                                        )
                                        setNewGoal({ ...newGoal, steps: updatedSteps })
                                      }}
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-orange-600 focus:border-orange-600 bg-white"
                                      placeholder={t('steps.stepTitle')}
                                      autoFocus
                                    />
                                    <input
                                      type="date"
                                      value={step.date || ''}
                                      onChange={(e) => {
                                        const updatedSteps = newGoal.steps.map(s =>
                                          s.id === step.id ? { ...s, date: e.target.value } : s
                                        )
                                        setNewGoal({ ...newGoal, steps: updatedSteps })
                                      }}
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-orange-600 focus:border-orange-600 bg-white"
                                      placeholder={t('steps.dateOptional')}
                                    />
                                    <textarea
                                      value={step.description || ''}
                                      onChange={(e) => {
                                        const updatedSteps = newGoal.steps.map(s =>
                                          s.id === step.id ? { ...s, description: e.target.value } : s
                                        )
                                        setNewGoal({ ...newGoal, steps: updatedSteps })
                                      }}
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-orange-600 focus:border-orange-600 bg-white resize-none"
                                      rows={2}
                                      placeholder={t('steps.descriptionOptional')}
                                    />
                                    <div className="flex items-center gap-2 mt-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updatedSteps = newGoal.steps.map(s =>
                                            s.id === step.id ? { ...s, isEditing: false } : s
                                          )
                                          setNewGoal({ ...newGoal, steps: updatedSteps })
                                        }}
                                        className="px-3 py-1.5 text-xs font-medium bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                                      >
                                        {t('common.save')}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setNewGoal({
                                            ...newGoal,
                                            steps: newGoal.steps.filter(s => s.id !== step.id)
                                          })
                                        }}
                                        className="px-3 py-1.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                      >
                                        {t('common.cancel')}
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  <div 
                                    className="flex items-center justify-between cursor-pointer group"
                                    onClick={() => {
                                      const updatedSteps = newGoal.steps.map(s =>
                                        s.id === step.id ? { ...s, isEditing: true } : s
                                      )
                                      setNewGoal({ ...newGoal, steps: updatedSteps })
                                    }}
                                  >
                                    <div className="flex items-center gap-3 flex-1">
                                      <span className="text-xs font-semibold text-gray-500 w-12">#{index + 1}</span>
                                      <div className="flex-1">
                                        <div className="font-medium text-sm text-gray-900">{step.title || t('common.noTitle')}</div>
                                        {step.date && (
                                          <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(step.date).toLocaleDateString(localeCode, { day: '2-digit', month: '2-digit' })}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          const updatedSteps = newGoal.steps.map(s =>
                                            s.id === step.id ? { ...s, isEditing: true } : s
                                          )
                                          setNewGoal({ ...newGoal, steps: updatedSteps })
                                        }}
                                        className="text-gray-400 hover:text-orange-600 p-1"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setNewGoal({
                                            ...newGoal,
                                            steps: newGoal.steps.filter(s => s.id !== step.id)
                                          })
                                        }}
                                        className="text-gray-400 hover:text-red-600 p-1"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                    )}
                  </div>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6 pt-6 border-t-2 border-gray-200 sticky bottom-0 bg-gradient-to-br from-white to-gray-50">
                    <button
                      onClick={handleCreateGoal}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      title="Vytvořit cíl"
                    >
                    ✨ Vytvořit cíl
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateGoal(false)
                        setNewGoal({
                          title: '',
                          description: '',
                          target_date: null,
                        status: 'active',
                        icon: 'Target',
                        steps: []
                        })
                      setShowGoalDatePicker(false)
                      setShowStatusPicker(false)
                      setShowIconPicker(false)
                      }}
                    className="px-6 py-3 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-all"
                      title="Zrušit"
                    >
                    Zrušit
                    </button>
                </div>
              </div>
            )}
            
        {/* Filters Row */}
        <div className="flex items-center justify-between gap-4 p-4 bg-white border-b border-gray-200">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Status Filter */}
            <select
              value={goalsStatusFilter}
              onChange={(e) => setGoalsStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600 bg-white"
            >
              <option value="all">{t('goals.filters.status.all')}</option>
              <option value="active">{t('goals.filters.status.active')}</option>
              <option value="completed">{t('goals.filters.status.completed')}</option>
              <option value="paused">{t('goals.filters.status.paused')}</option>
            </select>
            
          </div>
          
          {/* Add Button */}
          <button
            onClick={() => setShowCreateGoal(true)}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <span className="text-lg">+</span>
            {t('goals.addGoal')}
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="w-full overflow-x-auto" style={{ overflowY: 'visible' }}>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <table className="w-full border-collapse" style={{ overflow: 'visible' }}>
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 first:pl-6">Název</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 w-32">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 w-40">Datum</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 w-12 last:pr-6"></th>
                  </tr>
                </thead>
              <tbody style={{ overflow: 'visible' }}>
                {sortedGoals.filter((goal: any) => {
                  // Filter by status
                  if (goalsStatusFilter !== 'all' && goal.status !== goalsStatusFilter) {
                    return false
                  }
                  
                  return true
                }).map((goal, index) => {
                  const isEditing = editingGoal && editingGoal.id === goal.id
                  
                    return (
                    <Fragment key={goal.id}>
                      <tr
                        onClick={() => {
                          if (isEditing) {
                            setEditingGoal(null)
                          } else {
                            initializeEditingGoal(goal)
                          }
                        }}
                        className={`border-b border-gray-100 hover:bg-orange-50/30 cursor-pointer transition-all duration-200 last:border-b-0 ${
                          goal.status === 'completed' ? 'bg-green-50/50 hover:bg-green-50' : 'bg-white'
                        }`}
                      >
                        <td className="px-4 py-2 first:pl-6">
                          <span className={`font-semibold text-sm ${goal.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                            {goal.title}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <span 
                            onClick={(e) => {
                              e.stopPropagation()
                              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                              setQuickEditGoalPosition({ top: rect.bottom + 4, left: rect.left })
                              setQuickEditGoalId(goal.id)
                              setQuickEditGoalField('status')
                            }}
                            className={`text-xs px-2.5 py-1.5 rounded-lg font-medium cursor-pointer hover:opacity-80 transition-opacity ${
                              goal.status === 'active' ? 'bg-green-100 text-green-700' :
                              goal.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {goal.status === 'active' ? t('goals.status.active') :
                             goal.status === 'completed' ? t('goals.status.completed') :
                             t('goals.status.paused')}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <span
                            onClick={(e) => {
                              e.stopPropagation()
                              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                              setQuickEditGoalPosition({ top: rect.bottom + 4, left: rect.left })
                              setQuickEditGoalId(goal.id)
                              setQuickEditGoalField('date')
                            }}
                            className="text-xs text-gray-700 cursor-pointer hover:text-orange-600 transition-colors"
                          >
                            {goal.target_date ? (
                              new Date(goal.target_date).toLocaleDateString(localeCode)
                            ) : (
                              <span className="text-gray-400">Bez data</span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-2 last:pr-6">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              initializeEditingGoal(goal)
                            }}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            title={t('common.edit') || 'Upravit'}
                          >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                      {isEditing && (
                        <tr>
                          <td colSpan={6} className="px-4 py-3 bg-orange-50/50 first:pl-6 last:pr-6">
                            <GoalEditingForm
                        goal={goal}
                              userId={userId}
                              player={player}
                              onUpdate={handleUpdateGoal}
                              onCancel={() => setEditingGoal(null)}
                              onDelete={handleDeleteGoal}
                              setStepsCacheVersion={setStepsCacheVersion}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                  })}
                  {sortedGoals.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      <p className="text-lg">Žádné cíle nejsou nastavené</p>
                      <p className="text-sm">Klikněte na tlačítko výše pro přidání nového cíle</p>
                    </td>
                  </tr>
                  )}
                </tbody>
              </table>
                </div>
          </div>
        </div>
        
        {/* Quick Edit Modals for Goals */}
        {quickEditGoalId && quickEditGoalPosition && typeof window !== 'undefined' && createPortal(
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={(e) => {
                e.stopPropagation()
                setQuickEditGoalId(null)
                setQuickEditGoalField(null)
                setQuickEditGoalPosition(null)
              }}
            />
            <div 
              className="fixed z-50 bg-white border-2 border-gray-200 rounded-xl shadow-2xl p-4 min-w-[250px] max-w-[90vw]"
              style={(() => {
                if (typeof window === 'undefined') {
                  return {
                    top: `${quickEditGoalPosition.top}px`,
                    left: `${quickEditGoalPosition.left}px`
                  }
                }
                
                // Calculate adjusted position to keep modal on screen
                const modalWidth = 250 // min-w-[250px]
                const modalHeight = 200 // estimated height
                const padding = 10 // padding from screen edges
                
                let adjustedTop = quickEditGoalPosition.top
                let adjustedLeft = quickEditGoalPosition.left
                
                // Adjust horizontal position
                if (adjustedLeft + modalWidth > window.innerWidth - padding) {
                  adjustedLeft = window.innerWidth - modalWidth - padding
                }
                if (adjustedLeft < padding) {
                  adjustedLeft = padding
                }
                
                // Adjust vertical position
                if (adjustedTop + modalHeight > window.innerHeight - padding) {
                  adjustedTop = quickEditGoalPosition.top - modalHeight - 40 // Position above the element
                  // If still off screen, position at top
                  if (adjustedTop < padding) {
                    adjustedTop = padding
                  }
                }
                if (adjustedTop < padding) {
                  adjustedTop = padding
                }
                
                return {
                  top: `${adjustedTop}px`,
                  left: `${adjustedLeft}px`
                }
              })()}
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const goal = sortedGoals.find((g: any) => g.id === quickEditGoalId)
                if (!goal) return null
                
                if (quickEditGoalField === 'status') {
        return (
                    <>
                      <div className="max-h-[300px] overflow-y-auto">
              <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            try {
                              const response = await fetch('/api/goals', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ goalId: goal.id, status: 'active' })
                              })
                              if (response.ok) {
                                const updatedGoal = await response.json()
                                const updatedGoals = goals.map((g: any) => g.id === goal.id ? updatedGoal : g)
                                onGoalsUpdate?.(updatedGoals)
                                setQuickEditGoalId(null)
                                setQuickEditGoalField(null)
                                setQuickEditGoalPosition(null)
                              }
                            } catch (error) {
                              console.error('Error updating goal status:', error)
                            }
                          }}
                          className={`w-full text-left px-4 py-3 text-sm hover:bg-purple-50 transition-colors ${
                            goal.status === 'active' ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-gray-700'
                          }`}
                        >
                          {t('goals.status.active')}
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            try {
                              const response = await fetch('/api/goals', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ goalId: goal.id, status: 'completed' })
                              })
                              if (response.ok) {
                                const updatedGoal = await response.json()
                                const updatedGoals = goals.map((g: any) => g.id === goal.id ? updatedGoal : g)
                                onGoalsUpdate?.(updatedGoals)
                                setQuickEditGoalId(null)
                                setQuickEditGoalField(null)
                                setQuickEditGoalPosition(null)
                              }
                            } catch (error) {
                              console.error('Error updating goal status:', error)
                            }
                          }}
                          className={`w-full text-left px-4 py-3 text-sm hover:bg-purple-50 transition-colors ${
                            goal.status === 'completed' ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-gray-700'
                          }`}
                        >
                          {t('goals.status.completed')}
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            try {
                              const response = await fetch('/api/goals', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ goalId: goal.id, status: 'paused' })
                              })
                              if (response.ok) {
                                const updatedGoal = await response.json()
                                const updatedGoals = goals.map((g: any) => g.id === goal.id ? updatedGoal : g)
                                onGoalsUpdate?.(updatedGoals)
                                setQuickEditGoalId(null)
                                setQuickEditGoalField(null)
                                setQuickEditGoalPosition(null)
                              }
                            } catch (error) {
                              console.error('Error updating goal status:', error)
                            }
                          }}
                          className={`w-full text-left px-4 py-3 text-sm hover:bg-purple-50 transition-colors ${
                            goal.status === 'paused' ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-gray-700'
                          }`}
                        >
                          {t('goals.status.paused')}
              </button>
                      </div>
                    </>
                  )
                }
                
                if (quickEditGoalField === 'date') {
                  return (
                    <>
                      <h3 className="text-sm font-semibold text-gray-800 mb-2">
                        {t('details.step.newDate') || 'Vyberte datum'}
                      </h3>
                      <div className="space-y-2">
                        <div className="grid grid-cols-7 gap-1 mb-1">
                          {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map(day => (
                            <div key={day} className="text-center text-xs font-semibold text-gray-600 py-1">
                              {day}
                            </div>
                          ))}
                        </div>
                        {(() => {
                          const today = new Date()
                          const currentMonth = selectedDateForGoal.getMonth()
                          const currentYear = selectedDateForGoal.getFullYear()
                          const firstDay = new Date(currentYear, currentMonth, 1)
                          const lastDay = new Date(currentYear, currentMonth + 1, 0)
                          const daysInMonth = lastDay.getDate()
                          const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
                          const todayStr = getLocalDateString()
                          
                          const days = []
                          for (let i = 0; i < startingDayOfWeek; i++) {
                            days.push(null)
                          }
                          for (let day = 1; day <= daysInMonth; day++) {
                            const date = new Date(currentYear, currentMonth, day)
                            days.push(date)
                          }

                          return (
                            <div className="grid grid-cols-7 gap-1">
                              {days.map((date, index) => {
                                if (!date) {
                                  return <div key={`empty-${index}`} className="h-7"></div>
                                }
                                
                                const dateStr = getLocalDateString(date)
                                const isSelected = dateStr === getLocalDateString(selectedDateForGoal)
                                const isToday = dateStr === todayStr
                                
                                return (
                                  <button
                                    key={dateStr}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedDateForGoal(date)
                                    }}
                                    className={`h-7 rounded transition-all text-xs ${
                                      isSelected 
                                        ? 'bg-orange-600 text-white font-bold' 
                                        : isToday
                                          ? 'bg-orange-100 text-orange-700 font-semibold'
                                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                    }`}
                                  >
                                    {date.getDate()}
                                  </button>
                                )
                              })}
                            </div>
                          )
                        })()}
                        
                        <div className="flex items-center justify-between mt-2 pt-2 border-t">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const prevMonth = new Date(selectedDateForGoal)
                              prevMonth.setMonth(prevMonth.getMonth() - 1)
                              setSelectedDateForGoal(prevMonth)
                            }}
                            className="p-1 hover:bg-gray-100 rounded-lg"
                          >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <span className="text-xs font-semibold text-gray-800">
                            {selectedDateForGoal.toLocaleDateString(localeCode, { month: 'long', year: 'numeric' })}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const nextMonth = new Date(selectedDateForGoal)
                              nextMonth.setMonth(nextMonth.getMonth() + 1)
                              setSelectedDateForGoal(nextMonth)
                            }}
                            className="p-1 hover:bg-gray-100 rounded-lg"
                          >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                        
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={async (e) => {
                              e.stopPropagation()
                              const dateStr = getLocalDateString(selectedDateForGoal)
                              try {
                                const response = await fetch('/api/goals', {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ goalId: goal.id, target_date: dateStr })
                                })
                                if (response.ok) {
                                  const updatedGoal = await response.json()
                                  const updatedGoals = goals.map((g: any) => g.id === goal.id ? updatedGoal : g)
                                  onGoalsUpdate?.(updatedGoals)
                                  setQuickEditGoalId(null)
                                  setQuickEditGoalField(null)
                                  setQuickEditGoalPosition(null)
                                }
                              } catch (error) {
                                console.error('Error updating goal date:', error)
                              }
                            }}
                            className="flex-1 px-3 py-1.5 bg-orange-600 text-white text-xs rounded-lg hover:bg-orange-600 transition-colors"
                          >
                            {t('details.step.confirm') || 'Uložit'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setQuickEditGoalId(null)
                              setQuickEditGoalField(null)
                              setQuickEditGoalPosition(null)
                            }}
                            className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            {t('common.cancel') || 'Zrušit'}
                          </button>
                        </div>
                      </div>
                    </>
                  )
                }
                
                return null
              })()}
            </div>
          </>,
          document.body
        )}
      </div>
    )
  }

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
    if (mainPanelSection.startsWith('habit-')) {
      const habitId = mainPanelSection.replace('habit-', '')
      calculateVisibleDays(habitId)
      window.addEventListener('resize', () => calculateVisibleDays(habitId))
      return () => window.removeEventListener('resize', () => calculateVisibleDays(habitId))
    }
  }, [mainPanelSection])
  
  // Render habit detail page with timeline, statistics, and settings
  const renderHabitDetailPage = (habit: any) => {
    const habitId = habit.id
    // Use locale from top-level (already defined)
    const localeCode = locale === 'cs' ? 'cs-CZ' : 'en-US'
    const timelineOffset = habitTimelineOffsets[habitId] || 0
    const visibleDays = habitDetailVisibleDays[habitId] || 20
    
    const setTimelineOffset = (value: number | ((prev: number) => number)) => {
      setHabitTimelineOffsets(prev => {
        const current = prev[habitId] || 0
        const newValue = typeof value === 'function' ? value(current) : value
        return { ...prev, [habitId]: newValue }
      })
    }
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Calculate date range for timeline
    // timelineOffset determines how many days back from today the END date is
    // Negative offset = going back in time (left arrow)
    // Positive offset = going forward in time (right arrow)
    // When offset is 0, the rightmost date is today
    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() - timelineOffset)
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - visibleDays + 1)
    
    // Generate array of dates for timeline
    const timelineDates: Date[] = []
    for (let i = 0; i < visibleDays; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      timelineDates.push(date)
    }
    
    // Helper functions for habit scheduling and completion
    const isHabitScheduledForDay = (day: Date): boolean => {
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const dayName = dayNames[day.getDay()]
      
      if (habit.always_show) return true
      if (habit.frequency === 'daily') return true
      if (habit.frequency === 'custom' && habit.selected_days && habit.selected_days.includes(dayName)) return true
      return false
    }
    
    const isHabitCompletedForDay = (day: Date): boolean => {
      const dateStr = getLocalDateString(day)
      return habit.habit_completions && habit.habit_completions[dateStr] === true
    }
    
    // Calculate statistics (without useMemo since this is inside a render function)
    const calculateStats = () => {
      let totalPlanned = 0
      let totalCompleted = 0
      let completedOutsidePlan = 0
      let currentStreak = 0
      let maxStreak = habit.max_streak || 0
      
      // Calculate from habit_completions
      if (habit.habit_completions) {
        const completionDates = Object.keys(habit.habit_completions)
          .filter(date => habit.habit_completions[date] === true)
          .map(date => new Date(date))
          .sort((a, b) => a.getTime() - b.getTime())
        
        // Count total planned and completed
        const allDates: Date[] = []
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        // Go back 365 days to calculate stats
        for (let i = 365; i >= 0; i--) {
          const date = new Date(today)
          date.setDate(date.getDate() - i)
          allDates.push(date)
        }
        
        allDates.forEach(date => {
          const isScheduled = isHabitScheduledForDay(date)
          const isCompleted = isHabitCompletedForDay(date)
          const dateStr = getLocalDateString(date)
          
          if (isScheduled) {
            totalPlanned++
            if (isCompleted) {
              totalCompleted++
            }
          } else if (isCompleted) {
            completedOutsidePlan++
          }
        })
        
        // Calculate current streak (backwards from today)
        let streakDate = new Date(today)
        while (true) {
          const isScheduled = isHabitScheduledForDay(streakDate)
          const isCompleted = isHabitCompletedForDay(streakDate)
          
          if (isScheduled && isCompleted) {
            currentStreak++
            streakDate.setDate(streakDate.getDate() - 1)
          } else if (isScheduled && !isCompleted) {
            break // Streak broken
          } else {
            streakDate.setDate(streakDate.getDate() - 1)
            if (streakDate < new Date('2020-01-01')) break // Safety check
          }
        }
      }
      
      return {
        totalPlanned,
        totalCompleted,
        completedOutsidePlan,
        currentStreak: habit.streak || currentStreak,
        maxStreak
      }
    }
    
    const stats = calculateStats()
    
    const handleTimelineShift = (direction: 'left' | 'right') => {
      if (direction === 'left') {
        // Left arrow = go back in time (increase offset, which moves start date earlier)
        setTimelineOffset(prev => prev + visibleDays)
      } else {
        // Right arrow = go forward in time (decrease offset, which moves start date later)
        // Don't go past today (offset can't be negative)
        setTimelineOffset(prev => Math.max(0, prev - visibleDays))
      }
    }
    
    const handleHabitBoxClick = async (date: Date) => {
      const dateStr = getLocalDateString(date)
      const isScheduled = isHabitScheduledForDay(date)
      const isCompleted = isHabitCompletedForDay(date)
      
      let currentState: 'completed' | 'missed' | 'planned' | 'not-scheduled' | 'today' = 'not-scheduled'
      if (isCompleted) {
        currentState = 'completed'
      } else if (isScheduled) {
        currentState = 'planned'
      }
      
      if (dateStr === getLocalDateString(today)) {
        currentState = 'today'
      }
      
      await handleHabitCalendarToggle(habit.id, dateStr, currentState, isScheduled)
    }
    
    return (
      <div className="w-full min-h-full flex flex-col bg-orange-50">
        {/* Mobile header */}
        <div className="md:hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 truncate">{habit.name}</h2>
            <button
              onClick={() => setMainPanelSection('overview')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title={t('navigation.backToOverview')}
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>
        
        {/* Habit detail content */}
        <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
          <div className="p-6">
            {/* Habit header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{habit.name}</h1>
              {habit.description && (
                <p className="text-gray-600 text-lg">{habit.description}</p>
              )}
            </div>
            
            {/* Timeline section */}
            <div className="mb-8 bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{t('habits.timeline') || 'Timeline'}</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTimelineShift('left')}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title={t('common.previous') || 'Předchozí'}
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                  </button>
                  <button
                    onClick={() => handleTimelineShift('right')}
                    disabled={timelineOffset === 0}
                    className={`p-2 rounded-lg transition-colors ${
                      timelineOffset === 0 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-gray-100'
                    }`}
                    title={t('common.next') || 'Další'}
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700" />
                  </button>
                </div>
              </div>
              
              {/* Timeline with month, dates, and boxes */}
              <div ref={habitDetailTimelineContainerRef} className="w-full">
                {/* Month row - positioned around middle of month */}
                <div className="flex mb-2 relative" style={{ height: '24px' }}>
                  {(() => {
                    // Find the middle date of the visible range
                    const middleIndex = Math.floor(timelineDates.length / 2)
                    let targetDate = timelineDates[middleIndex]
                    
                    // Get the month of the middle date
                    const targetMonth = targetDate.getMonth()
                    const targetYear = targetDate.getFullYear()
                    
                    // Find the middle of the month (15th day)
                    const monthMiddle = new Date(targetYear, targetMonth, 15)
                    monthMiddle.setHours(0, 0, 0, 0)
                    
                    // Find the closest date to month middle in our visible range
                    let closestIndex = 0
                    let closestDistance = Math.abs(timelineDates[0].getTime() - monthMiddle.getTime())
                    
                    timelineDates.forEach((date, index) => {
                      const distance = Math.abs(date.getTime() - monthMiddle.getTime())
                      if (distance < closestDistance) {
                        closestDistance = distance
                        closestIndex = index
                      }
                    })
                    
                    // If the closest date is too close to the edges (first or last 2 days), adjust it
                    const edgeThreshold = 2
                    let adjustedIndex = closestIndex
                    if (closestIndex < edgeThreshold) {
                      // Too close to start, move it a bit right
                      adjustedIndex = Math.min(edgeThreshold, timelineDates.length - 1)
                    } else if (closestIndex > timelineDates.length - 1 - edgeThreshold) {
                      // Too close to end, move it a bit left
                      adjustedIndex = Math.max(timelineDates.length - 1 - edgeThreshold, 0)
                    }
                    
                    // Calculate position: each day is 36px (32px box + 4px gap)
                    // Position the month label at the center of the target day
                    const position = adjustedIndex * 36 + 16 // 16px = half of 32px box
                    
                    const monthNames = localeCode === 'cs-CZ' 
                      ? ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec']
                      : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
                    
                    const monthName = monthNames[targetMonth]
                    
                    return (
                      <div 
                        className="text-sm font-medium text-gray-700 absolute"
                        style={{ 
                          left: `${position}px`,
                          transform: 'translateX(-50%)'
                        }}
                      >
                        {monthName}
                      </div>
                    )
                  })()}
                </div>
                
                {/* Dates row */}
                <div className="flex gap-1 mb-2 relative">
                  {timelineDates.map((date, index) => {
                    const dateStr = getLocalDateString(date)
                    const isToday = dateStr === getLocalDateString(today)
                    
                    // Check if this is the first day of a month (month boundary)
                    const isMonthStart = index > 0 && date.getMonth() !== timelineDates[index - 1].getMonth()
                    
                    // Format date: day abbreviation + day number (e.g., "SA 29")
                    const dayNamesShort = [
                      t('calendar.daysShort.sunday'),
                      t('calendar.daysShort.monday'),
                      t('calendar.daysShort.tuesday'),
                      t('calendar.daysShort.wednesday'),
                      t('calendar.daysShort.thursday'),
                      t('calendar.daysShort.friday'),
                      t('calendar.daysShort.saturday')
                    ]
                    
                    const day = date.getDate()
                    const dayOfWeek = date.getDay()
                    const dayAbbr = dayNamesShort[dayOfWeek].substring(0, 2).toUpperCase()
                    
                    return (
                      <div key={dateStr} className="relative">
                        {/* Month divider - vertical line before first day of month */}
                        {isMonthStart && (
                          <div 
                            className="absolute left-0 top-0 bottom-0 w-px bg-gray-300 -ml-0.5 z-10"
                            style={{ height: '100%' }}
                          />
                        )}
                        <div
                          className={`flex flex-col items-center w-[32px] flex-shrink-0 ${isToday ? 'bg-orange-100 rounded px-1 py-0.5' : ''}`}
                        >
                          <div className={`text-[10px] text-center leading-tight ${isToday ? 'font-semibold text-orange-700' : 'text-gray-600'}`}>
                            <div>{dayAbbr}</div>
                            <div>{day}</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                {/* Boxes row */}
                <div className="flex gap-1 relative">
                  {timelineDates.map((date, index) => {
                    const dateStr = getLocalDateString(date)
                    const isScheduled = isHabitScheduledForDay(date)
                    const isCompleted = isHabitCompletedForDay(date)
                    const isToday = dateStr === getLocalDateString(today)
                    const isFuture = date > today
                    const isLoading = loadingHabits.has(habit.id)
                    
                    // Check if this is the first day of a month (month boundary)
                    const isMonthStart = index > 0 && date.getMonth() !== timelineDates[index - 1].getMonth()
                    
                    return (
                      <div key={dateStr} className="relative">
                        {/* Month divider - vertical line before first day of month */}
                        {isMonthStart && (
                          <div 
                            className="absolute left-0 top-0 bottom-0 w-px bg-gray-300 -ml-0.5 z-10"
                            style={{ height: '100%' }}
                          />
                        )}
                        <button
                          onClick={() => !isFuture && !isLoading && handleHabitBoxClick(date)}
                          disabled={isFuture || isLoading}
                          className={`w-8 h-8 rounded flex items-center justify-center transition-all flex-shrink-0 ${
                            isCompleted
                              ? 'bg-orange-500 hover:bg-orange-600 cursor-pointer shadow-sm'
                              : isScheduled
                                ? `bg-gray-200 ${isFuture ? 'cursor-not-allowed' : 'hover:bg-orange-200 cursor-pointer'}`
                                : `bg-gray-100 ${isFuture ? 'cursor-not-allowed' : 'hover:bg-orange-200 cursor-pointer'}`
                          }`}
                          title={dateStr}
                        >
                          {isLoading ? (
                            <svg className="animate-spin h-3 w-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : isCompleted ? (
                            <Check className="w-4 h-4 text-white" strokeWidth={3} />
                          ) : null}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            
            {/* Statistics section */}
            <div className="mb-8 bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('habits.statistics') || 'Statistiky'}</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">{t('habits.stats.totalPlanned') || 'Naplánováno'}</div>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalPlanned}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">{t('habits.stats.totalCompleted') || 'Splněno'}</div>
                  <div className="text-2xl font-bold text-green-600">{stats.totalCompleted}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">{t('habits.stats.completedOutside') || 'Mimo plán'}</div>
                  <div className="text-2xl font-bold text-blue-600">{stats.completedOutsidePlan}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">{t('habits.stats.currentStreak') || 'Aktuální streak'}</div>
                  <div className="text-2xl font-bold text-orange-600">{stats.currentStreak}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">{t('habits.stats.maxStreak') || 'Nejdelší streak'}</div>
                  <div className="text-2xl font-bold text-purple-600">{stats.maxStreak}</div>
                </div>
              </div>
            </div>
            
            {/* Settings section */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('habits.settings') || 'Nastavení'}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('habits.frequencyLabel') || 'Frekvence'}
                  </label>
                  <div className="text-gray-900">
                    {habit.frequency === 'daily' ? t('habits.frequency.daily') || 'Denně' :
                     habit.frequency === 'weekly' ? t('habits.frequency.weekly') || 'Týdně' :
                     habit.frequency === 'custom' ? t('habits.frequency.custom') || 'Vlastní' :
                     habit.frequency}
                  </div>
                </div>
                {habit.frequency === 'custom' && habit.selected_days && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('habits.selectedDays') || 'Vybrané dny'}
                    </label>
                    <div className="text-gray-900">
                      {habit.selected_days.join(', ')}
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('habits.category') || 'Kategorie'}
                  </label>
                  <div className="text-gray-900">
                    {habit.category || t('habits.noCategory') || 'Bez kategorie'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('habits.difficultyLabel') || 'Obtížnost'}
                  </label>
                  <div className="text-gray-900">
                    {habit.difficulty === 'easy' ? t('habits.difficulty.easy') || 'Snadná' :
                     habit.difficulty === 'medium' ? t('habits.difficulty.medium') || 'Střední' :
                     habit.difficulty === 'hard' ? t('habits.difficulty.hard') || 'Těžká' :
                     habit.difficulty || t('habits.noDifficulty') || 'Bez obtížnosti'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render habits page with statistics, timeline, and settings
  const renderHabitsPage = () => {
    const selectedHabit = selectedHabitId ? habits.find(h => h.id === selectedHabitId) : null
    
    // Calculate statistics for all habits or selected habit
    const calculateAllHabitsStats = () => {
      const habitsToCalculate = selectedHabit ? [selectedHabit] : habits
      
      let totalPlanned = 0
      let totalCompleted = 0
      let completedOutsidePlan = 0
      let currentStreak = 0
      let maxStreak = 0
      
      habitsToCalculate.forEach(habit => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const isHabitScheduledForDay = (day: Date): boolean => {
          const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
          const dayName = dayNames[day.getDay()]
          
          if (habit.always_show) return true
          if (habit.frequency === 'daily') return true
          if (habit.frequency === 'custom' && habit.selected_days && habit.selected_days.includes(dayName)) return true
          return false
        }
        
        const isHabitCompletedForDay = (day: Date): boolean => {
          const dateStr = getLocalDateString(day)
          return habit.habit_completions && habit.habit_completions[dateStr] === true
        }
        
        // Go back 365 days to calculate stats
        for (let i = 365; i >= 0; i--) {
          const date = new Date(today)
          date.setDate(date.getDate() - i)
          const isScheduled = isHabitScheduledForDay(date)
          const isCompleted = isHabitCompletedForDay(date)
          
          if (isScheduled) {
            totalPlanned++
            if (isCompleted) {
              totalCompleted++
            }
          } else if (isCompleted) {
            completedOutsidePlan++
          }
        }
        
        // Calculate current streak
        let streakDate = new Date(today)
        let habitStreak = 0
        while (true) {
          const isScheduled = isHabitScheduledForDay(streakDate)
          const isCompleted = isHabitCompletedForDay(streakDate)
          
          if (isScheduled && isCompleted) {
            habitStreak++
            streakDate.setDate(streakDate.getDate() - 1)
          } else if (isScheduled && !isCompleted) {
            break
          } else {
            streakDate.setDate(streakDate.getDate() - 1)
            if (streakDate < new Date('2020-01-01')) break
          }
        }
        
        currentStreak = Math.max(currentStreak, habitStreak)
        maxStreak = Math.max(maxStreak, habit.max_streak || 0)
      })
      
      return {
        totalPlanned,
        totalCompleted,
        completedOutsidePlan,
        currentStreak,
        maxStreak
      }
    }
    
    const stats = calculateAllHabitsStats()
    
    // Timeline setup - use top-level hooks
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() - habitsPageTimelineOffset)
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - habitsPageVisibleDays + 1)
    
    const timelineDates: Date[] = []
    for (let i = 0; i < habitsPageVisibleDays; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      timelineDates.push(date)
    }
    
    const handleTimelineShift = (direction: 'left' | 'right') => {
      if (direction === 'left') {
        setHabitsPageTimelineOffset(prev => prev + habitsPageVisibleDays)
      } else {
        setHabitsPageTimelineOffset(prev => Math.max(0, prev - habitsPageVisibleDays))
      }
    }
    
    const handleHabitBoxClick = async (habit: any, date: Date) => {
      const dateStr = getLocalDateString(date)
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const dayName = dayNames[date.getDay()]
      
      const isScheduled = habit.always_show || 
                        habit.frequency === 'daily' || 
                        (habit.frequency === 'custom' && habit.selected_days && habit.selected_days.includes(dayName))
      const isCompleted = habit.habit_completions && habit.habit_completions[dateStr] === true
      
      let currentState: 'completed' | 'missed' | 'planned' | 'not-scheduled' | 'today' = 'not-scheduled'
      if (isCompleted) {
        currentState = 'completed'
      } else if (isScheduled) {
        currentState = 'planned'
      }
      
      if (dateStr === getLocalDateString(today)) {
        currentState = 'today'
      }
      
      await handleHabitCalendarToggle(habit.id, dateStr, currentState, isScheduled)
    }
    
    // Use locale from top-level (already defined)
    const localeCode = locale === 'cs' ? 'cs-CZ' : 'en-US'
    
    return (
      <div className="w-full min-h-full flex flex-col bg-orange-50 p-6">
        {/* Header with title and Add Habit button */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{t('navigation.habits') || 'Návyky'}</h1>
          <button
            onClick={() => handleOpenHabitModal(null)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('habits.add') || 'Přidat návyk'}
          </button>
        </div>
        
        {/* Statistics section - without white box */}
        <div className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gray-100 rounded-lg">
                <Calendar className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">{t('habits.stats.totalPlanned') || 'Naplánováno'}</div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalPlanned}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">{t('habits.stats.totalCompleted') || 'Splněno'}</div>
                <div className="text-2xl font-bold text-green-600">{stats.totalCompleted}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">{t('habits.stats.completedOutside') || 'Mimo plán'}</div>
                <div className="text-2xl font-bold text-blue-600">{stats.completedOutsidePlan}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Flame className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">{t('habits.stats.currentStreak') || 'Aktuální streak'}</div>
                <div className="text-2xl font-bold text-orange-600">{stats.currentStreak}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Trophy className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">{t('habits.stats.maxStreak') || 'Nejdelší streak'}</div>
                <div className="text-2xl font-bold text-purple-600">{stats.maxStreak}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Timeline section */}
        <div className="mb-8 bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{t('habits.timeline') || 'Timeline'}</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleTimelineShift('left')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title={t('common.previous') || 'Předchozí'}
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={() => handleTimelineShift('right')}
                disabled={habitsPageTimelineOffset === 0}
                className={`p-2 rounded-lg transition-colors ${
                  habitsPageTimelineOffset === 0 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-gray-100'
                }`}
                title={t('common.next') || 'Další'}
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>
          
          {/* Timeline with month, dates, and boxes for all habits */}
          <div ref={habitsPageTimelineContainerRef} className="w-full">
            {/* Month row - positioned around middle of month */}
            <div className="flex mb-2 relative" style={{ height: '24px' }}>
              {(() => {
                const middleIndex = Math.floor(timelineDates.length / 2)
                let targetDate = timelineDates[middleIndex]
                const targetMonth = targetDate.getMonth()
                const targetYear = targetDate.getFullYear()
                const monthMiddle = new Date(targetYear, targetMonth, 15)
                monthMiddle.setHours(0, 0, 0, 0)
                
                let closestIndex = 0
                let closestDistance = Math.abs(timelineDates[0].getTime() - monthMiddle.getTime())
                
                timelineDates.forEach((date, index) => {
                  const distance = Math.abs(date.getTime() - monthMiddle.getTime())
                  if (distance < closestDistance) {
                    closestDistance = distance
                    closestIndex = index
                  }
                })
                
                const edgeThreshold = 2
                let adjustedIndex = closestIndex
                if (closestIndex < edgeThreshold) {
                  adjustedIndex = Math.min(edgeThreshold, timelineDates.length - 1)
                } else if (closestIndex > timelineDates.length - 1 - edgeThreshold) {
                  adjustedIndex = Math.max(timelineDates.length - 1 - edgeThreshold, 0)
                }
                
                // Position month label accounting for habit name column (150px) + settings icon (32px) + gap (8px) = 190px
                const position = 190 + adjustedIndex * 36 + 16
                
                const monthNames = localeCode === 'cs-CZ' 
                  ? ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec']
                  : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
                
                const monthName = monthNames[targetMonth]
                
                return (
                  <div 
                    className="text-sm font-medium text-gray-700 absolute"
                    style={{ 
                      left: `${position}px`,
                      transform: 'translateX(-50%)'
                    }}
                  >
                    {monthName}
                  </div>
                )
              })()}
            </div>
            
            {/* Dates row - aligned with boxes (after habit name column + settings icon) */}
            <div className="flex gap-2 mb-2 relative">
              {/* Spacer for habit name column (150px) + settings icon (32px) + gap (8px) = 190px */}
              <div className="w-[190px] flex-shrink-0"></div>
              
              {/* Dates aligned with boxes */}
              <div className="flex gap-1">
                {timelineDates.map((date, index) => {
                  const dateStr = getLocalDateString(date)
                  const isToday = dateStr === getLocalDateString(today)
                  const isMonthStart = index > 0 && date.getMonth() !== timelineDates[index - 1].getMonth()
                  
                  const dayNamesShort = [
                    t('calendar.daysShort.sunday'),
                    t('calendar.daysShort.monday'),
                    t('calendar.daysShort.tuesday'),
                    t('calendar.daysShort.wednesday'),
                    t('calendar.daysShort.thursday'),
                    t('calendar.daysShort.friday'),
                    t('calendar.daysShort.saturday')
                  ]
                  
                  const day = date.getDate()
                  const dayOfWeek = date.getDay()
                  const dayAbbr = dayNamesShort[dayOfWeek].substring(0, 2).toUpperCase()
                  
                  return (
                    <div key={dateStr} className="relative w-[32px] flex-shrink-0">
                      {isMonthStart && (
                        <div 
                          className="absolute left-0 top-0 bottom-0 w-px bg-gray-300 -ml-0.5 z-10"
                          style={{ height: '100%' }}
                        />
                      )}
                      <div
                        className={`flex flex-col items-center w-full ${isToday ? 'bg-orange-100 rounded px-1 py-0.5' : ''}`}
                      >
                        <div className={`text-[10px] text-center leading-tight ${isToday ? 'font-semibold text-orange-700' : 'text-gray-600'}`}>
                          <div>{dayAbbr}</div>
                          <div>{day}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            
            {/* Habits with boxes */}
            <div className="space-y-2">
              {habits.map((habit) => {
                const isSelected = selectedHabitId === habit.id
                return (
                  <div key={habit.id} className="flex items-center gap-2">
                    {/* Habit name and settings icon container - fixed width to match dates spacer */}
                    <div className="w-[190px] flex items-center gap-2 flex-shrink-0">
                      <div className="text-left text-sm font-medium text-gray-700 truncate flex-1 min-w-0" title={habit.name}>
                        {habit.name}
                      </div>
                      {/* Settings icon button */}
                      <button
                        onClick={() => handleOpenHabitModal(habit)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                        title={t('habits.settings') || 'Nastavení'}
                      >
                        <Settings className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                    
                    {/* Boxes row */}
                    <div className="flex gap-1 relative">
                      {timelineDates.map((date, index) => {
                        const dateStr = getLocalDateString(date)
                        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
                        const dayName = dayNames[date.getDay()]
                        
                        const isScheduled = habit.always_show || 
                                          habit.frequency === 'daily' || 
                                          (habit.frequency === 'custom' && habit.selected_days && habit.selected_days.includes(dayName))
                        const isCompleted = habit.habit_completions && habit.habit_completions[dateStr] === true
                        const isToday = dateStr === getLocalDateString(today)
                        const isFuture = date > today
                        const isLoading = loadingHabits.has(habit.id)
                        const isMonthStart = index > 0 && date.getMonth() !== timelineDates[index - 1].getMonth()
                        
                        return (
                          <div key={dateStr} className="relative w-[32px] flex-shrink-0">
                            {isMonthStart && (
                              <div 
                                className="absolute left-0 top-0 bottom-0 w-px bg-gray-300 -ml-0.5 z-10"
                                style={{ height: '100%' }}
                              />
                            )}
                            <button
                              onClick={() => !isFuture && !isLoading && handleHabitBoxClick(habit, date)}
                              disabled={isFuture || isLoading}
                              className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
                                isCompleted
                                  ? 'bg-orange-500 hover:bg-orange-600 cursor-pointer shadow-sm'
                                  : isScheduled
                                    ? `bg-orange-100 ${isFuture ? 'cursor-not-allowed' : 'hover:bg-orange-200 cursor-pointer'}`
                                    : `bg-gray-100 ${isFuture ? 'cursor-not-allowed' : 'hover:bg-orange-200 cursor-pointer'}`
                              }`}
                              title={dateStr}
                            >
                              {isLoading ? (
                                <svg className="animate-spin h-3 w-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : isCompleted ? (
                                <Check className="w-4 h-4 text-white" strokeWidth={3} />
                              ) : null}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderPageContent = () => {
    switch (currentPage) {
      case 'main':
        // If there's a selected item, show its detail for editing
        if (selectedItem && selectedItemType) {
          return renderItemDetail(selectedItem, selectedItemType)
        }
        
        // Sidebar navigation items - only Focus now
        const sidebarItems = [
          { id: 'overview' as const, label: t('navigation.focus'), icon: LayoutDashboard },
        ]
        
        // Goals for sidebar (sorted by priority/date)
        const sortedGoalsForSidebar = [...goals].sort((a, b) => {
          // Sort by status: active first, then paused, then completed
          const statusOrder = { 'active': 0, 'paused': 1, 'completed': 2 }
          const aStatus = statusOrder[a.status as keyof typeof statusOrder] ?? 1
          const bStatus = statusOrder[b.status as keyof typeof statusOrder] ?? 1
          if (aStatus !== bStatus) return aStatus - bStatus
          // Then by created_at
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
        })
        
        const renderMainContent = () => {
          // Check if it's a habit detail page
          if (mainPanelSection.startsWith('habit-')) {
            const habitId = mainPanelSection.replace('habit-', '')
            const habit = habits.find(h => h.id === habitId)
            
            if (!habit) {
              return (
                <div className="w-full min-h-full flex items-center justify-center bg-orange-50">
                  <div className="text-center">
                    <p className="text-gray-500">{t('navigation.habitNotFound')}</p>
                    <button
                      onClick={() => setMainPanelSection('overview')}
                      className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                    >
                      {t('navigation.backToOverview')}
                    </button>
                  </div>
                </div>
              )
            }
            
            return renderHabitDetailPage(habit)
          }
          
          // Check if it's a goal detail page
          if (mainPanelSection.startsWith('goal-')) {
            const goalId = mainPanelSection.replace('goal-', '')
            const goal = goals.find(g => g.id === goalId)
            
            if (!goal) {
              return (
                <div className="w-full min-h-full flex items-center justify-center bg-orange-50">
                  <div className="text-center">
                    <p className="text-gray-500">{t('navigation.goalNotFound')}</p>
                    <button
                      onClick={() => setMainPanelSection('overview')}
                      className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                    >
                      {t('navigation.backToOverview')}
                    </button>
                  </div>
                </div>
              )
            }
            
            // Goal detail page - similar to overview but focused on this goal
            // Get steps from cache first, then fallback to dailySteps prop
            // Use cache version to trigger re-render when cache updates
            const cacheVersion = stepsCacheVersion[goalId] || 0
            const cachedSteps = stepsCacheRef.current[goalId]?.data || []
            const propSteps = dailySteps.filter(step => step.goal_id === goalId)
            // Combine both sources, preferring cache, and deduplicate by id
            const allGoalSteps = [...cachedSteps, ...propSteps]
            const uniqueStepsMap = new Map()
            allGoalSteps.forEach(step => {
              if (!uniqueStepsMap.has(step.id)) {
                uniqueStepsMap.set(step.id, step)
              }
            })
            // Use cache version in dependency to force re-render when cache updates
            const goalSteps = Array.from(uniqueStepsMap.values())
            
            // Format date helper with month in genitive case
            const formatDateBeautiful = (date: string | Date): string => {
              if (!date) return '-'
              const dateObj = typeof date === 'string' ? new Date(date) : date
              const day = dateObj.getDate()
              const month = dateObj.getMonth()
              const year = dateObj.getFullYear()
              
              if (localeCode === 'cs-CZ') {
                const monthNamesGenitive = [
                  'ledna', 'února', 'března', 'dubna', 'května', 'června',
                  'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'
                ]
                return `${day}. ${monthNamesGenitive[month]} ${year}`
              } else {
                const monthNames = [
                  'January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'
                ]
                return `${monthNames[month]} ${day}, ${year}`
              }
            }
            
            // Calculate step statistics
            const totalSteps = goalSteps.length
            const completedSteps = goalSteps.filter(s => s.completed).length
            const remainingSteps = totalSteps - completedSteps
            
            // Handle title save
            const handleTitleSave = async () => {
              if (!goalDetailTitleValue.trim()) {
                alert(t('goals.goalTitleRequired'))
                setGoalDetailTitleValue(goal.title)
                setEditingGoalDetailTitle(false)
                return
              }
              
              if (goalDetailTitleValue !== goal.title) {
                await handleUpdateGoalForDetail(goalId, { title: goalDetailTitleValue })
              }
              setEditingGoalDetailTitle(false)
            }
            
            // Handle description save
            const handleDescriptionSave = async () => {
              if (goalDetailDescriptionValue !== (goal.description || '')) {
                await handleUpdateGoalForDetail(goalId, { description: goalDetailDescriptionValue || null })
              }
              setEditingGoalDetailDescription(false)
            }
            
            // Handle date click
            const handleGoalDateClick = (e: React.MouseEvent) => {
              e.stopPropagation()
              e.preventDefault()
              if (goalDateRef.current) {
                const rect = goalDateRef.current.getBoundingClientRect()
                // Initialize month to current goal date or today
                const initialDate = goal.target_date ? new Date(goal.target_date) : new Date()
                setGoalDetailDatePickerMonth(initialDate)
                setSelectedGoalDate(goal.target_date ? new Date(goal.target_date) : null)
                setGoalDetailDatePickerPosition({ 
                  top: Math.min(rect.bottom + 5, window.innerHeight - 380),
                  left: Math.min(Math.max(rect.left - 100, 10), window.innerWidth - 250)
                })
                setShowGoalDetailDatePicker(true)
              }
            }
            
            // Handle date selection from calendar
            const handleGoalDateSelect = (date: Date) => {
              setSelectedGoalDate(date)
            }
            
            // Handle date save
            const handleGoalDateSave = async () => {
              // If selectedGoalDate is null, we're clearing the date
              const newDate = selectedGoalDate ? selectedGoalDate.toISOString() : null
              await handleUpdateGoalForDetail(goalId, { target_date: newDate })
              setShowGoalDetailDatePicker(false)
            }
            
              return (
                <div className="w-full min-h-full flex flex-col bg-orange-50">
                {/* Mobile header */}
                <div className="md:hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
                    <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const IconComponent = getIconComponent(goal.icon)
                        return <IconComponent className="w-5 h-5 text-gray-700" />
                      })()}
                      <h2 className="text-lg font-bold text-gray-900 truncate">{goal.title}</h2>
                    </div>
                      <button
                      onClick={() => setMainPanelSection('overview')}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      title={t('navigation.backToOverview')}
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-700" />
                    </button>
                  </div>
                </div>
                
                {/* Goal detail content */}
                <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
                  <div className="p-6">
                    {/* Goal header */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span 
                            ref={goalIconRef}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (goalIconRef.current) {
                                const rect = goalIconRef.current.getBoundingClientRect()
                                setGoalDetailIconPickerPosition({ top: rect.bottom + 5, left: rect.left })
                                setShowGoalDetailIconPicker(true)
                                setIconSearchQuery('')
                              }
                            }}
                            className="text-3xl cursor-pointer hover:opacity-70 transition-opacity flex items-center"
                          >
                            {goal.icon ? (() => {
                              const IconComponent = getIconComponent(goal.icon)
                              return <IconComponent className="w-8 h-8 text-gray-700" />
                            })() : <Target className="w-8 h-8 text-gray-700" />}
                          </span>
                          {editingGoalDetailTitle ? (
                            <input
                              ref={goalTitleRef as React.RefObject<HTMLInputElement>}
                              type="text"
                              value={goalDetailTitleValue}
                              onChange={(e) => setGoalDetailTitleValue(e.target.value)}
                              onBlur={handleTitleSave}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleTitleSave()
                                } else if (e.key === 'Escape') {
                                  setGoalDetailTitleValue(goal.title)
                                  setEditingGoalDetailTitle(false)
                                }
                              }}
                              className="text-2xl font-bold text-gray-900 bg-transparent border-2 border-orange-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
                              autoFocus
                            />
                          ) : (
                            <h1 
                              ref={goalTitleRef as React.RefObject<HTMLHeadingElement>}
                              onClick={() => setEditingGoalDetailTitle(true)}
                              className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-orange-600 transition-colors"
                            >
                              {goal.title}
                            </h1>
                          )}
                          <span 
                            ref={goalDateRef}
                            onClick={handleGoalDateClick}
                            className="text-lg font-medium cursor-pointer hover:text-orange-600 transition-colors"
                          >
                            {goal.status === 'completed' && goal.updated_at
                              ? (
                                <span className="text-gray-500">
                                  {formatDateBeautiful(goal.updated_at)}
                                </span>
                              )
                              : goal.target_date
                              ? (
                                <span className="text-gray-500">
                                  {formatDateBeautiful(goal.target_date)}
                                </span>
                              )
                              : (
                                <span className="text-gray-400 italic">
                                  {t('goals.addDate') || 'Přidat datum'}
                                </span>
                              )}
                          </span>
                        </div>
                        {/* Status picker and Delete button - aligned to the right */}
                        <div className="flex items-center gap-2 ml-auto">
                          <button
                            ref={goalStatusRef}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (goalStatusRef.current) {
                                const rect = goalStatusRef.current.getBoundingClientRect()
                                setGoalDetailStatusPickerPosition({ top: rect.bottom + 5, left: rect.left })
                                setShowGoalDetailStatusPicker(true)
                              }
                            }}
                            className={`flex items-center gap-2 px-3 py-1.5 text-sm border-2 rounded-lg transition-all ${
                              goal.status === 'active' 
                                ? 'border-orange-300 bg-orange-50 text-orange-700' 
                                : goal.status === 'completed'
                                ? 'border-green-300 bg-green-50 text-green-700'
                                : 'border-gray-300 bg-gray-50 text-gray-700'
                            }`}
                          >
                            {goal.status === 'active' ? (
                              <Target className="w-4 h-4" />
                            ) : goal.status === 'completed' ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Moon className="w-4 h-4" />
                            )}
                            <span className="font-medium">
                              {goal.status === 'active' ? t('goals.status.active') : 
                               goal.status === 'completed' ? t('goals.status.completed') : t('goals.status.paused')}
                            </span>
                            <ChevronDown className={`w-3 h-3 transition-transform ${showGoalDetailStatusPicker ? 'rotate-180' : ''}`} />
                          </button>
                          {/* Delete button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowDeleteGoalModal(true)
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm border-2 border-red-300 bg-red-50 text-red-700 rounded-lg transition-all hover:bg-red-100"
                            title={t('goals.delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {editingGoalDetailDescription ? (
                        <textarea
                          ref={goalDescriptionRef as React.RefObject<HTMLTextAreaElement>}
                          value={goalDetailDescriptionValue}
                          onChange={(e) => setGoalDetailDescriptionValue(e.target.value)}
                          onBlur={handleDescriptionSave}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              setGoalDetailDescriptionValue(goal.description || '')
                              setEditingGoalDetailDescription(false)
                            }
                          }}
                          className="w-full text-gray-600 mb-6 text-lg bg-transparent border-2 border-orange-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                          rows={3}
                          autoFocus
                        />
                      ) : (
                        goal.description && (
                          <p 
                            ref={goalDescriptionRef as React.RefObject<HTMLParagraphElement>}
                            onClick={() => setEditingGoalDetailDescription(true)}
                            className="text-gray-600 mb-6 text-lg cursor-pointer hover:text-orange-600 transition-colors"
                          >
                            {goal.description}
                          </p>
                        )
                      )}
                      {!goal.description && !editingGoalDetailDescription && (
                        <p 
                          onClick={() => setEditingGoalDetailDescription(true)}
                          className="text-gray-400 mb-6 text-lg cursor-pointer hover:text-orange-600 transition-colors italic"
                        >
                          {t('goals.addDescription')}
                        </p>
                      )}
                      
                      {/* Goal information - modern inline style */}
                      <div className="mb-8 space-y-6">
                        {/* Progress bar - calculated from steps */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-lg font-medium text-gray-700">{t('details.goal.progress')}</span>
                            <span className="text-2xl font-bold text-orange-600">
                              {totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-orange-600 h-3 rounded-full transition-all duration-300"
                              style={{ width: `${totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0}%` }}
                            />
                          </div>
                        </div>
                        
                        {/* Steps statistics - inline with larger numbers */}
                        <div className="flex flex-wrap items-center gap-6">
                          <div className="flex items-baseline gap-3">
                            <span className="text-lg text-gray-500 font-medium">{t('details.goal.totalSteps')}:</span>
                            <span className="text-2xl font-bold text-gray-900">{totalSteps}</span>
                          </div>
                          <div className="flex items-baseline gap-3">
                            <span className="text-lg text-gray-500 font-medium">{t('details.goal.completedSteps')}:</span>
                            <span className="text-2xl font-bold text-green-600">
                              {completedSteps}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-3">
                            <span className="text-lg text-gray-500 font-medium">{t('details.goal.remainingSteps')}:</span>
                            <span className="text-2xl font-bold text-orange-600">
                              {remainingSteps}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Steps Overview - Card-based layout */}
                    {(() => {
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      
                      // Helper to format date
                      const formatStepDate = (date: Date): string => {
                        const day = date.getDate()
                        const month = date.getMonth() + 1
                        const year = date.getFullYear()
                        return `${day.toString().padStart(2, '0')}.${month.toString().padStart(2, '0')}.${year}`
                      }
                      
                      // Categorize steps into Remaining and Done
                      // Steps that are animating should stay in Remaining until animation completes
                      const remainingSteps = goalSteps.filter(s => !s.completed || animatingSteps.has(s.id))
                      const doneSteps = goalSteps.filter(s => s.completed && !animatingSteps.has(s.id))
                      
                      const totalSteps = goalSteps.length
                      const remainingCount = remainingSteps.length
                      const doneCount = doneSteps.length
                      const remainingPercentage = totalSteps > 0 ? Math.round((remainingCount / totalSteps) * 100) : 0
                      const donePercentage = totalSteps > 0 ? Math.round((doneCount / totalSteps) * 100) : 0
                      
                      // Render step card
                      const renderStepCard = (step: any) => {
                        const stepDate = step.date ? new Date(normalizeDate(step.date)) : null
                        if (stepDate) stepDate.setHours(0, 0, 0, 0)
                        const isOverdue = stepDate && stepDate.getTime() < today.getTime() && !step.completed
                        const isToday = stepDate && stepDate.toDateString() === today.toDateString()
                        const stepDateFormatted = stepDate ? formatStepDate(stepDate) : null
                        const isAnimating = animatingSteps.has(step.id)
                        
                        return (
                          <div
                            key={step.id}
                            onClick={() => handleItemClick(step, 'step')}
                            className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer ${
                              isAnimating
                                ? step.completed
                                  ? 'border-green-400 bg-green-100 animate-pulse scale-110'
                                  : 'border-orange-400 bg-orange-100 animate-pulse scale-110'
                                : step.completed
                                  ? 'border-green-200 bg-green-50/30 opacity-75'
                                  : isOverdue
                                    ? 'border-red-300 bg-red-50 hover:bg-red-100'
                                    : isToday
                                      ? 'border-orange-300 bg-orange-50 hover:bg-orange-100'
                                      : 'border-gray-200 bg-white hover:bg-gray-50'
                            }`}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (!loadingSteps.has(step.id) && !isAnimating) {
                                  handleStepToggle(step.id, !step.completed)
                                }
                              }}
                              disabled={loadingSteps.has(step.id) || isAnimating}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 mt-0.5 ${
                                isAnimating
                                  ? step.completed
                                    ? 'bg-green-500 border-green-500 scale-110'
                                    : 'bg-orange-500 border-orange-500 scale-110'
                                  : step.completed 
                                    ? 'bg-green-500 border-green-500' 
                                    : isOverdue
                                      ? 'border-red-400 hover:bg-red-100'
                                      : isToday
                                        ? 'border-orange-400 hover:bg-orange-100'
                                        : 'border-gray-300 hover:border-orange-400'
                              }`}
                            >
                              {loadingSteps.has(step.id) ? (
                                <svg className="animate-spin h-3 w-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (step.completed || isAnimating) ? (
                                <Check className="w-3 h-3 text-white" strokeWidth={3} />
                              ) : null}
                            </button>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`font-medium text-sm ${
                                  step.completed 
                                    ? 'line-through text-gray-400' 
                                    : isOverdue 
                                      ? 'text-red-600 font-semibold' 
                                      : isToday
                                        ? 'text-orange-600 font-semibold'
                                        : 'text-gray-900'
                                }`}>
                                  {step.title}
                                </span>
                                {step.checklist && step.checklist.length > 0 && (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                                    step.checklist.filter((c: any) => c.completed).length === step.checklist.length
                                      ? 'bg-orange-100 text-orange-600'
                                      : 'bg-gray-100 text-gray-500'
                                  }`}>
                                    {step.checklist.filter((c: any) => c.completed).length}/{step.checklist.length}
                                  </span>
                                )}
                              </div>
                              {step.description && (
                                <p className="text-xs text-gray-600 mb-2 line-clamp-2">{step.description}</p>
                              )}
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                {stepDateFormatted && (
                                  <span className={isOverdue && !step.completed ? 'text-red-600 font-medium' : ''}>
                                    {isOverdue && !step.completed && '❗ '}
                                    {stepDateFormatted}
                                  </span>
                                )}
                                {step.estimated_time && (
                                  <span>⏱ {step.estimated_time} min</span>
                                )}
                                {!stepDateFormatted && (
                                  <span className="text-gray-400">{t('common.noDate')}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      }
                      
                      return (
                        <div className="bg-white rounded-xl shadow-sm p-6">
                          <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">{t('sections.steps')}</h2>
                            <button
                              onClick={() => {
                                const defaultDate = getLocalDateString(selectedDayDate)
                                setStepModalData({
                                  id: null,
                                  title: '',
                                  description: '',
                                  date: defaultDate,
                                  goalId: goalId,
                                  completed: false,
                                  is_important: false,
                                  is_urgent: false,
                                  deadline: '',
                                  estimated_time: 0,
                                  checklist: [],
                                  require_checklist_complete: false
                                })
                                setShowStepModal(true)
                              }}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-orange-600 hover:bg-orange-700 text-white transition-colors"
                              title={t('focus.addStep')}
                            >
                              <Plus className="w-5 h-5" strokeWidth={2.5} />
                            </button>
                          </div>
                          
                          {/* Two Column Layout */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Remaining Column */}
                            <div className="flex flex-col">
                              <div className="mb-4 pb-3 border-b border-gray-200">
                                <h3 className="text-lg font-bold text-orange-600 mb-1">
                                  {t('details.goal.remainingSteps')}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <span className="font-semibold">{remainingCount}</span>
                                  <span>z {totalSteps}</span>
                                  <span className="text-orange-600 font-semibold">({remainingPercentage}%)</span>
                                </div>
                              </div>
                              <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-2">
                                {remainingSteps.length > 0 ? (
                                  remainingSteps.map(renderStepCard)
                                ) : (
                                  <div className="text-center py-8 text-gray-400">
                                    <p className="text-sm">{t('focus.noSteps')}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Done Column */}
                            <div className="flex flex-col">
                              <div className="mb-4 pb-3 border-b border-gray-200">
                                <h3 className="text-lg font-bold text-green-600 mb-1">
                                  {t('details.goal.done')}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <span className="font-semibold">{doneCount}</span>
                                  <span>z {totalSteps}</span>
                                  <span className="text-green-600 font-semibold">({donePercentage}%)</span>
                                </div>
                              </div>
                              <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-2">
                                {doneSteps.length > 0 ? (
                                  doneSteps.map(renderStepCard)
                                ) : (
                                  <div className="text-center py-8 text-gray-400">
                                    <p className="text-sm">Žádné dokončené kroky</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
                
                {/* Date picker modal for goal date */}
                {showGoalDetailDatePicker && goalDetailDatePickerPosition && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowGoalDetailDatePicker(false)}
                    />
                    <div 
                      className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-4 date-picker"
                      style={{ 
                        top: `${goalDetailDatePickerPosition.top}px`,
                        left: `${goalDetailDatePickerPosition.left}px`,
                        width: '230px'
                      }}
                    >
                      <div className="text-sm font-bold text-gray-800 mb-3">{t('common.newDate')}</div>
                      
                      {/* Day names */}
                      <div className="grid grid-cols-7 gap-0.5 mb-1">
                        {localeCode === 'cs-CZ' 
                          ? ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map(day => (
                              <div key={day} className="text-center text-xs text-gray-400 font-medium py-1">
                                {day}
                              </div>
                            ))
                          : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => (
                              <div key={day} className="text-center text-xs text-gray-400 font-medium py-1">
                                {day}
                              </div>
                            ))
                        }
                      </div>
                      
                      {/* Calendar days */}
                      <div className="grid grid-cols-7 gap-0.5 mb-3">
                        {(() => {
                          const year = goalDetailDatePickerMonth.getFullYear()
                          const month = goalDetailDatePickerMonth.getMonth()
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
                          const selectedDateNormalized = selectedGoalDate ? (() => {
                            const d = new Date(selectedGoalDate)
                            d.setHours(0, 0, 0, 0)
                            return d
                          })() : null
                          
                          return days.map((day, i) => {
                            if (!day) {
                              return <div key={`empty-${i}`} className="w-7 h-7" />
                            }
                            
                            const dayNormalized = new Date(day)
                            dayNormalized.setHours(0, 0, 0, 0)
                            const isToday = dayNormalized.getTime() === today.getTime()
                            const isSelected = selectedDateNormalized && dayNormalized.getTime() === selectedDateNormalized.getTime()
                            
                            return (
                              <button
                                key={day.getTime()}
                                onClick={() => handleGoalDateSelect(day)}
                                className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                                  isSelected
                                    ? 'bg-orange-600 text-white'
                                    : isToday
                                      ? 'bg-orange-100 text-orange-600 font-bold'
                                      : 'hover:bg-gray-100 text-gray-600'
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
                            const newMonth = new Date(goalDetailDatePickerMonth)
                            newMonth.setMonth(newMonth.getMonth() - 1)
                            setGoalDetailDatePickerMonth(newMonth)
                          }}
                          className="p-1 hover:bg-gray-100 rounded text-gray-400"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-medium text-gray-600">
                          {goalDetailDatePickerMonth.toLocaleDateString(localeCode, { month: 'long', year: 'numeric' })}
                        </span>
                        <button
                          onClick={() => {
                            const newMonth = new Date(goalDetailDatePickerMonth)
                            newMonth.setMonth(newMonth.getMonth() + 1)
                            setGoalDetailDatePickerMonth(newMonth)
                          }}
                          className="p-1 hover:bg-gray-100 rounded text-gray-400"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={handleGoalDateSave}
                          className="flex-1 px-3 py-1.5 bg-orange-600 text-white text-xs font-medium rounded-lg hover:bg-orange-700 transition-colors"
                        >
                          {t('common.save')}
                        </button>
                        {goal.target_date && (
                          <button
                            onClick={async () => {
                              await handleUpdateGoalForDetail(goalId, { target_date: null })
                              setShowGoalDetailDatePicker(false)
                            }}
                            className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-medium rounded-lg hover:bg-red-200 transition-colors"
                          >
                            {t('common.delete')}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setShowGoalDetailDatePicker(false)
                            setSelectedGoalDate(goal.target_date ? new Date(goal.target_date) : null)
                          }}
                          className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          {t('common.cancel')}
                        </button>
                      </div>
                    </div>
                  </>
                )}
                
                {/* Status picker modal for goal status */}
                {showGoalDetailStatusPicker && goalDetailStatusPickerPosition && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowGoalDetailStatusPicker(false)}
                    />
                    <div 
                      className="fixed z-50 bg-white border-2 border-gray-200 rounded-xl shadow-2xl min-w-[160px]"
                      style={{
                        top: `${goalDetailStatusPickerPosition.top}px`,
                        left: `${goalDetailStatusPickerPosition.left}px`
                      }}
                    >
                      {['active', 'paused', 'completed'].map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={async () => {
                            await handleUpdateGoalForDetail(goalId, { status: status as any })
                            setShowGoalDetailStatusPicker(false)
                          }}
                          className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors font-medium flex items-center gap-2 ${
                            goal.status === status 
                              ? status === 'active' 
                                ? 'bg-orange-50 text-orange-700 font-semibold' 
                                : status === 'completed'
                                ? 'bg-green-50 text-green-700 font-semibold'
                                : 'bg-gray-50 text-gray-700 font-semibold'
                              : 'text-gray-700'
                          }`}
                        >
                          {status === 'active' ? (
                            <>
                              <Target className="w-4 h-4" />
                              <span>{t('goals.status.active')}</span>
                            </>
                          ) : status === 'completed' ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              <span>{t('goals.status.completed')}</span>
                            </>
                          ) : (
                            <>
                              <Moon className="w-4 h-4" />
                              <span>{t('goals.status.paused')}</span>
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                
                {/* Delete goal confirmation modal */}
                {showDeleteGoalModal && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 bg-black/20" 
                      onClick={() => {
                        setShowDeleteGoalModal(false)
                        setDeleteGoalWithSteps(false)
                      }}
                    />
                    <div 
                      className="fixed z-50 bg-white border-2 border-gray-200 rounded-xl shadow-2xl p-6"
                      style={{
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '400px',
                        maxWidth: '90vw'
                      }}
                    >
                      <h3 className="text-lg font-bold text-gray-900 mb-4">
                        {t('goals.deleteConfirm') || 'Opravdu chcete smazat tento cíl?'}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {t('goals.deleteConfirmDescription') || 'Tato akce je nevratná.'}
                      </p>
                      
                      {/* Checkbox for deleting steps */}
                      <label className="flex items-center gap-2 mb-6 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={deleteGoalWithSteps}
                          onChange={(e) => setDeleteGoalWithSteps(e.target.checked)}
                          className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        />
                        <span className="text-sm text-gray-700">
                          {t('goals.deleteWithSteps') || 'Odstranit i související kroky'}
                        </span>
                      </label>
                      
                      {/* Actions */}
                      <div className="flex gap-3 justify-end">
                        <button
                          onClick={() => {
                            setShowDeleteGoalModal(false)
                            setDeleteGoalWithSteps(false)
                          }}
                          disabled={isDeletingGoal}
                          className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {t('common.cancel')}
                        </button>
                        <button
                          onClick={async () => {
                            await handleDeleteGoalForDetail(goalId, deleteGoalWithSteps)
                          }}
                          disabled={isDeletingGoal}
                          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {isDeletingGoal ? (
                            <>
                              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              {t('common.saving') || 'Mažu...'}
                            </>
                          ) : (
                            t('goals.delete') || 'Smazat'
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                )}
                
                {/* Icon picker modal for goal icon */}
                {showGoalDetailIconPicker && goalDetailIconPickerPosition && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowGoalDetailIconPicker(false)}
                    />
                    <div 
                      className="fixed z-50 bg-white border-2 border-gray-200 rounded-xl shadow-2xl"
                      style={{
                        top: `${goalDetailIconPickerPosition.top}px`,
                        left: `${goalDetailIconPickerPosition.left}px`,
                        width: '320px',
                        maxHeight: '400px',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      {/* Search bar */}
                      <div className="p-3 border-b border-gray-200">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={iconSearchQuery}
                            onChange={(e) => setIconSearchQuery(e.target.value)}
                            placeholder={t('common.search') || 'Hledat...'}
                            className="w-full pl-9 pr-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            autoFocus
                          />
                        </div>
                      </div>
                      
                      {/* Icons grid */}
                      <div className="p-3 overflow-y-auto flex-1">
                        <div className="grid grid-cols-6 gap-2">
                          {AVAILABLE_ICONS
                            .filter(icon => {
                              const query = iconSearchQuery.toLowerCase().trim()
                              if (!query) return true
                              return icon.label.toLowerCase().includes(query) ||
                                     icon.name.toLowerCase().includes(query)
                            })
                            .map((icon) => {
                              const IconComponent = getIconComponent(icon.name)
                              const isSelected = goal.icon === icon.name
                              if (!IconComponent) {
                                console.warn(`Icon component not found for: ${icon.name}`)
                                return null
                              }
                              return (
                                <button
                                  key={icon.name}
                                  type="button"
                                  onClick={async () => {
                                    await handleUpdateGoalForDetail(goalId, { icon: icon.name })
                                    setShowGoalDetailIconPicker(false)
                                    setIconSearchQuery('')
                                  }}
                                  className={`p-2 rounded-lg transition-all hover:bg-gray-100 ${
                                    isSelected 
                                      ? 'bg-orange-50 border-2 border-orange-500' 
                                      : 'border-2 border-transparent hover:border-gray-300'
                                  }`}
                                  title={icon.label}
                                >
                                  <IconComponent className={`w-5 h-5 mx-auto ${isSelected ? 'text-orange-600' : 'text-gray-700'}`} />
                                </button>
                              )
                            })
                            .filter(Boolean)}
                        </div>
                        {AVAILABLE_ICONS.filter(icon => {
                          const query = iconSearchQuery.toLowerCase().trim()
                          if (!query) return false
                          return icon.label.toLowerCase().includes(query) ||
                                 icon.name.toLowerCase().includes(query)
                        }).length === 0 && iconSearchQuery.trim() && (
                          <div className="text-center py-8 text-gray-500 text-sm">
                            {t('common.noResults') || 'Žádné výsledky'}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )
          }
          
          switch (mainPanelSection) {
            case 'overview':
              return (
                <div className="w-full min-h-full flex flex-col bg-orange-50">
                  {/* Mobile header with hamburger menu - same as other sections */}
                  <div className="md:hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-gray-900">
                        {sidebarItems.find(item => item.id === mainPanelSection)?.label || t('navigation.focus')}
                      </h2>
                      <div className="relative">
                      <button
                          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Menu"
                        >
                          <Menu className="w-5 h-5 text-gray-700" />
                      </button>
                        
                        {/* Mobile menu dropdown */}
                        {mobileMenuOpen && (
                          <>
                            {/* Backdrop */}
                            <div 
                              className="fixed inset-0 z-[100]" 
                              onClick={() => setMobileMenuOpen(false)}
                            />
                            <div className="fixed right-4 top-16 bg-white border border-gray-200 rounded-lg shadow-lg z-[101] min-w-[200px]">
                              <nav className="py-2">
                                <button
                                  onClick={() => {
                                    setMainPanelSection('overview')
                                    setMobileMenuOpen(false)
                                  }}
                                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                                    mainPanelSection === 'overview'
                                      ? 'bg-orange-600 text-white'
                                      : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                                  <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
                                  <span className="font-medium">{t('navigation.focus')}</span>
                      </button>
                                
                                {/* Goals, Habits, Steps in mobile menu */}
                                {topMenuItems.map((item) => {
                                  const Icon = item.icon
                                  const isActive = mainPanelSection === (item.id as string)
                                  return (
                      <button
                                      key={item.id}
                                      onClick={() => {
                                        setCurrentPage('main')
                                        setMainPanelSection(item.id)
                                        setMobileMenuOpen(false)
                                      }}
                                      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                                        isActive
                                          ? 'bg-orange-600 text-white'
                                          : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                                      <Icon className="w-5 h-5 flex-shrink-0" />
                                      <span className="font-medium">{item.label}</span>
                      </button>
                                  )
                                })}
                                {(() => {
                                  const activeGoals = sortedGoalsForSidebar.filter(g => g.status === 'active')
                                  const pausedGoals = sortedGoalsForSidebar.filter(g => g.status === 'paused')
                                  const completedGoals = sortedGoalsForSidebar.filter(g => g.status === 'completed')
                                  const isPausedExpanded = expandedSidebarSections.has('paused')
                                  const isCompletedExpanded = expandedSidebarSections.has('completed')
                                  
                                  return (
                                    <>
                                      {/* Active goals */}
                                      {activeGoals.map((goal) => {
                                        const goalSectionId = `goal-${goal.id}`
                                        const IconComponent = getIconComponent(goal.icon)
                                        return (
                      <button
                                            key={goal.id}
                                            onClick={() => {
                                              setMainPanelSection(goalSectionId)
                                              setMobileMenuOpen(false)
                                            }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                                              mainPanelSection === goalSectionId
                                                ? 'bg-orange-600 text-white'
                                                : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                          >
                                            <IconComponent className={`w-5 h-5 flex-shrink-0 ${mainPanelSection === goalSectionId ? 'text-white' : 'text-gray-700'}`} />
                                            <span className="font-medium">{goal.title}</span>
                      </button>
                                        )
                                      })}
                                      
                                      {/* Paused goals - collapsible */}
                                      {pausedGoals.length > 0 && (
                                        <>
                      <button
                                            onClick={() => {
                                              const newSet = new Set(expandedSidebarSections)
                                              if (isPausedExpanded) {
                                                newSet.delete('paused')
                                              } else {
                                                newSet.add('paused')
                                              }
                                              setExpandedSidebarSections(newSet)
                                            }}
                                            className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                                          >
                                            <span className="font-medium">
                                              {t('goals.status.paused')} {pausedGoals.length}
                                            </span>
                                            <ChevronDown className={`w-4 h-4 transition-transform ${isPausedExpanded ? 'rotate-180' : ''}`} />
                                          </button>
                                          {isPausedExpanded && pausedGoals.map((goal) => {
                                            const goalSectionId = `goal-${goal.id}`
                                            const IconComponent = getIconComponent(goal.icon)
                                            return (
                                              <button
                                                key={goal.id}
                                                onClick={() => {
                                                  setMainPanelSection(goalSectionId)
                                                  setMobileMenuOpen(false)
                                                }}
                                                className={`w-full flex items-center gap-3 px-4 py-3 pl-8 transition-colors text-left ${
                                                  mainPanelSection === goalSectionId
                                                    ? 'bg-orange-600 text-white'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                                }`}
                                              >
                                                <IconComponent className={`w-5 h-5 flex-shrink-0 ${mainPanelSection === goalSectionId ? 'text-white' : 'text-gray-700'}`} />
                                                <span className="font-medium">{goal.title}</span>
                      </button>
                                            )
                                          })}
                                        </>
                                      )}
                                      
                                      {/* Completed goals - collapsible */}
                                      {completedGoals.length > 0 && (
                                        <>
                                          <button
                                            onClick={() => {
                                              const newSet = new Set(expandedSidebarSections)
                                              if (isCompletedExpanded) {
                                                newSet.delete('completed')
                                              } else {
                                                newSet.add('completed')
                                              }
                                              setExpandedSidebarSections(newSet)
                                            }}
                                            className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                                          >
                                            <span className="font-medium">
                                              {t('goals.status.completed')} {completedGoals.length}
                                            </span>
                                            <ChevronDown className={`w-4 h-4 transition-transform ${isCompletedExpanded ? 'rotate-180' : ''}`} />
                                          </button>
                                          {isCompletedExpanded && completedGoals.map((goal) => {
                                            const goalSectionId = `goal-${goal.id}`
                                            const IconComponent = getIconComponent(goal.icon)
                                            return (
                                              <button
                                                key={goal.id}
                                                onClick={() => {
                                                  setMainPanelSection(goalSectionId)
                                                  setMobileMenuOpen(false)
                                                }}
                                                className={`w-full flex items-center gap-3 px-4 py-3 pl-8 transition-colors text-left ${
                                                  mainPanelSection === goalSectionId
                                                    ? 'bg-orange-600 text-white'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                                }`}
                                              >
                                                <IconComponent className={`w-5 h-5 flex-shrink-0 ${mainPanelSection === goalSectionId ? 'text-white' : 'text-gray-700'}`} />
                                                <span className="font-medium">{goal.title}</span>
                                              </button>
                                            )
                                          })}
                                        </>
                                      )}
                                    </>
                                  )
                                })()}
                              </nav>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>


                  {/* Unified Day View */}
                  <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
                    <UnifiedDayView
                        player={player}
                        goals={goals}
                        habits={habits}
                        dailySteps={dailySteps}
                        handleItemClick={handleItemClick}
                        handleHabitToggle={handleHabitToggle}
                        handleStepToggle={handleStepToggle}
                        loadingHabits={loadingHabits}
                        loadingSteps={loadingSteps}
                        onOpenStepModal={handleOpenStepModal}
                        onNavigateToHabits={onNavigateToHabits}
                        onNavigateToSteps={onNavigateToSteps}
                        onStepDateChange={handleStepDateChange}
                        onStepTimeChange={handleStepTimeChange}
                      />
                  </div>
                </div>
              )
            case 'goals':
              return (
                <div className="min-h-full bg-orange-50">
                  <GoalsManagementView
                    goals={goals}
                    onGoalsUpdate={onGoalsUpdate}
                    userId={userId}
                    player={player}
                    onOpenStepModal={(step, goalId) => {
                      if (step) {
                        handleOpenStepModal(undefined, step)
                      } else {
                        // New step with goal pre-selected
                        const defaultDate = getLocalDateString(selectedDayDate)
                        setStepModalData({
                          id: null,
                          title: '',
                          description: '',
                          date: defaultDate,
                          goalId: goalId || '',
                          completed: false,
                          is_important: false,
                          is_urgent: false,
                          deadline: '',
                          estimated_time: 0,
                          checklist: [],
                          require_checklist_complete: false
                        })
                        setShowStepModal(true)
                      }
                    }}
                    onGoalClick={(goalId) => {
                      setMainPanelSection(`goal-${goalId}`)
                    }}
                    onCreateGoal={handleCreateGoal}
                    onGoalDateClick={(goalId, e) => {
                      const goal = goals.find(g => g.id === goalId)
                      if (!goal) return
                      
                      const rect = (e.target as HTMLElement).getBoundingClientRect()
                      const initialDate = goal.target_date ? new Date(goal.target_date) : new Date()
                      setSelectedDateForGoal(initialDate)
                      setQuickEditGoalId(goalId)
                      setQuickEditGoalField('date')
                      setQuickEditGoalPosition({ 
                        top: Math.min(rect.bottom + 5, window.innerHeight - 380),
                        left: Math.min(Math.max(rect.left - 100, 10), window.innerWidth - 250)
                      })
                    }}
                    onGoalStatusClick={(goalId, e) => {
                      const goal = goals.find(g => g.id === goalId)
                      if (!goal) return
                      
                      const rect = (e.target as HTMLElement).getBoundingClientRect()
                      setQuickEditGoalId(goalId)
                      setQuickEditGoalField('status')
                      setQuickEditGoalPosition({ 
                        top: rect.bottom + 5, 
                        left: rect.left 
                      })
                    }}
                  />
                </div>
              )
            case 'steps':
              return (
                <div className="min-h-full bg-orange-50">
                  <StepsManagementView
                    dailySteps={dailySteps}
                    goals={goals}
                    onDailyStepsUpdate={onDailyStepsUpdate}
                    userId={userId}
                    player={player}
                    onOpenStepModal={(step) => {
                      if (step) {
                        handleOpenStepModal(undefined, step)
                      } else {
                        handleOpenStepModal()
                      }
                    }}
                  />
                </div>
              )
            case 'habits':
              return renderHabitsPage()
            default:
              return null
          }
        }
        
        return (
          <div className="w-full h-full flex bg-white overflow-hidden">
            {/* Left sidebar - Navigation - Hidden on mobile */}
            <div className={`hidden md:flex ${sidebarCollapsed ? 'w-14' : 'w-64'} border-r border-gray-200 bg-gray-50 flex-shrink-0 transition-all duration-300 relative h-full flex flex-col`}>
              <div className={`${sidebarCollapsed ? 'p-2 pt-12' : 'p-4'} flex-1 overflow-y-auto`}>
                {!sidebarCollapsed && (
                  <h2 className="text-lg font-bold text-gray-900 mb-4">{t('navigation.title')}</h2>
                )}
                <nav className={`${sidebarCollapsed ? 'space-y-2 flex flex-col items-center' : 'space-y-1'}`}>
                  {/* Focus button */}
                  {sidebarItems.filter(item => item.id === 'overview').map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                        onClick={() => setMainPanelSection(item.id)}
                        className={`flex items-center ${sidebarCollapsed ? 'justify-center w-10 h-10' : 'w-full gap-3 px-4 py-3'} rounded-lg transition-colors ${
                          mainPanelSection === item.id
                            ? 'bg-orange-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        title={sidebarCollapsed ? item.label : undefined}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        {!sidebarCollapsed && (
                          <span className="font-medium">{item.label}</span>
                        )}
                      </button>
                    )
                  })}
                  
                  {/* Goals list - directly under Focus (only active goals) */}
                  {!sidebarCollapsed && (() => {
                    // Only show active goals in navigation
                    const activeGoals = sortedGoalsForSidebar.filter(g => g.status === 'active')
                    
                    if (activeGoals.length === 0) return null
                    
                    return (
                      <div className="space-y-1 mt-2">
                        {activeGoals.map((goal) => {
                          const goalSectionId = `goal-${goal.id}`
                          const isSelected = mainPanelSection === goalSectionId
                          const IconComponent = getIconComponent(goal.icon)
                          return (
                            <button
                              key={goal.id}
                              onClick={() => setMainPanelSection(goalSectionId)}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-left ${
                                isSelected
                                  ? 'bg-orange-600 text-white'
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                              title={goal.title}
                            >
                              <IconComponent className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-white' : 'text-gray-700'}`} />
                              <span className={`font-medium truncate flex-1 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                                {goal.title}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )
                  })()}
                  
                  {/* Collapsed goals - show as icons (only active goals) */}
                  {sidebarCollapsed && (() => {
                    const activeGoals = sortedGoalsForSidebar.filter(g => g.status === 'active')
                    if (activeGoals.length === 0) return null
                    
                    return (
                      <div className="space-y-2 mt-2">
                          {activeGoals.slice(0, 5).map((goal) => {
                            const goalSectionId = `goal-${goal.id}`
                            const isSelected = mainPanelSection === goalSectionId
                            const IconComponent = getIconComponent(goal.icon)
                            return (
                              <button
                                key={goal.id}
                                onClick={() => setMainPanelSection(goalSectionId)}
                                className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                                  isSelected
                                    ? 'bg-orange-600 text-white'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                                title={goal.title}
                              >
                                <IconComponent className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-700'}`} />
                              </button>
                            )
                          })}
                      </div>
                    )
                  })()}
                  
                </nav>
              </div>
              
              {/* Create button - fixed at bottom */}
              <div className={`${sidebarCollapsed ? 'p-2' : 'p-4'} border-t border-gray-200 flex-shrink-0 relative`}>
                <button
                  ref={createMenuButtonRef}
                  onClick={() => setShowCreateMenu(!showCreateMenu)}
                  className={`${sidebarCollapsed ? 'w-10 h-10 p-0' : 'w-full px-4 py-3'} flex items-center justify-center gap-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors shadow-lg font-medium`}
                  title={sidebarCollapsed ? 'Vytvořit' : undefined}
                >
                  <Plus className={sidebarCollapsed ? "w-7 h-7" : "w-5 h-5"} strokeWidth={sidebarCollapsed ? 3 : 2} />
                  {!sidebarCollapsed && (
                    <span>{t('common.add') || 'Vytvořit'}</span>
                  )}
                </button>
                
                {/* Create menu dropdown */}
                {showCreateMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowCreateMenu(false)}
                    />
                    <div 
                      className={`absolute ${sidebarCollapsed ? 'left-14 bottom-12' : 'left-4 bottom-20'} z-50 bg-white border-2 border-gray-200 rounded-xl shadow-2xl min-w-[160px]`}
                    >
                      <button
                        onClick={() => {
                          handleCreateGoal()
                          setShowCreateMenu(false)
                        }}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors font-medium flex items-center gap-2 text-gray-700"
                      >
                        <Target className="w-4 h-4" />
                        <span>{t('navigation.goals')}</span>
                      </button>
                      <button
                        onClick={() => {
                          handleOpenStepModal()
                          setShowCreateMenu(false)
                        }}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors font-medium flex items-center gap-2 text-gray-700"
                      >
                        <Footprints className="w-4 h-4" />
                        <span>{t('navigation.steps')}</span>
                      </button>
                      <button
                        onClick={() => {
                          handleOpenHabitModal(null)
                          setShowCreateMenu(false)
                        }}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors font-medium flex items-center gap-2 text-gray-700"
                      >
                        <CheckSquare className="w-4 h-4" />
                        <span>{t('navigation.habits')}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
              
              {/* Toggle button - centered at top when collapsed */}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className={`absolute ${sidebarCollapsed ? 'top-3 left-1/2 -translate-x-1/2' : 'top-4 -right-3'} w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center hover:bg-orange-700 transition-colors shadow-md z-10`}
                title={sidebarCollapsed ? 'Rozbalit navigaci' : 'Sbalit navigaci'}
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Right content area */}
            <div className="flex-1 overflow-y-auto bg-orange-50 h-full flex flex-col">
              {/* Mobile hamburger menu for all sections except overview */}
              {mainPanelSection !== 'overview' && !mainPanelSection.startsWith('goal-') && (
                <div className="md:hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">
                      {topMenuItems.find(item => item.id === mainPanelSection)?.label || 
                       sidebarItems.find(item => item.id === mainPanelSection)?.label ||
                       t('navigation.title')}
                    </h2>
                    <div className="relative">
                      <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Menu"
                      >
                        <Menu className="w-5 h-5 text-gray-700" />
                      </button>
                      
                      {/* Mobile menu dropdown */}
                      {mobileMenuOpen && (
                        <>
                          {/* Backdrop */}
                          <div 
                            className="fixed inset-0 z-[100]" 
                            onClick={() => setMobileMenuOpen(false)}
                          />
                          <div className="fixed right-4 top-16 bg-white border border-gray-200 rounded-lg shadow-lg z-[101] min-w-[200px]">
                            <nav className="py-2">
                              <button
                                onClick={() => {
                                  setMainPanelSection('overview')
                                  setMobileMenuOpen(false)
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                                  mainPanelSection === 'overview'
                                    ? 'bg-orange-600 text-white'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
                                <span className="font-medium">{t('navigation.focus')}</span>
                              </button>
                              {sortedGoalsForSidebar.map((goal) => {
                                const goalSectionId = `goal-${goal.id}`
                                const IconComponent = getIconComponent(goal.icon)
                                return (
                                  <button
                                    key={goal.id}
                                    onClick={() => {
                                      setMainPanelSection(goalSectionId)
                                      setMobileMenuOpen(false)
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                                      mainPanelSection === goalSectionId
                                        ? 'bg-orange-600 text-white'
                                        : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                  >
                                    <IconComponent className={`w-5 h-5 flex-shrink-0 ${mainPanelSection === goalSectionId ? 'text-white' : 'text-gray-700'}`} />
                                    <span className="font-medium">{goal.title}</span>
                                  </button>
                                )
                              })}
                            </nav>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Mobile header for goal detail pages */}
              {mainPanelSection.startsWith('goal-') && (
                <div className="md:hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {(() => {
                        const goalId = mainPanelSection.replace('goal-', '')
                        const goal = goals.find(g => g.id === goalId)
                        if (!goal) return null
                        const IconComponent = getIconComponent(goal.icon)
                        return (
                          <>
                            <IconComponent className="w-5 h-5 flex-shrink-0 text-gray-700" />
                            <h2 className="text-lg font-bold text-gray-900 truncate">{goal.title}</h2>
                          </>
                        )
                      })()}
                    </div>
                    <button
                      onClick={() => setMainPanelSection('overview')}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors ml-2 flex-shrink-0"
                      title={t('navigation.backToOverview')}
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-700" />
                    </button>
                  </div>
                </div>
              )}
              <div className="flex-1 overflow-y-auto">
              {renderMainContent()}
              </div>
            </div>
          </div>
        )
      case 'statistics':
        return (
          <div className="bg-white bg-opacity-95 rounded-2xl p-8 border border-orange-200 shadow-xl backdrop-blur-sm" style={{
            boxShadow: '0 12px 24px rgba(251, 146, 60, 0.15), 0 4px 8px rgba(0, 0, 0, 0.05)'
          }}>
            <h2 className="text-2xl font-bold text-orange-800 mb-6" style={{ letterSpacing: '1px' }}>STATISTIKY</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Pokrok</h3>
                <p className="text-3xl font-bold text-orange-600">{Math.round(progressPercentage)}%</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Cíle</h3>
                <p className="text-3xl font-bold text-orange-600">{completedGoals}/{goals.length}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Návyky</h3>
                <p className="text-3xl font-bold text-orange-600">{activeHabits}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Energie</h3>
                <p className="text-3xl font-bold text-orange-600">{player?.energy || 100}%</p>
              </div>
            </div>
          </div>
        );

      case 'achievements':
        return (
          <div className="bg-white bg-opacity-95 rounded-2xl p-8 border border-orange-200 shadow-xl backdrop-blur-sm" style={{
            boxShadow: '0 12px 24px rgba(251, 146, 60, 0.15), 0 4px 8px rgba(0, 0, 0, 0.05)'
          }}>
            <h2 className="text-2xl font-bold text-orange-800 mb-6" style={{ letterSpacing: '1px' }}>ÚSPĚCHY</h2>
            <div className="text-center text-gray-500 py-8">
              <p className="text-lg">Systém úspěchů</p>
              <p className="text-sm">Funkce bude brzy dostupná</p>
            </div>
          </div>
        );

      case 'settings':
        return (
          <SettingsPage 
            player={player} 
            onPlayerUpdate={(updatedPlayer) => {
              // Update player in parent component if needed
              console.log('Player updated:', updatedPlayer)
            }}
            onBack={() => setCurrentPage('main')}
          />
        );

      case 'help':
        return (
          <HelpView
            onAddGoal={async () => {
              setCurrentPage('main')
              // Create goal and redirect to its detail page
              await handleCreateGoal()
            }}
            onAddStep={() => {
              setCurrentPage('main')
              setMainPanelSection('steps')
              // Open step modal after a short delay to ensure component is mounted
              setTimeout(() => {
                handleOpenStepModal()
              }, 300)
            }}
            onAddHabit={() => {
              setCurrentPage('main')
              setMainPanelSection('habits')
              // Open habit modal for creating new habit
              setTimeout(() => {
                handleOpenHabitModal(null)
              }, 300)
            }}
            onNavigateToGoals={() => {
              setCurrentPage('main')
              setMainPanelSection('goals')
            }}
            onNavigateToHabits={() => {
              setCurrentPage('main')
              setMainPanelSection('habits')
            }}
            onNavigateToSteps={() => {
              setCurrentPage('main')
              setMainPanelSection('steps')
            }}
            onNavigateToManagement={() => {
              setCurrentPage('main')
              setMainPanelSection('overview')
            }}
            realGoals={goals}
            realHabits={habits}
            realSteps={dailySteps}
          />
        );

      default:
        return (
          <>
            {/* Hidden measurement containers */}
            <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', zIndex: -1 }}>
              <div ref={habitsRef} style={{ width: '288px' }}>
                <div className="bg-white bg-opacity-95 rounded-2xl p-6 border border-orange-200 shadow-xl backdrop-blur-sm">
                  <h4 className="text-base font-bold text-orange-800 mb-4">{t('sections.habits')}</h4>
                  <div className="space-y-3">
                    {(() => {
                      const now = new Date()
                      const dayOfWeek = now.getDay()
                      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
                      const visibleHabits = habits.filter(habit => {
                        if (habit.always_show) return true
                        if (habit.frequency === 'daily') return true
                        if (habit.frequency === 'custom' && habit.selected_days) {
                          return habit.selected_days.includes(dayNames[dayOfWeek])
                        }
                        return false
                      })
                      return visibleHabits.slice(0, 4).map(habit => (
                        <div key={habit.id} className="p-3 rounded-xl border">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="truncate flex-1">{habit.name}</span>
                          </div>
                        </div>
                      ))
                    })()}
                    {habits.filter(h => {
                      const now = new Date()
                      const dayOfWeek = now.getDay()
                      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
                      if (h.always_show) return true
                      if (h.frequency === 'daily') return true
                      if (h.frequency === 'custom' && h.selected_days) {
                        return h.selected_days.includes(dayNames[dayOfWeek])
                      }
                      return false
                    }).length === 0 && (
                      <div className="text-center text-gray-500 py-4">
                        <p className="text-sm">Žádné návyky na dnes</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div ref={stepsRef} style={{ width: '288px' }}>
                <div className="bg-white bg-opacity-95 rounded-2xl p-6 text-gray-800 backdrop-blur-sm border border-orange-200 shadow-xl">
                  <h3 className="text-base font-bold mb-4 text-orange-800">{t('sections.steps')}</h3>
                  <div className="space-y-3">
                    {dailySteps.slice(0, 5).map((step) => (
                      <div key={step.id} className="p-3 rounded-xl border text-sm">
                        <span className="truncate">{step.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Center Area - Dynamic Display - Full Width */}
            <div className="flex items-start justify-center flex-1 w-full">
                <div className="flex flex-col w-full">
                {/* Content - Direct Display without Monitor */}
                <div className="flex-1 p-6">
                      {renderDisplayContent()}
                  </div>
                    </div>
                  </div>
          </>
        )
    }
                      }
                      
                      return (
    <div className="bg-white h-screen w-full flex flex-col overflow-hidden" style={{
      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: '14px',
      background: 'linear-gradient(135deg, #FFFAF5 0%, #fef3e7 50%, #fde4c4 100%)',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.04)'
    }}>
      {/* Header */}
      <div className="relative overflow-visible w-full bg-orange-600" style={{
        boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)',
        zIndex: 100
      }}>
        <div className="relative z-10 py-3 px-6">
          {/* Single Row: Section Name and Menu */}
          <div className="flex items-center justify-between">
            {/* Left - Section Name (mobile) or Full Menu (desktop) */}
            <div className="flex items-center space-x-4">
              {/* Desktop: Full menu buttons */}
              <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => setCurrentPage('main')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-all duration-200 text-white ${currentPage === 'main' ? 'bg-white bg-opacity-25' : ''}`}
                title={t('game.menu.mainPanel')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9,22 9,12 15,12 15,22"/>
                </svg>
                <span className="text-sm font-medium">{t('game.menu.mainPanel')}</span>
              </button>
              </div>
              
              {/* Mobile: Section name only */}
              <div className="md:hidden">
                <span className="text-sm font-medium text-white">
                  {currentPage === 'main' && t('game.menu.mainPanel')}
                  {currentPage === 'help' && t('help.title')}
                  {currentPage === 'settings' && t('game.menu.settings')}
                  {currentPage === 'statistics' && 'Statistiky'}
                  {currentPage === 'achievements' && 'Úspěchy'}
                </span>
              </div>
                            </div>

            {/* Right - Statistics and Menu Icons */}
            <div className="flex items-center gap-6">
              {/* Statistics - Hidden on small screens, visible from lg breakpoint */}
              <div className="hidden lg:flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-white opacity-90" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                              </svg>
                  <span className="text-white font-semibold text-sm">{totalXp}</span>
                  <span className="text-white opacity-75 text-xs">XP</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-white opacity-90" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
                              </svg>
                  <span className="text-white font-semibold text-sm">{loginStreak}</span>
                  <span className="text-white opacity-75 text-xs">Streak</span>
                                                </div>
                                              </div>

              {/* Menu Icons - Desktop: Full buttons, Mobile: Hamburger menu */}
              <div className="hidden md:flex items-center space-x-4 lg:border-l lg:border-white lg:border-opacity-30 lg:pl-6">
              {/* Goals, Habits, Steps buttons */}
              {topMenuItems.map((item) => {
                const Icon = item.icon
                const isActive = currentPage === 'main' && mainPanelSection === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentPage('main')
                      setMainPanelSection(item.id)
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-all duration-200 text-white ${isActive ? 'bg-white bg-opacity-25' : ''}`}
                    title={item.label}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                )
              })}
              
              <button
                onClick={() => setCurrentPage('help')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-all duration-200 text-white ${currentPage === 'help' ? 'bg-white bg-opacity-25' : ''}`}
                title={t('help.title')}
              >
                <HelpCircle className="w-5 h-5" />
                <span className="text-sm font-medium">{t('help.title')}</span>
              </button>
              
              <button
                onClick={() => setCurrentPage('settings')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-all duration-200 text-white ${currentPage === 'settings' ? 'bg-white bg-opacity-25' : ''}`}
                title={t('game.menu.settings')}
              >
                <Settings className="w-5 h-5" strokeWidth="2" />
                <span className="text-sm font-medium">{t('game.menu.settings')}</span>
              </button>
                                          </div>
              
              {/* Mobile: Hamburger menu */}
              <div className="md:hidden relative">
                <button
                  onClick={() => setMobileTopMenuOpen(!mobileTopMenuOpen)}
                  className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-all duration-200 text-white"
                  title="Menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
                
                {/* Mobile top menu dropdown */}
                {mobileTopMenuOpen && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 z-[100]" 
                      onClick={() => setMobileTopMenuOpen(false)}
                    />
                    <div className="fixed right-6 top-16 bg-white border border-gray-200 rounded-lg shadow-lg z-[101] min-w-[200px]">
                      <nav className="py-2">
                        {/* Goals, Habits, Steps buttons */}
                        {topMenuItems.map((item) => {
                          const Icon = item.icon
                          const isActive = currentPage === 'main' && mainPanelSection === item.id
                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                setCurrentPage('main')
                                setMainPanelSection(item.id)
                                setMobileTopMenuOpen(false)
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                                isActive
                                  ? 'bg-orange-600 text-white'
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              <Icon className="w-5 h-5" />
                              <span className="font-medium">{item.label}</span>
                            </button>
                          )
                        })}
                        
                        <button
                          onClick={() => {
                            setCurrentPage('help')
                            setMobileTopMenuOpen(false)
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                            currentPage === 'help'
                              ? 'bg-orange-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <HelpCircle className="w-5 h-5" />
                          <span className="font-medium">{t('help.title')}</span>
                        </button>
                        <button
                          onClick={() => {
                            setCurrentPage('settings')
                            setMobileTopMenuOpen(false)
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                            currentPage === 'settings'
                              ? 'bg-orange-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Settings className="w-5 h-5" strokeWidth="2" />
                          <span className="font-medium">{t('game.menu.settings')}</span>
                        </button>
                      </nav>
                    </div>
                  </>
                )}
                                          </div>
                                        </div>
                                            </div>
                                          </div>

        {/* Bottom divider line - separates menu from page content */}
        <div className="h-px bg-orange-300 opacity-50 w-full"></div>
            </div>

      {/* Main Content Area */}
      <div className="relative flex flex-col flex-1 overflow-y-auto min-h-0">
        {renderPageContent()}
      </div>

      {/* Date Picker Modal */}
      {showDatePickerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowDatePickerModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  {currentProgram === 'day' ? 'Vyberte den' : 
                   currentProgram === 'week' ? 'Vyberte týden' :
                   currentProgram === 'month' ? 'Vyberte měsíc' :
                   'Vyberte rok'}
                </h3>
                <button
                  onClick={() => setShowDatePickerModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Day Picker - Calendar */}
              {currentProgram === 'day' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map(day => (
                      <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  {(() => {
                    const today = new Date()
                    const currentMonth = selectedDayDate.getMonth()
                    const currentYear = selectedDayDate.getFullYear()
                    const firstDay = new Date(currentYear, currentMonth, 1)
                    const lastDay = new Date(currentYear, currentMonth + 1, 0)
                    const daysInMonth = lastDay.getDate()
                    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
                    const todayStr = getLocalDateString()
                    
                    const days = []
                    // Empty cells for days before month starts
                    for (let i = 0; i < startingDayOfWeek; i++) {
                      days.push(null)
                    }
                    // Days of the month
                    for (let day = 1; day <= daysInMonth; day++) {
                      const date = new Date(currentYear, currentMonth, day)
                      days.push(date)
  }

  return (
                      <div className="grid grid-cols-7 gap-2">
                        {days.map((date, index) => {
                          if (!date) {
                            return <div key={`empty-${index}`} className="h-10"></div>
                          }
                          
                          const dateStr = getLocalDateString(date)
                          const isSelected = dateStr === getLocalDateString(selectedDayDate)
                          const isToday = dateStr === todayStr
                          
                          return (
                            <button
                              key={dateStr}
                              onClick={() => {
                                setSelectedDayDate(date)
                                setShowDatePickerModal(false)
                              }}
                              className={`h-10 rounded-lg transition-all ${
                                isSelected 
                                  ? 'bg-orange-600 text-white font-bold' 
                                  : isToday
                                    ? 'bg-orange-100 text-orange-700 font-semibold'
                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {date.getDate()}
                            </button>
                          )
                        })}
        </div>
                    )
                  })()}
                  
                  {/* Month/Year Navigation */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <button
                      onClick={() => {
                        const prevMonth = new Date(selectedDayDate)
                        prevMonth.setMonth(prevMonth.getMonth() - 1)
                        setSelectedDayDate(prevMonth)
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg"
              >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                    </button>
                    <span className="text-lg font-semibold text-gray-800">
                      {selectedDayDate.toLocaleDateString(localeCode, { month: 'long', year: 'numeric' })}
                    </span>
                    <button
                      onClick={() => {
                        const nextMonth = new Date(selectedDayDate)
                        nextMonth.setMonth(nextMonth.getMonth() + 1)
                        setSelectedDayDate(nextMonth)
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
              </button>
            </div>
                </div>
              )}

              {/* Week Picker - Weeks and Year */}
              {currentProgram === 'week' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
              <button
                      onClick={() => {
                        const prevYear = selectedWeek.getFullYear() - 1
                        setSelectedWeek(new Date(prevYear, 0, 1))
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg"
              >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
                    <span className="text-xl font-semibold text-gray-800">
                      {selectedWeek.getFullYear()}
                    </span>
              <button
                      onClick={() => {
                        const nextYear = selectedWeek.getFullYear() + 1
                        setSelectedWeek(new Date(nextYear, 0, 1))
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg"
              >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
                    {(() => {
                      const year = selectedWeek.getFullYear()
                      const weeks = []
                      
                      // Get all weeks in the year
                      const startOfYear = new Date(year, 0, 1)
                      const endOfYear = new Date(year, 11, 31)
                      
                      // Find first Monday of year
                      let currentDate = new Date(startOfYear)
                      const dayOfWeek = currentDate.getDay()
                      const daysToMonday = dayOfWeek === 0 ? 1 : (dayOfWeek === 1 ? 0 : 8 - dayOfWeek)
                      currentDate.setDate(currentDate.getDate() + daysToMonday)
                      
                      while (currentDate <= endOfYear) {
                        const weekEnd = new Date(currentDate)
                        weekEnd.setDate(weekEnd.getDate() + 6)
                        
                        weeks.push({
                          start: new Date(currentDate),
                          end: weekEnd
                        })
                        
                        currentDate.setDate(currentDate.getDate() + 7)
                      }
                      
                      // Get current week for comparison
                      const today = new Date()
                      const todayDay = today.getDay()
                      const todayDiff = today.getDate() - todayDay + (todayDay === 0 ? -6 : 1)
                      const currentWeekStart = new Date(today)
                      currentWeekStart.setDate(todayDiff)
                      currentWeekStart.setHours(0, 0, 0, 0)
                      
                      return weeks.map((week, index) => {
                        const weekStartStr = getLocalDateString(week.start)
                        const currentWeekStartStr = getLocalDateString(currentWeekStart)
                        const isSelected = weekStartStr === getLocalDateString(selectedWeek)
                        const isCurrentWeek = weekStartStr === currentWeekStartStr
                        
                        return (
              <button
                            key={index}
                            onClick={() => {
                              setSelectedWeek(week.start)
                              setShowDatePickerModal(false)
                            }}
                            className={`p-4 rounded-lg text-left transition-all ${
                              isSelected 
                                ? 'bg-orange-600 text-white' 
                                : isCurrentWeek
                                  ? 'bg-orange-100 text-orange-700 border-2 border-orange-300'
                                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                            }`}
              >
                            <div className="font-semibold">
                              Týden {index + 1} ({week.start.getDate()}. {week.start.getMonth() + 1}. - {week.end.getDate()}. {week.end.getMonth() + 1}. {week.end.getFullYear()})
                            </div>
              </button>
                        )
                      })
                    })()}
                  </div>
                </div>
              )}

              {/* Month Picker - Months and Year */}
              {currentProgram === 'month' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
              <button
                      onClick={() => {
                        const prevYear = selectedMonth.getFullYear() - 1
                        setSelectedMonth(new Date(prevYear, selectedMonth.getMonth(), 1))
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg"
              >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
                    <span className="text-xl font-semibold text-gray-800">
                      {selectedMonth.getFullYear()}
                    </span>
              <button
                      onClick={() => {
                        const nextYear = selectedMonth.getFullYear() + 1
                        setSelectedMonth(new Date(nextYear, selectedMonth.getMonth(), 1))
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg"
              >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

                  <div className="grid grid-cols-3 gap-3">
                    {['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'].map((month, index) => {
                      const today = new Date()
                      const isSelected = selectedMonth.getMonth() === index
                      const isCurrentMonth = today.getMonth() === index && today.getFullYear() === selectedMonth.getFullYear()
                      
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            const newDate = new Date(selectedMonth.getFullYear(), index, 1)
                            setSelectedMonth(newDate)
                            setShowDatePickerModal(false)
                          }}
                          className={`p-4 rounded-lg font-semibold transition-all ${
                            isSelected 
                              ? 'bg-orange-600 text-white' 
                              : isCurrentMonth
                                ? 'bg-orange-100 text-orange-700 border-2 border-orange-300'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {month}
                        </button>
                      )
                    })}
          </div>
            </div>
              )}

              {/* Year Picker - Years */}
              {currentProgram === 'year' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                    {(() => {
                      const currentYear = new Date().getFullYear()
                      const startYear = currentYear - 10
                      const endYear = currentYear + 10
                      const years = []
                      
                      for (let year = startYear; year <= endYear; year++) {
                        years.push(year)
                      }
                      
                      return years.map(year => {
                        const isSelected = year === selectedYear
                        const isCurrentYear = year === currentYear
                        
                        return (
                          <button
                            key={year}
                            onClick={() => {
                              setSelectedYear(year)
                              setShowDatePickerModal(false)
                            }}
                            className={`p-4 rounded-lg font-semibold transition-all ${
                              isSelected 
                                ? 'bg-orange-600 text-white' 
                                : isCurrentYear
                                  ? 'bg-orange-100 text-orange-700 border-2 border-orange-300'
                                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {year}
                          </button>
                        )
                      })
                    })()}
            </div>
          </div>
              )}
            </div>
          </div>
      </div>
      )}

      {/* Step Modal (same as in StepsManagementView) */}
      {showStepModal && typeof window !== 'undefined' && createPortal(
        <>
          <div 
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => {
              setShowStepModal(false)
              setStepModalData({
                id: null,
                title: '',
                description: '',
                date: '',
                goalId: '',
                completed: false,
                is_important: false,
                is_urgent: false,
                deadline: '',
                estimated_time: 0,
                checklist: [],
                require_checklist_complete: false
              })
            }}
          >
            <div 
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {stepModalData.id ? t('steps.edit') : t('steps.create')}
                  </h2>
                  <button
                    onClick={() => {
                      setShowStepModal(false)
                      setStepModalData({
                        id: null,
                        title: '',
                        description: '',
                        date: '',
                        goalId: '',
                        completed: false,
                        is_important: false,
                        is_urgent: false,
                        deadline: '',
                        estimated_time: 0,
                        checklist: [],
                        require_checklist_complete: false
                      })
                    }}
                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1.5 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Step Details */}
                  <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    {t('steps.title')} <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={stepModalData.title}
                    onChange={(e) => setStepModalData({...stepModalData, title: e.target.value})}
                        className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all bg-white"
                    placeholder={t('steps.titlePlaceholder')}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    {t('steps.description')}
                  </label>
                  <textarea
                    value={stepModalData.description}
                    onChange={(e) => setStepModalData({...stepModalData, description: e.target.value})}
                        className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all bg-white resize-none"
                        rows={3}
                    placeholder={t('steps.descriptionPlaceholder')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      {t('steps.date')}
                    </label>
                    <input
                      type="date"
                      value={stepModalData.date}
                      onChange={(e) => setStepModalData({...stepModalData, date: e.target.value})}
                          className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      {t('steps.goal')}
                    </label>
                    <select
                      value={stepModalData.goalId}
                      onChange={(e) => setStepModalData({...stepModalData, goalId: e.target.value})}
                          className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all bg-white"
                    >
                      <option value="">{t('steps.noGoal')}</option>
                      {goals.map((goal: any) => (
                        <option key={goal.id} value={goal.id}>{goal.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                          Odhadovaný čas (min)
                    </label>
                    <input
                      type="number"
                      value={stepModalData.estimated_time}
                      onChange={(e) => setStepModalData({...stepModalData, estimated_time: parseInt(e.target.value) || 0})}
                          className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all bg-white"
                      min="0"
                    />
                </div>

                      <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stepModalData.is_important}
                      onChange={(e) => setStepModalData({...stepModalData, is_important: e.target.checked})}
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">⭐ Důležitý</span>
                  </label>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Checklist */}
                  <div className="lg:border-l lg:pl-6 border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-semibold text-gray-800 flex items-center gap-2">
                        Checklist
                        {checklistSaving && (
                          <svg className="animate-spin h-4 w-4 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        )}
                      </label>
                      <span className="text-xs text-gray-500">
                        {stepModalData.checklist.filter(item => item.completed).length}/{stepModalData.checklist.length} splněno
                      </span>
                    </div>
                    
                    {/* Checklist Items */}
                    <div className="space-y-2 max-h-[280px] overflow-y-auto mb-3">
                      {stepModalData.checklist.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <svg className="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                          <p className="text-sm">Zatím žádné položky</p>
                          <p className="text-xs mt-1">Přidejte pod-úkoly pro tento krok</p>
                        </div>
                      ) : (
                        stepModalData.checklist.map((item, index) => (
                          <div 
                            key={item.id} 
                            className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                              item.completed 
                                ? 'bg-orange-50 border-orange-200' 
                                : 'bg-gray-50 border-gray-200 hover:border-orange-300'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={async () => {
                                const updatedChecklist = [...stepModalData.checklist]
                                updatedChecklist[index] = { ...item, completed: !item.completed }
                                setStepModalData({...stepModalData, checklist: updatedChecklist})
                                
                                // Auto-save if step already exists
                                if (stepModalData.id) {
                                  try {
                                    await fetch('/api/daily-steps', {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        stepId: stepModalData.id,
                                        checklist: updatedChecklist
                                      })
                                    })
                                    // Refresh steps
                                    const currentUserId = userId || player?.user_id
                                    if (currentUserId) {
                                      const stepsResponse = await fetch(`/api/daily-steps?userId=${currentUserId}`)
                                      if (stepsResponse.ok) {
                                        const steps = await stepsResponse.json()
                                        onDailyStepsUpdate?.(steps)
                                      }
                                    }
                                  } catch (error) {
                                    console.error('Error auto-saving checklist:', error)
                                  }
                                }
                              }}
                              className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                item.completed 
                                  ? 'bg-orange-500 border-orange-500 text-white' 
                                  : 'border-gray-300 hover:border-orange-500'
                              }`}
                            >
                              {item.completed && (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                    <input
                              type="text"
                              value={item.title}
                              onChange={(e) => {
                                const updatedChecklist = [...stepModalData.checklist]
                                updatedChecklist[index] = { ...item, title: e.target.value }
                                setStepModalData({...stepModalData, checklist: updatedChecklist})
                                
                                // Debounced auto-save for text changes
                                if (stepModalData.id) {
                                  if (checklistSaveTimeoutRef.current) {
                                    clearTimeout(checklistSaveTimeoutRef.current)
                                  }
                                  checklistSaveTimeoutRef.current = setTimeout(async () => {
                                    setChecklistSaving(true)
                                    try {
                                      await fetch('/api/daily-steps', {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          stepId: stepModalData.id,
                                          checklist: updatedChecklist
                                        })
                                      })
                                      const currentUserId = userId || player?.user_id
                                      if (currentUserId) {
                                        const stepsResponse = await fetch(`/api/daily-steps?userId=${currentUserId}`)
                                        if (stepsResponse.ok) {
                                          const steps = await stepsResponse.json()
                                          onDailyStepsUpdate?.(steps)
                                        }
                                      }
                                    } catch (error) {
                                      console.error('Error auto-saving checklist:', error)
                                    } finally {
                                      setChecklistSaving(false)
                                    }
                                  }, 500)
                                }
                              }}
                              className={`flex-1 bg-transparent text-sm border-none focus:ring-0 p-0 ${
                                item.completed ? 'line-through text-gray-500' : 'text-gray-800'
                              }`}
                              placeholder="Název položky..."
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                const updatedChecklist = stepModalData.checklist.filter((_, i) => i !== index)
                                setStepModalData({...stepModalData, checklist: updatedChecklist})
                                
                                // Auto-save deletion if step already exists
                                if (stepModalData.id) {
                                  setChecklistSaving(true)
                                  try {
                                    await fetch('/api/daily-steps', {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        stepId: stepModalData.id,
                                        checklist: updatedChecklist
                                      })
                                    })
                                    const currentUserId = userId || player?.user_id
                                    if (currentUserId) {
                                      const stepsResponse = await fetch(`/api/daily-steps?userId=${currentUserId}`)
                                      if (stepsResponse.ok) {
                                        const steps = await stepsResponse.json()
                                        onDailyStepsUpdate?.(steps)
                                      }
                                    }
                                  } catch (error) {
                                    console.error('Error auto-saving checklist:', error)
                                  } finally {
                                    setChecklistSaving(false)
                                  }
                                }
                              }}
                              className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    
                    {/* Add New Checklist Item */}
                    <button
                      type="button"
                      onClick={() => {
                        const newItem = {
                          id: crypto.randomUUID(),
                          title: '',
                          completed: false
                        }
                        setStepModalData({
                          ...stepModalData, 
                          checklist: [...stepModalData.checklist, newItem]
                        })
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors border-2 border-dashed border-orange-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Přidat položku
                    </button>
                    
                    {/* Require checklist complete option */}
                    {stepModalData.checklist.length > 0 && (
                      <label className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                          checked={stepModalData.require_checklist_complete}
                          onChange={(e) => setStepModalData({...stepModalData, require_checklist_complete: e.target.checked})}
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                        <span className="text-xs text-gray-600">Vyžadovat splnění všech položek před dokončením kroku</span>
                  </label>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowStepModal(false)
                    setStepModalData({
                      id: null,
                      title: '',
                      description: '',
                      date: '',
                      goalId: '',
                      completed: false,
                      is_important: false,
                      is_urgent: false,
                      deadline: '',
                      estimated_time: 0,
                      checklist: [],
                      require_checklist_complete: false
                    })
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSaveStepModal}
                  disabled={stepModalSaving || (!userId && !player?.user_id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    stepModalSaving || (!userId && !player?.user_id)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
                >
                  {stepModalSaving ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('common.saving')}
                    </>
                  ) : t('common.save')}
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Habit Modal */}
      {showHabitModal && typeof window !== 'undefined' && createPortal(
        <>
          <div 
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => {
              setShowHabitModal(false)
              setHabitModalData(null)
            }}
          >
            <div 
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {habitModalData?.name || (t('habits.add') || 'Přidat návyk')}
                  </h2>
                  <button
                    onClick={() => {
                      setShowHabitModal(false)
                      setHabitModalData(null)
                    }}
                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1.5 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Settings */}
                <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Název <span className="text-orange-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editingHabitName}
                        onChange={(e) => setEditingHabitName(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all bg-white"
                        placeholder="Název návyku"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Popis
                      </label>
                      <textarea
                        value={editingHabitDescription}
                        onChange={(e) => setEditingHabitDescription(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all bg-white resize-none"
                        rows={3}
                        placeholder="Popis návyku"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Frekvence
                      </label>
                      <select
                        value={editingHabitFrequency}
                        onChange={(e) => setEditingHabitFrequency(e.target.value as 'daily' | 'weekly' | 'monthly' | 'custom')}
                        className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all bg-white"
                      >
                        <option value="daily">Denně</option>
                        <option value="weekly">Týdně</option>
                        <option value="monthly">Měsíčně</option>
                        <option value="custom">Vlastní</option>
                      </select>
                    </div>

                    {editingHabitFrequency === 'custom' && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                          Vyberte dny
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                            <button
                              key={day}
                              onClick={() => {
                                if (editingHabitSelectedDays.includes(day)) {
                                  setEditingHabitSelectedDays(editingHabitSelectedDays.filter(d => d !== day))
                                } else {
                                  setEditingHabitSelectedDays([...editingHabitSelectedDays, day])
                                }
                              }}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                editingHabitSelectedDays.includes(day)
                                  ? 'bg-orange-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {day === 'monday' ? 'Po' : day === 'tuesday' ? 'Út' : day === 'wednesday' ? 'St' : day === 'thursday' ? 'Čt' : day === 'friday' ? 'Pá' : day === 'saturday' ? 'So' : 'Ne'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingHabitAlwaysShow}
                        onChange={(e) => setEditingHabitAlwaysShow(e.target.checked)}
                        className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <label className="text-sm text-gray-700">
                        Vždy zobrazovat (i když není naplánováno)
                      </label>
                    </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex items-center justify-between">
                {/* Delete button - only show for existing habits */}
                {habitModalData?.id && (
                  <button
                    onClick={handleDeleteHabit}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('common.delete') || 'Smazat'}
                  </button>
                )}
                {!habitModalData?.id && <div></div>}
                
                {/* Action buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setShowHabitModal(false)
                      setHabitModalData(null)
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleSaveHabitModal}
                    disabled={habitModalSaving}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      habitModalSaving
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-orange-600 text-white hover:bg-orange-700'
                    }`}
                  >
                    {habitModalSaving ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t('common.saving')}
                      </>
                    ) : t('common.save')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

            </div>
  )
}
