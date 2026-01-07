'use client'

import { useTranslations } from 'next-intl'
import { ChevronRight, Sparkles } from 'lucide-react'

interface AssistantPanelHeaderProps {
  onMinimize: () => void
}

export function AssistantPanelHeader({ onMinimize }: AssistantPanelHeaderProps) {
  const t = useTranslations()

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-primary-100 border-b-2 border-primary-300">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary-600" />
        <h2 className="text-lg font-semibold text-primary-900">
          {t('assistant.title')}
        </h2>
      </div>
      <button
        onClick={onMinimize}
        className="p-1.5 rounded-md hover:bg-primary-200 transition-colors"
        title={t('assistant.minimize')}
        aria-label={t('assistant.minimize')}
      >
        <ChevronRight className="w-4 h-4 text-primary-600" />
      </button>
    </div>
  )
}

