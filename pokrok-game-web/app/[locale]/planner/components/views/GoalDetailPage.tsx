'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { ChevronLeft, Target, CheckCircle, Trash2, Search, Check, Plus, Edit, Pencil, AlertCircle } from 'lucide-react'
import { getIconComponent, AVAILABLE_ICONS } from '@/lib/icon-utils'
import { StepsManagementView } from './StepsManagementView'

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
  // Refs
  goalIconRef: React.RefObject<HTMLDivElement>
  goalTitleRef: React.RefObject<HTMLDivElement>
  goalDescriptionRef: React.RefObject<HTMLDivElement>
  goalDateRef: React.RefObject<HTMLDivElement>
  goalStartDateRef: React.RefObject<HTMLDivElement>
  goalStatusRef: React.RefObject<HTMLDivElement>
  goalAreaRef: React.RefObject<HTMLDivElement>
  selectedDayDate: Date
  setSelectedDayDate: (date: Date) => void
  selectedYear: number
  setSelectedYear: (year: number) => void
  visibleSections?: string[]
  setShowDatePickerModal: (show: boolean) => void
  setSelectedItemType: (type: 'step' | 'habit' | 'goal' | 'stat' | null) => void
  setStepModalData: (data: any) => void
  setShowStepModal: (show: boolean) => void
  onOpenStepModal?: (date?: string, step?: any) => void
  userId?: string | null
  player?: any
  onStepImportantChange?: (stepId: string, isImportant: boolean) => Promise<void>
  createNewStepTrigger?: number
  setCreateNewStepTrigger?: (fn: (prev: number) => number) => void
  onNewStepCreated?: () => void
  stepsCacheVersion: Record<string, number>
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
  onStepImportantChange?: (stepId: string, isImportant: boolean) => Promise<void>
  createNewStepTrigger?: number
  setCreateNewStepTrigger?: (fn: (prev: number) => number) => void
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
  selectedDayDate,
  setStepModalData,
  setShowStepModal,
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
  goalIconRef,
  goalTitleRef,
  goalDescriptionRef,
  goalDateRef,
  goalStartDateRef,
  goalStatusRef,
  goalAreaRef,
  selectedDayDate: selectedDayDateProp,
  setSelectedDayDate: setSelectedDayDateProp,
  selectedYear,
  setSelectedYear,
  visibleSections,
  setShowDatePickerModal,
  setSelectedItemType,
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

  // Find the goal from goals array
  const goal = goals.find(g => g.id === goalId)
  if (!goal) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-gray-500">Cíl nebyl nalezen</span>
      </div>
    )
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
  
  // Calculate trend based on overdue vs completed steps in last 7 days
  const { trendValue, completedSteps7Days, overdueSteps7Days } = useMemo(() => {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Filter steps for this goal
    const goalSteps = dailySteps.filter(step => step.goal_id === goalId)

    // Filter steps from last 7 days
    const recentSteps = goalSteps.filter(step => {
      const stepDate = new Date(step.scheduled_date)
      return stepDate >= sevenDaysAgo && stepDate <= now
    })

    // Count completed steps in last 7 days
    const completed = recentSteps.filter(step => step.completed).length

    // Count overdue steps (scheduled before today but not completed)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const overdue = recentSteps.filter(step => {
      const stepDate = new Date(step.scheduled_date)
      stepDate.setHours(0, 0, 0, 0)
      return stepDate < today && !step.completed
    }).length

    // Calculate trend: positive when completed > overdue, negative when overdue > completed
    // Range from -100 to +100
    const total = completed + overdue
    const trend = total > 0 ? ((completed - overdue) / total) * 100 : 0

    return {
      trendValue: trend,
      completedSteps7Days: completed,
      overdueSteps7Days: overdue
    }
  }, [dailySteps, goalId])

  // Legacy progress for backward compatibility (total completion)
  const { totalSteps, completedSteps } = useMemo(() => {
  const goalSteps = dailySteps.filter(step => step.goal_id === goalId)
    const total = goalSteps.length
    const completed = goalSteps.filter(step => step.completed).length
    return { totalSteps: total, completedSteps: completed }
  }, [dailySteps, goalId])

  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

  // Filter steps for this goal
  const goalSteps = useMemo(() => {
    return dailySteps.filter(step => step.goal_id === goalId)
  }, [dailySteps, goalId])

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
        <div className="p-6">
          {/* Goal header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                {(() => {
                  const IconComponent = getIconComponent(goal.icon)
                  const isPastDeadline = isGoalPastDeadline(goal)
                  return (
                    <>
                      <div
                  ref={goalIconRef}
                        className={`flex items-center justify-center w-10 h-10 rounded-playful-md ${
                          isPastDeadline ? 'bg-red-100' : 'bg-primary-100'
                        }`}
                      >
                        <IconComponent className={`w-5 h-5 ${
                          isPastDeadline ? 'text-red-600' : 'text-primary-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                {editingGoalDetailTitle ? (
                  <input
                            ref={goalTitleRef}
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
                    </>
                  )
                })()}
                  </div>

              {/* Status indicator */}
              <div className="flex items-center gap-2">
                {goal.status === 'completed' && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-playful-sm text-xs font-medium">
                    <CheckCircle className="w-3 h-3" />
                    <span>{t('common.completed') || 'Dokončeno'}</span>
                </div>
                )}
                {goal.status === 'active' && isGoalPastDeadline(goal) && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-playful-sm text-xs font-medium">
                    <AlertCircle className="w-3 h-3" />
                    <span>{t('goals.deadlinePassed') || 'Termín prošel'}</span>
              </div>
                )}
              </div>
            </div>

            {/* Goal description */}
            <div className="mb-4">
            {editingGoalDetailDescription ? (
              <textarea
                  ref={goalDescriptionRef}
                value={goalDetailDescriptionValue}
                onChange={(e) => setGoalDetailDescriptionValue(e.target.value)}
                  onBlur={async () => {
                    if (goalDetailDescriptionValue.trim() !== (goal.description || '')) {
                      await handleUpdateGoalForDetail(goalId, { description: goalDetailDescriptionValue.trim() })
                    }
                    setEditingGoalDetailDescription(false)
                  }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
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
                  ref={goalDescriptionRef}
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
              
            {/* Goal metadata */}
            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
              {goal.target_date && (
                <div className="flex items-center gap-1">
                  <span>{t('goals.targetDate') || 'Termín'}:</span>
                  <span className={isGoalPastDeadline(goal) ? 'text-red-600 font-medium' : ''}>
                    {new Date(goal.target_date).toLocaleDateString(localeCode)}
                        </span>
                </div>
              )}
              {goal.start_date && (
                <div className="flex items-center gap-1">
                  <span>{t('goals.startDate') || 'Začátek'}:</span>
                  <span>{new Date(goal.start_date).toLocaleDateString(localeCode)}</span>
                      </div>
              )}
              {goal.area_id && (() => {
                const area = areas.find(a => a.id === goal.area_id)
                return area ? (
                  <div className="flex items-center gap-1">
                    <span>{t('common.area') || 'Oblast'}:</span>
                    <span>{area.name}</span>
                    </div>
                ) : null
              })()}
                </div>
                          </div>

          {/* Trend indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 font-playful">
                {t('goals.trend') || 'Trend posledních 7 dní'}
                            </span>
              <span className={`text-sm font-playful ${
                trendValue > 10 ? 'text-green-600' :
                trendValue < -10 ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {trendValue > 0 ? '+' : ''}{Math.round(trendValue)}%
                  </span>
                </div>
            <div className="w-full bg-gray-200 rounded-playful-full h-3 relative overflow-hidden">
              {/* Negative trend (left, red) */}
              <div
                className="absolute left-0 top-0 h-full bg-red-500 rounded-l-playful-full transition-all duration-300"
                style={{ width: `${Math.max(0, Math.min(50, 50 - trendValue/2))}%` }}
              />
              {/* Neutral trend (center, yellow) */}
              <div
                className="absolute top-0 h-full bg-yellow-500 transition-all duration-300"
                style={{
                  left: `${Math.max(0, Math.min(50, 50 - trendValue/2))}%`,
                  width: `${Math.max(0, Math.min(100, 100 - Math.abs(trendValue)))}%`
                }}
              />
              {/* Positive trend (right, green) */}
              <div
                className="absolute right-0 top-0 h-full bg-green-500 rounded-r-playful-full transition-all duration-300"
                style={{ width: `${Math.max(0, Math.min(50, 50 + trendValue/2))}%` }}
              />
              {/* Indicator line */}
              <div
                className="absolute top-0 w-0.5 bg-black h-full transition-all duration-300"
                style={{ left: `${50 + trendValue/2}%` }}
              />
                  </div>
            <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
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
                    setCreateNewStepTrigger(current => current + 1)
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
              dailySteps={goalSteps}
              goals={[goal]}
                  areas={areas}
              userId={userId}
              player={player}
                  onDailyStepsUpdate={onDailyStepsUpdate}
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
              onStepDateChange={handleStepDateChange}
              onStepTimeChange={handleStepTimeChange}
                  createNewStepTrigger={createNewStepTrigger}
              onNewStepCreated={onNewStepCreated}
                  hideHeader={true}
              showCompleted={true}
                  goalFilter={goalId}
                  />
              </div>
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
            className="absolute z-50 bg-white border border-gray-300 rounded-playful-md shadow-lg p-4"
            style={{ 
              top: goalDetailDatePickerPosition.top,
              left: goalDetailDatePickerPosition.left
            }}
          >
            {/* Date picker content would go here */}
            <div className="text-center py-4">
              <span className="text-sm text-gray-600">Date picker placeholder</span>
            </div>
          </div>
        </>
      )}
      
      {/* Start date picker modal */}
      {showGoalDetailStartDatePicker && goalDetailStartDatePickerPosition && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowGoalDetailStartDatePicker(false)}
          />
          <div 
            className="absolute z-50 bg-white border border-gray-300 rounded-playful-md shadow-lg p-4"
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
        </>
      )}
      
      {/* Status picker modal */}
      {showGoalDetailStatusPicker && goalDetailStatusPickerPosition && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowGoalDetailStatusPicker(false)}
          />
          <div 
            className="absolute z-50 bg-white border border-gray-300 rounded-playful-md shadow-lg p-4"
            style={{
              top: goalDetailStatusPickerPosition.top,
              left: goalDetailStatusPickerPosition.left
            }}
          >
            {/* Status picker content would go here */}
            <div className="text-center py-4">
              <span className="text-sm text-gray-600">Status picker placeholder</span>
            </div>
          </div>
        </>
      )}
      
      {/* Area picker modal */}
      {showGoalDetailAreaPicker && goalDetailAreaPickerPosition && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowGoalDetailAreaPicker(false)}
          />
          <div 
            className="absolute z-50 bg-white border border-gray-300 rounded-playful-md shadow-lg p-4"
            style={{
              top: goalDetailAreaPickerPosition.top,
              left: goalDetailAreaPickerPosition.left
            }}
          >
            {/* Area picker content would go here */}
            <div className="text-center py-4">
              <span className="text-sm text-gray-600">Area picker placeholder</span>
            </div>
          </div>
        </>
      )}
      
      {/* Icon picker modal */}
      {showGoalDetailIconPicker && goalDetailIconPickerPosition && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowGoalDetailIconPicker(false)}
          />
          <div 
            className="absolute z-50 bg-white border border-gray-300 rounded-playful-md shadow-lg p-4 max-w-sm"
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
        </>
      )}
    </div>
  )
}