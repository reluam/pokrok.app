'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { ChevronLeft, ChevronRight, ChevronDown, Target, CheckCircle, Moon, Trash2, Search, Check, Plus, Edit, Pencil, Minus, Repeat, AlertCircle } from 'lucide-react'
import { getIconComponent, AVAILABLE_ICONS } from '@/lib/icon-utils'
import { getLocalDateString, normalizeDate } from '../utils/dateHelpers'
import { MetricModal } from '../modals/MetricModal'
import { groupMetricsByUnits, convertUnit, type GroupedMetric, getUnitsByType, getDefaultCurrencyByLocale, type MetricType } from '@/lib/metric-units'
import { StepsManagementView } from './StepsManagementView'

interface GoalDetailPageProps {
  goal: any
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
  selectedDayDate: Date
  setStepModalData: (data: any) => void
  setShowStepModal: (show: boolean) => void
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
  goalStartDateRef: React.RefObject<HTMLSpanElement>
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
  iconSearchQuery: string
  setIconSearchQuery: (query: string) => void
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
  goalDateRef: React.RefObject<HTMLSpanElement>
  goalStatusRef: React.RefObject<HTMLButtonElement>
  goalAreaRef: React.RefObject<HTMLButtonElement>
  // Metrics
  metrics: any[]
  loadingMetrics: Set<string>
  handleMetricIncrement: (metricId: string, goalId: string) => Promise<void>
  handleMetricCreate: (goalId: string, metricData: any) => Promise<void>
  handleMetricUpdate: (metricId: string, goalId: string, metricData: any) => Promise<void>
  handleMetricDelete: (metricId: string, goalId: string) => Promise<void>
  showMetricModal: boolean
  setShowMetricModal: (show: boolean) => void
  metricModalData: any
  setMetricModalData: (data: any) => void
  editingMetricName: string
  setEditingMetricName: (name: string) => void
  editingMetricType: 'number' | 'currency' | 'percentage' | 'distance' | 'time' | 'weight' | 'custom'
  setEditingMetricType: (type: 'number' | 'currency' | 'percentage' | 'distance' | 'time' | 'weight' | 'custom') => void
  editingMetricCurrentValue: number
  setEditingMetricCurrentValue: (value: number) => void
  editingMetricTargetValue: number
  setEditingMetricTargetValue: (value: number) => void
  editingMetricInitialValue: number
  setEditingMetricInitialValue: (value: number) => void
  editingMetricIncrementalValue: number
  setEditingMetricIncrementalValue: (value: number) => void
  editingMetricUnit: string
  setEditingMetricUnit: (unit: string) => void
  // Steps management props
  goals?: any[]
  userId?: string | null
  player?: any
  onDailyStepsUpdate?: (steps: any[]) => void
  onStepImportantChange?: (stepId: string, isImportant: boolean) => Promise<void>
  createNewStepTrigger?: number
  setCreateNewStepTrigger?: (updater: (prev: number) => number) => void
}

