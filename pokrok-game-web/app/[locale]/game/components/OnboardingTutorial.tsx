'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { X, ArrowRight, ArrowDown, ArrowDownLeft, ArrowLeft, Target, Footprints, CheckSquare, LayoutDashboard, HelpCircle, Plus, ChevronDown } from 'lucide-react'
import { getIconComponent, AVAILABLE_ICONS } from '@/lib/icon-utils'

interface OnboardingTutorialProps {
  isActive: boolean
  onComplete: () => void
  onSkip: () => void
  areas: any[]
  goals: any[]
  habits: any[]
  dailySteps: any[]
  selectedAreaId: string | null
  onAreaClick?: (areaId: string) => void
  onCreateMenuOpen?: () => void
  onCreateArea?: (areaData: { name: string; description: string | null; color: string; icon: string }) => Promise<boolean>
  onCreateGoal?: (goalData: { title: string; description: string | null; areaId: string | null }) => Promise<boolean>
  onCreateStep?: () => void
  createMenuButtonRef?: React.RefObject<HTMLButtonElement>
  areaButtonRefs?: Map<string, React.RefObject<HTMLButtonElement>>
  showCreateMenu?: boolean
  onStepChange?: (step: OnboardingStep) => void
  createMenuRef?: React.RefObject<HTMLDivElement>
  showAreaEditModal?: boolean
  onAreaCreated?: (area: any) => void
  onAreaButtonClick?: () => void
  onGoalClick?: (goalId: string) => void
  goalButtonRefs?: Map<string, React.RefObject<HTMLButtonElement>>
  goalsSectionRef?: React.RefObject<HTMLDivElement>
  externalStep?: OnboardingStep
}

type OnboardingStep = 
  | 'intro'
  | 'add-button'
  | 'add-menu-open'
  | 'create-area'
  | 'click-area'
  | 'add-menu-goal'
  | 'create-goal'
  | 'click-goal'
  | 'complete'

