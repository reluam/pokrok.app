'use client'

import { useState, memo } from 'react'
import { ArrowLeft, ArrowRight, Check, Target, Calendar, BarChart3, Plus, Trash2, X } from 'lucide-react'
import { IconPicker } from './IconPicker'
import { getIconEmoji, getDefaultGoalIcon } from '@/lib/icon-utils'

interface NewGoalOnboardingProps {
  onComplete: (goalData: GoalOnboardingData) => void
  onCancel: () => void
}

interface MetricData {
  id: string
  name: string
  type: 'number' | 'currency' | 'percentage' | 'distance' | 'time' | 'custom'
  unit: string
  targetValue: number
  currentValue: number
}

interface StepData {
  id: string
  title: string
  description?: string
}

interface GoalOnboardingData {
  title: string
  description?: string
  targetDate: string
  icon?: string
  metrics: MetricData[]
  steps: StepData[]
}

const METRIC_TYPES = [
  { id: 'number', label: 'Počet', unit: 'ks', icon: '🔢' },
  { id: 'currency', label: 'Měna', unit: 'Kč', icon: '💰' },
  { id: 'percentage', label: 'Procento', unit: '%', icon: '📊' },
  { id: 'distance', label: 'Vzdálenost', unit: 'km', icon: '📏' },
  { id: 'time', label: 'Čas', unit: 'hod', icon: '⏰' },
  { id: 'custom', label: 'Vlastní', unit: '', icon: '⚙️' }
]

