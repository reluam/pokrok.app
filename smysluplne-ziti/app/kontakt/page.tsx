'use client'

import { useState } from 'react'
import { User, Mail, MessageSquare, Loader2, Send } from 'lucide-react'
import Link from 'next/link'

export default function KontaktPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
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
      const response = await fetch('/api/kontakt', {
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
          message: data.message || 'Děkujeme za vaši zprávu! Ozveme se vám co nejdříve.',
        })
        // Reset formuláře
        setFormData({
          name: '',
          email: '',
          message: '',
        })
      } else {
        setSubmitStatus({
          type: 'error',
          message: data.error || 'Nastala chyba při odesílání zprávy. Zkuste to prosím znovu.',
        })
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      setSubmitStatus({
        type: 'error',
        message: 'Nastala chyba při odesílání zprávy. Zkuste to prosím znovu.',
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
    <section className="section-padding relative overflow-hidden pt-20">
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-block px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-xs md:text-sm font-semibold mb-4 md:mb-6">
              Kontakt
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-text-primary mb-4 md:mb-6">
              <span className="gradient-text">Kontaktujte mě</span>
            </h1>
            <p className="text-base md:text-lg lg:text-xl xl:text-2xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
              Máte dotaz nebo zájem o spolupráci? Neváhejte mě kontaktovat.
            </p>
          </div>

          {/* Contact form */}
          <div className="space-y-6">
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
                  className="w-full px-5 py-3 border-2 border-primary-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white/50 backdrop-blur-sm"
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
                  className="w-full px-5 py-3 border-2 border-primary-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white/50 backdrop-blur-sm"
                  placeholder="vas@email.cz"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-text-primary mb-2">
                  <MessageSquare className="inline mr-2" size={16} />
                  Zpráva
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  required
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-5 py-3 border-2 border-primary-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white/50 backdrop-blur-sm resize-none"
                  placeholder="Napište mi vaši zprávu..."
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
                    Odeslat zprávu
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
    </section>
  )
}
