'use client'

import React from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { ItemDetailRenderer } from '../details/ItemDetailRenderer'
import { HabitsPage } from '../views/HabitsPage'
import { HabitDetailPage } from '../views/HabitDetailPage'
import { GoalDetailPage } from '../views/GoalDetailPage'
import { UnifiedDayView } from '../views/UnifiedDayView'
import { SettingsPage } from '../SettingsPage'
import { HelpView } from '../views/HelpView'
import { GoalEditingForm } from '../journey/GoalEditingForm'
import { DisplayContent } from '../content/DisplayContent'
import { getIconComponent, AVAILABLE_ICONS } from '@/lib/icon-utils'
import { getLocalDateString, normalizeDate } from '../utils/dateHelpers'
import { LayoutDashboard, ChevronLeft, ChevronDown, Target, CheckCircle, Moon, Trash2, Search, Menu, CheckSquare, Footprints } from 'lucide-react'
import { SidebarNavigation } from '../layout/SidebarNavigation'
import { GoalsManagementView } from '../views/GoalsManagementView'
import { StepsManagementView } from '../views/StepsManagementView'

// NOTE: This component is very large (~2862 lines) and will be further refactored
// For now, it contains the entire renderPageContent logic

interface PageContentProps {
  currentPage: 'main' | 'statistics' | 'achievements' | 'settings' | 'help'
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
    editingHabitAlwaysShow,
    setEditingHabitAlwaysShow,
    editingHabitXpReward,
    setEditingHabitXpReward,
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
    setAreaToDelete,
    isDeletingArea,
    setIsDeletingArea,
    handleUpdateAreaForDetail,
    showAreaDetailIconPicker,
    areaDetailIconPickerPosition,
    setShowAreaDetailIconPicker,
    iconSearchQuery,
    setIconSearchQuery,
    showAreaDetailColorPicker,
    areaDetailColorPickerPosition,
    setShowAreaDetailColorPicker,
    areaDetailTitleValue,
    setAreaDetailTitleValue,
    editingAreaDetailTitle,
    setEditingAreaDetailTitle,
    areaIconRef,
    areaTitleRef,
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
    goalStatusRef,
    goalAreaRef,
    selectedDayDate,
    setStepModalData,
    setShowStepModal,
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
    { id: 'goals' as const, label: t('navigation.goals'), icon: Target },
    { id: 'habits' as const, label: t('navigation.habits'), icon: CheckSquare },
    { id: 'steps' as const, label: t('navigation.steps'), icon: Footprints },
  ];
  
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
              editingHabitAlwaysShow={editingHabitAlwaysShow}
              setEditingHabitAlwaysShow={setEditingHabitAlwaysShow}
              editingHabitXpReward={editingHabitXpReward}
              setEditingHabitXpReward={setEditingHabitXpReward}
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
          // Check if it's an area page
          if (mainPanelSection.startsWith('area-')) {
            const areaId = mainPanelSection.replace('area-', '')
            const area = areas.find(a => a.id === areaId)
            
            if (!area) {
              return (
                <div className="w-full min-h-full flex items-center justify-center bg-orange-50">
                  <div className="text-center">
                    <p className="text-gray-500">{t('navigation.areaNotFound') || 'Oblast nenalezena'}</p>
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
            
            // Filter steps and habits by area
            const areaGoals = goals.filter(goal => goal.area_id === areaId && goal.status === 'active')
            const areaGoalIds = areaGoals.map(goal => goal.id).filter(Boolean)
            
            // Include steps that are directly assigned to the area OR belong to goals in this area
            const areaSteps = dailySteps.filter(step => 
              step.area_id === areaId || 
              (step.goal_id && areaGoalIds.includes(step.goal_id))
            )
            const areaHabits = habits.filter(habit => habit.area_id === areaId)
            
            const IconComponent = getIconComponent(area.icon || 'LayoutDashboard')
            const areaColor = area.color || '#ea580c'
            
            return (
              <div className="w-full min-h-full flex flex-col bg-orange-50">
                {/* Mobile header */}
                <div className="md:hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconComponent className="w-5 h-5" style={{ color: areaColor }} />
                      <h2 className="text-lg font-bold text-gray-900 truncate">{area.name}</h2>
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
                
                {/* Area detail content */}
                <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
                  <div className="p-6">
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
                                className="text-xl font-bold text-gray-900 bg-transparent border-2 border-orange-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500 w-full"
                                autoFocus
                              />
                            ) : (
                              <h1 
                                ref={areaTitleRef as React.RefObject<HTMLHeadingElement>}
                                onClick={() => {
                                  setAreaDetailTitleValue(area.name)
                                  setEditingAreaDetailTitle(true)
                                }}
                                className="text-xl font-bold text-gray-900 cursor-pointer hover:text-orange-600 transition-colors truncate"
                              >
                                {area.name}
                              </h1>
                            )}
                            {area.description && (
                              <p className="text-sm text-gray-600 mt-0.5 truncate">{area.description}</p>
                            )}
                          </div>
                        </div>
                        
                        {/* Controls and statistics - on the right */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {/* Area statistics */}
                          <div className="flex items-center gap-4 text-gray-600">
                            {areaGoals.length > 0 && (
                              <div className="text-sm">
                                <span className="font-semibold">{areaGoals.length}</span> {areaGoals.length === 1 ? (localeCode === 'cs-CZ' ? 'cíl' : 'goal') : (localeCode === 'cs-CZ' ? 'cílů' : 'goals')}
                              </div>
                            )}
                            {areaSteps.length > 0 && (
                              <div className="text-sm">
                                <span className="font-semibold">{areaSteps.length}</span> {areaSteps.length === 1 ? (localeCode === 'cs-CZ' ? 'krok' : 'step') : (localeCode === 'cs-CZ' ? 'kroků' : 'steps')}
                              </div>
                            )}
                            {areaHabits.length > 0 && (
                              <div className="text-sm">
                                <span className="font-semibold">{areaHabits.length}</span> {areaHabits.length === 1 ? (localeCode === 'cs-CZ' ? 'návyk' : 'habit') : (localeCode === 'cs-CZ' ? 'návyků' : 'habits')}
                              </div>
                            )}
                          </div>
                          
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
                    
                    {/* Unified Day View - filtered by area */}
                    <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
                      <UnifiedDayView
                        player={player}
                        goals={areaGoals}
                        habits={areaHabits}
                        dailySteps={areaSteps}
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
                              const isSelected = area.icon === icon.name
                              if (!IconComponent) {
                                console.warn(`Icon component not found for: ${icon.name}`)
                                return null
                              }
                              return (
                                <button
                                  key={icon.name}
                                  type="button"
                                  onClick={async () => {
                                    await handleUpdateAreaForDetail(areaId, { icon: icon.name })
                                    setShowAreaDetailIconPicker(false)
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
                                  ? 'border-gray-800 ring-2 ring-offset-2 ring-orange-400' 
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
                
                {/* Delete area confirmation modal */}
                {showDeleteAreaModal && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 bg-black/20" 
                      onClick={() => {
                        setShowDeleteAreaModal(false)
                        setAreaToDelete(null)
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
                        {t('areas.deleteConfirm') || 'Opravdu chcete smazat tuto oblast?'}
                      </h3>
                      <p className="text-sm text-gray-600 mb-6">
                        {t('areas.deleteConfirmDescription') || 'Cíle, kroky a návyky přiřazené k této oblasti budou odpojeny. Tato akce je nevratná.'}
                      </p>
                      
                      {/* Actions */}
                      <div className="flex gap-3 justify-end">
                        <button
                          onClick={() => {
                            setShowDeleteAreaModal(false)
                            setAreaToDelete(null)
                          }}
                          disabled={isDeletingArea}
                          className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {t('common.cancel') || 'Zrušit'}
                        </button>
                        <button
                          onClick={handleDeleteAreaConfirm}
                          disabled={isDeletingArea}
                          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {isDeletingArea ? (
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
              </div>
            )
          }
          
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
            
              return (
              <GoalDetailPage
                goal={goal}
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
                goalStatusRef={goalStatusRef}
                goalAreaRef={goalAreaRef}
              />
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
                                  // Group goals by area - show all areas even if they have no goals
                                  const goalsByArea = areas.reduce((acc, area) => {
                                    // Include all goals for this area (active, paused, completed)
                                    const areaGoals = sortedGoalsForSidebar.filter(g => g.area_id === area.id)
                                    // Always include area, even if it has no goals
                                    acc[area.id] = { area, goals: areaGoals }
                                    return acc
                                  }, {} as Record<string, { area: any; goals: any[] }>)
                                  
                                  // Goals without area
                                  const goalsWithoutArea = sortedGoalsForSidebar.filter(g => !g.area_id && g.status === 'active')
                                  
                                  return (
                                    <>
                                      {/* Areas with goals */}
                                      {(Object.values(goalsByArea) as Array<{ area: any; goals: any[] }>).map((item: { area: any; goals: any[] }) => {
                                        const { area, goals: areaGoals } = item
                                        const isExpanded = expandedAreas.has(area.id)
                                        const IconComponent = getIconComponent(area.icon || 'LayoutDashboard')
                                        const areaColor = area.color || '#ea580c'
                                        const areaSectionId = `area-${area.id}`
                                        const isAreaSelected = mainPanelSection === areaSectionId
                                        
                                        return (
                                          <div key={area.id}>
                                            <div className="flex items-center gap-1">
                      <button
                                                onClick={() => {
                                                  setMainPanelSection(areaSectionId)
                                                  setMobileMenuOpen(false)
                                                }}
                                                className={`flex-1 flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                                                  isAreaSelected
                                                    ? 'bg-orange-600 text-white'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                                }`}
                                              >
                                                <IconComponent className={`w-5 h-5 flex-shrink-0 ${isAreaSelected ? 'text-white' : ''}`} style={!isAreaSelected ? { color: areaColor } : undefined} />
                                                <span className={`font-medium flex-1 ${isAreaSelected ? 'text-white' : 'text-gray-900'}`}>{area.name}</span>
                      </button>
                      <button
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  // Only allow one area to be expanded at a time
                                                  if (isExpanded) {
                                                    // Collapse this area
                                                    setExpandedAreas(new Set())
                                                  } else {
                                                    // Expand this area and collapse all others
                                                    setExpandedAreas(new Set([area.id]))
                                                  }
                                                }}
                                                className="px-2 py-3 transition-colors text-gray-500 hover:bg-gray-100"
                                              >
                                                <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                              </button>
                                            </div>
                                            
                                            {/* Goals under area */}
                                            {isExpanded && (() => {
                                              // Split goals by status
                                              const activeGoals = areaGoals.filter(g => g.status === 'active')
                                              const pausedGoals = areaGoals.filter(g => g.status === 'paused')
                                              const completedGoals = areaGoals.filter(g => g.status === 'completed')
                                              
                                              console.log('[Mobile Menu - Area Goals]', {
                                                areaId: area.id,
                                                areaName: area.name,
                                                totalGoals: areaGoals.length,
                                                active: activeGoals.length,
                                                paused: pausedGoals.length,
                                                completed: completedGoals.length,
                                                allGoalStatuses: areaGoals.map(g => ({ id: g.id, status: g.status, title: g.title }))
                                              })
                                              
                                              const pausedSectionKey = `${area.id}-paused`
                                              const completedSectionKey = `${area.id}-completed`
                                              const isPausedExpanded = expandedGoalSections.has(pausedSectionKey)
                                              const isCompletedExpanded = expandedGoalSections.has(completedSectionKey)
                                              
                                              return (
                                                <div className="pl-8 space-y-1">
                                                  {/* Active goals - always visible */}
                                                  {activeGoals.map((goal) => {
                                                    const goalSectionId = `goal-${goal.id}`
                                                    const GoalIconComponent = getIconComponent(goal.icon)
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
                                                        <GoalIconComponent className={`w-4 h-4 flex-shrink-0 ${mainPanelSection === goalSectionId ? 'text-white' : 'text-gray-700'}`} style={mainPanelSection !== goalSectionId ? { color: areaColor } : undefined} />
                                                        <span className="font-medium">{goal.title}</span>
                      </button>
                                                    )
                                                  })}
                                                  
                                                  {/* Paused goals section - only show if there are paused goals */}
                                                  {pausedGoals.length > 0 && (
                                                    <div>
                                                      <button
                                                        onClick={(e) => {
                                                          e.stopPropagation()
                                                          const newSet = new Set(expandedGoalSections)
                                                          if (isPausedExpanded) {
                                                            newSet.delete(pausedSectionKey)
                                                          } else {
                                                            newSet.add(pausedSectionKey)
                                                          }
                                                          setExpandedGoalSections(newSet)
                                                        }}
                                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                                                      >
                                                        <ChevronDown className={`w-4 h-4 transition-transform ${isPausedExpanded ? 'rotate-180' : ''}`} />
                                                        <span>{t('goals.filters.status.paused') || 'Odložené'} ({pausedGoals.length})</span>
                                                      </button>
                                                      {isPausedExpanded && (
                                                        <div className="pl-6 space-y-1">
                                                          {pausedGoals.map((goal) => {
                                                            const goalSectionId = `goal-${goal.id}`
                                                            const GoalIconComponent = getIconComponent(goal.icon)
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
                                                                <GoalIconComponent className={`w-4 h-4 flex-shrink-0 ${mainPanelSection === goalSectionId ? 'text-white' : 'text-gray-700'}`} style={mainPanelSection !== goalSectionId ? { color: areaColor } : undefined} />
                                                                <span className="font-medium">{goal.title}</span>
                                                              </button>
                                                            )
                                                          })}
                    </div>
                                                      )}
                  </div>
                                                  )}
                                                  
                                                  {/* Completed goals section - only show if there are completed goals */}
                                                  {completedGoals.length > 0 && (
                                                    <div>
                                                      <button
                                                        onClick={(e) => {
                                                          e.stopPropagation()
                                                          const newSet = new Set(expandedGoalSections)
                                                          if (isCompletedExpanded) {
                                                            newSet.delete(completedSectionKey)
                                                          } else {
                                                            newSet.add(completedSectionKey)
                                                          }
                                                          setExpandedGoalSections(newSet)
                                                        }}
                                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                                                      >
                                                        <ChevronDown className={`w-4 h-4 transition-transform ${isCompletedExpanded ? 'rotate-180' : ''}`} />
                                                        <span>{t('goals.filters.status.completed') || 'Hotové'} ({completedGoals.length})</span>
                                                      </button>
                                                      {isCompletedExpanded && (
                                                        <div className="pl-6 space-y-1">
                                                          {completedGoals.map((goal) => {
                                                            const goalSectionId = `goal-${goal.id}`
                                                            const GoalIconComponent = getIconComponent(goal.icon)
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
                                                                <GoalIconComponent className={`w-4 h-4 flex-shrink-0 ${mainPanelSection === goalSectionId ? 'text-white' : 'text-gray-700'}`} style={mainPanelSection !== goalSectionId ? { color: areaColor } : undefined} />
                                                                <span className="font-medium">{goal.title}</span>
                                                              </button>
                                                            )
                                                          })}
                                                        </div>
                                                      )}
                                                    </div>
                                                  )}
                                                </div>
                                              )
                                            })()}
                  </div>
                                        )
                                      })}
                                      
                                      {/* Goals without area */}
                                      {goalsWithoutArea.map((goal) => {
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
          <div className="w-full h-full flex bg-white overflow-hidden">
            {/* Left sidebar - Navigation - Hidden on mobile */}
            <SidebarNavigation
              sidebarCollapsed={sidebarCollapsed}
              setSidebarCollapsed={setSidebarCollapsed}
              mainPanelSection={mainPanelSection}
              setMainPanelSection={setMainPanelSection}
              sidebarItems={sidebarItems}
              areas={areas}
              sortedGoalsForSidebar={sortedGoalsForSidebar}
              expandedAreas={expandedAreas}
              setExpandedAreas={setExpandedAreas}
              expandedGoalSections={expandedGoalSections}
              setExpandedGoalSections={setExpandedGoalSections}
              handleOpenAreasManagementModal={handleOpenAreasManagementModal}
              handleCreateGoal={handleCreateGoal}
              handleOpenStepModal={handleOpenStepModal}
              handleOpenHabitModal={handleOpenHabitModal}
              handleOpenAreaEditModal={handleOpenAreaEditModal}
              showCreateMenu={showCreateMenu}
              setShowCreateMenu={setShowCreateMenu}
              createMenuButtonRef={createMenuButtonRef}
            />

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
                              {/* Areas in mobile menu for other sections */}
                              {(() => {
                                // Group goals by area
                                const goalsByArea = areas.reduce((acc, area) => {
                                  const areaGoals = sortedGoalsForSidebar.filter(g => g.area_id === area.id && g.status === 'active')
                                  if (areaGoals.length > 0) {
                                    acc[area.id] = { area, goals: areaGoals }
                                  }
                                  return acc
                                }, {} as Record<string, { area: any; goals: any[] }>)
                                
                                // Goals without area
                                const goalsWithoutArea = sortedGoalsForSidebar.filter(g => !g.area_id && g.status === 'active')
                                
                                return (
                                  <>
                                    {(Object.values(goalsByArea) as Array<{ area: any; goals: any[] }>).map((item: { area: any; goals: any[] }) => {
                                      const { area, goals: areaGoals } = item
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
                                              ? 'bg-orange-600 text-white'
                                              : 'text-gray-700 hover:bg-gray-100'
                                          }`}
                                        >
                                          <IconComponent className={`w-5 h-5 flex-shrink-0 ${mainPanelSection === areaSectionId ? 'text-white' : ''}`} style={mainPanelSection !== areaSectionId ? { color: areaColor } : undefined} />
                                          <span className="font-medium">{area.name}</span>
                                        </button>
                                      )
                                    })}
                                    
                                    {goalsWithoutArea.map((goal) => {
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
      }

      case 'statistics': {
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
      }

      case 'achievements': {
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
          />
        );
      }

      case 'help': {
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
            onOpenAreasManagement={() => {
              setCurrentPage('main')
              handleOpenAreasManagementModal()
            }}
            realGoals={goals}
            realHabits={habits}
            realSteps={dailySteps}
          />
        );
      }

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
                        if ((habit.frequency === 'custom' || habit.frequency === 'weekly') && habit.selected_days) {
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
                        editingHabitAlwaysShow={editingHabitAlwaysShow}
                        setEditingHabitAlwaysShow={setEditingHabitAlwaysShow}
                        editingHabitXpReward={editingHabitXpReward}
                        setEditingHabitXpReward={setEditingHabitXpReward}
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
          </>
        )
}
