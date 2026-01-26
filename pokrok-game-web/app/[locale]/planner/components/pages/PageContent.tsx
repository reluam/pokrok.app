'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { ItemDetailRenderer } from '../details/ItemDetailRenderer'
import { HabitsPage } from '../views/HabitsPage'
import { HabitDetailPage } from '../views/HabitDetailPage'
import { UnifiedDayView } from '../views/UnifiedDayView'
// import { AreaStepsView } from '../views/AreaStepsView' // Replaced with StepsManagementView
import { CalendarView } from '../views/CalendarView'
import { UpcomingView } from '../views/UpcomingView'
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
import { HabitsManagementView } from '../views/HabitsManagementView'
import { StepsManagementView } from '../views/StepsManagementView'
import { HabitDetailInlineView } from '../views/HabitDetailInlineView'
import { ImportantStepsPlanningView } from '../workflows/ImportantStepsPlanningView'
import { DailyReviewWorkflow } from '../DailyReviewWorkflow'
import { OnlyTheImportantView } from '../views/OnlyTheImportantView'
import { MilestonesTimelineView } from '../views/MilestonesTimelineView'
import { OverviewCalendarView } from '../views/OverviewCalendarView'

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
  ];
  
  // Filters state for Goals page
  // Goals removed - no longer needed
  // Goals removed - no longer needed
  
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
      }
      // Goals removed - no goal sections
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('triggerInlineStepCreation', handleTriggerInlineStepCreation)
      return () => {
        window.removeEventListener('triggerInlineStepCreation', handleTriggerInlineStepCreation)
      }
    }
  }, [])
  
  // Metrics removed - were tied to goals which no longer exist
  
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
        // Goals removed - no goals to sort
        
        const renderMainContent = () => {
          // Legacy workflow views removed - using individual calendar views instead
          
          // Check for only_the_important and daily_review as focus views
          if (mainPanelSection === 'focus-only_the_important') {
            return (
              <div className="w-full flex flex-col bg-primary-50" style={{ height: '100%' }}>
                {userId ? (
                  <OnlyTheImportantView
                    userId={userId}
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
            
            // Goals removed - no goals to filter
            const areaHabits = habits.filter((habit: any) => habit.area_id === areaId)
            
            // Calculate area steps statistics
            const areaSteps = dailySteps.filter((step: any) =>
              step.area_id === areaId
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
                      {/* Milestones Timeline - above steps */}
                      <div className="px-4 py-3 mb-4">
                        <MilestonesTimelineView 
                          areaId={areaId}
                          userId={userId}
                          onMilestoneUpdate={() => {
                            // Optionally reload data
                          }}
                        />
                      </div>
                      
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
          
          // Goals removed - goal detail pages no longer exist
          
          switch (mainPanelSection) {
            case 'focus-upcoming':
              // UpcomingView - list of upcoming steps
              return (
                <UpcomingView
                  habits={habits}
                  dailySteps={dailySteps}
                  isLoadingSteps={loadingSteps.size > 0}
                  areas={areas}
                  selectedDayDate={selectedDayDate}
                  setSelectedDayDate={setSelectedDayDate}
                  handleItemClick={handleItemClick}
                  handleHabitToggle={handleHabitToggle}
                  handleStepToggle={handleStepToggle}
                  setSelectedItem={setSelectedItem}
                  setSelectedItemType={setSelectedItemType}
                  onOpenStepModal={handleOpenStepModal}
                  onStepDateChange={onStepDateChange}
                  onStepTimeChange={onStepTimeChange}
                  onStepImportantChange={props.onStepImportantChange}
                  loadingHabits={loadingHabits}
                  loadingSteps={animatingSteps}
                  player={player}
                  userId={userId}
                  maxUpcomingSteps={maxUpcomingSteps}
                  createNewStepTrigger={createNewStepTriggerForSection['focus-upcoming'] || 0}
                  onNewStepCreatedForUpcoming={() => {
                    setCreateNewStepTriggerForSection(prev => ({
                      ...prev,
                      'focus-upcoming': 0
                    }))
                  }}
                  onDailyStepsUpdate={onDailyStepsUpdate}
                />
              )
            case 'focus-month':
            case 'focus-year':
            case 'focus-calendar':
              // Old calendar views replaced with OverviewCalendarView
              return (
                <OverviewCalendarView
                  habits={habits}
                  dailySteps={dailySteps}
                  handleItemClick={handleItemClick}
                  handleHabitToggle={handleHabitToggle}
                  handleStepToggle={handleStepToggle}
                  loadingHabits={loadingHabits}
                  loadingSteps={loadingSteps}
                  animatingSteps={animatingSteps}
                  onOpenStepModal={handleOpenStepModal}
                  onOpenHabitModal={handleOpenHabitModal}
                />
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
            case 'overview':
              return (
                <OverviewCalendarView
                  habits={habits}
                  dailySteps={dailySteps}
                  handleItemClick={handleItemClick}
                  handleHabitToggle={handleHabitToggle}
                  handleStepToggle={handleStepToggle}
                  loadingHabits={loadingHabits}
                  loadingSteps={loadingSteps}
                  animatingSteps={animatingSteps}
                  onOpenStepModal={handleOpenStepModal}
                  onOpenHabitModal={handleOpenHabitModal}
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
              dailySteps={dailySteps}
              expandedAreas={expandedAreas}
              setExpandedAreas={setExpandedAreas}
              expandedGoalSections={expandedGoalSections}
              setExpandedGoalSections={setExpandedGoalSections}
              handleOpenAreasManagementModal={handleOpenAreasManagementModal}
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
                      {mainPanelSection === 'focus-upcoming'
                        ? t('calendar.upcoming') || 'Nadcházející'
                        : mainPanelSection === 'overview' || ['focus-month', 'focus-year', 'focus-calendar'].includes(mainPanelSection)
                        ? t('calendar.overview') || 'Přehled'
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
                      {/* Goals removed */}
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
                <p className="text-3xl font-bold text-primary-600">-</p>
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
              // Goals removed - no action needed
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
            realHabits={habits}
            realSteps={dailySteps}
          />
          </div>
        );
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

          </>
        )
}
