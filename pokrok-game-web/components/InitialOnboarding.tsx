'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, ArrowRight, Target, Heart, Zap } from 'lucide-react'
import { NewGoalOnboarding } from './NewGoalOnboarding'
import { useTranslations } from '@/lib/use-translations'

export function InitialOnboarding() {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedValues, setSelectedValues] = useState<string[]>([])
  const [customValue, setCustomValue] = useState('')
  const [isCompleting, setIsCompleting] = useState(false)
  const [showGoalOnboarding, setShowGoalOnboarding] = useState(false)
  const router = useRouter()
  const { translations } = useTranslations()

  const predefinedValues = [
    { id: 'health', name: translations?.values.health || 'Zdraví', icon: '💪', description: translations?.values.healthDescription || 'Fyzické a duševní zdraví' },
    { id: 'family', name: translations?.values.family || 'Rodina', icon: '👨‍👩‍👧‍👦', description: translations?.values.familyDescription || 'Vztahy s blízkými' },
    { id: 'career', name: translations?.values.career || 'Kariéra', icon: '💼', description: translations?.values.careerDescription || 'Profesní růst a úspěch' },
    { id: 'learning', name: translations?.values.learning || 'Učení', icon: '📚', description: translations?.values.learningDescription || 'Rozvoj znalostí a dovedností' },
    { id: 'adventure', name: translations?.values.adventure || 'Dobrodružství', icon: '🌍', description: translations?.values.adventureDescription || 'Nové zážitky a cestování' },
    { id: 'creativity', name: translations?.values.creativity || 'Kreativita', icon: '🎨', description: translations?.values.creativityDescription || 'Umělecké vyjádření' },
    { id: 'community', name: translations?.values.community || 'Komunita', icon: '🤝', description: translations?.values.communityDescription || 'Pomoc druhým' },
    { id: 'spirituality', name: translations?.values.spirituality || 'Duchovno', icon: '🧘', description: translations?.values.spiritualityDescription || 'Vnitřní klid a moudrost' }
  ]

  const steps = [
    {
      title: translations?.onboarding.welcome || 'Vítejte v Pokroku!',
      subtitle: translations?.onboarding.subtitle || 'Dosáhněte svých cílů s větší jasností',
      content: (
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-4xl">🚀</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {translations?.onboarding.subtitle || 'Dosáhněte svých cílů s větší jasností'}
            </h2>
            <p className="text-lg text-gray-600 max-w-md mx-auto leading-relaxed">
              {translations?.onboarding.description || 'Pokrok je aplikace, která vám pomůže dosáhnout vašich cílů a získat větší jasnost v životě. Definujte si své cíle, rozložte je na kroky a sledujte svůj pokrok.'}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 mx-auto mb-2 bg-blue-100 rounded-full flex items-center justify-center">
                <Target className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Jasné cíle</h3>
              <p className="text-sm text-gray-600">Definujte si své cíle s konkrétními metrikami</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="w-8 h-8 mx-auto mb-2 bg-green-100 rounded-full flex items-center justify-center">
                <Zap className="w-4 h-4 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Konkrétní kroky</h3>
              <p className="text-sm text-gray-600">Rozložte cíle na malé, dosažitelné kroky</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="w-8 h-8 mx-auto mb-2 bg-purple-100 rounded-full flex items-center justify-center">
                <Heart className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Jasnost v životě</h3>
              <p className="text-sm text-gray-600">Získejte přehled o tom, co je pro vás důležité</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Jak Pokrok funguje?',
      subtitle: 'Pojďme se podívat na klíčové funkce aplikace',
      content: (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Cílů dosahujeme tím, že si cíle jasně definujeme a pomocí kroků k nim postupně jdeme. 
              Pokrok vám v tom pomůže třemi hlavními způsoby:
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Cíle */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cíle</h3>
              <p className="text-gray-600 mb-2">
                Definujte si své cíle s konkrétními metrikami a termíny. Každý cíl má svou ikonu, 
                popis a sledované metriky, které vám pomohou měřit pokrok.
              </p>
              <div className="text-sm text-gray-500">
                <strong>Příklad:</strong> "Naučit se španělsky do konce roku" s metrikou "počet slov"
              </div>
            </div>

            {/* Kroky */}
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Kroky</h3>
              <p className="text-gray-600 mb-2">
                Rozložte své cíle na malé, dosažitelné kroky. Každý krok má datum, popis 
                a může být přiřazen k konkrétnímu cíli.
              </p>
              <div className="text-sm text-gray-500">
                <strong>Příklad:</strong> "Procvičit španělská slovíčka 30 minut" na dnešek
              </div>
            </div>

            {/* Co je potřeba */}
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Co je potřeba</h3>
              <p className="text-gray-600 mb-2">
                Denní přehled toho, co je potřeba udělat. Přidávejte kroky pro dnešek, 
                označujte je jako dokončené a sledujte svůj pokrok.
              </p>
              <div className="text-sm text-gray-500">
                <strong>Příklad:</strong> Seznam úkolů na dnešek s možností označit jako hotové
              </div>
            </div>
          </div>

          <div className="text-center mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Tip:</strong> Začněte s jedním cílem a několika kroky. Můžete vždy přidat více později.
            </p>
          </div>
        </div>
      )
    },
    {
      title: 'Vytvořte svůj první cíl',
      subtitle: 'Začněte s něčím konkrétním a dosažitelným',
      content: (
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Target className="w-12 h-12 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Připraveni začít?
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Můžete vytvořit svůj první cíl hned teď, nebo pokračovat do aplikace a přidat cíle později.
            </p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                setShowGoalOnboarding(true)
              }}
              className="w-full bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors font-medium flex items-center justify-center space-x-2"
            >
              <Target className="w-5 h-5" />
              <span>Vytvořit první cíl</span>
            </button>
            
            <button
              onClick={() => {
                setIsCompleting(true)
                completeOnboarding()
              }}
              className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Přeskočit a pokračovat do aplikace
            </button>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Tip:</strong> Cíle můžete přidat kdykoliv později v aplikaci. 
              Začněte s jedním cílem a postupně přidávejte další.
            </p>
          </div>
        </div>
      )
    }
  ]

  const completeOnboarding = async () => {
    try {
      console.log('Starting onboarding completion...')
      
      // Save onboarding completion to database
      const response = await fetch('/api/cesta/complete-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [] }) // Empty values array since we don't select values anymore
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      if (response.ok) {
        const data = await response.json()
        console.log('Onboarding response:', data)
        
        // Redirect to main dashboard
        console.log('Redirecting to /muj...')
        router.push('/muj')
        
        // Fallback redirect after 2 seconds
        setTimeout(() => {
          console.log('Fallback redirect to /muj...')
          window.location.href = '/muj'
        }, 2000)
      } else {
        const errorData = await response.json()
        console.error('Failed to complete onboarding:', errorData)
        // Still redirect to avoid getting stuck
        console.log('Redirecting despite error...')
        router.push('/muj')
        setTimeout(() => {
          window.location.href = '/muj'
        }, 1000)
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
      // Still redirect to avoid getting stuck
      console.log('Redirecting after error...')
      router.push('/muj')
      setTimeout(() => {
        window.location.href = '/muj'
      }, 1000)
    }
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceed = () => {
    // All steps can proceed without validation in the new onboarding flow
    return true
  }

  const handleGoalOnboardingComplete = async (goalData: any) => {
    console.log('Frontend: Starting goal creation with data:', goalData)
    
    try {
      const response = await fetch('/api/cesta/goals-with-steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData)
      })
      
      console.log('Frontend: API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Frontend: Goal created successfully:', data)
        setShowGoalOnboarding(false)
        
        // Complete onboarding and redirect to main app
        setIsCompleting(true)
        completeOnboarding()
      } else {
        const errorData = await response.json()
        console.error('Frontend: API error:', errorData)
        alert('Chyba při vytváření cíle. Zkuste to prosím znovu.')
      }
    } catch (error) {
      console.error('Frontend: Error adding goal:', error)
      alert('Chyba při vytváření cíle. Zkuste to prosím znovu.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-h-screen overflow-y-auto">
        <div className="p-8">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
              <span>Krok {currentStep + 1} z {steps.length}</span>
              <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {steps[currentStep].title}
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              {steps[currentStep].subtitle}
            </p>
            
            {steps[currentStep].content}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                currentStep === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Zpět
            </button>

            {currentStep < steps.length - 1 && (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                  canProceed()
                    ? 'bg-primary-500 text-white hover:bg-primary-600'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <span>Další</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Goal Onboarding Modal */}
      {showGoalOnboarding && (
        <NewGoalOnboarding
          onComplete={handleGoalOnboardingComplete}
          onCancel={() => setShowGoalOnboarding(false)}
        />
      )}
    </div>
  )
}
