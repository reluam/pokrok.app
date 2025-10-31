'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, CheckCircle, ArrowRight } from 'lucide-react'
import { CoachingPackage } from '@/lib/admin-types'

// Fallback coaching packages in case API fails
const fallbackCoachingPackages = [
  {
    id: 'koucovy-balicek',
    title: 'Koučovací balíček',
    subtitle: 'Plně přizpůsobitelný',
    description: 'Komplexní koučovací program na míru - od 6 sezení, s individuálním přístupem a cenou',
    price: 'Cena na domluvě',
    duration: 'Od 6 sezení',
    features: [
      'První konzultace zdarma (30 min)',
      'Minimálně 6 sezení',
      'Individuální frekvence a délka',
      'Flexibilní cena podle vašich možností',
      'E-mailová podpora mezi sezeními',
      'Materiály a cvičení na míru'
    ],
    color: 'bg-primary-500',
    textColor: 'text-primary-500',
    borderColor: 'border-primary-500',
    headerTextColor: 'text-white',
    enabled: true,
    order: 1,
    createdAt: '',
    updatedAt: ''
  },
  {
    id: 'jednorazovy-koucink',
    title: 'Jednorázový koučing',
    subtitle: '1 sezení',
    description: 'Jednotlivé koučovací sezení pro řešení konkrétních výzev',
    price: '2 500 Kč',
    duration: '60 minut',
    features: [
      'Fokus na konkrétní téma',
      'Okamžité praktické řešení',
      'Individuální přístup',
      'Materiály k sezení',
      'E-mailová podpora 7 dní'
    ],
    color: 'bg-primary-100',
    textColor: 'text-primary-600',
    borderColor: 'border-primary-500',
    headerTextColor: 'text-primary-500',
    enabled: true,
    order: 2,
    createdAt: '',
    updatedAt: ''
  },
  {
    id: 'vstupni-konzultace',
    title: 'Zkušební hodina zdarma',
    subtitle: '1 hodina',
    description: 'Vyzkoušejte si koučing zdarma a uvidíte, zda vám vyhovuje. Plnohodnotné sezení bez závazků.',
    price: 'Zdarma',
    duration: '60 minut',
    features: [
      'Plnohodnotné koučovací sezení',
      'Praktické ukázky technik',
      'Seznámení s koučovacím procesem',
      'Definování vašich cílů',
      'Doporučení dalšího postupu',
      'Bez závazků'
    ],
    color: 'bg-green-500',
    textColor: 'text-green-500',
    borderColor: 'border-green-500',
    headerTextColor: 'text-white',
    enabled: true,
    order: 3,
    createdAt: '',
    updatedAt: ''
  }
]

export default function CoachingPackagesSection() {
  const [coachingPackages, setCoachingPackages] = useState<CoachingPackage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCoachingPackages()
  }, [])

  const loadCoachingPackages = async () => {
    try {
      const response = await fetch('/api/coaching-packages')
      if (response.ok) {
        const packages: CoachingPackage[] = await response.json()
        console.log('Loaded coaching packages from API:', packages)
        setCoachingPackages(packages)
      } else {
        console.error('Failed to load coaching packages, using fallback')
        setCoachingPackages(fallbackCoachingPackages)
      }
    } catch (error) {
      console.error('Error loading coaching packages:', error)
      setCoachingPackages(fallbackCoachingPackages)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-h2 text-text-primary mb-4">Koučovací balíčky</h2>
            <p className="text-p18 text-gray-600">Načítání koučovacích balíčků...</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 animate-pulse">
                <div className="bg-gray-300 rounded-t-2xl p-6 h-32"></div>
                <div className="p-6">
                  <div className="h-4 bg-gray-300 rounded mb-4"></div>
                  <div className="space-y-2 mb-6">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="h-3 bg-gray-300 rounded"></div>
                    ))}
                  </div>
                  <div className="h-12 bg-gray-300 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex flex-wrap justify-center gap-8">
          {coachingPackages.filter(pkg => pkg.enabled).map((packageItem) => (
            <div 
              key={packageItem.id}
              className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-2 ${packageItem.borderColor} border-opacity-20 flex flex-col w-full max-w-sm`}
            >
              {/* Header */}
              <div className={`${packageItem.color} rounded-t-2xl p-6 ${packageItem.headerTextColor || 'text-white'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-6 h-6" />
                    <span className="text-asul18 font-medium">Koučing</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{packageItem.price}</div>
                    <div className="text-sm opacity-90">{packageItem.duration}</div>
                  </div>
                </div>
                <h3 className="text-h3 mb-2">{packageItem.title}</h3>
                <p className="text-asul18 opacity-90">{packageItem.subtitle}</p>
              </div>

              {/* Content */}
              <div className="p-6 flex-grow flex flex-col">
                <p className="text-p16 text-gray-600 mb-6">
                  {packageItem.description}
                </p>

                {/* Features */}
                <div className="space-y-3 mb-8 flex-grow">
                  {packageItem.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start space-x-3">
                      <CheckCircle className={`w-5 h-5 ${packageItem.textColor} flex-shrink-0 mt-0.5`} />
                      <span className="text-p16 text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Link
                  href={`/rezervace/${packageItem.id}`}
                  className={`w-full ${packageItem.color} ${packageItem.headerTextColor || 'text-white'} px-6 py-4 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center space-x-2 text-asul18 font-medium`}
                >
                  <span>Rezervace</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
