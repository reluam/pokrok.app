'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Protect, PricingTable } from '@clerk/nextjs'
import { useTranslations, useLocale } from 'next-intl'
import { Settings, CalendarDays, CalendarRange, Calendar, CalendarCheck, LayoutDashboard, Target, BookOpen, ChevronDown, ChevronRight, ChevronLeft, GripVertical } from 'lucide-react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { OnlyTheImportantSettings } from './views/settings/OnlyTheImportantSettings'
import { ViewTypeSettings } from './views/settings/ViewTypeSettings'

type ViewType = 'day' | 'week' | 'month' | 'year' | 'areas'

interface ViewConfiguration {
  id: string
  user_id: string
  workflow_key: string
  enabled: boolean
  settings: {
    workflowSettings?: any
  } | null
  order_index: number
  created_at: string
  updated_at: string
}

interface AvailableWorkflow {
  key: string
  nameKey: string
  descriptionKey: string
  requiresPremium: boolean
}

interface WorkflowsViewProps {
  player?: any
  onBack?: () => void
  onNavigateToMain?: () => void
}

export function WorkflowsView({ player, onBack, onNavigateToMain }: WorkflowsViewProps) {
  const { user } = useUser()
  const t = useTranslations()
  const locale = useLocale()
  
  const [loading, setLoading] = useState(true)
  const [configurations, setConfigurations] = useState<ViewConfiguration[]>([])
  const [availableWorkflows, setAvailableWorkflows] = useState<Record<string, AvailableWorkflow>>({})
  const [selectedViewType, setSelectedViewType] = useState<ViewType | null>('day')
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState<string | null>(null)
  const [viewTypeVisibility, setViewTypeVisibility] = useState<Record<ViewType, boolean>>({
    day: true,
    week: true,
    month: true,
    year: true,
    areas: true
  })
  const [allViewsOrder, setAllViewsOrder] = useState<ViewType[]>(['day', 'week', 'month', 'year', 'areas']) // Unified order of all views
  const [activeId, setActiveId] = useState<string | null>(null)
  const [onlyImportantMaxTasks, setOnlyImportantMaxTasks] = useState<number>(3)
  const [isSavingMaxTasks, setIsSavingMaxTasks] = useState(false)
  
  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const isPremium = user?.publicMetadata?.plan === 'premium'

  useEffect(() => {
    loadData()
  }, [])

  // Update max tasks when config changes - removed as only_the_important is no longer used

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load available workflows
      const workflowsResponse = await fetch('/api/view-configurations/available')
      if (workflowsResponse.ok) {
        const workflows = await workflowsResponse.json()
        const workflowsMap: Record<string, AvailableWorkflow> = {}
        workflows.forEach((workflow: AvailableWorkflow) => {
          workflowsMap[workflow.key] = workflow
        })
        setAvailableWorkflows(workflowsMap)
      }

      // Load user configurations
      const configResponse = await fetch('/api/view-configurations')
      if (configResponse.ok) {
        const configs = await configResponse.json()
        setConfigurations(configs)
      }

      // Load view type visibility settings and order - unified list
      const viewTypes: ViewType[] = ['day', 'week', 'month', 'year', 'areas']
      const visibilityPromises = viewTypes.map(async (viewType) => {
        try {
          const response = await fetch(`/api/view-settings?view_type=${viewType}`)
          if (response.ok) {
            const data = await response.json()
            const visibleInNav = data?.visible_sections?._visible_in_navigation !== false // Default to true
            const order = data?.order_index !== undefined && data.order_index !== null ? data.order_index : null
            return { viewType, visibleInNav, order }
          }
        } catch (error) {
          console.error(`Error loading view settings for ${viewType}:`, error)
        }
        return { viewType, visibleInNav: true, order: null } // Default to true
      })

      const visibilityResults = await Promise.all(visibilityPromises)
      const visibilityMap: Record<ViewType, boolean> = {
        day: true,
        week: true,
        month: true,
        year: true,
        areas: true
      }
      visibilityResults.forEach(({ viewType, visibleInNav }) => {
        visibilityMap[viewType] = visibleInNav
      })
      setViewTypeVisibility(visibilityMap)
      
      // Load unified view order (all views together)
      const orderMap = new Map<ViewType, number>()
      visibilityResults.forEach(({ viewType, order }) => {
        if (order !== null && order !== undefined && typeof order === 'number') {
          orderMap.set(viewType, order)
        }
      })
      
      // Sort all views together by order_index
      const allViews: ViewType[] = ['day', 'week', 'month', 'year', 'areas']
      const viewsWithOrder = allViews
        .filter(vt => orderMap.has(vt))
        .sort((a, b) => (orderMap.get(a) || 0) - (orderMap.get(b) || 0))
      const viewsWithoutOrder = allViews.filter(vt => !orderMap.has(vt))
      setAllViewsOrder([...viewsWithOrder, ...viewsWithoutOrder])
    } catch (error) {
      console.error('Error loading workflows data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleWorkflow = async (workflowKey: string, currentEnabled: boolean) => {
    const config = configurations.find(c => c.workflow_key === workflowKey)
    const workflow = availableWorkflows[workflowKey]

    setIsUpdating(workflowKey)

    try {
      if (config) {
        // Update existing configuration
        const response = await fetch(`/api/view-configurations/${config.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: !currentEnabled })
        })

        if (response.ok) {
          loadData()
        } else {
          console.error('Error toggling workflow')
        }
      } else {
        // Create new configuration with default settings
        const defaultSettings = {
          workflowSettings: workflow?.key === 'only_the_important' ? { important_steps_count: 3 } : null
        }

        const response = await fetch('/api/view-configurations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workflow_key: workflowKey,
            enabled: true,
            settings: defaultSettings
          })
        })

        if (response.ok) {
          loadData()
        } else {
          console.error('Error creating workflow configuration')
        }
      }
    } catch (error) {
      console.error('Error toggling workflow:', error)
    } finally {
      setIsUpdating(null)
    }
  }

  const handleSaveSettings = async (configId: string, newSettings: any) => {
    setIsUpdating(configId)
    try {
      const config = configurations.find(c => c.id === configId)
      if (!config) return

      const updatedSettings = {
        ...config.settings,
        ...newSettings
      }

      const response = await fetch(`/api/view-configurations/${configId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updatedSettings })
      })

      if (response.ok) {
        setShowSettings(null)
        loadData()
      } else {
        console.error('Error saving settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setIsUpdating(null)
    }
  }

  const toggleViewTypeVisibility = async (viewType: ViewType, currentVisible: boolean) => {
    setIsUpdating(`view-${viewType}`)
    try {
      // Get current settings
      const response = await fetch(`/api/view-settings?view_type=${viewType}`)
      let currentSections = {}
      if (response.ok) {
        const data = await response.json()
        currentSections = data?.visible_sections || {}
      }

      // Update visibility
      const newSections = {
        ...currentSections,
        _visible_in_navigation: !currentVisible
      }

      const saveResponse = await fetch('/api/view-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          view_type: viewType,
          visible_sections: newSections,
          visible_in_navigation: !currentVisible
        })
      })

      if (saveResponse.ok) {
        setViewTypeVisibility(prev => ({ ...prev, [viewType]: !currentVisible }))
        // Trigger a custom event to notify SidebarNavigation to reload
        window.dispatchEvent(new CustomEvent('viewVisibilityChanged', { detail: { viewType } }))
      } else {
        console.error('Error toggling view type visibility')
      }
    } catch (error) {
      console.error('Error toggling view type visibility:', error)
    } finally {
      setIsUpdating(null)
    }
  }

  const getWorkflowConfig = (workflowKey: string): ViewConfiguration | undefined => {
    return configurations.find(c => c.workflow_key === workflowKey)
  }

  // Workflows are no longer displayed as separate items - they're now view types
  const getAllWorkflows = (): Array<{ workflow: AvailableWorkflow; config: ViewConfiguration | undefined }> => {
    return []
  }

  const viewTypeLabels: Record<ViewType, { label: string; icon: any }> = {
    day: { label: t('calendar.day') || 'Denní', icon: CalendarDays },
    week: { label: t('calendar.week') || 'Týdenní', icon: CalendarRange },
    month: { label: t('calendar.month') || 'Měsíční', icon: Calendar },
    year: { label: t('calendar.year') || 'Roční', icon: CalendarCheck },
    areas: { label: t('areas.title') || 'Oblasti', icon: LayoutDashboard }
  }

  // Sortable View Item Component
  function SortableViewItem({
    viewType,
    isActive,
    isVisibleInNav,
    isUpdating,
    viewTypeLabels,
    onSelect,
    onToggleVisibility,
    t
  }: {
    viewType: ViewType
    isActive: boolean
    isVisibleInNav: boolean
    isUpdating: boolean
    viewTypeLabels: Record<ViewType, { label: string; icon: any }>
    onSelect: () => void
    onToggleVisibility: (e: React.MouseEvent) => void
    t: any
  }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: viewType })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    }

    const Icon = viewTypeLabels[viewType].icon

    return (
      <div ref={setNodeRef} style={style} className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-2">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-primary-50 rounded-playful-sm"
            title={t('common.dragToReorder') || 'Přetáhněte pro změnu pořadí'}
          >
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
          <button
            onClick={onSelect}
            className={`btn-playful-nav flex-1 md:flex-1 flex items-center gap-3 px-3 py-2 text-left ${
              isActive ? 'active' : ''
            } ${!isVisibleInNav ? 'opacity-50' : ''}`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium text-sm">{viewTypeLabels[viewType].label}</span>
          </button>
        </div>
        <button
          onClick={onToggleVisibility}
          disabled={isUpdating}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 self-start md:self-center ${
            isVisibleInNav ? 'bg-primary-500' : 'bg-gray-300'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={isVisibleInNav ? t('views.hide') || 'Skrýt v navigaci' : t('views.show') || 'Zobrazit v navigaci'}
        >
          <span
            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
              isVisibleInNav ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="font-playful">{t('common.loading')}</p>
      </div>
    )
  }

  const allWorkflows = getAllWorkflows()

  const handleMenuClick = (workflowKey: string | null, viewType: ViewType | null) => {
    if (workflowKey) {
      setSelectedWorkflow(workflowKey)
      setSelectedViewType(null)
    } else if (viewType !== null) {
      setSelectedViewType(viewType)
      setSelectedWorkflow(null)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) return

    const oldIndex = allViewsOrder.indexOf(active.id as ViewType)
    const newIndex = allViewsOrder.indexOf(over.id as ViewType)

    if (oldIndex === -1 || newIndex === -1) return

    // Update local order for all views
    const newOrder = arrayMove(allViewsOrder, oldIndex, newIndex)
    setAllViewsOrder(newOrder)
    
    console.log(`Saving new unified order:`, newOrder.map((vt, idx) => ({ viewType: vt, index: idx })))

    // Save order to API for all views
    try {
      // Save order for each view sequentially to avoid race conditions
      for (let index = 0; index < newOrder.length; index++) {
        const viewType = newOrder[index]
        try {
          // Get current settings
          const response = await fetch(`/api/view-settings?view_type=${viewType}`)
          let currentSections = {}
          if (response.ok) {
            const data = await response.json()
            currentSections = data?.visible_sections || {}
          }

          // Update with new order
          const saveResponse = await fetch('/api/view-settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              view_type: viewType,
              visible_sections: currentSections,
              order_index: index
            })
          })
          
          if (!saveResponse.ok) {
            const errorData = await saveResponse.json().catch(() => ({}))
            console.error(`Error saving order for ${viewType} (index ${index}):`, errorData)
          } else {
            const savedData = await saveResponse.json()
            console.log(`Successfully saved order for ${viewType} (index ${index}):`, savedData.order_index)
          }
        } catch (error) {
          console.error(`Error saving order for ${viewType}:`, error)
        }
      }

      // Dispatch event to update navigation
      window.dispatchEvent(new CustomEvent('viewOrderChanged'))
    } catch (error) {
      console.error('Error saving view order:', error)
    }
  }

  return (
    <div className="flex h-full bg-primary-50">
      {/* Left sidebar menu */}
      <div className="w-64 border-r-4 border-primary-500 bg-white flex-shrink-0">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            {onNavigateToMain && (
              <button
                onClick={onNavigateToMain}
                className="p-1.5 rounded-playful-sm hover:bg-primary-50 transition-colors border-2 border-primary-500 text-black hover:text-primary-600"
                title={t('common.back') || 'Zpět'}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="text-lg font-bold text-black font-playful flex-1">{t('navigation.title') || 'Navigation'}</h2>
          </div>
          
          {/* All views - unified list without section headers */}
          <div className="pt-4 border-t-2 border-primary-200">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={allViewsOrder}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1.5">
                  {allViewsOrder.map(viewType => {
                    return (
                      <SortableViewItem
                        key={viewType}
                        viewType={viewType}
                        isActive={selectedViewType === viewType}
                        isVisibleInNav={viewTypeVisibility[viewType] !== false}
                        isUpdating={isUpdating === `view-${viewType}`}
                        viewTypeLabels={viewTypeLabels}
                        onSelect={() => {
                          handleMenuClick(null, viewType)
                        }}
                        onToggleVisibility={(e) => {
                          e.stopPropagation()
                          toggleViewTypeVisibility(viewType, viewTypeVisibility[viewType] !== false)
                        }}
                        t={t}
                      />
                    )
                  })}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Show workflow detail if workflow is selected */}
          {selectedWorkflow ? (() => {
            const workflow = availableWorkflows[selectedWorkflow]
            const config = getWorkflowConfig(selectedWorkflow)
            if (!workflow) return null
            
            const isEnabled = config?.enabled || false
            const isUpdatingThis = isUpdating === workflow.key || isUpdating === config?.id
            const showThisSettings = showSettings === config?.id

            const workflowContent = (
              <div>
                <h3 className="text-2xl font-bold font-playful mb-4">
                  {t(workflow.nameKey)}
                </h3>
                
                <div className="bg-white border-2 border-primary-500 rounded-playful-md">
                  {/* Workflow header */}
                  <div className="flex items-center justify-between p-4 border-b-2 border-primary-200">
                    <div className="flex-1 flex items-center gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {workflow.requiresPremium && (
                          <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded font-playful flex-shrink-0">
                            Premium
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {/* Status indicator */}
                      <div className={`w-3 h-3 rounded-full ${isEnabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                      
                      {/* Settings button */}
                      {isEnabled && config && (
                        <button
                          onClick={() => setShowSettings(showThisSettings ? null : config.id)}
                          className="btn-playful-secondary px-2 py-1 text-xs"
                          title={t('views.configure')}
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      )}
                      
                      {/* Toggle button */}
                      <button
                        onClick={() => toggleWorkflow(workflow.key, isEnabled)}
                        disabled={isUpdatingThis || (workflow.requiresPremium && !isPremium)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                          isEnabled ? 'bg-primary-500' : 'bg-gray-300'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={isEnabled ? t('views.deactivate') : t('views.activate')}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            isEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                  
                  {/* Workflow description */}
                  <div className="px-4 py-4">
                    <p className="text-sm text-gray-600 font-playful mb-4">
                      {t(workflow.descriptionKey)}
                    </p>
                    
                    {/* Status info */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-playful text-gray-700">
                        {t('workflows.showInNavigation') || 'Zobrazit v navigaci:'}
                      </span>
                      <span className={`font-playful font-semibold ${isEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                        {isEnabled ? t('common.yes') || 'Ano' : t('common.no') || 'Ne'}
                      </span>
                    </div>
                  </div>

                  {/* Settings Panel */}
                  {showThisSettings && config && isEnabled && (
                    <div className="px-4 pb-4 pt-2 border-t-2 border-primary-200 space-y-4">
                      {/* Workflow-specific Settings */}
                      {workflow.key === 'only_the_important' && (
                        <div>
                          <h4 className="text-sm font-bold text-black font-playful mb-2">
                            {t('workflows.onlyTheImportant.settings.title')}
                          </h4>
                          <OnlyTheImportantSettings
                            importantStepsCount={config.settings?.workflowSettings?.important_steps_count || 3}
                            onSave={(workflowSettings) => handleSaveSettings(config.id, { workflowSettings })}
                            onCancel={() => setShowSettings(null)}
                            isSaving={isUpdating === config.id}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )

            // Wrap in Protect if requires premium
            if (workflow.requiresPremium) {
              return (
                <Protect plan="premium" fallback={
                  <div>
                    <h3 className="text-2xl font-bold font-playful mb-4">
                      {t(workflow.nameKey)}
                    </h3>
                    <div className="bg-gray-100 border-2 border-gray-300 rounded-playful-md p-4 opacity-60">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded font-playful">
                              Premium
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 font-playful">
                            {t(workflow.descriptionKey)}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 font-playful mt-2">
                        {t('settings.subscription.upgradePrompt')}
                      </p>
                    </div>
                  </div>
                }>
                  {workflowContent}
                </Protect>
              )
            }

            return workflowContent
          })() : (
            <>
              {/* Show view type settings */}
              {selectedViewType && (
                <div>
                  <h3 className="text-2xl font-bold font-playful mb-4">
                    {viewTypeLabels[selectedViewType].label}
                  </h3>
                  
                  <div className="bg-white border-2 border-primary-500 rounded-playful-md p-4 space-y-4">
                    {/* Visibility toggle with description */}
                    <div className="flex items-center justify-between p-4 bg-primary-50 rounded-playful-sm border-2 border-primary-200">
                      <div className="flex-1">
                        <h4 className="text-base font-bold font-playful mb-1">
                          {t('views.showInNavigation') || 'Zobrazit v navigaci'}
                        </h4>
                        <p className="text-sm text-gray-600 font-playful">
                          {t('views.showInNavigationDescription') || 'Pokud je zapnuto, tento view se zobrazí v navigačním panelu na hlavním panelu.'}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleViewTypeVisibility(selectedViewType, viewTypeVisibility[selectedViewType] !== false)}
                        disabled={isUpdating === `view-${selectedViewType}`}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ml-4 ${
                          viewTypeVisibility[selectedViewType] !== false ? 'bg-primary-500' : 'bg-gray-300'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={viewTypeVisibility[selectedViewType] !== false ? t('views.hide') || 'Skrýt v navigaci' : t('views.show') || 'Zobrazit v navigaci'}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            viewTypeVisibility[selectedViewType] !== false ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Section visibility settings - only for views that have sections */}
                    {player?.user_id && (selectedViewType === 'day' || selectedViewType === 'week' || selectedViewType === 'month' || selectedViewType === 'year' || selectedViewType === 'areas') && (
                      <ViewTypeSettings viewType={selectedViewType} userId={player.user_id} />
                    )}
                  </div>
                </div>
              )}
              
              {!selectedViewType && (
                <div className="text-center py-12">
                  <p className="text-gray-600 font-playful">
                    {t('views.selectView') || 'Vyberte view z levého menu pro úpravu nastavení.'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
