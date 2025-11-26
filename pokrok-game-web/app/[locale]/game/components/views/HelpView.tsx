'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { HelpCircle, Target, Footprints, CheckSquare, Plus, ArrowRight, Menu, Rocket, Calendar, Eye, Sparkles, TrendingUp, Clock, Star, Zap, BookOpen, AlertTriangle } from 'lucide-react'

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

export function HelpView({
  onAddGoal,
  onAddStep,
  onAddHabit,
  onNavigateToGoals,
  onNavigateToHabits,
  onNavigateToSteps,
}: HelpViewProps) {
  const t = useTranslations('help')
  const [selectedCategory, setSelectedCategory] = useState<HelpCategory>('getting-started')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const categories = [
    { id: 'getting-started' as HelpCategory, label: t('categories.gettingStarted'), icon: Rocket },
    { id: 'overview' as HelpCategory, label: t('categories.overview'), icon: HelpCircle },
    { id: 'goals' as HelpCategory, label: t('categories.goals'), icon: Target },
    { id: 'steps' as HelpCategory, label: t('categories.steps'), icon: Footprints },
    { id: 'habits' as HelpCategory, label: t('categories.habits'), icon: CheckSquare },
  ]

  const days = [
    t('days.mon'), t('days.tue'), t('days.wed'), t('days.thu'), t('days.fri'), t('days.sat'), t('days.sun')
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
                <h2 className="text-2xl font-bold">{t('gettingStarted.welcome')}</h2>
              </div>
              <p className="text-orange-100" dangerouslySetInnerHTML={{ __html: t('gettingStarted.tagline') }} />
            </div>

            {/* 3 Benefits */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-orange-50 rounded-xl p-3 text-center border border-orange-100">
                <Eye className="w-6 h-6 text-orange-500 mx-auto mb-1" />
                <p className="text-xs font-medium text-gray-700">{t('gettingStarted.benefits.overview')}</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-3 text-center border border-orange-100">
                <Sparkles className="w-6 h-6 text-orange-500 mx-auto mb-1" />
                <p className="text-xs font-medium text-gray-700">{t('gettingStarted.benefits.clarity')}</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-3 text-center border border-orange-100">
                <Target className="w-6 h-6 text-orange-500 mx-auto mb-1" />
                <p className="text-xs font-medium text-gray-700">{t('gettingStarted.benefits.goals')}</p>
              </div>
            </div>

            {/* 3 Steps */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Footprints className="w-5 h-5 text-orange-500" />
                {t('gettingStarted.stepsToSuccess')}
              </h3>

              {/* Step 1 */}
              <div className="bg-white rounded-xl border border-orange-200 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">1</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 flex items-center gap-1">
                      <Target className="w-4 h-4 text-orange-500" /> {t('gettingStarted.step1.title')}
                    </h4>
                    <p className="text-xs text-gray-500">{t('gettingStarted.step1.subtitle')}</p>
                  </div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium text-gray-800">{t('gettingStarted.step1.example')}</span>
                    <span className="text-xs bg-orange-200 text-orange-700 px-2 py-0.5 rounded-full ml-auto">{t('gettingStarted.step1.inFocus')}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {onAddGoal && (
                    <button onClick={onAddGoal} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600">
                      <Plus className="w-4 h-4" /> {t('gettingStarted.step1.button')}
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
                      <Footprints className="w-4 h-4 text-orange-500" /> {t('gettingStarted.step2.title')}
                    </h4>
                    <p className="text-xs text-gray-500">{t('gettingStarted.step2.subtitle')}</p>
                  </div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckSquare className="w-4 h-4 text-orange-400" />
                    <span className="text-gray-700">{t('gettingStarted.step2.example1')}</span>
                    <span className="text-xs text-gray-400 ml-auto">{t('gettingStarted.step2.today')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckSquare className="w-4 h-4 text-orange-400" />
                    <span className="text-gray-700">{t('gettingStarted.step2.example2')}</span>
                    <span className="text-xs text-gray-400 ml-auto">{t('gettingStarted.step2.tomorrow')}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {onAddStep && (
                    <button onClick={onAddStep} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600">
                      <Plus className="w-4 h-4" /> {t('gettingStarted.step2.button')}
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
                      <CheckSquare className="w-4 h-4 text-orange-500" /> {t('gettingStarted.step3.title')}
                    </h4>
                    <p className="text-xs text-gray-500">{t('gettingStarted.step3.subtitle')}</p>
                  </div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4 text-orange-500" />
                    <span className="text-gray-700">{t('gettingStarted.step3.example1')}</span>
                    <span className="text-xs text-gray-400 ml-auto">{t('gettingStarted.step3.everyDay')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="w-4 h-4 text-orange-500" />
                    <span className="text-gray-700">{t('gettingStarted.step3.example2')}</span>
                    <span className="text-xs text-gray-400 ml-auto">{t('gettingStarted.step3.monFri')}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {onAddHabit && (
                    <button onClick={onAddHabit} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600">
                      <Plus className="w-4 h-4" /> {t('gettingStarted.step3.button')}
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
                <TrendingUp className="w-5 h-5 text-orange-500" /> {t('gettingStarted.whatsNext')}
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-400" />
                  <span>{t('gettingStarted.nextItems.dailyOverview')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-orange-400" />
                  <span>{t('gettingStarted.nextItems.completeSteps')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-orange-400" />
                  <span>{t('gettingStarted.nextItems.focusImportant')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-orange-400" />
                  <span>{t('gettingStarted.nextItems.trackProgress')}</span>
                </div>
              </div>
            </div>
          </div>
        )

      case 'overview':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
              <h2 className="text-2xl font-bold mb-2">{t('howToUse.title')}</h2>
              <p className="text-orange-100">{t('howToUse.subtitle')}</p>
            </div>

            {/* Use Cases */}
            <div className="space-y-4">
              {/* UC1 */}
              <div className="bg-white rounded-xl border border-orange-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-2">{t('howToUse.useCase1.title')}</h4>
                <p className="text-sm text-gray-600 mb-3">{t('howToUse.useCase1.description')}</p>
                <div className="space-y-1.5">
                  <Step number={1} text={t('howToUse.useCase1.step1')} />
                  <Step number={2} text={t('howToUse.useCase1.step2')} />
                  <Step number={3} text={t('howToUse.useCase1.step3')} />
                  <Step number={4} text={t('howToUse.useCase1.step4')} />
                </div>
                <p className="text-xs text-orange-600 mt-3 bg-orange-50 p-2 rounded">{t('howToUse.useCase1.result')}</p>
              </div>

              {/* UC2 */}
              <div className="bg-white rounded-xl border border-orange-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-2">{t('howToUse.useCase2.title')}</h4>
                <p className="text-sm text-gray-600 mb-3">{t('howToUse.useCase2.description')}</p>
                <div className="space-y-1.5">
                  <Step number={1} text={t('howToUse.useCase2.step1')} />
                  <Step number={2} text={t('howToUse.useCase2.step2')} />
                  <Step number={3} text={t('howToUse.useCase2.step3')} />
                  <Step number={4} text={t('howToUse.useCase2.step4')} />
                </div>
                <p className="text-xs text-orange-600 mt-3 bg-orange-50 p-2 rounded">{t('howToUse.useCase2.result')}</p>
              </div>

              {/* UC3 */}
              <div className="bg-white rounded-xl border border-orange-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-2">{t('howToUse.useCase3.title')}</h4>
                <p className="text-sm text-gray-600 mb-3">{t('howToUse.useCase3.description')}</p>
                <div className="space-y-1.5">
                  <Step number={1} text={t('howToUse.useCase3.step1')} />
                  <Step number={2} text={t('howToUse.useCase3.step2')} />
                  <Step number={3} text={t('howToUse.useCase3.step3')} />
                  <Step number={4} text={t('howToUse.useCase3.step4')} />
                </div>
                <p className="text-xs text-orange-600 mt-3 bg-orange-50 p-2 rounded">{t('howToUse.useCase3.result')}</p>
              </div>
            </div>

            {/* Quick Start */}
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
              <h4 className="font-semibold text-gray-900 mb-3">{t('howToUse.quickStart.title')}</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white rounded-lg p-3 border border-orange-100">
                  <span className="font-medium text-orange-600">{t('howToUse.quickStart.day1')}</span>
                  <p className="text-gray-600">{t('howToUse.quickStart.day1Task')}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-orange-100">
                  <span className="font-medium text-orange-600">{t('howToUse.quickStart.day23')}</span>
                  <p className="text-gray-600">{t('howToUse.quickStart.day23Task')}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-orange-100">
                  <span className="font-medium text-orange-600">{t('howToUse.quickStart.day45')}</span>
                  <p className="text-gray-600">{t('howToUse.quickStart.day45Task')}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-orange-100">
                  <span className="font-medium text-orange-600">{t('howToUse.quickStart.week2')}</span>
                  <p className="text-gray-600">{t('howToUse.quickStart.week2Task')}</p>
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
                  <Target className="w-7 h-7" /> {t('goalsHelp.title')}
                </h2>
                <p className="text-orange-100 text-sm mt-1">{t('goalsHelp.subtitle')}</p>
              </div>
                {onAddGoal && (
                <button onClick={onAddGoal} className="flex items-center gap-1 px-4 py-2 bg-white text-orange-600 font-medium rounded-lg hover:bg-orange-50">
                  <Plus className="w-4 h-4" /> {t('goalsHelp.add')}
                  </button>
                )}
            </div>

            {/* What are goals */}
            <div className="bg-white rounded-xl border border-orange-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-2">{t('goalsHelp.whatAreGoals')}</h4>
              <p className="text-sm text-gray-600 mb-3">{t('goalsHelp.whatAreGoalsDesc')}</p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1">
                  <Target className="w-3 h-3" /> {t('goalsHelp.measurable')}
                </span>
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {t('goalsHelp.withDeadline')}
                </span>
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3" /> {t('goalsHelp.inFocus')}
                </span>
              </div>
            </div>

            {/* Example Goal Card */}
            <div className="bg-white rounded-xl border border-orange-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-orange-500" /> {t('goalsHelp.exampleTitle')}
              </h4>
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="font-semibold text-gray-900">{t('goalsHelp.exampleName')}</h5>
                      <span className="text-xs bg-orange-200 text-orange-700 px-2 py-0.5 rounded-full">{t('goalsHelp.inFocus')}</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{t('goalsHelp.active')}</span>
              </div>
                    <p className="text-sm text-gray-500 mt-1">{t('goalsHelp.exampleDesc')}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {t('goalsHelp.exampleDeadline')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Footprints className="w-3 h-3" /> {t('goalsHelp.exampleSteps')}
                      </span>
                </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500 space-y-1">
                <p><strong className="text-orange-600">{t('goalsHelp.inFocus')}</strong> = {t('goalsHelp.focusExplanation').split(' = ')[1]}</p>
                <p><strong className="text-green-600">{t('goalsHelp.active')}</strong> = {t('goalsHelp.activeExplanation').split(' = ')[1]}</p>
                <p><strong className="text-gray-600">{t('goalsHelp.tableDeadline')}</strong> = {t('goalsHelp.deadlineExplanation').split(' = ')[1]}</p>
              </div>
            </div>

            {/* Goals Table Example */}
            <div className="bg-white rounded-xl border border-orange-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-orange-500" /> {t('goalsHelp.tableTitle')}
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-orange-100">
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">{t('goalsHelp.tableName')}</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">{t('goalsHelp.tableStatus')}</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">{t('goalsHelp.tableDeadline')}</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">{t('goalsHelp.tableFocus')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-orange-50 hover:bg-orange-50 cursor-pointer">
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-orange-500" />
                          <span className="font-medium text-gray-800">{t('goalsHelp.tableExample1')}</span>
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{t('goalsHelp.active')}</span>
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
                          <span className="font-medium text-gray-800">{t('goalsHelp.tableExample2')}</span>
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{t('goalsHelp.active')}</span>
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
                          <span className="font-medium text-gray-500">{t('goalsHelp.tableExample3')}</span>
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t('goalsHelp.postponed')}</span>
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
                <p>{t('goalsHelp.tableClickHint')}</p>
                <p>{t('goalsHelp.tableStarHint')}</p>
                <p>{t('goalsHelp.tableStatusHint')}</p>
                </div>
              </div>

            {/* How to create */}
            <div className="bg-white rounded-xl border border-orange-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-3">{t('goalsHelp.howToCreate')}</h4>
              <div className="space-y-2">
                <Step number={1} text={t('goalsHelp.howToStep1')} />
                <Step number={2} text={t('goalsHelp.howToStep2')} />
                <Step number={3} text={t('goalsHelp.howToStep3')} />
                <Step number={4} text={t('goalsHelp.howToStep4')} />
                <Step number={5} text={t('goalsHelp.howToStep5')} />
              </div>
              <div className="mt-4 flex gap-2">
                {onAddGoal && (
                  <button onClick={onAddGoal} className="flex items-center gap-1 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600">
                    <Plus className="w-4 h-4" /> {t('goalsHelp.createGoal')}
                  </button>
                )}
                {onNavigateToGoals && (
                  <button onClick={onNavigateToGoals} className="flex items-center gap-1 px-4 py-2 border border-orange-200 text-orange-600 text-sm rounded-lg hover:bg-orange-50">
                    <ArrowRight className="w-4 h-4" /> {t('goalsHelp.goToGoals')}
                  </button>
                )}
              </div>
              </div>

            {/* Tips */}
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-500" /> {t('goalsHelp.tips')}
              </h4>
              <ul className="space-y-1.5">
                <Tip text={t('goalsHelp.tip1')} />
                <Tip text={t('goalsHelp.tip2')} />
                <Tip text={t('goalsHelp.tip3')} />
                <Tip text={t('goalsHelp.tip4')} />
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
                  <Footprints className="w-7 h-7" /> {t('stepsHelp.title')}
                </h2>
                <p className="text-orange-100 text-sm mt-1">{t('stepsHelp.subtitle')}</p>
              </div>
                {onAddStep && (
                <button onClick={onAddStep} className="flex items-center gap-1 px-4 py-2 bg-white text-orange-600 font-medium rounded-lg hover:bg-orange-50">
                  <Plus className="w-4 h-4" /> {t('stepsHelp.add')}
                  </button>
                )}
            </div>

            {/* What are steps */}
            <div className="bg-white rounded-xl border border-orange-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-2">{t('stepsHelp.whatAreSteps')}</h4>
              <p className="text-sm text-gray-600 mb-3">{t('stepsHelp.whatAreStepsDesc')}</p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {t('stepsHelp.scheduled')}
                </span>
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1">
                  <Target className="w-3 h-3" /> {t('stepsHelp.toGoal')}
                </span>
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {t('stepsHelp.timeEstimate')}
                </span>
              </div>
            </div>

            {/* Example Step Card */}
            <div className="bg-white rounded-xl border border-orange-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-orange-500" /> {t('stepsHelp.exampleTitle')}
              </h4>
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 border-2 border-orange-400 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckSquare className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="font-semibold text-gray-900">{t('stepsHelp.exampleName')}</h5>
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {t('stepsHelp.important')}
                      </span>
              </div>
                    <p className="text-sm text-gray-500 mt-1">{t('stepsHelp.exampleDesc')}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {t('stepsHelp.today')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 30 min
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" /> {t('goalsHelp.tableExample1')}
                      </span>
                </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500 space-y-1">
                <p><strong className="text-red-600">{t('stepsHelp.important')}</strong> = {t('stepsHelp.importantExplanation').split(' = ')[1]}</p>
                <p><strong className="text-orange-600">{t('stepsHelp.timeEstimate')}</strong> = {t('stepsHelp.timeExplanation').split(' = ')[1]}</p>
                <p><strong className="text-gray-600">{t('stepsHelp.tableGoal')}</strong> = {t('stepsHelp.goalExplanation').split(' = ')[1]}</p>
                </div>
              </div>

            {/* Steps Table Example */}
            <div className="bg-white rounded-xl border border-orange-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-orange-500" /> {t('stepsHelp.tableTitle')}
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-orange-100">
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 w-8"></th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">{t('stepsHelp.tableName')}</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">{t('stepsHelp.tableDate')}</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">{t('stepsHelp.tableTime')}</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">{t('stepsHelp.tableGoal')}</th>
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
                          <span className="font-medium text-gray-800">{t('stepsHelp.tableExample1')}</span>
                          <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">!</span>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-gray-500">{t('stepsHelp.today')}</td>
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
                        <span className="font-medium text-gray-800">{t('stepsHelp.tableExample2')}</span>
                      </td>
                      <td className="py-2 px-2 text-gray-500">{t('stepsHelp.tomorrow')}</td>
                      <td className="py-2 px-2 text-gray-500">2 h</td>
                      <td className="py-2 px-2 text-xs text-orange-600">React</td>
                    </tr>
                    <tr className="hover:bg-orange-50 cursor-pointer opacity-60">
                      <td className="py-2 px-2">
                        <div className="w-5 h-5 bg-orange-500 rounded flex items-center justify-center">
                          <CheckSquare className="w-3 h-3 text-white" />
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <span className="font-medium text-gray-500 line-through">{t('stepsHelp.tableExample3')}</span>
                      </td>
                      <td className="py-2 px-2 text-gray-400">{t('stepsHelp.yesterday')}</td>
                      <td className="py-2 px-2 text-gray-400">1 h</td>
                      <td className="py-2 px-2 text-xs text-gray-400">Exercise</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-3 text-xs text-gray-500 space-y-1">
                <p>{t('stepsHelp.tableCheckboxHint')}</p>
                <p>{t('stepsHelp.tableImportantHint')}</p>
                <p>{t('stepsHelp.tableClickHint')}</p>
              </div>
              </div>

            {/* How to create */}
            <div className="bg-white rounded-xl border border-orange-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-3">{t('stepsHelp.howToCreate')}</h4>
              <div className="space-y-2">
                <Step number={1} text={t('stepsHelp.howToStep1')} />
                <Step number={2} text={t('stepsHelp.howToStep2')} />
                <Step number={3} text={t('stepsHelp.howToStep3')} />
                <Step number={4} text={t('stepsHelp.howToStep4')} />
                <Step number={5} text={t('stepsHelp.howToStep5')} />
              </div>
              <div className="mt-4 flex gap-2">
                {onAddStep && (
                  <button onClick={onAddStep} className="flex items-center gap-1 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600">
                    <Plus className="w-4 h-4" /> {t('stepsHelp.createStep')}
                  </button>
                )}
                {onNavigateToSteps && (
                  <button onClick={onNavigateToSteps} className="flex items-center gap-1 px-4 py-2 border border-orange-200 text-orange-600 text-sm rounded-lg hover:bg-orange-50">
                    <ArrowRight className="w-4 h-4" /> {t('stepsHelp.goToSteps')}
                  </button>
                )}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-500" /> {t('stepsHelp.tips')}
              </h4>
              <ul className="space-y-1.5">
                <Tip text={t('stepsHelp.tip1')} />
                <Tip text={t('stepsHelp.tip2')} />
                <Tip text={t('stepsHelp.tip3')} />
                <Tip text={t('stepsHelp.tip4')} />
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
                  <CheckSquare className="w-7 h-7" /> {t('habitsHelp.title')}
                </h2>
                <p className="text-orange-100 text-sm mt-1">{t('habitsHelp.subtitle')}</p>
              </div>
                {onAddHabit && (
                <button onClick={onAddHabit} className="flex items-center gap-1 px-4 py-2 bg-white text-orange-600 font-medium rounded-lg hover:bg-orange-50">
                  <Plus className="w-4 h-4" /> {t('habitsHelp.add')}
                  </button>
                )}
            </div>

            {/* What are habits */}
            <div className="bg-white rounded-xl border border-orange-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-2">{t('habitsHelp.whatAreHabits')}</h4>
              <p className="text-sm text-gray-600 mb-3">{t('habitsHelp.whatAreHabitsDesc')}</p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {t('habitsHelp.daily')}
                </span>
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {t('habitsHelp.weekly')}
                </span>
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {t('habitsHelp.reminder')}
                </span>
              </div>
            </div>

            {/* Example Habit Card */}
            <div className="bg-white rounded-xl border border-orange-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-orange-500" /> {t('habitsHelp.exampleTitle')}
              </h4>
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="font-semibold text-gray-900">{t('habitsHelp.exampleName')}</h5>
                      <span className="text-xs bg-orange-200 text-orange-700 px-2 py-0.5 rounded-full">{t('habitsHelp.daily')}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{t('habitsHelp.exampleDesc')}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 07:00
                      </span>
              </div>
                    <div className="flex gap-1 mt-2">
                      {days.map((day, i) => (
                        <span key={day} className={`w-6 h-6 rounded text-[10px] flex items-center justify-center font-medium ${i < 5 ? 'bg-orange-200 text-orange-700' : 'bg-gray-100 text-gray-400'}`}>
                          {day}
                        </span>
                      ))}
                </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500 space-y-1">
                <p><strong className="text-orange-600">{t('habitsHelp.daily')}</strong> = {t('habitsHelp.dailyExplanation').split(' = ')[1]}</p>
                <p><strong className="text-orange-600">{t('habitsHelp.reminder')}</strong> = {t('habitsHelp.reminderExplanation').split(' = ')[1]}</p>
                <p><strong className="text-gray-600">{t('days.mon')}-{t('days.sun')}</strong> = {t('habitsHelp.daysExplanation').split(' = ')[1]}</p>
              </div>
            </div>

            {/* Habits Table Example */}
            <div className="bg-white rounded-xl border border-orange-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-orange-500" /> {t('habitsHelp.tableTitle')}
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-orange-100">
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">{t('habitsHelp.tableName')}</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">{t('habitsHelp.tableFrequency')}</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">{t('habitsHelp.tableReminder')}</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">{t('habitsHelp.tableThisWeek')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-orange-50 hover:bg-orange-50 cursor-pointer">
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-orange-500" />
                          <span className="font-medium text-gray-800">{t('habitsHelp.tableExample1')}</span>
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">{t('habitsHelp.daily')}</span>
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
                          <span className="font-medium text-gray-800">{t('habitsHelp.tableExample2')}</span>
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">{t('habitsHelp.daily')}</span>
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
                          <span className="font-medium text-gray-800">{t('habitsHelp.tableExample3')}</span>
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">{t('habitsHelp.monFri')}</span>
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
                <p>{t('habitsHelp.tableOrangeHint')}</p>
                <p>{t('habitsHelp.tableGrayHint')}</p>
                <p>{t('habitsHelp.tableClickHint')}</p>
                </div>
              </div>

            {/* How to create */}
            <div className="bg-white rounded-xl border border-orange-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-3">{t('habitsHelp.howToCreate')}</h4>
              <div className="space-y-2">
                <Step number={1} text={t('habitsHelp.howToStep1')} />
                <Step number={2} text={t('habitsHelp.howToStep2')} />
                <Step number={3} text={t('habitsHelp.howToStep3')} />
                <Step number={4} text={t('habitsHelp.howToStep4')} />
                <Step number={5} text={t('habitsHelp.howToStep5')} />
              </div>
              <div className="mt-4 flex gap-2">
                {onAddHabit && (
                  <button onClick={onAddHabit} className="flex items-center gap-1 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600">
                    <Plus className="w-4 h-4" /> {t('habitsHelp.createHabit')}
                  </button>
                )}
                {onNavigateToHabits && (
                  <button onClick={onNavigateToHabits} className="flex items-center gap-1 px-4 py-2 border border-orange-200 text-orange-600 text-sm rounded-lg hover:bg-orange-50">
                    <ArrowRight className="w-4 h-4" /> {t('habitsHelp.goToHabits')}
                  </button>
                )}
              </div>
              </div>

            {/* Tips */}
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-500" /> {t('habitsHelp.tips')}
              </h4>
              <ul className="space-y-1.5">
                <Tip text={t('habitsHelp.tip1')} />
                <Tip text={t('habitsHelp.tip2')} />
                <Tip text={t('habitsHelp.tip3')} />
                <Tip text={t('habitsHelp.tip4')} />
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
            {t('title')}
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
              {t('title')}
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
