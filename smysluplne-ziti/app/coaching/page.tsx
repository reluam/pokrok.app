'use client'

import { useState } from 'react'
import { ArrowLeft, Calendar, User, Mail, MessageSquare, Loader2, Gift, Target, X } from 'lucide-react'
import Link from 'next/link'
import Script from 'next/script'

declare global {
  interface Window {
    Calendly: {
      initPopupWidget: (options: {
        url: string
      }) => void
    }
  }
}

export default function CoachingPage() {
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
  const [showFreeConsultationForm, setShowFreeConsultationForm] = useState(false)

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
        body: JSON.stringify({
          ...formData,
          type: 'free', // Označení že jde o free konzultaci
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitStatus({
          type: 'success',
          message: data.message || 'Děkujeme za váš zájem! Ozveme se vám s konkrétním časem.',
        })
        // Reset formuláře
        setFormData({
          name: '',
          email: '',
          date: '',
          message: '',
        })
        // Zavřít modál po 3 sekundách
        setTimeout(() => {
          setShowFreeConsultationForm(false)
          setSubmitStatus({ type: null, message: '' })
        }, 3000)
      } else {
        setSubmitStatus({
          type: 'error',
          message: data.error || 'Nastala chyba při odesílání rezervace. Zkuste to prosím znovu.',
        })
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      setSubmitStatus({
        type: 'error',
        message: 'Nastala chyba při odesílání rezervace. Zkuste to prosím znovu.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }


  return (
    <div className="min-h-screen bg-background">
      <section className="section-padding relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-playful-purple-light rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-playful-pink-light rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="max-w-7xl mx-auto container-padding relative">
          {/* Back button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-primary-600 mb-8 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Zpět na hlavní stránku</span>
          </Link>

          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-semibold mb-6">
              Koučing
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6">
              <span className="gradient-text">Koučing</span>
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
              Pojďme společně prozkoumat vaše cíle, hodnoty a najít cestu k smysluplnějšímu životu.
            </p>
          </div>

          {/* Two column layout: Koučing and Free Consultation */}
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Koučing section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 md:p-10 border border-primary-100 flex flex-col">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-primary-100 p-3 rounded-xl">
                    <Target className="text-primary-600" size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-text-primary">Koučing</h2>
                    <p className="text-text-secondary text-sm">Dej svému životu více smyslu</p>
                  </div>
                </div>
                
                <p className="text-text-primary text-base mb-6 leading-relaxed">
                  Pomůžu vám objevit, co je pro vás v životě skutečně důležité, a najít cestu k většímu naplnění.
                </p>
              </div>

              <div className="space-y-4 mb-6 flex-grow">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-600 font-bold text-sm">✓</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-text-primary mb-1">Jasno v tom, co je důležité</h3>
                    <p className="text-text-secondary text-sm">Společně prozkoumáme vaše hodnoty, cíle a sny.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-600 font-bold text-sm">✓</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-text-primary mb-1">Konkrétní kroky vpřed</h3>
                    <p className="text-text-secondary text-sm">Vytvoříme akční plán, který vás posune vpřed.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-600 font-bold text-sm">✓</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-text-primary mb-1">Nástroje pro rozvoj</h3>
                    <p className="text-text-secondary text-sm">Získáte strategie pro trvalé změny.</p>
                  </div>
                </div>
              </div>

              {/* Calendly button */}
              <button
                onClick={() => {
                  if (typeof window !== 'undefined' && window.Calendly) {
                    window.Calendly.initPopupWidget({
                      url: 'https://calendly.com/smysluplne-ziti/smysluplny-balicek-10-sezeni'
                    })
                  }
                }}
                className="w-full bg-primary-600 text-white py-3 px-6 rounded-full font-semibold text-base hover:bg-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] transform flex items-center justify-center gap-2 mt-auto"
              >
                <Target size={18} />
                Rezervovat koučing
              </button>
            </div>

            {/* Free consultation section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 md:p-10 border border-primary-100 flex flex-col">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-playful-yellow-light p-3 rounded-xl">
                    <Gift className="text-primary-600" size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-text-primary">Konzultace zdarma</h2>
                    <p className="text-text-secondary text-sm">Zkuste si, jestli je to pro vás</p>
                  </div>
                </div>
                
                <p className="text-text-primary text-base mb-6 leading-relaxed">
                  Nevíte, jestli je coaching pro vás? Rezervujte si zdarma konzultační hodinu a zjistěte, 
                  jak vám coaching může pomoci.
                </p>
              </div>

              <div className="space-y-4 mb-6 flex-grow">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-6 h-6 rounded-full bg-playful-yellow-light flex items-center justify-center">
                      <span className="text-primary-600 font-bold text-sm">✓</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-text-primary mb-1">Projdeme oblasti k řešení</h3>
                    <p className="text-text-secondary text-sm">Společně identifikujeme oblasti, které byste chtěl řešit.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-6 h-6 rounded-full bg-playful-yellow-light flex items-center justify-center">
                      <span className="text-primary-600 font-bold text-sm">✓</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-text-primary mb-1">Zjistíme, jestli je coaching pro vás</h3>
                    <p className="text-text-secondary text-sm">Pomůžu vám zjistit, jestli je coaching vhodný způsob podpory.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-6 h-6 rounded-full bg-playful-yellow-light flex items-center justify-center">
                      <span className="text-primary-600 font-bold text-sm">✓</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-text-primary mb-1">Naplánujeme spolupráci</h3>
                    <p className="text-text-secondary text-sm">Pokud to bude dávat smysl, naplánujeme další kroky.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowFreeConsultationForm(true)}
                className="w-full bg-primary-600 text-white py-3 px-6 rounded-full font-semibold hover:bg-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] transform flex items-center justify-center gap-2 mt-auto"
              >
                <Gift size={18} />
                Rezervovat zdarma konzultaci
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Calendly scripts */}
      <link href="https://assets.calendly.com/assets/external/widget.css" rel="stylesheet" />
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="afterInteractive"
      />

      {/* Modal for Free Consultation Form */}
      {showFreeConsultationForm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowFreeConsultationForm(false)
              setSubmitStatus({ type: null, message: '' })
            }
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
            {/* Close button */}
            <button
              onClick={() => {
                setShowFreeConsultationForm(false)
                setSubmitStatus({ type: null, message: '' })
              }}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
              aria-label="Zavřít"
            >
              <X size={24} className="text-text-secondary" />
            </button>

            {/* Modal content */}
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-playful-yellow-light p-3 rounded-xl">
                  <Gift className="text-primary-600" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-text-primary">Konzultace zdarma</h2>
                  <p className="text-text-secondary text-sm">Rezervujte si zdarma konzultační hodinu</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="modal-name" className="block text-sm font-medium text-text-primary mb-2">
                    <User className="inline mr-2" size={16} />
                    Jméno a příjmení
                  </label>
                  <input
                    type="text"
                    id="modal-name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-5 py-3 border-2 border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-base"
                    placeholder="Vaše jméno"
                  />
                </div>

                <div>
                  <label htmlFor="modal-email" className="block text-sm font-medium text-text-primary mb-2">
                    <Mail className="inline mr-2" size={16} />
                    Email
                  </label>
                  <input
                    type="email"
                    id="modal-email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-5 py-3 border-2 border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-base"
                    placeholder="vas@email.cz"
                  />
                </div>

                <div>
                  <label htmlFor="modal-date" className="block text-sm font-medium text-text-primary mb-2">
                    <Calendar className="inline mr-2" size={16} />
                    Preferovaný datum
                  </label>
                  <input
                    type="date"
                    id="modal-date"
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full px-5 py-3 border-2 border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-base"
                  />
                  <p className="text-sm text-text-light mt-2 flex items-start gap-1">
                    <span>ℹ️</span>
                    <span>Ozveme se vám s konkrétním časem na váš email.</span>
                  </p>
                </div>

                <div>
                  <label htmlFor="modal-message" className="block text-sm font-medium text-text-primary mb-2">
                    <MessageSquare className="inline mr-2" size={16} />
                    Zpráva (volitelné)
                  </label>
                  <textarea
                    id="modal-message"
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-5 py-3 border-2 border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-base"
                    placeholder="Napište nám, s čím vám můžeme pomoci..."
                  />
                </div>

                {submitStatus.type && (
                  <div
                    className={`p-4 rounded-xl ${
                      submitStatus.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    <p className="font-medium">{submitStatus.message}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowFreeConsultationForm(false)
                      setSubmitStatus({ type: null, message: '' })
                    }}
                    className="flex-1 bg-gray-100 text-text-primary py-3 px-6 rounded-full font-semibold hover:bg-gray-200 transition-all duration-300"
                  >
                    Zrušit
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-full font-semibold hover:bg-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Odesílání...
                      </>
                    ) : (
                      <>
                        <Gift size={18} />
                        Odeslat rezervaci
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