export function GoalDetailPage({
  goal,
  goalId,
  areas,
  dailySteps,
  stepsCacheRef,
  stepsCacheVersion,
  animatingSteps,
  loadingSteps,
  handleItemClick,
  handleStepToggle,
  handleUpdateGoalForDetail,
  handleDeleteGoalForDetail,
  setMainPanelSection,
  localeCode,
  selectedDayDate,
  setStepModalData,
  setShowStepModal,
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
  iconSearchQuery,
  setIconSearchQuery,
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
  // Metrics
  metrics,
  loadingMetrics,
  handleMetricIncrement,
  handleMetricCreate,
  handleMetricUpdate,
  handleMetricDelete,
  showMetricModal,
  setShowMetricModal,
  metricModalData,
  setMetricModalData,
  editingMetricName,
  setEditingMetricName,
  editingMetricType,
  setEditingMetricType,
  editingMetricCurrentValue,
  setEditingMetricCurrentValue,
  editingMetricTargetValue,
  setEditingMetricTargetValue,
  editingMetricInitialValue,
  setEditingMetricInitialValue,
  editingMetricIncrementalValue,
  setEditingMetricIncrementalValue,
  editingMetricUnit,
  setEditingMetricUnit,
  // Steps management props
  goals = [],
  userId,
  player,
  onDailyStepsUpdate,
  onStepImportantChange,
  createNewStepTrigger,
  setCreateNewStepTrigger,
}: GoalDetailPageProps) {
  // State for inline editing of current values
  const [editingCurrentValueForMetric, setEditingCurrentValueForMetric] = React.useState<Record<string, boolean>>({})
  const [editingCurrentValue, setEditingCurrentValue] = React.useState<Record<string, number>>({})
  const [metricsExpanded, setMetricsExpanded] = React.useState(false)
  const [stepsExpanded, setStepsExpanded] = React.useState(true) // Defaultně rozbalené
  const [isProgressExpanded, setIsProgressExpanded] = React.useState(false)
  const [userSettings, setUserSettings] = useState<{ default_currency?: string; weight_unit_preference?: 'kg' | 'lbs' } | null>(null)
  
  // State for inline metric editing (desktop only)
  const [editingMetricId, setEditingMetricId] = React.useState<string | null>(null)
  const [expandedMetricId, setExpandedMetricId] = React.useState<string | null>(null)
  const [editingMetricData, setEditingMetricData] = React.useState<any>(null)
  const [newMetricId, setNewMetricId] = React.useState<string | null>(null)
  const [isMobile, setIsMobile] = React.useState(false)
  
  // State for inline current value editing (additional states)
  const [isEditingCurrentValue, setIsEditingCurrentValue] = React.useState<Record<string, boolean>>({})
  const [originalCurrentValue, setOriginalCurrentValue] = React.useState<Record<string, number>>({})
  
  // Refs for metric containers to detect clicks outside
  const metricRefs = React.useRef<Record<string, HTMLDivElement | null>>({})
  
  // Detect mobile view
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  const t = useTranslations()
  
  // Helper function to check if goal is past deadline
  const isGoalPastDeadline = (goal: any): boolean => {
    if (!goal || !goal.target_date) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const deadline = new Date(goal.target_date)
    deadline.setHours(0, 0, 0, 0)
    return deadline < today && goal.status === 'active'
  }
  
  // Load user settings for metric defaults
  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        const response = await fetch('/api/cesta/user-settings')
        if (response.ok) {
          const data = await response.json()
          setUserSettings({
            default_currency: data.settings?.default_currency,
            weight_unit_preference: data.settings?.weight_unit_preference || 'kg'
          })
        }
      } catch (error) {
        console.error('Error loading user settings:', error)
      }
    }
    loadUserSettings()
  }, [])
  
  // Handle clicks outside metric to close editing
  useEffect(() => {
    if ((!editingMetricId && !expandedMetricId) || isMobile) return
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      
      // Check if the click target or any parent is part of a metric container
      // Use closest to check the entire DOM path
      const metricContainer = target.closest('[data-metric-container="true"]')
      
      if (metricContainer) {
        // Click is inside a metric container - don't close
        return
      }
      
      // Also check using refs as a backup
      const clickedInside = Object.values(metricRefs.current).some(ref => {
        if (!ref) return false
        return ref.contains(target)
      })
      
      if (clickedInside) {
        // Click is inside a metric (via ref check) - don't close
        return
      }
      
      // Click is outside all metric containers - close the metric
      // Get current editing data from state (use latest values)
      const currentEditingData = editingMetricData
      const currentEditingId = editingMetricId || expandedMetricId
      const currentNewMetricId = newMetricId
      
      if (currentEditingData && currentEditingId) {
        // Validate and save if valid, otherwise cancel
        if (validateMetricData(currentEditingData)) {
          handleSaveInlineMetric(currentEditingData)
        } else {
          // Only cancel if it's a new metric (not valid)
          if (currentNewMetricId === currentEditingId) {
            handleCancelInlineMetric()
          }
        }
      } else if (expandedMetricId && !editingMetricId) {
        // If just expanded but not editing, just collapse
        setExpandedMetricId(null)
      }
    }
    
    // Use click event in capture phase to catch clicks before they reach target elements
    // This ensures we can check if click is inside metric before any stopPropagation
    document.addEventListener('click', handleClickOutside, true)
    
    return () => {
      document.removeEventListener('click', handleClickOutside, true)
    }
  }, [editingMetricId, expandedMetricId, editingMetricData, isMobile, newMetricId])

  // Goal detail page - similar to overview but focused on this goal
  // Pass all dailySteps to StepsManagementView and let it filter by goalFilter
  // This ensures new steps appear immediately without needing to refilter
  // Calculate step statistics - filter steps by goal_id for display
  const goalSteps = dailySteps.filter(step => step.goal_id === goalId)

  // Format number helper - formats numbers with thousand separators and removes unnecessary decimals
  const formatNumber = (value: number): string => {
    // Check if the number has meaningful decimal places
    const hasDecimals = value % 1 !== 0
    
    let formatted: string
    if (hasDecimals) {
      // For numbers with decimals, format to 2 decimal places then remove trailing zeros
      formatted = value.toFixed(2).replace(/\.?0+$/, '')
    } else {
      // For whole numbers, use integer format
      formatted = value.toString()
    }
    
    // Add thousand separators (space)
    // Split by decimal point, format integer part, then rejoin
    const parts = formatted.split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    return parts.join('.')
  }
  
  // Helper functions for formatted number input (from MetricModal)
  const formatNumberWithSpaces = (value: number | string): string => {
    if (value === '' || value === null || value === undefined) return ''
    const numStr = typeof value === 'string' ? value.replace(/\s/g, '') : value.toString()
    if (numStr === '' || numStr === '-') return numStr
    const parts = numStr.split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    return parts.join('.')
  }
  
  const parseFormattedNumber = (value: string): number => {
    const cleaned = value.replace(/\s/g, '').replace(',', '.')
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
  }
  
  // Helper to validate metric data
  const validateMetricData = (data: any): boolean => {
    if (!data.name || !data.name.trim()) return false
    if (!data.type) return false
    // Unit is required for all types except 'number' (where it can be empty)
    if (data.type !== 'number' && (!data.unit || !data.unit.trim())) return false
    return true
  }
  
  // Helper to handle metric field change in inline editing
  const handleMetricFieldChange = (field: string, value: any) => {
    if (!editingMetricData) return
    // Use functional updater to ensure we have the latest state
    setEditingMetricData((prev: any) => ({
      ...prev,
      [field]: value
    }))
  }
  
  // Helper to save inline metric (create or update)
  const handleSaveInlineMetric = async (metricData: any) => {
    if (!validateMetricData(metricData)) {
      // Don't save if validation fails
      return
    }
    
    const unitValue = (metricData.type === 'number' && (!metricData.unit || metricData.unit === '')) 
      ? null 
      : metricData.unit || null
    
    if (metricData.id && metricData.id.startsWith('new-metric-')) {
      // Create new metric
      await handleMetricCreate(goalId, {
        name: metricData.name,
        type: metricData.type,
        currentValue: metricData.currentValue || 0,
        targetValue: metricData.targetValue || 0,
        initialValue: metricData.initialValue || 0,
        incrementalValue: metricData.incrementalValue || 1,
        unit: unitValue
      })
      // Reset editing states
      setNewMetricId(null)
      setEditingMetricId(null)
      setExpandedMetricId(null)
      setEditingMetricData(null)
    } else if (metricData.id) {
      // Update existing metric
      await handleMetricUpdate(metricData.id, goalId, {
        name: metricData.name,
        type: metricData.type,
        currentValue: metricData.currentValue || 0,
        targetValue: metricData.targetValue || 0,
        initialValue: metricData.initialValue || 0,
        incrementalValue: metricData.incrementalValue || 1,
        unit: unitValue
      })
      // Reset editing states
      setEditingMetricId(null)
      setExpandedMetricId(null)
      setEditingMetricData(null)
    }
  }
  
  // Helper to cancel inline metric editing
  const handleCancelInlineMetric = () => {
    setNewMetricId(null)
    setEditingMetricId(null)
    setExpandedMetricId(null)
    setEditingMetricData(null)
  }
  
  // Helper to start editing current value inline
  const handleStartEditingCurrentValue = (metricId: string, currentValue: number) => {
    setIsEditingCurrentValue(prev => ({ ...prev, [metricId]: true }))
    setEditingCurrentValue(prev => ({ ...prev, [metricId]: currentValue }))
    setOriginalCurrentValue(prev => ({ ...prev, [metricId]: currentValue }))
  }
  
  // Helper to save current value inline
  const handleSaveCurrentValue = async (metricId: string) => {
    const newValue = editingCurrentValue[metricId]
    if (newValue !== undefined && newValue !== originalCurrentValue[metricId]) {
      // Find the metric to get its goalId
      const metric = metrics?.find((m: any) => m.id === metricId)
      if (metric) {
        await handleMetricUpdate(metricId, goalId, {
          currentValue: newValue
        })
      }
    }
    setIsEditingCurrentValue(prev => {
      const next = { ...prev }
      delete next[metricId]
      return next
    })
    setEditingCurrentValue(prev => {
      const next = { ...prev }
      delete next[metricId]
      return next
    })
    setOriginalCurrentValue(prev => {
      const next = { ...prev }
      delete next[metricId]
      return next
    })
  }
  
  // Helper to cancel current value editing
  const handleCancelCurrentValue = (metricId: string) => {
    setIsEditingCurrentValue(prev => {
      const next = { ...prev }
      delete next[metricId]
      return next
    })
    setEditingCurrentValue(prev => {
      const next = { ...prev }
      delete next[metricId]
      return next
    })
    setOriginalCurrentValue(prev => {
      const next = { ...prev }
      delete next[metricId]
      return next
    })
  }

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
  const completedSteps = goalSteps.filter(step => step.completed).length
  const remainingSteps = totalSteps - completedSteps
  const stepsProgress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

  // Calculate progress locally based on aggregated metrics and steps
  const calculateLocalProgress = React.useMemo(() => {
    if (!metrics || metrics.length === 0) {
      // No metrics, return step progress only
      return totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0
    }
    
    // Separate metrics by direction: increasing (target > initial) vs decreasing (target < initial)
    const increasingMetrics = metrics.filter((m: any) => {
      const target = parseFloat(m.target_value || 0)
      const initial = parseFloat(m.initial_value || 0)
      return target > initial
    })
    
    const decreasingMetrics = metrics.filter((m: any) => {
      const target = parseFloat(m.target_value || 0)
      const initial = parseFloat(m.initial_value || 0)
      return target < initial
    })
    
    const aggregatedProgresses: number[] = []
    
    // Process increasing metrics - aggregate by units
    if (increasingMetrics.length > 0) {
      const groupedIncreasing = groupMetricsByUnits(increasingMetrics)
      groupedIncreasing.forEach((group) => {
        // Ensure values are numbers and handle NaN/undefined
        const totalInitial = parseFloat(String(group.totalInitial || 0))
        const totalTarget = parseFloat(String(group.totalTarget || 0))
        const totalCurrent = parseFloat(String(group.totalCurrent || 0))
        
        const range = totalTarget - totalInitial
        if (isNaN(range) || range === 0) {
          aggregatedProgresses.push(totalCurrent >= totalTarget ? 100 : 0)
        } else {
          const progress = ((totalCurrent - totalInitial) / range) * 100
          if (isNaN(progress) || !isFinite(progress)) {
            aggregatedProgresses.push(0)
          } else {
            aggregatedProgresses.push(Math.min(Math.max(progress, 0), 100))
          }
        }
      })
    }
    
    // Process decreasing metrics - aggregate by units
    if (decreasingMetrics.length > 0) {
      const groupedDecreasing = groupMetricsByUnits(decreasingMetrics)
      groupedDecreasing.forEach((group) => {
        // Ensure values are numbers and handle NaN/undefined
        const totalInitial = parseFloat(String(group.totalInitial || 0))
        const totalTarget = parseFloat(String(group.totalTarget || 0))
        const totalCurrent = parseFloat(String(group.totalCurrent || 0))
        
        const range = totalInitial - totalTarget
        if (isNaN(range) || range === 0) {
          aggregatedProgresses.push(totalCurrent <= totalTarget ? 100 : 0)
        } else {
          const progress = ((totalInitial - totalCurrent) / range) * 100
          if (isNaN(progress) || !isFinite(progress)) {
            aggregatedProgresses.push(0)
          } else {
            aggregatedProgresses.push(Math.min(Math.max(progress, 0), 100))
          }
        }
      })
    }
    
    // Handle metrics where target == initial (neither increasing nor decreasing)
    const neutralMetrics = metrics.filter((m: any) => {
      const target = parseFloat(m.target_value || 0)
      const initial = parseFloat(m.initial_value || 0)
      return target === initial
    })
    
    if (neutralMetrics.length > 0) {
      // Group neutral metrics by units and calculate progress
      const groupedNeutral = groupMetricsByUnits(neutralMetrics)
      groupedNeutral.forEach((group) => {
        // Ensure values are numbers and handle NaN/undefined
        const totalCurrent = parseFloat(String(group.totalCurrent || 0))
        const totalTarget = parseFloat(String(group.totalTarget || 0))
        
        if (isNaN(totalCurrent) || isNaN(totalTarget)) {
          aggregatedProgresses.push(0)
        } else {
          aggregatedProgresses.push(totalCurrent >= totalTarget ? 100 : 0)
        }
      })
    }
    
    // Calculate step progress
    const stepProgress = totalSteps > 0 
      ? (completedSteps / totalSteps) * 100 
      : 0
    
    // Average of aggregated metric groups + steps (steps have same weight as one aggregated group)
    // Only include step progress if there are actual steps (totalSteps > 0)
    const allProgresses = [...aggregatedProgresses]
    if (totalSteps > 0) {
      allProgresses.push(stepProgress)
    }
    
    if (allProgresses.length === 0) return 0
    
    const sum = allProgresses.reduce((acc, p) => acc + p, 0)
    return sum / allProgresses.length
  }, [metrics, totalSteps, completedSteps])

  // Use calculated progress if available, otherwise fall back to goal.progress_percentage
  const displayProgress = calculateLocalProgress !== null && calculateLocalProgress !== undefined 
    ? calculateLocalProgress 
    : (goal.progress_percentage || 0)

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
      const position = { 
        top: Math.min(rect.bottom + 5, window.innerHeight - 380),
        left: Math.min(Math.max(rect.left - 100, 10), window.innerWidth - 250)
      }
      setGoalDetailDatePickerPosition(position)
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

  // Handle start date click
  const handleGoalStartDateClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (goalStartDateRef.current) {
      const rect = goalStartDateRef.current.getBoundingClientRect()
      // Initialize month to current goal start date or today
      const initialDate = goal.start_date ? new Date(goal.start_date) : new Date()
      setGoalDetailStartDatePickerMonth(initialDate)
      setSelectedGoalStartDate(goal.start_date ? new Date(goal.start_date) : null)
      setGoalDetailStartDatePickerPosition({ 
        top: Math.min(rect.bottom + 5, window.innerHeight - 380),
        left: Math.min(Math.max(rect.left - 100, 10), window.innerWidth - 250)
      })
      setShowGoalDetailStartDatePicker(true)
    }
  }

  // Handle start date selection from calendar
  const handleGoalStartDateSelect = (date: Date) => {
    setSelectedGoalStartDate(date)
  }

  // Handle start date save
  const handleGoalStartDateSave = async () => {
    // If selectedGoalStartDate is null, we're clearing the date
    // Use normalizeDate to ensure consistent date format (YYYY-MM-DD)
    const newDate = selectedGoalStartDate ? normalizeDate(selectedGoalStartDate) : null
    await handleUpdateGoalForDetail(goalId, { start_date: newDate })
    setShowGoalDetailStartDatePicker(false)
  }

  // Handle area selection
  const handleGoalAreaSelect = async (areaId: string | null) => {
    await handleUpdateGoalForDetail(goalId, { areaId: areaId })
    setShowGoalDetailAreaPicker(false)
  }

  return (
    <div className="w-full h-full flex flex-col bg-background">
      {/* Mobile header */}
      <div className="md:hidden sticky top-0 z-10 bg-white border-b-2 border-primary-500 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {(() => {
              const IconComponent = getIconComponent(goal.icon)
              const isPastDeadline = isGoalPastDeadline(goal)
              return (
                <>
                  <IconComponent className="w-5 h-5 text-primary-600" />
                  {isPastDeadline && (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  )}
                  <h2 className={`text-lg font-bold font-playful truncate ${isPastDeadline ? 'text-red-600' : 'text-black'}`}>{goal.title}</h2>
                </>
              )
            })()}
          </div>
          <button
            onClick={() => setMainPanelSection('overview')}
            className="btn-playful-base p-2"
            title={t('navigation.backToOverview')}
          >
            <ChevronLeft className="w-5 h-5 text-black" />
          </button>
        </div>
      </div>
      
      {/* Goal detail content */}
      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
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
                    return <IconComponent className="w-8 h-8 text-primary-600" />
                  })() : <Target className="w-8 h-8 text-primary-600" />}
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
                    className="text-2xl font-bold text-black font-playful bg-white border-2 border-primary-500 rounded-playful-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    autoFocus
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    {isGoalPastDeadline(goal) && (
                      <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                    )}
                    <h1 
                      ref={goalTitleRef as React.RefObject<HTMLHeadingElement>}
                      onClick={() => setEditingGoalDetailTitle(true)}
                      className={`text-2xl font-bold font-playful cursor-pointer transition-colors ${
                        isGoalPastDeadline(goal) 
                          ? 'text-red-600 hover:text-red-700' 
                          : 'text-black hover:text-primary-600'
                      }`}
                    >
                      {goal.title}
                    </h1>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  {/* Start Date */}
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 font-playful mb-0.5">
                      {t('goals.startDate') || 'Datum startu'}
                    </span>
                    <span 
                      ref={goalStartDateRef}
                      onClick={handleGoalStartDateClick}
                      className="text-sm font-medium font-playful cursor-pointer hover:text-primary-600 transition-colors text-gray-600"
                    >
                      {goal.start_date
                        ? formatDateBeautiful(goal.start_date)
                        : <span className="text-gray-400 italic">{t('goals.addDate') || 'Přidat datum'}</span>}
                    </span>
                  </div>
                  {/* Target Date */}
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 font-playful mb-0.5">
                      {t('common.endDate') || 'Cílové datum'}
                    </span>
                <span 
                  ref={goalDateRef}
                  onClick={handleGoalDateClick}
                      className="text-sm font-medium font-playful cursor-pointer hover:text-primary-600 transition-colors text-gray-600"
                >
                  {goal.status === 'completed' && goal.updated_at
                        ? formatDateBeautiful(goal.updated_at)
                    : goal.target_date
                        ? formatDateBeautiful(goal.target_date)
                        : <span className="text-gray-400 italic">{t('goals.addDate') || 'Přidat datum'}</span>}
                </span>
                  </div>
                </div>
              </div>
              {/* Area picker, Status picker and Delete button - aligned to the right */}
              <div className="flex items-center gap-2 ml-auto">
                {/* Area picker */}
                <button
                  ref={goalAreaRef}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (goalAreaRef.current) {
                      const rect = goalAreaRef.current.getBoundingClientRect()
                      setGoalDetailAreaPickerPosition({ 
                        top: rect.bottom + 5, 
                        left: rect.left 
                      })
                      setShowGoalDetailAreaPicker(true)
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white transition-all border-2 rounded-playful-lg font-semibold"
                  style={(() => {
                    const area = goal.area_id ? areas.find(a => a.id === goal.area_id) : null
                    const areaColor = area?.color || '#E8871E' // Default to primary color
                    return {
                      borderColor: areaColor,
                      color: areaColor,
                      boxShadow: `3px 3px 0 0 ${areaColor}`
                    }
                  })()}
                  onMouseEnter={(e) => {
                    const area = goal.area_id ? areas.find(a => a.id === goal.area_id) : null
                    const areaColor = area?.color || '#E8871E'
                    e.currentTarget.style.backgroundColor = `${areaColor}20`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white'
                  }}
                >
                  {goal.area_id ? (
                    <>
                      {(() => {
                        const area = areas.find(a => a.id === goal.area_id)
                        if (area) {
                          const IconComponent = getIconComponent(area.icon || 'LayoutDashboard')
                          return <IconComponent className="w-4 h-4" style={{ color: area.color || '#3B82F6' }} />
                        }
                        return <Target className="w-4 h-4" />
                      })()}
                      <span className="font-medium">
                        {areas.find(a => a.id === goal.area_id)?.name || t('details.goal.area')}
                      </span>
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4" />
                      <span className="font-medium">
                        {t('details.goal.selectArea')}
                      </span>
                    </>
                  )}
                  <ChevronDown className={`w-3 h-3 transition-transform ${showGoalDetailAreaPicker ? 'rotate-180' : ''}`} />
                </button>
                {/* Status picker */}
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
                  className={`btn-playful-base flex items-center gap-2 px-3 py-1.5 text-sm transition-all ${
                    goal.status === 'active' 
                      ? 'bg-primary-100 text-primary-600' 
                      : goal.status === 'completed'
                      ? 'bg-primary-100 text-primary-600'
                      : 'bg-white text-gray-600'
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
                  className="btn-playful-danger flex items-center gap-2 px-3 py-1.5 text-sm"
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
                className="w-full text-black mb-6 text-lg font-playful bg-white border-2 border-primary-500 rounded-playful-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                rows={3}
                autoFocus
              />
            ) : (
              goal.description && (
                <p 
                  ref={goalDescriptionRef as React.RefObject<HTMLParagraphElement>}
                  onClick={() => setEditingGoalDetailDescription(true)}
                  className="text-gray-600 mb-6 text-lg font-playful cursor-pointer hover:text-primary-600 transition-colors"
                >
                  {goal.description}
                </p>
              )
            )}
            {!goal.description && !editingGoalDetailDescription && (
              <p 
                onClick={() => setEditingGoalDetailDescription(true)}
                className="text-gray-400 mb-6 text-lg font-playful cursor-pointer hover:text-primary-600 transition-colors italic"
              >
                {t('goals.addDescription')}
              </p>
            )}
            
            {/* Goal information - modern inline style */}
            <div className="mb-8 space-y-6">
              {/* Progress bar - calculated from metrics and steps combined */}
              <div key={`progress-${goal.id}-${Math.round(displayProgress)}`}>
                <div 
                  className="flex items-center justify-between mb-3 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setIsProgressExpanded(!isProgressExpanded)}
                >
                  <div className="flex items-center gap-2">
                  <span className="text-lg font-medium text-black font-playful">{t('details.goal.progress')}</span>
                    <ChevronDown 
                      className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                        isProgressExpanded ? 'transform rotate-180' : ''
                      }`}
                    />
                  </div>
                  <span className="text-2xl font-bold text-primary-600 font-playful">
                    {Math.round(displayProgress)}%
                  </span>
                </div>
                <div className="w-full bg-white border-2 border-primary-500 rounded-playful-sm h-3 overflow-hidden">
                  <div 
                    key={`progress-bar-${goal.id}-${Math.round(displayProgress)}`}
                    className="bg-primary-500 h-full rounded-playful-sm transition-all duration-300"
                    style={{ width: `${Math.round(displayProgress)}%` }}
                  />
                </div>
              </div>
              
              {/* Aggregated metrics by units and steps progress - displayed as smaller progress bars */}
              {isProgressExpanded && (() => {
                const progressBars: JSX.Element[] = []
                
                // Add steps progress bar if there are steps
                if (totalSteps > 0) {
                  const stepsProgress = (completedSteps / totalSteps) * 100
                  progressBars.push(
                    <div key="steps-progress" className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 font-playful">
                          {t('details.goal.completedSteps')} ({completedSteps} / {totalSteps})
                        </span>
                        <span className="text-gray-500 font-playful text-xs">
                          {Math.round(stepsProgress)}%
                        </span>
                </div>
                      <div className="w-full bg-gray-100 border border-gray-300 rounded-playful-sm h-2 overflow-hidden">
                        <div 
                          className="bg-gray-400 h-full rounded-playful-sm transition-all duration-300"
                          style={{ width: `${Math.round(stepsProgress)}%` }}
                        />
                      </div>
                    </div>
                  )
                }
                
                // Add metrics progress bars
                if (metrics && metrics.length > 0) {
                  // Separate metrics by direction: increasing (target > initial) vs decreasing (target < initial)
                  const increasingMetrics = metrics.filter((m: any) => {
                    const target = parseFloat(m.target_value || 0)
                    const initial = parseFloat(m.initial_value || 0)
                    return target > initial
                  })
                  
                  const decreasingMetrics = metrics.filter((m: any) => {
                    const target = parseFloat(m.target_value || 0)
                    const initial = parseFloat(m.initial_value || 0)
                    return target < initial
                  })
                  
                  // Format number with decimals if needed (show up to 1 decimal place) and thousand separators
                  const formatNumber = (value: number): string => {
                    const rounded = Math.round(value * 10) / 10
                    const numberStr = rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(1)
                    // Add thousand separators (spaces)
                    return numberStr.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
                  }
                  
                  // Process increasing metrics
                  if (increasingMetrics.length > 0) {
                    const groupedIncreasing = groupMetricsByUnits(increasingMetrics)
                    groupedIncreasing.forEach((group, index) => {
                      // Ensure values are numbers and handle NaN/undefined
                      const totalInitial = parseFloat(String(group.totalInitial || 0))
                      const totalTarget = parseFloat(String(group.totalTarget || 0))
                      const totalCurrent = parseFloat(String(group.totalCurrent || 0))
                      
                      const range = totalTarget - totalInitial
                      let progress = 0
                      if (isNaN(range) || range === 0) {
                        progress = totalCurrent >= totalTarget ? 100 : 0
                      } else {
                        const calculatedProgress = ((totalCurrent - totalInitial) / range) * 100
                        if (isNaN(calculatedProgress) || !isFinite(calculatedProgress)) {
                          progress = 0
                        } else {
                          progress = Math.min(Math.max(calculatedProgress, 0), 100)
                        }
                      }
                      
                      const metricNames = group.metrics.length > 1 
                        ? group.metrics.map(m => m.name).join(' + ')
                        : group.metrics[0].name
                      
                      progressBars.push(
                        <div key={`metric-increasing-${group.unit}-${index}`} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 font-playful">
                              {metricNames} ({formatNumber(group.totalCurrent)}{group.unit ? ` ${group.unit}` : ''} / {formatNumber(group.totalTarget)}{group.unit ? ` ${group.unit}` : ''})
                            </span>
                            <span className="text-gray-500 font-playful text-xs">
                              {Math.round(progress)}%
                  </span>
                </div>
                          <div className="w-full bg-gray-100 border border-gray-300 rounded-playful-sm h-2 overflow-hidden">
                            <div 
                              className="bg-gray-400 h-full rounded-playful-sm transition-all duration-300"
                              style={{ width: `${Math.round(progress)}%` }}
                            />
                          </div>
                        </div>
                      )
                    })
                  }
                  
                  // Process decreasing metrics
                  if (decreasingMetrics.length > 0) {
                    const groupedDecreasing = groupMetricsByUnits(decreasingMetrics)
                    groupedDecreasing.forEach((group, index) => {
                      // Ensure values are numbers and handle NaN/undefined
                      const totalInitial = parseFloat(String(group.totalInitial || 0))
                      const totalTarget = parseFloat(String(group.totalTarget || 0))
                      const totalCurrent = parseFloat(String(group.totalCurrent || 0))
                      
                      const range = totalInitial - totalTarget // Note: reversed for decreasing
                      let progress = 0
                      if (isNaN(range) || range === 0) {
                        progress = totalCurrent <= totalTarget ? 100 : 0
                      } else {
                        const calculatedProgress = ((totalInitial - totalCurrent) / range) * 100
                        if (isNaN(calculatedProgress) || !isFinite(calculatedProgress)) {
                          progress = 0
                        } else {
                          progress = Math.min(Math.max(calculatedProgress, 0), 100)
                        }
                      }
                      
                      const metricNames = group.metrics.length > 1 
                        ? group.metrics.map(m => m.name).join(' + ')
                        : group.metrics[0].name
                      
                      // Format: initial → current → target for decreasing metrics
                      const unitDisplay = group.unit ? ` ${group.unit}` : ''
                      const valueDisplay = `${formatNumber(totalInitial)}${unitDisplay} → ${formatNumber(totalCurrent)}${unitDisplay} → ${formatNumber(totalTarget)}${unitDisplay}`
                      
                      progressBars.push(
                        <div key={`metric-decreasing-${group.unit}-${index}`} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 font-playful">
                              {metricNames} ({valueDisplay})
                            </span>
                            <span className="text-gray-500 font-playful text-xs">
                              {Math.round(progress)}%
                  </span>
                </div>
                          <div className="w-full bg-gray-100 border border-gray-300 rounded-playful-sm h-2 overflow-hidden">
                            <div 
                              className="bg-gray-400 h-full rounded-playful-sm transition-all duration-300"
                              style={{ width: `${Math.round(progress)}%` }}
                            />
              </div>
                        </div>
                      )
                    })
                  }
                }
                
                if (progressBars.length === 0) return null
                
                return (
                  <div className="space-y-2 mt-3">
                    {progressBars}
                  </div>
                )
              })()}
            </div>
          </div>
          
          {/* Metrics Section - above Steps */}
          {(() => {
            const totalMetrics = metrics?.length || 0
            const completedMetrics = metrics?.filter(m => m.current_value >= m.target_value).length || 0
            const remainingMetrics = totalMetrics - completedMetrics
            const completedPercentage = totalMetrics > 0 ? Math.round((completedMetrics / totalMetrics) * 100) : 0
            const remainingPercentage = totalMetrics > 0 ? Math.round((remainingMetrics / totalMetrics) * 100) : 0
            
            // Render metric card
            const renderMetricCard = (metric: any) => {
              const isEditing = editingMetricId === metric.id
              const isExpanded = expandedMetricId === metric.id
              const isNewMetric = newMetricId === metric.id
              
              // If expanded but not editing, automatically start editing
              if (isExpanded && !isEditing && !isNewMetric) {
                // This will be handled by handleToggleExpand, but we ensure editingMetricData is set
                if (!editingMetricData || editingMetricData.id !== metric.id) {
                  const currentValue = typeof metric.current_value === 'number' 
                    ? metric.current_value 
                    : parseFloat(metric.current_value) || 0
                  const targetValue = typeof metric.target_value === 'number'
                    ? metric.target_value
                    : parseFloat(metric.target_value) || 0
                  const initialValue = typeof metric.initial_value === 'number'
                    ? metric.initial_value
                    : parseFloat(metric.initial_value) || 0
                  
                  setEditingMetricId(metric.id)
                  setEditingMetricData({
                    id: metric.id,
                    name: metric.name,
                    type: metric.type || 'number',
                    currentValue: currentValue,
                    targetValue: targetValue,
                    initialValue: initialValue,
                    incrementalValue: metric.incremental_value || 1,
                    unit: metric.unit || ''
                  })
                }
              }
              
              // For inline editing, use editingMetricData, otherwise use metric
              const displayData = (isEditing || isExpanded) && editingMetricData && editingMetricData.id === metric.id ? editingMetricData : metric
              
              // Ensure values are numbers for comparison
              const currentValue = typeof displayData.current_value === 'number' 
                ? displayData.current_value 
                : typeof displayData.currentValue === 'number'
                ? displayData.currentValue
                : parseFloat(displayData.current_value || displayData.currentValue) || 0
              const targetValue = typeof displayData.target_value === 'number'
                ? displayData.target_value
                : typeof displayData.targetValue === 'number'
                ? displayData.targetValue
                : parseFloat(displayData.target_value || displayData.targetValue) || 0
              const initialValue = typeof displayData.initial_value === 'number'
                ? displayData.initial_value
                : typeof displayData.initialValue === 'number'
                ? displayData.initialValue
                : parseFloat(displayData.initial_value || displayData.initialValue) || 0
              
              // Calculate progress: 0% at initial_value, 100% at target_value
              // If current_value > target_value, cap at 100%
              // If target_value == initial_value, progress is always 100% (or 0% if current < initial)
              const range = targetValue - initialValue
              let progress = 0
              if (range === 0) {
                // If target equals initial, show 100% if current >= target, otherwise 0%
                progress = currentValue >= targetValue ? 100 : 0
              } else if (range > 0) {
                // Normal case: progress from initial to target
                progress = Math.min(Math.max(((currentValue - initialValue) / range) * 100, 0), 100)
              } else {
                // Reverse case: going from higher initial to lower target (e.g., 100 to 0)
                progress = Math.min(Math.max(((initialValue - currentValue) / Math.abs(range)) * 100, 0), 100)
              }
              // Show progress if there's a range (target != initial) OR if target is 0 and initial > 0 (going to zero)
              const hasTarget = targetValue !== initialValue || (targetValue === 0 && initialValue > 0)
              const isLoading = loadingMetrics.has(metric.id)
              // Check completion: if going from higher to lower (e.g., 100 to 0), completed when current <= target
              // Otherwise, completed when current >= target
              const isCompleted = hasTarget && (
                (initialValue > targetValue && currentValue <= targetValue) ||
                (initialValue <= targetValue && currentValue >= targetValue)
              )
              
              const metricName = displayData.name || ''
              // Use editingMetricData type if available and matches this metric, otherwise use displayData
              const metricType = (isEditing || isExpanded) && editingMetricData && editingMetricData.id === metric.id 
                ? (editingMetricData.type || 'number')
                : (displayData.type || 'number')
              const metricUnit = (isEditing || isExpanded) && editingMetricData && editingMetricData.id === metric.id
                ? (editingMetricData.unit || '')
                : (displayData.unit || '')
              
              // Get available units for type - recalculate when type changes
              const availableUnits = getUnitsByType(
                metricType,
                userSettings?.weight_unit_preference || 'kg',
                localeCode
              )
              
              // Handle click on empty space to open metric (desktop only)
              const handleEmptySpaceClick = (e: React.MouseEvent) => {
                if (isMobile) {
                  // Mobile: open modal
                  const currentValue = typeof metric.current_value === 'number' 
                    ? metric.current_value 
                    : parseFloat(metric.current_value) || 0
                  setMetricModalData({
                    id: metric.id,
                    name: metric.name,
                    currentValue: currentValue,
                    targetValue: metric.target_value,
                    incrementalValue: metric.incremental_value,
                    unit: metric.unit,
                    type: metric.type || 'number'
                  })
                  setEditingMetricName(metric.name)
                  setEditingMetricType(metric.type || 'number')
                  setEditingMetricCurrentValue(currentValue)
                  setEditingMetricTargetValue(metric.target_value)
                  setEditingMetricInitialValue(metric.initial_value ?? 0)
                  setEditingMetricIncrementalValue(metric.incremental_value)
                  setEditingMetricUnit(metric.unit)
                  setShowMetricModal(true)
                } else {
                  // Desktop: toggle inline editing
                  if (isEditing) {
                    // Cancel editing
                    handleCancelInlineMetric()
                  } else {
                    // Start editing
                    setEditingMetricId(metric.id)
                    setExpandedMetricId(metric.id)
                    setEditingMetricData({
                      id: metric.id,
                      name: metric.name,
                      type: metric.type || 'number',
                      currentValue: currentValue,
                      targetValue: targetValue,
                      initialValue: initialValue,
                      incrementalValue: metric.incremental_value || 1,
                      unit: metric.unit || ''
                    })
                  }
                }
              }
              
              // Handle toggle expand/collapse - when expanding, also start editing
              const handleToggleExpand = (e: React.MouseEvent) => {
                e.stopPropagation()
                if (isEditing) {
                  // If editing, clicking on expand button should save and close
                  if (editingMetricData && validateMetricData(editingMetricData)) {
                    handleSaveInlineMetric(editingMetricData)
                  } else if (isNewMetric) {
                    // If new metric and invalid, cancel
                    handleCancelInlineMetric()
                  }
                } else {
                  // If not editing, toggle expand/collapse and start editing
                  if (isExpanded) {
                    setExpandedMetricId(null)
                    setEditingMetricId(null)
                  } else {
                    setExpandedMetricId(metric.id)
                    setEditingMetricId(metric.id)
                    setEditingMetricData({
                      id: metric.id,
                      name: metric.name,
                      type: metric.type || 'number',
                      currentValue: currentValue,
                      targetValue: targetValue,
                      initialValue: initialValue,
                      incrementalValue: metric.incremental_value || 1,
                      unit: metric.unit || ''
                    })
                  }
                }
              }
              
              return (
                <div
                  key={metric.id}
                  data-metric-container="true"
                  ref={(el) => {
                    // Set ref if editing or expanded (to detect clicks outside)
                    if (isEditing || isExpanded) {
                      metricRefs.current[metric.id] = el
                    } else {
                      delete metricRefs.current[metric.id]
                    }
                  }}
                  className={`flex flex-col gap-3 p-4 transition-all duration-300 rounded-playful-md ${
                    isCompleted && !isEditing
                      ? 'opacity-75'
                      : 'hover:bg-primary-50/50'
                  } ${
                    isExpanded || isEditing
                      ? 'border-2 border-primary-500 bg-primary-50/30'
                      : 'border-2 border-transparent'
                  }`}
                >
                  {/* Compact view - always visible */}
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {(isEditing || isExpanded) ? (
                          <input
                            type="text"
                            value={metricName}
                            onChange={(e) => {
                              handleMetricFieldChange('name', e.target.value)
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur()
                              } else if (e.key === 'Escape') {
                                handleCancelInlineMetric()
                              }
                            }}
                            className="flex-1 min-w-0 text-sm px-2 py-1 bg-transparent border-0 border-b-2 border-b-gray-300 focus:border-b-primary-500 focus:outline-none rounded-none font-medium text-black"
                            placeholder={t('common.metrics.namePlaceholder')}
                            autoFocus
                          />
                        ) : (
                          <span className={`font-medium text-sm font-playful ${
                            isCompleted 
                              ? 'line-through text-gray-400' 
                              : 'text-black'
                          }`}>
                            {metricName || t('common.metrics.unnamed')}
                          </span>
                        )}
                        {!isEditing && (
                          <button
                            onClick={handleToggleExpand}
                            className="flex items-center justify-center w-5 h-5 text-primary-600 hover:bg-primary-100 rounded-playful-sm transition-colors"
                            title={isExpanded ? t('common.collapse') : t('common.expand')}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                      <div className="mb-2" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                        {/* Values and percentage - properly aligned */}
                        <div className="flex items-center justify-between mb-2 text-sm w-full gap-4">
                          {/* Left: Current / Target */}
                          <div className="flex items-center gap-2 text-gray-700">
                            {hasTarget ? (
                              <>
                                {isEditingCurrentValue[metric.id] ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={editingCurrentValue[metric.id] ?? currentValue}
                                      onChange={(e) => setEditingCurrentValue(prev => ({ ...prev, [metric.id]: parseFloat(e.target.value) || 0 }))}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault()
                                          handleSaveCurrentValue(metric.id)
                                        } else if (e.key === 'Escape') {
                                          e.preventDefault()
                                          handleCancelCurrentValue(metric.id)
                                        }
                                      }}
                                      onBlur={() => handleSaveCurrentValue(metric.id)}
                                      onMouseDown={(e) => e.stopPropagation()}
                                      onClick={(e) => e.stopPropagation()}
                                      onFocus={(e) => e.stopPropagation()}
                                      autoFocus
                                      className="w-20 px-2 py-1 text-sm border-2 border-primary-500 rounded-playful-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-black"
                                    />
                                    <span className="text-sm">{metricUnit}</span>
                                  </div>
                                ) : (
                                  <div 
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleStartEditingCurrentValue(metric.id, currentValue)
                                    }}
                                    className="flex items-center gap-1 cursor-pointer hover:text-primary-600 transition-colors"
                                    title={t('common.metrics.currentValue') || 'Klikněte pro úpravu'}
                                  >
                                    <Pencil className="w-3 h-3 text-gray-400" />
                                    <span className="hover:underline font-medium">{formatNumber(currentValue)} {metricUnit}</span>
                                  </div>
                                )}
                                <span className="text-gray-500">/</span>
                                <span className="font-medium">{formatNumber(targetValue)} {metricUnit}</span>
                              </>
                            ) : (
                              <>
                                {isEditingCurrentValue[metric.id] ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={editingCurrentValue[metric.id] ?? currentValue}
                                      onChange={(e) => setEditingCurrentValue(prev => ({ ...prev, [metric.id]: parseFloat(e.target.value) || 0 }))}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault()
                                          handleSaveCurrentValue(metric.id)
                                        } else if (e.key === 'Escape') {
                                          e.preventDefault()
                                          handleCancelCurrentValue(metric.id)
                                        }
                                      }}
                                      onBlur={() => handleSaveCurrentValue(metric.id)}
                                      onMouseDown={(e) => e.stopPropagation()}
                                      onClick={(e) => e.stopPropagation()}
                                      onFocus={(e) => e.stopPropagation()}
                                      autoFocus
                                      className="w-20 px-2 py-1 text-sm border-2 border-primary-500 rounded-playful-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-black"
                                    />
                                    <span className="text-sm">{metricUnit}</span>
                                  </div>
                                ) : (
                                  <div 
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleStartEditingCurrentValue(metric.id, currentValue)
                                    }}
                                    className="flex items-center gap-1 cursor-pointer hover:text-primary-600 transition-colors"
                                    title={t('common.metrics.currentValue') || 'Klikněte pro úpravu'}
                                  >
                                    <Pencil className="w-3 h-3 text-gray-400" />
                                    <span className="hover:underline font-medium">{t('common.metrics.remains') || 'Remains'}: {formatNumber(currentValue)} {metricUnit}</span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                          {/* Right: Percentage - pushed to the right edge */}
                          {hasTarget && (
                            <span className="text-primary-600 font-semibold text-sm flex-shrink-0">{Math.round(progress)}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress bar - full width of outer container */}
                  {hasTarget && (
                    <div className="w-full bg-white border-2 border-primary-500 rounded-playful-sm h-2 overflow-hidden" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                      <div 
                        className="bg-primary-500 h-full rounded-playful-sm transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                  
                  {/* Expanded/Editing view - shown when expanded or editing */}
                  {/* When expanded, automatically enable editing */}
                  {(isExpanded || isEditing) && (
                    <div className="space-y-3 pt-2 border-t-2 border-primary-200" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                      {/* Type and Unit */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1 font-playful">
                            {t('common.metrics.type')} <span className="text-primary-600">*</span>
                          </label>
                          {(isEditing || isExpanded) ? (
                            <select
                              value={editingMetricData?.type || metricType}
                              onChange={(e) => {
                                const newType = e.target.value as MetricType
                                
                                // Update type and unit in a single state update to avoid double render
                                if (!editingMetricData) return
                                
                                // Check if current unit is compatible with new type
                                const currentUnit = editingMetricData.unit || (displayData.unit || '')
                                const availableUnits = getUnitsByType(
                                  newType,
                                  userSettings?.weight_unit_preference || 'kg',
                                  localeCode
                                )
                                const currentUnitValues = availableUnits.map(u => u.value)
                                const isCurrentUnitCompatible = currentUnitValues.includes(currentUnit)
                                
                                // If unit is not compatible with new type, set default unit
                                let newUnit = currentUnit
                                if (!isCurrentUnitCompatible) {
                                  if (newType === 'currency') {
                                    newUnit = userSettings?.default_currency || getDefaultCurrencyByLocale(localeCode)
                                  } else if (newType === 'weight') {
                                    newUnit = userSettings?.weight_unit_preference || 'kg'
                                  } else if (newType === 'number') {
                                    newUnit = ''
                                  } else if (newType !== 'custom' && availableUnits.length > 0) {
                                    newUnit = availableUnits[0].value
                                  } else if (newType === 'custom') {
                                    newUnit = currentUnit // Keep current unit for custom type
                                  }
                                }
                                
                                // Update both type and unit in a single state update
                                setEditingMetricData((prev: any) => ({
                                  ...prev,
                                  type: newType,
                                  unit: newUnit
                                }))
                                // Don't auto-save - save only when clicking outside metric
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => e.stopPropagation()}
                              onFocus={(e) => e.stopPropagation()}
                              className="w-full px-2 py-1.5 text-xs bg-transparent border-0 border-b-2 border-b-gray-300 focus:border-b-primary-500 focus:outline-none rounded-none text-black appearance-none cursor-pointer"
                            >
                              <option value="number">{t('common.metrics.types.number') || 'Number'}</option>
                              <option value="currency">{t('common.metrics.types.currency') || 'Currency'}</option>
                              <option value="distance">{t('common.metrics.types.distance') || 'Distance'}</option>
                              <option value="weight">{t('common.metrics.types.weight') || 'Weight'}</option>
                              <option value="time">{t('common.metrics.types.time') || 'Time'}</option>
                              <option value="percentage">{t('common.metrics.types.percentage') || 'Percentage'}</option>
                              <option value="custom">{t('common.metrics.types.custom') || 'Custom'}</option>
                            </select>
                          ) : (
                            <div className="px-2 py-1.5 text-xs bg-gray-50 rounded-playful-sm text-gray-700">
                              {t(`common.metrics.types.${metricType}`) || metricType}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1 font-playful">
                            {t('common.metrics.unit')} {metricType !== 'number' && <span className="text-primary-600">*</span>}
                          </label>
                          {(isEditing || isExpanded) ? (
                            <select
                              value={metricUnit}
                              onChange={(e) => {
                                handleMetricFieldChange('unit', e.target.value)
                                // Don't auto-save - save only when clicking outside metric
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => e.stopPropagation()}
                              onFocus={(e) => e.stopPropagation()}
                              className="w-full px-2 py-1.5 text-xs bg-transparent border-0 border-b-2 border-b-gray-300 focus:border-b-primary-500 focus:outline-none rounded-none text-black appearance-none cursor-pointer"
                            >
                              {/* Recalculate available units based on current metricType */}
                              {(() => {
                                const currentType = (isEditing || isExpanded) && editingMetricData && editingMetricData.id === metric.id 
                                  ? (editingMetricData.type || 'number')
                                  : metricType
                                const currentAvailableUnits = getUnitsByType(
                                  currentType,
                                  userSettings?.weight_unit_preference || 'kg',
                                  localeCode
                                )
                                return currentAvailableUnits.map((unit: any) => (
                                  <option key={unit.value} value={unit.value}>
                                    {unit.label}
                                  </option>
                                ))
                              })()}
                            </select>
                          ) : (
                            <div className="px-2 py-1.5 text-xs bg-gray-50 rounded-playful-sm text-gray-700">
                              {metricUnit || t('common.metrics.noUnit')}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Values */}
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1 font-playful">
                            {t('common.metrics.initial')}
                          </label>
                          {(isEditing || isExpanded) ? (
                            <input
                              type="text"
                              value={formatNumberWithSpaces(initialValue)}
                              onChange={(e) => {
                                const parsed = parseFormattedNumber(e.target.value)
                                handleMetricFieldChange('initialValue', parsed)
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.currentTarget.blur()
                                } else if (e.key === 'Escape') {
                                  handleCancelInlineMetric()
                                }
                              }}
                              className="w-full px-2 py-1.5 text-xs bg-transparent border-0 border-b-2 border-b-gray-300 focus:border-b-primary-500 focus:outline-none rounded-none text-black"
                            />
                          ) : (
                            <div className="px-2 py-1.5 text-xs bg-gray-50 rounded-playful-sm text-gray-700">
                              {formatNumber(initialValue)} {metricUnit}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1 font-playful">
                            {t('common.metrics.current')}
                          </label>
                          {(isEditing || isExpanded) ? (
                            <input
                              type="text"
                              value={formatNumberWithSpaces(currentValue)}
                              onChange={(e) => {
                                const parsed = parseFormattedNumber(e.target.value)
                                handleMetricFieldChange('currentValue', parsed)
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.currentTarget.blur()
                                } else if (e.key === 'Escape') {
                                  handleCancelInlineMetric()
                                }
                              }}
                              className="w-full px-2 py-1.5 text-xs bg-transparent border-0 border-b-2 border-b-gray-300 focus:border-b-primary-500 focus:outline-none rounded-none text-black"
                            />
                          ) : (
                            <div className="px-2 py-1.5 text-xs bg-gray-50 rounded-playful-sm text-gray-700">
                              {formatNumber(currentValue)} {metricUnit}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1 font-playful">
                            {t('common.metrics.target')}
                          </label>
                          {(isEditing || isExpanded) ? (
                            <input
                              type="text"
                              value={formatNumberWithSpaces(targetValue)}
                              onChange={(e) => {
                                const parsed = parseFormattedNumber(e.target.value)
                                handleMetricFieldChange('targetValue', parsed)
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.currentTarget.blur()
                                } else if (e.key === 'Escape') {
                                  handleCancelInlineMetric()
                                }
                              }}
                              className="w-full px-2 py-1.5 text-xs bg-transparent border-0 border-b-2 border-b-gray-300 focus:border-b-primary-500 focus:outline-none rounded-none text-black"
                            />
                          ) : (
                            <div className="px-2 py-1.5 text-xs bg-gray-50 rounded-playful-sm text-gray-700">
                              {formatNumber(targetValue)} {metricUnit}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Delete button - bottom left */}
                      {!isNewMetric && (isEditing || isExpanded) && (
                        <div className="flex justify-start pt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const confirmMessage = t('common.metrics.deleteConfirm') || 'Opravdu chcete smazat tuto metriku?'
                              if (confirm(confirmMessage)) {
                                handleMetricDelete(metric.id, goalId)
                                handleCancelInlineMetric()
                              }
                            }}
                            className="px-3 py-1.5 text-xs font-medium bg-red-500 text-white rounded-playful-sm hover:bg-red-600 transition-colors flex items-center gap-1.5"
                            title={t('common.delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>{t('common.delete')}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            }
            
            // Calculate average progress from all metrics
            const averageProgress = React.useMemo(() => {
              if (totalMetrics === 0) return 0
              
              const progresses = metrics.map((metric: any) => {
                const currentValue = typeof metric.current_value === 'number' 
                  ? metric.current_value 
                  : parseFloat(metric.current_value) || 0
                const targetValue = typeof metric.target_value === 'number'
                  ? metric.target_value
                  : parseFloat(metric.target_value) || 0
                const initialValue = typeof metric.initial_value === 'number'
                  ? metric.initial_value
                  : parseFloat(metric.initial_value) || 0
                
                const range = targetValue - initialValue
                if (range === 0) {
                  return currentValue >= targetValue ? 100 : 0
                } else if (range > 0) {
                  return Math.min(Math.max(((currentValue - initialValue) / range) * 100, 0), 100)
                } else {
                  return Math.min(Math.max(((initialValue - currentValue) / Math.abs(range)) * 100, 0), 100)
                }
              })
              
              const sum = progresses.reduce((acc, p) => acc + p, 0)
              return sum / progresses.length
            }, [metrics, totalMetrics])
            
            return (
              <div className="mb-6">
                {/* Metrics Header - similar to goals header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 px-4 py-3 mb-4">
                  <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => setMetricsExpanded(!metricsExpanded)}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setMetricsExpanded(!metricsExpanded)
                      }}
                      className="flex items-center justify-center w-6 h-6 text-primary-600 hover:bg-primary-50 rounded-playful-sm transition-colors"
                      title={metricsExpanded ? 'Sbalit metriky' : 'Rozbalit metriky'}
                    >
                      {metricsExpanded ? (
                        <ChevronDown className="w-4 h-4" strokeWidth={2.5} />
                      ) : (
                        <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
                      )}
                    </button>
                    <h2 className="text-xl font-bold text-black font-playful">
                      {t('common.metrics.title')}
                    </h2>
                    {totalMetrics > 0 && (
                      <span className="text-sm text-gray-600 font-playful">
                        {Math.round(averageProgress)}% ({totalMetrics} {totalMetrics === 1 ? t('common.metrics.metric') : t('common.metrics.metrics')})
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (isMobile) {
                        // Mobile: open modal
                        setMetricModalData({ id: null, name: '', currentValue: 0, targetValue: 0, initialValue: 0, incrementalValue: 1, unit: '', type: 'number' })
                        setEditingMetricName('')
                        setEditingMetricType('number')
                        setEditingMetricCurrentValue(0)
                        setEditingMetricTargetValue(0)
                        setEditingMetricInitialValue(0)
                        setEditingMetricIncrementalValue(1)
                        setEditingMetricUnit('')
                        setShowMetricModal(true)
                      } else {
                        // Desktop: inline creation
                        const newId = `new-metric-${Date.now()}`
                        setNewMetricId(newId)
                        setEditingMetricId(newId)
                        setExpandedMetricId(newId)
                        setEditingMetricData({
                          id: newId,
                          name: '',
                          type: 'number',
                          currentValue: 0,
                          targetValue: 0,
                          initialValue: 0,
                          incrementalValue: 1,
                          unit: ''
                        })
                        setMetricsExpanded(true)
                      }
                    }}
                    className="flex items-center justify-center w-8 h-8 text-primary-600 hover:bg-primary-50 rounded-playful-sm transition-colors"
                    title={t('common.metrics.create')}
                  >
                    <Plus className="w-5 h-5" strokeWidth={2.5} />
                  </button>
                </div>
                
                {metricsExpanded && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                    {/* Render new metric inline if creating */}
                    {newMetricId && editingMetricData && (
                      <div key={newMetricId}>
                        {renderMetricCard({
                          id: newMetricId,
                          name: editingMetricData.name || '',
                          type: editingMetricData.type || 'number',
                          current_value: editingMetricData.currentValue || 0,
                          target_value: editingMetricData.targetValue || 0,
                          initial_value: editingMetricData.initialValue || 0,
                          incremental_value: editingMetricData.incrementalValue || 1,
                          unit: editingMetricData.unit || ''
                        })}
                      </div>
                    )}
                    {/* Render existing metrics */}
                    {metrics.map(renderMetricCard)}
                  </div>
                )}
              </div>
            )
          })()}
          
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
            
            // Use StepsManagementView to display steps - same as UpcomingView
            // This replaces the old two-column layout with inline expandable steps
            // Hide filters (filter is clear - this goal, and show only incomplete)
            // Hide completed steps
            // Custom header for steps section (same style as metrics)
              return (
              <div className="mb-6">
                {/* Steps Header - similar to metrics header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 px-4 py-3 mb-2">
                  <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => setStepsExpanded(!stepsExpanded)}>
                  <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setStepsExpanded(!stepsExpanded)
                      }}
                      className="flex items-center justify-center w-6 h-6 text-primary-600 hover:bg-primary-50 rounded-playful-sm transition-colors"
                      title={stepsExpanded ? 'Sbalit kroky' : 'Rozbalit kroky'}
                    >
                      {stepsExpanded ? (
                        <ChevronDown className="w-4 h-4" strokeWidth={2.5} />
                      ) : (
                        <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
                      )}
                    </button>
                    <h2 className="text-xl font-bold text-black font-playful">
                      Kroky
                    </h2>
                    {totalSteps > 0 && (
                      <span className="text-sm text-gray-600 font-playful">
                        {stepsProgress}% ({completedSteps} / {totalSteps})
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (setCreateNewStepTrigger) {
                        setCreateNewStepTrigger(prev => prev + 1)
                      }
                    }}
                    className="flex items-center justify-center w-8 h-8 text-primary-600 hover:bg-primary-50 rounded-playful-sm transition-colors"
                    title={t('steps.add') || 'Přidat krok'}
                  >
                    <Plus className="w-5 h-5" strokeWidth={2.5} />
                  </button>
                </div>
                
                {stepsExpanded && (
                  <StepsManagementView
                  dailySteps={dailySteps}
                  goals={goals}
                  areas={areas}
                  userId={userId}
                  player={player}
                  onDailyStepsUpdate={onDailyStepsUpdate}
                  onOpenStepModal={(step) => {
                    // If step is provided, open modal for editing
                    if (step) {
                      handleItemClick(step, 'step')
                    }
                    // For new step (no step provided), createNewStepTrigger will handle inline creation
                  }}
                  onStepImportantChange={onStepImportantChange}
                  handleStepToggle={handleStepToggle}
                  loadingSteps={loadingSteps}
                  createNewStepTrigger={createNewStepTrigger}
                  onNewStepCreated={() => {
                    // Reset trigger after step is created
                    if (setCreateNewStepTrigger) {
                      setCreateNewStepTrigger(() => 0)
                    }
                  }}
                  hideHeader={true}
                  hideFilters={true}
                  showCompleted={false}
                  goalFilter={goalId}
                  />
                )}
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
            className="fixed z-50 box-playful-highlight bg-white p-4 date-picker"
            style={{ 
              top: `${goalDetailDatePickerPosition.top}px`,
              left: `${goalDetailDatePickerPosition.left}px`,
              width: '230px'
            }}
          >
            <div className="text-sm font-bold text-black font-playful mb-3">{t('common.newDate')}</div>
            
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => {
                  const newMonth = new Date(goalDetailDatePickerMonth)
                  newMonth.setMonth(newMonth.getMonth() - 1)
                  setGoalDetailDatePickerMonth(newMonth)
                }}
                className="btn-playful-base p-1 text-gray-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium text-black font-playful">
                {goalDetailDatePickerMonth.toLocaleDateString(localeCode, { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => {
                  const newMonth = new Date(goalDetailDatePickerMonth)
                  newMonth.setMonth(newMonth.getMonth() + 1)
                  setGoalDetailDatePickerMonth(newMonth)
                }}
                className="btn-playful-base p-1 text-gray-600"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
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
                      onClick={async () => {
                        const newDate = day.toISOString()
                        await handleUpdateGoalForDetail(goalId, { target_date: newDate })
                        setShowGoalDetailDatePicker(false)
                      }}
                      className={`w-7 h-7 rounded-playful-sm text-xs font-medium font-playful transition-colors border-2 ${
                        isSelected
                          ? 'bg-primary-500 text-white border-primary-500'
                          : isToday
                            ? 'bg-primary-100 text-primary-600 font-bold border-primary-500'
                            : 'hover:bg-primary-50 text-gray-600 border-transparent hover:border-primary-500'
                      }`}
                    >
                      {day.getDate()}
                    </button>
                  )
                })
              })()}
            </div>
            
            {/* Actions - only Delete button */}
            {goal.target_date && (
            <div className="flex gap-2">
                <button
                  onClick={async () => {
                    await handleUpdateGoalForDetail(goalId, { target_date: null })
                    setShowGoalDetailDatePicker(false)
                  }}
                  className="btn-playful-danger flex-1 px-3 py-1.5 text-xs font-medium"
                >
                  {t('common.delete')}
                </button>
              </div>
            )}
          </div>
        </>
      )}
      
      {/* Start Date Picker Modal */}
      {showGoalDetailStartDatePicker && goalDetailStartDatePickerPosition && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowGoalDetailStartDatePicker(false)}
          />
          <div 
            className="fixed z-50 box-playful-highlight bg-white p-4 date-picker"
            style={{ 
              top: `${goalDetailStartDatePickerPosition.top}px`,
              left: `${goalDetailStartDatePickerPosition.left}px`,
              width: '230px'
            }}
          >
            <div className="text-sm font-bold text-black font-playful mb-3">{t('common.newDate')}</div>
            
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => {
                  const newMonth = new Date(goalDetailStartDatePickerMonth)
                  newMonth.setMonth(newMonth.getMonth() - 1)
                  setGoalDetailStartDatePickerMonth(newMonth)
                }}
                className="btn-playful-base p-1 text-gray-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium text-black font-playful">
                {goalDetailStartDatePickerMonth.toLocaleDateString(localeCode, { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => {
                  const newMonth = new Date(goalDetailStartDatePickerMonth)
                  newMonth.setMonth(newMonth.getMonth() + 1)
                  setGoalDetailStartDatePickerMonth(newMonth)
                }}
                className="btn-playful-base p-1 text-gray-600"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
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
                const year = goalDetailStartDatePickerMonth.getFullYear()
                const month = goalDetailStartDatePickerMonth.getMonth()
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
                const selectedDateNormalized = selectedGoalStartDate ? (() => {
                  const d = new Date(selectedGoalStartDate)
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
                      onClick={async () => {
                        const newDate = normalizeDate(day)
                        await handleUpdateGoalForDetail(goalId, { start_date: newDate })
                        setShowGoalDetailStartDatePicker(false)
                      }}
                      className={`w-7 h-7 rounded-playful-sm text-xs font-medium font-playful transition-colors border-2 ${
                        isSelected
                          ? 'bg-primary-500 text-white border-primary-500'
                          : isToday
                            ? 'bg-primary-100 text-primary-600 font-bold border-primary-500'
                            : 'hover:bg-primary-50 text-gray-600 border-transparent hover:border-primary-500'
                      }`}
                    >
                      {day.getDate()}
                    </button>
                  )
                })
              })()}
            </div>
            
            {/* Actions - only Delete button */}
            {goal.start_date && (
            <div className="flex gap-2">
                <button
                  onClick={async () => {
                    await handleUpdateGoalForDetail(goalId, { start_date: null })
                    setShowGoalDetailStartDatePicker(false)
                  }}
                  className="btn-playful-base flex-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white hover:bg-gray-50"
                >
                  {t('common.delete')}
                </button>
              </div>
            )}
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
            className="fixed z-50 box-playful-highlight bg-white min-w-[160px]"
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
                className={`w-full text-left px-4 py-3 text-sm hover:bg-primary-50 transition-colors font-medium font-playful flex items-center gap-2 ${
                  goal.status === status 
                    ? 'bg-primary-100 text-primary-600 font-semibold' 
                    : 'text-black'
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
      
      {/* Area picker modal for goal area */}
      {showGoalDetailAreaPicker && goalDetailAreaPickerPosition && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowGoalDetailAreaPicker(false)}
          />
          <div 
            className="fixed z-50 bg-white min-w-[200px] max-h-64 overflow-y-auto border-2 rounded-playful-lg"
            style={{
              top: `${goalDetailAreaPickerPosition.top}px`,
              left: `${goalDetailAreaPickerPosition.left}px`,
              borderColor: (() => {
                const selectedArea = goal.area_id ? areas.find(a => a.id === goal.area_id) : null
                return selectedArea?.color || '#E8871E'
              })(),
              boxShadow: (() => {
                const selectedArea = goal.area_id ? areas.find(a => a.id === goal.area_id) : null
                const areaColor = selectedArea?.color || '#E8871E'
                return `3px 3px 0 0 ${areaColor}`
              })()
            }}
          >
            <button
              type="button"
              onClick={async () => {
                await handleGoalAreaSelect(null)
              }}
              className={`w-full text-left px-4 py-3 text-sm transition-colors font-medium font-playful flex items-center gap-2 ${
                !goal.area_id 
                  ? 'font-semibold' 
                  : 'text-black'
              }`}
              style={!goal.area_id ? {
                backgroundColor: '#E8871E20',
                color: '#E8871E'
              } : {}}
              onMouseEnter={(e) => {
                if (goal.area_id) {
                  e.currentTarget.style.backgroundColor = '#E8871E20'
                }
              }}
              onMouseLeave={(e) => {
                if (goal.area_id) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              <span>{t('details.goal.noArea') || 'Bez oblasti'}</span>
            </button>
            {areas.map((area) => {
              const IconComponent = getIconComponent(area.icon || 'LayoutDashboard')
              const isSelected = goal.area_id === area.id
              const areaColor = area.color || '#E8871E'
              return (
                <button
                  key={area.id}
                  type="button"
                  onClick={async () => {
                    await handleGoalAreaSelect(area.id)
                  }}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors font-medium font-playful flex items-center gap-2 ${
                    isSelected ? 'font-semibold' : 'text-black'
                  }`}
                  style={isSelected ? {
                    backgroundColor: `${areaColor}20`,
                    color: areaColor
                  } : {}}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = `${areaColor}20`
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  <IconComponent className="w-4 h-4" style={{ color: areaColor }} />
                  <span>{area.name}</span>
                </button>
              )
            })}
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
            
            {/* Checkbox for deleting steps */}
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
            
            {/* Actions */}
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
                  await handleDeleteGoalForDetail(goalId, deleteGoalWithSteps)
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
            className="fixed z-50 box-playful-highlight bg-white"
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
                  className="w-full pl-9 pr-3 py-2 text-sm border-2 border-primary-500 rounded-playful-md font-playful focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                        className={`p-2 rounded-playful-sm transition-all hover:bg-primary-50 border-2 ${
                          isSelected 
                            ? 'bg-primary-100 border-primary-500' 
                            : 'border-transparent hover:border-primary-500'
                        }`}
                        title={icon.label}
                      >
                        <IconComponent className={`w-5 h-5 mx-auto ${isSelected ? 'text-primary-600' : 'text-black'}`} />
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
      
      {/* Metric Modal */}
      <MetricModal
        show={showMetricModal}
        metricModalData={metricModalData}
        onClose={() => {
          setShowMetricModal(false)
          setMetricModalData({ id: null, name: '', currentValue: 0, targetValue: 0, initialValue: 0, incrementalValue: 1, unit: '', type: 'number' })
          setEditingMetricCurrentValue(0)
          setEditingMetricInitialValue(0)
        }}
        onSave={async () => {
          // Convert empty string to null for unit if type is 'number'
          const unitValue = (editingMetricType === 'number' && (!editingMetricUnit || editingMetricUnit === '')) 
            ? null 
            : editingMetricUnit || null
          
          if (metricModalData.id) {
            await handleMetricUpdate(metricModalData.id, goalId, {
              name: editingMetricName,
              type: editingMetricType,
              currentValue: editingMetricCurrentValue,
              targetValue: editingMetricTargetValue,
              initialValue: editingMetricInitialValue,
              incrementalValue: editingMetricIncrementalValue,
              unit: unitValue
            })
          } else {
            // Convert empty string to null for unit if type is 'number'
            const createUnitValue = (editingMetricType === 'number' && (!editingMetricUnit || editingMetricUnit === '')) 
              ? null 
              : editingMetricUnit || null
            
            await handleMetricCreate(goalId, {
              name: editingMetricName,
              type: editingMetricType,
              currentValue: editingMetricCurrentValue,
              targetValue: editingMetricTargetValue,
              initialValue: editingMetricInitialValue,
              incrementalValue: editingMetricIncrementalValue,
              unit: createUnitValue
            })
          }
          setShowMetricModal(false)
        }}
        onDelete={metricModalData.id ? async () => {
          await handleMetricDelete(metricModalData.id, goalId)
          setShowMetricModal(false)
        } : undefined}
        isSaving={false}
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
        userSettings={userSettings || undefined}
      />
    </div>
  )
}

