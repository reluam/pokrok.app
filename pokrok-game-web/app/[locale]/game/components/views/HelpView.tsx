'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { HelpCircle, Target, Footprints, CheckSquare, Plus, ArrowRight, ToggleLeft, ToggleRight, Menu } from 'lucide-react'
import { GoalsManagementView } from './GoalsManagementView'
import { HabitsManagementView } from './HabitsManagementView'
import { StepsManagementView } from './StepsManagementView'

interface HelpViewProps {
  onAddGoal?: () => void
  onAddStep?: () => void
  onAddHabit?: () => void
  onNavigateToGoals?: () => void
  onNavigateToHabits?: () => void
  onNavigateToManagement?: () => void
  // Optional real data - if provided, can toggle between mock and real
  realGoals?: any[]
  realHabits?: any[]
  realSteps?: any[]
  realAspirations?: any[]
  realAreas?: any[]
}

type HelpCategory = 'overview' | 'goals' | 'steps' | 'habits'

// Mock data for demonstration
const mockGoals = [
  {
    id: 'mock-goal-1',
    title: 'Naučit se programovat v React',
    description: 'Chci se naučit React a vytvořit vlastní webovou aplikaci',
    status: 'active',
    target_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    area_id: 'mock-area-1',
    aspiration_id: 'mock-aspiration-1',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    completed: false
  },
  {
    id: 'mock-goal-2',
    title: 'Pravidelně cvičit',
    description: 'Cvičit alespoň 3x týdně po dobu 30 minut',
    status: 'active',
    target_date: null,
    area_id: 'mock-area-2',
    aspiration_id: null,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    completed: false
  },
  {
    id: 'mock-goal-3',
    title: 'Přečíst 12 knih za rok',
    description: 'Každý měsíc přečíst jednu knihu',
    status: 'completed',
    target_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    area_id: 'mock-area-3',
    aspiration_id: null,
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
    aspiration_id: 'mock-aspiration-2',
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
    aspiration_id: null,
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
    aspiration_id: 'mock-aspiration-1',
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

const mockAspirations = [
  {
    id: 'mock-aspiration-1',
    title: 'Profesní růst',
    description: 'Rozvíjet se v oblasti programování a technologie',
    color: '#3B82F6'
  },
  {
    id: 'mock-aspiration-2',
    title: 'Zdraví a fitness',
    description: 'Udržovat zdravý životní styl a fyzickou kondici',
    color: '#10B981'
  },
  {
    id: 'mock-aspiration-3',
    title: 'Osobní rozvoj',
    description: 'Číst knihy, meditovat a rozvíjet se',
    color: '#8B5CF6'
  }
]

const mockAreas = [
  {
    id: 'mock-area-1',
    name: 'Kariéra',
    color: '#3B82F6'
  },
  {
    id: 'mock-area-2',
    name: 'Zdraví',
    color: '#10B981'
  },
  {
    id: 'mock-area-3',
    name: 'Vzdělání',
    color: '#8B5CF6'
  }
]

export function HelpView({
  onAddGoal,
  onAddStep,
  onAddHabit,
  onNavigateToGoals,
  onNavigateToHabits,
  onNavigateToManagement,
  realGoals = [],
  realHabits = [],
  realSteps = [],
  realAspirations = [],
  realAreas = []
}: HelpViewProps) {
  const t = useTranslations()
  const [selectedCategory, setSelectedCategory] = useState<HelpCategory>('overview')
  const [useRealData, setUseRealData] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Determine which data to use
  const hasRealData = realGoals.length > 0 || realHabits.length > 0 || realSteps.length > 0
  const shouldUseRealData = useRealData && hasRealData

  const goals = shouldUseRealData ? realGoals : mockGoals
  const habits = shouldUseRealData ? realHabits : mockHabits
  const steps = shouldUseRealData ? realSteps : mockSteps
  const aspirations = shouldUseRealData && realAspirations.length > 0 ? realAspirations : mockAspirations
  const areas = shouldUseRealData && realAreas.length > 0 ? realAreas : mockAreas

  const categories = [
    { id: 'overview' as HelpCategory, label: 'Jak aplikaci používat?', icon: HelpCircle },
    { id: 'goals' as HelpCategory, label: 'Cíle', icon: Target },
    { id: 'steps' as HelpCategory, label: 'Kroky', icon: Footprints },
    { id: 'habits' as HelpCategory, label: 'Návyky', icon: CheckSquare },
  ]

  const renderContent = () => {
    switch (selectedCategory) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Jak aplikaci používat?</h2>
              <p className="text-gray-700 mb-4">
                Vítejte v aplikaci Pokrok! Tato aplikace vám pomůže organizovat vaše cíle, kroky a návyky 
                a sledovat váš pokrok na cestě k úspěchu.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <h3 className="font-semibold text-blue-900 mb-2">Hlavní panel</h3>
                <p className="text-blue-800 text-sm mb-2">
                  Hlavní panel je vaše centrální místo s navigací v levém sidebaru. Můžete zde přistupovat ke všem sekcím:
                </p>
                <ul className="text-blue-800 text-sm list-disc list-inside space-y-1 mb-2">
                  <li><strong>Přehled:</strong> Denní, týdenní, měsíční nebo roční pohled na vaše cíle a kroky</li>
                  <li><strong>Cíle:</strong> Správa všech vašich cílů</li>
                  <li><strong>Kroky:</strong> Správa kroků a úkolů</li>
                  <li><strong>Návyky:</strong> Správa vašich návyků</li>
                  <li><strong>Aspirace:</strong> Správa aspiračních oblastí</li>
                </ul>
                <p className="text-blue-800 text-sm">
                  <strong>Tip:</strong> Levý sidebar můžete skrýt (zobrazí se pouze ikony) nebo rozbalit (zobrazí se ikony i text) pomocí tlačítka v pravém horním rohu sidebaru.
                </p>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <h3 className="font-semibold text-green-900 mb-2">Navigace v hlavním panelu</h3>
                <p className="text-green-800 text-sm">
                  V hlavním panelu najdete levý sidebar s navigací. Kliknutím na jednotlivé položky se přepnete mezi sekcemi. 
                  Sidebar můžete skrýt pro větší prostor na obrazovce - zobrazí se pouze ikony, které vám ukážou, kde se nacházíte.
                </p>
              </div>

              <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
                <h3 className="font-semibold text-purple-900 mb-2">Fokus</h3>
                <p className="text-purple-800 text-sm">
                  Fokus můžete nastavit přímo v editačním modálu cíle. Zaškrtnutím "Přidat do fokusu" označíte cíl jako důležitý. 
                  Cíle ve fokusu budou zvýrazněny a zobrazí se na hlavním panelu v sekci Přehled.
                </p>
              </div>

              <div className="bg-orange-50 border-l-4 border-orange-600 p-4 rounded">
                <h3 className="font-semibold text-orange-900 mb-2">Nápověda a nastavení</h3>
                <p className="text-orange-800 text-sm">
                  V horním menu najdete tlačítko Nápověda (otazník) a Nastavení. Nápověda vám poskytne detailní informace 
                  o všech funkcích aplikace.
                </p>
              </div>
            </div>

            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Začínáme</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Otevřete hlavní panel - uvidíte levý sidebar s navigací</li>
                <li>Začněte vytvořením svého prvního cíle (sekce "Cíle")</li>
                <li>Přidejte kroky, které vás k cíli dovedou (sekce "Kroky")</li>
                <li>Nastavte návyky pro každodenní aktivity (sekce "Návyky")</li>
                <li>Označte důležité cíle jako "ve fokusu" pro lepší přehled</li>
                <li>Sledujte svůj pokrok v sekci "Přehled" a oslavujte úspěchy</li>
              </ol>
            </div>
          </div>
        )

      case 'goals':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Cíle</h2>
                <p className="text-gray-600">
                  Cíle jsou dlouhodobé aspirace, které chcete dosáhnout. Můžete je organizovat podle oblastí 
                  a přiřazovat k nim kroky a milníky.
                </p>
              </div>
              <div className="flex items-center gap-3">
                {hasRealData && (
                  <button
                    onClick={() => setUseRealData(!useRealData)}
                    className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title={useRealData ? 'Přepnout na ukázková data' : 'Přepnout na vaše data'}
                  >
                    {useRealData ? <ToggleRight className="w-4 h-4 text-green-600" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />}
                    <span className="text-xs text-gray-600">{useRealData ? 'Vaše data' : 'Ukázka'}</span>
                  </button>
                )}
                {onAddGoal && (
                  <button
                    onClick={onAddGoal}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Přidat cíl
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-600" />
                  Co jsou cíle?
                </h3>
                <p className="text-gray-700 mb-3">
                  Cíle jsou vaše dlouhodobé aspirace a sny, které chcete dosáhnout. Můžete je kategorizovat 
                  podle oblastí života (osobní, kariéra, zdraví, vzdělání, vztahy, koníčky) a přiřazovat k nim 
                  kroky a milníky.
                </p>
              </div>

              {/* Visual demonstration - Goals Management View */}
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Ukázka správy cílů</h3>
                  <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">Pouze pro zobrazení</span>
                </div>
                <div className="bg-white rounded-lg shadow-sm overflow-hidden relative" style={{ maxHeight: '600px', pointerEvents: 'none' }}>
                  <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
                    <GoalsManagementView
                      goals={goals}
                      aspirations={aspirations}
                      areas={areas}
                      onGoalsUpdate={() => {}}
                      setOverviewBalances={() => {}}
                      userId={null}
                      player={null}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h3 className="font-semibold text-gray-900 mb-3">Jak vytvořit cíl?</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-3">
                  <li>Přejděte do hlavního panelu a vyberte sekci "Cíle" v levém sidebaru</li>
                  <li>Klikněte na tlačítko "Přidat cíl" nebo použijte tlačítko výše</li>
                  <li>Vyplňte název cíle (např. "Naučit se programovat")</li>
                  <li>Přidejte popis, pokud chcete</li>
                  <li>Nastavte termín dokončení (volitelné)</li>
                  <li>Vyberte oblast a aspiraci (volitelné)</li>
                  <li>Zaškrtněte "Přidat do fokusu", pokud chcete cíl zvýraznit</li>
                  <li>Uložte cíl</li>
                </ol>
                {onNavigateToGoals && (
                  <button
                    onClick={onNavigateToGoals}
                    className="mt-3 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                  >
                    Přejít do Cílů <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h3 className="font-semibold text-gray-900 mb-3">Správa cílů v tabulce</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li><strong>Switcher stavu:</strong> V tabulce cílů můžete rychle přepínat mezi stavem "Aktivní" a "Odložené" pomocí switcheru. Dokončené cíle zůstávají jako badge.</li>
                  <li><strong>Kliknutí na řádek:</strong> Kliknutím na jakýkoliv řádek v tabulce otevřete editační modál cíle</li>
                  <li><strong>Fokus:</strong> Cíle můžete označit jako "ve fokusu" v editačním modálu - zaškrtněte "Přidat do fokusu"</li>
                  <li><strong>Přidávání kroků:</strong> Ke každému cíli můžete přidat kroky, které vás k němu dovedou</li>
                  <li><strong>Milníky:</strong> Nastavte milníky pro sledování pokroku</li>
                  <li><strong>Status:</strong> Můžete označit cíl jako aktivní, dokončený nebo odložený</li>
                  <li><strong>Oblasti:</strong> Organizujte cíle podle oblastí života</li>
                  <li><strong>Aspirace:</strong> Přiřaďte cíle k aspiračním oblastem</li>
                </ul>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <h3 className="font-semibold text-blue-900 mb-2">Tip</h3>
                <p className="text-blue-800 text-sm">
                  Začněte s malými, dosažitelnými cíli. Velké cíle rozdělte na menší kroky a milníky, 
                  abyste mohli sledovat svůj pokrok.
                </p>
              </div>
            </div>
          </div>
        )

      case 'steps':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Kroky</h2>
                <p className="text-gray-600">
                  Kroky jsou konkrétní akce, které vás vedou k vašim cílům. Můžete je plánovat na konkrétní 
                  dny a sledovat jejich dokončení.
                </p>
              </div>
              <div className="flex items-center gap-3">
                {hasRealData && (
                  <button
                    onClick={() => setUseRealData(!useRealData)}
                    className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title={useRealData ? 'Přepnout na ukázková data' : 'Přepnout na vaše data'}
                  >
                    {useRealData ? <ToggleRight className="w-4 h-4 text-green-600" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />}
                    <span className="text-xs text-gray-600">{useRealData ? 'Vaše data' : 'Ukázka'}</span>
                  </button>
                )}
                {onAddStep && (
                  <button
                    onClick={onAddStep}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Přidat krok
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Footprints className="w-5 h-5 text-orange-600" />
                  Co jsou kroky?
                </h3>
                <p className="text-gray-700 mb-3">
                  Kroky jsou konkrétní, akční úkoly, které vás vedou k dosažení vašich cílů. Můžete je 
                  plánovat na konkrétní dny, přiřazovat k cílům a sledovat jejich dokončení.
                </p>
              </div>

              {/* Visual demonstration - Steps Management View */}
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Ukázka správy kroků</h3>
                  <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">Pouze pro zobrazení</span>
                </div>
                <div className="bg-white rounded-lg shadow-sm overflow-hidden relative" style={{ maxHeight: '600px', pointerEvents: 'none' }}>
                  <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
                    <StepsManagementView
                      dailySteps={steps}
                      goals={goals}
                      onDailyStepsUpdate={() => {}}
                      userId={null}
                      player={null}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h3 className="font-semibold text-gray-900 mb-3">Jak vytvořit krok?</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-3">
                  <li>Přejděte do hlavního panelu a vyberte sekci "Kroky" v levém sidebaru</li>
                  <li>Klikněte na tlačítko "Přidat krok" výše</li>
                  <li>Vyplňte název kroku (např. "Přečíst kapitolu 1 z knihy")</li>
                  <li>Přidejte popis, pokud chcete</li>
                  <li>Vyberte datum, kdy chcete krok dokončit</li>
                  <li>Přiřaďte krok k cíli (volitelné)</li>
                  <li>Nastavte prioritu (důležité/urgentní)</li>
                  <li>Uložte krok</li>
                </ol>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <h3 className="font-semibold text-green-900 mb-2">Tip</h3>
                <p className="text-green-800 text-sm">
                  Rozdělte velké úkoly na menší kroky. To vám pomůže udržet motivaci a lépe sledovat pokrok.
                </p>
              </div>
            </div>
          </div>
        )

      case 'habits':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Návyky</h2>
                <p className="text-gray-600">
                  Návyky jsou opakující se aktivity, které chcete dělat pravidelně. Můžete je nastavit 
                  jako denní, týdenní nebo měsíční a sledovat jejich plnění.
                </p>
              </div>
              <div className="flex items-center gap-3">
                {hasRealData && (
                  <button
                    onClick={() => setUseRealData(!useRealData)}
                    className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title={useRealData ? 'Přepnout na ukázková data' : 'Přepnout na vaše data'}
                  >
                    {useRealData ? <ToggleRight className="w-4 h-4 text-green-600" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />}
                    <span className="text-xs text-gray-600">{useRealData ? 'Vaše data' : 'Ukázka'}</span>
                  </button>
                )}
                {onAddHabit && (
                  <button
                    onClick={onAddHabit}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Přidat návyk
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-orange-600" />
                  Co jsou návyky?
                </h3>
                <p className="text-gray-700 mb-3">
                  Návyky jsou opakující se aktivity, které chcete dělat pravidelně. Můžete je nastavit 
                  jako denní, týdenní, měsíční nebo vlastní frekvenci. Aplikace vám pomůže sledovat, 
                  jak často je plníte.
                </p>
              </div>

              {/* Visual demonstration - Habits Management View */}
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Ukázka správy návyků</h3>
                  <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">Pouze pro zobrazení</span>
                </div>
                <div className="bg-white rounded-lg shadow-sm overflow-hidden relative" style={{ maxHeight: '600px', pointerEvents: 'none' }}>
                  <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
                    <HabitsManagementView
                      habits={habits}
                      aspirations={aspirations}
                      onHabitsUpdate={() => {}}
                      handleHabitToggle={async () => {}}
                      loadingHabits={new Set()}
                      setOverviewBalances={() => {}}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h3 className="font-semibold text-gray-900 mb-3">Jak vytvořit návyk?</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-3">
                  <li>Přejděte do hlavního panelu a vyberte sekci "Návyky" v levém sidebaru</li>
                  <li>Klikněte na tlačítko "Přidat návyk" výše</li>
                  <li>Vyplňte název návyku (např. "Cvičení ráno")</li>
                  <li>Vyberte frekvenci (denní, týdenní, měsíční nebo vlastní)</li>
                  <li>Pro vlastní frekvenci vyberte dny v týdnu</li>
                  <li>Nastavte připomínku (volitelné)</li>
                  <li>Přiřaďte k aspiraci (volitelné)</li>
                  <li>Uložte návyk</li>
                </ol>
                {onNavigateToHabits && (
                  <button
                    onClick={onNavigateToHabits}
                    className="mt-3 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                  >
                    Přejít do Návyků <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
                <h3 className="font-semibold text-purple-900 mb-2">Tip</h3>
                <p className="text-purple-800 text-sm">
                  Začněte s malými návyky, které můžete snadno plnit. Postupně můžete přidávat další 
                  a zvyšovat jejich obtížnost.
                </p>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="w-full h-full flex bg-white">
      {/* Left sidebar - Categories - Hidden on mobile */}
      <div className="hidden md:flex w-64 border-r border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="p-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Kategorie</h2>
          <nav className="space-y-1">
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                    selectedCategory === category.id
                      ? 'bg-orange-600 text-white'
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
        <div className="md:hidden sticky top-0 z-10 bg-white border-b border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Kategorie</h2>
            <div className="relative">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
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
                  <div className="fixed right-4 top-16 bg-white border border-gray-200 rounded-lg shadow-lg z-[101] min-w-[200px]">
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
                            className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                              selectedCategory === category.id
                                ? 'bg-orange-600 text-white'
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
        
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
