'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { LayoutDashboard, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Target, Plus, Footprints, CheckSquare, Settings, Calendar, CalendarRange, CalendarDays, CalendarCheck, BookOpen } from 'lucide-react'
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
  handleOpenAreaEditModal: () => void
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
  activeWorkflows?: any[]
  availableWorkflows?: Record<string, any>
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
  onGoalClick,
  activeWorkflows = [],
  availableWorkflows = {}
}: SidebarNavigationProps) {
  const t = useTranslations()
  
  // Load view type visibility settings and order
  const [viewTypeVisibility, setViewTypeVisibility] = useState<Record<string, boolean>>({
    day: true,
    week: true,
    month: true,
    year: true,
    areas: true,
    only_the_important: true,
    daily_review: true
  })
  const [workflowsOrder, setWorkflowsOrder] = useState<string[]>(['only_the_important', 'daily_review'])
  const [timeOrder, setTimeOrder] = useState<string[]>(['day', 'week', 'month', 'year'])

  useEffect(() => {
    const loadViewSettings = async () => {
      const viewTypes = ['day', 'week', 'month', 'year', 'areas', 'only_the_important', 'daily_review']
      const settingsPromises = viewTypes.map(async (viewType) => {
        try {
          const response = await fetch(`/api/view-settings?view_type=${viewType}`)
          if (response.ok) {
            const data = await response.json()
            const visibleInNav = data?.visible_sections?._visible_in_navigation !== false // Default to true
            const order = data?.order_index !== null && data?.order_index !== undefined 
              ? Number(data.order_index) 
              : null
            return { viewType, visibleInNav, order }
          }
        } catch (error) {
          console.error(`Error loading view settings for ${viewType}:`, error)
        }
        return { viewType, visibleInNav: true, order: null } // Default to true
      })

      const settingsResults = await Promise.all(settingsPromises)
      const visibilityMap: Record<string, boolean> = {}
      settingsResults.forEach(({ viewType, visibleInNav }) => {
        visibilityMap[viewType] = visibleInNav
      })
      setViewTypeVisibility(visibilityMap)
      
      // Define view categories
      const workflowsViews = ['only_the_important', 'daily_review']
      const timeViews = ['day', 'week', 'month', 'year']
      
      // Load view order by category
      const orderMap = new Map<string, number>()
      settingsResults.forEach(({ viewType, order }) => {
        if (order !== null && order !== undefined && typeof order === 'number') {
          orderMap.set(viewType, order)
        }
      })
      
      // Sort workflows views
      const workflowsWithOrder = workflowsViews
        .filter(vt => orderMap.has(vt))
        .sort((a, b) => (orderMap.get(a) || 0) - (orderMap.get(b) || 0))
      const workflowsWithoutOrder = workflowsViews.filter(vt => !orderMap.has(vt))
      setWorkflowsOrder([...workflowsWithOrder, ...workflowsWithoutOrder])
      
      // Sort time views
      const timeWithOrder = timeViews
        .filter(vt => orderMap.has(vt))
        .sort((a, b) => (orderMap.get(a) || 0) - (orderMap.get(b) || 0))
      const timeWithoutOrder = timeViews.filter(vt => !orderMap.has(vt))
      setTimeOrder([...timeWithOrder, ...timeWithoutOrder])
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
            <button
              onClick={() => {
                // Dispatch custom event to open workflows view
                window.dispatchEvent(new CustomEvent('openWorkflowsSettings'))
              }}
              className="p-1.5 rounded-playful-sm hover:bg-primary-50 transition-colors border-2 border-primary-500 text-black hover:text-primary-600"
              title={t('workflows.title') || 'Nastavení workflows'}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        )}
        <nav className={`${sidebarCollapsed ? 'space-y-2 flex flex-col items-center' : 'space-y-2'}`}>
          {!sidebarCollapsed ? (
            <>
              {/* Workflows section - Only the important, Daily review */}
              {(workflowsOrder.some(vt => viewTypeVisibility[vt] !== false)) && (
                <div className="space-y-1.5 mb-4">
                  <h3 className="text-xs font-bold text-black uppercase tracking-wider font-playful px-2 py-1">
                    {t('navigation.workflows') || 'Workflows'}
                  </h3>
                  {workflowsOrder.map((viewType) => {
                    const isVisible = viewTypeVisibility[viewType] !== false
                    if (!isVisible) return null
                    
                    const sectionKey = `focus-${viewType}`
                    const isActive = mainPanelSection === sectionKey
                    
                    const viewConfig: Record<string, { icon: any; labelKey: string }> = {
                      only_the_important: { icon: Target, labelKey: 'views.onlyTheImportant.name' },
                      daily_review: { icon: BookOpen, labelKey: 'views.dailyReview.name' }
                    }
                    
                    const config = viewConfig[viewType]
                    if (!config) return null
                    
                    const IconComponent = config.icon
                    const label = t(config.labelKey) || viewType
                    
                    return (
                      <button
                        key={viewType}
                        onClick={() => setMainPanelSection(sectionKey)}
                        className={`btn-playful-nav w-full flex items-center gap-3 px-3 py-2 text-left ${
                          isActive ? 'active' : ''
                        }`}
                      >
                        <IconComponent className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium text-sm">{label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
              
              {/* Time-based section - Day, Week, Month, Year */}
              {(timeOrder.some(vt => viewTypeVisibility[vt] !== false)) && (
                <div className="space-y-1.5 mb-4">
                  <h3 className="text-xs font-bold text-black uppercase tracking-wider font-playful px-2 py-1">
                    {t('navigation.timeBased') || 'Časové'}
                  </h3>
                  {timeOrder.map((viewType) => {
                    const isVisible = viewTypeVisibility[viewType] !== false
                    if (!isVisible) return null
                    
                    const sectionKey = `focus-${viewType}`
                    const isActive = mainPanelSection === sectionKey
                    
                    const viewConfig: Record<string, { icon: any; labelKey: string }> = {
                      day: { icon: CalendarDays, labelKey: 'navigation.focusDay' },
                      week: { icon: CalendarRange, labelKey: 'navigation.focusWeek' },
                      month: { icon: Calendar, labelKey: 'navigation.focusMonth' },
                      year: { icon: CalendarCheck, labelKey: 'navigation.focusYear' }
                    }
                    
                    const config = viewConfig[viewType]
                    if (!config) return null
                    
                    const IconComponent = config.icon
                    const label = t(config.labelKey) || viewType
                    
                    return (
                      <button
                        key={viewType}
                        onClick={() => setMainPanelSection(sectionKey)}
                        className={`btn-playful-nav w-full flex items-center gap-3 px-3 py-2 text-left ${
                          isActive ? 'active' : ''
                        }`}
                      >
                        <IconComponent className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium text-sm">{label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          ) : (
            // Collapsed sidebar - show only Focus icon
            <button
              onClick={() => setMainPanelSection('focus-day')}
              className={`btn-playful-nav flex items-center justify-center w-10 h-10 ${
                mainPanelSection.startsWith('focus-') ? 'active' : ''
              }`}
              title={t('navigation.focus') || 'Focus'}
            >
              <Calendar className="w-5 h-5 flex-shrink-0" />
            </button>
          )}
          
          {/* Active Workflows - after Focus, before Areas */}
          {/* Show all enabled workflows as standalone views in navigation */}
          {!sidebarCollapsed && activeWorkflows.length > 0 && (
            <div className="space-y-1.5 mt-4">
              <h3 className="text-xs font-bold text-black uppercase tracking-wider font-playful px-2 py-1">
                {t('views.title') || 'Views'}
              </h3>
              {activeWorkflows.map((workflow) => {
                const workflowDef = availableWorkflows[workflow.workflow_key]
                if (!workflowDef) return null
                
                const sectionKey = `workflow-${workflow.workflow_key}`
                const isActive = mainPanelSection === sectionKey
                const IconComponent = getIconComponent(workflowDef.icon || 'LayoutDashboard')
                
                return (
                  <button
                    key={workflow.id}
                    onClick={() => setMainPanelSection(sectionKey)}
                    className={`btn-playful-nav w-full flex items-center gap-3 px-3 py-2 text-left ${
                      isActive ? 'active' : ''
                    }`}
                    title={t(workflowDef.nameKey)}
                  >
                    <IconComponent className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium text-sm truncate">
                      {t(workflowDef.nameKey)}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
          
          {/* Areas list - directly under Focus */}
          {!sidebarCollapsed && (() => {
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
              <div className="space-y-2 mt-4">
                {/* Areas header with settings */}
                <div className="flex items-center justify-between px-2 py-1">
                  <h3 className="text-xs font-bold text-black uppercase tracking-wider font-playful">
                    {t('areas.title') || 'Oblasti'}
                  </h3>
                  <button
                    onClick={() => handleOpenAreasManagementModal()}
                    className="p-1.5 rounded-playful-sm hover:bg-primary-50 transition-colors border-2 border-primary-500 text-black hover:text-primary-600"
                    title={t('areas.manage') || 'Spravovat oblasti'}
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                {/* Areas with goals */}
                {Object.keys(goalsByArea).length > 0 && (Object.values(goalsByArea) as Array<{ area: any; goals: any[] }>).map((item: { area: any; goals: any[] }) => {
                  const { area, goals: areaGoals } = item
                  const isExpanded = expandedAreas.has(area.id)
                  const IconComponent = getIconComponent(area.icon || 'LayoutDashboard')
                  const areaColor = area.color || '#ea580c'
                  
                  return (
                    <div key={area.id} className="space-y-1.5">
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
                          style={mainPanelSection === `area-${area.id}` ? { textDecorationColor: areaColor } : undefined}
                          title={area.name}
                        >
                          <IconComponent className="w-4 h-4 flex-shrink-0" style={mainPanelSection === `area-${area.id}` ? undefined : { color: areaColor }} />
                          <span className="font-semibold text-sm truncate flex-1">
                            {area.name}
                          </span>
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
                                  <span className={`text-xs font-bold flex-shrink-0 min-w-[2.5rem] text-right ${isSelected ? 'text-primary-600' : ''}`} style={!isSelected ? { color: areaColor } : undefined}>
                                    {progressPercentage}%
                                  </span>
                                  <span className="font-medium text-xs truncate flex-1">
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
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-black hover:bg-primary-50 transition-all rounded-playful-sm bg-transparent"
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
                                          <span className={`text-xs font-bold flex-shrink-0 min-w-[2.5rem] text-right ${isSelected ? 'text-primary-600' : ''}`} style={!isSelected ? { color: areaColor } : undefined}>
                                            {progressPercentage}%
                                          </span>
                                          <span className="font-medium text-xs truncate flex-1">
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
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-black hover:bg-primary-50 transition-all rounded-playful-sm bg-transparent"
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
                                          <span className={`text-xs font-bold flex-shrink-0 min-w-[2.5rem] text-right ${isSelected ? 'text-primary-600' : ''}`} style={!isSelected ? { color: areaColor } : undefined}>
                                            {progressPercentage}%
                                          </span>
                                          <span className="font-medium text-xs truncate flex-1">
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
                          <span className="font-medium text-xs truncate flex-1">
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

