'use client'

import { useState, memo } from 'react'
import { HelpCircle } from 'lucide-react'

interface TooltipProps {
  content: string
  children?: React.ReactNode
  className?: string
}

export const Tooltip = memo(function Tooltip({ content, children, className = '' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children || <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors" />}
      </div>
      
      {isVisible && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg max-w-xs">
          <div className="whitespace-pre-wrap">{content}</div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  )
})
