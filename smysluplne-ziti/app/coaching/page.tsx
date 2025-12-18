'use client'

import { useState } from 'react'
import { ArrowLeft, Calendar, User, Mail, MessageSquare, Loader2, Gift, Target } from 'lucide-react'
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
              Coaching
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6">
              <span className="gradient-text">Coaching</span>
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
              Pojďme společně prozkoumat vaše cíle, hodnoty a najít cestu k smysluplnějšímu životu.
            </p>
          </div>

          {/* Purpose of coaching sessions section */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 md:p-12 border border-primary-100">
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-6">
                Účel mých coachovacích sezení
              </h2>
              <div className="text-text-primary text-lg leading-relaxed space-y-4">
                <p>
                  Mým hlavním cílem je pomoci lidem žít více smysluplný život. Věřím, že každý z nás 
                  má potenciál najít svou vlastní cestu k naplnění a spokojenosti, ale často potřebujeme 
                  podporu a vedení, abychom objevili, co je pro nás skutečně důležité.
                </p>
                <p>
                  Během našich sezení společně prozkoumáme, co je pro vás v životě opravdu důležité. 
                  Pomůžu vám přijít na to, jaké hodnoty, cíle a sny vás skutečně naplňují, a pak 
                  najdeme konkrétní způsoby, jak toho v životě dosáhnout více.
                </p>
                <p>
                  Nejedná se o to, abych vám říkal, co máte dělat. Místo toho vám pomůžu najít 
                  vaše vlastní odpovědi a vytvořit akční plán, který vás posune vpřed. Společně 
                  identifikujeme překážky, které vás brzdí, a najdeme způsoby, jak je překonat.
                </p>
                <p>
                  Mým cílem je, abyste po našich sezeních měli:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Jasno v tom, co je pro vás v životě skutečně důležité</li>
                  <li>Konkrétní kroky, jak dosáhnout toho, co chcete</li>
                  <li>Větší smysl a naplnění v každodenním životě</li>
                  <li>Nástroje a strategie pro dlouhodobý osobní rozvoj</li>
                  <li>Větší sebedůvěru v tom, že dokážete dosáhnout svých cílů</li>
                </ul>
                <p>
                  Pokud hledáte způsob, jak žít více smysluplný život a mít více toho, co je pro vás 
                  důležité, jsem tu, abych vám pomohl na této cestě.
                </p>
              </div>
            </div>
          </div>

          {/* Coaching section */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 md:p-12 border border-primary-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-primary-100 p-4 rounded-xl">
                  <Target className="text-primary-600" size={32} />
                </div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-text-primary">Koučing</h2>
                  <p className="text-text-secondary">Profesionální podpora na vaší cestě</p>
                </div>
              </div>
              
              <p className="text-text-primary text-lg leading-relaxed mb-8">
                Pravidelná coaching sezení vám pomohou systematicky pracovat na vašich cílech, 
                budovat návyky a vytvářet trvalé změny ve vašem životě. Společně najdeme vaši 
                vlastní cestu k úspěchu a naplnění.
              </p>

              <div className="bg-primary-50 rounded-2xl p-6 mb-6">
                <h3 className="text-xl font-bold text-text-primary mb-4">Co zahrnuje:</h3>
                <ul className="space-y-2 text-text-primary">
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-3 text-xl font-bold">✓</span>
                    <span>Pravidelná sezení zaměřená na vaše cíle</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-3 text-xl font-bold">✓</span>
                    <span>Individuální přístup a podpora</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-3 text-xl font-bold">✓</span>
                    <span>Konkrétní akční plány a kroky</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-3 text-xl font-bold">✓</span>
                    <span>Kontinuální práce na vašem rozvoji</span>
                  </li>
                </ul>
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
                className="w-full bg-primary-600 text-white py-4 px-6 rounded-full font-semibold text-lg hover:bg-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] transform flex items-center justify-center gap-2"
              >
                <Target size={20} />
                Rezervovat koučing
              </button>
            </div>
          </div>

          {/* Free consultation section */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 md:p-12 border border-primary-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-playful-yellow-light p-4 rounded-xl">
                  <Gift className="text-primary-600" size={32} />
                </div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-text-primary">Konzultace zdarma</h2>
                  <p className="text-text-secondary">Zkuste si, jestli je to pro vás</p>
                </div>
              </div>
              
              <p className="text-text-primary text-lg leading-relaxed mb-8">
                Nevíte, jestli je coaching pro vás? Rezervujte si zdarma konzultační hodinu a zjistěte, 
                jak vám coaching může pomoci. Ozveme se vám s konkrétním časem.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
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
                    className="w-full px-5 py-3 border-2 border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white/50 backdrop-blur-sm"
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
                    className="w-full px-5 py-3 border-2 border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white/50 backdrop-blur-sm"
                    placeholder="vas@email.cz"
                  />
                </div>

                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-text-primary mb-2">
                    <Calendar className="inline mr-2" size={16} />
                    Preferovaný datum
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full px-5 py-3 border-2 border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white/50 backdrop-blur-sm"
                  />
                  <p className="text-sm text-text-light mt-2 flex items-start gap-1">
                    <span>ℹ️</span>
                    <span>Ozveme se vám s konkrétním časem na váš email.</span>
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
                    rows={3}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-5 py-3 border-2 border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white/50 backdrop-blur-sm"
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
                    <p className="font-medium text-sm">{submitStatus.message}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary-600 text-white py-3 px-6 rounded-full font-semibold hover:bg-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Odesílání...
                    </>
                  ) : (
                    <>
                      <Gift size={18} />
                      Rezervovat zdarma konzultaci
                    </>
                  )}
                </button>
              </form>
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
    </div>
  )
}
