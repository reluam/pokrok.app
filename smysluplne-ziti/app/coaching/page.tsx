'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Calendar, User, Mail, MessageSquare, Loader2, X, Gift, Target, Send } from 'lucide-react'
import Link from 'next/link'
import Script from 'next/script'

export default function CoachingPage() {
  const [showFreeModal, setShowFreeModal] = useState(false)
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
          setShowFreeModal(false)
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
    <>
      <Script src="https://assets.calendly.com/assets/external/widget.js" strategy="lazyOnload" />
      <link href="https://assets.calendly.com/assets/external/widget.css" rel="stylesheet" />
      
      <section className="section-padding relative overflow-hidden pt-20">
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Back button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-primary-600 mb-8 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Zpět na hlavní stránku</span>
          </Link>

          {/* Main title */}
          <div className="mb-8 md:mb-12 text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-text-primary mb-4 md:mb-6 leading-tight px-4">
              <span className="gradient-text">Koučing</span>
            </h1>
            <p className="text-base md:text-lg lg:text-xl xl:text-2xl text-text-secondary max-w-3xl mx-auto leading-relaxed px-4">
              Pojďme společně prozkoumat vaše cíle, hodnoty a najít cestu k smysluplnějšímu životu.
            </p>
          </div>

          {/* Two column layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-12">
            {/* Placená konzultace - Calendly */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="bg-primary-100 p-3">
                  <Target className="text-primary-600" size={28} />
                </div>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-text-primary">
                  Koučing
                </h2>
              </div>
              <div className="text-base md:text-lg lg:text-xl leading-relaxed text-text-primary space-y-4">
                <p>
                  Individuální koučovací sezení zaměřené na váš osobní rozvoj a nalezení smysluplnosti v životě.
                </p>
                <ul className="space-y-2 text-sm md:text-base lg:text-lg">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-1">•</span>
                    <span>Projdeme oblasti, které chcete řešit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-1">•</span>
                    <span>Nastavíme konkrétní cíle a kroky</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-1">•</span>
                    <span>Získáte podporu při jejich dosahování</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined' && (window as any).Calendly) {
                    (window as any).Calendly.initPopupWidget({
                      url: 'https://calendly.com/smysluplne-ziti/smysluplny-balicek-10-sezeni'
                    })
                  }
                }}
                className="w-full bg-primary-600 text-white py-3 md:py-4 px-6 text-base md:text-lg font-semibold rounded-full hover:bg-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform flex items-center justify-center gap-2"
              >
                <Calendar size={20} />
                Rezervovat koučing
              </button>
            </div>

            {/* Úvodní konzultace zdarma */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="bg-primary-100 p-3">
                  <Gift className="text-primary-600" size={28} />
                </div>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-text-primary">
                  Úvodní konzultace zdarma
                </h2>
              </div>
              <div className="text-base md:text-lg lg:text-xl leading-relaxed text-text-primary space-y-4">
                <p>
                  Zkuste si zdarma, jestli je koučing pro vás. Bez závazků, bez rizika.
                </p>
                <ul className="space-y-2 text-sm md:text-base lg:text-lg">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-1">•</span>
                    <span>Projdeme oblasti, které byste chtěli řešit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-1">•</span>
                    <span>Zjistíme, jestli je koučing vůbec pro vás</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-1">•</span>
                    <span>Případně naplánujeme spolupráci</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => setShowFreeModal(true)}
                className="w-full bg-primary-600 text-white py-3 md:py-4 px-6 text-base md:text-lg font-semibold rounded-full hover:bg-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform flex items-center justify-center gap-2"
              >
                <Gift size={20} />
                Rezervovat konzultaci zdarma
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Modal for free consultation */}
      {showFreeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-text-primary">
                  Úvodní konzultace zdarma
                </h2>
                <button
                  onClick={() => {
                    setShowFreeModal(false)
                    setSubmitStatus({ type: null, message: '' })
                  }}
                  className="p-2 hover:bg-primary-50 rounded-full transition-colors"
                >
                  <X size={24} className="text-text-secondary" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-2">
                    <User className="inline mr-2" size={16} />
                    Jméno a příjmení
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
                    className={`p-4 ${
                      submitStatus.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    <p className="font-medium text-sm">{submitStatus.message}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary-600 text-white py-4 px-6 rounded-full font-semibold text-lg hover:bg-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Odesílání...
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      Odeslat rezervaci
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
