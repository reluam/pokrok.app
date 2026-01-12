'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { LayoutDashboard, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Target, Plus, Footprints, CheckSquare, Settings, Calendar, CalendarRange, CalendarDays, CalendarCheck, BarChart3, ListTodo, Edit, AlertCircle } from 'lucide-react'
import { getIconComponent } from '@/lib/icon-utils'

interface SidebarNavigationProps {
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  mainPanelSection: string
  setMainPanelSection: (section: string) => void
  sidebarItems: Array<{ id: string; label: string; icon: any }>
  areas: any[]
  sortedGoalsForSidebar: any[]
  expandedAreas: Set<string>
  setExpandedAreas: (areas: Set<string>) => void
  expandedGoalSections: Set<string>
  setExpandedGoalSections: (sections: Set<string>) => void
  handleOpenAreasManagementModal: () => void
  handleCreateGoal: () => void
  handleOpenStepModal: () => void
  handleOpenHabitModal: (habit: any) => void
  handleOpenAreaEditModal: (area?: any) => void
  showCreateMenu: boolean
  setShowCreateMenu: (show: boolean) => void
  createMenuButtonRef: React.RefObject<HTMLButtonElement>
  isOnboardingAddMenuStep?: boolean
  isOnboardingAddMenuGoalStep?: boolean
  isOnboardingClickGoalStep?: boolean
  createMenuRef?: React.RefObject<HTMLDivElement>
  goalsSectionRef?: React.RefObject<HTMLDivElement>
  onOnboardingAreaClick?: () => void
  onOnboardingGoalClick?: () => void
  areaButtonRefs?: Map<string, React.RefObject<HTMLButtonElement>>
  goalButtonRefs?: Map<string, React.RefObject<HTMLButtonElement>>
  onGoalClick?: (goalId: string) => void
}

