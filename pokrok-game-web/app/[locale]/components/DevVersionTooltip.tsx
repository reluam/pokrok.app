'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface DevVersionTooltipProps {
  className?: string
  iconSize?: string
}

export function DevVersionTooltip({ className = '', iconSize = 'w-3 h-3 md:w-4 md:h-4' }: DevVersionTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const t = useTranslations()

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        <AlertTriangle className={`${iconSize} text-yellow-500`} />
      </div>
      
      {isVisible && (
        <div className="absolute z-50 top-full left-1/2 transform -translate-x-1/2 mt-2 px-4 py-2.5 bg-primary-500 text-white text-sm rounded-lg shadow-lg max-w-[calc(100vw-16px)] sm:max-w-md whitespace-normal leading-relaxed" style={{ minWidth: '200px' }}>
          <div className="whitespace-normal">{t('homepage.devVersionTooltip')}</div>
          {/* Arrow pointing up */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-primary-500"></div>
        </div>
      )}
    </div>
  )
}
