'use client'

import React from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { ChevronLeft, ChevronRight, ChevronDown, Target, CheckCircle, Moon, Trash2, Search, Check, Plus } from 'lucide-react'
import { getIconComponent, AVAILABLE_ICONS } from '@/lib/icon-utils'
import { getLocalDateString, normalizeDate } from '../utils/dateHelpers'

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
  goalStatusRef,
  goalAreaRef,
}: GoalDetailPageProps) {
  const t = useTranslations()

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

  // Handle area selection
  const handleGoalAreaSelect = async (areaId: string | null) => {
    await handleUpdateGoalForDetail(goalId, { areaId: areaId })
    setShowGoalDetailAreaPicker(false)
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
                  className="flex items-center gap-2 px-3 py-1.5 text-sm border-2 border-gray-300 bg-gray-50 text-gray-700 rounded-lg transition-all hover:bg-gray-100"
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
                      <span className="font-medium text-gray-500">
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
                          <p className="text-sm">{t('goals.noCompletedSteps') || 'No completed steps'}</p>
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
      
      {/* Area picker modal for goal area */}
      {showGoalDetailAreaPicker && goalDetailAreaPickerPosition && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowGoalDetailAreaPicker(false)}
          />
          <div 
            className="fixed z-50 bg-white border-2 border-gray-200 rounded-xl shadow-2xl min-w-[200px] max-h-64 overflow-y-auto"
            style={{
              top: `${goalDetailAreaPickerPosition.top}px`,
              left: `${goalDetailAreaPickerPosition.left}px`
            }}
          >
            <button
              type="button"
              onClick={async () => {
                await handleGoalAreaSelect(null)
              }}
              className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors font-medium flex items-center gap-2 ${
                !goal.area_id 
                  ? 'bg-gray-50 text-gray-700 font-semibold' 
                  : 'text-gray-700'
              }`}
            >
              <span>{t('details.goal.noArea') || 'Bez oblasti'}</span>
            </button>
            {areas.map((area) => {
              const IconComponent = getIconComponent(area.icon || 'LayoutDashboard')
              return (
                <button
                  key={area.id}
                  type="button"
                  onClick={async () => {
                    await handleGoalAreaSelect(area.id)
                  }}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors font-medium flex items-center gap-2 ${
                    goal.area_id === area.id 
                      ? 'bg-orange-50 text-orange-700 font-semibold' 
                      : 'text-gray-700'
                  }`}
                >
                  <IconComponent className="w-4 h-4" style={{ color: area.color || '#3B82F6' }} />
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

