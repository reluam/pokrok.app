'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { ChevronLeft, ChevronRight, ChevronDown, Target, CheckCircle, Moon, Trash2, Search, Check, Plus, Edit, Pencil, Minus, Repeat } from 'lucide-react'
import { getIconComponent, AVAILABLE_ICONS } from '@/lib/icon-utils'
import { getLocalDateString, normalizeDate } from '../utils/dateHelpers'
import { MetricModal } from '../modals/MetricModal'
import { groupMetricsByUnits, convertUnit, type GroupedMetric } from '@/lib/metric-units'

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
}: GoalDetailPageProps) {
  // State for inline editing of current values
  const [editingCurrentValueForMetric, setEditingCurrentValueForMetric] = React.useState<Record<string, boolean>>({})
  const [editingCurrentValue, setEditingCurrentValue] = React.useState<Record<string, number>>({})
  const [metricsExpanded, setMetricsExpanded] = React.useState(false)
  const [stepsExpanded, setStepsExpanded] = React.useState(false)
  const [isProgressExpanded, setIsProgressExpanded] = React.useState(false)
  const [userSettings, setUserSettings] = useState<{ default_currency?: string; weight_unit_preference?: 'kg' | 'lbs' } | null>(null)
  const t = useTranslations()
  
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
              return <IconComponent className="w-5 h-5 text-primary-600" />
            })()}
            <h2 className="text-lg font-bold text-black font-playful truncate">{goal.title}</h2>
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
                  <h1 
                    ref={goalTitleRef as React.RefObject<HTMLHeadingElement>}
                    onClick={() => setEditingGoalDetailTitle(true)}
                    className="text-2xl font-bold text-black font-playful cursor-pointer hover:text-primary-600 transition-colors"
                  >
                    {goal.title}
                  </h1>
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
              // Ensure values are numbers for comparison
              const currentValue = typeof metric.current_value === 'number' 
                ? metric.current_value 
                : parseFloat(metric.current_value) || 0
              const targetValue = typeof metric.target_value === 'number'
                ? metric.target_value
                : parseFloat(metric.target_value) || 0
              const initialValue = typeof metric.initial_value === 'number'
                ? metric.initial_value
                : parseFloat(metric.initial_value) || 0
              
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
              
              const isEditingCurrentValue = editingCurrentValueForMetric[metric.id] || false
              const editingValue = editingCurrentValue[metric.id] !== undefined 
                ? editingCurrentValue[metric.id] 
                : currentValue
              
              const handleCurrentValueSave = async () => {
                const newValue = parseFloat(editingValue.toString()) || 0
                await handleMetricUpdate(metric.id, goalId, {
                  name: metric.name,
                  currentValue: newValue,
                  targetValue: metric.target_value,
                  initialValue: metric.initial_value ?? 0,
                  incrementalValue: metric.incremental_value,
                  unit: metric.unit
                })
                setEditingCurrentValueForMetric(prev => {
                  const newState = { ...prev }
                  delete newState[metric.id]
                  return newState
                })
                setEditingCurrentValue(prev => {
                  const newState = { ...prev }
                  delete newState[metric.id]
                  return newState
                })
              }
              
              const handleCurrentValueCancel = () => {
                setEditingCurrentValueForMetric(prev => {
                  const newState = { ...prev }
                  delete newState[metric.id]
                  return newState
                })
                setEditingCurrentValue(prev => {
                  const newState = { ...prev }
                  delete newState[metric.id]
                  return newState
                })
              }
              
              const handleStartEditing = () => {
                setEditingCurrentValueForMetric(prev => ({ ...prev, [metric.id]: true }))
                setEditingCurrentValue(prev => ({ ...prev, [metric.id]: currentValue }))
              }
              
              return (
                <div
                  key={metric.id}
                  onClick={() => {
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
                  }}
                  className={`box-playful-highlight flex items-start gap-3 p-4 cursor-pointer transition-all duration-300 ${
                    isCompleted
                      ? 'bg-primary-100 opacity-75'
                      : 'bg-white hover:bg-primary-50'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-medium text-sm font-playful ${
                        isCompleted 
                          ? 'line-through text-gray-400' 
                          : 'text-black'
                      }`}>
                        {metric.name}
                      </span>
                    </div>
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1 text-xs text-gray-600 font-playful">
                        <div className="flex items-center gap-2">
                          {hasTarget ? (
                            <>
                              {isEditingCurrentValue ? (
                                <div 
                                  className="flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={editingValue}
                                    onChange={(e) => setEditingCurrentValue(prev => ({ ...prev, [metric.id]: parseFloat(e.target.value) || 0 }))}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleCurrentValueSave()
                                      } else if (e.key === 'Escape') {
                                        handleCurrentValueCancel()
                                      }
                                    }}
                                    onBlur={handleCurrentValueSave}
                                    onClick={(e) => e.stopPropagation()}
                                    onFocus={(e) => e.stopPropagation()}
                                    autoFocus
                                    className="w-20 px-2 py-1 text-xs border-2 border-primary-500 rounded-playful-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-black"
                                  />
                                  <span>{metric.unit}</span>
                                </div>
                              ) : (
                                <div 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleStartEditing()
                                  }}
                                  className="flex items-center gap-1 cursor-pointer hover:text-primary-600 transition-colors"
                                  title={t('common.metrics.currentValue') || 'Klikněte pro úpravu'}
                                >
                                  <Pencil className="w-3 h-3 text-gray-400" />
                                  <span className="hover:underline">{formatNumber(currentValue)} {metric.unit}</span>
                                </div>
                              )}
                              <span> / {formatNumber(targetValue)} {metric.unit}</span>
                            </>
                          ) : (
                            <div 
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStartEditing()
                              }}
                              className="flex items-center gap-1 cursor-pointer hover:text-primary-600 transition-colors"
                              title={t('common.metrics.currentValue') || 'Klikněte pro úpravu'}
                            >
                              <Pencil className="w-3 h-3 text-gray-400" />
                              <span className="hover:underline">{t('common.metrics.remains') || 'Remains'}: {formatNumber(currentValue)} {metric.unit}</span>
                            </div>
                          )}
                        </div>
                        {hasTarget && (
                          <span className="text-primary-600 font-semibold">{Math.round(progress)}%</span>
                        )}
                      </div>
                      {hasTarget && (
                        <div className="w-full bg-white border-2 border-primary-500 rounded-playful-sm h-2 overflow-hidden">
                          <div 
                            className="bg-primary-500 h-full rounded-playful-sm transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
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
              <div className="box-playful-highlight p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div 
                    className="flex items-center gap-2 flex-1 cursor-pointer"
                    onClick={() => setMetricsExpanded(!metricsExpanded)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setMetricsExpanded(!metricsExpanded)
                      }}
                      className="btn-playful-base w-6 h-6 flex items-center justify-center text-primary-600 bg-white hover:bg-primary-50"
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
                      setMetricModalData({ id: null, name: '', currentValue: 0, targetValue: 0, initialValue: 0, incrementalValue: 1, unit: '', type: 'number' })
                      setEditingMetricName('')
                      setEditingMetricType('number')
                      setEditingMetricCurrentValue(0)
                      setEditingMetricTargetValue(0)
                      setEditingMetricInitialValue(0)
                      setEditingMetricIncrementalValue(1)
                      setEditingMetricUnit('')
                      setShowMetricModal(true)
                    }}
                    className="btn-playful-base w-8 h-8 flex items-center justify-center text-primary-600 bg-white hover:bg-primary-50"
                    title={t('common.metrics.create')}
                  >
                    <Plus className="w-5 h-5" strokeWidth={2.5} />
                  </button>
                </div>
                
                {totalMetrics > 0 && metricsExpanded && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-6">
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
            
            // Filter recurring steps to show only the nearest instance
            // Group instances by their original recurring step template
            // Include both completed and non-completed instances to find the nearest one
            const recurringStepInstances = goalSteps.filter(step => {
              // Show instances (non-recurring steps with title containing " - ")
              // Include both completed and non-completed instances
              // Include instances with or without date
              // Exclude hidden steps
              if (!step.frequency && step.title && step.title.includes(' - ') && step.is_hidden !== true) {
                return true
              }
              return false
            })
            
            // Group instances by original recurring step
            const instancesByRecurringStep = new Map<string, any[]>()
            recurringStepInstances.forEach(step => {
              if (!step.title) return
              const titlePrefix = step.title.split(' - ')[0]
              const originalStep = goalSteps.find(s => 
                s.frequency && 
                s.frequency !== null && 
                s.title === titlePrefix &&
                s.user_id === step.user_id &&
                s.is_hidden === true // Recurring step template is hidden
              )
              
              if (originalStep) {
                const key = originalStep.id
                if (!instancesByRecurringStep.has(key)) {
                  instancesByRecurringStep.set(key, [])
                }
                instancesByRecurringStep.get(key)!.push(step)
              }
            })
            
            // Get only the nearest instance for each recurring step
            // Prefer non-completed instances, but show completed if no non-completed exist
            const nearestInstances = new Set<string>()
            instancesByRecurringStep.forEach((instances, recurringStepId) => {
              // Sort instances by date (oldest first, instances without date go to end)
              instances.sort((a, b) => {
                const dateA = a.date ? new Date(normalizeDate(a.date)).getTime() : Number.MAX_SAFE_INTEGER
                const dateB = b.date ? new Date(normalizeDate(b.date)).getTime() : Number.MAX_SAFE_INTEGER
                return dateA - dateB
              })
              
              // Prefer non-completed instances
              const nonCompletedInstances = instances.filter((inst: any) => !inst.completed)
              const instancesToConsider = nonCompletedInstances.length > 0 ? nonCompletedInstances : instances
              
              // Add only the first (nearest) instance
              if (instancesToConsider.length > 0) {
                nearestInstances.add(instancesToConsider[0].id)
              }
            })
            
            // Filter steps: exclude hidden templates and show only nearest instances for recurring steps
            const filteredGoalSteps = goalSteps.filter(step => {
              // Exclude hidden recurring step templates
              if (step.is_hidden === true && step.frequency !== null) {
                return false
              }
              
              // For recurring step instances, show only the nearest one
              if (!step.frequency && step.title && step.title.includes(' - ')) {
                return nearestInstances.has(step.id)
              }
              
              // Include all other steps
              return true
            })
            
            // Categorize steps into Remaining and Done
            // Steps that are animating should stay in Remaining until animation completes
            const remainingSteps = filteredGoalSteps.filter(s => !s.completed || animatingSteps.has(s.id))
            const doneSteps = filteredGoalSteps.filter(s => s.completed && !animatingSteps.has(s.id))
            
            const totalSteps = filteredGoalSteps.length
            const remainingCount = remainingSteps.length
            const doneCount = doneSteps.length
            const remainingPercentage = totalSteps > 0 ? Math.round((remainingCount / totalSteps) * 100) : 0
            const donePercentage = totalSteps > 0 ? Math.round((doneCount / totalSteps) * 100) : 0
            const averageProgress = donePercentage // Progress kroků je procento dokončených
            
            // Render step card
            const renderStepCard = (step: any) => {
              const stepDate = step.date ? new Date(normalizeDate(step.date)) : null
              if (stepDate) stepDate.setHours(0, 0, 0, 0)
              const isOverdue = stepDate && stepDate.getTime() < today.getTime() && !step.completed
              const isToday = stepDate && stepDate.toDateString() === today.toDateString()
              const stepDateFormatted = stepDate ? formatStepDate(stepDate) : null
              const isAnimating = animatingSteps.has(step.id)
              
              // Check if this is a recurring step instance
              const isRecurringInstance = !step.frequency && step.title && step.title.includes(' - ')
              // Find the original recurring step template
              const originalRecurringStep = isRecurringInstance ? goalSteps.find(s => {
                if (!step.title) return false
                const titlePrefix = step.title.split(' - ')[0]
                return s.frequency && 
                       s.frequency !== null && 
                       s.title === titlePrefix &&
                       s.user_id === step.user_id &&
                       s.is_hidden === true
              }) : null
              
              return (
                <div
                  key={step.id}
                  onClick={() => handleItemClick(step, 'step')}
                  className={`box-playful-highlight flex items-start gap-3 p-4 cursor-pointer transition-all duration-300 ${
                    isAnimating
                      ? step.completed
                        ? 'bg-primary-100 animate-pulse scale-110'
                        : 'bg-primary-100 animate-pulse scale-110'
                      : step.completed
                        ? 'bg-primary-100 opacity-75'
                        : isOverdue
                          ? 'bg-red-50 hover:bg-red-100'
                          : 'bg-white hover:bg-primary-50'
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
                    className={`w-5 h-5 rounded-playful-sm border-2 flex items-center justify-center transition-all flex-shrink-0 mt-0.5 ${
                      isAnimating
                        ? step.completed
                          ? 'bg-primary-500 border-primary-500 scale-110'
                          : 'bg-primary-500 border-primary-500 scale-110'
                        : step.completed 
                          ? 'bg-primary-500 border-primary-500' 
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
                    ) : (step.completed || isAnimating) ? (
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    ) : null}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-medium text-sm font-playful ${
                        step.completed 
                          ? 'line-through text-gray-400' 
                          : isOverdue 
                            ? 'text-red-600 font-semibold' 
                            : 'text-black'
                      }`}>
                        {step.title}
                      </span>
                      {isRecurringInstance && originalRecurringStep && (
                        <span title={t('steps.recurring.recurring') || 'Opakující se krok'}>
                          <Repeat className="w-4 h-4 text-primary-600 flex-shrink-0" />
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
                    {step.description && (
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2 font-playful">{step.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-500 font-playful">
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
              <div className="box-playful-highlight p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div 
                    className="flex items-center gap-2 flex-1 cursor-pointer"
                    onClick={() => setStepsExpanded(!stepsExpanded)}
                  >
                  <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setStepsExpanded(!stepsExpanded)
                      }}
                      className="btn-playful-base w-6 h-6 flex items-center justify-center text-primary-600 bg-white hover:bg-primary-50"
                      title={stepsExpanded ? 'Sbalit kroky' : 'Rozbalit kroky'}
                    >
                      {stepsExpanded ? (
                        <ChevronDown className="w-4 h-4" strokeWidth={2.5} />
                      ) : (
                        <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
                      )}
                    </button>
                    <h2 className="text-xl font-bold text-black font-playful">
                      {t('common.steps')}
                    </h2>
                    {totalSteps > 0 && (
                      <span className="text-sm text-gray-600 font-playful">
                        {Math.round(averageProgress)}% ({totalSteps} {totalSteps === 1 ? t('common.step') : t('common.steps')}, {remainingCount} {t('common.remaining')})
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      const defaultDate = getLocalDateString(selectedDayDate)
                      setStepModalData({
                        id: null,
                        title: '',
                        description: '',
                        date: defaultDate,
                        goalId: goalId,
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
                    }}
                    className="btn-playful-base w-8 h-8 flex items-center justify-center text-primary-600 bg-white hover:bg-primary-50"
                    title={t('focus.addStep')}
                  >
                    <Plus className="w-5 h-5" strokeWidth={2.5} />
                  </button>
                </div>
                
                {/* Two Column Layout */}
                {stepsExpanded && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  {/* Remaining Column */}
                  <div className="flex flex-col">
                    <div className="mb-4 pb-3 border-b-2 border-primary-500">
                      <h3 className="text-lg font-bold text-primary-600 mb-1 font-playful">
                        {t('details.goal.remainingSteps')}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 font-playful">
                        <span className="font-semibold">{remainingCount}</span>
                        <span>z {totalSteps}</span>
                        <span className="text-primary-600 font-semibold">({remainingPercentage}%)</span>
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
                    <div className="mb-4 pb-3 border-b-2 border-primary-500">
                      <h3 className="text-lg font-bold text-primary-600 mb-1 font-playful">
                        {t('details.goal.done')}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 font-playful">
                        <span className="font-semibold">{doneCount}</span>
                        <span>z {totalSteps}</span>
                        <span className="text-primary-600 font-semibold">({donePercentage}%)</span>
                      </div>
                    </div>
                    <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-2">
                      {doneSteps.length > 0 ? (
                        doneSteps.map(renderStepCard)
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          <p className="text-sm">{t('goals.noCompletedSteps') || 'No completed steps'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
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
            
            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleGoalDateSave}
                className="btn-playful-base flex-1 px-3 py-1.5 text-xs font-medium text-primary-600 bg-white hover:bg-primary-50"
              >
                {t('common.save')}
              </button>
              {goal.target_date && (
                <button
                  onClick={async () => {
                    await handleUpdateGoalForDetail(goalId, { target_date: null })
                    setShowGoalDetailDatePicker(false)
                  }}
                  className="btn-playful-danger px-3 py-1.5 text-xs font-medium"
                >
                  {t('common.delete')}
                </button>
              )}
              <button
                onClick={() => {
                  setShowGoalDetailDatePicker(false)
                  setSelectedGoalDate(goal.target_date ? new Date(goal.target_date) : null)
                }}
                className="btn-playful-base px-3 py-1.5 text-xs font-medium text-gray-600 bg-white hover:bg-primary-50"
              >
                {t('common.cancel')}
              </button>
            </div>
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
                      onClick={() => handleGoalStartDateSelect(day)}
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
            
            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleGoalStartDateSave}
                className="btn-playful-base flex-1 px-3 py-1.5 text-xs font-medium text-primary-600 bg-white hover:bg-primary-50"
              >
                {t('common.save')}
              </button>
              {goal.start_date && (
                <button
                  onClick={async () => {
                    await handleUpdateGoalForDetail(goalId, { start_date: null })
                    setShowGoalDetailStartDatePicker(false)
                  }}
                  className="btn-playful-base px-3 py-1.5 text-xs font-medium text-gray-600 bg-white hover:bg-gray-50"
                >
                  {t('common.delete')}
                </button>
              )}
              <button
                onClick={() => {
                  setShowGoalDetailStartDatePicker(false)
                  setSelectedGoalStartDate(goal.start_date ? new Date(goal.start_date) : null)
                }}
                className="btn-playful-base px-3 py-1.5 text-xs font-medium text-gray-600 bg-white hover:bg-gray-50"
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

