'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { LayoutDashboard, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Target, Plus, Footprints, CheckSquare, Settings, Calendar, CalendarRange, CalendarDays, CalendarCheck, BarChart3, ListTodo, AlertCircle, Sparkles, GripVertical } from 'lucide-react'
import { getIconComponent } from '@/lib/icon-utils'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Sortable Area Component
function SortableArea({ 
  area, 
  children, 
  isExpanded, 
  onToggleExpand, 
  mainPanelSection, 
  setMainPanelSection,
  hoveredAreaId,
  setHoveredAreaId,
  areaButtonRefs,
  hasPastDeadlineGoals,
  hexToRgba,
  t
}: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: area.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const IconComponent = getIconComponent(area.icon || 'LayoutDashboard')
  const areaColor = area.color || '#ea580c'

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className="space-y-1.5 group"
      onMouseEnter={() => setHoveredAreaId(area.id)}
      onMouseLeave={() => setHoveredAreaId(null)}
    >
      <div className="flex items-center gap-1.5">
        <button
          {...attributes}
          {...listeners}
          className="px-1 py-2 rounded-playful-sm transition-all bg-transparent text-gray-400 hover:bg-primary-50 border-none cursor-grab active:cursor-grabbing"
          title={t('navigation.dragToReorder') || 'Přetáhněte pro změnu pořadí'}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <button
          ref={areaButtonRefs?.get(area.id)}
          onClick={() => {
            setMainPanelSection(`area-${area.id}`)
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
            onToggleExpand()
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
      {children}
    </div>
  )
}


interface SidebarNavigationProps {
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  mainPanelSection: string
  setMainPanelSection: (section: string) => void
  sidebarItems: Array<{ id: string; label: string; icon: any }>
  areas: any[]
  dailySteps: any[]
  expandedAreas: Set<string>
  setExpandedAreas: (areas: Set<string>) => void
  expandedGoalSections: Set<string>
  setExpandedGoalSections: (sections: Set<string>) => void
  handleOpenAreasManagementModal: () => void
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
  onAssistantClick?: () => void
  onAreasReorder?: (areaIds: string[]) => void
  onAreasUpdate?: (areas: any[]) => void
}

export function SidebarNavigation({
  sidebarCollapsed,
  setSidebarCollapsed,
  mainPanelSection,
  setMainPanelSection,
  sidebarItems,
  areas,
  dailySteps,
  expandedAreas,
  setExpandedAreas,
  expandedGoalSections,
  setExpandedGoalSections,
  handleOpenAreasManagementModal,
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
  onAssistantClick,
  onAreasReorder,
  onAreasUpdate
}: SidebarNavigationProps) {
  const t = useTranslations()
  const [hoveredAreaId, setHoveredAreaId] = useState<string | null>(null)
  const [hoveredGoalId, setHoveredGoalId] = useState<string | null>(null)
  const [hoveredPausedSectionId, setHoveredPausedSectionId] = useState<string | null>(null)
  const [hoveredCompletedSectionId, setHoveredCompletedSectionId] = useState<string | null>(null)
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  
  // Handle drag end for areas
  const handleAreasDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (over && active.id !== over.id && onAreasReorder) {
      const oldIndex = areas.findIndex((area) => area.id === active.id)
      const newIndex = areas.findIndex((area) => area.id === over.id)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newAreas = arrayMove(areas, oldIndex, newIndex)
        const areaIds = newAreas.map(area => area.id)
        onAreasReorder(areaIds)
      }
    }
  }
  

  // Helper function to calculate goal trend based on last 7 days
  const calculateGoalTrend = (goalId: string): number => {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Filter steps for this goal from last 7 days
    const goalSteps = dailySteps.filter(step => step.goal_id === goalId)
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
    const total = completed + overdue
    return total > 0 ? ((completed - overdue) / total) * 100 : 0
  }
  
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
      {/* Assistant button when collapsed - temporarily hidden */}
      {false && sidebarCollapsed && (
        <div className="flex flex-col items-center pt-12 pb-2 border-b-2 border-primary-200">
          <button
            onClick={() => {
              if (onAssistantClick) {
                onAssistantClick()
              } else {
                // Fallback: dispatch custom event to open assistant
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('openAssistant'))
                }
              }
            }}
            className="w-10 h-10 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ease-in-out active:scale-95"
            aria-label={t('assistant.expand') || 'Asistent'}
            title={t('assistant.expand') || 'Asistent'}
          >
            <Sparkles className="w-5 h-5" />
          </button>
        </div>
      )}
      <div className={`${sidebarCollapsed ? 'p-2 pt-2' : 'p-4'} flex-1 overflow-y-auto`}>
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
                
                {/* Overview calendar view */}
                <button
                  onClick={() => setMainPanelSection('overview')}
                  className={`btn-playful-nav w-full flex items-center gap-3 px-3 py-2 text-left ${
                    mainPanelSection === 'overview' || 
                    mainPanelSection === 'focus-month' || 
                    mainPanelSection === 'focus-year' || 
                    mainPanelSection === 'focus-calendar' 
                      ? 'active' : ''
                  }`}
                >
                  <CalendarDays className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium text-sm">{t('calendar.overview') || 'Přehled'}</span>
                </button>
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
              <button
                onClick={() => setMainPanelSection('overview')}
                className={`btn-playful-nav flex items-center justify-center w-10 h-10 ${
                  mainPanelSection === 'overview' || 
                  mainPanelSection === 'focus-month' || 
                  mainPanelSection === 'focus-year' || 
                  mainPanelSection === 'focus-calendar' 
                    ? 'active' : ''
                }`}
                title={t('calendar.overview') || 'Přehled'}
              >
                <CalendarDays className="w-5 h-5 flex-shrink-0" />
              </button>
            </>
          )}
          
          {/* Areas list - directly under Calendar views */}
          {!sidebarCollapsed && viewTypeVisibility['areas'] !== false && (
            <div className="space-y-2">
              {/* Areas header */}
              <div className="flex items-center justify-between px-2 py-1">
                <h3 className="text-xs font-bold text-black uppercase tracking-wider font-playful">
                  {t('areas.title') || 'Oblasti'}
                </h3>
              </div>
              
              {/* Areas */}
              {areas.length > 0 && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleAreasDragEnd}
                >
                  <SortableContext
                    items={areas.map(area => area.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {areas.map((area) => {
                      const isExpanded = expandedAreas.has(area.id)
                      const areaColor = area.color || '#ea580c'
                      
                      return (
                        <SortableArea
                          key={area.id} 
                          area={area}
                          isExpanded={isExpanded}
                          onToggleExpand={() => {
                            if (isExpanded) {
                              setExpandedAreas(new Set())
                            } else {
                              setExpandedAreas(new Set([area.id]))
                            }
                          }}
                          mainPanelSection={mainPanelSection}
                          setMainPanelSection={setMainPanelSection}
                          hoveredAreaId={hoveredAreaId}
                          setHoveredAreaId={setHoveredAreaId}
                          areaButtonRefs={areaButtonRefs}
                          hasPastDeadlineGoals={false}
                          hexToRgba={hexToRgba}
                          t={t}
                        >
                          {/* Goals removed - no goals to display */}
                        </SortableArea>
                      )
                    })}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          )}
          
          {/* Collapsed areas - show as icons */}
          {sidebarCollapsed && areas.length > 0 && (
            <div className="space-y-2 mt-2">
              {/* Areas */}
              {areas.slice(0, 5).map((area) => {
                const isExpanded = expandedAreas.has(area.id)
                const IconComponent = getIconComponent(area.icon || 'LayoutDashboard')
                const areaColor = area.color || '#ea580c'
                const isAreaSelected = mainPanelSection.startsWith('area-') && mainPanelSection === `area-${area.id}`
                
                return (
                  <div key={area.id} className="space-y-1">
                    <button
                      onClick={() => {
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
                    
                    {/* Goals removed - no goals to display */}
                  </div>
                )
              })}
            </div>
          )}
          
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
      
      {/* Toggle button - half out on the right side */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className={`absolute top-4 -right-3 w-7 h-7 bg-white text-black rounded-full flex items-center justify-center hover:bg-primary-50 transition-colors border-2 border-primary-500 z-10 btn-playful-base`}
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

