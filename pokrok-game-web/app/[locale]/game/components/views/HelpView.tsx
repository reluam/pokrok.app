'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { HelpCircle, Target, Footprints, CheckSquare, Plus, ArrowRight, Menu, Rocket, Calendar, Eye, Sparkles, TrendingUp, Clock, Star, Zap, BookOpen, AlertTriangle, Settings, Check, ChevronLeft, ChevronRight, X, LayoutDashboard, Heart, ListTodo, Flame, BarChart3, Edit, Trash2, Briefcase, Smartphone, TrendingUp as TrendingUpIcon, CalendarDays, Navigation, Mail } from 'lucide-react'
import { ContactModal } from '../../../main/components/modals/ContactModal'

interface HelpViewProps {
  onAddGoal?: () => void
  onAddStep?: () => void
  onAddHabit?: () => void
  onNavigateToGoals?: () => void
  onNavigateToHabits?: () => void
  onNavigateToSteps?: () => void
  onNavigateToManagement?: () => void
  onOpenAreasManagement?: () => void
  realGoals?: any[]
  realHabits?: any[]
  realSteps?: any[]
}

type HelpCategory = 'overview' | 'navigation' | 'areas' | 'goals' | 'steps' | 'habits'

// Compact Step Component
function Step({ number, text }: { number: number; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 font-playful">{number}</span>
      <span className="text-sm text-black font-playful">{text}</span>
    </div>
  )
}

