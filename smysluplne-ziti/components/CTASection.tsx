'use client'

import { useEffect, useState } from 'react'
import { Phone, User, Mail, MessageSquare, Send, Loader2 } from 'lucide-react'

export default function CTASection() {
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

  // Add Calendly CSS
  useEffect(() => {
    const link = document.createElement('link')
    link.href = 'https://assets.calendly.com/assets/external/widget.css'
    link.rel = 'stylesheet'
    document.head.appendChild(link)
    
    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link)
      }
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
      const existingScript = document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]')
      if (existingScript) {
        document.body.removeChild(existingScript)
      }
    }
  }, [])

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
    <section id="konzultace" className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-primary-100/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-6">
            Změna začíná jedním <span className="gradient-text">upřímným rozhovorem</span>
          </h2>
          <p className="text-lg md:text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
            Můžeš si buď vybrat termín přímo v kalendáři, kdy si zavoláme přes Google Meet, nebo vyplnit formulář a já ti zavolám zpět na telefon, až budu moct.
          </p>
        </div>

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
          <div className="flex items-center justify-center">
            <div className="hidden lg:flex items-center justify-center h-full">
              <span className="text-text-secondary font-semibold text-lg bg-primary-100/50 px-4 py-2 rounded-full">nebo</span>
            </div>
            <div className="lg:hidden flex items-center gap-4 w-full">
              <div className="h-px bg-primary-200 flex-1"></div>
              <span className="text-text-secondary font-semibold">nebo</span>
              <div className="h-px bg-primary-200 flex-1"></div>
            </div>
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
                <label htmlFor="cta-name" className="block text-sm font-medium text-text-primary mb-2">
                  <User className="inline mr-2" size={16} />
                  Jméno a příjmení
                </label>
                <input
                  type="text"
                  id="cta-name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-5 py-3 border-2 border-primary-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all rounded-lg"
                  placeholder="Tvé jméno"
                />
              </div>

              <div>
                <label htmlFor="cta-email" className="block text-sm font-medium text-text-primary mb-2">
                  <Mail className="inline mr-2" size={16} />
                  Email
                </label>
                <input
                  type="email"
                  id="cta-email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-5 py-3 border-2 border-primary-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all rounded-lg"
                  placeholder="tvuj@email.cz"
                />
              </div>

              <div>
                <label htmlFor="cta-phone" className="block text-sm font-medium text-text-primary mb-2">
                  <Phone className="inline mr-2" size={16} />
                  Telefon (volitelné)
                </label>
                <input
                  type="tel"
                  id="cta-phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-5 py-3 border-2 border-primary-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all rounded-lg"
                  placeholder="+420 123 456 789"
                />
              </div>

              <div>
                <label htmlFor="cta-message" className="block text-sm font-medium text-text-primary mb-2">
                  <MessageSquare className="inline mr-2" size={16} />
                  Zpráva (volitelné)
                </label>
                <textarea
                  id="cta-message"
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
    </section>
  )
}
