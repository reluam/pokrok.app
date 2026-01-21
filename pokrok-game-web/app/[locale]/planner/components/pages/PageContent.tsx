'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { ItemDetailRenderer } from '../details/ItemDetailRenderer'
import { HabitsPage } from '../views/HabitsPage'
import { HabitDetailPage } from '../views/HabitDetailPage'
import { GoalDetailPage } from '../views/GoalDetailPage'
import { UnifiedDayView } from '../views/UnifiedDayView'
// import { AreaStepsView } from '../views/AreaStepsView' // Replaced with StepsManagementView
import { CalendarView } from '../views/CalendarView'
import { DayView } from '../views/DayView'
import { WeekView } from '../views/WeekView'
import { MonthView } from '../views/MonthView'
import { YearView } from '../views/YearView'
import { SettingsPage } from '../SettingsPage'
import { WorkflowsPage } from './WorkflowsPage'
import { AreasSettingsView } from '../AreasSettingsView'
import { HelpView } from '../views/HelpView'
import { GoalEditingForm } from '../journey/GoalEditingForm'
import { StepModal } from '../modals/StepModal'
import { DisplayContent } from '../content/DisplayContent'
import { getIconComponent, AVAILABLE_ICONS } from '@/lib/icon-utils'
import { getLocalDateString, normalizeDate } from '../utils/dateHelpers'
import { LayoutDashboard, ChevronLeft, ChevronDown, Target, CheckCircle, Moon, Trash2, Search, Menu, CheckSquare, Footprints, Plus, AlertCircle } from 'lucide-react'
import { SidebarNavigation } from '../layout/SidebarNavigation'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { GoalsManagementView } from '../views/GoalsManagementView'
import { HabitsManagementView } from '../views/HabitsManagementView'
import { StepsManagementView } from '../views/StepsManagementView'
import { HabitDetailInlineView } from '../views/HabitDetailInlineView'
import { ImportantStepsPlanningView } from '../workflows/ImportantStepsPlanningView'
import { DailyReviewWorkflow } from '../DailyReviewWorkflow'
import { OnlyTheImportantView } from '../views/OnlyTheImportantView'

// NOTE: This component is very large (~2862 lines) and will be further refactored
// For now, it contains the entire renderPageContent logic

interface PageContentProps {
  currentPage: 'main' | 'goals' | 'habits' | 'steps' | 'statistics' | 'achievements' | 'settings' | 'workflows' | 'help' | 'areas'
  showStepModal?: boolean
  setShowStepModal?: (show: boolean) => void
  stepModalData?: any
  setStepModalData?: (data: any) => void
  [key: string]: any // Allow any props - this function uses many variables from parent
}

