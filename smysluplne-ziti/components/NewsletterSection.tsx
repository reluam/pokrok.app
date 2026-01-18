'use client'

import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'

export default function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setStatus({ type: null, message: '' })

    try {
      // TODO: Implement newsletter subscription API
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        setStatus({
          type: 'success',
          message: 'Děkujeme! Brzy ti přijde potvrzovací email.',
        })
        setEmail('')
      } else {
        setStatus({
          type: 'error',
          message: 'Něco se pokazilo. Zkuste to prosím znovu.',
        })
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Něco se pokazilo. Zkuste to prosím znovu.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="newsletter" className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-primary-100/50">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg p-8 md:p-12 border border-primary-100 shadow-lg animate-fade-in-up">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-6 text-center">
            Jaký je tvůj smysl?
          </h2>
          <p className="text-lg md:text-xl text-text-secondary mb-8 text-center leading-relaxed">
            Nehledej správnou odpověď. Hledej směr. Každý čtvrtek posílám jeden report z mých experimentů, který ti pomůže se zastavit.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vas@email.cz"
                required
                className="w-full px-5 py-3 border-2 border-primary-200 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-primary-600 text-white font-semibold rounded-full hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Odesílám...</span>
                </>
              ) : (
                <>
                  <Send size={20} />
                  <span>Chci odebírat</span>
                </>
              )}
            </button>
          </form>
          {status.type && (
            <div
              className={`mt-6 p-4 rounded-lg ${
                status.type === 'success'
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {status.message}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
