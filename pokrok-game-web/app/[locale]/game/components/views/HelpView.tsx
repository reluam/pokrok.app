'use client'

import { useState } from 'react'
import { HelpCircle, Target, Footprints, CheckSquare, Plus, ArrowRight, Menu, Rocket, Calendar, Eye, Sparkles, TrendingUp, Clock, Star, Zap, BookOpen, AlertTriangle, ChevronRight } from 'lucide-react'

interface HelpViewProps {
  onAddGoal?: () => void
  onAddStep?: () => void
  onAddHabit?: () => void
  onNavigateToGoals?: () => void
  onNavigateToHabits?: () => void
  onNavigateToSteps?: () => void
  onNavigateToManagement?: () => void
  realGoals?: any[]
  realHabits?: any[]
  realSteps?: any[]
}

type HelpCategory = 'getting-started' | 'overview' | 'goals' | 'steps' | 'habits'

// Compact Step Component
function Step({ number, text }: { number: number; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{number}</span>
      <span className="text-sm text-gray-700">{text}</span>
    </div>
  )
}

// Compact Tip Component
function Tip({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2 text-sm text-gray-600">
      <span className="text-orange-500 mt-0.5">•</span>
      <span>{text}</span>
    </li>
  )
}

// Annotation component for table explanations
function Annotation({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="relative group">
      {children}
      <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold cursor-help">
        ?
      </div>
      <div className="absolute left-0 top-full mt-1 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap pointer-events-none">
        {label}
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
}: HelpViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<HelpCategory>('getting-started')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const categories = [
    { id: 'getting-started' as HelpCategory, label: 'První kroky', icon: Rocket },
    { id: 'overview' as HelpCategory, label: 'Jak používat', icon: HelpCircle },
    { id: 'goals' as HelpCategory, label: 'Cíle', icon: Target },
    { id: 'steps' as HelpCategory, label: 'Kroky', icon: Footprints },
    { id: 'habits' as HelpCategory, label: 'Návyky', icon: CheckSquare },
  ]

  const renderContent = () => {
    switch (selectedCategory) {
      case 'getting-started':
        return (
          <div className="space-y-6">
            {/* Hero */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-3 mb-3">
                <Rocket className="w-8 h-8" />
                <h2 className="text-2xl font-bold">Vítejte v Pokroku!</h2>
              </div>
              <p className="text-orange-100">
                Získejte <strong className="text-white">nadhled</strong>, <strong className="text-white">jasnost</strong> a dosahujte <strong className="text-white">cílů</strong>.
              </p>
            </div>

            {/* 3 Benefits */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-orange-50 rounded-xl p-3 text-center border border-orange-100">
                <Eye className="w-6 h-6 text-orange-500 mx-auto mb-1" />
                <p className="text-xs font-medium text-gray-700">Nadhled</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-3 text-center border border-orange-100">
                <Sparkles className="w-6 h-6 text-orange-500 mx-auto mb-1" />
                <p className="text-xs font-medium text-gray-700">Jasnost</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-3 text-center border border-orange-100">
                <Target className="w-6 h-6 text-orange-500 mx-auto mb-1" />
                <p className="text-xs font-medium text-gray-700">Cíle</p>
              </div>
            </div>

            {/* 3 Steps */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Footprints className="w-5 h-5 text-orange-500" />
                3 kroky k úspěchu
              </h3>

              {/* Step 1 */}
              <div className="bg-white rounded-xl border border-orange-200 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">1</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 flex items-center gap-1">
                      <Target className="w-4 h-4 text-orange-500" /> Vytvořte cíl
                    </h4>
                    <p className="text-xs text-gray-500">Co chcete dosáhnout?</p>
                  </div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium text-gray-800">Naučit se React</span>
                    <span className="text-xs bg-orange-200 text-orange-700 px-2 py-0.5 rounded-full ml-auto">Ve fokusu</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {onAddGoal && (
                    <button onClick={onAddGoal} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600">
                      <Plus className="w-4 h-4" /> Vytvořit cíl
                    </button>
                  )}
                  {onNavigateToGoals && (
                    <button onClick={onNavigateToGoals} className="px-3 py-2 border border-orange-200 text-orange-600 text-sm rounded-lg hover:bg-orange-50">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-xl border border-orange-200 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">2</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 flex items-center gap-1">
                      <Footprints className="w-4 h-4 text-orange-500" /> Přidejte kroky
                    </h4>
                    <p className="text-xs text-gray-500">Konkrétní akce k cíli</p>
                  </div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckSquare className="w-4 h-4 text-orange-400" />
                    <span className="text-gray-700">Nainstalovat Node.js</span>
                    <span className="text-xs text-gray-400 ml-auto">Dnes</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckSquare className="w-4 h-4 text-orange-400" />
                    <span className="text-gray-700">Projít tutorial</span>
                    <span className="text-xs text-gray-400 ml-auto">Zítra</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {onAddStep && (
                    <button onClick={onAddStep} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600">
                      <Plus className="w-4 h-4" /> Vytvořit krok
                    </button>
                  )}
                  {onNavigateToSteps && (
                    <button onClick={onNavigateToSteps} className="px-3 py-2 border border-orange-200 text-orange-600 text-sm rounded-lg hover:bg-orange-50">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white rounded-xl border border-orange-200 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">3</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 flex items-center gap-1">
                      <CheckSquare className="w-4 h-4 text-orange-500" /> Budujte návyky
                    </h4>
                    <p className="text-xs text-gray-500">Opakující se aktivity</p>
                  </div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4 text-orange-500" />
                    <span className="text-gray-700">Ranní cvičení</span>
                    <span className="text-xs text-gray-400 ml-auto">Každý den</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="w-4 h-4 text-orange-500" />
                    <span className="text-gray-700">Čtení</span>
                    <span className="text-xs text-gray-400 ml-auto">Po-Pá</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {onAddHabit && (
                    <button onClick={onAddHabit} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600">
                      <Plus className="w-4 h-4" /> Vytvořit návyk
                    </button>
                  )}
                  {onNavigateToHabits && (
                    <button onClick={onNavigateToHabits} className="px-3 py-2 border border-orange-200 text-orange-600 text-sm rounded-lg hover:bg-orange-50">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* What's Next */}
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-orange-500" /> Co dál?
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-400" />
                  <span>Denní přehled</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-orange-400" />
                  <span>Plňte kroky</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-orange-400" />
                  <span>Fokus na důležité</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-orange-400" />
                  <span>Sledujte pokrok</span>
                </div>
              </div>
            </div>
          </div>
        )

      case 'overview':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
              <h2 className="text-2xl font-bold mb-2">Jak aplikaci používat?</h2>
              <p className="text-orange-100">Praktické příklady použití aplikace Pokrok.</p>
            </div>

            {/* Use Cases */}
            <div className="space-y-4">
              {/* UC1 */}
              <div className="bg-white rounded-xl border border-orange-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-2">📋 Nový cíl</h4>
                <p className="text-sm text-gray-600 mb-3">Chcete dosáhnout něčeho důležitého.</p>
                <div className="space-y-1.5">
                  <Step number={1} text="Definujte cíl (např. 'Naučit se React')" />
                  <Step number={2} text="Rozdělte na konkrétní kroky" />
                  <Step number={3} text="Označte jako 've fokusu'" />
                  <Step number={4} text="Plňte kroky každý den" />
                </div>
                <p className="text-xs text-orange-600 mt-3 bg-orange-50 p-2 rounded">💡 Výsledek: Jasný plán a viditelný pokrok</p>
              </div>

              {/* UC2 */}
              <div className="bg-white rounded-xl border border-orange-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-2">🔄 Budování návyků</h4>
                <p className="text-sm text-gray-600 mb-3">Pozitivní návyky pro dlouhodobý úspěch.</p>
                <div className="space-y-1.5">
                  <Step number={1} text="Vytvořte návyk (např. 'Cvičit 3x týdně')" />
                  <Step number={2} text="Nastavte konkrétní dny" />
                  <Step number={3} text="Označujte jako splněné" />
                  <Step number={4} text="Sledujte konzistenci" />
                </div>
                <p className="text-xs text-orange-600 mt-3 bg-orange-50 p-2 rounded">💡 Výsledek: Malé akce = velké změny</p>
              </div>

              {/* UC3 */}
              <div className="bg-white rounded-xl border border-orange-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-2">🎯 Prioritizace</h4>
                <p className="text-sm text-gray-600 mb-3">Máte mnoho úkolů, ale nevíte, na co se zaměřit.</p>
                <div className="space-y-1.5">
                  <Step number={1} text="Vytvořte všechny cíle" />
                  <Step number={2} text="Označte 2-3 nejdůležitější 've fokusu'" />
                  <Step number={3} text="Zaměřte se na fokus v denním přehledu" />
                  <Step number={4} text="Pravidelně revidujte priority" />
                </div>
                <p className="text-xs text-orange-600 mt-3 bg-orange-50 p-2 rounded">💡 Výsledek: Jasnost - víte, co dělat dnes</p>
              </div>
            </div>

            {/* Quick Start */}
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
              <h4 className="font-semibold text-gray-900 mb-3">🚀 Rychlý start</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white rounded-lg p-3 border border-orange-100">
                  <span className="font-medium text-orange-600">Den 1:</span>
                  <p className="text-gray-600">Vytvořte 1-2 cíle</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-orange-100">
                  <span className="font-medium text-orange-600">Den 2-3:</span>
                  <p className="text-gray-600">Přidejte kroky</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-orange-100">
                  <span className="font-medium text-orange-600">Den 4-5:</span>
                  <p className="text-gray-600">Naplánujte dny</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-orange-100">
                  <span className="font-medium text-orange-600">Týden 2+:</span>
                  <p className="text-gray-600">Přidejte návyky</p>
                </div>
              </div>
            </div>
          </div>
        )

      case 'goals':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Target className="w-7 h-7" /> Cíle
                </h2>
                <p className="text-orange-100 text-sm mt-1">Dlouhodobé výsledky, které chcete dosáhnout.</p>
              </div>
              {onAddGoal && (
                <button onClick={onAddGoal} className="flex items-center gap-1 px-4 py-2 bg-white text-orange-600 font-medium rounded-lg hover:bg-orange-50">
                  <Plus className="w-4 h-4" /> Přidat
                </button>
              )}
            </div>

            {/* What are goals */}
            <div className="bg-white rounded-xl border border-orange-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Co jsou cíle?</h4>
              <p className="text-sm text-gray-600 mb-3">
                Cíle jsou vaše dlouhodobé výsledky a sny. Mohou být krátkodobé (týden) i dlouhodobé (rok).
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1">
                  <Target className="w-3 h-3" /> Měřitelné
                </span>
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> S termínem
                </span>
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3" /> Ve fokusu
                </span>
              </div>
            </div>

            {/* Example Goal Card */}
            <div className="bg-white rounded-xl border border-orange-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-orange-500" /> Ukázka cíle
              </h4>
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Target className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="font-semibold text-gray-900">Naučit se React</h5>
                      <span className="text-xs bg-orange-200 text-orange-700 px-2 py-0.5 rounded-full">Ve fokusu</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Aktivní</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Chci vytvořit vlastní webovou aplikaci</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Do 15. března
                      </span>
                      <span className="flex items-center gap-1">
                        <Footprints className="w-3 h-3" /> 3 kroky
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500 space-y-1">
                <p><strong className="text-orange-600">Ve fokusu</strong> = Důležitý cíl, zobrazí se v denním přehledu</p>
                <p><strong className="text-green-600">Aktivní</strong> = Právě na něm pracujete (lze změnit na Odložený)</p>
                <p><strong className="text-gray-600">Termín</strong> = Volitelný, pomáhá s motivací</p>
              </div>
            </div>

            {/* Goals Table Example */}
            <div className="bg-white rounded-xl border border-orange-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-orange-500" /> Ukázka tabulky cílů
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-orange-100">
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Název</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Stav</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Termín</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Fokus</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-orange-50 hover:bg-orange-50 cursor-pointer">
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-orange-500" />
                          <span className="font-medium text-gray-800">Naučit se React</span>
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Aktivní</span>
                      </td>
                      <td className="py-2 px-2 text-gray-500">15.3.2025</td>
                      <td className="py-2 px-2">
                        <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
                      </td>
                    </tr>
                    <tr className="border-b border-orange-50 hover:bg-orange-50 cursor-pointer">
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-orange-500" />
                          <span className="font-medium text-gray-800">Pravidelně cvičit</span>
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Aktivní</span>
                      </td>
                      <td className="py-2 px-2 text-gray-400">—</td>
                      <td className="py-2 px-2">
                        <Star className="w-4 h-4 text-gray-300" />
                      </td>
                    </tr>
                    <tr className="hover:bg-orange-50 cursor-pointer opacity-60">
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-500">Přečíst 12 knih</span>
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Odložený</span>
                      </td>
                      <td className="py-2 px-2 text-gray-400">31.12.2025</td>
                      <td className="py-2 px-2">
                        <Star className="w-4 h-4 text-gray-300" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-3 text-xs text-gray-500 space-y-1">
                <p>📌 <strong>Kliknutím na řádek</strong> otevřete detail cíle</p>
                <p>⭐ <strong>Hvězdička</strong> = Ve fokusu (kliknutím přepnete)</p>
                <p>🔄 <strong>Stav</strong> = Aktivní / Odložený / Dokončený</p>
              </div>
            </div>

            {/* How to create */}
            <div className="bg-white rounded-xl border border-orange-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Jak vytvořit cíl?</h4>
              <div className="space-y-2">
                <Step number={1} text="Přejděte do sekce Cíle" />
                <Step number={2} text="Klikněte na 'Přidat cíl'" />
                <Step number={3} text="Vyplňte název a popis" />
                <Step number={4} text="Nastavte termín (volitelné)" />
                <Step number={5} text="Zaškrtněte 'Ve fokusu' pro důležité cíle" />
              </div>
              <div className="mt-4 flex gap-2">
                {onAddGoal && (
                  <button onClick={onAddGoal} className="flex items-center gap-1 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600">
                    <Plus className="w-4 h-4" /> Vytvořit cíl
                  </button>
                )}
                {onNavigateToGoals && (
                  <button onClick={onNavigateToGoals} className="flex items-center gap-1 px-4 py-2 border border-orange-200 text-orange-600 text-sm rounded-lg hover:bg-orange-50">
                    <ArrowRight className="w-4 h-4" /> Přejít do Cílů
                  </button>
                )}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-500" /> Tipy
              </h4>
              <ul className="space-y-1.5">
                <Tip text="Označte 2-3 nejdůležitější cíle jako 've fokusu'" />
                <Tip text="Velké cíle rozdělte na menší kroky" />
                <Tip text="Kliknutím na řádek otevřete editaci" />
                <Tip text="Přepínejte mezi 'Aktivní' a 'Odložené'" />
              </ul>
            </div>
          </div>
        )

      case 'steps':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Footprints className="w-7 h-7" /> Kroky
                </h2>
                <p className="text-orange-100 text-sm mt-1">Konkrétní akce vedoucí k vašim cílům.</p>
              </div>
              {onAddStep && (
                <button onClick={onAddStep} className="flex items-center gap-1 px-4 py-2 bg-white text-orange-600 font-medium rounded-lg hover:bg-orange-50">
                  <Plus className="w-4 h-4" /> Přidat
                </button>
              )}
            </div>

            {/* What are steps */}
            <div className="bg-white rounded-xl border border-orange-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Co jsou kroky?</h4>
              <p className="text-sm text-gray-600 mb-3">
                Kroky jsou konkrétní úkoly naplánované na konkrétní dny. Můžete je přiřadit k cílům.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Naplánované
                </span>
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1">
                  <Target className="w-3 h-3" /> K cíli
                </span>
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Odhad času
                </span>
              </div>
            </div>

            {/* Example Step Card */}
            <div className="bg-white rounded-xl border border-orange-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-orange-500" /> Ukázka kroku
              </h4>
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 border-2 border-orange-400 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckSquare className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="font-semibold text-gray-900">Nainstalovat Node.js a npm</h5>
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Důležité
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Stáhnout a nainstalovat z oficiálních stránek</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Dnes
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 30 min
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" /> Naučit se React
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500 space-y-1">
                <p><strong className="text-red-600">Důležité</strong> = Prioritní krok (lze kombinovat s Urgentní)</p>
                <p><strong className="text-orange-600">Odhad času</strong> = Pomáhá s plánováním dne</p>
                <p><strong className="text-gray-600">Cíl</strong> = Ke kterému cíli krok patří</p>
              </div>
            </div>

            {/* Steps Table Example */}
            <div className="bg-white rounded-xl border border-orange-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-orange-500" /> Ukázka tabulky kroků
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-orange-100">
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 w-8"></th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Název</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Datum</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Čas</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Cíl</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-orange-50 hover:bg-orange-50 cursor-pointer">
                      <td className="py-2 px-2">
                        <div className="w-5 h-5 border-2 border-orange-400 rounded flex items-center justify-center">
                          <CheckSquare className="w-3 h-3 text-orange-400" />
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">Nainstalovat Node.js</span>
                          <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">!</span>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-gray-500">Dnes</td>
                      <td className="py-2 px-2 text-gray-500">30 min</td>
                      <td className="py-2 px-2 text-xs text-orange-600">React</td>
                    </tr>
                    <tr className="border-b border-orange-50 hover:bg-orange-50 cursor-pointer">
                      <td className="py-2 px-2">
                        <div className="w-5 h-5 border-2 border-orange-400 rounded flex items-center justify-center">
                          <CheckSquare className="w-3 h-3 text-orange-400" />
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <span className="font-medium text-gray-800">Projít React tutorial</span>
                      </td>
                      <td className="py-2 px-2 text-gray-500">Zítra</td>
                      <td className="py-2 px-2 text-gray-500">2 hod</td>
                      <td className="py-2 px-2 text-xs text-orange-600">React</td>
                    </tr>
                    <tr className="hover:bg-orange-50 cursor-pointer opacity-60">
                      <td className="py-2 px-2">
                        <div className="w-5 h-5 bg-orange-500 rounded flex items-center justify-center">
                          <CheckSquare className="w-3 h-3 text-white" />
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <span className="font-medium text-gray-500 line-through">Jít do posilovny</span>
                      </td>
                      <td className="py-2 px-2 text-gray-400">Včera</td>
                      <td className="py-2 px-2 text-gray-400">1 hod</td>
                      <td className="py-2 px-2 text-xs text-gray-400">Cvičení</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-3 text-xs text-gray-500 space-y-1">
                <p>☐ <strong>Checkbox</strong> = Kliknutím označíte jako splněný</p>
                <p>❗ <strong>Vykřičník</strong> = Důležitý nebo urgentní krok</p>
                <p>📌 <strong>Kliknutím na řádek</strong> otevřete detail</p>
              </div>
            </div>

            {/* How to create */}
            <div className="bg-white rounded-xl border border-orange-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Jak vytvořit krok?</h4>
              <div className="space-y-2">
                <Step number={1} text="Přejděte do sekce Kroky" />
                <Step number={2} text="Klikněte na 'Přidat krok'" />
                <Step number={3} text="Vyplňte název" />
                <Step number={4} text="Vyberte datum" />
                <Step number={5} text="Přiřaďte k cíli (volitelné)" />
              </div>
              <div className="mt-4 flex gap-2">
                {onAddStep && (
                  <button onClick={onAddStep} className="flex items-center gap-1 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600">
                    <Plus className="w-4 h-4" /> Vytvořit krok
                  </button>
                )}
                {onNavigateToSteps && (
                  <button onClick={onNavigateToSteps} className="flex items-center gap-1 px-4 py-2 border border-orange-200 text-orange-600 text-sm rounded-lg hover:bg-orange-50">
                    <ArrowRight className="w-4 h-4" /> Přejít do Kroků
                  </button>
                )}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-500" /> Tipy
              </h4>
              <ul className="space-y-1.5">
                <Tip text="Rozdělte velké úkoly na menší kroky" />
                <Tip text="Odhadněte čas pro lepší plánování" />
                <Tip text="Používejte priority (důležité/urgentní)" />
                <Tip text="Nedokončené kroky přesuňte na další den" />
              </ul>
            </div>
          </div>
        )

      case 'habits':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <CheckSquare className="w-7 h-7" /> Návyky
                </h2>
                <p className="text-orange-100 text-sm mt-1">Opakující se aktivity pro dlouhodobý úspěch.</p>
              </div>
              {onAddHabit && (
                <button onClick={onAddHabit} className="flex items-center gap-1 px-4 py-2 bg-white text-orange-600 font-medium rounded-lg hover:bg-orange-50">
                  <Plus className="w-4 h-4" /> Přidat
                </button>
              )}
            </div>

            {/* What are habits */}
            <div className="bg-white rounded-xl border border-orange-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Co jsou návyky?</h4>
              <p className="text-sm text-gray-600 mb-3">
                Návyky jsou opakující se aktivity. Malé každodenní akce vedou k velkým změnám.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Denní
                </span>
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Týdenní
                </span>
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Připomínka
                </span>
              </div>
            </div>

            {/* Example Habit Card */}
            <div className="bg-white rounded-xl border border-orange-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-orange-500" /> Ukázka návyku
              </h4>
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="font-semibold text-gray-900">Ranní cvičení</h5>
                      <span className="text-xs bg-orange-200 text-orange-700 px-2 py-0.5 rounded-full">Denní</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Cvičit každé ráno 20 minut</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 07:00
                      </span>
                    </div>
                    <div className="flex gap-1 mt-2">
                      {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map((day, i) => (
                        <span key={day} className={`w-6 h-6 rounded text-[10px] flex items-center justify-center font-medium ${i < 5 ? 'bg-orange-200 text-orange-700' : 'bg-gray-100 text-gray-400'}`}>
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500 space-y-1">
                <p><strong className="text-orange-600">Denní</strong> = Opakuje se každý den (nebo vybrané dny)</p>
                <p><strong className="text-orange-600">Připomínka</strong> = Volitelná notifikace v daný čas</p>
                <p><strong className="text-gray-600">Dny</strong> = Které dny v týdnu se návyk zobrazí</p>
              </div>
            </div>

            {/* Habits Table Example */}
            <div className="bg-white rounded-xl border border-orange-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-orange-500" /> Ukázka tabulky návyků
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-orange-100">
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Název</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Frekvence</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Připomínka</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Tento týden</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-orange-50 hover:bg-orange-50 cursor-pointer">
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-orange-500" />
                          <span className="font-medium text-gray-800">Ranní cvičení</span>
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">Denní</span>
                      </td>
                      <td className="py-2 px-2 text-gray-500">07:00</td>
                      <td className="py-2 px-2">
                        <div className="flex gap-0.5">
                          {[true, true, true, false, false, false, false].map((done, i) => (
                            <div key={i} className={`w-4 h-4 rounded ${done ? 'bg-orange-500' : 'bg-gray-200'}`} />
                          ))}
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-orange-50 hover:bg-orange-50 cursor-pointer">
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-orange-500" />
                          <span className="font-medium text-gray-800">Čtení před spaním</span>
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">Denní</span>
                      </td>
                      <td className="py-2 px-2 text-gray-500">21:00</td>
                      <td className="py-2 px-2">
                        <div className="flex gap-0.5">
                          {[true, false, true, false, false, false, false].map((done, i) => (
                            <div key={i} className={`w-4 h-4 rounded ${done ? 'bg-orange-500' : 'bg-gray-200'}`} />
                          ))}
                        </div>
                      </td>
                    </tr>
                    <tr className="hover:bg-orange-50 cursor-pointer">
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-orange-500" />
                          <span className="font-medium text-gray-800">Meditace</span>
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">Po-Pá</span>
                      </td>
                      <td className="py-2 px-2 text-gray-400">—</td>
                      <td className="py-2 px-2">
                        <div className="flex gap-0.5">
                          {[true, true, false, false, false, false, false].map((done, i) => (
                            <div key={i} className={`w-4 h-4 rounded ${i < 5 ? (done ? 'bg-orange-500' : 'bg-gray-200') : 'bg-gray-100'}`} />
                          ))}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-3 text-xs text-gray-500 space-y-1">
                <p>🟠 <strong>Oranžové čtverečky</strong> = Splněné dny</p>
                <p>⬜ <strong>Šedé čtverečky</strong> = Nesplněné dny</p>
                <p>📌 <strong>Kliknutím na řádek</strong> otevřete detail</p>
              </div>
            </div>

            {/* How to create */}
            <div className="bg-white rounded-xl border border-orange-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Jak vytvořit návyk?</h4>
              <div className="space-y-2">
                <Step number={1} text="Přejděte do sekce Návyky" />
                <Step number={2} text="Klikněte na 'Přidat návyk'" />
                <Step number={3} text="Vyplňte název" />
                <Step number={4} text="Vyberte frekvenci a dny" />
                <Step number={5} text="Nastavte připomínku (volitelné)" />
              </div>
              <div className="mt-4 flex gap-2">
                {onAddHabit && (
                  <button onClick={onAddHabit} className="flex items-center gap-1 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600">
                    <Plus className="w-4 h-4" /> Vytvořit návyk
                  </button>
                )}
                {onNavigateToHabits && (
                  <button onClick={onNavigateToHabits} className="flex items-center gap-1 px-4 py-2 border border-orange-200 text-orange-600 text-sm rounded-lg hover:bg-orange-50">
                    <ArrowRight className="w-4 h-4" /> Přejít do Návyků
                  </button>
                )}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-500" /> Tipy
              </h4>
              <ul className="space-y-1.5">
                <Tip text="Začněte s malými návyky, které snadno splníte" />
                <Tip text="Lepší malý návyk každý den než velký jednou za týden" />
                <Tip text="Používejte připomínky" />
                <Tip text="Sledujte konzistenci v týdenním přehledu" />
              </ul>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="w-full h-full flex bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:block w-56 border-r border-gray-200 bg-white flex-shrink-0">
        <div className="p-4">
          <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-orange-500" />
            Nápověda
          </h2>
          <nav className="space-y-1">
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-left text-sm ${
                    selectedCategory === category.id
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{category.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Mobile menu */}
        <div className="md:hidden sticky top-0 z-10 bg-white border-b border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-orange-500" />
              Nápověda
            </h2>
            <div className="relative">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 border border-gray-200"
              >
                <Menu className="w-4 h-4 text-gray-600" />
              </button>
              {mobileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-[100]" onClick={() => setMobileMenuOpen(false)} />
                  <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-xl shadow-xl z-[101] min-w-[180px] overflow-hidden">
                    <nav className="py-1">
                      {categories.map((category) => {
                        const Icon = category.icon
                        return (
                          <button
                            key={category.id}
                            onClick={() => {
                              setSelectedCategory(category.id)
                              setMobileMenuOpen(false)
                            }}
                            className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left ${
                              selectedCategory === category.id
                                ? 'bg-orange-500 text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
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
        
        <div className="max-w-2xl mx-auto p-4 md:p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
