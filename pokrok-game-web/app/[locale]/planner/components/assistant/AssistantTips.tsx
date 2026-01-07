'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Lightbulb, X, Sparkles, ChevronLeft, ChevronRight, Check } from 'lucide-react'

interface AssistantTipsProps {
  currentPage: string
  mainPanelSection?: string | null
  userId: string | null
  showTips?: boolean
}

interface Tip {
  id: string
  title: string
  description: string
  category: 'motivation' | 'organization' | 'productivity' | 'feature'
  priority: number
}

export function AssistantTips({
  currentPage,
  mainPanelSection,
  userId,
  showTips = true
}: AssistantTipsProps) {
  const t = useTranslations()
  const locale = useLocale()
  const [tips, setTips] = useState<Tip[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [readTips, setReadTips] = useState<Set<string>>(new Set())
  const [currentTipIndex, setCurrentTipIndex] = useState(0)

  // Load read tips from localStorage
  useEffect(() => {
    const loadReadTips = () => {
      const stored = localStorage.getItem('assistantReadTips')
      if (stored) {
        try {
          setReadTips(new Set(JSON.parse(stored)))
        } catch (error) {
          console.error('Error loading read tips:', error)
        }
      } else {
        setReadTips(new Set())
      }
    }
    
    loadReadTips()
    
    // Listen for onboarding reset event
    const handleOnboardingReset = () => {
      loadReadTips()
      // Force reload tips
      if (userId) {
        const context = {
          page: currentPage,
          section: mainPanelSection
        }
        fetch(
          `/api/assistant/tips?userId=${userId}&locale=${locale}&context=${encodeURIComponent(JSON.stringify(context))}`
        )
          .then(response => response.json())
          .then(data => {
            const loadedTips = data.tips || []
            const unreadTips = loadedTips.filter((tip: Tip) => {
              const stored = localStorage.getItem('assistantReadTips')
              if (stored) {
                try {
                  const readTipsArray = JSON.parse(stored)
                  return !readTipsArray.includes(tip.id)
                } catch {
                  return true
                }
              }
              return true
            })
            setTips(unreadTips)
            setCurrentTipIndex(0)
          })
          .catch(error => {
            console.error('Error reloading tips:', error)
          })
      }
    }
    
    window.addEventListener('onboardingReset', handleOnboardingReset)
    return () => window.removeEventListener('onboardingReset', handleOnboardingReset)
  }, [userId, currentPage, mainPanelSection, locale])

  // Load tips when context changes
  useEffect(() => {
    if (!userId || !showTips) {
      setTips([])
      return
    }

    const loadTips = async () => {
      setIsLoading(true)
      try {
        const context = {
          page: currentPage,
          section: mainPanelSection
        }
        const response = await fetch(
          `/api/assistant/tips?userId=${userId}&locale=${locale}&context=${encodeURIComponent(JSON.stringify(context))}`
        )
        if (response.ok) {
          const data = await response.json()
          const loadedTips = data.tips || []
          
          // Filter out read tips
          const unreadTips = loadedTips.filter((tip: Tip) => !readTips.has(tip.id))
          setTips(unreadTips)
          setCurrentTipIndex(0)
        }
      } catch (error) {
        console.error('Error loading tips:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTips()
  }, [currentPage, mainPanelSection, userId, locale, showTips])

  const handleMarkAsRead = (tipId: string) => {
    const newReadTips = new Set(readTips)
    newReadTips.add(tipId)
    setReadTips(newReadTips)
    localStorage.setItem('assistantReadTips', JSON.stringify(Array.from(newReadTips)))
  }

  const handleNextTip = () => {
    if (currentTipIndex < visibleTips.length - 1) {
      setCurrentTipIndex(currentTipIndex + 1)
    }
  }

  const handlePreviousTip = () => {
    if (currentTipIndex > 0) {
      setCurrentTipIndex(currentTipIndex - 1)
    }
  }

  const handleCompleteOnboarding = async () => {
    // Mark all onboarding tips as read
    const newReadTips = new Set(readTips)
    visibleTips.forEach(tip => {
      if (tip.id.startsWith('onboarding-')) {
        newReadTips.add(tip.id)
      }
    })
    setReadTips(newReadTips)
    localStorage.setItem('assistantReadTips', JSON.stringify(Array.from(newReadTips)))
    
    // Mark onboarding as completed in database
    try {
      const response = await fetch('/api/user/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hasCompletedOnboarding: true })
      })
      if (response.ok) {
        // Reload tips to show regular tips
        const context = {
          page: currentPage,
          section: mainPanelSection
        }
        const tipsResponse = await fetch(
          `/api/assistant/tips?userId=${userId}&locale=${locale}&context=${encodeURIComponent(JSON.stringify(context))}`
        )
        if (tipsResponse.ok) {
          const data = await tipsResponse.json()
          setTips(data.tips || [])
          setCurrentTipIndex(0)
        }
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
    }
  }

  // Filter out read tips and sort by priority
  const visibleTips = tips
    .filter(tip => !readTips.has(tip.id))
    .sort((a, b) => b.priority - a.priority)
  
  // Check if we're showing onboarding tips (they have IDs starting with 'onboarding-')
  const isOnboarding = visibleTips.length > 0 && visibleTips[0]?.id.startsWith('onboarding-')
  
  // For onboarding, show one tip at a time
  const currentTip = isOnboarding && visibleTips.length > 0 
    ? visibleTips[currentTipIndex] || visibleTips[0]
    : null
  
  // For regular tips, show up to 5
  const regularTips = !isOnboarding ? visibleTips.slice(0, 5) : []

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 text-sm text-primary-600">
          <Sparkles className="w-4 h-4 animate-pulse" />
          {t('assistant.tips.loading')}
        </div>
      </div>
    )
  }

  if (visibleTips.length === 0) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold text-primary-900">
            {t('assistant.tips.title')}
          </h3>
        </div>
        <p className="text-xs text-primary-600">
          {t('assistant.tips.noTips')}
        </p>
      </div>
    )
  }

  // Render onboarding tips with navigation
  if (isOnboarding && currentTip) {
    const isFirstTip = currentTipIndex === 0
    const isLastTip = currentTipIndex === visibleTips.length - 1
    
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold text-primary-900">
            {t('assistant.tips.title')}
          </h3>
        </div>
        <div className="relative p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <div className="mb-3">
            <div className="text-sm font-semibold text-primary-900 mb-2">
              {currentTip.title}
            </div>
            <div className="text-xs text-primary-700 leading-relaxed">
              {currentTip.description.split('\n\n').map((paragraph, index) => {
                // Check if paragraph contains ** (bold markdown)
                if (paragraph.includes('**')) {
                  // Split by ** and process each part
                  const parts = paragraph.split('**')
                  return (
                    <div key={index} className="mb-3">
                      {parts.map((part, partIndex) => {
                        // Odd indices are bold (between **)
                        if (partIndex % 2 === 1) {
                          return (
                            <span key={partIndex} className="font-semibold text-primary-900">
                              {part}
                            </span>
                          )
                        }
                        // Even indices are normal text
                        return <span key={partIndex}>{part}</span>
                      })}
                    </div>
                  )
                }
                return (
                  <div key={index} className="mb-2">
                    {paragraph}
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* Navigation */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-primary-200">
            <button
              onClick={handlePreviousTip}
              disabled={isFirstTip}
              className={`p-2 rounded-lg transition-colors ${
                isFirstTip
                  ? 'opacity-30 cursor-not-allowed'
                  : 'hover:bg-primary-100 active:bg-primary-200'
              }`}
              aria-label={t('common.previous')}
            >
              <ChevronLeft className={`w-5 h-5 ${isFirstTip ? 'text-primary-300' : 'text-primary-600'}`} />
            </button>
            
            <div className="text-xs text-primary-500">
              {currentTipIndex + 1} / {visibleTips.length}
            </div>
            
            {isLastTip ? (
              <button
                onClick={handleCompleteOnboarding}
                className="p-2 rounded-lg hover:bg-primary-100 active:bg-primary-200 transition-colors"
                aria-label={t('assistant.tips.completeOnboarding') || 'Dokončit onboarding'}
                title={t('assistant.tips.completeOnboarding') || 'Dokončit onboarding'}
              >
                <Check className="w-5 h-5 text-primary-600" />
              </button>
            ) : (
              <button
                onClick={handleNextTip}
                className="p-2 rounded-lg hover:bg-primary-100 active:bg-primary-200 transition-colors"
                aria-label={t('common.next')}
              >
                <ChevronRight className="w-5 h-5 text-primary-600" />
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Render regular tips
  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-5 h-5 text-primary-600" />
        <h3 className="font-semibold text-primary-900">
          {t('assistant.tips.title')}
        </h3>
      </div>
      <div className="space-y-2">
        {regularTips.map((tip) => (
          <div
            key={tip.id}
            className="relative p-3 bg-primary-50 border border-primary-200 rounded-lg"
          >
            <button
              onClick={() => handleMarkAsRead(tip.id)}
              className="absolute top-2 right-2 p-1 hover:bg-primary-100 rounded"
              title={t('assistant.tips.markAsRead')}
            >
              <X className="w-3 h-3 text-primary-400" />
            </button>
            <div className="pr-6">
              <div className="text-sm font-semibold text-primary-900 mb-1">
                {tip.title}
              </div>
              <div className="text-xs text-primary-700">
                {tip.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