// Compact Tip Component
function Tip({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2 text-sm text-gray-600 font-playful font-playful">
      <span className="text-primary-600 mt-0.5">•</span>
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
  onNavigateToManagement,
  onOpenAreasManagement,
}: HelpViewProps) {
  const t = useTranslations('help')
  const tCommon = useTranslations()
  const tHomepage = useTranslations('homepage')
  const locale = useLocale()
  const [selectedCategory, setSelectedCategory] = useState<HelpCategory>('overview')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)

  const categories = [
    { id: 'overview' as HelpCategory, label: t('categories.views'), icon: Eye },
    { id: 'navigation' as HelpCategory, label: t('categories.navigation'), icon: Navigation },
    { id: 'areas' as HelpCategory, label: t('categories.areas'), icon: LayoutDashboard },
    { id: 'goals' as HelpCategory, label: t('categories.goals'), icon: Target },
    { id: 'steps' as HelpCategory, label: t('categories.steps'), icon: Footprints },
    { id: 'habits' as HelpCategory, label: t('categories.habits'), icon: CheckSquare },
  ]

  const days = [
    t('days.mon'), t('days.tue'), t('days.wed'), t('days.thu'), t('days.fri'), t('days.sat'), t('days.sun')
  ]

  const renderContent = () => {
    switch (selectedCategory) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="box-playful-highlight-primary p-6">
              <h2 className="text-2xl font-bold text-black font-playful mb-2">{t('viewsHelp.title') || (locale === 'cs' ? 'Zobrazení' : 'Views')}</h2>
              <p className="text-gray-600 font-playful">{t('viewsHelp.subtitle') || (locale === 'cs' ? 'Čtyři hlavní zobrazení pro různé účely' : 'Four main views for different purposes')}</p>
              </div>

            {/* Upcoming View */}
            <div className="box-playful-highlight p-6">
              <h3 className="font-semibold text-black font-playful mb-4 flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-primary-600" />
                {locale === 'cs' ? '1. Upcoming (Nadcházející)' : '1. Upcoming'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {locale === 'cs' 
                  ? 'Zobrazuje všechny nadcházející kroky a návyky. Ideální pro přehled toho, co vás čeká.'
                  : 'Displays all upcoming steps and habits. Ideal for an overview of what\'s ahead.'}
              </p>
              
              {/* View Mode Switcher */}
              <div className="mb-4 p-4 bg-white border-2 border-primary-300 rounded-playful-md">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-black">{locale === 'cs' ? 'Přepínač zobrazení:' : 'View mode:'}</span>
                  <div className="flex items-center gap-2 bg-white border-2 border-primary-300 rounded-playful-md p-1">
                    <button className="px-3 py-1 text-sm font-semibold bg-primary-500 text-white rounded-playful-sm">
                      {locale === 'cs' ? 'Feed' : 'Feed'}
                  </button>
                    <button className="px-3 py-1 text-sm font-semibold text-gray-600 rounded-playful-sm">
                      {locale === 'cs' ? 'Oblasti' : 'Areas'}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-600">
                  {locale === 'cs' 
                    ? 'Feed: kroky seřazené podle data. Oblasti: kroky skupované podle oblastí a cílů.'
                    : 'Feed: steps sorted by date. Areas: steps grouped by areas and goals.'}
                </p>
              </div>

              {/* Feed View Example */}
              <div className="space-y-2 mb-4">
                {/* Today's Habits */}
                <div className="p-3 bg-white rounded-playful-md">
                  <p className="text-xs font-medium text-gray-600 mb-2">{locale === 'cs' ? 'Dnešní návyky' : "Today's habits"}</p>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-2 p-2 bg-white rounded-playful-md hover:outline-2 hover:outline hover:outline-primary-500">
                      <div className="w-5 h-5 rounded-playful-sm border-2 border-primary-500 bg-primary-500 flex items-center justify-center">
                                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                      <span className="text-xs">{locale === 'cs' ? 'Ranní cvičení' : 'Morning exercise'}</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-white rounded-playful-md hover:outline-2 hover:outline hover:outline-primary-500">
                      <div className="w-5 h-5 rounded-playful-sm border-2 border-primary-500"></div>
                      <span className="text-xs">{locale === 'cs' ? 'Čtení' : 'Reading'}</span>
                    </div>
                  </div>
                              </div>
                              
                {/* Steps */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded-playful-md hover:outline-2 hover:outline hover:outline-red-300">
                    <div className="w-6 h-6 rounded-playful-sm border-2 border-primary-500"></div>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-red-600">{locale === 'cs' ? 'Dokončit projekt' : 'Finish project'}</span>
                    </div>
                    <button className="hidden sm:block w-28 text-xs text-center border-2 border-red-300 text-red-600 rounded-playful-sm px-1 py-0.5">
                      ❗{locale === 'cs' ? 'Včera' : 'Yesterday'}
                            </button>
                      </div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-playful-md hover:outline-2 hover:outline hover:outline-primary-500">
                    <div className="w-6 h-6 rounded-playful-sm border-2 border-primary-500 bg-primary-500 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-black">{locale === 'cs' ? 'Napsat email' : 'Write email'}</span>
                  </div>
                    <button className="hidden sm:block w-28 text-xs text-center border-2 border-primary-500 text-primary-600 rounded-playful-sm px-1 py-0.5">
                      {locale === 'cs' ? 'Dnes' : 'Today'}
                  </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Overview View */}
            <div className="box-playful-highlight p-6">
              <h3 className="font-semibold text-black font-playful mb-4 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary-600" />
                {locale === 'cs' ? '2. Overview (Přehled)' : '2. Overview'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {locale === 'cs' 
                  ? 'Měsíční kalendářní přehled všech kroků a návyků. Slouží pro větší přehled a plánování dopředu.'
                  : 'Monthly calendar overview of all steps and habits. Serves for a larger overview and planning ahead.'}
              </p>
              
              {/* Calendar Example */}
              <div className="p-4 bg-white border-2 border-primary-300 rounded-playful-md">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map((day, i) => (
                    <div key={i} className="text-xs text-center text-gray-500 font-semibold py-1">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 28 }).map((_, i) => (
                    <div key={i} className={`aspect-square rounded-playful-sm border-2 flex items-center justify-center text-xs ${
                      i === 14 ? 'bg-primary-100 border-primary-500' : 'bg-white border-gray-200'
                    }`}>
                      {i + 1}
                        </div>
                      ))}
                    </div>
                <p className="text-xs text-gray-600 mt-2">
                  {locale === 'cs' 
                    ? 'Kliknutím na den zobrazíte detailní přehled kroků a návyků pro daný den.'
                    : 'Click on a day to view detailed overview of steps and habits for that day.'}
                </p>
                          </div>
                          </div>

            {/* Statistics View */}
            <div className="box-playful-highlight p-6">
              <h3 className="font-semibold text-black font-playful mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary-600" />
                {locale === 'cs' ? '3. Statistics (Statistiky)' : '3. Statistics'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {locale === 'cs' 
                  ? 'Roční přehled pokroku v jednotlivých cílech. Zobrazuje časovou osu s progress bary pro všechny cíle.'
                  : 'Yearly overview of progress in individual goals. Displays a timeline with progress bars for all goals.'}
              </p>
              
              {/* Statistics Example */}
              <div className="p-4 bg-white border-2 border-primary-300 rounded-playful-md">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-primary-600" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-black">{locale === 'cs' ? 'Naučit se React' : 'Learn React'}</span>
                        <span className="text-xs text-gray-500">40%</span>
                        </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500 rounded-full" style={{ width: '40%' }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-primary-600" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-black">{locale === 'cs' ? 'Pravidelně cvičit' : 'Exercise regularly'}</span>
                        <span className="text-xs text-gray-500">75%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500 rounded-full" style={{ width: '75%' }} />
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-3">
                  {locale === 'cs' 
                    ? 'Zobrazuje pokrok v jednotlivých cílech s vizualizací dokončených kroků.'
                    : 'Shows progress in individual goals with visualization of completed steps.'}
                </p>
                    </div>
              </div>

            {/* Areas View */}
            <div className="box-playful-highlight p-6">
              <h3 className="font-semibold text-black font-playful mb-4 flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-primary-600" />
                {locale === 'cs' ? '4. Areas (Oblasti)' : '4. Areas'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {locale === 'cs' 
                  ? 'Zobrazuje všechny kroky a cíle, které jsou přiřazené k dané oblasti.'
                  : 'Displays all steps and goals that are assigned to a given area.'}
              </p>
              
              {/* Areas Example */}
              <div className="p-4 bg-white border-2 border-primary-300 rounded-playful-md">
                <div className="space-y-3">
                  <div className="p-4 bg-white rounded-playful-md border-2 border-primary-500">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-5 h-5 text-primary-600" />
                      <h5 className="font-semibold text-black">{locale === 'cs' ? 'Kariéra' : 'Career'}</h5>
                </div>
                    <div className="mb-2">
                      <h6 className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                        <Target className="w-3 h-3 text-primary-600" />
                        {locale === 'cs' ? 'Povýšení' : 'Promotion'}
                      </h6>
                      <div className="flex items-center gap-3 p-3 bg-white rounded-playful-md">
                        <div className="w-6 h-6 rounded-playful-sm border-2 border-primary-500"></div>
                        <span className="text-sm font-medium text-black">{locale === 'cs' ? 'Dokončit projekt' : 'Finish project'}</span>
                  </div>
                          </div>
                </div>
              </div>
                <p className="text-xs text-gray-600 mt-3">
                  {locale === 'cs' 
                    ? 'Každá oblast má vlastní sekci s cíli a jejich kroky. Kliknutím na oblast v levém menu zobrazíte její obsah.'
                    : 'Each area has its own section with goals and their steps. Click on an area in the left menu to view its content.'}
                </p>
              </div>
            </div>
          </div>
        )

      case 'navigation':
        return (
          <div className="space-y-6">
            <div className="box-playful-highlight-primary p-6">
              <h2 className="text-2xl font-bold text-black font-playful mb-2">{t('navigationHelp.title') || (locale === 'cs' ? 'Navigace' : 'Navigation')}</h2>
              <p className="text-gray-600 font-playful">{t('navigationHelp.subtitle') || (locale === 'cs' ? 'Jak se orientovat v aplikaci a najít potřebné funkce' : 'How to navigate the app and find the features you need')}</p>
            </div>

            {/* Top Menu */}
            <div className="box-playful-highlight p-6">
              <h3 className="font-semibold text-black font-playful mb-4 flex items-center gap-2">
                <Menu className="w-5 h-5 text-primary-600" />
                {locale === 'cs' ? 'Horní menu' : 'Top Menu'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {locale === 'cs' 
                  ? 'Horní menu poskytuje rychlý přístup k hlavním sekcím aplikace. Vždy je viditelné v horní části obrazovky.'
                  : 'The top menu provides quick access to main app sections. It\'s always visible at the top of the screen.'}
              </p>
              
              {/* Top Menu Items */}
              <div className="space-y-3 mb-4">
                <div className="p-4 bg-white border-2 border-primary-300 rounded-playful-md">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-primary-100 rounded-playful-md flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9,22 9,12 15,12 15,22"/>
                      </svg>
                    </div>
                      <div>
                      <h4 className="font-semibold text-black">{locale === 'cs' ? 'Hlavní panel' : 'Main Panel'}</h4>
                      <p className="text-xs text-gray-600">{locale === 'cs' ? 'Zpět na hlavní přehled s různými zobrazeními' : 'Back to main overview with different views'}</p>
                        </div>
                          </div>
                </div>
                
                <div className="p-4 bg-white border-2 border-primary-300 rounded-playful-md">
                  <div className="flex items-center gap-3 mb-2">
                    <Target className="w-5 h-5 text-primary-600" />
                    <div>
                      <h4 className="font-semibold text-black">{locale === 'cs' ? 'Cíle' : 'Goals'}</h4>
                      <p className="text-xs text-gray-600">{locale === 'cs' ? 'Správa a přehled všech vašich cílů' : 'Manage and overview all your goals'}</p>
                    </div>
                        </div>
                      </div>
                      
                <div className="p-4 bg-white border-2 border-primary-300 rounded-playful-md">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckSquare className="w-5 h-5 text-primary-600" />
                      <div>
                      <h4 className="font-semibold text-black">{locale === 'cs' ? 'Návyky' : 'Habits'}</h4>
                      <p className="text-xs text-gray-600">{locale === 'cs' ? 'Správa a sledování vašich návyků' : 'Manage and track your habits'}</p>
                        </div>
                          </div>
                        </div>
                
                <div className="p-4 bg-white border-2 border-primary-300 rounded-playful-md">
                  <div className="flex items-center gap-3 mb-2">
                    <Footprints className="w-5 h-5 text-primary-600" />
                    <div>
                      <h4 className="font-semibold text-black">{locale === 'cs' ? 'Kroky' : 'Steps'}</h4>
                      <p className="text-xs text-gray-600">{locale === 'cs' ? 'Přehled a správa všech kroků' : 'Overview and management of all steps'}</p>
                      </div>
                    </div>
                  </div>
                
                <div className="p-4 bg-white border-2 border-primary-300 rounded-playful-md">
                  <div className="flex items-center gap-3 mb-2">
                    <BookOpen className="w-5 h-5 text-primary-600" />
                    <div>
                      <h4 className="font-semibold text-black">{locale === 'cs' ? 'Nápověda' : 'Help'}</h4>
                      <p className="text-xs text-gray-600">{locale === 'cs' ? 'Dokumentace a návody k použití' : 'Documentation and usage guides'}</p>
                </div>
                    </div>
                      </div>
                
                <div className="p-4 bg-white border-2 border-primary-300 rounded-playful-md">
                  <div className="flex items-center gap-3 mb-2">
                    <Settings className="w-5 h-5 text-primary-600" />
                    <div>
                      <h4 className="font-semibold text-black">{locale === 'cs' ? 'Nastavení' : 'Settings'}</h4>
                      <p className="text-xs text-gray-600">{locale === 'cs' ? 'Nastavení aplikace a účtu' : 'App and account settings'}</p>
                    </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
            {/* Left Navigation Menu */}
            <div className="box-playful-highlight p-6">
              <h3 className="font-semibold text-black font-playful mb-4 flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-primary-600" />
                {locale === 'cs' ? 'Levé navigační menu' : 'Left Navigation Menu'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {locale === 'cs' 
                  ? 'Levé menu se mění podle kontextu stránky. Na hlavním panelu obsahuje hlavní zobrazení a sekce pro správu.'
                  : 'The left menu changes based on page context. On the main panel, it contains main views and management sections.'}
              </p>
              
              {/* Main Panel Navigation */}
              <div className="mb-6">
                <h4 className="font-semibold text-black mb-3">{locale === 'cs' ? 'Na hlavním panelu:' : 'On the main panel:'}</h4>
                    <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-white rounded-playful-md">
                    <ListTodo className="w-5 h-5 text-primary-600" />
                    <div>
                      <h5 className="font-semibold text-black text-sm">{locale === 'cs' ? 'Upcoming (Nadcházející)' : 'Upcoming'}</h5>
                      <p className="text-xs text-gray-600">{locale === 'cs' ? 'Přehled nadcházejících kroků a návyků' : 'Overview of upcoming steps and habits'}</p>
                        </div>
                      </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-white rounded-playful-md">
                    <CalendarDays className="w-5 h-5 text-primary-600" />
                    <div>
                      <h5 className="font-semibold text-black text-sm">{locale === 'cs' ? 'Overview (Přehled)' : 'Overview'}</h5>
                      <p className="text-xs text-gray-600">{locale === 'cs' ? 'Měsíční kalendářní přehled' : 'Monthly calendar overview'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-white rounded-playful-md">
                    <BarChart3 className="w-5 h-5 text-primary-600" />
                    <div>
                      <h5 className="font-semibold text-black text-sm">{locale === 'cs' ? 'Statistics (Statistiky)' : 'Statistics'}</h5>
                      <p className="text-xs text-gray-600">{locale === 'cs' ? 'Roční přehled pokroku v cílech' : 'Yearly overview of goal progress'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-white rounded-playful-md">
                    <LayoutDashboard className="w-5 h-5 text-primary-600" />
                    <div>
                      <h5 className="font-semibold text-black text-sm">{locale === 'cs' ? 'Areas (Oblasti)' : 'Areas'}</h5>
                      <p className="text-xs text-gray-600">{locale === 'cs' ? 'Zobrazení podle oblastí' : 'View by areas'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Areas and Goals in Navigation */}
              <div className="mb-4">
                <h4 className="font-semibold text-black mb-3">{locale === 'cs' ? 'Oblasti a cíle:' : 'Areas and Goals:'}</h4>
                <p className="text-sm text-gray-600 mb-3">
                  {locale === 'cs' 
                    ? 'Pod hlavními zobrazeními najdete seznam oblastí. Kliknutím na oblast se rozbalí a uvidíte cíle v této oblasti. Kliknutím na cíl se otevře detail cíle.'
                    : 'Below the main views, you\'ll find a list of areas. Click on an area to expand it and see goals in that area. Click on a goal to open the goal detail.'}
                </p>
                <div className="p-4 bg-white border-2 border-primary-300 rounded-playful-md">
                  <div className="space-y-2">
                        <div className="flex items-center gap-2">
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-black">{locale === 'cs' ? 'Kariéra' : 'Career'}</span>
                        </div>
                    <div className="ml-6 space-y-1">
                        <div className="flex items-center gap-2">
                        <Target className="w-3 h-3 text-primary-600" />
                        <span className="text-xs text-gray-600">{locale === 'cs' ? 'Povýšení' : 'Promotion'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                        <Target className="w-3 h-3 text-primary-600" />
                        <span className="text-xs text-gray-600">{locale === 'cs' ? 'Naučit se React' : 'Learn React'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
              </div>
              
              {/* Add Button */}
              <div className="mb-4">
                <h4 className="font-semibold text-black mb-3">{locale === 'cs' ? 'Tlačítko Přidat:' : 'Add Button:'}</h4>
                <p className="text-sm text-gray-600 mb-3">
                  {locale === 'cs' 
                    ? 'V dolní části levého menu je tlačítko s ikonou plus. Kliknutím na něj můžete přidat novou oblast, cíl, krok nebo návyk.'
                    : 'At the bottom of the left menu is a button with a plus icon. Clicking it allows you to add a new area, goal, step, or habit.'}
                </p>
                <div className="p-4 bg-white border-2 border-primary-300 rounded-playful-md flex items-center justify-center">
                  <button className="w-10 h-10 bg-primary-500 rounded-playful-md flex items-center justify-center">
                    <Plus className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
              
              {/* Other Pages */}
              <div className="mt-6 p-4 bg-primary-50 rounded-playful-md border-2 border-primary-200">
                <p className="text-xs text-gray-700">
                  <span className="font-semibold">{locale === 'cs' ? 'Tip: ' : 'Tip: '}</span>
                  {locale === 'cs' 
                    ? 'Na jiných stránkách (Cíle, Návyky, Kroky) slouží levé menu jako kategorie a filtry pro zobrazení obsahu.'
                    : 'On other pages (Goals, Habits, Steps), the left menu serves as categories and filters for displaying content.'}
                </p>
              </div>
            </div>
          </div>
        )

      case 'areas':
        return (
          <div className="space-y-6">
            <div className="box-playful-highlight-primary p-6">
              <h2 className="text-2xl font-bold text-black font-playful mb-2">{t('areasHelp.title') || (locale === 'cs' ? 'Oblasti' : 'Areas')}</h2>
              <p className="text-gray-600 font-playful">{t('areasHelp.subtitle') || (locale === 'cs' ? 'Organizujte své cíle, kroky a návyky do logických skupin' : 'Organize your goals, steps, and habits into logical groups')}</p>
            </div>

            {/* What are areas */}
            <div className="box-playful-highlight p-6">
              <h3 className="font-semibold text-black font-playful mb-4 flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-primary-600" />
                {locale === 'cs' ? 'Co jsou oblasti?' : 'What are areas?'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {locale === 'cs' 
                  ? 'Oblasti jsou způsob, jak organizovat své cíle, kroky a návyky do logických skupin. Ideálně by měly představovat větší životní oblasti nebo projekty.'
                  : 'Areas are a way to organize your goals, steps, and habits into logical groups. Ideally, they should represent larger life areas or projects.'}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-playful-md border-2 border-primary-300">
                  <div className="flex items-center gap-3 mb-2">
                    <span 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                      style={{ backgroundColor: '#10b981' }}
                    >
                      <Flame className="w-4 h-4 text-white" />
                    </span>
                    <h4 className="font-semibold text-black">{locale === 'cs' ? 'Zdraví' : 'Health'}</h4>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{locale === 'cs' ? 'Zdravotní cíle a návyky' : 'Health goals and habits'}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>2 {locale === 'cs' ? 'Cíle' : 'Goals'}</span>
                    <span>5 {locale === 'cs' ? 'Kroky' : 'Steps'}</span>
                    <span>3 {locale === 'cs' ? 'Návyky' : 'Habits'}</span>
                  </div>
                </div>
                <div className="p-4 bg-white rounded-playful-md border-2 border-primary-300">
                  <div className="flex items-center gap-3 mb-2">
                    <span 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                      style={{ backgroundColor: '#ea580c' }}
                    >
                      <Briefcase className="w-4 h-4 text-white" />
                    </span>
                    <h4 className="font-semibold text-black">{locale === 'cs' ? 'Kariéra' : 'Career'}</h4>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{locale === 'cs' ? 'Profesní cíle a kroky' : 'Professional goals and steps'}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>3 {locale === 'cs' ? 'Cíle' : 'Goals'}</span>
                    <span>8 {locale === 'cs' ? 'Kroky' : 'Steps'}</span>
                    <span>1 {locale === 'cs' ? 'Návyk' : 'Habit'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* How to create */}
            <div className="box-playful-highlight p-6">
              <h3 className="font-semibold text-black font-playful mb-4">{locale === 'cs' ? 'Jak vytvořit oblast?' : 'How to create an area?'}</h3>
              <div className="space-y-3">
                <Step number={1} text={locale === 'cs' ? 'Na hlavním panelu najděte tlačítko "Přidat" (ikona plus) v dolní části levého navigačního menu' : 'On the main panel, find the "Add" button (plus icon) at the bottom of the left navigation menu'} />
                <Step number={2} text={locale === 'cs' ? 'Klikněte na tlačítko "Přidat"' : 'Click the "Add" button'} />
                <Step number={3} text={locale === 'cs' ? 'Vyberte "Oblast" z nabídky' : 'Select "Area" from the menu'} />
                <Step number={4} text={locale === 'cs' ? 'Vyplňte název oblasti (např. "Zdraví", "Kariéra")' : 'Fill in the area name (e.g., "Health", "Career")'} />
                <Step number={5} text={locale === 'cs' ? 'Volitelně přidejte popis, barvu a ikonu' : 'Optionally add description, color, and icon'} />
                <Step number={6} text={locale === 'cs' ? 'Klikněte na "Uložit"' : 'Click "Save"'} />
              </div>
            </div>

            {/* How to work with areas */}
            <div className="box-playful-highlight p-6">
              <h3 className="font-semibold text-black font-playful mb-4">{locale === 'cs' ? 'Jak pracovat s oblastmi?' : 'How to work with areas?'}</h3>
              <div className="space-y-4">
                    <div>
                  <h4 className="font-semibold text-black mb-2">{locale === 'cs' ? 'Přiřazení k oblasti' : 'Assigning to an area'}</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    {locale === 'cs' 
                      ? 'Při vytváření nebo úpravě cíle, kroku nebo návyku můžete vybrat oblast, ke které patří. Tím se automaticky přiřadí k této oblasti.'
                      : 'When creating or editing a goal, step, or habit, you can select the area it belongs to. This automatically assigns it to that area.'}
                  </p>
                    </div>
                
                <div>
                  <h4 className="font-semibold text-black mb-2">{locale === 'cs' ? 'Zobrazení podle oblastí' : 'Viewing by areas'}</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    {locale === 'cs' 
                      ? 'V levém navigačním menu můžete kliknout na oblast a zobrazit všechny cíle, kroky a návyky v této oblasti. V Upcoming view můžete přepnout na zobrazení "Oblasti" místo "Feed".'
                      : 'In the left navigation menu, you can click on an area to view all goals, steps, and habits in that area. In Upcoming view, you can switch to "Areas" view instead of "Feed".'}
                  </p>
                  </div>
                
                <div>
                  <h4 className="font-semibold text-black mb-2">{locale === 'cs' ? 'Úprava a mazání oblastí' : 'Editing and deleting areas'}</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    {locale === 'cs' 
                      ? 'Oblasti můžete upravit nebo smazat v Nastavení → Životní oblasti. Při mazání oblasti se cíle, kroky a návyky v této oblasti nezmazou, pouze se odebere přiřazení k oblasti.'
                      : 'You can edit or delete areas in Settings → Life Areas. When deleting an area, goals, steps, and habits in that area are not deleted, only the area assignment is removed.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="box-playful-highlight p-6">
              <h3 className="font-semibold text-black font-playful mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-600" /> {locale === 'cs' ? 'Tipy' : 'Tips'}
              </h3>
              <ul className="space-y-2">
                <Tip text={locale === 'cs' ? 'Vytvářejte oblasti pro větší životní oblasti (Zdraví, Kariéra, Vztahy) nebo pro větší projekty' : 'Create areas for larger life areas (Health, Career, Relationships) or for larger projects'} />
                <Tip text={locale === 'cs' ? 'Není nutné přiřazovat vše k oblasti - cíle, kroky a návyky mohou existovat i bez oblasti' : 'You don\'t have to assign everything to an area - goals, steps, and habits can exist without an area'} />
                <Tip text={locale === 'cs' ? 'Používejte barvy a ikony pro lepší vizuální rozlišení oblastí' : 'Use colors and icons for better visual distinction of areas'} />
                <Tip text={locale === 'cs' ? 'Oblasti pomáhají s filtrováním a organizací, zejména když máte mnoho cílů a kroků' : 'Areas help with filtering and organization, especially when you have many goals and steps'} />
              </ul>
            </div>
          </div>
        )

      case 'goals':
        return (
          <div className="space-y-6">
            <div className="box-playful-highlight-primary p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-black font-playful flex items-center gap-2">
                  <Target className="w-7 h-7" /> {t('goalsHelp.title')}
                </h2>
                <p className="text-gray-600 font-playful font-playful text-sm mt-1">{t('goalsHelp.subtitle')}</p>
              </div>
                {onAddGoal && (
                <button onClick={onAddGoal} className="flex items-center gap-1 px-4 py-2 bg-white text-primary-600 font-playful font-medium rounded-lg hover:bg-primary-50">
                  <Plus className="w-4 h-4" /> {t('goalsHelp.add')}
                  </button>
                )}
              </div>

            {/* What are goals */}
            <div className="box-playful-highlight p-4">
              <h4 className="font-semibold text-black font-playful mb-2">{t('goalsHelp.whatAreGoals')}</h4>
              <p className="text-sm text-gray-600 font-playful mb-3">{t('goalsHelp.whatAreGoalsDesc')}</p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-primary-100 text-primary-600 px-2 py-1 rounded-full flex items-center gap-1">
                  <Target className="w-3 h-3" /> {t('goalsHelp.measurable')}
                </span>
                <span className="text-xs bg-primary-100 text-primary-600 px-2 py-1 rounded-full flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {t('goalsHelp.withDeadline')}
                </span>
                <span className="text-xs bg-primary-100 text-primary-600 px-2 py-1 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3" /> {t('goalsHelp.inFocus')}
                </span>
              </div>
              </div>

            {/* Example Goal Card */}
            <div className="box-playful-highlight p-4">
              <h4 className="font-semibold text-black font-playful mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary-600" /> {t('goalsHelp.exampleTitle')}
              </h4>
              <div className="box-playful-highlight p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5 text-primary-600 font-playful" />
              </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="font-semibold text-black font-playful">{t('goalsHelp.exampleName')}</h5>
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
                <p><strong className="text-green-600">{t('goalsHelp.active')}</strong> = {t('goalsHelp.activeExplanation').split(' = ')[1]}</p>
                <p><strong className="text-gray-600 font-playful">{t('goalsHelp.tableDeadline')}</strong> = {t('goalsHelp.deadlineExplanation').split(' = ')[1]}</p>
              </div>
            </div>

            {/* Goals Cards Example */}
            <div className="box-playful-highlight p-4">
              <h4 className="font-semibold text-black font-playful mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary-600" /> {t('goalsHelp.cardsTitle')}
              </h4>
              <div className="space-y-3">
                {/* Filter checkboxes example */}
                <div className="flex gap-3 pb-2 border-b border-gray-100">
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input type="checkbox" checked className="w-4 h-4 text-primary-600 font-playful border-gray-300 rounded" readOnly />
                    <span className="text-gray-600 font-playful font-playful">{t('goalsHelp.active')}</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-primary-600 font-playful border-gray-300 rounded" readOnly />
                    <span className="text-gray-500">{t('goalsHelp.postponed')}</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-primary-600 font-playful border-gray-300 rounded" readOnly />
                    <span className="text-gray-500">{t('goalsHelp.completed')}</span>
                  </label>
                </div>
                
                {/* Goal cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Active goal card */}
                  <div className="bg-white border border-primary-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Target className="w-5 h-5 text-primary-600 font-playful" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h5 className="font-semibold text-black font-playful">{t('goalsHelp.tableExample1')}</h5>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{t('goalsHelp.active')}</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">Chci vytvořit vlastní webovou aplikaci</p>
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                          <span>15.3.2025</span>
                          <span>3 kroky</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-primary-600 h-1.5 rounded-full" style={{ width: '33%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Active goal card 2 */}
                  <div className="bg-white border border-primary-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Target className="w-5 h-5 text-primary-600 font-playful" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h5 className="font-semibold text-black font-playful">{t('goalsHelp.tableExample2')}</h5>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{t('goalsHelp.active')}</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">Pravidelné cvičení pro zdraví</p>
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                          <span>—</span>
                          <span>5 kroků</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-primary-600 h-1.5 rounded-full" style={{ width: '60%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Paused goal card */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 opacity-60 cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Target className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h5 className="font-semibold text-gray-500">{t('goalsHelp.tableExample3')}</h5>
                          <span className="text-xs bg-gray-100 text-gray-600 font-playful px-2 py-0.5 rounded-full">{t('goalsHelp.postponed')}</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-2">Přečíst 12 knih tento rok</p>
                        <div className="flex items-center justify-between text-xs text-gray-300 mb-2">
                          <span>31.12.2025</span>
                          <span>0 kroků</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-gray-400 h-1.5 rounded-full" style={{ width: '0%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500 space-y-1">
                <p>{t('goalsHelp.cardsClickHint')}</p>
                <p>{t('goalsHelp.cardsFiltersHint')}</p>
                <p>{t('goalsHelp.cardsStatusHint')}</p>
              </div>
            </div>

            {/* How to create */}
            <div className="box-playful-highlight p-4">
              <h4 className="font-semibold text-black font-playful mb-3">{t('goalsHelp.howToCreate')}</h4>
              <div className="space-y-2">
                <Step number={1} text={t('goalsHelp.howToStep1')} />
                <Step number={2} text={t('goalsHelp.howToStep2')} />
                <Step number={3} text={t('goalsHelp.howToStep3')} />
                <Step number={4} text={t('goalsHelp.howToStep4')} />
                <Step number={5} text={t('goalsHelp.howToStep5')} />
              </div>
              <div className="mt-4 flex gap-2">
                {onAddGoal && (
                  <button onClick={onAddGoal} className="flex items-center gap-1 px-4 py-2 btn-playful-base text-primary-600 bg-white hover:bg-primary-50 text-sm font-medium">
                    <Plus className="w-4 h-4" /> {t('goalsHelp.createGoal')}
                  </button>
                )}
                {onNavigateToGoals && (
                  <button onClick={onNavigateToGoals} className="flex items-center gap-1 px-4 py-2 border border-primary-200 text-primary-600 font-playful text-sm rounded-lg hover:bg-primary-50">
                    <ArrowRight className="w-4 h-4" /> {t('goalsHelp.goToGoals')}
                  </button>
                )}
              </div>
              </div>

            {/* Metrics */}
            <div className="box-playful-highlight p-4">
              <h4 className="font-semibold text-black font-playful mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary-600" /> {locale === 'cs' ? 'Metriky' : 'Metrics'}
              </h4>
              <p className="text-sm text-gray-600 font-playful mb-4">
                {locale === 'cs' 
                  ? 'Metriky jsou číselné hodnoty, které sledujete v rámci svého cíle. Umožňují vám měřit pokrok konkrétním způsobem a vidět, jak se blížíte k dosažení cíle.'
                  : 'Metrics are numerical values that you track within your goal. They allow you to measure progress in a concrete way and see how you\'re approaching goal achievement.'}
              </p>
              
              <div className="space-y-4">
                <div>
                  <h5 className="font-semibold text-black text-sm mb-2">{locale === 'cs' ? 'K čemu jsou metriky?' : 'What are metrics for?'}</h5>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-primary-600 mt-1">•</span>
                      <span>{locale === 'cs' 
                        ? 'Měření pokroku: Sledujte konkrétní číselné hodnoty, které ukazují, jak blízko jste k dosažení cíle'
                        : 'Progress measurement: Track specific numerical values that show how close you are to achieving the goal'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-600 mt-1">•</span>
                      <span>{locale === 'cs' 
                        ? 'Motivace: Vidět rostoucí čísla vás motivuje k dalšímu pokroku'
                        : 'Motivation: Seeing growing numbers motivates you to make further progress'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-600 mt-1">•</span>
                      <span>{locale === 'cs' 
                        ? 'Konkrétní cíle: Místo vágních cílů jako "zhubnout" můžete sledovat "zhubnout 10 kg"'
                        : 'Concrete goals: Instead of vague goals like "lose weight", you can track "lose 10 kg"'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-600 mt-1">•</span>
                      <span>{locale === 'cs' 
                        ? 'Automatický výpočet pokroku: Pokrok cíle se automaticky počítá na základě metrik'
                        : 'Automatic progress calculation: Goal progress is automatically calculated based on metrics'}</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-semibold text-black text-sm mb-2">{locale === 'cs' ? 'Jak používat metriky?' : 'How to use metrics?'}</h5>
                  <div className="space-y-3">
                    <div className="p-3 bg-white rounded-playful-md border border-primary-200">
                      <p className="text-xs font-semibold text-black mb-1">{locale === 'cs' ? '1. Vytvoření metriky' : '1. Creating a metric'}</p>
                      <p className="text-xs text-gray-600">
                        {locale === 'cs' 
                          ? 'V detailu cíle klikněte na tlačítko "Přidat metriku". Vyberte typ metriky (číslo, měna, procenta, vzdálenost, čas, váha nebo vlastní), zadejte název, jednotku a cílovou hodnotu.'
                          : 'In the goal detail, click the "Add metric" button. Select the metric type (number, currency, percentage, distance, time, weight, or custom), enter the name, unit, and target value.'}
                      </p>
                    </div>
                    <div className="p-3 bg-white rounded-playful-md border border-primary-200">
                      <p className="text-xs font-semibold text-black mb-1">{locale === 'cs' ? '2. Aktualizace metriky' : '2. Updating a metric'}</p>
                      <p className="text-xs text-gray-600">
                        {locale === 'cs' 
                          ? 'Klikněte na tlačítko "+" nebo "-" vedle metriky pro rychlou aktualizaci, nebo klikněte na metriku pro detailní úpravu. Můžete také zadat konkrétní hodnotu.'
                          : 'Click the "+" or "-" button next to the metric for quick update, or click on the metric for detailed editing. You can also enter a specific value.'}
                      </p>
                    </div>
                    <div className="p-3 bg-white rounded-playful-md border border-primary-200">
                      <p className="text-xs font-semibold text-black mb-1">{locale === 'cs' ? '3. Typy metrik' : '3. Metric types'}</p>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="text-xs text-gray-600">
                          <span className="font-semibold">• {locale === 'cs' ? 'Číslo' : 'Number'}</span> - {locale === 'cs' ? 'libovolné číslo' : 'any number'}
                        </div>
                        <div className="text-xs text-gray-600">
                          <span className="font-semibold">• {locale === 'cs' ? 'Měna' : 'Currency'}</span> - {locale === 'cs' ? 'peněžní hodnoty' : 'monetary values'}
                        </div>
                        <div className="text-xs text-gray-600">
                          <span className="font-semibold">• {locale === 'cs' ? 'Procenta' : 'Percentage'}</span> - {locale === 'cs' ? '0-100%' : '0-100%'}
                        </div>
                        <div className="text-xs text-gray-600">
                          <span className="font-semibold">• {locale === 'cs' ? 'Vzdálenost' : 'Distance'}</span> - {locale === 'cs' ? 'km, míle' : 'km, miles'}
                        </div>
                        <div className="text-xs text-gray-600">
                          <span className="font-semibold">• {locale === 'cs' ? 'Čas' : 'Time'}</span> - {locale === 'cs' ? 'hodiny, minuty' : 'hours, minutes'}
                        </div>
                        <div className="text-xs text-gray-600">
                          <span className="font-semibold">• {locale === 'cs' ? 'Váha' : 'Weight'}</span> - {locale === 'cs' ? 'kg, libry' : 'kg, pounds'}
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-white rounded-playful-md border border-primary-200">
                      <p className="text-xs font-semibold text-black mb-1">{locale === 'cs' ? '4. Příklady použití' : '4. Usage examples'}</p>
                      <ul className="text-xs text-gray-600 space-y-1 mt-1">
                        <li>• {locale === 'cs' ? 'Cíl: "Ušetřit na auto" → Metrika: Měna, cílová hodnota 200 000 Kč' : 'Goal: "Save for a car" → Metric: Currency, target value 200,000'}</li>
                        <li>• {locale === 'cs' ? 'Cíl: "Naučit se programovat" → Metrika: Číslo, název "Dokončené kurzy", cílová hodnota 5' : 'Goal: "Learn to program" → Metric: Number, name "Completed courses", target value 5'}</li>
                        <li>• {locale === 'cs' ? 'Cíl: "Zlepšit kondici" → Metrika: Vzdálenost, název "Uběhnuté kilometry", cílová hodnota 100 km' : 'Goal: "Improve fitness" → Metric: Distance, name "Kilometers run", target value 100 km'}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="box-playful-highlight p-4">
              <h4 className="font-semibold text-black font-playful mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-600" /> {t('goalsHelp.tips')}
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
            <div className="box-playful-highlight-primary p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-black font-playful flex items-center gap-2">
                  <Footprints className="w-7 h-7" /> {t('stepsHelp.title')}
                </h2>
                <p className="text-gray-600 font-playful font-playful text-sm mt-1">{t('stepsHelp.subtitle')}</p>
              </div>
                {onAddStep && (
                <button onClick={onAddStep} className="flex items-center gap-1 px-4 py-2 bg-white text-primary-600 font-playful font-medium rounded-lg hover:bg-primary-50">
                  <Plus className="w-4 h-4" /> {t('stepsHelp.add')}
                  </button>
                )}
            </div>

            {/* What are steps */}
            <div className="box-playful-highlight p-4">
              <h4 className="font-semibold text-black font-playful mb-2">{t('stepsHelp.whatAreSteps')}</h4>
              <p className="text-sm text-gray-600 font-playful mb-3">{t('stepsHelp.whatAreStepsDesc')}</p>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-xs bg-primary-100 text-primary-600 px-2 py-1 rounded-full flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {t('stepsHelp.scheduled')}
                </span>
                <span className="text-xs bg-primary-100 text-primary-600 px-2 py-1 rounded-full flex items-center gap-1">
                  <Target className="w-3 h-3" /> {t('stepsHelp.toGoal')}
                </span>
                <span className="text-xs bg-primary-100 text-primary-600 px-2 py-1 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {t('stepsHelp.timeEstimate')}
                </span>
                <span className="text-xs bg-primary-100 text-primary-600 px-2 py-1 rounded-full flex items-center gap-1">
                  <Zap className="w-3 h-3" /> {locale === 'cs' ? 'Opakující se' : 'Recurring'}
                </span>
              </div>
              <div className="mt-3 p-3 bg-primary-50 rounded-playful-md border border-primary-200">
                <p className="text-xs text-gray-700 font-medium mb-1">{locale === 'cs' ? 'Opakující se kroky' : 'Recurring Steps'}</p>
                <p className="text-xs text-gray-600">{locale === 'cs' 
                  ? 'Kroky můžete nastavit jako opakující se (denně, týdně, měsíčně). V Upcoming view se zobrazí vždy další nehotový výskyt.'
                  : 'Steps can be set as recurring (daily, weekly, monthly). In Upcoming view, always shows the next uncompleted occurrence.'}</p>
              </div>
              </div>

            {/* Example Step Card */}
            <div className="box-playful-highlight p-4">
              <h4 className="font-semibold text-black font-playful mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary-600" /> {t('stepsHelp.exampleTitle')}
              </h4>
              <div className="box-playful-highlight p-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 border-2 border-primary-400 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckSquare className="w-4 h-4 text-primary-400" />
                </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="font-semibold text-black font-playful">{t('stepsHelp.exampleName')}</h5>
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
                <p><strong className="text-primary-600 font-playful">{t('stepsHelp.timeEstimate')}</strong> = {t('stepsHelp.timeExplanation').split(' = ')[1]}</p>
                <p><strong className="text-gray-600 font-playful">{t('stepsHelp.tableGoal')}</strong> = {t('stepsHelp.goalExplanation').split(' = ')[1]}</p>
                </div>
              </div>

            {/* Steps Table Example */}
            <div className="box-playful-highlight p-4">
              <h4 className="font-semibold text-black font-playful mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary-600" /> {t('stepsHelp.tableTitle')}
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-primary-100">
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 w-8"></th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">{t('stepsHelp.tableName')}</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">{t('stepsHelp.tableDate')}</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">{t('stepsHelp.tableTime')}</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">{t('stepsHelp.tableGoal')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-primary-50 hover:bg-primary-50 cursor-pointer">
                      <td className="py-2 px-2">
                        <div className="w-5 h-5 border-2 border-primary-400 rounded flex items-center justify-center">
                          <CheckSquare className="w-3 h-3 text-primary-400" />
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
                      <td className="py-2 px-2 text-xs text-primary-600 font-playful">React</td>
                    </tr>
                    <tr className="border-b border-primary-50 hover:bg-primary-50 cursor-pointer">
                      <td className="py-2 px-2">
                        <div className="w-5 h-5 border-2 border-primary-400 rounded flex items-center justify-center">
                          <CheckSquare className="w-3 h-3 text-primary-400" />
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <span className="font-medium text-gray-800">{t('stepsHelp.tableExample2')}</span>
                      </td>
                      <td className="py-2 px-2 text-gray-500">{t('stepsHelp.tomorrow')}</td>
                      <td className="py-2 px-2 text-gray-500">2 h</td>
                      <td className="py-2 px-2 text-xs text-primary-600 font-playful">React</td>
                    </tr>
                    <tr className="hover:bg-primary-50 cursor-pointer opacity-60">
                      <td className="py-2 px-2">
                        <div className="w-5 h-5 bg-primary-500 rounded flex items-center justify-center">
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
            <div className="box-playful-highlight p-4">
              <h4 className="font-semibold text-black font-playful mb-3">{t('stepsHelp.howToCreate')}</h4>
              <div className="space-y-2">
                <Step number={1} text={t('stepsHelp.howToStep1')} />
                <Step number={2} text={t('stepsHelp.howToStep2')} />
                <Step number={3} text={t('stepsHelp.howToStep3')} />
                <Step number={4} text={t('stepsHelp.howToStep4')} />
                <Step number={5} text={t('stepsHelp.howToStep5')} />
              </div>
              <div className="mt-4 flex gap-2">
                {onAddStep && (
                  <button onClick={onAddStep} className="flex items-center gap-1 px-4 py-2 btn-playful-base text-primary-600 bg-white hover:bg-primary-50 text-sm font-medium">
                    <Plus className="w-4 h-4" /> {t('stepsHelp.createStep')}
                  </button>
                )}
                {onNavigateToSteps && (
                  <button onClick={onNavigateToSteps} className="flex items-center gap-1 px-4 py-2 border border-primary-200 text-primary-600 font-playful text-sm rounded-lg hover:bg-primary-50">
                    <ArrowRight className="w-4 h-4" /> {t('stepsHelp.goToSteps')}
                  </button>
                )}
              </div>
            </div>

            {/* How to use steps */}
            <div className="box-playful-highlight p-4">
              <h4 className="font-semibold text-black font-playful mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary-600" /> {locale === 'cs' ? 'Jak používat kroky?' : 'How to use steps?'}
              </h4>
              <div className="space-y-4">
                <div>
                  <h5 className="font-semibold text-black text-sm mb-2">{locale === 'cs' ? 'Základní funkce kroků' : 'Basic step functions'}</h5>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-primary-600 mt-1">•</span>
                      <span>{locale === 'cs' 
                        ? 'Dokončování: Klikněte na checkbox vedle kroku pro jeho dokončení. Dokončené kroky se zobrazí jako zaškrtnuté.'
                        : 'Completion: Click the checkbox next to a step to complete it. Completed steps are displayed as checked.'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-600 mt-1">•</span>
                      <span>{locale === 'cs' 
                        ? 'Přiřazení k cíli: Kroky můžete přiřadit k cíli, aby se zobrazovaly v detailu cíle a počítaly se do pokroku cíle'
                        : 'Assigning to a goal: You can assign steps to a goal so they appear in the goal detail and count towards goal progress'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-600 mt-1">•</span>
                      <span>{locale === 'cs' 
                        ? 'Datum: Každý krok má datum, kdy má být dokončen. Kroky s minulým datem se zobrazují jako "overdue" (po termínu)'
                        : 'Date: Each step has a date when it should be completed. Steps with past dates are displayed as "overdue"'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-600 mt-1">•</span>
                      <span>{locale === 'cs' 
                        ? 'Důležitost: Můžete označit krok jako důležitý, aby se zvýraznil a zobrazoval se na prvním místě'
                        : 'Importance: You can mark a step as important so it\'s highlighted and displayed first'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-600 mt-1">•</span>
                      <span>{locale === 'cs' 
                        ? 'Odhadovaný čas: Zadejte, kolik času krok přibližně zabere, abyste mohli lépe plánovat svůj den'
                        : 'Estimated time: Enter how long the step will approximately take so you can better plan your day'}</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-semibold text-black text-sm mb-2">{locale === 'cs' ? 'Opakující se kroky' : 'Recurring steps'}</h5>
                  <p className="text-sm text-gray-600 mb-3">
                    {locale === 'cs' 
                      ? 'Kroky můžete nastavit jako opakující se, aby se automaticky vytvářely v pravidelných intervalech.'
                      : 'You can set steps as recurring so they are automatically created at regular intervals.'}
                  </p>
                  <div className="space-y-2">
                    <div className="p-3 bg-white rounded-playful-md border border-primary-200">
                      <p className="text-xs font-semibold text-black mb-1">{locale === 'cs' ? 'Frekvence:' : 'Frequency:'}</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li>• <span className="font-semibold">{locale === 'cs' ? 'Denně' : 'Daily'}</span> - {locale === 'cs' ? 'krok se vytvoří každý den' : 'step is created every day'}</li>
                        <li>• <span className="font-semibold">{locale === 'cs' ? 'Týdně' : 'Weekly'}</span> - {locale === 'cs' ? 'krok se vytvoří každý týden ve stejný den' : 'step is created every week on the same day'}</li>
                        <li>• <span className="font-semibold">{locale === 'cs' ? 'Měsíčně' : 'Monthly'}</span> - {locale === 'cs' ? 'krok se vytvoří každý měsíc ve stejný den' : 'step is created every month on the same day'}</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-primary-50 rounded-playful-md border border-primary-200">
                      <p className="text-xs text-gray-700">
                        <span className="font-semibold">{locale === 'cs' ? 'Tip: ' : 'Tip: '}</span>
                        {locale === 'cs' 
                          ? 'V Upcoming view se vždy zobrazí pouze další nehotový výskyt opakujícího se kroku. Po dokončení se automaticky vytvoří další.'
                          : 'In Upcoming view, only the next uncompleted occurrence of a recurring step is displayed. After completion, the next one is automatically created.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold text-black text-sm mb-2">{locale === 'cs' ? 'Organizace kroků' : 'Organizing steps'}</h5>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-primary-600 mt-1">•</span>
                      <span>{locale === 'cs' 
                        ? 'Přiřazení k oblasti: Kroky můžete přiřadit k oblasti pro lepší organizaci'
                        : 'Assigning to an area: You can assign steps to an area for better organization'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-600 mt-1">•</span>
                      <span>{locale === 'cs' 
                        ? 'Zobrazení v Upcoming: Všechny kroky s budoucím nebo dnešním datem se zobrazují v sekci "Upcoming"'
                        : 'Display in Upcoming: All steps with future or today\'s date are displayed in the "Upcoming" section'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-600 mt-1">•</span>
                      <span>{locale === 'cs' 
                        ? 'Filtrování: Na stránce "Kroky" můžete filtrovat kroky podle data, dokončení a přiřazení k cíli'
                        : 'Filtering: On the "Steps" page, you can filter steps by date, completion, and goal assignment'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-600 mt-1">•</span>
                      <span>{locale === 'cs' 
                        ? 'Úprava a mazání: Klikněte na krok pro otevření detailu, kde můžete upravit všechny vlastnosti nebo krok smazat'
                        : 'Editing and deleting: Click on a step to open the detail where you can edit all properties or delete the step'}</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-semibold text-black text-sm mb-2">{locale === 'cs' ? 'Příklady použití' : 'Usage examples'}</h5>
                  <div className="space-y-2">
                    <div className="p-3 bg-white rounded-playful-md border border-primary-200">
                      <p className="text-xs font-semibold text-black mb-1">{locale === 'cs' ? 'Jednorázový krok:' : 'One-time step:'}</p>
                      <p className="text-xs text-gray-600">
                        {locale === 'cs' 
                          ? '"Zavolat zubaři" - krok s dnešním datem, důležitý, 15 minut, přiřazený k cíli "Zdraví"'
                          : '"Call the dentist" - step with today\'s date, important, 15 minutes, assigned to goal "Health"'}
                      </p>
                    </div>
                    <div className="p-3 bg-white rounded-playful-md border border-primary-200">
                      <p className="text-xs font-semibold text-black mb-1">{locale === 'cs' ? 'Opakující se krok:' : 'Recurring step:'}</p>
                      <p className="text-xs text-gray-600">
                        {locale === 'cs' 
                          ? '"Cvičení" - opakující se denně, 1 hodina, přiřazený k cíli "Zlepšit kondici"'
                          : '"Exercise" - recurring daily, 1 hour, assigned to goal "Improve fitness"'}
                      </p>
                    </div>
                    <div className="p-3 bg-white rounded-playful-md border border-primary-200">
                      <p className="text-xs font-semibold text-black mb-1">{locale === 'cs' ? 'Krok bez cíle:' : 'Step without goal:'}</p>
                      <p className="text-xs text-gray-600">
                        {locale === 'cs' 
                          ? '"Nakoupit potraviny" - krok s dnešním datem, 30 minut, bez přiřazení k cíli'
                          : '"Buy groceries" - step with today\'s date, 30 minutes, without goal assignment'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="box-playful-highlight p-4">
              <h4 className="font-semibold text-black font-playful mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-600" /> {t('stepsHelp.tips')}
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
            <div className="box-playful-highlight-primary p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-black font-playful flex items-center gap-2">
                  <CheckSquare className="w-7 h-7" /> {t('habitsHelp.title')}
                </h2>
                <p className="text-gray-600 font-playful font-playful text-sm mt-1">{t('habitsHelp.subtitle')}</p>
              </div>
                {onAddHabit && (
                <button onClick={onAddHabit} className="flex items-center gap-1 px-4 py-2 bg-white text-primary-600 font-playful font-medium rounded-lg hover:bg-primary-50">
                  <Plus className="w-4 h-4" /> {t('habitsHelp.add')}
                  </button>
                )}
            </div>

            {/* What are habits */}
            <div className="box-playful-highlight p-4">
              <h4 className="font-semibold text-black font-playful mb-2">{t('habitsHelp.whatAreHabits')}</h4>
              <p className="text-sm text-gray-600 font-playful mb-3">{t('habitsHelp.whatAreHabitsDesc')}</p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-primary-100 text-primary-600 px-2 py-1 rounded-full flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {t('habitsHelp.daily')}
                </span>
                <span className="text-xs bg-primary-100 text-primary-600 px-2 py-1 rounded-full flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {t('habitsHelp.weekly')}
                </span>
                <span className="text-xs bg-primary-100 text-primary-600 px-2 py-1 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {t('habitsHelp.reminder')}
                </span>
              </div>
            </div>

            {/* Example Habit Card */}
            <div className="box-playful-highlight p-4">
              <h4 className="font-semibold text-black font-playful mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary-600" /> {t('habitsHelp.exampleTitle')}
              </h4>
              <div className="box-playful-highlight p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="font-semibold text-black font-playful">{t('habitsHelp.exampleName')}</h5>
                      <span className="text-xs bg-primary-200 text-primary-600 px-2 py-0.5 rounded-full">{t('habitsHelp.daily')}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{t('habitsHelp.exampleDesc')}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 07:00
                      </span>
              </div>
                    <div className="flex gap-1 mt-2">
                      {days.map((day, i) => (
                        <span key={day} className={`w-6 h-6 rounded text-[10px] flex items-center justify-center font-medium ${i < 5 ? 'bg-primary-200 text-primary-600' : 'bg-gray-100 text-gray-400'}`}>
                          {day}
                        </span>
                      ))}
                </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500 space-y-1">
                <p><strong className="text-primary-600 font-playful">{t('habitsHelp.daily')}</strong> = {t('habitsHelp.dailyExplanation').split(' = ')[1]}</p>
                <p><strong className="text-primary-600 font-playful">{t('habitsHelp.reminder')}</strong> = {t('habitsHelp.reminderExplanation').split(' = ')[1]}</p>
                <p><strong className="text-gray-600 font-playful">{t('days.mon')}-{t('days.sun')}</strong> = {t('habitsHelp.daysExplanation').split(' = ')[1]}</p>
              </div>
              </div>

            {/* Habits Timeline Example */}
            <div className="box-playful-highlight p-4">
              <h4 className="font-semibold text-black font-playful mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary-600" /> {t('habitsHelp.timelineTitle')}
              </h4>
              
              {/* Statistics example */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary-600" />
                  <div>
                    <div className="text-xs text-gray-500">Plánováno</div>
                    <div className="text-sm font-semibold text-black font-playful">21</div>
                </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-green-500" />
                  <div>
                    <div className="text-xs text-gray-500">Splněno</div>
                    <div className="text-sm font-semibold text-black font-playful">15</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-500" />
                  <div>
                    <div className="text-xs text-gray-500">Mimo plán</div>
                    <div className="text-sm font-semibold text-black font-playful">2</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-500" />
                  <div>
                    <div className="text-xs text-gray-500">Streak</div>
                    <div className="text-sm font-semibold text-black font-playful">5</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <div>
                    <div className="text-xs text-gray-500">Max streak</div>
                    <div className="text-sm font-semibold text-black font-playful">12</div>
                  </div>
                </div>
              </div>

              {/* Timeline example */}
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <div className="space-y-3">
                  {/* Habit 1 */}
                  <div className="flex items-start gap-2">
                    <div className="w-[150px] flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-medium text-gray-800">{t('habitsHelp.tableExample1')}</span>
                      <button className="p-1 hover:bg-gray-200 rounded" title={t('habitsHelp.settingsIcon')}>
                        <Settings className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                    <div className="flex gap-1 flex-1">
                      {[true, true, true, false, false, false, false].map((done, i) => (
                        <div key={i} className={`w-8 h-8 rounded flex items-center justify-center ${done ? 'bg-primary-500' : 'bg-gray-200'}`}>
                          {done && <CheckSquare className="w-4 h-4 text-white" />}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Habit 2 */}
                  <div className="flex items-start gap-2">
                    <div className="w-[150px] flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-medium text-gray-800">{t('habitsHelp.tableExample2')}</span>
                      <button className="p-1 hover:bg-gray-200 rounded" title={t('habitsHelp.settingsIcon')}>
                        <Settings className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                    <div className="flex gap-1 flex-1">
                      {[true, false, true, false, false, false, false].map((done, i) => (
                        <div key={i} className={`w-8 h-8 rounded flex items-center justify-center ${done ? 'bg-primary-500' : 'bg-gray-200'}`}>
                          {done && <CheckSquare className="w-4 h-4 text-white" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-3 text-xs text-gray-500 space-y-1">
                <p>{t('habitsHelp.timelineOrangeHint')}</p>
                <p>{t('habitsHelp.timelineGrayHint')}</p>
                <p>{t('habitsHelp.timelineSettingsHint')}</p>
                <p>{t('habitsHelp.timelineClickHint')}</p>
              </div>
            </div>

            {/* How to create */}
            <div className="box-playful-highlight p-4">
              <h4 className="font-semibold text-black font-playful mb-3">{t('habitsHelp.howToCreate')}</h4>
              <div className="space-y-2">
                <Step number={1} text={t('habitsHelp.howToStep1')} />
                <Step number={2} text={t('habitsHelp.howToStep2')} />
                <Step number={3} text={t('habitsHelp.howToStep3')} />
                <Step number={4} text={t('habitsHelp.howToStep4')} />
                <Step number={5} text={t('habitsHelp.howToStep5')} />
              </div>
              <div className="mt-4 flex gap-2">
                {onAddHabit && (
                  <button onClick={onAddHabit} className="flex items-center gap-1 px-4 py-2 btn-playful-base text-primary-600 bg-white hover:bg-primary-50 text-sm font-medium">
                    <Plus className="w-4 h-4" /> {t('habitsHelp.createHabit')}
                  </button>
                )}
                {onNavigateToHabits && (
                  <button onClick={onNavigateToHabits} className="flex items-center gap-1 px-4 py-2 border border-primary-200 text-primary-600 font-playful text-sm rounded-lg hover:bg-primary-50">
                    <ArrowRight className="w-4 h-4" /> {t('habitsHelp.goToHabits')}
                  </button>
                )}
              </div>
              </div>

            {/* Tips */}
            <div className="box-playful-highlight p-4">
              <h4 className="font-semibold text-black font-playful mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-600" /> {t('habitsHelp.tips')}
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
    <div className="w-full h-full flex bg-background">
      {/* Sidebar */}
      <div className="hidden md:block w-56 border-r-2 border-primary-500 bg-white flex-shrink-0 flex flex-col">
        <div className="p-4 flex-1 overflow-y-auto">
          <h2 className="text-sm font-bold text-black font-playful mb-3 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-primary-600" />
            {t('title')}
          </h2>
          <nav className="space-y-1">
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-playful-md transition-all text-left text-sm font-playful ${
                    selectedCategory === category.id
                      ? 'bg-primary-500 text-black font-semibold'
                      : 'text-black hover:bg-primary-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{category.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
        {/* Contact button at bottom */}
        <div className="p-4 border-t-2 border-primary-500">
          <button
            onClick={() => setShowContactModal(true)}
            className="btn-playful-base w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary-600 bg-white hover:bg-primary-50"
          >
            <Mail className="w-5 h-5" />
            {t('contact')}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Mobile menu */}
        <div className="md:hidden sticky top-0 z-10 bg-white border-b-2 border-primary-500 p-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-black font-playful flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary-600" />
              {t('title')}
            </h2>
            <div className="relative">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="btn-playful-base p-2"
              >
                <Menu className="w-4 h-4 text-black" />
              </button>
              {mobileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-[100]" onClick={() => setMobileMenuOpen(false)} />
                  <div className="absolute right-0 top-10 box-playful-highlight bg-white z-[101] min-w-[180px] overflow-hidden flex flex-col">
                    <nav className="py-1 flex-1">
                      {categories.map((category) => {
                        const Icon = category.icon
                        return (
                          <button
                            key={category.id}
                            onClick={() => {
                              setSelectedCategory(category.id)
                              setMobileMenuOpen(false)
                            }}
                            className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left font-playful ${
                              selectedCategory === category.id
                                ? 'bg-primary-500 text-black font-semibold'
                                : 'text-black hover:bg-primary-50'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="font-medium">{category.label}</span>
                          </button>
                        )
                      })}
                    </nav>
                    {/* Contact button at bottom */}
                    <div className="p-4 border-t-2 border-primary-500">
                      <button
                        onClick={() => {
                          setShowContactModal(true)
                          setMobileMenuOpen(false)
                        }}
                        className="btn-playful-base w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary-600 bg-white hover:bg-primary-50"
                      >
                        <Mail className="w-5 h-5" />
                        {t('contact')}
                      </button>
                    </div>
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

      {/* Contact Modal */}
      <ContactModal
        show={showContactModal}
        onClose={() => setShowContactModal(false)}
      />
    </div>
  )
}