export function OnboardingTutorial({
  isActive,
  onComplete,
  onSkip,
  areas,
  goals,
  habits,
  dailySteps,
  selectedAreaId,
  onAreaClick,
  onCreateMenuOpen,
  onCreateArea,
  onCreateGoal,
  onCreateStep,
  createMenuButtonRef,
  areaButtonRefs,
  showCreateMenu,
  onStepChange,
  createMenuRef,
  showAreaEditModal,
  onAreaCreated,
  onAreaButtonClick,
  onGoalClick,
  goalButtonRefs,
  goalsSectionRef,
  externalStep
}: OnboardingTutorialProps) {
  const t = useTranslations()
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('intro')
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null)
  const [modalElement, setModalElement] = useState<HTMLElement | null>(null)
  const [overlayRegions, setOverlayRegions] = useState<Array<{ top: number; left: number; width: number; height: number }>>([])
  const [isMobile, setIsMobile] = useState(false)
  
  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  const [areaName, setAreaName] = useState('')
  const [areaDescription, setAreaDescription] = useState('')
  const [areaColor, setAreaColor] = useState('#ea580c')
  const [areaIcon, setAreaIcon] = useState('LayoutDashboard')
  const [showAreaIconPicker, setShowAreaIconPicker] = useState(false)
  const [isSavingArea, setIsSavingArea] = useState(false)
  const isSavingAreaRef = useRef(false)
  const initialGoalsCountRef = useRef(0)
  
  const arrowRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const lastNotifiedStepRef = useRef<OnboardingStep | null>(null)
  const isInternalChangeRef = useRef(false)

  // Use ref to store onStepChange to avoid recreating callback
  const onStepChangeRef = useRef(onStepChange)
  useEffect(() => {
    onStepChangeRef.current = onStepChange
  }, [onStepChange])

  // Stable callback for step changes
  const notifyStepChange = useCallback((step: OnboardingStep) => {
    if (onStepChangeRef.current && step !== lastNotifiedStepRef.current && !isInternalChangeRef.current) {
      lastNotifiedStepRef.current = step
      onStepChangeRef.current(step)
    }
  }, []) // Empty deps - use ref instead

  // Sync with external step changes (when parent component changes onboardingStep)
  // Only sync if externalStep is explicitly set and different from currentStep
  // This allows parent to control the step (e.g., when clicking Area button)
  useEffect(() => {
    if (externalStep && externalStep !== currentStep) {
      // This is an external change (from parent), so mark it as internal to prevent notification loop
      isInternalChangeRef.current = true
      setCurrentStep(externalStep)
      lastNotifiedStepRef.current = externalStep
      setTimeout(() => {
        isInternalChangeRef.current = false
      }, 0)
    }
  }, [externalStep]) // Only depend on externalStep, not currentStep, to avoid loops

  // Watch for area creation - when area is created, move to next step
  // This is now handled directly in handleSaveArea after successful creation
  // We removed the automatic useEffect to prevent premature step switching
  // The step transition is now controlled explicitly in handleSaveArea

  // Watch for goal creation - when a goal is created, move to next step
  useEffect(() => {
    if (currentStep === 'create-goal') {
      // Initialize the count when entering this step
      if (initialGoalsCountRef.current === 0) {
        initialGoalsCountRef.current = goals.length
      }
      
      // Check if a new goal was created (goals array increased)
      if (goals.length > initialGoalsCountRef.current) {
        // A new goal was created, move to click-goal step
        setTimeout(() => {
          isInternalChangeRef.current = true
          setCurrentStep('click-goal')
          notifyStepChange('click-goal')
          initialGoalsCountRef.current = 0 // Reset for next time
          setTimeout(() => {
            isInternalChangeRef.current = false
          }, 100)
        }, 1000)
      }
    } else {
      // Reset when leaving the step
      initialGoalsCountRef.current = 0
    }
  }, [goals.length, currentStep, notifyStepChange])

  // Watch for menu opening in add-button step
  useEffect(() => {
    if (currentStep === 'add-button' && showCreateMenu) {
      // Notify parent first, before setting internal change flag
      notifyStepChange('add-menu-open')
      // Then update internal state
      isInternalChangeRef.current = true
      setCurrentStep('add-menu-open')
      setTimeout(() => {
        isInternalChangeRef.current = false
      }, 100)
    }
  }, [showCreateMenu, currentStep, notifyStepChange])

  // Notify parent of step changes (but only if it's different from external step to avoid loops)
  // Skip notification if externalStep is set and matches currentStep (to avoid loops)
  useEffect(() => {
    // Only notify if:
    // 1. We're not in the middle of an internal change (to prevent loops)
    // 2. externalStep is not set (initial state), OR
    // 3. externalStep is different from currentStep (user action changed step internally)
    if (!isInternalChangeRef.current && (!externalStep || externalStep !== currentStep)) {
      notifyStepChange(currentStep)
    }
  }, [currentStep, externalStep, notifyStepChange])

  // Watch for area selection
  useEffect(() => {
    if (currentStep === 'click-area' && selectedAreaId && areas.some(a => a.id === selectedAreaId)) {
      // Wait a bit for UI to update, then move to add-menu-goal step
      setTimeout(() => {
        setCurrentStep('add-menu-goal')
        notifyStepChange('add-menu-goal')
        // Open the create menu
        if (onCreateMenuOpen) {
          onCreateMenuOpen()
        }
      }, 1000)
    }
  }, [selectedAreaId, areas, currentStep, notifyStepChange, onCreateMenuOpen])

  // Track modal element
  useEffect(() => {
    if (modalRef.current) {
      setModalElement(modalRef.current)
    }
  }, [currentStep])

  // Calculate and update overlay regions - skip on mobile
  useEffect(() => {
    if (isMobile || !isActive) {
      setOverlayRegions([])
      return
    }

    const calculateRegions = () => {
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const excludeRects: Array<{ left: number; top: number; right: number; bottom: number }> = []
      
      // Always exclude modal
      if (modalElement) {
        const rect = modalElement.getBoundingClientRect()
        const padding = 20
        excludeRects.push({
          left: Math.max(0, rect.left - padding),
          top: Math.max(0, rect.top - padding),
          right: Math.min(viewportWidth, rect.right + padding),
          bottom: Math.min(viewportHeight, rect.bottom + padding)
        })
      }
      
      // Exclude highlighted element if it exists
      // In add-menu-open and add-menu-goal steps, we want to highlight the menu
      // In click-area step, we want to highlight the area button in the sidebar
      // In click-goal step, we want to highlight the goals section
      if (highlightedElement && currentStep !== 'intro' && currentStep !== 'complete' && currentStep !== 'add-menu-open' && currentStep !== 'add-menu-goal' && currentStep !== 'create-area' && currentStep !== 'create-goal' && currentStep !== 'click-goal') {
        const rect = highlightedElement.getBoundingClientRect()
        let padding = 8 // Default padding
        if (currentStep === 'click-area') {
          padding = 8 // Padding for area button
        }
        excludeRects.push({
          left: Math.max(0, rect.left - padding),
          top: Math.max(0, rect.top - padding),
          right: Math.min(viewportWidth, rect.right + padding),
          bottom: Math.min(viewportHeight, rect.bottom + padding)
        })
      }
      
      // Special handling for add-menu-open and add-menu-goal steps - exclude the entire menu
      if ((currentStep === 'add-menu-open' || currentStep === 'add-menu-goal') && highlightedElement) {
        const rect = highlightedElement.getBoundingClientRect()
        const padding = 20 // More padding for menu
        excludeRects.push({
          left: Math.max(0, rect.left - padding),
          top: Math.max(0, rect.top - padding),
          right: Math.min(viewportWidth, rect.right + padding),
          bottom: Math.min(viewportHeight, rect.bottom + padding)
        })
      }
      
      // Special handling for click-goal step - exclude the entire goals section
      if (currentStep === 'click-goal' && highlightedElement) {
        const rect = highlightedElement.getBoundingClientRect()
        const padding = 20 // More padding for goals section
        excludeRects.push({
          left: Math.max(0, rect.left - padding),
          top: Math.max(0, rect.top - padding),
          right: Math.min(viewportWidth, rect.right + padding),
          bottom: Math.min(viewportHeight, rect.bottom + padding)
        })
      }

      // If no exclusions, show full overlay
      if (excludeRects.length === 0) {
        setOverlayRegions([{ top: 0, left: 0, width: viewportWidth, height: viewportHeight }])
        return
      }

      // Find bounding box of all exclusions
      const minLeft = Math.min(...excludeRects.map(r => r.left))
      const maxRight = Math.max(...excludeRects.map(r => r.right))
      const minTop = Math.min(...excludeRects.map(r => r.top))
      const maxBottom = Math.max(...excludeRects.map(r => r.bottom))

      const regions: Array<{ top: number; left: number; width: number; height: number }> = []
      
      // Top region
      if (minTop > 0) {
        regions.push({ top: 0, left: 0, width: viewportWidth, height: minTop })
      }
      // Bottom region
      if (maxBottom < viewportHeight) {
        regions.push({ top: maxBottom, left: 0, width: viewportWidth, height: viewportHeight - maxBottom })
      }
      // Left region
      if (minLeft > 0) {
        regions.push({ top: minTop, left: 0, width: minLeft, height: Math.max(0, maxBottom - minTop) })
      }
      // Right region
      if (maxRight < viewportWidth) {
        regions.push({ top: minTop, left: maxRight, width: viewportWidth - maxRight, height: Math.max(0, maxBottom - minTop) })
      }

      setOverlayRegions(regions)
    }

    // Small delay to ensure modal is rendered
    const timeout = setTimeout(calculateRegions, 50)
    calculateRegions()
    
    const interval = setInterval(calculateRegions, 100)
    window.addEventListener('resize', calculateRegions)
    window.addEventListener('scroll', calculateRegions, true)

    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
      window.removeEventListener('resize', calculateRegions)
      window.removeEventListener('scroll', calculateRegions, true)
    }
  }, [isActive, currentStep, highlightedElement, modalElement])

  // Position arrow and highlight element - skip on mobile
  useEffect(() => {
    if (isMobile || !isActive || currentStep === 'intro' || currentStep === 'complete') {
      setHighlightedElement(null)
      return
    }

    const updateHighlight = () => {
      let element: HTMLElement | null = null

      if (currentStep === 'add-button' && createMenuButtonRef?.current) {
        element = createMenuButtonRef.current
      } else if (currentStep === 'add-menu-open' && createMenuRef?.current) {
        // Highlight the entire menu in add-menu-open step
        element = createMenuRef.current
      } else if (currentStep === 'add-menu-goal' && createMenuRef?.current) {
        // Highlight the entire menu in add-menu-goal step
        element = createMenuRef.current
      } else if (currentStep === 'click-area' && areas.length > 0 && areaButtonRefs) {
        const firstArea = areas[0]
        const areaRef = areaButtonRefs.get(firstArea.id)
        if (areaRef?.current) {
          element = areaRef.current
        }
      } else if (currentStep === 'click-goal' && goalsSectionRef?.current) {
        // Highlight the entire goals section (either in area or below areas)
        element = goalsSectionRef.current
      }

      if (element) {
        setHighlightedElement(element)
        const rect = element.getBoundingClientRect()
        if (arrowRef.current) {
          arrowRef.current.style.top = `${rect.top + rect.height / 2}px`
          arrowRef.current.style.left = `${rect.left - 60}px`
        }
      } else {
        setHighlightedElement(null)
      }
    }

    updateHighlight()
    const interval = setInterval(updateHighlight, 100) // Update frequently for smooth tracking
    window.addEventListener('resize', updateHighlight)
    window.addEventListener('scroll', updateHighlight, true)

    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', updateHighlight)
      window.removeEventListener('scroll', updateHighlight, true)
    }
  }, [currentStep, isActive, createMenuButtonRef, areas, areaButtonRefs, goals, goalButtonRefs, selectedAreaId])

  // Don't show onboarding on mobile devices
  if (!isActive || isMobile) return null

  const handleNext = () => {
    if (currentStep === 'intro') {
      isInternalChangeRef.current = true
      setCurrentStep('add-button')
      notifyStepChange('add-button')
      setTimeout(() => {
        isInternalChangeRef.current = false
      }, 0)
    } else if (isMobile && (currentStep === 'add-button' || currentStep === 'add-menu-open' || currentStep === 'create-area')) {
      // Simplified flow for mobile - just go through informational steps
      if (currentStep === 'add-button' || currentStep === 'add-menu-open' || currentStep === 'create-area') {
        isInternalChangeRef.current = true
        setCurrentStep('click-area')
        notifyStepChange('click-area')
        setTimeout(() => {
          isInternalChangeRef.current = false
        }, 0)
      } else if (currentStep === 'click-area' || currentStep === 'add-menu-goal') {
        isInternalChangeRef.current = true
        setCurrentStep('create-goal')
        notifyStepChange('create-goal')
        setTimeout(() => {
          isInternalChangeRef.current = false
        }, 0)
      } else if (currentStep === 'create-goal' || currentStep === 'click-goal') {
        isInternalChangeRef.current = true
        setCurrentStep('complete')
        notifyStepChange('complete')
        setTimeout(() => {
          isInternalChangeRef.current = false
        }, 0)
      }
    } else if (currentStep === 'add-button') {
      // User should click Add button - wait for them
      // The menu opening is detected by the useEffect watching showCreateMenu
    } else if (currentStep === 'create-area') {
      // User should create area - wait for them
      // onCreateArea is called in handleSaveArea when user saves the form
    } else if (currentStep === 'click-area') {
      // User should click area - wait for them
    } else if (currentStep === 'add-menu-goal') {
      // User should click Goal button - wait for them
      // This is handled by the click handler in SidebarNavigation
    } else if (currentStep === 'create-goal') {
      // User should create goal - wait for them
      // This step is handled by direct user interaction with the form
    } else if (currentStep === 'click-goal') {
      // User can either click the goal or click Next to skip to complete
      isInternalChangeRef.current = true
      setCurrentStep('complete')
      notifyStepChange('complete')
      setTimeout(() => {
        isInternalChangeRef.current = false
      }, 0)
    } else if (currentStep === 'complete') {
      handleComplete()
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = async () => {
    try {
      await fetch('/api/user/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hasCompletedOnboarding: true })
      })
      onComplete()
    } catch (error) {
      console.error('Error completing onboarding:', error)
      onComplete() // Complete anyway
    }
  }


  const handleSaveArea = async () => {
    if (!areaName.trim()) {
      alert(t('areas.nameRequired') || 'Název oblasti je povinný')
      return
    }

    setIsSavingArea(true)
    isSavingAreaRef.current = true
    try {
      // Use the onCreateArea callback if available (from JourneyGameView)
      if (onCreateArea) {
        const success = await onCreateArea({
          name: areaName.trim(),
          description: areaDescription.trim() || null,
          color: areaColor,
          icon: areaIcon
        })

        if (success) {
          // Reset form
          setAreaName('')
          setAreaDescription('')
          setAreaColor('#ea580c')
          setAreaIcon('LayoutDashboard')

          // Move to next step immediately after successful creation
          isInternalChangeRef.current = true
          setCurrentStep('click-area')
          notifyStepChange('click-area')
          setTimeout(() => {
            isInternalChangeRef.current = false
            isSavingAreaRef.current = false
          }, 100)
        } else {
          isSavingAreaRef.current = false
          throw new Error('Failed to create area via callback')
        }
      } else {
        // Fallback: direct API call if callback is not available
        const response = await fetch('/api/cesta/areas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: areaName.trim(),
            description: areaDescription.trim() || null,
            color: areaColor,
            icon: areaIcon
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to create area')
        }

        const data = await response.json()
        const createdArea = data.area
        
        // Notify parent component about the new area
        if (onAreaCreated && createdArea) {
          onAreaCreated(createdArea)
        }

        // Reset form
        setAreaName('')
        setAreaDescription('')
        setAreaColor('#ea580c')
        setAreaIcon('LayoutDashboard')

        // Move to next step immediately after successful creation
        isInternalChangeRef.current = true
        setCurrentStep('click-area')
        notifyStepChange('click-area')
        setTimeout(() => {
          isInternalChangeRef.current = false
          isSavingAreaRef.current = false
        }, 100)
      }
    } catch (error) {
      console.error('Error creating area:', error)
      isSavingAreaRef.current = false
      alert(t('areas.createError') || 'Nepodařilo se vytvořit oblast. Zkuste to prosím znovu.')
    } finally {
      setIsSavingArea(false)
    }
  }

  // Simplified mobile version - just informational modals
  const renderMobileModal = () => {
    switch (currentStep) {
      case 'intro':
        return (
          <div className="bg-white p-6 max-w-md w-full mx-4 border-4 border-primary-500 rounded-playful-lg shadow-2xl">
            <h2 className="text-2xl font-bold text-primary-600 mb-4 font-playful">
              {t('onboarding.intro.title')}
            </h2>
            <p className="text-base text-gray-700 mb-4 font-playful">
              {t('onboarding.intro.description')}
            </p>
            <div className="space-y-3 mb-6">
              <div className="p-3 bg-primary-50 rounded-playful-md border-2 border-primary-200">
                <LayoutDashboard className="w-6 h-6 text-primary-600 mb-2" />
                <h3 className="font-bold text-primary-700 mb-1 text-sm font-playful">{t('onboarding.intro.areas.title')}</h3>
                <p className="text-xs text-gray-600 font-playful">{t('onboarding.intro.areas.description')}</p>
              </div>
              <div className="p-3 bg-primary-50 rounded-playful-md border-2 border-primary-200">
                <Target className="w-6 h-6 text-primary-600 mb-2" />
                <h3 className="font-bold text-primary-700 mb-1 text-sm font-playful">{t('onboarding.intro.goals.title')}</h3>
                <p className="text-xs text-gray-600 font-playful">{t('onboarding.intro.goals.description')}</p>
              </div>
              <div className="p-3 bg-primary-50 rounded-playful-md border-2 border-primary-200">
                <Footprints className="w-6 h-6 text-primary-600 mb-2" />
                <h3 className="font-bold text-primary-700 mb-1 text-sm font-playful">{t('onboarding.intro.steps.title')}</h3>
                <p className="text-xs text-gray-600 font-playful">{t('onboarding.intro.steps.description')}</p>
              </div>
              <div className="p-3 bg-primary-50 rounded-playful-md border-2 border-primary-200">
                <CheckSquare className="w-6 h-6 text-primary-600 mb-2" />
                <h3 className="font-bold text-primary-700 mb-1 text-sm font-playful">{t('onboarding.intro.habits.title')}</h3>
                <p className="text-xs text-gray-600 font-playful">{t('onboarding.intro.habits.description')}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                className="btn-playful-base px-4 py-2 flex-1 text-sm"
              >
                {t('onboarding.skip')}
              </button>
              <button
                onClick={handleNext}
                className="btn-playful-primary px-4 py-2 flex-1 text-sm flex items-center justify-center gap-2"
              >
                {t('onboarding.next')}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )
      
      case 'add-button':
      case 'add-menu-open':
      case 'create-area':
        return (
          <div className="bg-white p-6 max-w-md w-full mx-4 border-4 border-primary-500 rounded-playful-lg shadow-2xl">
            <h3 className="text-xl font-bold text-primary-600 mb-4 font-playful">
              {t('onboarding.createArea.title')}
            </h3>
            <p className="text-gray-700 mb-4 font-playful text-sm">
              {t('onboarding.createArea.description')}
            </p>
            <p className="text-gray-600 mb-4 font-playful text-sm">
              {t('onboarding.mobile.createArea.instruction') || 'Klikněte na tlačítko "+" vlevo dole a vyberte "Oblast" pro vytvoření vaší první oblasti.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                className="btn-playful-base px-4 py-2 flex-1 text-sm"
              >
                {t('onboarding.skip')}
              </button>
              <button
                onClick={handleNext}
                className="btn-playful-primary px-4 py-2 flex-1 text-sm"
              >
                {t('onboarding.next')}
              </button>
            </div>
          </div>
        )
      
      case 'click-area':
      case 'add-menu-goal':
        return (
          <div className="bg-white p-6 max-w-md w-full mx-4 border-4 border-primary-500 rounded-playful-lg shadow-2xl">
            <h3 className="text-xl font-bold text-primary-600 mb-4 font-playful">
              {t('onboarding.mobile.afterArea.title') || 'Oblast vytvořena'}
            </h3>
            <p className="text-gray-700 mb-4 font-playful text-sm">
              {t('onboarding.mobile.afterArea.description') || 'Skvělé! Nyní můžete vytvořit cíle, kroky a návyky v této oblasti. Klikněte na oblast v navigačním menu vlevo, pak na tlačítko "+" a vyberte "Cíl".'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                className="btn-playful-base px-4 py-2 flex-1 text-sm"
              >
                {t('onboarding.skip')}
              </button>
              <button
                onClick={handleNext}
                className="btn-playful-primary px-4 py-2 flex-1 text-sm"
              >
                {t('onboarding.next')}
              </button>
            </div>
          </div>
        )
      
      case 'create-goal':
      case 'click-goal':
        return (
          <div className="bg-white p-6 max-w-md w-full mx-4 border-4 border-primary-500 rounded-playful-lg shadow-2xl">
            <h3 className="text-xl font-bold text-primary-600 mb-4 font-playful">
              {t('onboarding.mobile.afterGoal.title') || 'Cíl vytvořen'}
            </h3>
            <p className="text-gray-700 mb-4 font-playful text-sm">
              {t('onboarding.mobile.afterGoal.description') || 'Výborně! Cíle najdete v navigačním menu vlevo. V cílech můžete vytvářet kroky, které vás dovedou k jejich dosažení.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                className="btn-playful-base px-4 py-2 flex-1 text-sm"
              >
                {t('onboarding.skip')}
              </button>
              <button
                onClick={handleNext}
                className="btn-playful-primary px-4 py-2 flex-1 text-sm"
              >
                {t('onboarding.next')}
              </button>
            </div>
          </div>
        )
      
      case 'complete':
        return (
          <div className="bg-white p-6 max-w-md w-full mx-4 border-4 border-primary-500 rounded-playful-lg shadow-2xl">
            <h3 className="text-xl font-bold text-primary-600 mb-4 font-playful">
              {t('onboarding.complete.title')}
            </h3>
            <p className="text-gray-700 mb-4 font-playful text-sm">
              {t('onboarding.complete.description')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleComplete}
                className="btn-playful-primary px-6 py-3 flex-1 text-sm flex items-center justify-center gap-2"
              >
                {t('onboarding.complete.button')}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  const renderModal = () => {
    // Use mobile version for mobile devices
    if (isMobile) {
      return renderMobileModal()
    }
    
    switch (currentStep) {
      case 'intro':
        return (
          <div className="bg-white p-8 max-w-2xl w-full mx-4 border-4 border-primary-500 rounded-playful-lg shadow-2xl">
            <h2 className="text-3xl font-bold text-primary-600 mb-6 font-playful">
              {t('onboarding.intro.title')}
            </h2>
            <div className="space-y-4 mb-6">
              <p className="text-lg text-gray-700 font-playful">
                {t('onboarding.intro.description')}
              </p>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-4 bg-primary-50 rounded-playful-md border-2 border-primary-200">
                  <LayoutDashboard className="w-8 h-8 text-primary-600 mb-2" />
                  <h3 className="font-bold text-primary-700 mb-1 font-playful">{t('onboarding.intro.areas.title')}</h3>
                  <p className="text-sm text-gray-600 font-playful">{t('onboarding.intro.areas.description')}</p>
                </div>
                <div className="p-4 bg-primary-50 rounded-playful-md border-2 border-primary-200">
                  <Target className="w-8 h-8 text-primary-600 mb-2" />
                  <h3 className="font-bold text-primary-700 mb-1 font-playful">{t('onboarding.intro.goals.title')}</h3>
                  <p className="text-sm text-gray-600 font-playful">{t('onboarding.intro.goals.description')}</p>
                </div>
                <div className="p-4 bg-primary-50 rounded-playful-md border-2 border-primary-200">
                  <Footprints className="w-8 h-8 text-primary-600 mb-2" />
                  <h3 className="font-bold text-primary-700 mb-1 font-playful">{t('onboarding.intro.steps.title')}</h3>
                  <p className="text-sm text-gray-600 font-playful">{t('onboarding.intro.steps.description')}</p>
                </div>
                <div className="p-4 bg-primary-50 rounded-playful-md border-2 border-primary-200">
                  <CheckSquare className="w-8 h-8 text-primary-600 mb-2" />
                  <h3 className="font-bold text-primary-700 mb-1 font-playful">{t('onboarding.intro.habits.title')}</h3>
                  <p className="text-sm text-gray-600 font-playful">{t('onboarding.intro.habits.description')}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                className="btn-playful-base px-6 py-3 flex-1"
              >
                {t('onboarding.skip')}
              </button>
              <button
                onClick={handleNext}
                className="btn-playful-primary px-6 py-3 flex-1 flex items-center justify-center gap-2"
              >
                {t('onboarding.next')}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )

      case 'add-button':
        return (
          <div className="bg-white p-6 max-w-md w-full mx-4 border-4 border-primary-500 rounded-playful-lg shadow-2xl relative">
            <h3 className="text-xl font-bold text-primary-600 mb-4 font-playful">
              {t('onboarding.addButton.title')}
            </h3>
            <p className="text-gray-700 mb-4 font-playful">
              {t('onboarding.addButton.description')}
            </p>
            <p className="text-lg font-bold text-primary-600 mb-4 font-playful text-center">
              {t('onboarding.addButton.instruction')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                className="btn-playful-base px-4 py-2 flex-1"
              >
                {t('onboarding.skip')}
              </button>
            </div>
          </div>
        )

      case 'add-menu-open':
        return (
          <div className="bg-white p-6 max-w-md w-full mx-4 border-4 border-primary-500 rounded-playful-lg shadow-2xl relative">
            <h3 className="text-xl font-bold text-primary-600 mb-4 font-playful">
              {t('onboarding.addMenuOpen.title')}
            </h3>
            <p className="text-gray-700 mb-4 font-playful">
              {t('onboarding.addMenuOpen.description')}
            </p>
            <p className="text-lg font-bold text-primary-600 mb-4 font-playful text-center">
              {t('onboarding.addMenuOpen.instruction')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                className="btn-playful-base px-4 py-2 flex-1"
              >
                {t('onboarding.skip')}
              </button>
            </div>
          </div>
        )

      case 'create-area':
        return (
          <div className="bg-white p-6 max-w-md w-full mx-4 border-4 border-primary-500 rounded-playful-lg shadow-2xl">
            <h3 className="text-xl font-bold text-primary-600 mb-4 font-playful">
              {t('onboarding.createArea.title')}
            </h3>
            <p className="text-gray-700 mb-4 font-playful">
              {t('onboarding.createArea.description')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                className="btn-playful-base px-4 py-2 flex-1"
              >
                {t('onboarding.skip')}
              </button>
            </div>
          </div>
        )

      case 'click-area':
        return (
          <div className="bg-white p-6 max-w-md w-full mx-4 border-4 border-primary-500 rounded-playful-lg shadow-2xl">
            <h3 className="text-xl font-bold text-primary-600 mb-4 font-playful">
              {t('onboarding.clickArea.title')}
            </h3>
            <p className="text-gray-700 mb-4 font-playful">
              {t('onboarding.clickArea.description')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                className="btn-playful-base px-4 py-2 flex-1"
              >
                {t('onboarding.skip')}
              </button>
            </div>
          </div>
        )

      case 'add-menu-goal':
        return (
          <div className="bg-white p-6 max-w-md w-full mx-4 border-4 border-primary-500 rounded-playful-lg shadow-2xl relative">
            <h3 className="text-xl font-bold text-primary-600 mb-4 font-playful">
              {t('onboarding.addMenuGoal.title') || 'Vytvořte první cíl'}
            </h3>
            <p className="text-gray-700 mb-4 font-playful">
              {t('onboarding.addMenuGoal.description') || 'Nyní klikněte na "Cíl" v menu, abyste vytvořili svůj první cíl v této oblasti.'}
            </p>
            <p className="text-lg font-bold text-primary-600 mb-4 font-playful text-center">
              {t('onboarding.addMenuGoal.instruction') || '👉 Klikněte na "Cíl"'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                className="btn-playful-base px-4 py-2 flex-1"
              >
                {t('onboarding.skip')}
              </button>
            </div>
          </div>
        )

      case 'create-goal':
        return (
          <div className="bg-white p-6 max-w-md w-full mx-4 border-4 border-primary-500 rounded-playful-lg shadow-2xl">
            <h3 className="text-xl font-bold text-primary-600 mb-4 font-playful">
              {t('onboarding.createGoal.title')}
            </h3>
            <p className="text-gray-700 mb-4 font-playful">
              {t('onboarding.createGoal.description')}
            </p>
            <p className="text-sm text-gray-600 mb-4 font-playful">
              {t('onboarding.createGoal.instruction') || 'Vytvořte cíl na stránce pro cíle. Po vytvoření se tutoriál automaticky pokračuje.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                className="btn-playful-base px-4 py-2 flex-1"
              >
                {t('onboarding.skip')}
              </button>
            </div>
          </div>
        )

      case 'click-goal':
        return (
          <div className="bg-white p-6 max-w-md w-full mx-4 border-4 border-primary-500 rounded-playful-lg shadow-2xl relative">
            <h3 className="text-xl font-bold text-primary-600 mb-4 font-playful">
              {t('onboarding.clickGoal.title')}
            </h3>
            <p className="text-gray-700 mb-4 font-playful">
              {t('onboarding.clickGoal.description')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                className="btn-playful-base px-4 py-2 flex-1"
              >
                {t('onboarding.skip')}
              </button>
              <button
                onClick={handleNext}
                className="btn-playful-primary px-4 py-2 flex-1"
              >
                {t('onboarding.next')}
              </button>
            </div>
          </div>
        )

      case 'complete':
        return (
          <div className="bg-white p-6 max-w-md w-full mx-4 border-4 border-primary-500 rounded-playful-lg shadow-2xl">
            <h3 className="text-xl font-bold text-primary-600 mb-4 font-playful">
              {t('onboarding.complete.title')}
            </h3>
            <p className="text-gray-700 mb-4 font-playful">
              {t('onboarding.complete.description')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleComplete}
                className="btn-playful-primary px-6 py-3 flex-1 flex items-center justify-center gap-2"
              >
                {t('onboarding.complete.button')}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Calculate overlay clip-path to exclude highlighted element and modal
  const getOverlayClipPath = () => {
    if (currentStep === 'intro' || currentStep === 'complete') {
      return undefined // No overlay for intro/complete
    }

    const holes: Array<{ left: number; top: number; right: number; bottom: number }> = []
    
    // Add hole for highlighted element
    if (highlightedElement) {
      const rect = highlightedElement.getBoundingClientRect()
      holes.push({
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom
      })
    }
    
    // Add hole for modal
    if (modalElement) {
      const rect = modalElement.getBoundingClientRect()
      // Add some padding around modal
      const padding = 20
      holes.push({
        left: rect.left - padding,
        top: rect.top - padding,
        right: rect.right + padding,
        bottom: rect.bottom + padding
      })
    }

    if (holes.length === 0) {
      return undefined
    }

    // Create clip-path that excludes all holes
    const paths: string[] = []
    
    // Start with full screen
    paths.push('polygon(0% 0%, 0% 100%, 100% 100%, 100% 0%)')
    
    // Subtract each hole
    holes.forEach(hole => {
      const left = (hole.left / window.innerWidth) * 100
      const right = (hole.right / window.innerWidth) * 100
      const top = (hole.top / window.innerHeight) * 100
      const bottom = (hole.bottom / window.innerHeight) * 100
      
      paths.push(`polygon(
        ${left}% ${top}%,
        ${right}% ${top}%,
        ${right}% ${bottom}%,
        ${left}% ${bottom}%
      )`)
    })

    // Use CSS clip-path with evenodd fill rule to create holes
    // For better browser support, we'll use a simpler approach with multiple overlays
    return undefined // We'll use a different approach
  }

  // Don't show overlay on mobile - just show simple modals
  const shouldShowOverlay = !isMobile && isActive && currentStep !== 'complete' && currentStep !== 'create-area' && currentStep !== 'create-goal'

  return createPortal(
    <>
      {shouldShowOverlay && overlayRegions.map((region, i) => (
        <div
          key={i}
          className="fixed z-[9998] bg-black bg-opacity-60 pointer-events-auto"
          style={{
            top: region.top,
            left: region.left,
            width: region.width,
            height: region.height,
          }}
        />
      ))}
      {highlightedElement && shouldShowOverlay && (
        <>
          <div
            className="fixed z-[10001] pointer-events-none border-4 border-primary-500 rounded-playful-md animate-pulse"
            style={{
              top: highlightedElement.getBoundingClientRect().top + window.scrollY,
              left: highlightedElement.getBoundingClientRect().left + window.scrollX,
              width: highlightedElement.getBoundingClientRect().width,
              height: highlightedElement.getBoundingClientRect().height,
              boxShadow: '0 0 0 4px rgba(232, 135, 30, 0.3), 0 0 20px rgba(232, 135, 30, 0.5)',
            }}
          />
          {/* Arrow pointing down-left between modal and highlighted element - only show for add-button step */}
          {currentStep === 'add-button' && modalElement && highlightedElement && (() => {
            const modalRect = modalElement.getBoundingClientRect()
            const elementRect = highlightedElement.getBoundingClientRect()
            
            // Position arrow between modal and button, closer to button
            const spacing = 20 // Space between modal and button
            const arrowX = elementRect.left + elementRect.width / 2 - 24 // Center horizontally on button, offset for arrow size
            const arrowY = modalRect.bottom + spacing / 2 // Middle of the gap
            
            return (
              <div
                className="fixed z-[10001] pointer-events-none"
                style={{
                  top: arrowY + window.scrollY,
                  left: arrowX + window.scrollX,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <ArrowDownLeft className="w-12 h-12 text-primary-500 animate-pulse" />
              </div>
            )
          })()}
          {/* Arrow pointing left from modal to area - only show for click-area step */}
          {currentStep === 'click-area' && modalElement && highlightedElement && (() => {
            const modalRect = modalElement.getBoundingClientRect()
            const elementRect = highlightedElement.getBoundingClientRect()
            
            // Position arrow between modal (left edge) and area (right edge), vertically centered
            const spacing = 20 // Space between modal and area
            const arrowX = modalRect.left - spacing / 2 // Middle of the gap, closer to modal
            const arrowY = (modalRect.top + modalRect.bottom) / 2 // Vertically centered on modal
            
            return (
              <div
                className="fixed z-[10001] pointer-events-none"
                style={{
                  top: arrowY + window.scrollY,
                  left: arrowX + window.scrollX,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <ArrowLeft className="w-12 h-12 text-primary-500 animate-pulse" />
              </div>
            )
          })()}
        </>
      )}

      {/* Show area creation form in create-area step - only on desktop */}
      {!isMobile && currentStep === 'create-area' && (
        <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4">
          <div
            className="bg-white rounded-playful-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border-4 border-primary-500"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold text-primary-600 mb-4 font-playful">
                {t('onboarding.createArea.title')}
              </h2>
              <p className="text-gray-700 mb-4 font-playful">
                {t('onboarding.createArea.description')}
              </p>
              
              {/* Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1 font-playful">
                  {t('areas.name') || 'Název'} *
                </label>
                <input
                  type="text"
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-primary-300 rounded-playful-md focus:outline-none focus:ring-2 focus:ring-primary-500 font-playful"
                  placeholder={t('areas.namePlaceholder') || 'Název oblasti'}
                  autoFocus
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1 font-playful">
                  {t('areas.description') || 'Popis'}
                </label>
                <textarea
                  value={areaDescription}
                  onChange={(e) => setAreaDescription(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-primary-300 rounded-playful-md focus:outline-none focus:ring-2 focus:ring-primary-500 font-playful"
                  rows={3}
                  placeholder={t('areas.descriptionPlaceholder') || 'Popis oblasti'}
                />
              </div>

              {/* Color */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 font-playful">
                  {t('areas.color') || 'Barva'}
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { value: '#ea580c', name: 'Oranžová' },
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
                      onClick={() => setAreaColor(color.value)}
                      className={`w-12 h-12 rounded-playful-md border-2 transition-all hover:scale-110 ${
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

              {/* Icon */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2 font-playful">
                  {t('areas.icon') || 'Ikona'}
                </label>
                <button
                  onClick={() => setShowAreaIconPicker(!showAreaIconPicker)}
                  className="w-full flex items-center justify-between px-3 py-2 border-2 border-primary-300 rounded-playful-md hover:bg-primary-50 font-playful"
                >
                  <div className="flex items-center gap-2">
                    {(() => {
                      const IconComp = getIconComponent(areaIcon)
                      return <IconComp className="w-5 h-5" style={{ color: areaColor }} />
                    })()}
                    <span>{AVAILABLE_ICONS.find(i => i.name === areaIcon)?.label || areaIcon}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showAreaIconPicker ? 'rotate-180' : ''}`} />
                </button>
                {showAreaIconPicker && (
                  <div className="mt-2 border-2 border-primary-300 rounded-playful-md p-3 max-h-48 overflow-y-auto">
                    <div className="grid grid-cols-4 gap-2">
                      {AVAILABLE_ICONS.map((icon) => {
                        const IconComp = getIconComponent(icon.name)
                        return (
                          <button
                            key={icon.name}
                            type="button"
                            onClick={() => {
                              setAreaIcon(icon.name)
                              setShowAreaIconPicker(false)
                            }}
                            className={`p-2 rounded-playful-md hover:bg-primary-50 transition-colors ${
                              areaIcon === icon.name ? 'bg-primary-100 border-2 border-primary-500' : ''
                            }`}
                            title={icon.label}
                          >
                            <IconComp className="w-5 h-5 mx-auto" style={{ color: areaColor }} />
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleSkip}
                  className="btn-playful-base px-4 py-2 flex-1"
                  disabled={isSavingArea}
                >
                  {t('onboarding.skip')}
                </button>
                <button
                  onClick={handleSaveArea}
                  disabled={isSavingArea || !areaName.trim()}
                  className="btn-playful-primary px-4 py-2 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingArea ? (t('common.saving') || 'Ukládání...') : (t('common.save') || 'Uložit')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show regular modal for other steps */}
      {currentStep !== 'create-area' && currentStep !== 'create-goal' && (
        <div 
          className="fixed inset-0 z-[10002] pointer-events-none"
          style={(currentStep === 'add-button' || currentStep === 'add-menu-open') && highlightedElement ? {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            alignItems: 'center',
            paddingBottom: '80px', // Space for the Add button
            paddingLeft: '20px',
            paddingRight: '20px',
          } : currentStep === 'click-goal' && highlightedElement ? {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingLeft: '280px', // Space for sidebar
            paddingRight: '20px',
          } : {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div 
            ref={modalRef} 
            className="pointer-events-auto"
            style={isMobile ? {
              maxWidth: '90%',
              width: '100%',
              margin: '0 auto',
            } : (currentStep === 'add-button' || currentStep === 'add-menu-open') && highlightedElement ? {
              maxWidth: '28rem',
              width: '100%',
              marginBottom: '20px', // Space between modal and button
            } : currentStep === 'click-goal' && highlightedElement ? {
              maxWidth: '28rem',
              width: '100%',
              marginLeft: '20px',
            } : {
              maxWidth: '28rem',
              width: '100%',
              margin: '0 1rem',
            }}
          >
            {renderModal()}
          </div>
        </div>
      )}
    </>,
    document.body
  )
}

