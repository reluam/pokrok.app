'use client'

import { useTranslations } from 'next-intl'

interface LoadingSpinnerProps {
  text?: string
  className?: string
}

export function LoadingSpinner({ text, className = '' }: LoadingSpinnerProps) {
  const t = useTranslations()
  const displayText = text || t('common.loadingData')

  return (
    <div className={`flex flex-col items-center justify-center min-h-[400px] ${className}`}>
      <div className="mb-4">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
      <p className="text-lg font-semibold text-gray-700">{displayText}</p>
    </div>
  )
}

