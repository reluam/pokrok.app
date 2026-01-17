'use client'

import { useState, useEffect } from 'react'
import { Calendar, User, Mail, MessageSquare, Loader2, Send, ArrowRight, Sparkles, Compass, ArrowDown, Phone } from 'lucide-react'

export default function CoachingPage() {
  // Add Calendly CSS
  useEffect(() => {
    const link = document.createElement('link')
    link.href = 'https://assets.calendly.com/assets/external/widget.css'
    link.rel = 'stylesheet'
    document.head.appendChild(link)
    
    return () => {
      document.head.removeChild(link)
    }
  }, [])

  // Load Calendly script
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://assets.calendly.com/assets/external/widget.js'
    script.async = true
    script.type = 'text/javascript'
    document.body.appendChild(script)
    
    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]')
      if (existingScript) {
        document.body.removeChild(existingScript)
      }
    }
  }, [])
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
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
          message: data.message || 'Děkuji za tvou zprávu! Zavolám ti zpět, až budu moct.',
        })
        setFormData({
          name: '',
          email: '',
          phone: '',
          message: '',
        })
      } else {
        setSubmitStatus({
          type: 'error',
          message: data.error || 'Nastala chyba při odesílání. Zkus to prosím znovu.',
        })
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      setSubmitStatus({
        type: 'error',
        message: 'Nastala chyba při odesílání. Zkus to prosím znovu.',
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
      <section className="section-padding relative overflow-hidden pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Hero Section */}
          <div className="text-center mb-16 md:mb-20">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-text-primary mb-6 md:mb-8 leading-tight">
              Nehledej smysl ve vesmíru.<br />
              Najdi ho ve svých dnech.
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-text-secondary max-w-4xl mx-auto leading-relaxed mb-8 md:mb-10">
              Koučink se mnou je o tom, jak vzít svůj život do vlastních rukou, uklidit chaos v hlavě a začít dělat kroky, které dávají smysl tobě – ne tvému okolí.
            </p>
            <a
              href="#rezervace"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary-600 text-white font-semibold text-lg rounded-full hover:bg-primary-700 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105"
            >
              <span>Rezervovat nezávaznou konzultaci</span>
              <ArrowDown size={20} className="group-hover:translate-y-1 transition-transform" />
            </a>
          </div>


          {/* S čím ti pomůžu */}
          <div className="mb-20 md:mb-24">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-12 md:mb-16 text-center">
              S čím ti pomůžu
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {/* Karta 1: Zmatek a přehlcení */}
              <div className="bg-white/80 backdrop-blur-sm p-6 md:p-8 border-2 border-primary-100 rounded-lg hover:border-primary-300 transition-all duration-300">
                <div className="text-primary-600 mb-4">
                  <Sparkles size={32} />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-4">
                  Zmatek a přehlcení
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  Máš milion nápadů a úkolů, ale nevíš, kam dřív skočit? Pomůžu ti určit priority a vrátit se k tomu podstatnému.
                </p>
              </div>

              {/* Karta 2: Hledání směru */}
              <div className="bg-white/80 backdrop-blur-sm p-6 md:p-8 border-2 border-primary-100 rounded-lg hover:border-primary-300 transition-all duration-300">
                <div className="text-primary-600 mb-4">
                  <Compass size={32} />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-4">
                  Hledání směru
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  Žiješ podle cizích očekávání? Najdeme tvůj vlastní &apos;vnitřní kompas&apos;, aby ses už nemusel ptát, jestli to, co děláš, má cenu.
                </p>
              </div>

              {/* Karta 3: Akce z abstrakce */}
              <div className="bg-white/80 backdrop-blur-sm p-6 md:p-8 border-2 border-primary-100 rounded-lg hover:border-primary-300 transition-all duration-300">
                <div className="text-primary-600 mb-4">
                  <ArrowDown size={32} />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-4">
                  Akce z abstrakce
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  Jsi zaseknutý ve svých myšlenkách? Převedeme tvé vize do konkrétních malých kroků, které zvládneš udělat hned zítra.
                </p>
              </div>
            </div>
          </div>

          {/* Můj přístup */}
          <div className="mb-20 md:mb-24">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-6 md:mb-8 text-center">
              Společná cesta Smyslužitím
            </h2>
            <div className="max-w-4xl mx-auto">
              <p className="text-lg md:text-xl lg:text-2xl text-text-secondary leading-relaxed text-center">
                Kombinuji principy vědomého žití, moderní psychologie a neurovědy s praktickými nástroji (jako je i moje aplikace Pokrok). Nebudu ti říkat, co máš dělat, ale budu tvým parťákem a zrcadlem, ve kterém najdeš řešení, které už někde v sobě máš.
              </p>
            </div>
          </div>

          {/* Jak to probíhá */}
          <div className="mb-20 md:mb-24">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-12 md:mb-16 text-center">
              Jak to probíhá
            </h2>
            <div className="max-w-3xl mx-auto space-y-8 md:space-y-10">
              {/* Krok 1 */}
              <div className="flex gap-6 md:gap-8">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-bold text-lg md:text-xl">1</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-3">
                    Úvodní konzultace (Zdarma)
                  </h3>
                  <p className="text-text-secondary leading-relaxed">
                    20 minut, kde zjistíme, jestli si lidsky sedneme. Bez tlaku, bez závazků.
                  </p>
                </div>
              </div>

              {/* Krok 2 */}
              <div className="flex gap-6 md:gap-8">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-bold text-lg md:text-xl">2</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-3">
                    Definice záměru
                  </h3>
                  <p className="text-text-secondary leading-relaxed">
                    Ujasníme si, co přesně má být výsledkem naší spolupráce.
                  </p>
                </div>
              </div>

              {/* Krok 3 */}
              <div className="flex gap-6 md:gap-8">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-bold text-lg md:text-xl">3</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-3">
                    Pravidelná sezení
                  </h3>
                  <p className="text-text-secondary leading-relaxed">
                    60 minut soustředěné práce na tvých tématech.
                  </p>
                </div>
              </div>

              {/* Krok 4 */}
              <div className="flex gap-6 md:gap-8">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-bold text-lg md:text-xl">4</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-3">
                    Podpora mezi sezeními
                  </h3>
                  <p className="text-text-secondary leading-relaxed">
                    Možnost sdílet pokroky nebo záseky, abychom neztratili tempo.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Section */}
          <div id="rezervace" className="mb-20 md:mb-24 scroll-mt-20">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-text-primary mb-4 md:mb-6 text-center">
              Domluvme si nezávaznou konzultaci
            </h2>
            <p className="text-lg md:text-xl text-text-secondary text-center max-w-4xl mx-auto mb-8 md:mb-12 leading-relaxed">
              Můžeš si buď vybrat termín přímo v kalendáři, kdy si zavoláme přes Google Meet, nebo vyplnit formulář a já ti zavolám zpět na telefon, až budu moct.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-8 md:gap-12 items-start">
              {/* Left: Calendly Widget */}
              <div className="bg-white/80 backdrop-blur-sm p-4 md:p-6 border-2 border-primary-100 rounded-lg">
                <div 
                  className="calendly-inline-widget" 
                  data-url="https://calendly.com/smysluplne-ziti/smysluplny-balicek-10-sezeni?hide_event_type_details=1&hide_gdpr_banner=1"
                  style={{ minWidth: '320px', height: '700px' }}
                ></div>
              </div>

              {/* "nebo" divider */}
              <div className="flex items-center justify-center lg:py-8">
                <div className="lg:hidden flex items-center gap-4 w-full">
                  <div className="h-px bg-primary-200 flex-1"></div>
                  <span className="text-text-secondary font-semibold">nebo</span>
                  <div className="h-px bg-primary-200 flex-1"></div>
                </div>
                <span className="hidden lg:inline text-text-secondary font-semibold text-lg">nebo</span>
              </div>

              {/* Right: Contact Form */}
              <div className="bg-white/80 backdrop-blur-sm p-8 md:p-10 border-2 border-primary-100 rounded-lg">
                <Phone className="text-primary-600 mb-4" size={48} />
                <h3 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
                  Zavolám ti zpět
                </h3>
                <p className="text-text-secondary mb-6 leading-relaxed">
                  Zanech mi kontakt a já se ti ozvu, až budu moct.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
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
                      className="w-full px-5 py-3 border-2 border-primary-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all rounded-lg"
                      placeholder="Tvé jméno"
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
                      className="w-full px-5 py-3 border-2 border-primary-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all rounded-lg"
                      placeholder="tvuj@email.cz"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-text-primary mb-2">
                      <Phone className="inline mr-2" size={16} />
                      Telefon (volitelné)
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-5 py-3 border-2 border-primary-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all rounded-lg"
                      placeholder="+420 123 456 789"
                    />
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
                      className="w-full px-5 py-3 border-2 border-primary-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none rounded-lg"
                      placeholder="Napiš mi, s čím ti mohu pomoci..."
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
                      <p className="font-medium text-sm">{submitStatus.message}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary-600 text-white py-4 px-6 font-semibold text-lg hover:bg-primary-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded-full"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Odesílání...
                      </>
                    ) : (
                      <>
                        <Send size={20} />
                        Odeslat kontakt
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

    </>
  )
}
