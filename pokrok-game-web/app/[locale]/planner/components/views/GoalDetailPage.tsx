'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations, useLocale } from 'next-intl'
import { ChevronLeft, Target, CheckCircle, Trash2, Search, Check, Plus, Edit, Pencil, AlertCircle, Calendar, AlertTriangle, Pause, Play, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Moon } from 'lucide-react'
import { getIconComponent, AVAILABLE_ICONS } from '@/lib/icon-utils'
import { StepsManagementView } from './StepsManagementView'
import { getLocalDateString } from '../utils/dateHelpers'

interface GoalDetailPageProps {
  goals: any[]
  goalId: string
  areas: any[]
  dailySteps: any[]
  stepsCacheRef: React.MutableRefObject<Record<string, { data: any[], loaded: boolean }>>
  stepsCacheVersion: Record<string, number>
  animatingSteps: Set<string>
  loadingSteps: Set<string>
  handleItemClick: (item: any, type: string) => void
  handleStepToggle: (stepId: string, completed: boolean) => Promise<void>
  handleUpdateGoalForDetail: (goalId: string, updates: any) => Promise<void>
  handleDeleteGoalForDetail: (goalId: string, deleteWithSteps: boolean) => Promise<void>
  setMainPanelSection: (section: string) => void
  localeCode: string
  selectedDayDate?: Date
  setSelectedDayDate?: (date: Date) => void
  setStepModalData?: (data: any) => void
  setShowStepModal?: (show: boolean) => void
  // Goal detail editing states
  goalDetailTitleValue: string
  setGoalDetailTitleValue: (value: string) => void
  editingGoalDetailTitle: boolean
  setEditingGoalDetailTitle: (editing: boolean) => void
  goalDetailDescriptionValue: string
  setGoalDetailDescriptionValue: (value: string) => void
  editingGoalDetailDescription: boolean
  setEditingGoalDetailDescription: (editing: boolean) => void
  // Date picker
  showGoalDetailDatePicker: boolean
  setShowGoalDetailDatePicker: (show: boolean) => void
  goalDetailDatePickerPosition: { top: number; left: number } | null
  setGoalDetailDatePickerPosition: (pos: { top: number; left: number } | null) => void
  goalDetailDatePickerMonth: Date
  setGoalDetailDatePickerMonth: (month: Date) => void
  selectedGoalDate: Date | null
  setSelectedGoalDate: (date: Date | null) => void
  // Start date picker
  showGoalDetailStartDatePicker: boolean
  setShowGoalDetailStartDatePicker: (show: boolean) => void
  goalDetailStartDatePickerPosition: { top: number; left: number } | null
  setGoalDetailStartDatePickerPosition: (pos: { top: number; left: number } | null) => void
  goalDetailStartDatePickerMonth: Date
  setGoalDetailStartDatePickerMonth: (month: Date) => void
  selectedGoalStartDate: Date | null
  setSelectedGoalStartDate: (date: Date | null) => void
  // Status picker
  showGoalDetailStatusPicker: boolean
  setShowGoalDetailStatusPicker: (show: boolean) => void
  goalDetailStatusPickerPosition: { top: number; left: number } | null
  setGoalDetailStatusPickerPosition: (pos: { top: number; left: number } | null) => void
  // Area picker
  showGoalDetailAreaPicker: boolean
  setShowGoalDetailAreaPicker: (show: boolean) => void
  goalDetailAreaPickerPosition: { top: number; left: number } | null
  setGoalDetailAreaPickerPosition: (pos: { top: number; left: number } | null) => void
  // Icon picker
  showGoalDetailIconPicker: boolean
  setShowGoalDetailIconPicker: (show: boolean) => void
  goalDetailIconPickerPosition: { top: number; left: number } | null
  setGoalDetailIconPickerPosition: (pos: { top: number; left: number } | null) => void
  iconSearchQuery?: string
  setIconSearchQuery?: (query: string) => void
  // Delete modal
  showDeleteGoalModal: boolean
  setShowDeleteGoalModal: (show: boolean) => void
  deleteGoalWithSteps: boolean
  setDeleteGoalWithSteps: (withSteps: boolean) => void
  isDeletingGoal: boolean
  setIsDeletingGoal: (deleting: boolean) => void
  // Refs
  goalIconRef: React.RefObject<HTMLSpanElement>
  goalTitleRef: React.RefObject<HTMLInputElement | HTMLHeadingElement>
  goalDescriptionRef: React.RefObject<HTMLTextAreaElement | HTMLParagraphElement>
  goalDateRef: React.RefObject<HTMLButtonElement>
  goalStartDateRef: React.RefObject<HTMLDivElement>
  goalStatusRef: React.RefObject<HTMLDivElement>
  goalAreaRef: React.RefObject<HTMLButtonElement>
  selectedYear?: number
  setSelectedYear?: (year: number) => void
  visibleSections?: string[]
  setShowDatePickerModal?: (show: boolean) => void
  setSelectedItemType?: (type: 'step' | 'habit' | 'goal' | 'stat' | null) => void
  onOpenStepModal?: (date?: string, step?: any) => void
  userId?: string | null
  player?: any
  createNewStepTrigger?: number
  setCreateNewStepTrigger?: (fn: (prev: number) => number) => void
  onNewStepCreated?: () => void
  // Optional variables that may not be passed
  mobileMenuOpen?: boolean
  setMobileMenuOpen?: (open: boolean) => void
  selectedHabitId?: string
  habitTimelineOffsets?: Record<string, number>
  setHabitTimelineOffsets?: (offsets: Record<string, number>) => void
  habitDetailVisibleDays?: number
  habitDetailTimelineContainerRef?: React.RefObject<HTMLDivElement>
  habitsPageTimelineOffset?: number
  setHabitsPageTimelineOffset?: (offset: number) => void
  habitsPageVisibleDays?: number
  setHabitsPageVisibleDays?: (days: number) => void
  selectedDateForGoal?: Date
  setSelectedDateForGoal?: (date: Date) => void
  quickEditGoalId?: string
  setQuickEditGoalId?: (id: string | null) => void
  quickEditGoalField?: string
  setQuickEditGoalField?: (field: string | null) => void
  quickEditGoalPosition?: { top: number; left: number }
  setQuickEditGoalPosition?: (pos: { top: number; left: number } | null) => void
  handleDeleteAreaConfirm?: (areaToDelete?: any) => void
  onGoalsUpdate?: (goals: any[]) => void
  onDailyStepsUpdate?: (steps: any[]) => void
  handleStepDateChange?: (stepId: string, date: string) => Promise<void>
  handleStepTimeChange?: (stepId: string, minutes: number) => Promise<void>
  sidebarCollapsed?: boolean
  setSidebarCollapsed?: (collapsed: boolean) => void
  showCreateMenu?: boolean
  setShowCreateMenu?: (show: boolean) => void
  createMenuButtonRef?: React.RefObject<HTMLButtonElement>
  areaColorRef?: React.RefObject<HTMLDivElement>
}