export const NewGoalOnboarding = memo(function NewGoalOnboarding({ onComplete, onCancel }: NewGoalOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [data, setData] = useState<GoalOnboardingData>({
    title: '',
    description: '',
    targetDate: '',
    icon: getDefaultGoalIcon(),
    metrics: [],
    steps: []
  })

  const steps = [
    { id: 'basic', title: 'Základní informace', icon: Target },
    { id: 'metrics', title: 'Metriky', icon: BarChart3 },
    { id: 'steps', title: 'Kroky', icon: Calendar },
    { id: 'complete', title: 'Dokončení', icon: Check }
  ]

  const addMetric = () => {
    const newMetric: MetricData = {
      id: crypto.randomUUID(),
      name: '',
      type: 'number',
      unit: 'ks',
      targetValue: 0,
      currentValue: 0
    }
    setData(prev => ({
      ...prev,
      metrics: [...prev.metrics, newMetric]
    }))
  }

  const updateMetric = (metricId: string, updates: Partial<MetricData>) => {
    setData(prev => ({
      ...prev,
      metrics: prev.metrics.map(metric => 
        metric.id === metricId ? { ...metric, ...updates } : metric
      )
    }))
  }

  const removeMetric = (metricId: string) => {
    setData(prev => ({
      ...prev,
      metrics: prev.metrics.filter(metric => metric.id !== metricId)
    }))
  }

  const addStep = () => {
    const newStep: StepData = {
      id: crypto.randomUUID(),
      title: '',
      description: ''
    }
    setData(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }))
  }

  const updateStep = (stepId: string, updates: Partial<StepData>) => {
    setData(prev => ({
      ...prev,
      steps: prev.steps.map(step => 
        step.id === stepId ? { ...step, ...updates } : step
      )
    }))
  }

  const removeStep = (stepId: string) => {
    setData(prev => ({
      ...prev,
      steps: prev.steps.filter(step => step.id !== stepId)
    }))
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    onComplete(data)
  }

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'basic':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Základní informace o cíli</h3>
              <p className="text-gray-600 mb-6">
                Začněte definováním názvu, ikony a data dokončení vašeho cíle.
              </p>
              
              <div className="space-y-6">
                {/* Název cíle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Název cíle *
                  </label>
                  <input
                    type="text"
                    value={data.title}
                    onChange={(e) => setData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
                    placeholder="Např. Ušetřit na nový dům"
                  />
                </div>

                {/* Popis cíle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Popis (volitelné)
                  </label>
                  <textarea
                    value={data.description}
                    onChange={(e) => setData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={3}
                    placeholder="Popište svůj cíl podrobněji..."
                  />
                </div>

                {/* Ikona cíle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ikona cíle
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="text-5xl">
                      {getIconEmoji(data.icon)}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowIconPicker(!showIconPicker)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                    >
                      {showIconPicker ? 'Skrýt ikony' : 'Změnit ikonu'}
                    </button>
                  </div>
                  
                  {showIconPicker && (
                    <div className="mt-4">
                      <IconPicker
                        selectedIcon={data.icon}
                        onIconSelect={(icon) => {
                          setData(prev => ({ ...prev, icon }))
                          setShowIconPicker(false)
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Datum dokončení */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Datum dokončení *
                  </label>
                  <input
                    type="date"
                    value={data.targetDate}
                    onChange={(e) => setData(prev => ({ ...prev, targetDate: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 'metrics':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Metriky pro měření pokroku</h3>
              <p className="text-gray-600 mb-6">
                Definujte, jak budete měřit pokrok v dosahování svého cíle. Můžete přidat více metrik různých typů.
              </p>
              
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-600">
                  {data.metrics.length === 0 ? 'Žádné metriky' : `${data.metrics.length} metrik`}
                </span>
                <button
                  onClick={addMetric}
                  className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Přidat metriku</span>
                </button>
              </div>

              {data.metrics.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Žádné metriky</p>
                  <p className="text-sm mt-2">Přidejte metriky pro sledování pokroku</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.metrics.map((metric, index) => (
                    <div key={metric.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900">Metrika {index + 1}</h4>
                        <button
                          onClick={() => removeMetric(metric.id)}
                          className="text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Název metriky */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Název metriky *
                          </label>
                          <input
                            type="text"
                            value={metric.name}
                            onChange={(e) => updateMetric(metric.id, { name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Např. Ušetřená částka"
                          />
                        </div>

                        {/* Typ metriky */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Typ metriky
                          </label>
                          <select
                            value={metric.type}
                            onChange={(e) => {
                              const selectedType = METRIC_TYPES.find(t => t.id === e.target.value)
                              updateMetric(metric.id, { 
                                type: e.target.value as any,
                                unit: selectedType?.unit || ''
                              })
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            {METRIC_TYPES.map(type => (
                              <option key={type.id} value={type.id}>
                                {type.icon} {type.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Jednotka */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Jednotka
                          </label>
                          <input
                            type="text"
                            value={metric.unit}
                            onChange={(e) => updateMetric(metric.id, { unit: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="ks, Kč, %, km..."
                          />
                        </div>

                        {/* Cílová hodnota */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cílová hodnota *
                          </label>
                          <input
                            type="number"
                            value={metric.targetValue}
                            onChange={(e) => updateMetric(metric.id, { targetValue: Number(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="1000000"
                          />
                        </div>

                        {/* Aktuální hodnota */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Aktuální stav
                          </label>
                          <input
                            type="number"
                            value={metric.currentValue}
                            onChange={(e) => updateMetric(metric.id, { currentValue: Number(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )

      case 'steps':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Kroky k dosažení cíle</h3>
              <p className="text-gray-600 mb-6">
                Definujte konkrétní kroky, které vás dovedou k vašemu cíli. Inspirujte se systémem "Co je potřeba".
              </p>
              
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-600">
                  {data.steps.length === 0 ? 'Žádné kroky' : `${data.steps.length} kroků`}
                </span>
                <button
                  onClick={addStep}
                  className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Přidat krok</span>
                </button>
              </div>

              {data.steps.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Žádné kroky</p>
                  <p className="text-sm mt-2">Přidejte kroky pro dosažení cíle</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.steps.map((step, index) => (
                    <div key={step.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900">Krok {index + 1}</h4>
                        <button
                          onClick={() => removeStep(step.id)}
                          className="text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        {/* Název kroku */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Název kroku *
                          </label>
                          <input
                            type="text"
                            value={step.title}
                            onChange={(e) => updateStep(step.id, { title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Např. Pravidelně šetřit"
                          />
                        </div>
                        
                        {/* Popis kroku */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Popis (volitelné)
                          </label>
                          <textarea
                            value={step.description || ''}
                            onChange={(e) => updateStep(step.id, { description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            rows={2}
                            placeholder="Popište krok podrobněji..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )

      case 'complete':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Cíl je připraven!</h3>
              <p className="text-gray-600 mb-8">
                Zkontrolujte si nastavení a dokončete vytvoření cíle.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4 text-lg">Shrnutí cíle</h4>
              <div className="space-y-3 text-gray-700">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getIconEmoji(data.icon)}</span>
                  <div>
                    <p className="font-medium">{data.title}</p>
                    {data.description && <p className="text-sm text-gray-600">{data.description}</p>}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-sm text-gray-600">Deadline</p>
                    <p className="font-medium">{new Date(data.targetDate).toLocaleDateString('cs-CZ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Metriky</p>
                    <p className="font-medium">{data.metrics.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Kroky</p>
                    <p className="font-medium">{data.steps.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const canProceed = () => {
    switch (steps[currentStep].id) {
      case 'basic':
        return data.title.trim().length > 0 && data.targetDate.length > 0
      case 'metrics':
        return true // Metriky jsou volitelné
      case 'steps':
        return true // Kroky jsou volitelné
      case 'complete':
        return true
      default:
        return false
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Nový cíl</h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Progress Steps - Simplified */}
          <div className="mt-6">
            <div className="flex items-center justify-center space-x-8">
              {steps.map((step, index) => {
                const Icon = step.icon
                const isActive = index === currentStep
                const isCompleted = index < currentStep
                
                return (
                  <div key={step.id} className="flex flex-col items-center">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                      isActive 
                        ? 'border-primary-500 bg-primary-500 text-white' 
                        : isCompleted 
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-300 bg-white text-gray-400'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-xs mt-2 font-medium ${
                      isActive ? 'text-primary-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Zpět</span>
          </button>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Zrušit
            </button>
            {currentStep === steps.length - 1 ? (
              <button
                onClick={handleComplete}
                className="flex items-center space-x-2 bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Vytvořit cíl</span>
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center space-x-2 bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span>Další</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})