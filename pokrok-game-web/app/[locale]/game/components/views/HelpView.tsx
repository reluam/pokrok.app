'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { HelpCircle, Target, Footprints, CheckSquare, Plus, ArrowRight, ToggleLeft, ToggleRight, Menu, Rocket, Calendar, Eye, Sparkles, TrendingUp, Clock, Flag, Star, Zap, BookOpen, Layout, BarChart3 } from 'lucide-react'
import { GoalsManagementView } from './GoalsManagementView'
import { HabitsManagementView } from './HabitsManagementView'
import { StepsManagementView } from './StepsManagementView'

interface HelpViewProps {
  onAddGoal?: () => void
  onAddStep?: () => void
  onAddHabit?: () => void
  onNavigateToGoals?: () => void
  onNavigateToHabits?: () => void
  onNavigateToSteps?: () => void
  onNavigateToManagement?: () => void
  // Optional real data - if provided, can toggle between mock and real
  realGoals?: any[]
  realHabits?: any[]
  realSteps?: any[]
}

type HelpCategory = 'getting-started' | 'overview' | 'goals' | 'steps' | 'habits'

// Mock data for demonstration
const mockGoals = [
  {
    id: 'mock-goal-1',
    title: 'Naučit se programovat v React',
    description: 'Chci se naučit React a vytvořit vlastní webovou aplikaci',
    status: 'active',
    target_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    completed: false
  },
  {
    id: 'mock-goal-2',
    title: 'Pravidelně cvičit',
    description: 'Cvičit alespoň 3x týdně po dobu 30 minut',
    status: 'active',
    target_date: null,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    completed: false
  },
  {
    id: 'mock-goal-3',
    title: 'Přečíst 12 knih za rok',
    description: 'Každý měsíc přečíst jednu knihu',
    status: 'completed',
    target_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    completed: true
  }
]

const mockHabits = [
  {
    id: 'mock-habit-1',
    name: 'Ranní cvičení',
    description: 'Cvičit každé ráno 20 minut',
    frequency: 'daily',
    selected_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    always_show: true,
    reminder_time: '07:00',
    xp_reward: 1,
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'mock-habit-2',
    name: 'Čtení před spaním',
    description: 'Přečíst alespoň 10 stránek knihy',
    frequency: 'daily',
    selected_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    always_show: false,
    reminder_time: '21:00',
    xp_reward: 1,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'mock-habit-3',
    name: 'Meditace',
    description: 'Meditovat každý den 10 minut',
    frequency: 'daily',
    selected_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    always_show: true,
    reminder_time: null,
    xp_reward: 1,
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
  }
]