export function GoalDetailPage({
  goals,
  goalId,
  areas,
  dailySteps,
  handleItemClick,
  handleStepToggle,
  handleUpdateGoalForDetail,
  handleDeleteGoalForDetail,
  setMainPanelSection,
  localeCode,
  selectedDayDate = new Date(),
  setStepModalData = () => {},
  setShowStepModal = () => {},
  onOpenStepModal,
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
  iconSearchQuery = '',
  setIconSearchQuery = () => {},
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
  selectedDayDate: selectedDayDateProp,
  setSelectedDayDate: setSelectedDayDateProp,
  selectedYear = new Date().getFullYear(),
  setSelectedYear = () => {},
  visibleSections,
  setShowDatePickerModal = () => {},
  setSelectedItemType = () => {},
  onDailyStepsUpdate,
  handleStepDateChange,
  handleStepTimeChange,
  sidebarCollapsed,
  setSidebarCollapsed,
  showCreateMenu,
  setShowCreateMenu,
  createMenuButtonRef,
  areaColorRef,
  createNewStepTrigger,
  setCreateNewStepTrigger,
  onNewStepCreated,
  userId,
  player
}: GoalDetailPageProps) {
  const t = useTranslations()
  const locale = useLocale()
  
  // Find the goal from goals array
  const goal = goals.find(g => g.id === goalId)
  
  // Local steps state for immediate UI updates (e.g., trend after toggling a step)
  const [localDailySteps, setLocalDailySteps] = useState<any[]>(dailySteps || [])
  useEffect(() => {
    setLocalDailySteps(dailySteps || [])
  }, [dailySteps])

  const handleLocalDailyStepsUpdate = useCallback((steps: any[]) => {
    const incomingSteps = Array.isArray(steps) ? steps : []
    const allSteps = Array.isArray(dailySteps) ? dailySteps : []
    const currentGoalId = goalId?.toString()
    const mergedSteps = [
      ...allSteps.filter((step) => step?.goal_id?.toString() !== currentGoalId),
      ...incomingSteps
    ]
    setLocalDailySteps(mergedSteps)
    if (onDailyStepsUpdate) {
      onDailyStepsUpdate(mergedSteps)
    }
  }, [dailySteps, goalId, onDailyStepsUpdate])

  // State for date picker
  const [datePickerMonth, setDatePickerMonth] = useState(() => {
    return goal?.target_date ? new Date(goal.target_date) : new Date()
  })
  const [selectedDateForPicker, setSelectedDateForPicker] = useState<Date | null>(() => {
    return goal?.target_date ? new Date(goal.target_date) : null
  })
  if (!goal) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-gray-500">Cíl nebyl nalezen</span>
      </div>
    )
  }
  
  // Helper function to calculate dropdown position (centered under button, adjusted if needed)
  const calculateDropdownPosition = (rect: DOMRect, dropdownWidth: number = 200): { top: number; left: number } => {
    const padding = 10
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : rect.right

    // Center under button in viewport coordinates
    let left = rect.left + rect.width / 2 - dropdownWidth / 2

    if (left < padding) {
      left = padding
    }
    if (left + dropdownWidth > viewportWidth - padding) {
      left = viewportWidth - padding - dropdownWidth
    }

    return {
      top: rect.bottom + 5,
      left
    }
  }
  
  // Helper function to check if goal is past deadline
  const isGoalPastDeadline = (goal: any): boolean => {
    if (!goal || !goal.target_date) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const deadline = new Date(goal.target_date)
    deadline.setHours(0, 0, 0, 0)
    return deadline < today && goal.status === 'active'
  }
  
  // Calculate trend based on overdue vs completed steps in last 7 days (including today)
  const { trendValue, completedSteps7Days, overdueSteps7Days, completedPercentage, trendChange } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    // 7 days including today = 6 days ago + today
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    sevenDaysAgo.setHours(0, 0, 0, 0)
    
    // Previous 7 days period (days 7-14 ago)
    const fourteenDaysAgo = new Date(today)
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13)
    fourteenDaysAgo.setHours(0, 0, 0, 0)

    // Filter steps for this goal (handle both string and number IDs)
    const goalSteps = localDailySteps.filter(step => {
      const stepGoalId = step.goal_id?.toString()
      const currentGoalId = goalId?.toString()
      const matches = stepGoalId === currentGoalId
      return matches
    })

    // Helper function to parse date safely - handles multiple formats
    const parseStepDate = (dateValue: any): Date | null => {
      if (!dateValue) return null
      try {
        // If it's already a Date object
        if (dateValue instanceof Date) {
          const date = new Date(dateValue)
          if (isNaN(date.getTime())) return null
          date.setHours(0, 0, 0, 0)
          return date
        }
        
        // If it's a string, try to parse it
        if (typeof dateValue === 'string') {
          // Try ISO format first (most common)
          let date = new Date(dateValue)
          
          // If that fails, try parsing Czech format "DD. MM. YYYY" or "D. M. YYYY"
          if (isNaN(date.getTime())) {
            // Try Czech format: "10. 1. 2026" or "10.1.2026"
            const czechFormatMatch = dateValue.match(/(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/)
            if (czechFormatMatch) {
              const [, day, month, year] = czechFormatMatch
              date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
            }
          }
          
          if (isNaN(date.getTime())) return null
          date.setHours(0, 0, 0, 0)
          return date
        }
        
        // Try direct conversion
        const date = new Date(dateValue)
        if (isNaN(date.getTime())) return null
        date.setHours(0, 0, 0, 0)
        return date
      } catch (e) {
        return null
      }
    }

    // Filter steps from last 7 days (including today)
    // Use step.date or step.current_instance_date for recurring steps
    const recentSteps = goalSteps.filter(step => {
      const stepDateValue = step.current_instance_date || step.date || step.scheduled_date
      const stepDate = parseStepDate(stepDateValue)
      if (!stepDate) return false
      return stepDate >= sevenDaysAgo && stepDate <= today
    })

    // Filter steps from previous 7 days (days 7-14 ago)
    const previousSteps = goalSteps.filter(step => {
      const stepDateValue = step.current_instance_date || step.date || step.scheduled_date
      const stepDate = parseStepDate(stepDateValue)
      if (!stepDate) return false
      return stepDate >= fourteenDaysAgo && stepDate < sevenDaysAgo
    })

    // Count completed steps in last 7 days
    const completed = recentSteps.filter(step => step.completed).length

    // Count overdue steps (scheduled before today but not completed)
    const overdue = recentSteps.filter(step => {
      const stepDateValue = step.current_instance_date || step.date || step.scheduled_date
      const stepDate = parseStepDate(stepDateValue)
      if (!stepDate) return false
      return stepDate < today && !step.completed
    }).length

    // Count completed steps in previous 7 days
    const previousCompleted = previousSteps.filter(step => step.completed).length

    // Count overdue steps in previous 7 days
    const previousOverdue = previousSteps.filter(step => {
      const stepDateValue = step.current_instance_date || step.date || step.scheduled_date
      const stepDate = parseStepDate(stepDateValue)
      if (!stepDate) return false
      const previousPeriodEnd = new Date(sevenDaysAgo)
      previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1)
      previousPeriodEnd.setHours(0, 0, 0, 0)
      return stepDate < previousPeriodEnd && !step.completed
    }).length

    // Calculate position based on ratio of overdue vs completed
    // - 0 overdue, 0 completed → 50% (center)
    // - Only overdue (overdue > 0, completed = 0) → 0% (far left)
    // - Only completed (completed > 0, overdue = 0) → 100% (far right)
    // - Otherwise: completed / (completed + overdue) * 100
    let position: number
    if (completed === 0 && overdue === 0) {
      position = 50 // Center when no data
    } else if (completed === 0 && overdue > 0) {
      position = 0 // Far left when only overdue
    } else if (overdue === 0 && completed > 0) {
      position = 100 // Far right when only completed
        } else {
      // Ratio: completed / (completed + overdue) * 100
      position = (completed / (completed + overdue)) * 100
    }

    // Calculate previous period position
    let previousPosition: number
    const previousTotal = previousCompleted + previousOverdue
    if (previousCompleted === 0 && previousOverdue === 0) {
      previousPosition = 50
    } else if (previousCompleted === 0 && previousOverdue > 0) {
      previousPosition = 0
    } else if (previousOverdue === 0 && previousCompleted > 0) {
      previousPosition = 100
        } else {
      previousPosition = (previousCompleted / previousTotal) * 100
    }

    // Calculate trend change: improvement or decline compared to previous 7 days
    // Positive = improvement (position increased), Negative = decline (position decreased)
    const positionChange = position - previousPosition
    const trendChangePercent = previousPosition !== 0 ? (positionChange / previousPosition) * 100 : (positionChange > 0 ? 100 : positionChange < 0 ? -100 : 0)

    // Trend value for display: (completed - overdue) / total * 100
    const total = completed + overdue
    const trend = total > 0 ? ((completed - overdue) / total) * 100 : 0

    // Debug log - enhanced to help diagnose the issue
    const sampleGoalSteps = goalSteps.slice(0, 10).map(s => {
      const stepDateValue = s.current_instance_date || s.date || s.scheduled_date
      const stepDate = parseStepDate(stepDateValue)
      const isInRange = stepDate ? stepDate >= sevenDaysAgo && stepDate <= today : false
      return {
        id: s.id,
        title: s.title || s.name,
        date: s.date,
        current_instance_date: s.current_instance_date,
        scheduled_date: s.scheduled_date,
        dateValue: stepDateValue,
        date_parsed: stepDate ? stepDate.toISOString().split('T')[0] : 'INVALID',
        completed: s.completed,
        goal_id: s.goal_id,
        goal_id_type: typeof s.goal_id,
        isInLast7Days: isInRange,
        isOverdue: stepDate ? stepDate < today && !s.completed : false
      }
    })
    
    return {
      trendValue: trend,
      completedSteps7Days: completed,
      overdueSteps7Days: overdue,
      completedPercentage: position,
      trendChange: trendChangePercent
    }
  }, [localDailySteps, goalId])

  // Legacy progress for backward compatibility (total completion)
  const { totalSteps, completedSteps } = useMemo(() => {
    const goalSteps = localDailySteps.filter(step => {
      const stepGoalId = step.goal_id?.toString()
      const currentGoalId = goalId?.toString()
      return stepGoalId === currentGoalId
    })
    const total = goalSteps.length
    const completed = goalSteps.filter(step => step.completed).length
    return { totalSteps: total, completedSteps: completed }
  }, [localDailySteps, goalId])

  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

  // Filter steps for this goal
  const goalSteps = useMemo(() => {
    return localDailySteps.filter(step => {
      const stepGoalId = step.goal_id?.toString()
      const currentGoalId = goalId?.toString()
      return stepGoalId === currentGoalId
    })
  }, [localDailySteps, goalId])

  return (
    <div className="w-full h-full flex flex-col bg-background">
      {/* Mobile header */}
      <div className="md:hidden sticky top-0 z-10 bg-white border-b-2 border-primary-500 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
          <button
              onClick={() => setMainPanelSection('goals')}
              className="flex items-center justify-center w-8 h-8 text-gray-600 hover:bg-gray-100 rounded-playful-sm transition-colors"
          >
              <ChevronLeft className="w-5 h-5" />
          </button>
            <span className="text-sm font-medium text-gray-900">
              {t('common.back') || 'Zpět'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Goal detail content */}
      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
        <div className="p-6 relative">
          {/* Goal header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
              <div className="flex items-center gap-3 flex-wrap flex-1 min-w-0">
                {(() => {
                  const IconComponent = getIconComponent(goal.icon)
                  const isPastDeadline = isGoalPastDeadline(goal)
                  return (
                    <>
                <span 
                  ref={goalIconRef}
                  onClick={(e) => {
                    e.stopPropagation()
                    const rect = e.currentTarget.getBoundingClientRect()
                    const position = calculateDropdownPosition(rect, 300)
                    setGoalDetailIconPickerPosition(position)
                      setShowGoalDetailIconPicker(true)
                  }}
                        className={`flex items-center justify-center w-10 h-10 rounded-playful-md cursor-pointer hover:opacity-70 transition-opacity ${
                          isPastDeadline ? 'bg-red-100' : 'bg-primary-100'
                        }`}
                      >
                        <IconComponent className={`w-5 h-5 ${
                          isPastDeadline ? 'text-red-600' : 'text-primary-600'
                        }`} />
                </span>
                      <div className="flex-1 min-w-0">
                {editingGoalDetailTitle ? (
                  <input
                    ref={goalTitleRef as React.RefObject<HTMLInputElement>}
                    type="text"
                    value={goalDetailTitleValue}
                    onChange={(e) => setGoalDetailTitleValue(e.target.value)}
                            onBlur={async () => {
                              if (goalDetailTitleValue.trim() !== goal.title) {
                                await handleUpdateGoalForDetail(goalId, { title: goalDetailTitleValue.trim() })
                              }
                              setEditingGoalDetailTitle(false)
                            }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                                e.currentTarget.blur()
                      } else if (e.key === 'Escape') {
                        setGoalDetailTitleValue(goal.title)
                        setEditingGoalDetailTitle(false)
                      }
                    }}
                            className="w-full px-2 py-1 text-lg font-bold text-black border border-gray-300 rounded-playful-sm focus:outline-none focus:border-primary-500 font-playful"
                    autoFocus
                  />
                ) : (
                          <h1
                            ref={goalTitleRef}
                            onClick={() => {
                              setGoalDetailTitleValue(goal.title)
                              setEditingGoalDetailTitle(true)
                            }}
                            className="text-lg font-bold text-black cursor-pointer hover:text-primary-600 transition-colors font-playful"
                    >
                      {goal.title}
                    </h1>
                        )}
                  </div>

                      {/* Goal metadata in header */}
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {/* Date button - always visible */}
                        <button
                  ref={goalDateRef}
                          onClick={(e) => {
                            e.stopPropagation()
                            const rect = e.currentTarget.getBoundingClientRect()
                            const position = calculateDropdownPosition(rect, 230)
                            const currentDate = goal.target_date ? new Date(goal.target_date) : new Date()
                            setDatePickerMonth(new Date(currentDate))
                            setSelectedDateForPicker(currentDate)
                            setGoalDetailDatePickerPosition(position)
                            setShowGoalDetailDatePicker(true)
                          }}
                          className={`inline-flex h-10 items-center gap-2.5 px-4 py-2 rounded-full text-sm font-semibold font-playful border-2 transition-all bg-white cursor-pointer ${
                            isPastDeadline
                              ? 'border-red-500 text-red-600 hover:bg-red-50'
                              : 'border-primary-500 text-primary-600 hover:bg-primary-50'
                          }`}
                          style={{ boxShadow: '3px 3px 0 0 currentColor' }}
                        >
                          {goal.target_date ? (
                            <>
                              <span className={isPastDeadline ? 'text-red-600 font-medium' : ''}>
                                {isPastDeadline
                                  ? (t('goals.deadlineMissed') || 'Nesplněný termín')
                                  : new Date(goal.target_date).toLocaleDateString(localeCode)}
                </span>
                    </>
                  ) : (
                            <span className="text-gray-400 italic">
                              {t('goals.targetDate') || 'Termín'}
                      </span>
                  )}
                          <ChevronDown className="w-4 h-4 opacity-70" />
                </button>
                        
                        {/* Area button - always visible */}
                        {(() => {
                          const area = goal.area_id ? areas.find(a => a.id === goal.area_id) : null
                          const AreaIconComponent = area ? getIconComponent(area.icon || 'LayoutDashboard') : getIconComponent('LayoutDashboard')
                          const areaColor = area ? (area.color || '#ea580c') : '#9ca3af'
                          return (
                <button
                  ref={goalAreaRef}
                  onClick={(e) => {
                    e.stopPropagation()
                                const rect = e.currentTarget.getBoundingClientRect()
                                const position = calculateDropdownPosition(rect, 200)
                                setGoalDetailAreaPickerPosition(position)
                      setShowGoalDetailAreaPicker(true)
                              }}
                              className="inline-flex h-10 items-center gap-2.5 px-4 py-2 rounded-full text-sm font-semibold font-playful border-2 transition-all bg-white cursor-pointer"
                              style={{
                      borderColor: areaColor,
                      color: areaColor,
                      boxShadow: `3px 3px 0 0 ${areaColor}`
                              }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${areaColor}20`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white'
                  }}
                >
                              <AreaIconComponent className="w-4 h-4" style={{ color: areaColor }} />
                              <span className={!area ? 'text-gray-400 italic' : ''}>
                                {area ? area.name : (t('common.area') || 'Oblast')}
                      </span>
                              <ChevronDown className="w-4 h-4 opacity-70" />
                </button>
                          )
                        })()}
                        {/* Status indicator */}
                <div
                  ref={goalStatusRef}
                          className="inline-flex h-10 items-center gap-2.5 px-4 py-2 rounded-full text-sm font-semibold font-playful border-2 cursor-pointer transition-all bg-white"
                          style={(() => {
                            const statusColor = goal.status === 'completed'
                              ? '#22c55e'
                              : goal.status === 'paused'
                              ? '#eab308'
                              : '#7c3aed'
                            return {
                              borderColor: statusColor,
                              color: statusColor,
                              boxShadow: `3px 3px 0 0 ${statusColor}`,
                              backgroundColor: `${statusColor}14`
                            }
                          })()}
                  onClick={(e) => {
                    e.stopPropagation()
                    const rect = e.currentTarget.getBoundingClientRect()
                    const position = calculateDropdownPosition(rect, 180)
                    setGoalDetailStatusPickerPosition(position)
                      setShowGoalDetailStatusPicker(true)
                  }}
                  onMouseEnter={(e) => {
                    const statusColor = goal.status === 'completed'
                      ? '#22c55e'
                      : goal.status === 'paused'
                      ? '#eab308'
                      : '#7c3aed'
                    e.currentTarget.style.backgroundColor = `${statusColor}22`
                  }}
                  onMouseLeave={(e) => {
                    const statusColor = goal.status === 'completed'
                      ? '#22c55e'
                      : goal.status === 'paused'
                      ? '#eab308'
                      : '#7c3aed'
                    e.currentTarget.style.backgroundColor = `${statusColor}14`
                  }}
                >
                  {goal.status === 'active' ? (
                    <Target className="w-4 h-4" />
                          ) : (
                            <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-current bg-white">
                              {goal.status === 'completed' && <CheckCircle className="w-3.5 h-3.5" />}
                              {goal.status === 'paused' && <Pause className="w-3.5 h-3.5" />}
                            </span>
                          )}
                          <span>
                            {goal.status === 'completed' ? (t('common.completed') || 'Dokončeno') :
                             goal.status === 'paused' ? (t('common.paused') || 'Pozastaveno') :
                             (t('common.active') || 'Aktivní')}
                  </span>
                          <ChevronDown className="w-4 h-4 opacity-70" />
              </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDeleteGoalModal(true)
                  }}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all bg-white"
                          style={{
                            borderColor: '#ef4444',
                            color: '#ef4444',
                            boxShadow: '3px 3px 0 0 #ef4444'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#ef444420'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'white'
                          }}
                          title={t('common.delete') || 'Smazat'}
                        >
                          <Trash2 className="w-5 h-5" />
                </button>
              </div>
                    </>
                  )
                })()}
            </div>
              </div>
            </div>

            {/* Goal description */}
            <div className="mb-4">
            {editingGoalDetailDescription ? (
              <textarea
                ref={goalDescriptionRef as React.RefObject<HTMLTextAreaElement>}
                value={goalDetailDescriptionValue}
                onChange={(e) => setGoalDetailDescriptionValue(e.target.value)}
                  onBlur={async () => {
                    if (goalDetailDescriptionValue.trim() !== (goal.description || '')) {
                      await handleUpdateGoalForDetail(goalId, { description: goalDetailDescriptionValue.trim() })
                    }
                    setEditingGoalDetailDescription(false)
                  }}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    if (goalDetailDescriptionValue.trim() !== (goal.description || '')) {
                      await handleUpdateGoalForDetail(goalId, { description: goalDetailDescriptionValue.trim() })
                    }
                    setEditingGoalDetailDescription(false)
                  } else if (e.key === 'Escape') {
                    setGoalDetailDescriptionValue(goal.description || '')
                    setEditingGoalDetailDescription(false)
                  }
                }}
                  className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-playful-sm focus:outline-none focus:border-primary-500 resize-none font-playful"
                rows={3}
                  placeholder={t('goals.description') || 'Popis cíle...'}
                autoFocus
              />
            ) : (
                <p 
                  ref={goalDescriptionRef as React.RefObject<HTMLParagraphElement>}
                  onClick={() => {
                    setGoalDetailDescriptionValue(goal.description || '')
                    setEditingGoalDetailDescription(true)
                  }}
                  className="text-sm text-gray-700 cursor-pointer hover:text-primary-600 transition-colors font-playful"
                >
                  {goal.description || (t('goals.noDescription') || 'Žádný popis')}
                </p>
              )}
              </div>
              
          {/* Trend indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700 font-playful">
                {t('goals.trend') || 'Trend posledních 7 dní'}
                        </span>
              <div className="flex items-center gap-1">
                {trendChange !== undefined && !isNaN(trendChange) && (
                  <>
                    {trendChange > 0 ? (
                      <TrendingUp className={`w-4 h-4 text-green-600`} />
                    ) : trendChange < 0 ? (
                      <TrendingDown className={`w-4 h-4 text-red-600`} />
                    ) : null}
                    <span className={`text-sm font-bold font-playful ${
                      trendChange > 0 ? 'text-green-600' :
                      trendChange < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {trendChange > 0 ? '+' : ''}{Math.round(trendChange)}%
                          </span>
                  </>
                        )}
                      </div>
                                  </div>
            
            {/* Modern trend scale with slider - simple line with circle */}
            <div className="relative">
              {/* Scale line */}
              <div className="w-full h-1 bg-gray-200 rounded-full relative">
                {/* Colored line based on position */}
                <div 
                  className="absolute top-0 left-0 h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${completedPercentage}%`,
                    background: completedPercentage > 66 
                      ? '#10b981' // Green for mostly completed
                      : completedPercentage > 33
                        ? '#fbbf24' // Yellow for balanced
                        : '#ef4444' // Red for mostly overdue
                  }}
                />
                
                {/* Slider circle */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-primary-600 rounded-full shadow-md transition-all duration-300 z-10"
                  style={{ 
                    left: `calc(${completedPercentage}% - 8px)`,
                    transform: 'translateY(-50%)'
                  }}
                />
                  </div>
                  
              {/* Scale labels */}
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <span>∞</span>
                <span>-</span>
                <span>-∞</span>
                        </div>
                      </div>
                      
            {/* Stats */}
            <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
              <span>{t('goals.trendStats', {
                completed: completedSteps7Days,
                overdue: overdueSteps7Days
              }) || `${completedSteps7Days} dokončeno, ${overdueSteps7Days} zpožděno`}</span>
                        </div>
                      </div>
                      
          {/* Steps section */}
              <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-black font-playful">
                {t('goals.steps') || 'Kroky'}
                    </h2>
                  <button
                onClick={() => {
                  if (setCreateNewStepTrigger) {
                    setCreateNewStepTrigger((current: number) => current + 1)
                  } else if (onOpenStepModal) {
                    onOpenStepModal(selectedDayDate.toISOString().split('T')[0])
                      } else {
                    setStepModalData({
                      id: null,
                      title: '',
                      description: '',
                      goal_id: goalId,
                      scheduled_date: selectedDayDate.toISOString().split('T')[0],
                      estimated_time: 30,
                      is_important: false,
                      checklist: []
                    })
                    setShowStepModal(true)
                      }
                    }}
                    className="flex items-center justify-center w-8 h-8 text-primary-600 hover:bg-primary-50 rounded-playful-sm transition-colors"
                    title={t('steps.add') || 'Přidat krok'}
                  >
                    <Plus className="w-5 h-5" strokeWidth={2.5} />
                  </button>
                </div>
                
            {/* Steps using StepsManagementView - same as feed */}
                  <StepsManagementView
                  dailySteps={dailySteps}
                  goals={goals}
              goalFilter={goalId}
                  areas={areas}
                  userId={userId}
                  player={player}
                  onDailyStepsUpdate={handleLocalDailyStepsUpdate}
                  handleStepToggle={handleStepToggle}
                  onOpenStepModal={(step) => {
                    if (step) {
                      handleItemClick(step, 'step')
                } else {
                  setStepModalData({
                    id: null,
                    title: '',
                    description: '',
                    goal_id: goalId,
                    scheduled_date: selectedDayDate.toISOString().split('T')[0],
                    estimated_time: 30,
                    is_important: false,
                    checklist: []
                  })
                  setShowStepModal(true)
                }
              }}
                  createNewStepTrigger={createNewStepTrigger}
              onNewStepCreated={onNewStepCreated}
                  hideHeader={true}
              showCompleted={true}
                  />
              </div>
        </div>
      </div>
      
      {/* Date picker modal for goal date */}
      {showGoalDetailDatePicker && goalDetailDatePickerPosition && typeof document !== 'undefined' && createPortal(
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => {
              setShowGoalDetailDatePicker(false)
              setGoalDetailDatePickerPosition(null)
            }}
          />
          <div 
            className="fixed z-50 box-playful-highlight p-4 bg-white"
            style={{ 
              top: `${goalDetailDatePickerPosition.top}px`,
              left: `${goalDetailDatePickerPosition.left}px`,
              width: '230px'
            }}
          >
            <div className="text-sm font-bold text-black mb-3 font-playful">{t('goals.targetDate') || 'Termín'}</div>
            
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
                const selectedDateValue = selectedDateForPicker ? new Date(selectedDateForPicker) : null
                if (selectedDateValue) selectedDateValue.setHours(0, 0, 0, 0)
                
                return days.map((day, i) => {
                  if (!day) {
                    return <div key={`empty-${i}`} className="w-7 h-7" />
                  }
                  
                  const isToday = day.getTime() === today.getTime()
                  const isSelected = selectedDateValue && day.getTime() === selectedDateValue.getTime()
                  
                  return (
                    <button
                      key={day.getTime()}
                      onClick={async () => {
                        const newDate = day.toISOString()
                        await handleUpdateGoalForDetail(goalId, { target_date: newDate })
                        setSelectedDateForPicker(day)
                        setShowGoalDetailDatePicker(false)
                        setGoalDetailDatePickerPosition(null)
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
        </>,
        document.body
      )}
      
      {/* Start date picker modal */}
      {showGoalDetailStartDatePicker && goalDetailStartDatePickerPosition && typeof document !== 'undefined' && createPortal(
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowGoalDetailStartDatePicker(false)}
          />
          <div 
            className="fixed z-50 bg-white border border-gray-300 rounded-playful-md shadow-lg p-4"
            style={{ 
              top: goalDetailStartDatePickerPosition.top,
              left: goalDetailStartDatePickerPosition.left
            }}
          >
            {/* Start date picker content would go here */}
            <div className="text-center py-4">
              <span className="text-sm text-gray-600">Start date picker placeholder</span>
            </div>
                    </div>
        </>,
        document.body
      )}
      
      {/* Status picker modal */}
      {showGoalDetailStatusPicker && goalDetailStatusPickerPosition && typeof document !== 'undefined' && createPortal(
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowGoalDetailStatusPicker(false)}
          />
          <div 
            className="fixed z-50 bg-white border-2 border-primary-500 rounded-2xl shadow-[3px_3px_0_0_currentColor] text-primary-500 status-picker"
            style={{
              top: `${goalDetailStatusPickerPosition.top}px`,
              left: `${goalDetailStatusPickerPosition.left}px`,
              minWidth: '200px'
            }}
          >
            <div className="space-y-1 font-playful text-sm font-semibold">
              {[
                { value: 'active', label: t('common.active') || 'Aktivní', icon: Target, color: '#7c3aed' },
                { value: 'paused', label: t('common.paused') || 'Odložený', icon: Moon, color: '#eab308' },
                { value: 'completed', label: t('common.completed') || 'Dokončený', icon: CheckCircle, color: '#22c55e' }
              ].map(({ value, label, icon: Icon, color }) => {
                const isSelected = goal.status === value
                return (
              <button
                    key={value}
                onClick={async () => {
                      await handleUpdateGoalForDetail(goalId, { status: value })
                  setShowGoalDetailStatusPicker(false)
                }}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center gap-3 ${
                      isSelected ? 'font-semibold' : ''
                    }`}
                    style={{
                      color,
                      backgroundColor: isSelected ? `${color}1a` : 'transparent'
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
              </button>
                )
              })}
          </div>
          </div>
        </>,
        document.body
      )}
      
      {/* Area picker modal */}
      {showGoalDetailAreaPicker && goalDetailAreaPickerPosition && typeof document !== 'undefined' && createPortal(
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowGoalDetailAreaPicker(false)}
          />
          <div 
            className="fixed z-50 bg-white border-2 border-primary-500 rounded-2xl shadow-[3px_3px_0_0_currentColor] text-primary-500 p-2 area-picker"
            style={{
              top: `${goalDetailAreaPickerPosition.top}px`,
              left: `${goalDetailAreaPickerPosition.left}px`,
              minWidth: '200px',
              maxWidth: '240px'
            }}
          >
            <div className="space-y-1 max-h-56 overflow-y-auto font-playful text-sm font-semibold">
            <button
                onClick={async (e) => {
                  e.stopPropagation()
                  await handleUpdateGoalForDetail(goalId, { areaId: null })
                  setShowGoalDetailAreaPicker(false)
                }}
                className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${
                  !goal.area_id ? 'bg-gray-100 text-gray-600 font-semibold' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {(() => {
                    const DefaultAreaIcon = getIconComponent('LayoutDashboard')
                    return <DefaultAreaIcon className="w-5 h-5 text-gray-400" />
                  })()}
                  <span className="truncate">Bez oblasti</span>
                </div>
            </button>
              {areas.map((area: any) => {
                const isSelected = area.id === goal.area_id
                const AreaIconComponent = getIconComponent(area.icon || 'LayoutDashboard')
                const areaColor = area.color || '#ea580c'
              return (
                <button
                  key={area.id}
                    onClick={async (e) => {
                      e.stopPropagation()
                      // API expects areaId, not area_id
                      await handleUpdateGoalForDetail(goalId, { areaId: area.id })
                      setShowGoalDetailAreaPicker(false)
                      // Stay on goal detail - the area will update in the button and navigation automatically
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${
                      isSelected
                        ? 'bg-primary-50 text-primary-600 font-semibold'
                        : 'text-black hover:bg-primary-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <AreaIconComponent className="w-5 h-5" style={{ color: isSelected ? '#f97316' : areaColor }} />
                      <span className="truncate">{area.name}</span>
                    </div>
                </button>
              )
            })}
            </div>
          </div>
        </>,
        document.body
      )}
      
      {/* Icon picker modal */}
      {showGoalDetailIconPicker && goalDetailIconPickerPosition && typeof document !== 'undefined' && createPortal(
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowGoalDetailIconPicker(false)}
          />
          <div 
            className="fixed z-50 bg-white border border-gray-300 rounded-playful-md shadow-lg p-4 max-w-sm"
            style={{
              top: goalDetailIconPickerPosition.top,
              left: goalDetailIconPickerPosition.left
            }}
          >
            <div className="mb-3">
                <input
                  type="text"
                  placeholder={t('common.search') || 'Hledat...'}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-playful-sm focus:outline-none focus:border-primary-500"
                />
              </div>
            <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto">
              {AVAILABLE_ICONS.slice(0, 30).map((icon) => {
                    const IconComponent = getIconComponent(icon.name)
                    const isSelected = goal.icon === icon.name
                    return (
                      <button
                        key={icon.name}
                        onClick={async () => {
                          await handleUpdateGoalForDetail(goalId, { icon: icon.name })
                          setShowGoalDetailIconPicker(false)
                        }}
                        className={`flex items-center justify-center w-10 h-10 rounded-playful-sm border-2 transition-colors ${
                          isSelected 
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300'
                        }`}
                        title={icon.label}
                      >
                        <IconComponent className={`w-5 h-5 ${isSelected ? 'text-primary-600' : 'text-gray-600'}`} />
                </button>
              )
            })}
          </div>
            {AVAILABLE_ICONS.length > 30 && (
              <div className="text-center py-2 border-t border-gray-200 mt-2">
                <span className="text-xs text-gray-500">
                  {t('common.showingFirst', { count: 30 }) || `Zobrazeno prvních 30 z ${AVAILABLE_ICONS.length}`}
                </span>
                </div>
              )}
          </div>
        </>,
        document.body
      )}
      
      {/* Delete goal confirmation modal */}
      {showDeleteGoalModal && typeof document !== 'undefined' && createPortal(
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/20" 
            onClick={() => {
              setShowDeleteGoalModal(false)
              setDeleteGoalWithSteps(false)
            }}
          />
          <div 
            className="fixed z-50 bg-white border-2 border-primary-500 rounded-playful-lg shadow-2xl p-6"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '400px',
              maxWidth: '90vw'
            }}
          >
            <h3 className="text-lg font-bold text-black font-playful mb-4">
              {t('goals.deleteConfirm') || 'Opravdu chcete smazat tento cíl?'}
            </h3>
            <p className="text-sm text-gray-600 mb-4 font-playful">
              {t('goals.deleteConfirmDescription') || 'Tato akce je nevratná.'}
            </p>
            
            <label className="flex items-center gap-2 mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={deleteGoalWithSteps}
                onChange={(e) => setDeleteGoalWithSteps(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-2 border-primary-500 rounded-playful-sm focus:ring-primary-500"
              />
              <span className="text-sm text-black font-playful">
                {t('goals.deleteWithSteps') || 'Odstranit i související kroky'}
              </span>
            </label>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteGoalModal(false)
                  setDeleteGoalWithSteps(false)
                }}
                disabled={isDeletingGoal}
                className="btn-playful-base px-4 py-2 text-sm font-medium text-gray-600 bg-white hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={async () => {
                  try {
                    setIsDeletingGoal(true)
                  await handleDeleteGoalForDetail(goalId, deleteGoalWithSteps)
                    setShowDeleteGoalModal(false)
                    setDeleteGoalWithSteps(false)
                  } finally {
                    setIsDeletingGoal(false)
                  }
                }}
                disabled={isDeletingGoal}
                className="btn-playful-danger px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
        </>,
        document.body
      )}
              </div>
  )
}