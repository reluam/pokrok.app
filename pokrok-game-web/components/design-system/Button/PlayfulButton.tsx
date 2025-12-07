'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export interface PlayfulButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  loading?: boolean
  loadingText?: string
  children: React.ReactNode
}

/**
 * PlayfulButton - Simple button component with project colors
 * Features:
 * - Thick border (4px) for high contrast
 * - Project primary colors only
 * - Simple flat design - no shadows, no glossy effects
 * - Bounce animation on click (optional)
 * - Rounded corners
 */
export function PlayfulButton({
  variant = 'primary',
  size = 'md',
  animated = true,
  loading = false,
  loadingText,
  className,
  children,
  onClick,
  disabled,
  ...props
}: PlayfulButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) {
      e.preventDefault()
      return
    }
    
    if (animated && !loading) {
      // Add bounce animation class temporarily
      const button = e.currentTarget
      button.classList.add('animate-playful-bounce')
      setTimeout(() => {
        button.classList.remove('animate-playful-bounce')
      }, 500)
    }
    onClick?.(e)
  }

  const variantClasses = {
    primary: 'btn-playful-primary',
    secondary: 'btn-playful-secondary',
    outline: 'btn-playful-outline',
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm',
    md: 'px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base',
    lg: 'px-6 py-3 text-base sm:px-8 sm:py-4 sm:text-lg',
  }

  const spinnerSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  return (
    <button
      className={cn(
        variantClasses[variant],
        sizeClasses[size],
        'w-full sm:w-auto', // Full width on mobile, auto on desktop
        'transition-all duration-300', // Smooth transitions
        'touch-manipulation', // Better touch handling on mobile
        loading && 'loading', // Add loading class
        className
      )}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className={cn('btn-playful-spinner', spinnerSizes[size])} />
          {loadingText && (
            <span className="hidden sm:inline">{loadingText}</span>
          )}
        </span>
      ) : (
        children
      )}
    </button>
  )
}