export function SidebarNavigation({
  sidebarCollapsed,
  setSidebarCollapsed,
  mainPanelSection,
  setMainPanelSection,
  sidebarItems,
  areas,
  sortedGoalsForSidebar,
  expandedAreas,
  setExpandedAreas,
  expandedGoalSections,
  setExpandedGoalSections,
  handleOpenAreasManagementModal,
  handleCreateGoal,
  handleOpenStepModal,
  handleOpenHabitModal,
  handleOpenAreaEditModal,
  showCreateMenu,
  setShowCreateMenu,
  createMenuButtonRef,
  isOnboardingAddMenuStep = false,
  isOnboardingAddMenuGoalStep = false,
  isOnboardingClickGoalStep = false,
  createMenuRef,
  goalsSectionRef,
  onOnboardingAreaClick,
  onOnboardingGoalClick,
  areaButtonRefs,
  goalButtonRefs,
  onGoalClick
}: SidebarNavigationProps) {
  const t = useTranslations()
  const [hoveredAreaId, setHoveredAreaId] = useState<string | null>(null)
  const [hoveredGoalId, setHoveredGoalId] = useState<string | null>(null)
  const [hoveredPausedSectionId, setHoveredPausedSectionId] = useState<string | null>(null)
  const [hoveredCompletedSectionId, setHoveredCompletedSectionId] = useState<string | null>(null)
  
  // Helper function to check if goal is past deadline
  const isGoalPastDeadline = (goal: any): boolean => {
    if (!goal.target_date) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const deadline = new Date(goal.target_date)
    deadline.setHours(0, 0, 0, 0)
    return deadline < today && goal.status === 'active'
  }
  
  // Helper function to check if area has any past deadline goals
  const hasAreaPastDeadlineGoals = (areaGoals: any[]): boolean => {
    return areaGoals.some(goal => isGoalPastDeadline(goal))
  }
  
  // Helper function to convert hex color to rgba with alpha
  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  
  // Load view type visibility settings and order
  const [viewTypeVisibility, setViewTypeVisibility] = useState<Record<string, boolean>>({
    upcoming: true,
    month: true,
    year: true,
    areas: true
  })
  const [allViewsOrder, setAllViewsOrder] = useState<string[]>(['upcoming', 'month', 'year', 'areas'])

  useEffect(() => {
    const loadViewSettings = async () => {
      // Load all view settings at once to get unified order
      try {
        const response = await fetch('/api/view-settings')
        if (response.ok) {
          const allSettings = await response.json()
          
          // Map settings to view types
          const visibilityMap: Record<string, boolean> = {}
          const orderMap = new Map<string, number>()
          
          allSettings.forEach((setting: any) => {
            const viewType = setting.view_type
            visibilityMap[viewType] = setting.visible_sections?._visible_in_navigation !== false
            if (setting.order_index !== null && setting.order_index !== undefined) {
              orderMap.set(viewType, Number(setting.order_index))
            }
          })
          
          // Set defaults for missing views
          const defaultViews = ['upcoming', 'month', 'year', 'areas']
          defaultViews.forEach(viewType => {
            if (!(viewType in visibilityMap)) {
              visibilityMap[viewType] = true
            }
          })
          
          setViewTypeVisibility(visibilityMap)
          
          // Sort all views by order_index
          const allViews = ['upcoming', 'month', 'year', 'areas']
          const viewsWithOrder = allViews
            .filter(vt => orderMap.has(vt))
            .sort((a, b) => (orderMap.get(a) || 0) - (orderMap.get(b) || 0))
          const viewsWithoutOrder = allViews.filter(vt => !orderMap.has(vt))
          setAllViewsOrder([...viewsWithOrder, ...viewsWithoutOrder])
        }
      } catch (error) {
        console.error('Error loading view settings:', error)
      }
    }

    loadViewSettings()

    // Listen for view visibility and order changes
    const handleSettingsChange = () => {
      loadViewSettings()
    }
    window.addEventListener('viewVisibilityChanged', handleSettingsChange)
    window.addEventListener('viewOrderChanged', handleSettingsChange)
    return () => {
      window.removeEventListener('viewVisibilityChanged', handleSettingsChange)
      window.removeEventListener('viewOrderChanged', handleSettingsChange)
    }
  }, [])

  // Auto-expand logic removed - Focus items are always visible

  return (
    <div className={`hidden md:flex ${sidebarCollapsed ? 'w-14' : 'w-64'} border-r-4 border-primary-500 bg-white flex-shrink-0 transition-all duration-300 relative h-full flex flex-col`}>
      <div className={`${sidebarCollapsed ? 'p-2 pt-12' : 'p-4'} flex-1 overflow-y-auto`}>
        {!sidebarCollapsed && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-black font-playful">{t('navigation.title')}</h2>
          </div>
        )}
        <nav className={`${sidebarCollapsed ? 'space-y-2 flex flex-col items-center' : 'space-y-2'}`}>
          {!sidebarCollapsed ? (
            <>
              {/* Calendar views - Upcoming, Month, Year */}
              <div className="space-y-1.5 mb-4">
                {/* Upcoming view */}
                {viewTypeVisibility['upcoming'] !== false && (
                  <button
                    onClick={() => setMainPanelSection('focus-upcoming')}
                    className={`btn-playful-nav w-full flex items-center gap-3 px-3 py-2 text-left ${
                      mainPanelSection === 'focus-upcoming' ? 'active' : ''
                    }`}
                  >
                    <ListTodo className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium text-sm">{t('calendar.upcoming') || 'Nadcházející'}</span>
                  </button>
                )}
                
                {/* Month view */}
                {viewTypeVisibility['month'] !== false && (
                  <button
                    onClick={() => setMainPanelSection('focus-month')}
                    className={`btn-playful-nav w-full flex items-center gap-3 px-3 py-2 text-left ${
                      mainPanelSection === 'focus-month' ? 'active' : ''
                    }`}
                  >
                    <CalendarDays className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium text-sm">{t('calendar.month') || 'Přehled'}</span>
                  </button>
                )}
                
                {/* Year view */}
                {viewTypeVisibility['year'] !== false && (
                  <button
                    onClick={() => setMainPanelSection('focus-year')}
                    className={`btn-playful-nav w-full flex items-center gap-3 px-3 py-2 text-left ${
                      mainPanelSection === 'focus-year' ? 'active' : ''
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium text-sm">{t('calendar.year') || 'Statistiky'}</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            // Collapsed sidebar - show calendar view icons
            <>
              {viewTypeVisibility['upcoming'] !== false && (
                <button
                  onClick={() => setMainPanelSection('focus-upcoming')}
                  className={`btn-playful-nav flex items-center justify-center w-10 h-10 ${
                    mainPanelSection === 'focus-upcoming' ? 'active' : ''
                  }`}
                  title={t('calendar.upcoming') || 'Nadcházející'}
                >
                  <ListTodo className="w-5 h-5 flex-shrink-0" />
                </button>
              )}
              {viewTypeVisibility['month'] !== false && (
                <button
                  onClick={() => setMainPanelSection('focus-month')}
                  className={`btn-playful-nav flex items-center justify-center w-10 h-10 ${
                    mainPanelSection === 'focus-month' ? 'active' : ''
                  }`}
                  title={t('calendar.month') || 'Přehled'}
                >
                  <CalendarDays className="w-5 h-5 flex-shrink-0" />
                </button>
              )}
              {viewTypeVisibility['year'] !== false && (
                <button
                  onClick={() => setMainPanelSection('focus-year')}
                  className={`btn-playful-nav flex items-center justify-center w-10 h-10 ${
                    mainPanelSection === 'focus-year' ? 'active' : ''
                  }`}
                  title={t('calendar.year') || 'Statistiky'}
                >
                  <BarChart3 className="w-5 h-5 flex-shrink-0" />
                </button>
              )}
            </>
          )}
          
          {/* Areas list - directly under Calendar views */}
          {!sidebarCollapsed && viewTypeVisibility['areas'] !== false && (() => {
            // Group goals by area - include all goals (active, paused, completed)
            const goalsByArea = areas.reduce((acc, area) => {
              const areaGoals = sortedGoalsForSidebar.filter(g => g.area_id === area.id)
              // Always include area, even if it has no goals
              acc[area.id] = { area, goals: areaGoals }
              return acc
            }, {} as Record<string, { area: any; goals: any[] }>)
            
            // Goals without area
            const goalsWithoutArea = sortedGoalsForSidebar.filter(g => !g.area_id && g.status === 'active')
            
            return (
              <div className="space-y-2">
                {/* Areas header */}
                <div className="flex items-center justify-between px-2 py-1">
                  <h3 className="text-xs font-bold text-black uppercase tracking-wider font-playful">
                    {t('areas.title') || 'Oblasti'}
                  </h3>
                </div>
                
                {/* Areas with goals */}
                {Object.keys(goalsByArea).length > 0 && (Object.values(goalsByArea) as Array<{ area: any; goals: any[] }>).map((item: { area: any; goals: any[] }) => {
                  const { area, goals: areaGoals } = item
                  const isExpanded = expandedAreas.has(area.id)
                  const IconComponent = getIconComponent(area.icon || 'LayoutDashboard')
                  const areaColor = area.color || '#ea580c'
                  const hasPastDeadlineGoals = hasAreaPastDeadlineGoals(areaGoals)
                  
                  return (
                    <div 
                      key={area.id} 
                      className="space-y-1.5 group"
                      onMouseEnter={() => setHoveredAreaId(area.id)}
                      onMouseLeave={() => setHoveredAreaId(null)}
                    >
                      <div className="flex items-center gap-1.5">
                        <button
                          ref={areaButtonRefs?.get(area.id)}
                          onClick={() => {
                            setMainPanelSection(`area-${area.id}`)
                            // useEffect will automatically expand this area and collapse others
                          }}
                          className={`btn-playful-nav flex-1 flex items-center gap-3 px-3 py-2 text-left ${
                            mainPanelSection === `area-${area.id}` ? 'active' : ''
                          }`}
                          style={{
                            ...(mainPanelSection === `area-${area.id}` ? { textDecorationColor: areaColor } : {}),
                            ...(hoveredAreaId === area.id ? { backgroundColor: hexToRgba(areaColor, 0.2) } : {})
                          }}
                          title={area.name}
                        >
                          <IconComponent className="w-4 h-4 flex-shrink-0" style={mainPanelSection === `area-${area.id}` ? undefined : { color: areaColor }} />
                          <span className={`font-semibold text-sm truncate flex-1 ${hasPastDeadlineGoals ? 'text-red-600' : ''}`}>
                            {area.name}
                          </span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenAreaEditModal(area)
                          }}
                          className={`px-2 py-2 rounded-playful-sm transition-all bg-transparent text-black hover:bg-primary-50 border-none ${
                            hoveredAreaId === area.id ? 'opacity-100' : 'opacity-0'
                          }`}
                          title={t('areas.edit') || 'Upravit oblast'}
                        >
                          <Edit className="w-3.5 h-3.5" />
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
                          className="px-2 py-2 rounded-playful-sm transition-all bg-transparent text-black hover:bg-primary-50 border-none"
                          title={isExpanded ? t('navigation.collapseArea') : t('navigation.expandArea')}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      
                      {/* Goals under area */}
                      {isExpanded && (() => {
                        // Split goals by status
                        const activeGoals = areaGoals.filter(g => g.status === 'active')
                        const pausedGoals = areaGoals.filter(g => g.status === 'paused')
                        const completedGoals = areaGoals.filter(g => g.status === 'completed')
                        
                        
                        const pausedSectionKey = `${area.id}-paused`
                        const completedSectionKey = `${area.id}-completed`
                        const isPausedExpanded = expandedGoalSections.has(pausedSectionKey)
                        const isCompletedExpanded = expandedGoalSections.has(completedSectionKey)
                        
                        const isAreaSelected = mainPanelSection === `area-${area.id}`
                        return (
                          <div 
                            ref={isOnboardingClickGoalStep && isAreaSelected ? goalsSectionRef : undefined}
                            className={`pl-4 space-y-1 border-l-2 ${isOnboardingClickGoalStep && isAreaSelected ? 'bg-primary-100 border-2 border-primary-500 rounded-playful-sm p-2' : ''}`}
                            style={isOnboardingClickGoalStep && isAreaSelected ? undefined : { borderColor: areaColor }}
                          >
                            {/* Active goals - always visible */}
                            {activeGoals.map((goal) => {
                              const goalSectionId = `goal-${goal.id}`
                              const isSelected = mainPanelSection === goalSectionId
                              const progressPercentage = Math.round(goal.progress_percentage || 0)
                              const isPastDeadline = isGoalPastDeadline(goal)
                              return (
                                <button
                                  key={goal.id}
                                  ref={goalButtonRefs?.get(goal.id)}
                                  onClick={() => {
                                    if (onGoalClick) {
                                      onGoalClick(goal.id)
                                    } else {
                                      setMainPanelSection(goalSectionId)
                                    }
                                  }}
                                  onMouseEnter={() => setHoveredGoalId(goal.id)}
                                  onMouseLeave={() => setHoveredGoalId(null)}
                                  className={`btn-playful-nav w-full flex items-center gap-2 px-3 py-1.5 text-left border-2 ${
                                    isSelected ? 'active' : ''
                                  }`}
                                  style={{
                                    borderColor: areaColor,
                                    ...(hoveredGoalId === goal.id ? { backgroundColor: hexToRgba(areaColor, 0.2) } : {})
                                  }}
                                  title={goal.title}
                                >
                                  <span className="text-xs font-bold flex-shrink-0 min-w-[2.5rem] text-right" style={{ color: areaColor }}>
                                    {progressPercentage}%
                                  </span>
                                  {isPastDeadline && (
                                    <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                                  )}
                                  <span className={`font-medium text-xs truncate flex-1 ${isPastDeadline ? 'text-red-600' : ''}`}>
                                    {goal.title}
                                  </span>
                                </button>
                              )
                            })}
                            
                            {/* Paused goals section */}
                            {pausedGoals.length > 0 && (
                              <div>
                                <button
                                  onClick={() => {
                                    const newSet = new Set(expandedGoalSections)
                                    if (isPausedExpanded) {
                                      newSet.delete(pausedSectionKey)
                                    } else {
                                      newSet.add(pausedSectionKey)
                                    }
                                    setExpandedGoalSections(newSet)
                                  }}
                                  onMouseEnter={() => setHoveredPausedSectionId(pausedSectionKey)}
                                  onMouseLeave={() => setHoveredPausedSectionId(null)}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-black transition-all rounded-playful-sm bg-transparent"
                                  style={hoveredPausedSectionId === pausedSectionKey ? { backgroundColor: hexToRgba(areaColor, 0.2) } : {}}
                                >
                                  <ChevronDown className={`w-3 h-3 transition-transform ${isPausedExpanded ? 'rotate-180' : ''}`} />
                                  <span>{t('goals.filters.status.paused') || 'Odložené'} ({pausedGoals.length})</span>
                                </button>
                                {isPausedExpanded && (
                                  <div className="pl-4 space-y-1">
                                    {pausedGoals.map((goal) => {
                                      const goalSectionId = `goal-${goal.id}`
                                      const isSelected = mainPanelSection === goalSectionId
                                      const progressPercentage = Math.round(goal.progress_percentage || 0)
                                      const isPastDeadline = isGoalPastDeadline(goal)
                                      return (
                                        <button
                                          key={goal.id}
                                          ref={goalButtonRefs?.get(goal.id)}
                                          onClick={() => {
                                            if (onGoalClick) {
                                              onGoalClick(goal.id)
                                            } else {
                                              setMainPanelSection(goalSectionId)
                                            }
                                          }}
                                          onMouseEnter={() => setHoveredGoalId(goal.id)}
                                          onMouseLeave={() => setHoveredGoalId(null)}
                                          className={`btn-playful-nav w-full flex items-center gap-2 px-3 py-1.5 text-left border-2 ${
                                            isSelected ? 'active' : ''
                                          }`}
                                          style={{
                                            borderColor: areaColor,
                                            ...(hoveredGoalId === goal.id ? { backgroundColor: hexToRgba(areaColor, 0.2) } : {})
                                          }}
                                          title={goal.title}
                                        >
                                  <span className="text-xs font-bold flex-shrink-0 min-w-[2.5rem] text-right" style={{ color: areaColor }}>
                                    {progressPercentage}%
                                  </span>
                                          {isPastDeadline && (
                                            <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                                          )}
                                          <span className={`font-medium text-xs truncate flex-1 ${isPastDeadline ? 'text-red-600' : ''}`}>
                                            {goal.title}
                                          </span>
                                        </button>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Completed goals section */}
                            {completedGoals.length > 0 && (
                              <div>
                                <button
                                  onClick={() => {
                                    const newSet = new Set(expandedGoalSections)
                                    if (isCompletedExpanded) {
                                      newSet.delete(completedSectionKey)
                                    } else {
                                      newSet.add(completedSectionKey)
                                    }
                                    setExpandedGoalSections(newSet)
                                  }}
                                  onMouseEnter={() => setHoveredCompletedSectionId(completedSectionKey)}
                                  onMouseLeave={() => setHoveredCompletedSectionId(null)}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-black transition-all rounded-playful-sm bg-transparent"
                                  style={hoveredCompletedSectionId === completedSectionKey ? { backgroundColor: hexToRgba(areaColor, 0.2) } : {}}
                                >
                                  <ChevronDown className={`w-3 h-3 transition-transform ${isCompletedExpanded ? 'rotate-180' : ''}`} />
                                  <span>{t('goals.filters.status.completed') || 'Hotové'} ({completedGoals.length})</span>
                                </button>
                                {isCompletedExpanded && (
                                  <div className="pl-4 space-y-1">
                                    {completedGoals.map((goal) => {
                                      const goalSectionId = `goal-${goal.id}`
                                      const isSelected = mainPanelSection === goalSectionId
                                      const progressPercentage = Math.round(goal.progress_percentage || 0)
                                      const isPastDeadline = isGoalPastDeadline(goal)
                                      return (
                                        <button
                                          key={goal.id}
                                          ref={goalButtonRefs?.get(goal.id)}
                                          onClick={() => {
                                            if (onGoalClick) {
                                              onGoalClick(goal.id)
                                            } else {
                                              setMainPanelSection(goalSectionId)
                                            }
                                          }}
                                          onMouseEnter={() => setHoveredGoalId(goal.id)}
                                          onMouseLeave={() => setHoveredGoalId(null)}
                                          className={`btn-playful-nav w-full flex items-center gap-2 px-3 py-1.5 text-left border-2 ${
                                            isSelected ? 'active' : ''
                                          }`}
                                          style={{
                                            borderColor: areaColor,
                                            ...(hoveredGoalId === goal.id ? { backgroundColor: hexToRgba(areaColor, 0.2) } : {})
                                          }}
                                          title={goal.title}
                                        >
                                  <span className="text-xs font-bold flex-shrink-0 min-w-[2.5rem] text-right" style={{ color: areaColor }}>
                                    {progressPercentage}%
                                  </span>
                                          {isPastDeadline && (
                                            <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                                          )}
                                          <span className={`font-medium text-xs truncate flex-1 ${isPastDeadline ? 'text-red-600' : ''}`}>
                                            {goal.title}
                                          </span>
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
                {goalsWithoutArea.length > 0 && (
                  <div 
                    ref={isOnboardingClickGoalStep && !mainPanelSection.startsWith('area-') ? goalsSectionRef : undefined}
                    className={`space-y-1.5 ${isOnboardingClickGoalStep && !mainPanelSection.startsWith('area-') ? 'bg-primary-100 border-2 border-primary-500 rounded-playful-sm p-2' : ''}`}
                  >
                    {goalsWithoutArea.map((goal) => {
                      const goalSectionId = `goal-${goal.id}`
                      const isSelected = mainPanelSection === goalSectionId
                      const progressPercentage = Math.round(goal.progress_percentage || 0)
                      const isPastDeadline = isGoalPastDeadline(goal)
                      return (
                        <button
                          key={goal.id}
                          ref={goalButtonRefs?.get(goal.id)}
                          onClick={() => {
                            if (onGoalClick) {
                              onGoalClick(goal.id)
                            } else {
                              setMainPanelSection(goalSectionId)
                            }
                          }}
                          className={`btn-playful-nav w-full flex items-center gap-2 px-3 py-1.5 text-left ${
                            isSelected ? 'active' : ''
                          }`}
                          title={goal.title}
                        >
                          <span className={`text-xs font-bold flex-shrink-0 min-w-[2.5rem] text-right ${isSelected ? 'text-primary-600' : 'text-gray-600'}`}>
                            {progressPercentage}%
                          </span>
                          {isPastDeadline && (
                            <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                          )}
                          <span className={`font-medium text-xs truncate flex-1 ${isPastDeadline ? 'text-red-600' : ''}`}>
                            {goal.title}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })()}
          
          {/* Collapsed areas - show as icons with goals */}
          {sidebarCollapsed && (() => {
            // Group goals by area
            const goalsByArea = areas.reduce((acc, area) => {
              // Include all goals for this area (active, paused, completed)
              const areaGoals = sortedGoalsForSidebar.filter(g => g.area_id === area.id)
              // Always include area, even if it has no goals
              acc[area.id] = { area, goals: areaGoals }
              return acc
            }, {} as Record<string, { area: any; goals: any[] }>)
            
            // Goals without area
            const goalsWithoutArea = sortedGoalsForSidebar.filter(g => !g.area_id && g.status === 'active')
            
            if (Object.keys(goalsByArea).length === 0 && goalsWithoutArea.length === 0) return null
            
            return (
              <div className="space-y-2 mt-2">
                {/* Areas */}
                 {(Object.values(goalsByArea) as Array<{ area: any; goals: any[] }>).slice(0, 5).map((item: { area: any; goals: any[] }) => {
                   const { area, goals: areaGoals } = item
                  const isExpanded = expandedAreas.has(area.id)
                  const IconComponent = getIconComponent(area.icon || 'LayoutDashboard')
                  const areaColor = area.color || '#ea580c'
                  const isAreaSelected = mainPanelSection.startsWith('area-') && mainPanelSection === `area-${area.id}`
                  
                  return (
                    <div key={area.id} className="space-y-1">
                      <button
                        onClick={() => {
                          // Open area page - useEffect will automatically expand this area and collapse others
                          setMainPanelSection(`area-${area.id}`)
                        }}
                        className={`btn-playful-nav w-10 h-10 flex items-center justify-center ${
                          isAreaSelected ? 'active' : ''
                        }`}
                        style={isAreaSelected ? { textDecorationColor: areaColor } : undefined}
                        title={area.name}
                      >
                        <IconComponent className={`w-5 h-5`} style={!isAreaSelected ? { color: areaColor } : undefined} />
                      </button>
                      
                      {/* Goals under area - always shown in collapsed menu */}
                      {isExpanded && (
                        <div className="pl-2 space-y-1 border-l-2" style={{ borderColor: areaColor }}>
                          {areaGoals.map((goal) => {
                            const goalSectionId = `goal-${goal.id}`
                            const isSelected = mainPanelSection === goalSectionId
                            const GoalIconComponent = getIconComponent(goal.icon)
                            return (
                              <button
                                key={goal.id}
                          ref={goalButtonRefs?.get(goal.id)}
                          onClick={() => {
                            if (onGoalClick) {
                              onGoalClick(goal.id)
                            } else {
                              setMainPanelSection(goalSectionId)
                            }
                          }}
                                className={`btn-playful-nav w-10 h-10 flex items-center justify-center ${
                                  isSelected ? 'active' : ''
                                }`}
                                title={goal.title}
                              >
                                <GoalIconComponent className={`w-4 h-4`} style={!isSelected ? { color: areaColor } : undefined} />
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
                
                {/* Goals without area */}
                {goalsWithoutArea.slice(0, 5).map((goal) => {
                  const goalSectionId = `goal-${goal.id}`
                  const isSelected = mainPanelSection === goalSectionId
                  const IconComponent = getIconComponent(goal.icon)
                  return (
                    <button
                      key={goal.id}
                          ref={goalButtonRefs?.get(goal.id)}
                          onClick={() => {
                            if (onGoalClick) {
                              onGoalClick(goal.id)
                            } else {
                              setMainPanelSection(goalSectionId)
                            }
                          }}
                      className={`btn-playful-nav w-10 h-10 flex items-center justify-center ${
                        isSelected ? 'active' : ''
                      }`}
                      title={goal.title}
                    >
                      <IconComponent className="w-4 h-4" />
                    </button>
                  )
                })}
              </div>
            )
          })()}
          
        </nav>
      </div>
      
      {/* Create button - fixed at bottom */}
      <div className={`${sidebarCollapsed ? 'p-2' : 'p-4'} border-t-2 border-primary-500 flex-shrink-0 relative`}>
        <button
          ref={createMenuButtonRef}
          onClick={() => setShowCreateMenu(!showCreateMenu)}
          className={`${sidebarCollapsed ? 'w-10 h-10 p-0' : 'w-full px-4 py-2.5'} flex items-center justify-center gap-2 bg-white text-primary-600 rounded-playful-md hover:bg-primary-50 transition-colors border-2 border-primary-500 font-semibold btn-playful-base`}
          title={sidebarCollapsed ? 'Vytvořit' : undefined}
        >
          <Plus className={sidebarCollapsed ? "w-6 h-6" : "w-5 h-5"} strokeWidth={sidebarCollapsed ? 3 : 2} />
          {!sidebarCollapsed && (
            <span>{t('common.add') || 'Vytvořit'}</span>
          )}
        </button>
        
        {/* Create menu dropdown */}
        {showCreateMenu && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => {
                // Don't close menu during onboarding steps
                if (!isOnboardingAddMenuStep && !isOnboardingAddMenuGoalStep) {
                  setShowCreateMenu(false)
                }
              }}
            />
            <div 
              ref={createMenuRef}
              className={`absolute ${sidebarCollapsed ? 'left-14 bottom-12' : 'left-4 bottom-20'} z-50 bg-white border-2 border-primary-500 rounded-playful-md min-w-[160px]`}
              onClick={(e) => e.stopPropagation()}
            >
                {/* Goals button - disabled in add-menu-open step */}
                {isOnboardingAddMenuStep && !isOnboardingAddMenuGoalStep ? (
                  // Disabled version in onboarding area step
                  <div className="w-full text-left px-4 py-2.5 text-sm opacity-30 cursor-not-allowed text-gray-400 flex items-center gap-2 border-b border-primary-200">
                    <Target className="w-4 h-4" />
                    <span>{t('navigation.goals')}</span>
                  </div>
                ) : (
              <button
                    onClick={(e) => {
                      e.stopPropagation()
                      // In onboarding goal step, this click should trigger the next onboarding step, not open the external modal
                      if (isOnboardingAddMenuGoalStep && onOnboardingGoalClick) {
                        onOnboardingGoalClick() // Call the onboarding-specific handler
                        setShowCreateMenu(false)
                      } else {
                  handleCreateGoal()
                  setShowCreateMenu(false)
                      }
                }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors font-medium flex items-center gap-2 border-b border-primary-200 first:rounded-t-playful-md last:rounded-b-playful-md last:border-b-0 ${
                      isOnboardingAddMenuGoalStep
                        ? 'bg-primary-100 border-2 border-primary-500 font-bold text-primary-700 hover:bg-primary-200'
                        : 'hover:bg-primary-50 text-black'
                    }`}
              >
                <Target className="w-4 h-4" />
                <span>{t('navigation.goals')}</span>
              </button>
                )}
                
                {/* Steps button */}
                {(isOnboardingAddMenuStep || isOnboardingAddMenuGoalStep) ? (
                  // Disabled version in onboarding
                  <div className="w-full text-left px-4 py-2.5 text-sm opacity-30 cursor-not-allowed text-gray-400 flex items-center gap-2 border-b border-primary-200">
                    <Footprints className="w-4 h-4" />
                    <span>{t('navigation.steps')}</span>
                  </div>
                ) : (
              <button
                    onClick={(e) => {
                      e.stopPropagation()
                  handleOpenStepModal()
                  setShowCreateMenu(false)
                }}
                    className="w-full text-left px-4 py-2.5 text-sm transition-colors font-medium flex items-center gap-2 border-b border-primary-200 first:rounded-t-playful-md last:rounded-b-playful-md last:border-b-0 hover:bg-primary-50 text-black"
              >
                <Footprints className="w-4 h-4" />
                <span>{t('navigation.steps')}</span>
              </button>
                )}
                
                {/* Habits button */}
                {(isOnboardingAddMenuStep || isOnboardingAddMenuGoalStep) ? (
                  // Disabled version in onboarding
                  <div className="w-full text-left px-4 py-2.5 text-sm opacity-30 cursor-not-allowed text-gray-400 flex items-center gap-2 border-b border-primary-200">
                    <CheckSquare className="w-4 h-4" />
                    <span>{t('navigation.habits')}</span>
                  </div>
                ) : (
              <button
                    onClick={(e) => {
                      e.stopPropagation()
                  handleOpenHabitModal(null)
                  setShowCreateMenu(false)
                }}
                    className="w-full text-left px-4 py-2.5 text-sm transition-colors font-medium flex items-center gap-2 border-b border-primary-200 first:rounded-t-playful-md last:rounded-b-playful-md last:border-b-0 hover:bg-primary-50 text-black"
              >
                <CheckSquare className="w-4 h-4" />
                <span>{t('navigation.habits')}</span>
              </button>
                )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (isOnboardingAddMenuStep && onOnboardingAreaClick) {
                    // In onboarding, use the onboarding area creation flow
                    onOnboardingAreaClick()
                    setShowCreateMenu(false)
                  } else {
                    // Normal flow - open area edit modal
                  handleOpenAreaEditModal()
                  setShowCreateMenu(false)
                  }
                }}
                disabled={isOnboardingAddMenuGoalStep}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors font-medium flex items-center gap-2 ${
                  isOnboardingAddMenuStep
                    ? 'bg-primary-100 border-2 border-primary-500 font-bold text-primary-700 hover:bg-primary-200'
                    : isOnboardingAddMenuGoalStep
                      ? 'opacity-30 cursor-not-allowed text-gray-400 pointer-events-none'
                      : 'hover:bg-primary-50 text-black border-b border-primary-200 first:rounded-t-playful-md last:rounded-b-playful-md last:border-b-0'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>{t('areas.title') || 'Oblast'}</span>
              </button>
            </div>
          </>
        )}
      </div>
      
      {/* Toggle button - centered at top when collapsed */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className={`absolute ${sidebarCollapsed ? 'top-3 left-1/2 -translate-x-1/2' : 'top-4 -right-3'} w-7 h-7 bg-white text-black rounded-full flex items-center justify-center hover:bg-primary-50 transition-colors border-2 border-primary-500 z-10 btn-playful-base`}
        title={sidebarCollapsed ? 'Rozbalit navigaci' : 'Sbalit navigaci'}
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  )
}

