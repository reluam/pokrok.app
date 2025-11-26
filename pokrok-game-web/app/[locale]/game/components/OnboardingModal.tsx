'use client'

import { useState, useEffect } from 'react'
import { X, Target, ArrowRight, CheckCircle2, Calendar } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
  onNavigateToGoals?: () => void
  onNavigateToHabits?: () => void
}

export function OnboardingModal({
  isOpen,
  onClose,
  onComplete,
  onNavigateToGoals,
  onNavigateToHabits
}: OnboardingModalProps) {
  const t = useTranslations()
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      title: 'Přidávejte cíle a kroky',
      description: 'Začněte tím, že si přidáte své cíle. Každý cíl může mít více kroků, které vás dovedou k jeho dosažení.',
      icon: Target,
      action: onNavigateToGoals,
      actionText: 'Přidat cíl',
      details: [
        'Klikněte na tlačítko "Přidat cíl" a zadejte název cíle',
        'K cíli můžete přidat kroky, které vás k němu dovedou',
        'Každý krok můžete naplánovat na konkrétní datum',
        'Kroky můžete označit jako důležité nebo urgentní'
      ]
    },
    {
      title: 'Měňte prioritu cílů',
      description: 'Aplikace se přizpůsobí vašim měnícím se prioritám. Můžete aktivovat nebo odložit cíle podle aktuálních potřeb.',
      icon: CheckCircle2,
      action: onNavigateToGoals,
      actionText: 'Spravovat cíle',
      details: [
        'Aktivní cíle se zobrazují v hlavním panelu',
        'Odložené cíle můžete kdykoli znovu aktivovat',
        'Můžete měnit pořadí priorit cílů',
        'Systém se automaticky přizpůsobí vašim změnám'
      ]
    },
    {
      title: 'Hlavní panel a fokus',
      description: 'Hlavní panel zobrazuje to, na co se máte soustředit dnes. Zobrazuje kroky z aktivních cílů a vaše návyky.',
      icon: Calendar,
      action: null,
      actionText: null,
      details: [
        'V hlavním panelu uvidíte kroky z aktivních cílů',
        'Můžete si přidat návyky, které chcete pravidelně plnit',
        'Kroky a návyky můžete označit jako dokončené',
        'Aplikace sleduje váš pokrok a pomáhá vám dosáhnout cílů'
      ]
    }
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    try {
      const response = await fetch('/api/user/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        onComplete()
      } else {
        // Even if API fails, close modal to avoid getting stuck
        onComplete()
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
      // Even if API fails, close modal to avoid getting stuck
      onComplete()
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  if (!isOpen) return null

  const currentStepData = steps[currentStep]
  const Icon = currentStepData.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Icon className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{currentStepData.title}</h2>
              <p className="text-sm text-gray-500">Krok {currentStep + 1} z {steps.length}</p>
            </div>
          </div>
          <button
            onClick={handleSkip}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Přeskočit"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 text-lg mb-6">{currentStepData.description}</p>

          {/* Details list */}
          <ul className="space-y-3 mb-6">
            {currentStepData.details.map((detail, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3 h-3 text-orange-600" />
                </div>
                <span className="text-gray-600">{detail}</span>
              </li>
            ))}
          </ul>

          {/* Action button if available */}
          {currentStepData.action && currentStepData.actionText && (
            <button
              onClick={() => {
                currentStepData.action?.()
                // Don't close modal, let user explore
              }}
              className="w-full mb-6 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {currentStepData.actionText}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Footer with navigation */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentStep === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            Zpět
          </button>

          {/* Progress dots */}
          <div className="flex items-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep ? 'bg-orange-500 w-8' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {currentStep === steps.length - 1 ? 'Začít' : 'Další'}
            {currentStep < steps.length - 1 && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}


