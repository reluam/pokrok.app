'use client'

import { useState, useEffect } from 'react'
import { Target, Calendar, User, Mail, MessageSquare, Send, Loader2, X, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function CoachingHero() {
  const [showModal, setShowModal] = useState(false)
  const [rotatingWord, setRotatingWord] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  
  const words = ['Koučing', 'Inspirace', 'Aplikace']
  
  useEffect(() => {
    const interval = setInterval(() => {
      // Začít animaci rotace
      setIsAnimating(true)
      // Po dokončení animace změnit slovo a ukončit animaci
      setTimeout(() => {
        setRotatingWord((prev) => (prev + 1) % words.length)
        setIsAnimating(false)
      }, 600) // Délka animace
    }, 2000) // Slovo je viditelné 2 sekundy, pak se změní
    
    return () => clearInterval(interval)
  }, [words.length])
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    date: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus({ type: null, message: '' })

    try {
      const response = await fetch('/api/coaching', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitStatus({
          type: 'success',
          message: data.message || 'Děkujeme za vaši rezervaci! Ozvu se vám s konkrétním časem.',
        })
        setFormData({
          name: '',
          email: '',
          date: '',
          message: '',
        })
        setTimeout(() => {
          setShowModal(false)
          setSubmitStatus({ type: null, message: '' })
        }, 3000)
      } else {
        setSubmitStatus({
          type: 'error',
          message: data.error || 'Něco se pokazilo. Zkuste to prosím znovu.',
        })
      }
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: 'Něco se pokazilo. Zkuste to prosím znovu.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Vypočítat aktuální rotaci
  const currentRotation = -rotatingWord * 120
  const nextRotation = -(rotatingWord + 1) * 120

  return (
    <>
      <section id="coaching" className="relative min-h-[90vh] flex items-center overflow-hidden pt-20">
        <div className="relative z-10 w-full h-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-20">
            <div className="max-w-6xl mx-auto">
              {/* Hero content */}
              <div className="text-center mb-12 md:mb-16">
                <div className="inline-flex items-center justify-center p-3 bg-primary-100 rounded-full mb-6">
                  <Target className="text-primary-600" size={32} />
                </div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-text-primary mb-6 leading-tight">
                  <span className="gradient-text inline-block min-w-[200px] md:min-w-[300px] text-left relative overflow-hidden" style={{ height: '1.2em', display: 'inline-block', perspective: '800px', perspectiveOrigin: '50% 50%' }}>
                    <span 
                      className="relative inline-block w-full h-full"
                      style={{ 
                        transformStyle: 'preserve-3d',
                        transformOrigin: '50% 50%',
                        height: '1.2em',
                        width: '100%',
                        transform: `rotateX(${isAnimating ? nextRotation : currentRotation}deg)`,
                        transition: isAnimating ? 'transform 0.6s ease-in-out' : 'none'
                      }}
                    >
                      {words.map((word, index) => {
                        // Každé slovo má pevný úhel na válci
                        const angle = (index * 360) / words.length
                        const radius = '0.8em' // Poloměr válce
                        return (
                          <span
                            key={word}
                            className="absolute left-0 top-0 w-full h-full"
                            style={{
                              transform: `rotateX(${angle}deg) translateZ(${radius})`,
                              backfaceVisibility: 'hidden',
                              WebkitBackfaceVisibility: 'hidden',
                              transformStyle: 'preserve-3d',
                              textAlign: 'left',
                              lineHeight: '1.2em'
                            }}
                          >
                            {word}
                          </span>
                        )
                      })}
                    </span>
                  </span>{' '}pro smysluplný život
                </h1>
                <p className="text-xl md:text-2xl lg:text-3xl text-text-primary max-w-4xl mx-auto leading-relaxed mb-8">
                  Pojďme společně najít, jak můžeš smysluplnost více zakomponovat do tvé konkrétní situace
                </p>
                <p className="text-lg md:text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed mb-10">
                  Na koučovacím sezení probereme tvou aktuální situaci, cíle a výzvy. 
                  Společně najdeme konkrétní kroky, jak můžeš žít více smysluplný život.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                <button
                  onClick={() => setShowModal(true)}
                  className="group flex items-center justify-center gap-3 px-8 md:px-12 py-4 md:py-5 rounded-full bg-primary-600 text-white font-semibold text-lg md:text-xl hover:bg-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform w-full sm:w-auto min-w-[240px]"
                >
                  <Calendar size={24} />
                  <span>Rezervovat konzultaci</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <Link
                  href="/coaching"
                  className="group flex items-center justify-center gap-2 px-8 md:px-12 py-4 md:py-5 border-2 border-primary-600 text-primary-600 font-semibold text-lg md:text-xl hover:bg-primary-600 hover:text-white transition-all duration-300 w-full sm:w-auto min-w-[240px]"
                >
                  <span>Více informací</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Benefits grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                <div className="bg-white/50 backdrop-blur-md p-6 md:p-8 border-2 border-primary-100">
                  <div className="text-primary-600 mb-4">
                    <Target size={32} />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-3">
                    Jasné cíle
                  </h3>
                  <p className="text-text-secondary leading-relaxed">
                    Společně definujeme, co pro tebe znamená smysluplný život a jaké kroky k němu povedou.
                  </p>
                </div>
                <div className="bg-white/50 backdrop-blur-md p-6 md:p-8 border-2 border-primary-100">
                  <div className="text-primary-600 mb-4">
                    <User size={32} />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-3">
                    Individuální přístup
                  </h3>
                  <p className="text-text-secondary leading-relaxed">
                    Každý jsme jiný. Přizpůsobíme se tvé konkrétní situaci a potřebám.
                  </p>
                </div>
                <div className="bg-white/50 backdrop-blur-md p-6 md:p-8 border-2 border-primary-100">
                  <div className="text-primary-600 mb-4">
                    <MessageSquare size={32} />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-3">
                    Konkrétní kroky
                  </h3>
                  <p className="text-text-secondary leading-relaxed">
                    Nejen teorie, ale praktické nástroje a akční plán, který můžeš hned začít používat.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reservation Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !isSubmitting && setShowModal(false)}
        >
          <div 
            className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              disabled={isSubmitting}
              className="absolute top-4 right-4 p-2 hover:bg-primary-50 transition-colors z-10"
              aria-label="Zavřít"
            >
              <X size={24} className="text-text-primary" />
            </button>

            {/* Modal content */}
            <div className="p-6 md:p-8 lg:p-12">
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
                Rezervace koučovacího sezení
              </h2>
              <p className="text-text-secondary mb-8">
                Vyplňte formulář a já se vám ozvu s konkrétním časem.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-2">
                    <User className="inline mr-2" size={16} />
                    Jméno
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-5 py-3 border-2 border-primary-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="Vaše jméno"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                    <Mail className="inline mr-2" size={16} />
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-5 py-3 border-2 border-primary-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="vas@email.cz"
                  />
                </div>

                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-text-primary mb-2">
                    <Calendar className="inline mr-2" size={16} />
                    Preferované datum
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-5 py-3 border-2 border-primary-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                  <p className="mt-2 text-sm text-text-secondary">
                    S konkrétním časem vás budu kontaktovat emailem.
                  </p>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-text-primary mb-2">
                    <MessageSquare className="inline mr-2" size={16} />
                    Zpráva (volitelné)
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-5 py-3 border-2 border-primary-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
                    placeholder="Napište mi, s čím vám mohu pomoci..."
                  />
                </div>

                {submitStatus.type && (
                  <div
                    className={`p-4 rounded-lg ${
                      submitStatus.type === 'success'
                        ? 'bg-green-50 text-green-800 border-2 border-green-200'
                        : 'bg-red-50 text-red-800 border-2 border-red-200'
                    }`}
                  >
                    {submitStatus.message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-8 py-4 bg-primary-600 text-white font-semibold text-lg hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>Odesílám...</span>
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      <span>Odeslat rezervaci</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