const mockSteps = [
  {
    id: 'mock-step-1',
    title: 'Nainstalovat Node.js a npm',
    description: 'Stáhnout a nainstalovat Node.js z oficiálních stránek',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    goal_id: 'mock-goal-1',
    completed: false,
    is_important: true,
    is_urgent: false,
    estimated_time: 30,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'mock-step-2',
    title: 'Projít React tutorial',
    description: 'Dokončit oficiální React tutorial na react.dev',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    goal_id: 'mock-goal-1',
    completed: false,
    is_important: true,
    is_urgent: false,
    estimated_time: 120,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'mock-step-3',
    title: 'Vytvořit první projekt',
    description: 'Vytvořit jednoduchou Todo aplikaci v React',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    goal_id: 'mock-goal-1',
    completed: false,
    is_important: true,
    is_urgent: false,
    estimated_time: 180,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'mock-step-4',
    title: 'Jít do posilovny',
    description: 'Trénink nohou a břicha',
    date: new Date().toISOString().split('T')[0],
    goal_id: 'mock-goal-2',
    completed: true,
    is_important: false,
    is_urgent: false,
    estimated_time: 60,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
]

// Reusable Card Component for consistent design
function FeatureCard({ icon: Icon, title, description, color, children }: {
  icon: any
  title: string
  description: string
  color: 'green' | 'purple' | 'orange' | 'blue' | 'teal'
  children?: React.ReactNode
}) {
  const colorClasses = {
    green: {
      bg: 'bg-gradient-to-br from-green-50 to-emerald-100',
      border: 'border-green-200 hover:border-green-400',
      accent: 'bg-gradient-to-br from-green-400 to-green-600',
      text: 'text-green-900',
      light: 'text-green-700',
      iconBg: 'bg-green-100',
      iconText: 'text-green-600'
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-50 to-violet-100',
      border: 'border-purple-200 hover:border-purple-400',
      accent: 'bg-gradient-to-br from-purple-400 to-purple-600',
      text: 'text-purple-900',
      light: 'text-purple-700',
      iconBg: 'bg-purple-100',
      iconText: 'text-purple-600'
    },
    orange: {
      bg: 'bg-gradient-to-br from-orange-50 to-amber-100',
      border: 'border-orange-200 hover:border-orange-400',
      accent: 'bg-gradient-to-br from-orange-400 to-orange-600',
      text: 'text-orange-900',
      light: 'text-orange-700',
      iconBg: 'bg-orange-100',
      iconText: 'text-orange-600'
    },
    blue: {
      bg: 'bg-gradient-to-br from-blue-50 to-sky-100',
      border: 'border-blue-200 hover:border-blue-400',
      accent: 'bg-gradient-to-br from-blue-400 to-blue-600',
      text: 'text-blue-900',
      light: 'text-blue-700',
      iconBg: 'bg-blue-100',
      iconText: 'text-blue-600'
    },
    teal: {
      bg: 'bg-gradient-to-br from-teal-50 to-cyan-100',
      border: 'border-teal-200 hover:border-teal-400',
      accent: 'bg-gradient-to-br from-teal-400 to-teal-600',
      text: 'text-teal-900',
      light: 'text-teal-700',
      iconBg: 'bg-teal-100',
      iconText: 'text-teal-600'
    }
  }

  const c = colorClasses[color]

  return (
    <div className={`${c.bg} rounded-2xl p-6 border-2 ${c.border} shadow-sm transition-all hover:shadow-md`}>
      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 ${c.accent} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1">
          <h3 className={`text-lg font-bold ${c.text} mb-2`}>{title}</h3>
          <p className={`${c.light} text-sm`}>{description}</p>
          {children}
        </div>
      </div>
    </div>
  )
}

// Action Button Component
function ActionButton({ onClick, icon: Icon, children, variant = 'primary' }: {
  onClick?: () => void
  icon: any
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
}) {
  const baseClasses = "px-4 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
  const variantClasses = variant === 'primary' 
    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700"
    : "bg-white border-2 border-gray-200 text-gray-700 hover:border-orange-300 hover:text-orange-600"

  return (
    <button onClick={onClick} className={`${baseClasses} ${variantClasses}`}>
      <Icon className="w-4 h-4" />
      {children}
    </button>
  )
}

// Illustration Box for showing UI mockups
function IllustrationBox({ title, children, color = 'gray' }: {
  title: string
  children: React.ReactNode
  color?: 'gray' | 'green' | 'purple' | 'orange'
}) {
  const colorClasses = {
    gray: 'border-gray-300 bg-gray-50',
    green: 'border-green-300 bg-green-50',
    purple: 'border-purple-300 bg-purple-50',
    orange: 'border-orange-300 bg-orange-50'
  }

  return (
    <div className={`rounded-2xl border-2 border-dashed ${colorClasses[color]} p-4`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
          <Layout className="w-4 h-4 text-gray-500" />
          {title}
        </h4>
        <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-lg border border-gray-200">Ukázka</span>
      </div>
      {children}
    </div>
  )
}

// Step indicator for tutorials
function TutorialStep({ number, title, description, color }: {
  number: number
  title: string
  description: string
  color: 'green' | 'purple' | 'orange' | 'blue'
}) {
  const colorClasses = {
    green: { bg: 'bg-green-100', text: 'text-green-700', number: 'bg-green-500' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-700', number: 'bg-purple-500' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-700', number: 'bg-orange-500' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-700', number: 'bg-blue-500' }
  }

  const c = colorClasses[color]

  return (
    <div className={`flex items-start gap-3 ${c.bg} rounded-xl p-3`}>
      <div className={`w-7 h-7 ${c.number} rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
        {number}
      </div>
      <div>
        <p className={`font-medium ${c.text}`}>{title}</p>
        <p className={`text-sm ${c.text} opacity-80`}>{description}</p>
      </div>
    </div>
  )
}

export function HelpView({
  onAddGoal,
  onAddStep,
  onAddHabit,
  onNavigateToGoals,
  onNavigateToHabits,
  onNavigateToSteps,
  onNavigateToManagement,
  realGoals = [],
  realHabits = [],
  realSteps = [],
}: HelpViewProps) {
  const t = useTranslations()
  const [selectedCategory, setSelectedCategory] = useState<HelpCategory>('getting-started')
  const [useRealData, setUseRealData] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Determine which data to use
  const hasRealData = realGoals.length > 0 || realHabits.length > 0 || realSteps.length > 0
  const shouldUseRealData = useRealData && hasRealData

  const goals = shouldUseRealData ? realGoals : mockGoals
  const habits = shouldUseRealData ? realHabits : mockHabits
  const steps = shouldUseRealData ? realSteps : mockSteps

  const categories = [
    { id: 'getting-started' as HelpCategory, label: 'První kroky', icon: Rocket },
    { id: 'overview' as HelpCategory, label: 'Jak aplikaci používat?', icon: HelpCircle },
    { id: 'goals' as HelpCategory, label: 'Cíle', icon: Target },
    { id: 'steps' as HelpCategory, label: 'Kroky', icon: Footprints },
    { id: 'habits' as HelpCategory, label: 'Návyky', icon: CheckSquare },
  ]

  const renderContent = () => {
    switch (selectedCategory) {
      case 'getting-started':
        return (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 rounded-3xl p-8 text-white shadow-2xl">
              <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
              <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-amber-400/20 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <Rocket className="w-9 h-9" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">Vítejte v Pokroku!</h2>
                    <p className="text-orange-100">Vaše cesta k úspěchu začíná zde</p>
                  </div>
                </div>
                <p className="text-xl text-orange-100 max-w-2xl leading-relaxed">
                  Získejte <strong className="text-white">nadhled</strong>, najděte <strong className="text-white">jasnost</strong> a systematicky <strong className="text-white">dosahujte cílů</strong>, které jsou pro vás důležité.
                </p>
              </div>
            </div>

            {/* Why Use Section */}
            <div className="grid md:grid-cols-3 gap-5">
              <FeatureCard 
                icon={Eye} 
                title="Získejte nadhled" 
                description="Vidět všechny své cíle, kroky a návyky přehledně na jednom místě."
                color="blue"
              />
              <FeatureCard 
                icon={Sparkles} 
                title="Najděte jasnost" 
                description="Rozlišit, co je opravdu důležité a co může počkat."
                color="purple"
              />
              <FeatureCard 
                icon={Target} 
                title="Dosáhněte cílů" 
                description="Systematicky postupovat k tomu, co pro vás má smysl."
                color="green"
              />
            </div>

            {/* 3 Steps to Success */}
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Footprints className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">3 kroky k úspěchu</h3>
              </div>
              
              {/* Step 1 - Goals */}
              <div className="relative bg-white rounded-3xl border-2 border-green-200 shadow-lg overflow-hidden group hover:border-green-400 transition-all hover:shadow-xl">
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-green-400 to-emerald-600" />
                <div className="p-6 pl-8">
                  <div className="flex items-start gap-5">
                    <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                      1
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <Target className="w-6 h-6 text-green-600" />
                        Vytvořte svůj první cíl
                      </h4>
                      <p className="text-gray-600 mb-5">
                        Cíle jsou konkrétní, měřitelné výsledky, které chcete dosáhnout. Mohou být krátkodobé i dlouhodobé.
                      </p>
                      
                      {/* Visual mockup of a goal */}
                      <IllustrationBox title="Příklad cíle" color="green">
                        <div className="bg-white rounded-xl p-4 border border-green-200 shadow-sm">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <Target className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <h5 className="font-semibold text-gray-900">Naučit se React</h5>
                              <p className="text-sm text-gray-500 mt-0.5">Chci vytvořit vlastní webovou aplikaci</p>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                  <Calendar className="w-3 h-3" />
                                  Do 15. března
                                </span>
                                <span className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                                  <Star className="w-3 h-3" />
                                  Ve fokusu
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </IllustrationBox>

                      <div className="mt-5 space-y-2">
                        <TutorialStep number={1} title="Přejděte do sekce Cíle" description="V levém menu vyberte 'Cíle'" color="green" />
                        <TutorialStep number={2} title="Klikněte na 'Přidat cíl'" description="Otevře se formulář pro nový cíl" color="green" />
                        <TutorialStep number={3} title="Vyplňte a uložte" description="Zadejte název, popis a termín" color="green" />
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        {onAddGoal && (
                          <ActionButton onClick={onAddGoal} icon={Plus}>
                            Vytvořit cíl
                          </ActionButton>
                        )}
                        {onNavigateToGoals && (
                          <ActionButton onClick={onNavigateToGoals} icon={ArrowRight} variant="secondary">
                            Přejít do Cílů
                          </ActionButton>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 - Steps */}
              <div className="relative bg-white rounded-3xl border-2 border-purple-200 shadow-lg overflow-hidden group hover:border-purple-400 transition-all hover:shadow-xl">
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-purple-400 to-violet-600" />
                <div className="p-6 pl-8">
                  <div className="flex items-start gap-5">
                    <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                      2
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <Footprints className="w-6 h-6 text-purple-600" />
                        Vytvořte své první kroky
                      </h4>
                      <p className="text-gray-600 mb-5">
                        Kroky jsou konkrétní akce, které vás vedou k dosažení vašich cílů. Naplánujte je na konkrétní dny.
                      </p>
                      
                      {/* Visual mockup of steps */}
                      <IllustrationBox title="Příklad kroků k cíli" color="purple">
                        <div className="space-y-2">
                          <div className="bg-white rounded-xl p-3 border border-purple-200 flex items-center gap-3">
                            <div className="w-6 h-6 border-2 border-purple-300 rounded-lg flex items-center justify-center">
                              <CheckSquare className="w-4 h-4 text-purple-400" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-800 text-sm">Nainstalovat Node.js</p>
                              <p className="text-xs text-gray-500">Dnes</p>
                            </div>
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">30 min</span>
                          </div>
                          <div className="bg-white rounded-xl p-3 border border-purple-200 flex items-center gap-3">
                            <div className="w-6 h-6 border-2 border-purple-300 rounded-lg flex items-center justify-center">
                              <CheckSquare className="w-4 h-4 text-purple-400" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-800 text-sm">Projít React tutorial</p>
                              <p className="text-xs text-gray-500">Zítra</p>
                            </div>
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">2 hod</span>
                          </div>
                          <div className="bg-white rounded-xl p-3 border border-green-200 flex items-center gap-3 opacity-60">
                            <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center">
                              <CheckSquare className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-500 text-sm line-through">Vytvořit první projekt</p>
                              <p className="text-xs text-gray-400">Dokončeno</p>
                            </div>
                          </div>
                        </div>
                      </IllustrationBox>

                      <div className="mt-5 space-y-2">
                        <TutorialStep number={1} title="Přejděte do sekce Kroky" description="V levém menu vyberte 'Kroky'" color="purple" />
                        <TutorialStep number={2} title="Klikněte na 'Přidat krok'" description="Otevře se formulář pro nový krok" color="purple" />
                        <TutorialStep number={3} title="Přiřaďte k cíli" description="Vyberte cíl a nastavte datum" color="purple" />
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        {onAddStep && (
                          <ActionButton onClick={onAddStep} icon={Plus}>
                            Vytvořit krok
                          </ActionButton>
                        )}
                        {onNavigateToSteps && (
                          <ActionButton onClick={onNavigateToSteps} icon={ArrowRight} variant="secondary">
                            Přejít do Kroků
                          </ActionButton>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 - Habits */}
              <div className="relative bg-white rounded-3xl border-2 border-orange-200 shadow-lg overflow-hidden group hover:border-orange-400 transition-all hover:shadow-xl">
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-orange-400 to-amber-600" />
                <div className="p-6 pl-8">
                  <div className="flex items-start gap-5">
                    <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                      3
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <CheckSquare className="w-6 h-6 text-orange-600" />
                        Vytvořte svůj první návyk
                      </h4>
                      <p className="text-gray-600 mb-5">
                        Návyky jsou opakující se aktivity. Malé každodenní akce vedou k velkým změnám.
                      </p>
                      
                      {/* Visual mockup of habits */}
                      <IllustrationBox title="Příklad návyků" color="orange">
                        <div className="space-y-2">
                          <div className="bg-white rounded-xl p-3 border border-orange-200 flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg flex items-center justify-center">
                              <Zap className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-800 text-sm">Ranní cvičení</p>
                              <p className="text-xs text-gray-500">Každý den • 07:00</p>
                            </div>
                            <div className="flex gap-1">
                              {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map((day, i) => (
                                <span key={day} className={`w-5 h-5 rounded text-[10px] flex items-center justify-center ${i < 5 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                                  {day[0]}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="bg-white rounded-xl p-3 border border-orange-200 flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-500 rounded-lg flex items-center justify-center">
                              <BookOpen className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-800 text-sm">Čtení před spaním</p>
                              <p className="text-xs text-gray-500">Každý den • 21:00</p>
                            </div>
                            <div className="flex gap-1">
                              {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map((day, i) => (
                                <span key={day} className={`w-5 h-5 rounded text-[10px] flex items-center justify-center ${i < 3 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                                  {day[0]}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </IllustrationBox>

                      <div className="mt-5 space-y-2">
                        <TutorialStep number={1} title="Přejděte do sekce Návyky" description="V levém menu vyberte 'Návyky'" color="orange" />
                        <TutorialStep number={2} title="Klikněte na 'Přidat návyk'" description="Otevře se formulář pro nový návyk" color="orange" />
                        <TutorialStep number={3} title="Nastavte frekvenci" description="Vyberte dny a případně připomínku" color="orange" />
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        {onAddHabit && (
                          <ActionButton onClick={onAddHabit} icon={Plus}>
                            Vytvořit návyk
                          </ActionButton>
                        )}
                        {onNavigateToHabits && (
                          <ActionButton onClick={onNavigateToHabits} icon={ArrowRight} variant="secondary">
                            Přejít do Návyků
                          </ActionButton>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* What's Next Banner */}
            <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              <div className="relative z-10">
                <div className="flex items-start gap-5">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-9 h-9" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-3">Co dál?</h3>
                    <p className="text-emerald-100 mb-5 text-lg">
                      Gratulujeme! Teď máte vše připraveno. Zde je, co můžete dělat každý den:
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                        <Calendar className="w-5 h-5" />
                        <span>Zkontrolujte denní přehled</span>
                      </div>
                      <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                        <CheckSquare className="w-5 h-5" />
                        <span>Plňte kroky a návyky</span>
                      </div>
                      <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                        <Star className="w-5 h-5" />
                        <span>Označte důležité cíle "ve fokusu"</span>
                      </div>
                      <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                        <BarChart3 className="w-5 h-5" />
                        <span>Sledujte svůj pokrok</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'overview':
        return (
          <div className="space-y-8">
            {/* Hero */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-2xl">
              <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <HelpCircle className="w-8 h-8" />
                  </div>
                  <h2 className="text-3xl font-bold">Jak aplikaci používat?</h2>
                </div>
                <p className="text-xl text-blue-100 max-w-2xl">
                  Pokrok vám pomáhá získat <strong className="text-white">nadhled</strong> a <strong className="text-white">jasnost</strong> nad tím, co je pro vás důležité.
                </p>
              </div>
            </div>

            {/* Use Cases */}
            <div className="space-y-5">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                Praktické příklady použití
              </h3>

              {/* Use Case 1 */}
              <div className="bg-white rounded-2xl border-2 border-blue-200 shadow-lg overflow-hidden hover:border-blue-400 transition-all">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                  <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="text-2xl">📋</span>
                    Use Case 1: Začínáte s novým cílem
                  </h4>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 mb-4">
                    <strong>Scénář:</strong> Chcete se naučit novou dovednost nebo dosáhnout něčeho důležitého.
                  </p>
                  <IllustrationBox title="Jak na to" color="gray">
                    <div className="space-y-2">
                      <TutorialStep number={1} title="Definujte cíl" description="Např. 'Naučit se React do 3 měsíců'" color="blue" />
                      <TutorialStep number={2} title="Rozdělte na kroky" description="Konkrétní akce, které vás k cíli dovedou" color="blue" />
                      <TutorialStep number={3} title="Označte jako 've fokusu'" description="Zobrazí se na hlavním panelu" color="blue" />
                      <TutorialStep number={4} title="Plňte kroky" description="Každý den kontrolujte a postupně plňte" color="blue" />
                    </div>
                  </IllustrationBox>
                  <p className="mt-4 text-sm text-gray-500 flex items-center gap-2 bg-blue-50 rounded-xl p-3">
                    <span className="text-lg">💡</span>
                    <span><strong>Výsledek:</strong> Máte jasný plán, vidíte svůj pokrok a víte, co dělat dál.</span>
                  </p>
                </div>
              </div>

              {/* Use Case 2 */}
              <div className="bg-white rounded-2xl border-2 border-green-200 shadow-lg overflow-hidden hover:border-green-400 transition-all">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                  <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="text-2xl">🔄</span>
                    Use Case 2: Budujete návyky pro dlouhodobý úspěch
                  </h4>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 mb-4">
                    <strong>Scénář:</strong> Chcete si vybudovat pozitivní návyky, které vás dlouhodobě posunou vpřed.
                  </p>
                  <IllustrationBox title="Jak na to" color="green">
                    <div className="space-y-2">
                      <TutorialStep number={1} title="Vytvořte návyk" description="Např. 'Cvičit 3x týdně'" color="green" />
                      <TutorialStep number={2} title="Nastavte dny" description="Vyberte konkrétní dny v týdnu" color="green" />
                      <TutorialStep number={3} title="Plňte pravidelně" description="Označujte návyky jako splněné" color="green" />
                      <TutorialStep number={4} title="Sledujte konzistenci" description="V týdenním nebo měsíčním přehledu" color="green" />
                    </div>
                  </IllustrationBox>
                  <p className="mt-4 text-sm text-gray-500 flex items-center gap-2 bg-green-50 rounded-xl p-3">
                    <span className="text-lg">💡</span>
                    <span><strong>Výsledek:</strong> Malé každodenní akce vedou k velkým změnám.</span>
                  </p>
                </div>
              </div>

              {/* Use Case 3 */}
              <div className="bg-white rounded-2xl border-2 border-purple-200 shadow-lg overflow-hidden hover:border-purple-400 transition-all">
                <div className="bg-gradient-to-r from-purple-500 to-violet-600 px-6 py-4">
                  <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="text-2xl">🎯</span>
                    Use Case 3: Prioritizace a fokus na to důležité
                  </h4>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 mb-4">
                    <strong>Scénář:</strong> Máte mnoho cílů a úkolů, ale nevíte, na co se zaměřit.
                  </p>
                  <IllustrationBox title="Jak na to" color="purple">
                    <div className="space-y-2">
                      <TutorialStep number={1} title="Vytvořte všechny cíle" description="Mějte přehled o všem" color="purple" />
                      <TutorialStep number={2} title="Označte 2-3 nejdůležitější" description="Jako 've fokusu'" color="purple" />
                      <TutorialStep number={3} title="Zaměřte se na fokus" description="V denním přehledu uvidíte jen důležité" color="purple" />
                      <TutorialStep number={4} title="Pravidelně revidujte" description="Upravujte podle priorit" color="purple" />
                    </div>
                  </IllustrationBox>
                  <p className="mt-4 text-sm text-gray-500 flex items-center gap-2 bg-purple-50 rounded-xl p-3">
                    <span className="text-lg">💡</span>
                    <span><strong>Výsledek:</strong> Máte jasnost - víte, na co se zaměřit dnes.</span>
                  </p>
                </div>
              </div>

              {/* Use Case 4 */}
              <div className="bg-white rounded-2xl border-2 border-orange-200 shadow-lg overflow-hidden hover:border-orange-400 transition-all">
                <div className="bg-gradient-to-r from-orange-500 to-amber-600 px-6 py-4">
                  <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="text-2xl">📊</span>
                    Use Case 4: Pravidelná revize a úprava směru
                  </h4>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 mb-4">
                    <strong>Scénář:</strong> Chcete pravidelně kontrolovat, jestli jdete správným směrem.
                  </p>
                  <IllustrationBox title="Jak na to" color="orange">
                    <div className="space-y-2">
                      <TutorialStep number={1} title="Týdenní revize" description="Projděte, co jste splnili" color="orange" />
                      <TutorialStep number={2} title="Měsíční přehled" description="Vidíte větší obrazec a trendy" color="orange" />
                      <TutorialStep number={3} title="Upravte termíny" description="Pokud se situace změnila" color="orange" />
                      <TutorialStep number={4} title="Oslavte úspěchy" description="Označte dokončené cíle" color="orange" />
                    </div>
                  </IllustrationBox>
                  <p className="mt-4 text-sm text-gray-500 flex items-center gap-2 bg-orange-50 rounded-xl p-3">
                    <span className="text-lg">💡</span>
                    <span><strong>Výsledek:</strong> Máte nadhled a můžete flexibilně reagovat na změny.</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Start */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                <Rocket className="w-6 h-6 text-orange-500" />
                Rychlý start
              </h3>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-lg font-bold text-green-600">1</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Den 1</h4>
                  <p className="text-sm text-gray-600">Vytvořte 1-2 cíle, které vás zajímají</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-lg font-bold text-purple-600">2</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Den 2-3</h4>
                  <p className="text-sm text-gray-600">Přidejte kroky a označte cíle "ve fokusu"</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-lg font-bold text-orange-600">3</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Den 4-5</h4>
                  <p className="text-sm text-gray-600">Naplánujte kroky na konkrétní dny</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-lg font-bold text-blue-600">4</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Týden 2+</h4>
                  <p className="text-sm text-gray-600">Přidejte návyky a kontrolujte denní přehled</p>
                </div>
              </div>
            </div>
          </div>
        )

      case 'goals':
        return (
          <div className="space-y-8">
            {/* Hero */}
            <div className="relative overflow-hidden bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 rounded-3xl p-8 text-white shadow-2xl">
              <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <Target className="w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-bold">Cíle</h2>
                  </div>
                  <p className="text-xl text-green-100 max-w-xl">
                    Cíle jsou dlouhodobé výsledky, které chcete dosáhnout. Můžete k nim přidávat kroky.
                  </p>
                </div>
                <div className="flex gap-3">
                  {hasRealData && (
                    <button
                      onClick={() => setUseRealData(!useRealData)}
                      className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-colors"
                    >
                      {useRealData ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      <span className="text-sm">{useRealData ? 'Vaše data' : 'Ukázka'}</span>
                    </button>
                  )}
                  {onAddGoal && (
                    <button
                      onClick={onAddGoal}
                      className="flex items-center gap-2 px-4 py-2 bg-white text-green-600 font-medium rounded-xl hover:bg-green-50 transition-colors shadow-lg"
                    >
                      <Plus className="w-5 h-5" />
                      Přidat cíl
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* What are goals */}
            <FeatureCard icon={Target} title="Co jsou cíle?" description="Cíle jsou vaše dlouhodobé výsledky a sny, které chcete dosáhnout. Mohou být krátkodobé (týden) i dlouhodobé (rok). Ke každému cíli můžete přidat kroky, které vás k němu dovedou." color="green">
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 text-xs bg-green-200 text-green-800 px-3 py-1.5 rounded-full">
                  <Target className="w-3 h-3" /> Měřitelné
                </span>
                <span className="inline-flex items-center gap-1 text-xs bg-green-200 text-green-800 px-3 py-1.5 rounded-full">
                  <Calendar className="w-3 h-3" /> S termínem
                </span>
                <span className="inline-flex items-center gap-1 text-xs bg-green-200 text-green-800 px-3 py-1.5 rounded-full">
                  <Star className="w-3 h-3" /> Ve fokusu
                </span>
              </div>
            </FeatureCard>

            {/* Visual demo */}
            <IllustrationBox title="Ukázka správy cílů">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ maxHeight: '500px', pointerEvents: 'none' }}>
                <div className="overflow-y-auto" style={{ maxHeight: '500px' }}>
                  <GoalsManagementView
                    goals={goals}
                    onGoalsUpdate={() => {}}
                    setOverviewBalances={() => {}}
                    userId={null}
                    player={null}
                  />
                </div>
              </div>
            </IllustrationBox>

            {/* How to create */}
            <div className="bg-white rounded-2xl border-2 border-green-200 p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                <Plus className="w-6 h-6 text-green-600" />
                Jak vytvořit cíl?
              </h3>
              <div className="space-y-3">
                <TutorialStep number={1} title="Přejděte do sekce Cíle" description="V levém menu vyberte 'Cíle'" color="green" />
                <TutorialStep number={2} title="Klikněte na 'Přidat cíl'" description="Otevře se formulář pro nový cíl" color="green" />
                <TutorialStep number={3} title="Vyplňte název" description="Např. 'Naučit se programovat'" color="green" />
                <TutorialStep number={4} title="Nastavte termín" description="Volitelné - pomáhá s motivací" color="green" />
                <TutorialStep number={5} title="Zaškrtněte 'Ve fokusu'" description="Pokud chcete cíl zvýraznit" color="green" />
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                {onAddGoal && <ActionButton onClick={onAddGoal} icon={Plus}>Vytvořit cíl</ActionButton>}
                {onNavigateToGoals && <ActionButton onClick={onNavigateToGoals} icon={ArrowRight} variant="secondary">Přejít do Cílů</ActionButton>}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-200 p-6">
              <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Tipy pro práci s cíli
              </h3>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span><strong>Switcher stavu:</strong> V tabulce můžete rychle přepínat mezi "Aktivní" a "Odložené"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span><strong>Kliknutí na řádek:</strong> Otevře editační modál cíle</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span><strong>Fokus:</strong> Označte 2-3 nejdůležitější cíle jako "ve fokusu"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span><strong>Začněte s malými cíli:</strong> Velké cíle rozdělte na menší kroky</span>
                </li>
              </ul>
            </div>
          </div>
        )

      case 'steps':
        return (
          <div className="space-y-8">
            {/* Hero */}
            <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-600 rounded-3xl p-8 text-white shadow-2xl">
              <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <Footprints className="w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-bold">Kroky</h2>
                  </div>
                  <p className="text-xl text-purple-100 max-w-xl">
                    Kroky jsou konkrétní akce, které vás vedou k vašim cílům. Plánujte je na konkrétní dny.
                  </p>
                </div>
                <div className="flex gap-3">
                  {hasRealData && (
                    <button
                      onClick={() => setUseRealData(!useRealData)}
                      className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-colors"
                    >
                      {useRealData ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      <span className="text-sm">{useRealData ? 'Vaše data' : 'Ukázka'}</span>
                    </button>
                  )}
                  {onAddStep && (
                    <button
                      onClick={onAddStep}
                      className="flex items-center gap-2 px-4 py-2 bg-white text-purple-600 font-medium rounded-xl hover:bg-purple-50 transition-colors shadow-lg"
                    >
                      <Plus className="w-5 h-5" />
                      Přidat krok
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* What are steps */}
            <FeatureCard icon={Footprints} title="Co jsou kroky?" description="Kroky jsou konkrétní, akční úkoly, které vás vedou k dosažení vašich cílů. Můžete je plánovat na konkrétní dny, přiřazovat k cílům a sledovat jejich dokončení." color="purple">
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 text-xs bg-purple-200 text-purple-800 px-3 py-1.5 rounded-full">
                  <Calendar className="w-3 h-3" /> Naplánované
                </span>
                <span className="inline-flex items-center gap-1 text-xs bg-purple-200 text-purple-800 px-3 py-1.5 rounded-full">
                  <Target className="w-3 h-3" /> Přiřazené k cíli
                </span>
                <span className="inline-flex items-center gap-1 text-xs bg-purple-200 text-purple-800 px-3 py-1.5 rounded-full">
                  <Clock className="w-3 h-3" /> S odhadem času
                </span>
                <span className="inline-flex items-center gap-1 text-xs bg-purple-200 text-purple-800 px-3 py-1.5 rounded-full">
                  <Flag className="w-3 h-3" /> Priorita
                </span>
              </div>
            </FeatureCard>

            {/* Visual demo */}
            <IllustrationBox title="Ukázka správy kroků">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ maxHeight: '500px', pointerEvents: 'none' }}>
                <div className="overflow-y-auto" style={{ maxHeight: '500px' }}>
                  <StepsManagementView
                    dailySteps={steps}
                    goals={goals}
                    onDailyStepsUpdate={() => {}}
                    userId={null}
                    player={null}
                  />
                </div>
              </div>
            </IllustrationBox>

            {/* How to create */}
            <div className="bg-white rounded-2xl border-2 border-purple-200 p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                <Plus className="w-6 h-6 text-purple-600" />
                Jak vytvořit krok?
              </h3>
              <div className="space-y-3">
                <TutorialStep number={1} title="Přejděte do sekce Kroky" description="V levém menu vyberte 'Kroky'" color="purple" />
                <TutorialStep number={2} title="Klikněte na 'Přidat krok'" description="Otevře se formulář pro nový krok" color="purple" />
                <TutorialStep number={3} title="Vyplňte název" description="Např. 'Přečíst kapitolu 1'" color="purple" />
                <TutorialStep number={4} title="Vyberte datum" description="Kdy chcete krok dokončit" color="purple" />
                <TutorialStep number={5} title="Přiřaďte k cíli" description="Volitelné - pomáhá s organizací" color="purple" />
                <TutorialStep number={6} title="Nastavte prioritu" description="Důležité/Urgentní pro lepší přehled" color="purple" />
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                {onAddStep && <ActionButton onClick={onAddStep} icon={Plus}>Vytvořit krok</ActionButton>}
                {onNavigateToSteps && <ActionButton onClick={onNavigateToSteps} icon={ArrowRight} variant="secondary">Přejít do Kroků</ActionButton>}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border-2 border-green-200 p-6">
              <h3 className="text-lg font-bold text-green-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Tipy pro práci s kroky
              </h3>
              <ul className="space-y-2 text-green-800">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span><strong>Rozdělte velké úkoly:</strong> Na menší kroky, které můžete snadno splnit</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span><strong>Odhadněte čas:</strong> Pomáhá s plánováním dne</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span><strong>Používejte priority:</strong> Důležité/Urgentní pro lepší rozhodování</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span><strong>Přesouvejte nedokončené:</strong> Na další den, pokud je nestihnete</span>
                </li>
              </ul>
            </div>
          </div>
        )

      case 'habits':
        return (
          <div className="space-y-8">
            {/* Hero */}
            <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 rounded-3xl p-8 text-white shadow-2xl">
              <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <CheckSquare className="w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-bold">Návyky</h2>
                  </div>
                  <p className="text-xl text-orange-100 max-w-xl">
                    Návyky jsou opakující se aktivity. Malé každodenní akce vedou k velkým změnám.
                  </p>
                </div>
                <div className="flex gap-3">
                  {hasRealData && (
                    <button
                      onClick={() => setUseRealData(!useRealData)}
                      className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-colors"
                    >
                      {useRealData ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      <span className="text-sm">{useRealData ? 'Vaše data' : 'Ukázka'}</span>
                    </button>
                  )}
                  {onAddHabit && (
                    <button
                      onClick={onAddHabit}
                      className="flex items-center gap-2 px-4 py-2 bg-white text-orange-600 font-medium rounded-xl hover:bg-orange-50 transition-colors shadow-lg"
                    >
                      <Plus className="w-5 h-5" />
                      Přidat návyk
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* What are habits */}
            <FeatureCard icon={CheckSquare} title="Co jsou návyky?" description="Návyky jsou opakující se aktivity, které chcete dělat pravidelně. Můžete je nastavit jako denní, týdenní, měsíční nebo vlastní frekvenci. Aplikace vám pomůže sledovat, jak často je plníte." color="orange">
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 text-xs bg-orange-200 text-orange-800 px-3 py-1.5 rounded-full">
                  <Calendar className="w-3 h-3" /> Denní
                </span>
                <span className="inline-flex items-center gap-1 text-xs bg-orange-200 text-orange-800 px-3 py-1.5 rounded-full">
                  <Calendar className="w-3 h-3" /> Týdenní
                </span>
                <span className="inline-flex items-center gap-1 text-xs bg-orange-200 text-orange-800 px-3 py-1.5 rounded-full">
                  <Clock className="w-3 h-3" /> S připomínkou
                </span>
              </div>
            </FeatureCard>

            {/* Visual demo */}
            <IllustrationBox title="Ukázka správy návyků">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ maxHeight: '500px', pointerEvents: 'none' }}>
                <div className="overflow-y-auto" style={{ maxHeight: '500px' }}>
                  <HabitsManagementView
                    habits={habits}
                    onHabitsUpdate={() => {}}
                    handleHabitToggle={async () => {}}
                    loadingHabits={new Set()}
                    setOverviewBalances={() => {}}
                  />
                </div>
              </div>
            </IllustrationBox>

            {/* How to create */}
            <div className="bg-white rounded-2xl border-2 border-orange-200 p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                <Plus className="w-6 h-6 text-orange-600" />
                Jak vytvořit návyk?
              </h3>
              <div className="space-y-3">
                <TutorialStep number={1} title="Přejděte do sekce Návyky" description="V levém menu vyberte 'Návyky'" color="orange" />
                <TutorialStep number={2} title="Klikněte na 'Přidat návyk'" description="Otevře se formulář pro nový návyk" color="orange" />
                <TutorialStep number={3} title="Vyplňte název" description="Např. 'Cvičení ráno'" color="orange" />
                <TutorialStep number={4} title="Vyberte frekvenci" description="Denní, týdenní, měsíční nebo vlastní" color="orange" />
                <TutorialStep number={5} title="Vyberte dny" description="Pro vlastní frekvenci vyberte konkrétní dny" color="orange" />
                <TutorialStep number={6} title="Nastavte připomínku" description="Volitelné - pomáhá s konzistencí" color="orange" />
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                {onAddHabit && <ActionButton onClick={onAddHabit} icon={Plus}>Vytvořit návyk</ActionButton>}
                {onNavigateToHabits && <ActionButton onClick={onNavigateToHabits} icon={ArrowRight} variant="secondary">Přejít do Návyků</ActionButton>}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border-2 border-purple-200 p-6">
              <h3 className="text-lg font-bold text-purple-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Tipy pro budování návyků
              </h3>
              <ul className="space-y-2 text-purple-800">
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span><strong>Začněte s malými návyky:</strong> Které můžete snadno plnit</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span><strong>Buďte konzistentní:</strong> Lepší je malý návyk každý den než velký jednou za týden</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span><strong>Používejte připomínky:</strong> Pomohou vám nezapomenout</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span><strong>Sledujte konzistenci:</strong> V týdenním přehledu vidíte, jak se vám daří</span>
                </li>
              </ul>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="w-full h-full flex bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Left sidebar - Categories - Hidden on mobile */}
      <div className="hidden md:flex w-72 border-r border-gray-200 bg-white flex-shrink-0 shadow-sm">
        <div className="p-5 w-full">
          <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-orange-500" />
            Nápověda
          </h2>
          <nav className="space-y-2">
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all text-left ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{category.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Right content area */}
      <div className="flex-1 overflow-y-auto relative">
        {/* Mobile hamburger menu */}
        <div className="md:hidden sticky top-0 z-10 bg-white border-b border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-orange-500" />
              Nápověda
            </h2>
            <div className="relative">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200"
                title="Menu"
              >
                <Menu className="w-5 h-5 text-gray-700" />
              </button>
              
              {/* Mobile menu dropdown */}
              {mobileMenuOpen && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 z-[100]" 
                    onClick={() => setMobileMenuOpen(false)}
                  />
                  <div className="fixed right-4 top-16 bg-white border border-gray-200 rounded-2xl shadow-2xl z-[101] min-w-[220px] overflow-hidden">
                    <nav className="py-2">
                      {categories.map((category) => {
                        const Icon = category.icon
                        return (
                          <button
                            key={category.id}
                            onClick={() => {
                              setSelectedCategory(category.id)
                              setMobileMenuOpen(false)
                            }}
                            className={`w-full flex items-center gap-3 px-5 py-3.5 transition-colors text-left ${
                              selectedCategory === category.id
                                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{category.label}</span>
                          </button>
                        )
                      })}
                    </nav>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="max-w-5xl mx-auto p-5 md:p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