export function PageContent(props: PageContentProps) {
  const t = useTranslations()
  const locale = useLocale()
  const localeCode = locale === 'cs' ? 'cs-CZ' : 'en-US'
  
  // Extract all needed variables from props
  const {
    currentPage,
    mainPanelSection,
    setMainPanelSection,
    selectedItem,
    selectedItemType,
    goals,
    habits,
    dailySteps,
    player,
    userId,
    areas,
    editingStepTitle,
    setEditingStepTitle,
    stepTitle,
    setStepTitle,
    stepDescription,
    setStepDescription,
    showTimeEditor,
    setShowTimeEditor,
    stepEstimatedTime,
    setStepEstimatedTime,
    showDatePicker,
    setShowDatePicker,
    selectedDate,
    setSelectedDate,
    stepIsImportant,
    setStepIsImportant,
    stepIsUrgent,
    setStepIsUrgent,
    showStepGoalPicker,
    setShowStepGoalPicker,
    stepGoalId,
    setStepGoalId,
    habitDetailTab,
    setHabitDetailTab,
    currentMonth,
    setCurrentMonth,
    editingHabitName,
    setEditingHabitName,
    editingHabitDescription,
    setEditingHabitDescription,
    editingHabitFrequency,
    setEditingHabitFrequency,
    editingHabitSelectedDays,
    setEditingHabitSelectedDays,
    editingHabitCategory,
    setEditingHabitCategory,
    editingHabitDifficulty,
    setEditingHabitDifficulty,
    editingHabitReminderTime,
    setEditingHabitReminderTime,
    handleCloseDetail,
    handleToggleStepCompleted,
    handleSaveStep,
    handleRescheduleStep,
    handleHabitCalendarToggle,
    handleUpdateGoalForDetail,
    handleDeleteGoalForDetail,
    setSelectedItem,
    onHabitsUpdate,
    stepsCacheRef,
    setStepsCacheVersion,
    completedSteps,
    activeHabits,
    completedGoals,
    progressPercentage,
    handleItemClick,
    handleHabitToggle,
    handleStepToggle,
    loadingHabits,
    loadingSteps,
    animatingSteps,
    onOpenStepModal,
    onNavigateToHabits,
    onNavigateToSteps,
    onStepDateChange,
    onStepTimeChange,
    onStepImportantChange,
    handleCreateGoal,
    handleOpenStepModal,
    handleOpenHabitModal,
    expandedAreas,
    setExpandedAreas,
    expandedGoalSections,
    setExpandedGoalSections,
    handleOpenAreasManagementModal,
    handleOpenAreaEditModal,
    handleDeleteArea,
    showDeleteAreaModal,
    setShowDeleteAreaModal,
    setAreaToDelete,
    deleteAreaWithRelated,
    setDeleteAreaWithRelated,
    isDeletingArea,
    setIsDeletingArea,
    handleUpdateAreaForDetail,
    showAreaDetailIconPicker,
    areaDetailIconPickerPosition,
    setAreaDetailIconPickerPosition,
    setShowAreaDetailIconPicker,
    iconSearchQuery,
    setIconSearchQuery,
    showAreaDetailColorPicker,
    areaDetailColorPickerPosition,
    setAreaDetailColorPickerPosition,
    setShowAreaDetailColorPicker,
    areaDetailTitleValue,
    setAreaDetailTitleValue,
    editingAreaDetailTitle,
    setEditingAreaDetailTitle,
    areaDetailDescriptionValue,
    setAreaDetailDescriptionValue,
    editingAreaDetailDescription,
    setEditingAreaDetailDescription,
    areaIconRef,
    areaTitleRef,
    areaDescriptionRef,
    habitsRef,
    stepsRef,
    handleWorkflowComplete,
    handleWorkflowSkip,
    handleGoalProgressUpdate,
    pendingWorkflow,
    setCurrentPage,
    // Goal detail page props
    goalDetailTitleValue,
    setGoalDetailTitleValue,
    editingGoalDetailTitle,
    setEditingGoalDetailTitle,
    goalDetailDescriptionValue,
    setGoalDetailDescriptionValue,
    editingGoalDetailDescription,
    setEditingGoalDetailDescription,
    showGoalDetailDatePicker,
    setShowGoalDetailDatePicker,
    goalDetailDatePickerPosition,
    setGoalDetailDatePickerPosition,
    goalDetailDatePickerMonth,
    setGoalDetailDatePickerMonth,
    selectedGoalDate,
    setSelectedGoalDate,
    showGoalDetailStartDatePicker,
    setShowGoalDetailStartDatePicker,
    goalDetailStartDatePickerPosition,
    setGoalDetailStartDatePickerPosition,
    goalDetailStartDatePickerMonth,
    setGoalDetailStartDatePickerMonth,
    selectedGoalStartDate,
    setSelectedGoalStartDate,
    showGoalDetailStatusPicker,
    setShowGoalDetailStatusPicker,
    goalDetailStatusPickerPosition,
    setGoalDetailStatusPickerPosition,
    showGoalDetailAreaPicker,
    setShowGoalDetailAreaPicker,
    goalDetailAreaPickerPosition,
    setGoalDetailAreaPickerPosition,
    showGoalDetailIconPicker,
    setShowGoalDetailIconPicker,
    goalDetailIconPickerPosition,
    setGoalDetailIconPickerPosition,
    showDeleteGoalModal,
    setShowDeleteGoalModal,
    deleteGoalWithSteps,
    setDeleteGoalWithSteps,
    isDeletingGoal,
    setIsDeletingGoal,
    goalIconRef,
    goalTitleRef,
    goalDescriptionRef,
    goalDateRef,
    goalStartDateRef,
    goalStatusRef,
    goalAreaRef,
    selectedDayDate,
    setSelectedDayDate,
    selectedYear,
    setSelectedYear,
    visibleSections = undefined,
    setShowDatePickerModal,
    setSelectedItemType,
    showStepModal = false,
    setShowStepModal,
    stepModalData = null,
    setStepModalData,
    stepsCacheVersion,
    // Optional variables that may not be passed
    mobileMenuOpen,
    setMobileMenuOpen,
    selectedHabitId,
    habitTimelineOffsets,
    setHabitTimelineOffsets,
    habitDetailVisibleDays,
    habitDetailTimelineContainerRef,
    habitsPageTimelineOffset,
    setHabitsPageTimelineOffset,
    habitsPageVisibleDays,
    setHabitsPageVisibleDays,
    selectedDateForGoal,
    setSelectedDateForGoal,
    quickEditGoalId,
    setQuickEditGoalId,
    quickEditGoalField,
    setQuickEditGoalField,
    quickEditGoalPosition,
    setQuickEditGoalPosition,
    handleDeleteAreaConfirm,
    onGoalsUpdate,
    onDailyStepsUpdate,
    handleStepDateChange,
    handleStepTimeChange,
    sidebarCollapsed,
    setSidebarCollapsed,
    showCreateMenu,
    setShowCreateMenu,
    createMenuButtonRef,
    areaColorRef
  } = props;

  // Define topMenuItems locally since it's not passed as prop
  const topMenuItems = [
    { id: 'habits' as const, label: t('navigation.habits'), icon: CheckSquare },
    { id: 'steps' as const, label: t('navigation.steps'), icon: Footprints },
  ];
  
  // Filters state for Goals page
  // Helper function to check if goal is past deadline
  const isGoalPastDeadline = (goal: any): boolean => {
    if (!goal || !goal.target_date) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const deadline = new Date(goal.target_date)
    deadline.setHours(0, 0, 0, 0)
    return deadline < today && goal.status === 'active'
  }
  
  const [goalsStatusFilters, setGoalsStatusFilters] = React.useState<Set<string>>(new Set(['active']))
  const [selectedGoalForDetail, setSelectedGoalForDetail] = React.useState<string | null>(null)
  const [goalsMobileMenuOpen, setGoalsMobileMenuOpen] = React.useState(false)
  
  // Keep selectedGoal in state and update it whenever goals or selectedGoalForDetail changes
  const [selectedGoal, setSelectedGoal] = React.useState<any | null>(null)
  
  React.useEffect(() => {
    if (!selectedGoalForDetail) {
      setSelectedGoal(null)
      return
    }
    const foundGoal = goals.find((g: any) => g.id === selectedGoalForDetail)
    // Always update to ensure we get the latest version, even if reference is the same
    if (foundGoal) {
      setSelectedGoal({ ...foundGoal }) // Create new object to ensure React detects the change
    } else {
      setSelectedGoal(null)
    }
  }, [goals, selectedGoalForDetail])
  
  // Filters state for Habits page
  const [habitsFrequencyFilter, setHabitsFrequencyFilter] = React.useState<'all' | 'daily' | 'weekly' | 'monthly'>('all')
  const [habitsShowCompletedToday, setHabitsShowCompletedToday] = React.useState(true)
  const [selectedHabitForDetail, setSelectedHabitForDetail] = React.useState<string | null>(null)
  const habitsPageTimelineContainerRef = React.useRef<HTMLDivElement>(null)
  const [habitsMobileMenuOpen, setHabitsMobileMenuOpen] = React.useState(false)
  
  // Max upcoming steps setting
  const [maxUpcomingSteps, setMaxUpcomingSteps] = React.useState(5)
  
  // Load maxUpcomingSteps from settings
  React.useEffect(() => {
    const loadUpcomingSettings = async () => {
      try {
        const response = await fetch('/api/view-settings?view_type=upcoming')
        if (response.ok) {
          const data = await response.json()
          if (data?.settings?.maxUpcomingSteps) {
            setMaxUpcomingSteps(data.settings.maxUpcomingSteps)
          }
        }
      } catch (error) {
        console.error('Error loading upcoming view settings:', error)
      }
    }
    loadUpcomingSettings()
  }, [])
  
  // Workflows removed - using individual calendar views instead
  
  // Reset selectedHabitForDetail when navigating to habits page
  React.useEffect(() => {
    if (currentPage === 'habits') {
      setSelectedHabitForDetail(null)
    }
  }, [currentPage])
  
  // Reset selectedGoalForDetail when navigating to goals page
  React.useEffect(() => {
    if (currentPage === 'goals') {
      setSelectedGoalForDetail(null)
    }
  }, [currentPage])

  // Load all steps without date limit when on steps page
  React.useEffect(() => {
    if (currentPage === 'steps' && onDailyStepsUpdate && (userId || player?.user_id)) {
      const loadAllSteps = async () => {
        const currentUserId = userId || player?.user_id
        if (!currentUserId) return

        try {
          // Load ALL steps without date filter to include all overdue, today, and future steps
          const response = await fetch(`/api/daily-steps?userId=${currentUserId}`)
          if (response.ok) {
            const steps = await response.json()
            onDailyStepsUpdate(steps)
          }
        } catch (error) {
          console.error('Error loading all steps for steps page:', error)
        }
      }

      loadAllSteps()
    }
  }, [currentPage, userId, player?.user_id, onDailyStepsUpdate])
  
  // Expose reset function for external use (e.g., from HeaderNavigation)
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResetHabitSelection = () => {
        if (currentPage === 'habits') {
          setSelectedHabitForDetail(null)
        }
      }
      window.addEventListener('resetHabitSelection', handleResetHabitSelection)
      return () => {
        window.removeEventListener('resetHabitSelection', handleResetHabitSelection)
      }
    }
  }, [currentPage])
  

  // Filters state for Steps page
  const [stepsShowCompleted, setStepsShowCompleted] = React.useState(false)
  const [stepsGoalFilter, setStepsGoalFilter] = React.useState<string | null>(null)
  const [stepsAreaFilter, setStepsAreaFilter] = React.useState<string | null>(null)
  const [stepsDateFilter, setStepsDateFilter] = React.useState<string | null>(null)
  const [createNewStepTrigger, setCreateNewStepTrigger] = React.useState(0)
  const [createNewStepTriggerForSection, setCreateNewStepTriggerForSection] = React.useState<Record<string, number>>({})
  const [stepsMobileMenuOpen, setStepsMobileMenuOpen] = React.useState(false)
  
  // Listen for inline step creation trigger from AssistantPanel
  React.useEffect(() => {
    const handleTriggerInlineStepCreation = (e: Event) => {
      const customEvent = e as CustomEvent<{ section: string | null }>
      const section = customEvent.detail?.section
      if (!section) return
      
      if (section === 'focus-upcoming') {
        setCreateNewStepTriggerForSection(prev => ({
          ...prev,
          'focus-upcoming': (prev['focus-upcoming'] || 0) + 1
        }))
      } else if (section.startsWith('area-')) {
        const areaId = section.replace('area-', '')
        setCreateNewStepTriggerForSection(prev => ({
          ...prev,
          [`area-${areaId}`]: (prev[`area-${areaId}`] || 0) + 1
        }))
      } else if (section.startsWith('goal-')) {
        const goalId = section.replace('goal-', '')
        setCreateNewStepTriggerForSection(prev => ({
          ...prev,
          [`goal-${goalId}`]: (prev[`goal-${goalId}`] || 0) + 1
        }))
      }
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('triggerInlineStepCreation', handleTriggerInlineStepCreation)
      return () => {
        window.removeEventListener('triggerInlineStepCreation', handleTriggerInlineStepCreation)
      }
    }
  }, [])
  
  // Metrics state
  const [metrics, setMetrics] = React.useState<Record<string, any[]>>({})
  const [loadingMetrics, setLoadingMetrics] = React.useState<Set<string>>(new Set())
  const [showMetricModal, setShowMetricModal] = React.useState(false)
  const [metricModalData, setMetricModalData] = React.useState<any>({ id: null, name: '', targetValue: 0, incrementalValue: 1, unit: '' })
  const [editingMetricName, setEditingMetricName] = React.useState('')
  const [editingMetricType, setEditingMetricType] = React.useState<'number' | 'currency' | 'percentage' | 'distance' | 'time' | 'weight' | 'custom'>('number')
  const [editingMetricCurrentValue, setEditingMetricCurrentValue] = React.useState(0)
  const [editingMetricTargetValue, setEditingMetricTargetValue] = React.useState(0)
  const [editingMetricInitialValue, setEditingMetricInitialValue] = React.useState(0)
  const [editingMetricIncrementalValue, setEditingMetricIncrementalValue] = React.useState(1)
  const [editingMetricUnit, setEditingMetricUnit] = React.useState('')
  
  // Sync selectedGoalForDetail with mainPanelSection when it's a goal detail (only on main page, not on goals page)
  React.useEffect(() => {
    // Only sync when on main page, not on goals page - goals page should work independently
    if (currentPage === 'main' && mainPanelSection && mainPanelSection.startsWith('goal-')) {
      const goalId = mainPanelSection.replace('goal-', '')
      if (goalId && goalId !== selectedGoalForDetail) {
        setSelectedGoalForDetail(goalId)
      }
    }
  }, [mainPanelSection, selectedGoalForDetail, currentPage])

  // Load metrics for a goal
  React.useEffect(() => {
    if (selectedGoalForDetail) {
      const loadMetrics = async () => {
        try {
          const response = await fetch(`/api/goal-metrics?goalId=${selectedGoalForDetail}`)
          if (response.ok) {
            const data = await response.json()
            setMetrics(prev => ({ ...prev, [selectedGoalForDetail]: data.metrics || [] }))
          }
        } catch (error) {
          console.error('Error loading metrics:', error)
        }
      }
      loadMetrics()
    } else {
      // Clear metrics when no goal is selected
      setMetrics({})
    }
  }, [selectedGoalForDetail])
  
  // Metric functions
  const handleMetricIncrement = React.useCallback(async (metricId: string, goalId: string) => {
    console.log('handleMetricIncrement called with:', { metricId, goalId })
    setLoadingMetrics(prev => new Set(prev).add(metricId))
    try {
      console.log('Sending PATCH request to /api/goal-metrics')
      const response = await fetch('/api/goal-metrics', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metricId, goalId })
      })
      console.log('PATCH response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('PATCH response data:', data)
        setMetrics(prev => ({
          ...prev,
          [goalId]: (prev[goalId] || []).map(m => m.id === metricId ? data.metric : m)
        }))
        // Update goal if it was returned in response
        if (data.goal && onGoalsUpdate) {
          const updatedGoals = goals.map((g: any) => g.id === goalId ? data.goal : g)
          onGoalsUpdate(updatedGoals)
        } else if (onGoalsUpdate) {
          // Fallback: reload all goals from API
          const goalsResponse = await fetch(`/api/goals?t=${Date.now()}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache'
            }
          })
          if (goalsResponse.ok) {
            const goalsData = await goalsResponse.json()
            onGoalsUpdate(goalsData.goals || goalsData || [])
          }
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('PATCH response not OK:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        })
        alert(`Chyba při přidání hodnoty: ${errorData.details || errorData.error || 'Neznámá chyba'}`)
      }
    } catch (error) {
      console.error('Error incrementing metric:', error)
      alert(`Chyba při přidání hodnoty: ${error instanceof Error ? error.message : 'Neznámá chyba'}`)
    } finally {
      setLoadingMetrics(prev => {
        const newSet = new Set(prev)
        newSet.delete(metricId)
        return newSet
      })
    }
  }, [onGoalsUpdate])
  
  const handleMetricCreate = React.useCallback(async (goalId: string, metricData: any) => {
    try {
      const response = await fetch('/api/goal-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId,
          name: metricData.name,
          type: metricData.type || 'number',
          unit: metricData.unit,
          targetValue: metricData.targetValue,
          currentValue: metricData.currentValue || 0,
          initialValue: metricData.initialValue ?? 0,
          incrementalValue: metricData.incrementalValue
        })
      })
      if (response.ok) {
        const data = await response.json()
        setMetrics(prev => ({
          ...prev,
          [goalId]: [...(prev[goalId] || []), data.metric]
        }))
        // Reload metrics to ensure consistency
        const reloadResponse = await fetch(`/api/goal-metrics?goalId=${goalId}`)
        if (reloadResponse.ok) {
          const reloadData = await reloadResponse.json()
          setMetrics(prev => ({ ...prev, [goalId]: reloadData.metrics || [] }))
        }
        // Update goal if it was returned in response
        if (data.goal && onGoalsUpdate) {
          const updatedGoals = goals.map((g: any) => g.id === goalId ? data.goal : g)
          onGoalsUpdate(updatedGoals)
        } else if (onGoalsUpdate) {
          // Fallback: reload all goals from API
          const goalsResponse = await fetch(`/api/goals?t=${Date.now()}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache'
            }
          })
          if (goalsResponse.ok) {
            const goalsData = await goalsResponse.json()
            onGoalsUpdate(goalsData.goals || goalsData || [])
          }
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error creating metric - response not OK:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        })
        alert(`Chyba při vytváření metriky: ${errorData.details || errorData.error || 'Neznámá chyba'}`)
      }
    } catch (error: any) {
      console.error('Error creating metric:', error)
      alert(`Chyba při vytváření metriky: ${error?.message || 'Neznámá chyba'}`)
    }
  }, [onGoalsUpdate])
  
  const handleMetricUpdate = React.useCallback(async (metricId: string, goalId: string, metricData: any) => {
    try {
      const response = await fetch('/api/goal-metrics', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metricId,
          goalId,
          name: metricData.name,
          type: metricData.type || 'number',
          unit: metricData.unit,
          currentValue: metricData.currentValue,
          targetValue: metricData.targetValue,
          initialValue: metricData.initialValue ?? 0,
          incrementalValue: metricData.incrementalValue
        })
      })
      if (response.ok) {
        const data = await response.json()
        setMetrics(prev => ({
          ...prev,
          [goalId]: (prev[goalId] || []).map(m => m.id === metricId ? data.metric : m)
        }))
        // Update goal if it was returned in response
        if (data.goal && onGoalsUpdate) {
          const updatedGoals = goals.map((g: any) => g.id === goalId ? data.goal : g)
          onGoalsUpdate(updatedGoals)
          // Return updated goal for immediate use
          return data.goal
        } else if (onGoalsUpdate) {
          // Fallback: reload all goals from API
          const goalsResponse = await fetch(`/api/goals?t=${Date.now()}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache'
            }
          })
          if (goalsResponse.ok) {
            const goalsData = await goalsResponse.json()
            onGoalsUpdate(goalsData.goals || goalsData || [])
            const updatedGoal = (goalsData.goals || goalsData || []).find((g: any) => g.id === goalId)
            return updatedGoal
          }
        }
      }
      return null
    } catch (error) {
      console.error('Error updating metric:', error)
      return null
    }
  }, [goals, onGoalsUpdate])
  
  const handleMetricDelete = React.useCallback(async (metricId: string, goalId: string) => {
    try {
      const response = await fetch(`/api/goal-metrics?metricId=${metricId}&goalId=${goalId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        const data = await response.json()
        setMetrics(prev => ({
          ...prev,
          [goalId]: (prev[goalId] || []).filter(m => m.id !== metricId)
        }))
        // Update goal if it was returned in response
        if (data.goal && onGoalsUpdate) {
          const updatedGoals = goals.map((g: any) => g.id === goalId ? data.goal : g)
          onGoalsUpdate(updatedGoals)
        } else if (onGoalsUpdate) {
          // Fallback: reload all goals from API
          const goalsResponse = await fetch(`/api/goals?t=${Date.now()}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache'
            }
          })
          if (goalsResponse.ok) {
            const goalsData = await goalsResponse.json()
            onGoalsUpdate(goalsData.goals || goalsData || [])
          }
        }
      }
    } catch (error) {
      console.error('Error deleting metric:', error)
    }
  }, [onGoalsUpdate])
  
  return (
    <>
      {(() => {
  switch (props.currentPage) {
      case 'main': {
        // If there's a selected item, show its detail for editing
        if (selectedItem && selectedItemType) {
          return (
            <ItemDetailRenderer
              item={selectedItem}
              type={selectedItemType}
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
              goals={goals}
              habits={habits}
              player={player}
              userId={userId}
              selectedItem={selectedItem}
              setSelectedItem={setSelectedItem}
              onHabitsUpdate={onHabitsUpdate}
              stepsCacheRef={stepsCacheRef}
              setStepsCacheVersion={setStepsCacheVersion}
              completedSteps={completedSteps}
              activeHabits={activeHabits}
              completedGoals={completedGoals}
              progressPercentage={progressPercentage}
            />
          )
        }
        
        // Sidebar navigation items - empty now since Focus is handled in SidebarNavigation
        const sidebarItems: Array<{ id: string; label: string; icon: any }> = []
        
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
          // Legacy workflow views removed - using individual calendar views instead
          
          // Check for only_the_important and daily_review as focus views
          if (mainPanelSection === 'focus-only_the_important') {
            return (
              <div className="w-full flex flex-col bg-primary-50" style={{ height: '100%' }}>
                {userId ? (
                  <OnlyTheImportantView
                    userId={userId}
                    goals={goals}
                    habits={habits}
                    dailySteps={dailySteps}
                    handleStepToggle={handleToggleStepCompleted}
                    handleHabitToggle={handleHabitToggle}
                    handleItemClick={handleItemClick}
                    loadingSteps={loadingSteps}
                    animatingSteps={animatingSteps}
                    player={player}
                    onDailyStepsUpdate={onDailyStepsUpdate}
                    onOpenStepModal={handleOpenStepModal}
                    setMainPanelSection={setMainPanelSection}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-gray-500">{t('common.loading')}</p>
                  </div>
                )}
              </div>
            )
          }
          
          if (mainPanelSection === 'focus-daily_review') {
            return (
              <div className="w-full flex flex-col bg-primary-50" style={{ height: '100%' }}>
                <div className="flex-1 overflow-y-auto p-6" style={{ minHeight: 0 }}>
                  <div className="max-w-4xl mx-auto">
                    <DailyReviewWorkflow
                      workflow={null}
                      goals={goals}
                      player={player}
                      onComplete={async (workflowId: string, xp: number) => {
                        if (onDailyStepsUpdate) {
                          const stepsResponse = await fetch('/api/daily-steps')
                          if (stepsResponse.ok) {
                            const steps = await stepsResponse.json()
                            onDailyStepsUpdate(steps)
                          }
                        }
                      }}
                      onSkip={async (workflowId: string) => {
                        // Handle workflow skip
                      }}
                      onGoalProgressUpdate={async (goalId: string, progress: number) => {
                        if (onGoalsUpdate) {
                          await onGoalsUpdate()
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )
          }
          
          // Check if it's an area page
          if (mainPanelSection.startsWith('area-')) {
            const areaId = mainPanelSection.replace('area-', '')
            const area = areas.find((a: any) => a.id === areaId)
            
            if (!area) {
              return (
                <div className="w-full min-h-full flex items-center justify-center bg-primary-50">
                  <div className="text-center">
                    <p className="text-gray-500">{t('navigation.areaNotFound') || 'Oblast nenalezena'}</p>
                    <button
                      onClick={() => setMainPanelSection('overview')}
                      className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      {t('navigation.backToOverview')}
                    </button>
                  </div>
                </div>
              )
            }
            
            // Get goals for this area (needed for StepsManagementView)
            const areaGoals = goals.filter((goal: any) => goal.area_id === areaId && goal.status === 'active')
            const areaGoalIds = areaGoals.map((goal: any) => goal.id).filter(Boolean)
            const areaHabits = habits.filter((habit: any) => habit.area_id === areaId)
            
            // Calculate area steps statistics
            const areaSteps = dailySteps.filter((step: any) =>
              step.area_id === areaId ||
              (step.goal_id && areaGoalIds.includes(step.goal_id))
            )
            const totalAreaSteps = areaSteps.length
            const completedAreaSteps = areaSteps.filter((step: any) => step.completed).length
            const areaStepsProgress = totalAreaSteps > 0 ? Math.round((completedAreaSteps / totalAreaSteps) * 100) : 0
            
            const IconComponent = getIconComponent(area.icon || 'LayoutDashboard')
            const areaColor = area.color || '#ea580c'
            
            return (
              <div key={`area-${areaId}-${area.icon}-${area.color}`} className="w-full flex flex-col bg-primary-50" style={{ height: '100%' }}>
                {/* Area detail content */}
                <div className="flex-1 flex flex-col overflow-hidden" style={{ minHeight: 0 }}>
                  <div className="p-6 flex-shrink-0">
                    {/* Area header - with inline editing */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span 
                            ref={areaIconRef}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (areaIconRef.current) {
                                const rect = areaIconRef.current.getBoundingClientRect()
                                setAreaDetailIconPickerPosition({ top: rect.bottom + 5, left: rect.left })
                                setShowAreaDetailIconPicker(true)
                                setIconSearchQuery('')
                              }
                            }}
                            className="cursor-pointer hover:opacity-70 transition-opacity flex items-center flex-shrink-0"
                          >
                            <IconComponent className="w-6 h-6" style={{ color: areaColor }} />
                          </span>
                          <div className="min-w-0 flex-1">
                            {editingAreaDetailTitle ? (
                              <input
                                ref={areaTitleRef as React.RefObject<HTMLInputElement>}
                                type="text"
                                value={areaDetailTitleValue}
                                onChange={(e) => setAreaDetailTitleValue(e.target.value)}
                                onBlur={async () => {
                                  if (areaDetailTitleValue.trim() && areaDetailTitleValue !== area.name) {
                                    await handleUpdateAreaForDetail(areaId, { name: areaDetailTitleValue.trim() })
                                  } else if (!areaDetailTitleValue.trim()) {
                                    setAreaDetailTitleValue(area.name)
                                  }
                                  setEditingAreaDetailTitle(false)
                                }}
                                onKeyDown={async (e) => {
                                  if (e.key === 'Enter') {
                                    if (areaDetailTitleValue.trim() && areaDetailTitleValue !== area.name) {
                                      await handleUpdateAreaForDetail(areaId, { name: areaDetailTitleValue.trim() })
                                    }
                                    setEditingAreaDetailTitle(false)
                                  } else if (e.key === 'Escape') {
                                    setAreaDetailTitleValue(area.name)
                                    setEditingAreaDetailTitle(false)
                                  }
                                }}
                                className="text-xl font-bold text-gray-900 bg-transparent border-2 border-primary-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500 w-full"
                                autoFocus
                              />
                            ) : (
                              <h1 
                                ref={areaTitleRef as React.RefObject<HTMLHeadingElement>}
                                onClick={() => {
                                  setAreaDetailTitleValue(area.name)
                                  setEditingAreaDetailTitle(true)
                                }}
                                className="text-xl font-bold text-gray-900 cursor-pointer hover:text-primary-600 transition-colors truncate"
                              >
                                {area.name}
                              </h1>
                            )}
                            {editingAreaDetailDescription ? (
                              <textarea
                                ref={areaDescriptionRef as React.RefObject<HTMLTextAreaElement>}
                                value={areaDetailDescriptionValue}
                                onChange={(e) => setAreaDetailDescriptionValue(e.target.value)}
                                onBlur={async () => {
                                  if (areaDetailDescriptionValue !== (area.description || '')) {
                                    await handleUpdateAreaForDetail(areaId, { description: areaDetailDescriptionValue.trim() || null })
                                  } else {
                                    setAreaDetailDescriptionValue(area.description || '')
                                  }
                                  setEditingAreaDetailDescription(false)
                                }}
                                onKeyDown={async (e) => {
                                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                    if (areaDetailDescriptionValue !== (area.description || '')) {
                                      await handleUpdateAreaForDetail(areaId, { description: areaDetailDescriptionValue.trim() || null })
                                    }
                                    setEditingAreaDetailDescription(false)
                                  } else if (e.key === 'Escape') {
                                    setAreaDetailDescriptionValue(area.description || '')
                                    setEditingAreaDetailDescription(false)
                                  }
                                }}
                                className="text-sm text-gray-600 mt-0.5 bg-transparent border-2 border-primary-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500 w-full resize-none"
                                rows={2}
                                autoFocus
                              />
                            ) : (
                              <p 
                                ref={areaDescriptionRef as React.RefObject<HTMLParagraphElement>}
                                onClick={() => {
                                  setAreaDetailDescriptionValue(area.description || '')
                                  setEditingAreaDetailDescription(true)
                                }}
                                className={`text-sm text-gray-600 mt-0.5 truncate cursor-pointer hover:text-primary-600 transition-colors ${!area.description ? 'italic text-gray-400' : ''}`}
                              >
                                {area.description || (t('areas.addDescription') || 'Klikněte pro přidání popisku')}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Controls - on the right */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {/* Color picker button */}
                          <button
                            ref={areaColorRef}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (areaColorRef.current) {
                                const rect = areaColorRef.current.getBoundingClientRect()
                                const pickerWidth = 280
                                // Calculate left position: try to align with button, but shift left if needed to fit
                                const leftPosition = Math.min(
                                  Math.max(rect.left - 100, 10), // At least 10px from left edge, prefer 100px left of button
                                  window.innerWidth - pickerWidth - 10 // At least 10px from right edge
                                )
                                setAreaDetailColorPickerPosition({ 
                                  top: rect.bottom + 5, 
                                  left: leftPosition 
                                })
                                setShowAreaDetailColorPicker(true)
                              }
                            }}
                            className="w-8 h-8 rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors flex-shrink-0"
                            style={{ backgroundColor: areaColor }}
                            title={t('areas.color') || 'Barva'}
                          />
                          
                          {/* Delete button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteArea(areaId)
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm border-2 border-red-300 bg-red-50 text-red-700 rounded-lg transition-all hover:bg-red-100 flex-shrink-0"
                            title={t('areas.delete') || 'Smazat oblast'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                    
                    {/* Area Steps View - using StepsManagementView */}
                    {/* Pass all dailySteps and let StepsManagementView filter by areaFilter */}
                    <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
                      {/* Steps Header - similar to metrics header */}
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 px-4 py-3 mb-2">
                        <div className="flex items-center gap-3">
                          <h2 className="text-xl font-bold text-black font-playful">
                            Kroky
                          </h2>
                          {totalAreaSteps > 0 && (
                            <span className="text-sm text-gray-600 font-playful">
                              {areaStepsProgress}% ({completedAreaSteps} / {totalAreaSteps})
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            const sectionKey = `area-${areaId}`
                            setCreateNewStepTriggerForSection(prev => ({
                              ...prev,
                              [sectionKey]: (prev[sectionKey] || 0) + 1
                            }))
                          }}
                          className="flex items-center justify-center w-8 h-8 text-primary-600 hover:bg-primary-50 rounded-playful-sm transition-colors"
                          title={t('steps.add') || 'Přidat krok'}
                        >
                          <Plus className="w-5 h-5" strokeWidth={2.5} />
                        </button>
                      </div>
                      
                      <div className="p-4 sm:p-6 lg:p-8 pt-2">
                        <StepsManagementView
                        dailySteps={dailySteps}
                        goals={goals}
                        areas={areas}
                        userId={userId}
                        player={player}
                        onDailyStepsUpdate={onDailyStepsUpdate}
                        onOpenStepModal={(step) => {
                          // For area view, if step is provided, open modal
                          // Otherwise (new step), trigger inline creation
                          if (step) {
                            if (handleOpenStepModal) {
                              handleOpenStepModal(undefined, step)
                            }
                          } else {
                            // Trigger new step creation using section-specific trigger
                            const sectionKey = `area-${areaId}`
                            setCreateNewStepTriggerForSection(prev => ({
                              ...prev,
                              [sectionKey]: (prev[sectionKey] || 0) + 1
                            }))
                          }
                        }}
                        onStepImportantChange={onStepImportantChange}
                        handleStepToggle={handleStepToggle}
                        loadingSteps={loadingSteps}
                        createNewStepTrigger={mainPanelSection.startsWith('area-') ? (createNewStepTriggerForSection[`area-${areaId}`] || 0) : 0}
                        onNewStepCreated={() => {
                          // Reset trigger for this section after step is created
                          const sectionKey = `area-${areaId}`
                          setCreateNewStepTriggerForSection(prev => ({
                            ...prev,
                            [sectionKey]: 0
                          }))
                        }}
                        hideHeader={true}
                        showCompleted={false}
                        areaFilter={areaId} // Filter by this area - StepsManagementView will handle filtering
                        />
                      </div>
                    </div>
                </div>
                
                {/* Area Icon Picker */}
                {showAreaDetailIconPicker && areaDetailIconPickerPosition && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowAreaDetailIconPicker(false)}
                    />
                    <div 
                      className="fixed z-50 bg-white border-2 border-gray-200 rounded-xl shadow-2xl"
                      style={{
                        top: `${areaDetailIconPickerPosition.top}px`,
                        left: `${areaDetailIconPickerPosition.left}px`,
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
                            className="w-full pl-9 pr-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                              const isSelected = area.icon === icon.name
                              if (!IconComponent) {
                                console.warn(`Icon component not found for: ${icon.name}`)
                                return null
                              }
                              const currentAreaId = areaId // Capture areaId in closure
                              return (
                                <button
                                  key={icon.name}
                                  type="button"
                                  onClick={async () => {
                                    if (!handleUpdateAreaForDetail) {
                                      console.error('handleUpdateAreaForDetail is not defined')
                                      return
                                    }
                                    await handleUpdateAreaForDetail(currentAreaId, { icon: icon.name })
                                    setShowAreaDetailIconPicker(false)
                                    setIconSearchQuery('')
                                  }}
                                  className={`p-2 rounded-lg transition-all hover:bg-gray-100 ${
                                    isSelected 
                                      ? 'bg-primary-50 border-2 border-primary-500' 
                                      : 'border-2 border-transparent hover:border-gray-300'
                                  }`}
                                  title={icon.label}
                                >
                                  <IconComponent className={`w-5 h-5 mx-auto ${isSelected ? 'text-primary-600' : 'text-gray-700'}`} />
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
                
                {/* Area Color Picker */}
                {showAreaDetailColorPicker && areaDetailColorPickerPosition && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowAreaDetailColorPicker(false)}
                    />
                    <div 
                      className="fixed z-50 bg-white border-2 border-gray-200 rounded-xl shadow-2xl p-4"
                      style={{
                        top: `${areaDetailColorPickerPosition.top}px`,
                        left: `${areaDetailColorPickerPosition.left}px`,
                        width: '240px'
                      }}
                    >
                      <div className="mb-3">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          {t('areas.color') || 'Barva'}
                        </label>
                        <div className="grid grid-cols-4 gap-3">
                          {[
                            { value: '#ea580c', name: 'Oranžová' }, // Primary
                            { value: '#3B82F6', name: 'Modrá' },
                            { value: '#10B981', name: 'Zelená' },
                            { value: '#8B5CF6', name: 'Fialová' },
                            { value: '#EC4899', name: 'Růžová' },
                            { value: '#EF4444', name: 'Červená' },
                            { value: '#F59E0B', name: 'Amber' },
                            { value: '#6366F1', name: 'Indigo' }
                          ].map((color) => (
                            <button
                              key={color.value}
                              type="button"
                              onClick={async () => {
                                await handleUpdateAreaForDetail(areaId, { color: color.value })
                                setShowAreaDetailColorPicker(false)
                              }}
                              className={`w-12 h-12 rounded-lg border-2 transition-all hover:scale-110 ${
                                areaColor === color.value 
                                  ? 'border-gray-800 ring-2 ring-offset-2 ring-primary-400' 
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                              style={{ backgroundColor: color.value }}
                              title={color.name}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
                
              </div>
            )
          }
          
          // Check if it's a habit detail page
          if (mainPanelSection.startsWith('habit-')) {
            const habitId = mainPanelSection.replace('habit-', '')
            const habit = habits.find((h: any) => h.id === habitId)
            
            if (!habit) {
              return (
                <div className="w-full min-h-full flex items-center justify-center bg-primary-50">
                  <div className="text-center">
                    <p className="text-gray-500">{t('navigation.habitNotFound')}</p>
                    <button
                      onClick={() => setMainPanelSection('overview')}
                      className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      {t('navigation.backToOverview')}
                    </button>
                  </div>
                </div>
              )
            }
            
            return (
              <HabitDetailPage
                habit={habit}
                habitTimelineOffsets={habitTimelineOffsets}
                setHabitTimelineOffsets={setHabitTimelineOffsets}
                habitDetailVisibleDays={habitDetailVisibleDays}
                habitDetailTimelineContainerRef={habitDetailTimelineContainerRef}
                handleHabitCalendarToggle={handleHabitCalendarToggle}
                setMainPanelSection={setMainPanelSection}
                loadingHabits={loadingHabits}
              />
            )
          }
          
          // Check if it's a goal detail page
          if (mainPanelSection.startsWith('goal-')) {
            const goalId = mainPanelSection.replace('goal-', '')
            const goal = goals.find((g: any) => g.id === goalId)
            
            if (!goal) {
              return (
                <div className="w-full min-h-full flex items-center justify-center bg-primary-50">
                  <div className="text-center">
                    <p className="text-gray-500">{t('navigation.goalNotFound')}</p>
                    <button
                      onClick={() => setMainPanelSection('overview')}
                      className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      {t('navigation.backToOverview')}
                    </button>
                  </div>
                </div>
              )
            }
            
              return (
              <GoalDetailPage
                goals={[goal]}
                goalId={goalId}
                areas={areas}
                dailySteps={dailySteps}
                stepsCacheRef={stepsCacheRef}
                stepsCacheVersion={stepsCacheVersion}
                animatingSteps={animatingSteps}
                loadingSteps={loadingSteps}
                handleItemClick={handleItemClick}
                handleStepToggle={handleStepToggle}
                handleUpdateGoalForDetail={handleUpdateGoalForDetail}
                handleDeleteGoalForDetail={handleDeleteGoalForDetail}
                setMainPanelSection={setMainPanelSection}
                localeCode={localeCode}
                selectedDayDate={selectedDayDate}
                setStepModalData={setStepModalData}
                setShowStepModal={setShowStepModal}
                metrics={metrics[goalId] || []}
                loadingMetrics={loadingMetrics}
                handleMetricIncrement={handleMetricIncrement}
                handleMetricCreate={handleMetricCreate}
                handleMetricUpdate={handleMetricUpdate}
                handleMetricDelete={handleMetricDelete}
                showMetricModal={showMetricModal}
                setShowMetricModal={setShowMetricModal}
                metricModalData={metricModalData}
                setMetricModalData={setMetricModalData}
                editingMetricName={editingMetricName}
                setEditingMetricName={setEditingMetricName}
                editingMetricType={editingMetricType}
                setEditingMetricType={setEditingMetricType}
                editingMetricCurrentValue={editingMetricCurrentValue}
                setEditingMetricCurrentValue={setEditingMetricCurrentValue}
                editingMetricTargetValue={editingMetricTargetValue}
                setEditingMetricTargetValue={setEditingMetricTargetValue}
                editingMetricInitialValue={editingMetricInitialValue}
                setEditingMetricInitialValue={setEditingMetricInitialValue}
                editingMetricIncrementalValue={editingMetricIncrementalValue}
                setEditingMetricIncrementalValue={setEditingMetricIncrementalValue}
                editingMetricUnit={editingMetricUnit}
                setEditingMetricUnit={setEditingMetricUnit}
                goals={goals}
                userId={userId}
                player={player}
                onDailyStepsUpdate={onDailyStepsUpdate}
                onStepImportantChange={onStepImportantChange}
                createNewStepTrigger={createNewStepTriggerForSection[`goal-${goalId}`] || 0}
                setCreateNewStepTrigger={(fn: (prev: number) => number) => {
                  setCreateNewStepTriggerForSection(prev => ({
                    ...prev,
                    [`goal-${goalId}`]: fn(prev[`goal-${goalId}`] || 0)
                  }))
                }}
                onNewStepCreated={() => {
                  // Reset trigger for this goal section after step is created
                  setCreateNewStepTriggerForSection(prev => ({
                    ...prev,
                    [`goal-${goalId}`]: 0
                  }))
                }}
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
                iconSearchQuery={iconSearchQuery}
                setIconSearchQuery={setIconSearchQuery}
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
                onOpenStepModal={onOpenStepModal}
              />
            )
          }
          
          switch (mainPanelSection) {
            case 'focus-upcoming':
            case 'focus-month':
            case 'focus-year':
            case 'focus-calendar':
              // Map mainPanelSection to viewType
              const getViewType = (section: string): 'upcoming' | 'month' | 'year' => {
                if (section === 'focus-upcoming') return 'upcoming'
                if (section === 'focus-month') return 'month'
                if (section === 'focus-year') return 'year'
                return 'upcoming' // Default fallback
              }
              
              return (
                <CalendarView
                  goals={goals}
                  habits={habits}
                  dailySteps={dailySteps}
                  loadingSteps={loadingSteps}
                  selectedDayDate={selectedDayDate}
                  setSelectedDayDate={setSelectedDayDate}
                  setShowDatePickerModal={setShowDatePickerModal}
                  handleItemClick={handleItemClick}
                  handleHabitToggle={handleHabitToggle}
                  handleStepToggle={handleStepToggle}
                  setSelectedItem={setSelectedItem}
                  setSelectedItemType={setSelectedItemType}
                  onOpenStepModal={mainPanelSection === 'focus-upcoming' ? (step?: any) => {
                    // For UpcomingView, create new step directly on page instead of opening modal
                    if (step) {
                      handleOpenStepModal(undefined, step)
                    } else {
                      // Trigger new step creation using section-specific trigger
                      setCreateNewStepTriggerForSection(prev => ({
                        ...prev,
                        'focus-upcoming': (prev['focus-upcoming'] || 0) + 1
                      }))
                    }
                  } : handleOpenStepModal}
                  onStepDateChange={onStepDateChange}
                  onStepTimeChange={onStepTimeChange}
                  onStepImportantChange={props.onStepImportantChange}
                  loadingHabits={loadingHabits}
                  loadingSteps={loadingSteps}
                  animatingSteps={animatingSteps}
                  player={player}
                  onNavigateToHabits={onNavigateToHabits}
                  onNavigateToSteps={onNavigateToSteps}
                  onHabitsUpdate={onHabitsUpdate}
                  onDailyStepsUpdate={onDailyStepsUpdate}
                  setMainPanelSection={setMainPanelSection}
                  selectedYear={selectedYear}
                  setSelectedYear={setSelectedYear}
                  areas={areas}
                  userId={userId}
                  visibleSections={visibleSections}
                  viewType={getViewType(mainPanelSection)}
                  maxUpcomingSteps={maxUpcomingSteps}
                  createNewStepTrigger={mainPanelSection === 'focus-upcoming' ? (createNewStepTriggerForSection['focus-upcoming'] || 0) : undefined}
                  onNewStepCreatedForUpcoming={() => {
                    // Reset trigger for upcoming section after step is created
                    if (mainPanelSection === 'focus-upcoming') {
                      setCreateNewStepTriggerForSection(prev => ({
                        ...prev,
                        'focus-upcoming': 0
                      }))
                    }
                  }}
                />
              )
            case 'goals':
              return (
                <div className="min-h-full bg-primary-50">
                  <GoalsManagementView
                    goals={goals}
                    onGoalsUpdate={onGoalsUpdate}
                    userId={userId}
                    player={player}
                    dailySteps={dailySteps}
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
                          areaId: '',
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
                      const goal = goals.find((g: any) => g.id === goalId)
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
                      const goal = goals.find((g: any) => g.id === goalId)
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
                <div className="min-h-full bg-primary-50">
                  <StepsManagementView
                    dailySteps={dailySteps}
                    goals={goals}
                    areas={areas}
                    onDailyStepsUpdate={onDailyStepsUpdate}
                    userId={userId}
                    player={player}
                    onStepImportantChange={onStepImportantChange}
                    handleStepToggle={handleStepToggle}
                    loadingSteps={loadingSteps}
                    createNewStepTrigger={createNewStepTriggerForSection['steps'] || 0}
                    onNewStepCreated={() => {
                      // Reset trigger for steps section after step is created
                      setCreateNewStepTriggerForSection(prev => ({
                        ...prev,
                        'steps': 0
                      }))
                    }}
                    onOpenStepModal={(step?: any) => {
                      if (step) {
                        handleOpenStepModal(undefined, step)
                      } else {
                        // For new step, trigger creation instead of opening modal
                        setCreateNewStepTriggerForSection(prev => ({
                          ...prev,
                          'steps': (prev['steps'] || 0) + 1
                        }))
                      }
                    }}
                  />
                </div>
              )
            case 'habits':
              return (
                <HabitsPage
                  habits={habits}
                  selectedHabitId={selectedHabitId}
                  habitsPageTimelineOffset={habitsPageTimelineOffset}
                  setHabitsPageTimelineOffset={setHabitsPageTimelineOffset}
                  habitsPageVisibleDays={habitsPageVisibleDays}
                  setHabitsPageVisibleDays={setHabitsPageVisibleDays}
                  handleHabitCalendarToggle={handleHabitCalendarToggle}
                  handleOpenHabitModal={handleOpenHabitModal}
                  loadingHabits={loadingHabits}
                />
              )
            default:
              return null
          }
        }
        
        return (
          <div className="flex-1 flex bg-primary-50 overflow-hidden h-full">
            {/* Left sidebar - Navigation - Hidden on mobile */}
            <SidebarNavigation
              sidebarCollapsed={sidebarCollapsed}
              setSidebarCollapsed={setSidebarCollapsed}
              mainPanelSection={mainPanelSection}
              setMainPanelSection={setMainPanelSection}
              sidebarItems={sidebarItems}
              areas={areas}
              sortedGoalsForSidebar={sortedGoalsForSidebar}
              dailySteps={dailySteps}
              expandedAreas={expandedAreas}
              setExpandedAreas={setExpandedAreas}
              expandedGoalSections={expandedGoalSections}
              setExpandedGoalSections={setExpandedGoalSections}
              handleOpenAreasManagementModal={handleOpenAreasManagementModal}
              handleCreateGoal={handleCreateGoal}
              handleOpenStepModal={mainPanelSection === 'focus-upcoming' || mainPanelSection.startsWith('area-') || mainPanelSection.startsWith('goal-') ? () => {
                // For UpcomingView, Area views, and Goal views, trigger new step creation instead of opening modal
                // Use section-specific trigger
                if (mainPanelSection === 'focus-upcoming') {
                  setCreateNewStepTriggerForSection(prev => ({
                    ...prev,
                    'focus-upcoming': (prev['focus-upcoming'] || 0) + 1
                  }))
                } else if (mainPanelSection.startsWith('area-')) {
                  const areaId = mainPanelSection.replace('area-', '')
                  setCreateNewStepTriggerForSection(prev => ({
                    ...prev,
                    [`area-${areaId}`]: (prev[`area-${areaId}`] || 0) + 1
                  }))
                } else if (mainPanelSection.startsWith('goal-')) {
                  const goalId = mainPanelSection.replace('goal-', '')
                  setCreateNewStepTriggerForSection(prev => ({
                    ...prev,
                    [`goal-${goalId}`]: (prev[`goal-${goalId}`] || 0) + 1
                  }))
                }
              } : handleOpenStepModal}
              handleOpenHabitModal={handleOpenHabitModal}
              handleOpenAreaEditModal={handleOpenAreaEditModal}
              showCreateMenu={showCreateMenu}
              setShowCreateMenu={setShowCreateMenu}
              createMenuButtonRef={createMenuButtonRef}
              isOnboardingAddMenuStep={props.isOnboardingAddMenuStep}
              isOnboardingAddMenuGoalStep={props.isOnboardingAddMenuGoalStep}
              isOnboardingClickGoalStep={props.isOnboardingClickGoalStep}
              createMenuRef={props.createMenuRef}
              goalsSectionRef={props.goalsSectionRef}
              onOnboardingAreaClick={props.onOnboardingAreaClick}
              onOnboardingGoalClick={props.onOnboardingGoalClick}
              areaButtonRefs={props.areaButtonRefs}
              goalButtonRefs={props.goalButtonRefs}
              onGoalClick={props.onGoalClick}
              onAreasUpdate={props.onAreasUpdate}
              onAreasReorder={async (areaIds: string[]) => {
                try {
                  const response = await fetch('/api/cesta/areas', {
                    method: 'PATCH',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ areaIds }),
                  })
                  if (response.ok && props.onAreasUpdate) {
                    // Reload areas to get updated order
                    const areasResponse = await fetch('/api/cesta/areas')
                    if (areasResponse.ok) {
                      const data = await areasResponse.json()
                      props.onAreasUpdate(data.areas || [])
                    }
                  }
                } catch (error) {
                  console.error('Error updating area order:', error)
                }
              }}
            />

            {/* Right content area */}
            <div className="flex-1 overflow-y-auto bg-primary-50 flex flex-col" style={{ minHeight: 0 }}>
              {/* Mobile hamburger menu for focus-day and other sections (except goal detail pages) */}
              {!mainPanelSection.startsWith('goal-') && (
                <div className="md:hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">
                      {['focus-upcoming', 'focus-month', 'focus-year', 'focus-calendar'].includes(mainPanelSection)
                        ? t('navigation.calendar') || 'Kalendář'
                        : mainPanelSection.startsWith('area-')
                        ? areas.find((a: any) => `area-${a.id}` === mainPanelSection)?.name || t('navigation.areas')
                        : t('navigation.title')}
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
                          <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-[101] min-w-[200px]">
                            <nav className="py-2">
                              {/* Focus Upcoming */}
                              <button
                                onClick={() => {
                                  setMainPanelSection('focus-upcoming')
                                  setMobileMenuOpen(false)
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                                  mainPanelSection === 'focus-upcoming'
                                    ? 'bg-primary-600 text-white'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
                                <span className="font-medium">{t('calendar.upcoming') || 'Nadcházející'}</span>
                              </button>
                              
                              {/* Focus Month */}
                                        <button
                                          onClick={() => {
                                  setMainPanelSection('focus-month')
                                            setMobileMenuOpen(false)
                                          }}
                                          className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                                  mainPanelSection === 'focus-month'
                                    ? 'bg-primary-600 text-white'
                                              : 'text-gray-700 hover:bg-gray-100'
                                          }`}
                                        >
                                <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
                                <span className="font-medium">{t('navigation.focusMonth') || 'Měsíční'}</span>
                                        </button>
                              
                              {/* Divider */}
                              {areas.length > 0 && (
                                <div className="border-t border-gray-200 my-2" />
                              )}
                                    
                              {/* Areas in mobile menu */}
                              {areas.map((area: any) => {
                                const areaSectionId = `area-${area.id}`
                                const IconComponent = getIconComponent(area.icon || 'LayoutDashboard')
                                const areaColor = area.color || '#ea580c'
                                      return (
                                        <button
                                    key={area.id}
                                          onClick={() => {
                                      setMainPanelSection(areaSectionId)
                                            setMobileMenuOpen(false)
                                          }}
                                          className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                                      mainPanelSection === areaSectionId
                                        ? 'bg-primary-600 text-white'
                                              : 'text-gray-700 hover:bg-gray-100'
                                          }`}
                                        >
                                    <IconComponent className={`w-5 h-5 flex-shrink-0 ${mainPanelSection === areaSectionId ? 'text-white' : ''}`} style={mainPanelSection !== areaSectionId ? { color: areaColor } : undefined} />
                                    <span className="font-medium">{area.name}</span>
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
                        const goal = goals.find((g: any) => g.id === goalId)
                        if (!goal) return null
                        const IconComponent = getIconComponent(goal.icon)
                        const isPastDeadline = isGoalPastDeadline(goal)
                        return (
                          <>
                            <IconComponent className="w-5 h-5 flex-shrink-0 text-gray-700" />
                            {isPastDeadline && (
                              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
                            )}
                            <h2 className={`text-lg font-bold truncate ${isPastDeadline ? 'text-red-600' : 'text-gray-900'}`}>{goal.title}</h2>
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
              {renderMainContent()}
            </div>
          </div>
        )
      }

      case 'statistics': {
        return (
          <div className="bg-white bg-opacity-95 rounded-2xl p-8 border border-primary-200 shadow-xl backdrop-blur-sm" style={{
            boxShadow: '0 12px 24px rgba(251, 146, 60, 0.15), 0 4px 8px rgba(0, 0, 0, 0.05)'
          }}>
            <h2 className="text-2xl font-bold text-primary-800 mb-6" style={{ letterSpacing: '1px' }}>STATISTIKY</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Pokrok</h3>
                <p className="text-3xl font-bold text-primary-600">{Math.round(progressPercentage)}%</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Cíle</h3>
                <p className="text-3xl font-bold text-primary-600">{completedGoals}/{goals.length}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Návyky</h3>
                <p className="text-3xl font-bold text-primary-600">{activeHabits}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Energie</h3>
                <p className="text-3xl font-bold text-primary-600">{player?.energy || 100}%</p>
              </div>
            </div>
          </div>
        );
      }

      case 'achievements': {
        return (
          <div className="bg-white bg-opacity-95 rounded-2xl p-8 border border-primary-200 shadow-xl backdrop-blur-sm" style={{
            boxShadow: '0 12px 24px rgba(251, 146, 60, 0.15), 0 4px 8px rgba(0, 0, 0, 0.05)'
          }}>
            <h2 className="text-2xl font-bold text-primary-800 mb-6" style={{ letterSpacing: '1px' }}>ÚSPĚCHY</h2>
            <div className="text-center text-gray-500 py-8">
              <p className="text-lg">Systém úspěchů</p>
              <p className="text-sm">Funkce bude brzy dostupná</p>
            </div>
          </div>
        );
      }

      case 'settings': {
        return (
          <SettingsPage 
            player={player} 
            onPlayerUpdate={(updatedPlayer) => {
              // Update player in parent component if needed
              console.log('Player updated:', updatedPlayer)
            }}
            onBack={() => setCurrentPage('main')}
            onNavigateToMain={() => setCurrentPage('main')}
          />
        );
      }

      case 'workflows': {
        return (
          <WorkflowsPage 
            player={player}
            onBack={() => setCurrentPage('main')}
            onNavigateToMain={() => setCurrentPage('main')}
          />
        );
      }

      case 'areas': {
        return (
          <AreasSettingsView
            player={player}
            areas={props.areas || []}
            goals={props.goals || []}
            dailySteps={props.dailySteps || []}
            habits={props.habits || []}
            onNavigateToMain={() => {
              if (props.setCurrentPage) {
                props.setCurrentPage('main')
              }
            }}
            onEditArea={(area) => {
              if (props.handleOpenAreaEditModal) {
                props.handleOpenAreaEditModal(area)
              }
            }}
            onDeleteArea={props.handleDeleteArea}
            onDeleteAreaConfirm={props.handleDeleteAreaConfirm}
            isDeletingArea={props.isDeletingArea}
            onSaveArea={async (areaData) => {
              // If areaData has an id, it's an update - save directly
              if (areaData.id) {
                // Set the modal state for the save function
                if (props.setEditingArea) props.setEditingArea({ id: areaData.id })
                if (props.setAreaModalName) props.setAreaModalName(areaData.name || '')
                if (props.setAreaModalDescription) props.setAreaModalDescription(areaData.description || '')
                if (props.setAreaModalColor) props.setAreaModalColor(areaData.color || '#ea580c')
                if (props.setAreaModalIcon) props.setAreaModalIcon(areaData.icon || 'LayoutDashboard')
                
                // Call the actual save function
                if (props.handleSaveArea) {
                  await props.handleSaveArea()
                }
              } else {
                // New area - open modal
                if (props.handleOpenAreaEditModal) {
                  props.handleOpenAreaEditModal()
                }
              }
            }}
            onAreasUpdate={props.onAreasUpdate}
          />
        );
      }

      case 'help': {
        return (
          <div className="w-full h-full">
            <HelpView
            onAddGoal={async () => {
              setCurrentPage('main')
              // Create goal and redirect to its detail page
              await handleCreateGoal()
            }}
            onAddStep={() => {
              setCurrentPage('main')
              setMainPanelSection('steps')
              // Trigger new step creation after a short delay to ensure component is mounted
              setTimeout(() => {
                setCreateNewStepTriggerForSection(prev => ({
                  ...prev,
                  'steps': (prev['steps'] || 0) + 1
                }))
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
            onOpenAreasManagement={() => {
              setCurrentPage('main')
              handleOpenAreasManagementModal()
            }}
            realGoals={goals}
            realHabits={habits}
            realSteps={dailySteps}
          />
          </div>
        );
      }

      case 'goals': {
        const filteredGoals = goals.filter((goal: any) => goalsStatusFilters.has(goal.status))
        const goalsCount = filteredGoals.length

        const handleGoalsStatusFilterToggle = (status: string) => {
          setGoalsStatusFilters(prev => {
            const newSet = new Set(prev)
            if (newSet.has(status)) {
              newSet.delete(status)
            } else {
              newSet.add(status)
            }
            return newSet
          })
        }

        return (
          <div className="flex flex-1 overflow-hidden h-full">
            {/* Left Panel - Filters and Add button - hidden on mobile */}
            <div className={`hidden md:flex ${sidebarCollapsed ? 'w-14' : 'w-64'} border-r-2 border-primary-500 bg-white flex flex-col h-full flex-shrink-0 transition-all duration-300`}>
              {/* Header */}
              <div className="p-4 border-b-2 border-primary-500">
                <button
                  onClick={() => {
                    setSelectedGoalForDetail(null)
                    // Clear main panel section when clicking on goals header to ensure independence
                    if (mainPanelSection && mainPanelSection.startsWith('goal-')) {
                      setMainPanelSection('goals')
                    }
                  }}
                  className="text-sm font-bold text-black font-playful mb-4 hover:text-primary-600 transition-colors cursor-pointer text-left w-full"
                >
                  {t('navigation.goals')}
                </button>
                <p className="text-xs text-gray-600 mb-4">
                  {goalsCount} {goalsCount === 1 ? (localeCode === 'cs-CZ' ? 'cíl' : 'goal') : (localeCode === 'cs-CZ' ? 'cílů' : 'goals')}
                </p>
                
                {/* Status Filters */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={goalsStatusFilters.has('active')}
                      onChange={() => handleGoalsStatusFilterToggle('active')}
                      className="w-4 h-4 text-primary-600 border-2 border-primary-500 rounded-playful-sm focus:ring-primary-500"
                    />
                    <span className="text-xs font-medium text-black font-playful flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-primary-600" />
                      {t('goals.status.active')}
                    </span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={goalsStatusFilters.has('paused')}
                      onChange={() => handleGoalsStatusFilterToggle('paused')}
                      className="w-4 h-4 text-primary-600 border-2 border-primary-500 rounded-playful-sm focus:ring-primary-500"
                    />
                    <span className="text-xs font-medium text-black font-playful flex items-center gap-1.5">
                      <Moon className="w-3.5 h-3.5 text-primary-600" />
                      {t('goals.status.paused')}
                    </span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={goalsStatusFilters.has('completed')}
                      onChange={() => handleGoalsStatusFilterToggle('completed')}
                      className="w-4 h-4 text-primary-600 border-2 border-primary-500 rounded-playful-sm focus:ring-primary-500"
                    />
                    <span className="text-xs font-medium text-black font-playful flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-primary-600" />
                      {t('goals.status.completed')}
                    </span>
                  </label>
                </div>
              </div>
              
              {/* Goals list */}
              <div className="flex-1 overflow-y-auto">
                {filteredGoals.length === 0 ? (
                  <div className="p-4 text-xs text-gray-500 text-center">
                    {t('goals.noGoals') || 'Žádné cíle'}
                  </div>
                ) : (
                  <div className="p-2">
                    {filteredGoals.map((goal: any) => {
                      const isSelected = selectedGoalForDetail === goal.id
                      const IconComponent = getIconComponent(goal.icon)
                      return (
                        <button
                          key={goal.id}
                          onClick={() => {
                            setSelectedGoalForDetail(isSelected ? null : goal.id)
                            // Clear main panel section when selecting goal on goals page to ensure independence
                            if (mainPanelSection && mainPanelSection.startsWith('goal-')) {
                              setMainPanelSection('goals')
                            }
                          }}
                          className={`w-full text-left px-3 py-2 mb-1 rounded-playful-sm text-sm font-playful transition-colors flex items-center gap-2 ${
                            isSelected
                              ? 'bg-primary-500 text-black font-semibold'
                              : 'bg-white text-black hover:bg-primary-50 border-2 border-transparent hover:border-primary-500'
                          }`}
                        >
                          <IconComponent className="w-4 h-4 flex-shrink-0" />
                          {isGoalPastDeadline(goal) && (
                            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                          )}
                          <span className={`truncate ${isGoalPastDeadline(goal) ? 'text-red-600' : ''}`}>{goal.title}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Add button at bottom */}
              <div className="p-4 border-t-2 border-primary-500">
                <button
                  onClick={handleCreateGoal}
                  className="btn-playful-base w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary-600 bg-white hover:bg-primary-50"
                >
                  <Plus className="w-5 h-5" />
                  {t('goals.add')}
                </button>
              </div>
            </div>
            {/* Main Content */}
            <div className="flex-1 overflow-y-auto flex flex-col">
              {/* Mobile hamburger menu */}
              <div className="md:hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">
                    {selectedGoalForDetail && selectedGoal ? selectedGoal.title : t('navigation.goals')}
                  </h2>
                  <div className="relative">
                    <button
                      onClick={() => setGoalsMobileMenuOpen(!goalsMobileMenuOpen)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Menu"
                    >
                      <Menu className="w-5 h-5 text-gray-700" />
                    </button>
                    
                    {/* Mobile menu dropdown */}
                    {goalsMobileMenuOpen && (
                      <>
                        {/* Backdrop */}
                        <div 
                          className="fixed inset-0 z-[100]" 
                          onClick={() => setGoalsMobileMenuOpen(false)}
                        />
                        <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-[101] min-w-[200px] max-h-[80vh] overflow-y-auto">
                          <nav className="py-2">
                            {/* Status Filters */}
                            <div className="px-4 py-2 border-b border-gray-200">
                              <h3 className="text-xs font-semibold text-gray-700 uppercase mb-2">{t('goals.filters.status.title') || 'Status'}</h3>
                              <div className="space-y-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={goalsStatusFilters.has('active')}
                                    onChange={() => handleGoalsStatusFilterToggle('active')}
                                    className="w-4 h-4 text-primary-600 border-2 border-primary-500 rounded-playful-sm focus:ring-primary-500"
                                  />
                                  <span className="text-sm font-medium text-black font-playful flex items-center gap-1.5">
                                    <Target className="w-3.5 h-3.5 text-primary-600" />
                                    {t('goals.status.active')}
                                  </span>
                                </label>
                                
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={goalsStatusFilters.has('paused')}
                                    onChange={() => handleGoalsStatusFilterToggle('paused')}
                                    className="w-4 h-4 text-primary-600 border-2 border-primary-500 rounded-playful-sm focus:ring-primary-500"
                                  />
                                  <span className="text-sm font-medium text-black font-playful flex items-center gap-1.5">
                                    <Moon className="w-3.5 h-3.5 text-primary-600" />
                                    {t('goals.status.paused')}
                                  </span>
                                </label>
                                
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={goalsStatusFilters.has('completed')}
                                    onChange={() => handleGoalsStatusFilterToggle('completed')}
                                    className="w-4 h-4 text-primary-600 border-2 border-primary-500 rounded-playful-sm focus:ring-primary-500"
                                  />
                                  <span className="text-sm font-medium text-black font-playful flex items-center gap-1.5">
                                    <CheckCircle className="w-3.5 h-3.5 text-primary-600" />
                                    {t('goals.status.completed')}
                                  </span>
                                </label>
                              </div>
                            </div>
                            
                            {/* Goals list */}
                            {filteredGoals.length > 0 && (
                              <div className="px-4 py-2 border-b border-gray-200">
                                <h3 className="text-xs font-semibold text-gray-700 uppercase mb-2">{t('navigation.goals')}</h3>
                                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                                  {filteredGoals.map((goal: any) => {
                                    const isSelected = selectedGoalForDetail === goal.id
                                    const IconComponent = getIconComponent(goal.icon)
                                    return (
                                      <button
                                        key={goal.id}
                                        onClick={() => {
                                          setSelectedGoalForDetail(isSelected ? null : goal.id)
                                          setGoalsMobileMenuOpen(false)
                                        }}
                                        className={`w-full text-left px-3 py-2 rounded-playful-sm text-sm font-playful transition-colors flex items-center gap-2 ${
                                          isSelected
                                            ? 'bg-primary-500 text-black font-semibold'
                                            : 'bg-white text-black hover:bg-primary-50 border-2 border-transparent hover:border-primary-500'
                                        }`}
                                      >
                                        <IconComponent className="w-4 h-4 flex-shrink-0" />
                                        <span className="truncate">{goal.title}</span>
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                            
                            {/* Add button */}
                            <div className="px-4 py-2">
                              <button
                                onClick={() => {
                                  handleCreateGoal()
                                  setGoalsMobileMenuOpen(false)
                                }}
                                className="btn-playful-base w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary-600 bg-white hover:bg-primary-50"
                              >
                                <Plus className="w-5 h-5" />
                                {t('goals.add')}
                              </button>
                            </div>
                          </nav>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Content area */}
              <div className="flex-1 overflow-y-auto">
              {selectedGoalForDetail && selectedGoal ? (
                <GoalDetailPage
                  key={`goal-${selectedGoalForDetail}-${selectedGoal.progress_percentage || 0}`}
                  goal={selectedGoal}
                      goalId={selectedGoalForDetail}
                      areas={areas}
                      dailySteps={dailySteps}
                      stepsCacheRef={stepsCacheRef}
                      stepsCacheVersion={stepsCacheVersion}
                      animatingSteps={animatingSteps}
                      loadingSteps={loadingSteps}
                      handleItemClick={handleItemClick}
                      handleStepToggle={handleStepToggle}
                      handleUpdateGoalForDetail={handleUpdateGoalForDetail}
                      handleDeleteGoalForDetail={handleDeleteGoalForDetail}
                      setMainPanelSection={setMainPanelSection}
                      localeCode={localeCode}
                      selectedDayDate={selectedDayDate}
                      setStepModalData={setStepModalData}
                      setShowStepModal={setShowStepModal}
                      metrics={metrics[selectedGoalForDetail] || []}
                      loadingMetrics={loadingMetrics}
                      handleMetricIncrement={handleMetricIncrement}
                      handleMetricCreate={handleMetricCreate}
                      handleMetricUpdate={handleMetricUpdate}
                      handleMetricDelete={handleMetricDelete}
                      showMetricModal={showMetricModal}
                      setShowMetricModal={setShowMetricModal}
                      metricModalData={metricModalData}
                      setMetricModalData={setMetricModalData}
                      editingMetricName={editingMetricName}
                      setEditingMetricName={setEditingMetricName}
                      editingMetricType={editingMetricType}
                      setEditingMetricType={setEditingMetricType}
                      editingMetricCurrentValue={editingMetricCurrentValue}
                      setEditingMetricCurrentValue={setEditingMetricCurrentValue}
                      editingMetricTargetValue={editingMetricTargetValue}
                      setEditingMetricTargetValue={setEditingMetricTargetValue}
                      editingMetricInitialValue={editingMetricInitialValue}
                      setEditingMetricInitialValue={setEditingMetricInitialValue}
                      editingMetricIncrementalValue={editingMetricIncrementalValue}
                      setEditingMetricIncrementalValue={setEditingMetricIncrementalValue}
                      editingMetricUnit={editingMetricUnit}
                      setEditingMetricUnit={setEditingMetricUnit}
                      goals={goals}
                      userId={userId}
                      player={player}
                      onDailyStepsUpdate={onDailyStepsUpdate}
                      onStepImportantChange={onStepImportantChange}
                      createNewStepTrigger={createNewStepTrigger}
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
                      iconSearchQuery={iconSearchQuery}
                      setIconSearchQuery={setIconSearchQuery}
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
                    />
              ) : selectedGoalForDetail ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">{t('navigation.goalNotFound') || 'Cíl nenalezen'}</p>
                </div>
              ) : (
                <GoalsManagementView
                  goals={filteredGoals}
                  player={player}
                  userId={userId}
                  onGoalsUpdate={onGoalsUpdate}
                  onGoalClick={(goalId: string) => {
                    setSelectedGoalForDetail(goalId)
                    // Clear main panel section when selecting goal on goals page to ensure independence
                    if (mainPanelSection && mainPanelSection.startsWith('goal-')) {
                      setMainPanelSection('goals')
                    }
                  }}
                  dailySteps={dailySteps}
                  hideHeader={true}
                />
              )}
              </div>
            </div>
          </div>
        )
      }

      case 'habits': {
        const filteredHabits = habits.filter((habit: any) => {
          if (habitsFrequencyFilter !== 'all') {
            if (habitsFrequencyFilter === 'daily' && habit.frequency !== 'daily') return false
            if (habitsFrequencyFilter === 'weekly' && habit.frequency !== 'weekly' && habit.frequency !== 'custom') return false
            if (habitsFrequencyFilter === 'monthly' && habit.frequency !== 'monthly') return false
          }
          if (!habitsShowCompletedToday) {
            const today = new Date().toISOString().split('T')[0]
            const habitCompletions = habit.completions || []
            const isCompletedToday = habitCompletions.some((c: any) => c.date === today)
            if (isCompletedToday) {
              return false
            }
          }
          return true
        })
        
        const selectedHabit = selectedHabitForDetail ? habits.find((h: any) => h.id === selectedHabitForDetail) : null
        
        return (
          <div className="flex flex-1 overflow-hidden h-full">
            {/* Left Panel - List of habits - Hidden on mobile */}
            <div className={`hidden md:flex ${sidebarCollapsed ? 'w-14' : 'w-64'} border-r-2 border-primary-500 bg-white flex flex-col h-full flex-shrink-0 transition-all duration-300`}>
              {/* Header */}
              <div className="p-4 border-b-2 border-primary-500 flex-shrink-0">
                <button
                  onClick={() => setSelectedHabitForDetail(null)}
                  className="text-sm font-bold text-black font-playful mb-2 hover:text-primary-600 transition-colors cursor-pointer text-left w-full"
                >
                  {t('navigation.habits')}
                </button>
                <p className="text-xs text-gray-600">
                  {filteredHabits.length} {filteredHabits.length === 1 ? (localeCode === 'cs-CZ' ? 'návyk' : 'habit') : (localeCode === 'cs-CZ' ? 'návyků' : 'habits')}
                </p>
              </div>
              
              {/* Habits list */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {filteredHabits.length === 0 ? (
                  <div className="p-4 text-xs text-gray-500 text-center">
                    {t('habits.noHabits') || 'Žádné návyky'}
                  </div>
                ) : (
                  <div className="p-2">
                    {filteredHabits.map((habit: any) => {
                      const isSelected = selectedHabitForDetail === habit.id
                      // Calculate total completions count
                      const totalCompletions = habit.habit_completions 
                        ? Object.values(habit.habit_completions).filter((completed: any) => completed === true).length
                        : 0
                      return (
                        <button
                          key={habit.id}
                          onClick={() => setSelectedHabitForDetail(isSelected ? null : habit.id)}
                          className={`w-full text-left px-3 py-2 mb-1 rounded-playful-sm text-sm font-playful transition-colors flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'bg-primary-500 text-black font-semibold'
                              : 'bg-white text-black hover:bg-primary-50 border-2 border-transparent hover:border-primary-500'
                          }`}
                        >
                          <span className="truncate flex-1">{habit.name}</span>
                          <span className={`text-xs font-semibold flex-shrink-0 ${
                            isSelected ? 'text-black' : 'text-primary-600'
                          }`}>
                            {totalCompletions}x
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Add button at bottom */}
              <div className="p-4 border-t-2 border-primary-500 flex-shrink-0">
                <button
                  onClick={() => handleOpenHabitModal(null)}
                  className="btn-playful-base w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary-600 bg-white hover:bg-primary-50"
                >
                  <Plus className="w-5 h-5" />
                  {t('habits.add')}
                </button>
              </div>
            </div>
            
            {/* Main Content */}
            <div className="flex-1 overflow-y-auto flex flex-col">
              {/* Mobile hamburger menu */}
              <div className="md:hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">
                    {selectedHabit ? selectedHabit.name : t('navigation.habits')}
                  </h2>
                  <div className="relative">
                    <button
                      onClick={() => setHabitsMobileMenuOpen(!habitsMobileMenuOpen)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Menu"
                    >
                      <Menu className="w-5 h-5 text-gray-700" />
                    </button>
                    
                    {/* Mobile menu dropdown */}
                    {habitsMobileMenuOpen && (
                      <>
                        {/* Backdrop */}
                        <div 
                          className="fixed inset-0 z-[100]" 
                          onClick={() => setHabitsMobileMenuOpen(false)}
                        />
                        <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-[101] min-w-[200px] max-h-[80vh] overflow-y-auto">
                          <nav className="py-2">
                            {/* Filters */}
                            <div className="px-4 py-2 border-b border-gray-200">
                              <h3 className="text-xs font-semibold text-gray-700 uppercase mb-2">{t('habits.filters.title') || 'Filtry'}</h3>
                              <div className="space-y-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={habitsShowCompletedToday}
                                    onChange={(e) => setHabitsShowCompletedToday(e.target.checked)}
                                    className="w-4 h-4 text-primary-600 border-2 border-primary-500 rounded-playful-sm focus:ring-primary-500"
                                  />
                                  <span className="text-sm font-medium text-black">{t('habits.filters.showCompletedToday') || 'Zobrazit dokončené dnes'}</span>
                                </label>
                              </div>
                              <div className="mt-2">
                                <label className="text-xs font-semibold text-black mb-1.5 block">{t('habits.filters.frequency') || 'Frekvence'}</label>
                                <select
                                  value={habitsFrequencyFilter}
                                  onChange={(e) => setHabitsFrequencyFilter(e.target.value as 'all' | 'daily' | 'weekly' | 'monthly')}
                                  className="w-full px-2 py-1.5 text-xs border-2 border-primary-500 rounded-playful-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                                >
                                  <option value="all">{t('habits.filters.frequency.all') || 'Vše'}</option>
                                  <option value="daily">{t('habits.filters.frequency.daily') || 'Denní'}</option>
                                  <option value="weekly">{t('habits.filters.frequency.weekly') || 'Týdenní'}</option>
                                  <option value="monthly">{t('habits.filters.frequency.monthly') || 'Měsíční'}</option>
                                </select>
                              </div>
                            </div>
                            
                            {/* Habits list */}
                            {filteredHabits.length > 0 && (
                              <div className="px-4 py-2 border-b border-gray-200">
                                <h3 className="text-xs font-semibold text-gray-700 uppercase mb-2">{t('navigation.habits')}</h3>
                                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                                  {filteredHabits.map((habit: any) => {
                                    const isSelected = selectedHabitForDetail === habit.id
                                    const totalCompletions = habit.habit_completions 
                                      ? Object.values(habit.habit_completions).filter((completed: any) => completed === true).length
                                      : 0
                                    return (
                                      <button
                                        key={habit.id}
                                        onClick={() => {
                                          setSelectedHabitForDetail(isSelected ? null : habit.id)
                                          setHabitsMobileMenuOpen(false)
                                        }}
                                        className={`w-full text-left px-3 py-2 rounded-playful-sm text-sm font-playful transition-colors flex items-center justify-between gap-2 ${
                                          isSelected
                                            ? 'bg-primary-500 text-black font-semibold'
                                            : 'bg-white text-black hover:bg-primary-50 border-2 border-transparent hover:border-primary-500'
                                        }`}
                                      >
                                        <span className="truncate flex-1">{habit.name}</span>
                                        <span className={`text-xs font-semibold flex-shrink-0 ${
                                          isSelected ? 'text-black' : 'text-primary-600'
                                        }`}>
                                          {totalCompletions}x
                                        </span>
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                            
                            {/* Add button */}
                            <div className="px-4 py-2">
                              <button
                                onClick={() => {
                                  handleOpenHabitModal(null)
                                  setHabitsMobileMenuOpen(false)
                                }}
                                className="btn-playful-base w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary-600 bg-white hover:bg-primary-50"
                              >
                                <Plus className="w-5 h-5" />
                                {t('habits.add')}
                              </button>
                            </div>
                          </nav>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Content area */}
              <div className="flex-1 overflow-y-auto">
              {selectedHabit ? (
                <HabitDetailInlineView
                  habit={selectedHabit}
                  habitsPageTimelineOffset={habitsPageTimelineOffset}
                  setHabitsPageTimelineOffset={setHabitsPageTimelineOffset}
                  habitsPageVisibleDays={habitsPageVisibleDays}
                  setHabitsPageVisibleDays={setHabitsPageVisibleDays}
                  handleHabitCalendarToggle={handleHabitCalendarToggle}
                  loadingHabits={loadingHabits}
                  onHabitUpdate={(updatedHabit) => {
                    // Update the habit in the list
                    if (onHabitsUpdate) {
                      const newHabits = habits.map((h: any) => h.id === updatedHabit.id ? updatedHabit : h)
                      onHabitsUpdate(newHabits)
                    }
                  }}
                  habitsPageTimelineContainerRef={habitsPageTimelineContainerRef}
                  areas={areas}
                />
              ) : (
                <div className="p-6">
                  <HabitsPage
                    habits={filteredHabits}
                    selectedHabitId={selectedHabitId}
                    habitsPageTimelineOffset={habitsPageTimelineOffset}
                    setHabitsPageTimelineOffset={setHabitsPageTimelineOffset}
                    habitsPageVisibleDays={habitsPageVisibleDays}
                    setHabitsPageVisibleDays={setHabitsPageVisibleDays}
                    handleHabitCalendarToggle={handleHabitCalendarToggle}
                    handleOpenHabitModal={handleOpenHabitModal}
                    loadingHabits={loadingHabits}
                  />
                </div>
              )}
              </div>
            </div>
          </div>
        )
      }

      case 'steps': {
        const filteredSteps = dailySteps.filter((step: any) => {
          // Default: show all incomplete steps (overdue, today, future) regardless of date
          // Only filter by completed status if showCompleted is false
          if (!stepsShowCompleted && step.completed) return false
          
          // Filter by goal if specified
          if (stepsGoalFilter) {
            if (stepsGoalFilter === 'none') {
              // Filter for steps without a goal
              if (step.goal_id || step.goalId) {
                return false
              }
            } else {
              // Filter for steps with a specific goal
              if ((step.goal_id || step.goalId) !== stepsGoalFilter) {
                return false
              }
            }
          }
          
          // Only filter by date if date filter is explicitly set
          // Default behavior: show all steps regardless of date (overdue, today, future)
          if (stepsDateFilter) {
            const stepDate = step.date ? (step.date.includes('T') ? step.date.split('T')[0] : step.date) : null
            if (stepDate !== stepsDateFilter) return false
          }
          
          return true
        })
        const stepsCount = filteredSteps.length

        return (
          <div className="flex flex-1 overflow-hidden h-full">
            {/* Left Panel - Filters and Add button - Hidden on mobile */}
            <div className={`hidden md:flex ${sidebarCollapsed ? 'w-14' : 'w-64'} border-r-2 border-primary-500 bg-white flex flex-col h-full flex-shrink-0 transition-all duration-300`}>
              {/* Filters at top */}
              <div className="p-4 border-b-2 border-primary-500 flex-shrink-0">
                <h3 className="text-sm font-bold text-black font-playful mb-4">{t('navigation.steps')}</h3>
                <p className="text-xs text-gray-600 mb-4">
                  {stepsCount} {stepsCount === 1 ? (localeCode === 'cs-CZ' ? 'krok' : 'step') : (localeCode === 'cs-CZ' ? 'kroků' : 'steps')}
                </p>
                
                {/* Show Completed Checkbox */}
                <div className="mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stepsShowCompleted}
                      onChange={(e) => setStepsShowCompleted(e.target.checked)}
                      className="w-4 h-4 text-primary-600 border-primary-500 rounded-playful-sm focus:ring-primary-500"
                    />
                    <span className="text-xs font-medium text-black">{t('steps.filters.showCompleted')}</span>
                  </label>
                </div>
                
                {/* Area Filter */}
                <div className="mb-3">
                  <label className="text-xs font-semibold text-black mb-1.5 block">{t('steps.filters.area.title') || 'Oblast'}</label>
                  <select
                    value={stepsAreaFilter || ''}
                    onChange={(e) => setStepsAreaFilter(e.target.value || null)}
                    className="w-full px-2 py-1.5 text-xs border-2 border-primary-500 rounded-playful-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                  >
                    <option value="">{t('steps.filters.area.all') || 'Všechny oblasti'}</option>
                    <option value="none">{t('steps.filters.area.withoutArea') || 'Bez oblasti'}</option>
                    {areas && areas.length > 0 && areas.map((area: any) => (
                      <option key={area.id} value={area.id}>
                        {area.name || t('areas.unnamed')}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Goal Filter */}
                <div className="mb-3">
                  <label className="text-xs font-semibold text-black mb-1.5 block">{t('steps.filters.goal.title') || 'Cíl'}</label>
                  <select
                    value={stepsGoalFilter || ''}
                    onChange={(e) => setStepsGoalFilter(e.target.value || null)}
                    className="w-full px-2 py-1.5 text-xs border-2 border-primary-500 rounded-playful-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                  >
                    <option value="">{t('steps.filters.goal.all')}</option>
                    <option value="none">{t('steps.filters.goal.withoutGoal') || 'Bez cíle'}</option>
                    {goals.map((goal: any) => (
                      <option key={goal.id} value={goal.id}>{goal.title}</option>
                    ))}
                  </select>
                </div>
                
                {/* Date Filter */}
                <div className="mb-3">
                  <label className="text-xs font-semibold text-black mb-1.5 block">{t('steps.filters.date.title') || 'Datum'}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={stepsDateFilter || ''}
                      onChange={(e) => setStepsDateFilter(e.target.value || null)}
                      className="flex-1 px-2 py-1.5 text-xs border-2 border-primary-500 rounded-playful-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                    />
                    {stepsDateFilter && (
                      <button
                        onClick={() => setStepsDateFilter(null)}
                        className="px-2 py-1.5 text-xs text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-playful-sm transition-colors"
                      >
                        {t('common.clear')}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Add button at bottom */}
              <div className="mt-auto p-4 border-t-2 border-primary-500 flex-shrink-0">
                <button
                  onClick={() => setCreateNewStepTrigger(prev => prev + 1)}
                  className="btn-playful-base w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary-600 bg-white hover:bg-primary-50"
                >
                  <Plus className="w-5 h-5" />
                  {t('steps.add')}
                </button>
              </div>
            </div>
            {/* Main Content */}
            <div className="flex-1 overflow-y-auto flex flex-col">
              {/* Mobile hamburger menu */}
              <div className="md:hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">
                    {t('navigation.steps')}
                  </h2>
                  <div className="relative">
                    <button
                      onClick={() => setStepsMobileMenuOpen(!stepsMobileMenuOpen)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Menu"
                    >
                      <Menu className="w-5 h-5 text-gray-700" />
                    </button>
                    
                    {/* Mobile menu dropdown */}
                    {stepsMobileMenuOpen && (
                      <>
                        {/* Backdrop */}
                        <div 
                          className="fixed inset-0 z-[100]" 
                          onClick={() => setStepsMobileMenuOpen(false)}
                        />
                        <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-[101] min-w-[200px] max-h-[80vh] overflow-y-auto">
                          <nav className="py-2">
                            {/* Filters */}
                            <div className="px-4 py-2 border-b border-gray-200">
                              <h3 className="text-xs font-semibold text-gray-700 uppercase mb-2">{t('steps.filters.title') || 'Filtry'}</h3>
                              <div className="space-y-3">
                                {/* Show Completed Checkbox */}
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={stepsShowCompleted}
                                    onChange={(e) => setStepsShowCompleted(e.target.checked)}
                                    className="w-4 h-4 text-primary-600 border-2 border-primary-500 rounded-playful-sm focus:ring-primary-500"
                                  />
                                  <span className="text-sm font-medium text-black">{t('steps.filters.showCompleted')}</span>
                                </label>
                                
                                {/* Area Filter */}
                                <div>
                                  <label className="text-xs font-semibold text-black mb-1.5 block">{t('steps.filters.area.title') || 'Oblast'}</label>
                                  <select
                                    value={stepsAreaFilter || ''}
                                    onChange={(e) => setStepsAreaFilter(e.target.value || null)}
                                    className="w-full px-3 py-1.5 text-sm border-2 border-primary-500 rounded-playful-md font-playful focus:ring-2 focus:ring-primary-500 bg-white"
                                  >
                                    <option value="">{t('steps.filters.area.all') || 'Všechny oblasti'}</option>
                                    <option value="none">{t('steps.filters.area.withoutArea') || 'Bez oblasti'}</option>
                                    {areas && areas.length > 0 && areas.map((area: any) => (
                                      <option key={area.id} value={area.id}>
                                        {area.name || t('areas.unnamed')}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                
                                {/* Goal Filter */}
                                <div>
                                  <label className="text-xs font-semibold text-black mb-1.5 block">{t('steps.filters.goal.title') || 'Cíl'}</label>
                                  <select
                                    value={stepsGoalFilter || ''}
                                    onChange={(e) => setStepsGoalFilter(e.target.value || null)}
                                    className="w-full px-2 py-1.5 text-xs border-2 border-primary-500 rounded-playful-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                                  >
                                    <option value="">{t('steps.filters.goal.all')}</option>
                                    <option value="none">{t('steps.filters.goal.withoutGoal') || 'Bez cíle'}</option>
                                    {goals.map((goal: any) => (
                                      <option key={goal.id} value={goal.id}>{goal.title}</option>
                                    ))}
                                  </select>
                                </div>
                                
                                {/* Date Filter */}
                                <div>
                                  <label className="text-xs font-semibold text-black mb-1.5 block">{t('steps.filters.date.title') || 'Datum'}</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="date"
                                      value={stepsDateFilter || ''}
                                      onChange={(e) => setStepsDateFilter(e.target.value || null)}
                                      className="flex-1 px-2 py-1.5 text-xs border-2 border-primary-500 rounded-playful-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                                    />
                                    {stepsDateFilter && (
                                      <button
                                        onClick={() => setStepsDateFilter(null)}
                                        className="px-2 py-1.5 text-xs text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-playful-sm transition-colors"
                                      >
                                        {t('common.clear')}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Add button */}
                            <div className="px-4 py-2">
                              <button
                                onClick={() => {
                                  setCreateNewStepTrigger(prev => prev + 1)
                                  setStepsMobileMenuOpen(false)
                                }}
                                className="btn-playful-base w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary-600 bg-white hover:bg-primary-50"
                              >
                                <Plus className="w-5 h-5" />
                                {t('steps.add')}
                              </button>
                            </div>
                          </nav>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Content area */}
              <div className="flex-1 overflow-y-auto">
              <StepsManagementView
                dailySteps={filteredSteps}
                goals={goals}
                player={player}
                userId={userId}
                onDailyStepsUpdate={onDailyStepsUpdate}
                onStepImportantChange={onStepImportantChange}
                handleStepToggle={handleStepToggle}
                loadingSteps={loadingSteps}
                createNewStepTrigger={createNewStepTrigger}
                onOpenStepModal={handleOpenStepModal}
                hideHeader={true}
                showCompleted={stepsShowCompleted}
                goalFilter={stepsGoalFilter}
                areaFilter={stepsAreaFilter}
                dateFilter={stepsDateFilter}
              />
              </div>
            </div>
          </div>
        )
      }

      default:
        return (
          <>
            {/* Hidden measurement containers */}
            <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', zIndex: -1 }}>
              <div ref={habitsRef} style={{ width: '288px' }}>
                <div className="bg-white bg-opacity-95 rounded-2xl p-6 border border-primary-200 shadow-xl backdrop-blur-sm">
                  <h4 className="text-base font-bold text-primary-800 mb-4">{t('sections.habits')}</h4>
                  <div className="space-y-3">
                    {(() => {
                      const now = new Date()
                      const dayOfWeek = now.getDay()
                      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
                      const visibleHabits = habits.filter((habit: any) => {
                        if (habit.frequency === 'daily') return true
                        if ((habit.frequency === 'custom' || habit.frequency === 'weekly') && habit.selected_days) {
                          return habit.selected_days.includes(dayNames[dayOfWeek])
                        }
                        return false
                      })
                      return visibleHabits.slice(0, 4).map((habit: any) => (
                        <div key={habit.id} className="p-3 rounded-xl border">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="truncate flex-1">{habit.name}</span>
                          </div>
                        </div>
                      ))
                    })()}
                    {habits.filter((h: any) => {
                      const now = new Date()
                      const dayOfWeek = now.getDay()
                      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
                      if (h.frequency === 'daily') return true
                      if ((h.frequency === 'custom' || h.frequency === 'weekly') && h.selected_days) {
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
                <div className="bg-white bg-opacity-95 rounded-2xl p-6 text-gray-800 backdrop-blur-sm border border-primary-200 shadow-xl">
                  <h3 className="text-base font-bold mb-4 text-primary-800">{t('sections.steps')}</h3>
                  <div className="space-y-3">
                    {dailySteps.slice(0, 5).map((step: any) => (
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
                      <DisplayContent
                        selectedItem={selectedItem}
                        selectedItemType={selectedItemType}
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
                        goals={goals}
                        habits={habits}
                        player={player}
                        userId={userId}
                        setSelectedItem={setSelectedItem}
                        onHabitsUpdate={onHabitsUpdate}
                        stepsCacheRef={stepsCacheRef}
                        setStepsCacheVersion={setStepsCacheVersion}
                        completedSteps={completedSteps}
                        activeHabits={activeHabits}
                        completedGoals={completedGoals}
                        progressPercentage={progressPercentage}
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
                  </div>
                    </div>
                  </div>
          </>
        );
      }
      })()}
      
      {/* Delete area confirmation modal - rendered outside switch to be always available */}
      {props.showDeleteAreaModal && (
        <>
          <div 
            className="fixed inset-0 z-[100] bg-black/20" 
            onClick={() => {
              if (props.setShowDeleteAreaModal) {
                props.setShowDeleteAreaModal(false)
              }
              if (props.setAreaToDelete) {
                props.setAreaToDelete(null)
              }
              if (props.setDeleteAreaWithRelated) {
                props.setDeleteAreaWithRelated(false)
              }
            }}
          />
          <div 
            className="fixed z-[101] bg-white border-2 border-gray-200 rounded-xl shadow-2xl p-6"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '400px',
              maxWidth: '90vw'
            }}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {t('areas.deleteConfirm') || 'Opravdu chcete smazat tuto oblast?'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {t('areas.deleteConfirmDescription') || 'Cíle, kroky a návyky přiřazené k této oblasti budou odpojeny. Tato akce je nevratná.'}
            </p>
            
            {/* Checkbox for deleting related items */}
            <label className="flex items-center gap-2 mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={props.deleteAreaWithRelated || false}
                onChange={(e) => {
                  if (props.setDeleteAreaWithRelated) {
                    props.setDeleteAreaWithRelated(e.target.checked)
                  }
                }}
                className="w-4 h-4 text-primary-600 border-2 border-primary-500 rounded-playful-sm focus:ring-primary-500"
              />
              <span className="text-sm text-black font-playful">
                {t('areas.deleteWithRelated') || 'Odstranit i cíle, kroky a návyky přiřazené k této oblasti'}
              </span>
            </label>
            
            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  if (props.setShowDeleteAreaModal) {
                    props.setShowDeleteAreaModal(false)
                  }
                  if (props.setAreaToDelete) {
                    props.setAreaToDelete(null)
                  }
                }}
                disabled={props.isDeletingArea}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('common.cancel') || 'Zrušit'}
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  // Call with undefined to use fallback values from JourneyGameView
                  handleDeleteAreaConfirm(undefined, undefined)
                }}
                disabled={props.isDeletingArea}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {props.isDeletingArea ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('common.saving') || 'Mažu...'}
                  </>
                ) : (
                  t('areas.delete') || 'Smazat'
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Step Modal */}
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
            goalId: '',
            estimated_time: 30,
            is_important: false,
            checklist: []
          })
        }}
        onSave={async () => {
          if (handleSaveStep) {
            await handleSaveStep(stepModalData)
          }
          setShowStepModal(false)
        }}
        onDelete={stepModalData.id ? async () => {
          // This will be handled by the parent component
          setShowStepModal(false)
        } : undefined}
        isSaving={false}
        goals={goals}
        areas={areas}
        userSettings={null}
        setStepModalData={setStepModalData}
      />
          </>
        )
}
