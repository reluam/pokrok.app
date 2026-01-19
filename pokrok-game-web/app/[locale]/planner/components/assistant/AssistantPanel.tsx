'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight, Sparkles, X, Plus, Target, Footprints, CheckSquare, Layers } from 'lucide-react'
import { AssistantPanelHeader } from './AssistantPanelHeader'
import { AssistantSearch } from './AssistantSearch'
import { AssistantTips } from './AssistantTips'

interface AssistantPanelProps {
  currentPage: string
  mainPanelSection?: string | null
  userId: string | null
  onOpenStepModal: (step?: any) => void
  onNavigateToGoal: (goalId: string) => void
  onNavigateToArea: (areaId: string) => void
  onNavigateToHabits: (habitId?: string) => void
  onMinimizeStateChange?: (isMinimized: boolean, isSmallScreen: boolean) => void
  onOpenHabitModal?: (habit?: any) => void
  onOpenAreasManagementModal?: () => void
  onCreateGoal?: () => void
  sidebarCollapsed?: boolean
}

export function AssistantPanel({
  currentPage,
  mainPanelSection,
  userId,
  onOpenStepModal,
  onNavigateToGoal,
  onNavigateToArea,
  onNavigateToHabits,
  onMinimizeStateChange,
  onOpenHabitModal,
  onOpenAreasManagementModal,
  onCreateGoal,
  sidebarCollapsed = false
}: AssistantPanelProps) {
  const t = useTranslations()
  const [isEnabled, setIsEnabled] = useState(true) // Default true, will be loaded from settings
  const [showTips, setShowTips] = useState(true) // Default true, will be loaded from localStorage
  const [isMinimized, setIsMinimized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [shouldFocusSearch, setShouldFocusSearch] = useState(false)
  const [assistantResult, setAssistantResult] = useState<{ message: string; success: boolean; actions?: any[]; preview?: { items: any[]; summary: string }; instructions?: any[]; requiresConfirmation?: boolean } | null>(null)

  // Check if we're on small screen (< 1024px) and mobile (< 640px)
  // Initialize with window check for SSR compatibility
  const [isSmallScreen, setIsSmallScreen] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  )
  const [isMobile, setIsMobile] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)

  // Load assistant enabled state and show tips setting from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('assistantEnabled')
      setIsEnabled(saved !== 'false') // Default to true if not set
      
      const savedShowTips = localStorage.getItem('assistantShowTips')
      setShowTips(savedShowTips !== 'false') // Default to true if not set
      
      // Load minimized state from localStorage
      const savedMinimized = localStorage.getItem('assistantPanelMinimized') === 'true'
      setIsMinimized(savedMinimized)
      
      setIsLoading(false)
    }
  }, [])

  // Listen for settings changes (e.g., from Settings page)
  useEffect(() => {
    const handleSettingsChange = () => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('assistantEnabled')
        setIsEnabled(saved !== 'false') // Default to true if not set
        
        const savedShowTips = localStorage.getItem('assistantShowTips')
        setShowTips(savedShowTips !== 'false') // Default to true if not set
      }
    }

    window.addEventListener('assistantSettingsChanged', handleSettingsChange)
    return () => window.removeEventListener('assistantSettingsChanged', handleSettingsChange)
  }, [])

  // Listen for custom event to open assistant
  useEffect(() => {
    const handleOpenAssistant = () => {
      setIsModalOpen(true)
    }
    
    window.addEventListener('openAssistant', handleOpenAssistant)
    return () => window.removeEventListener('openAssistant', handleOpenAssistant)
  }, [])

  // Auto-minimize on small screens when resizing down (but allow user to expand manually)
  useEffect(() => {
    let previousWidth = window.innerWidth
    
    const handleResize = () => {
      const currentWidth = window.innerWidth
      // Only auto-minimize when resizing DOWN below 1024px
      // Don't auto-minimize if user manually expanded it
      if (currentWidth < 1024 && previousWidth >= 1024 && !isMinimized) {
        setIsMinimized(true)
        localStorage.setItem('assistantPanelMinimized', 'true')
      }
      previousWidth = currentWidth
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isMinimized])

  const handleToggleMinimizeWithTracking = useCallback(() => {
    const newMinimized = !isMinimized
    setIsMinimized(newMinimized)
    localStorage.setItem('assistantPanelMinimized', String(newMinimized))
  }, [isMinimized])

  const handleOpenSearch = useCallback(() => {
    setIsMinimized(false)
    setShouldFocusSearch(true)
    localStorage.setItem('assistantPanelMinimized', 'false')
  }, [])

  useEffect(() => {
    const checkScreenSize = () => {
      if (typeof window === 'undefined') return
      const width = window.innerWidth
      setIsSmallScreen(width < 1024)
      setIsMobile(width < 640)
      // Close modal when resizing to non-mobile
      if (width >= 640 && isModalOpen) {
        setIsModalOpen(false)
      }
    }
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [isModalOpen])

  // Notify parent about minimize state changes
  useEffect(() => {
    if (onMinimizeStateChange) {
      onMinimizeStateChange(isMinimized, isSmallScreen)
    }
  }, [isMinimized, isSmallScreen, onMinimizeStateChange])

  // Don't render if explicitly disabled
  if (!isLoading && !isEnabled) {
    return null
  }

  // Don't render panel on mobile - use floating button + modal instead
  if (isMobile) {
    // Determine which options are available based on current context
    const canAddArea = currentPage === 'main' && mainPanelSection === 'focus-upcoming'
    const canAddGoal = (currentPage === 'main' && mainPanelSection === 'focus-upcoming') || currentPage === 'goals'
    const canAddStep = true // Can add step anywhere via modal
    const canAddHabit = true // Can add habit anywhere via modal
    
    // Build menu items based on availability
    const menuItems = []
    
    if (canAddArea) {
      menuItems.push(
        <button
          key="area"
          onClick={() => {
            if (onOpenAreasManagementModal) {
              onOpenAreasManagementModal()
            }
            setShowAddMenu(false)
          }}
          className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 active:bg-gray-100 text-primary-600 rounded-lg transition-all duration-200 border border-primary-200 min-w-[160px]"
          aria-label={t('areas.add') || 'Přidat výzvu'}
        >
          <Layers className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{t('areas.add') || 'Přidat výzvu'}</span>
        </button>
      )
    }
    
    if (canAddGoal) {
      menuItems.push(
        <button
          key="goal"
          onClick={() => {
            if (onCreateGoal) {
              onCreateGoal()
            }
            setShowAddMenu(false)
          }}
          className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 active:bg-gray-100 text-primary-600 rounded-lg transition-all duration-200 border border-primary-200 min-w-[160px]"
          aria-label={t('goals.add') || 'Přidat cíl'}
        >
          <Target className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{t('goals.add') || 'Přidat cíl'}</span>
        </button>
      )
    }
    
    if (canAddStep) {
      menuItems.push(
        <button
          key="step"
          onClick={() => {
            if (onOpenStepModal) {
              onOpenStepModal(undefined)
            }
            setShowAddMenu(false)
          }}
          className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 active:bg-gray-100 text-primary-600 rounded-lg transition-all duration-200 border border-primary-200 min-w-[160px]"
          aria-label={t('steps.addStep') || 'Přidat krok'}
        >
          <Footprints className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{t('steps.addStep') || 'Přidat krok'}</span>
        </button>
      )
    }
    
    if (canAddHabit) {
      menuItems.push(
        <button
          key="habit"
          onClick={() => {
            if (onOpenHabitModal) {
              onOpenHabitModal(undefined)
            }
            setShowAddMenu(false)
          }}
          className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 active:bg-gray-100 text-primary-600 rounded-lg transition-all duration-200 border border-primary-200 min-w-[160px]"
          aria-label={t('habits.add') || 'Přidat návyk'}
        >
          <CheckSquare className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{t('habits.add') || 'Přidat návyk'}</span>
        </button>
      )
    }
    
    return (
      <>
        {/* Floating buttons - bottom right (hidden when sidebar is collapsed) */}
        {!sidebarCollapsed && (
        <div className="fixed bottom-6 right-6 z-[99] flex flex-col gap-3 items-end">
          {/* Add button with menu */}
          {showAddMenu && menuItems.length > 0 && (
            <>
              {/* Backdrop to close menu */}
              <div 
                className="fixed inset-0 z-[98]"
                onClick={() => setShowAddMenu(false)}
              />
              <div className="flex flex-col gap-2 mb-2 z-[99] bg-white rounded-xl shadow-xl border-2 border-primary-200 p-2">
                {menuItems}
              </div>
            </>
          )}
          
          {/* Assistant button - on top */}
          <button
            onClick={() => {
              setShowAddMenu(false) // Close add menu when opening assistant
              setIsModalOpen(true)
            }}
            className="w-14 h-14 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ease-in-out active:scale-95 z-[99]"
            aria-label={t('assistant.expand')}
          >
            <Sparkles className="w-6 h-6" />
          </button>
          
          {/* Add button - below assistant */}
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className={`w-14 h-14 ${showAddMenu ? 'bg-primary-600' : 'bg-primary-500'} hover:bg-primary-600 active:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ease-in-out active:scale-95 z-[99]`}
            aria-label={t('common.add') || 'Přidat'}
          >
            {showAddMenu ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
          </button>
        </div>
        )}

        {/* Fullscreen modal */}
        {isModalOpen && (
          <div className="fixed z-[100] bg-primary-50 flex flex-col" style={{ top: '64px', left: 0, right: 0, bottom: 0 }}>
            {/* Modal header */}
            <div className="flex items-center justify-between p-4 border-b-2 border-primary-200 bg-white flex-shrink-0">
              <h2 className="text-lg font-semibold text-primary-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-600" />
                {t('assistant.title')}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-primary-100 active:bg-primary-200 rounded-lg transition-colors touch-manipulation flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label={t('common.close')}
              >
                <X className="w-6 h-6 text-primary-900" />
              </button>
            </div>

            {/* Modal content */}
            <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
              <div className="flex-shrink-0">
                <AssistantSearch
                  userId={userId}
                  onOpenStepModal={onOpenStepModal}
                  onNavigateToGoal={onNavigateToGoal}
                  onNavigateToArea={onNavigateToArea}
                  onNavigateToHabits={onNavigateToHabits}
                  shouldFocus={false}
                  onResultChange={(result) => setAssistantResult(result)}
                />
              </div>
                <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
                {assistantResult ? (
                  <div className={`p-4 ${assistantResult.success ? 'bg-primary-50' : 'bg-red-50'}`}>
                    <div className={`text-sm ${assistantResult.success ? 'text-primary-700' : 'text-red-700'}`}>
                      {assistantResult.message}
                    </div>
                    {assistantResult.actions && assistantResult.actions.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {assistantResult.actions.map((action: any, index: number) => (
                          <div key={index} className="text-xs text-primary-600">
                            {action.success ? '✅' : '❌'} {action.message}
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              ) : (
                  showTips ? (
                    <AssistantTips
                      currentPage={currentPage}
                      mainPanelSection={mainPanelSection}
                      userId={userId}
                      showTips={showTips}
                    />
                  ) : (
                    <div className="p-4">
                      <p className="text-xs text-primary-600 text-center">
                        {t('assistant.tips.disabled') || 'Tipy jsou vypnuté v nastavení.'}
                      </p>
                    </div>
                  )
                  )}
                </div>
            </div>
          </div>
        )}
      </>
    )
  }

  // Expanded state - show full panel
  // On small screens (640px - 1024px): 
  //   - minimized: normal flex (takes 48px space), page adjusts
  //   - expanded: fixed overlay (overlays page)
  // On large screens: normal flex layout (always takes space)
  // Hide panel when sidebar is collapsed (assistant icon is shown in sidebar instead)
  // But still show modal if it's open
  const shouldHidePanel = sidebarCollapsed && !isMobile && !isModalOpen
  
  // Show modal even when panel is hidden
  if (shouldHidePanel) {
    return (
      <>
        {/* Fullscreen modal */}
        {isModalOpen && (
          <div className="fixed z-[100] bg-primary-50 flex flex-col" style={{ top: '64px', left: 0, right: 0, bottom: 0 }}>
            {/* Modal header */}
            <div className="flex items-center justify-between p-4 border-b-2 border-primary-200 bg-white flex-shrink-0">
              <h2 className="text-lg font-semibold text-primary-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-600" />
                {t('assistant.title')}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-primary-100 active:bg-primary-200 rounded-lg transition-colors touch-manipulation flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label={t('common.close')}
              >
                <X className="w-6 h-6 text-primary-900" />
              </button>
            </div>

            {/* Modal content */}
            <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
              <div className="flex-shrink-0">
                <AssistantSearch
                  userId={userId}
                  onOpenStepModal={onOpenStepModal}
                  onNavigateToGoal={onNavigateToGoal}
                  onNavigateToArea={onNavigateToArea}
                  onNavigateToHabits={onNavigateToHabits}
                  shouldFocus={false}
                  onResultChange={(result) => setAssistantResult(result)}
                />
              </div>
              <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
                {assistantResult ? (
                  <div className={`p-4 ${assistantResult.success ? 'bg-primary-50' : 'bg-red-50'}`}>
                    <div className={`text-sm ${assistantResult.success ? 'text-primary-700' : 'text-red-700'}`}>
                      {assistantResult.message}
                    </div>
                    {assistantResult.actions && assistantResult.actions.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {assistantResult.actions.map((action: any, index: number) => (
                          <div key={index} className="text-xs text-primary-600">
                            {action.success ? '✅' : '❌'} {action.message}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  showTips ? (
                    <AssistantTips
                      currentPage={currentPage}
                      mainPanelSection={mainPanelSection}
                      userId={userId}
                      showTips={showTips}
                    />
                  ) : (
                    <div className="p-4">
                      <p className="text-xs text-primary-600 text-center">
                        {t('assistant.tips.disabled') || 'Tipy jsou vypnuté v nastavení.'}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </>
    )
  }
  
  const panelClasses = isSmallScreen
    ? isMinimized 
      ? `flex flex-col fixed right-0 top-16 bottom-0 z-50 w-12`  // Fixed position, always at right edge
      : `fixed right-0 top-16 bottom-0 z-50 shadow-2xl w-72`  // Overlay
    : `flex flex-col relative z-50 ml-auto flex-shrink-0 ${isMinimized ? 'w-12' : 'w-72'}`  // Normal flex - push to right, fixed width
  
  return (
    <>
      {isSmallScreen && !isMinimized && (
        <div 
          className="fixed inset-0 top-16 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ease-in-out"
          onClick={handleToggleMinimizeWithTracking}
        />
      )}
      <div 
        className={`${panelClasses} bg-primary-50 border-l-4 border-primary-500 transition-all duration-300 ease-in-out`}
      >
        {isMinimized ? (
          <div className="flex flex-col items-center w-12">
            <button
              onClick={handleToggleMinimizeWithTracking}
              className="w-full p-3 hover:bg-primary-100 transition-colors flex items-center justify-center group"
              title={t('assistant.expand')}
              aria-label={t('assistant.expand')}
            >
              <ChevronLeft className="w-5 h-5 text-primary-600 group-hover:text-primary-700" />
            </button>
            <div className="w-full border-b border-primary-300"></div>
            <button
              onClick={handleOpenSearch}
              className="w-full p-3 hover:bg-primary-100 transition-colors flex items-center justify-center group"
              title={t('assistant.prompt.placeholder') || 'Napiš, co chceš udělat...'}
              aria-label={t('assistant.prompt.placeholder') || 'Napiš, co chceš udělat...'}
            >
              <Sparkles className="w-5 h-5 text-primary-600 group-hover:text-primary-700" />
            </button>
          </div>
        ) : (
          <>
            <AssistantPanelHeader onMinimize={handleToggleMinimizeWithTracking} />
            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
              <div className="flex-shrink-0">
                <AssistantSearch
                  userId={userId}
                  onOpenStepModal={onOpenStepModal}
                  onNavigateToGoal={onNavigateToGoal}
                  onNavigateToArea={onNavigateToArea}
                  onNavigateToHabits={onNavigateToHabits}
                  shouldFocus={shouldFocusSearch}
                  onFocusHandled={() => setShouldFocusSearch(false)}
                  onResultChange={(result) => setAssistantResult(result)}
                />
              </div>
                <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
                {assistantResult ? (
                  <div className={`p-4 ${assistantResult.success ? 'bg-primary-50' : 'bg-red-50'}`}>
                    <div className={`text-sm ${assistantResult.success ? 'text-primary-700' : 'text-red-700'}`}>
                      {assistantResult.message}
                    </div>
                    {assistantResult.actions && assistantResult.actions.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {assistantResult.actions.map((action: any, index: number) => (
                          <div key={index} className="text-xs text-primary-600">
                            {action.success ? '✅' : '❌'} {action.message}
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              ) : (
                  showTips ? (
                    <AssistantTips
                      currentPage={currentPage}
                      mainPanelSection={mainPanelSection}
                      userId={userId}
                      showTips={showTips}
                    />
                  ) : (
                    <div className="p-4">
                      <p className="text-xs text-primary-600 text-center">
                        {t('assistant.tips.disabled') || 'Tipy jsou vypnuté v nastavení.'}
                      </p>
                    </div>
                  )
                  )}
                </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

