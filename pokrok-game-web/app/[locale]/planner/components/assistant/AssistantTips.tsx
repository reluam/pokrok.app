'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Lightbulb, X, Sparkles } from 'lucide-react'

interface AssistantTipsProps {
  currentPage: string
  mainPanelSection?: string | null
  userId: string | null
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
  userId
}: AssistantTipsProps) {
  const t = useTranslations()
  const [tips, setTips] = useState<Tip[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [readTips, setReadTips] = useState<Set<string>>(new Set())

  // Load read tips from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('assistantReadTips')
    if (stored) {
      try {
        setReadTips(new Set(JSON.parse(stored)))
      } catch (error) {
        console.error('Error loading read tips:', error)
      }
    }
  }, [])

  // Load tips when context changes
  useEffect(() => {
    if (!userId) return

    const loadTips = async () => {
      setIsLoading(true)
      try {
        const context = {
          page: currentPage,
          section: mainPanelSection
        }
        const response = await fetch(
          `/api/assistant/tips?userId=${userId}&context=${encodeURIComponent(JSON.stringify(context))}`
        )
        if (response.ok) {
          const data = await response.json()
          setTips(data.tips || [])
        }
      } catch (error) {
        console.error('Error loading tips:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTips()
  }, [currentPage, mainPanelSection, userId])

  const handleMarkAsRead = (tipId: string) => {
    const newReadTips = new Set(readTips)
    newReadTips.add(tipId)
    setReadTips(newReadTips)
    localStorage.setItem('assistantReadTips', JSON.stringify(Array.from(newReadTips)))
  }

  // Filter out read tips and sort by priority
  const visibleTips = tips
    .filter(tip => !readTips.has(tip.id))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5)

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

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-5 h-5 text-primary-600" />
        <h3 className="font-semibold text-primary-900">
          {t('assistant.tips.title')}
        </h3>
      </div>
      <div className="space-y-2">
        {visibleTips.map((tip) => (
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

