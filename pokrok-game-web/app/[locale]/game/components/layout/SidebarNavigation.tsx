'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { LayoutDashboard, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Target, Plus, Footprints, CheckSquare, Settings, Calendar, CalendarRange, CalendarDays } from 'lucide-react'
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
  expandedFocus?: boolean
  setExpandedFocus?: (expanded: boolean) => void
  handleOpenAreasManagementModal: () => void
  handleCreateGoal: () => void
  handleOpenStepModal: () => void
  handleOpenHabitModal: (habit: any) => void
  handleOpenAreaEditModal: () => void
  showCreateMenu: boolean
  setShowCreateMenu: (show: boolean) => void
  createMenuButtonRef: React.RefObject<HTMLButtonElement>
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
  expandedFocus = false,
  setExpandedFocus,
  handleOpenAreasManagementModal,
  handleCreateGoal,
  handleOpenStepModal,
  handleOpenHabitModal,
  handleOpenAreaEditModal,
  showCreateMenu,
  setShowCreateMenu,
  createMenuButtonRef,
}: SidebarNavigationProps) {
  const t = useTranslations()
  
  // Auto-expand Focus if any focus section is selected
  React.useEffect(() => {
    if (mainPanelSection.startsWith('focus-') && !expandedFocus && setExpandedFocus) {
      setExpandedFocus(true)
    }
  }, [mainPanelSection, expandedFocus, setExpandedFocus])

  return (
    <div className={`hidden md:flex ${sidebarCollapsed ? 'w-14' : 'w-64'} border-r-4 border-primary-500 bg-white flex-shrink-0 transition-all duration-300 relative h-full flex flex-col`}>
      <div className={`${sidebarCollapsed ? 'p-2 pt-12' : 'p-4'} flex-1 overflow-y-auto`}>
        {!sidebarCollapsed && (
          <h2 className="text-lg font-bold text-black mb-4 font-playful">{t('navigation.title')}</h2>
        )}
        <nav className={`${sidebarCollapsed ? 'space-y-2 flex flex-col items-center' : 'space-y-2'}`}>
          {/* Focus section - expandable with Day, Week, Month */}
          {!sidebarCollapsed ? (
            <div className="space-y-2">
              <button
                onClick={() => {
                  if (setExpandedFocus) {
                    setExpandedFocus(!expandedFocus)
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 transition-all rounded-playful-md bg-transparent text-black hover:bg-primary-50`}
              >
                <Calendar className="w-5 h-5 flex-shrink-0" />
                <span className="font-semibold flex-1 text-left">{t('navigation.focus') || 'Focus'}</span>
                {expandedFocus ? (
                  <ChevronUp className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 flex-shrink-0" />
                )}
              </button>
              
              {/* Focus sub-items */}
              {expandedFocus && (
                <div className="ml-6 space-y-1.5">
                  <button
                    onClick={() => setMainPanelSection('focus-day')}
                    className={`btn-playful-nav w-full flex items-center gap-3 px-3 py-2 text-left ${
                      mainPanelSection === 'focus-day' ? 'active' : ''
                    }`}
                  >
                    <CalendarDays className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium text-sm">{t('navigation.focusDay') || 'Day'}</span>
                  </button>
                  <button
                    onClick={() => setMainPanelSection('focus-week')}
                    className={`btn-playful-nav w-full flex items-center gap-3 px-3 py-2 text-left ${
                      mainPanelSection === 'focus-week' ? 'active' : ''
                    }`}
                  >
                    <CalendarRange className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium text-sm">{t('navigation.focusWeek') || 'Week'}</span>
                  </button>
                  <button
                    onClick={() => setMainPanelSection('focus-month')}
                    className={`btn-playful-nav w-full flex items-center gap-3 px-3 py-2 text-left ${
                      mainPanelSection === 'focus-month' ? 'active' : ''
                    }`}
                  >
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium text-sm">{t('navigation.focusMonth') || 'Month'}</span>
                  </button>
                </div>
              )}
            </div>
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
                        
                        console.log('[Desktop Sidebar - Area Goals]', {
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
                          <div className="pl-4 space-y-1 border-l-2" style={{ borderColor: areaColor }}>
                            {/* Active goals - always visible */}
                            {activeGoals.map((goal) => {
                              const goalSectionId = `goal-${goal.id}`
                              const isSelected = mainPanelSection === goalSectionId
                              const GoalIconComponent = getIconComponent(goal.icon)
                              return (
                                <button
                                  key={goal.id}
                                  onClick={() => setMainPanelSection(goalSectionId)}
                                  className={`btn-playful-nav w-full flex items-center gap-2 px-3 py-1.5 text-left ${
                                    isSelected ? 'active' : ''
                                  }`}
                                  title={goal.title}
                                >
                                  <GoalIconComponent className={`w-3.5 h-3.5 flex-shrink-0`} style={!isSelected ? { color: areaColor } : undefined} />
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
                                      const GoalIconComponent = getIconComponent(goal.icon)
                                      return (
                                        <button
                                          key={goal.id}
                                          onClick={() => setMainPanelSection(goalSectionId)}
                                          className={`btn-playful-nav w-full flex items-center gap-2 px-3 py-1.5 text-left ${
                                            isSelected ? 'active' : ''
                                          }`}
                                          title={goal.title}
                                        >
                                          <GoalIconComponent className={`w-3.5 h-3.5 flex-shrink-0`} style={!isSelected ? { color: areaColor } : undefined} />
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
                                      const GoalIconComponent = getIconComponent(goal.icon)
                                      return (
                                        <button
                                          key={goal.id}
                                          onClick={() => setMainPanelSection(goalSectionId)}
                                          className={`btn-playful-nav w-full flex items-center gap-2 px-3 py-1.5 text-left ${
                                            isSelected ? 'active' : ''
                                          }`}
                                          title={goal.title}
                                        >
                                          <GoalIconComponent className={`w-3.5 h-3.5 flex-shrink-0`} style={!isSelected ? { color: areaColor } : undefined} />
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
                  <div className="space-y-1.5">
                    {goalsWithoutArea.map((goal) => {
                      const goalSectionId = `goal-${goal.id}`
                      const isSelected = mainPanelSection === goalSectionId
                      const IconComponent = getIconComponent(goal.icon)
                      return (
                        <button
                          key={goal.id}
                          onClick={() => setMainPanelSection(goalSectionId)}
                          className={`btn-playful-nav w-full flex items-center gap-3 px-3 py-2 text-left ${
                            isSelected ? 'active' : ''
                          }`}
                          title={goal.title}
                        >
                          <IconComponent className="w-4 h-4 flex-shrink-0" />
                          <span className="font-semibold text-sm truncate flex-1">
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
                                onClick={() => setMainPanelSection(goalSectionId)}
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
                      onClick={() => setMainPanelSection(goalSectionId)}
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
              onClick={() => setShowCreateMenu(false)}
            />
            <div 
              className={`absolute ${sidebarCollapsed ? 'left-14 bottom-12' : 'left-4 bottom-20'} z-50 bg-white border-2 border-primary-500 rounded-playful-md min-w-[160px]`}
            >
              <button
                onClick={() => {
                  handleCreateGoal()
                  setShowCreateMenu(false)
                }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary-50 transition-colors font-medium flex items-center gap-2 text-black border-b border-primary-200 first:rounded-t-playful-md last:rounded-b-playful-md last:border-b-0"
              >
                <Target className="w-4 h-4" />
                <span>{t('navigation.goals')}</span>
              </button>
              <button
                onClick={() => {
                  handleOpenStepModal()
                  setShowCreateMenu(false)
                }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary-50 transition-colors font-medium flex items-center gap-2 text-black border-b border-primary-200 first:rounded-t-playful-md last:rounded-b-playful-md last:border-b-0"
              >
                <Footprints className="w-4 h-4" />
                <span>{t('navigation.steps')}</span>
              </button>
              <button
                onClick={() => {
                  handleOpenHabitModal(null)
                  setShowCreateMenu(false)
                }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary-50 transition-colors font-medium flex items-center gap-2 text-black border-b border-primary-200 first:rounded-t-playful-md last:rounded-b-playful-md last:border-b-0"
              >
                <CheckSquare className="w-4 h-4" />
                <span>{t('navigation.habits')}</span>
              </button>
              <button
                onClick={() => {
                  handleOpenAreaEditModal()
                  setShowCreateMenu(false)
                }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary-50 transition-colors font-medium flex items-center gap-2 text-black border-b border-primary-200 first:rounded-t-playful-md last:rounded-b-playful-md last:border-b-0"
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

