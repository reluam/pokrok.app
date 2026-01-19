'use client'

import { useState } from 'react'
import { Send, Loader2, Users, ArrowRight } from 'lucide-react'
import Link from 'next/link'

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
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-12 md:mb-16 text-center">
          Zůstaňme ve <span className="gradient-text">spojení</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Left: Community */}
          <div className="bg-white rounded-lg p-8 md:p-12 border border-primary-100 shadow-lg animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Users className="text-primary-600" size={24} />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-text-primary">
                Komunita
              </h2>
            </div>
            <p className="text-lg text-text-secondary mb-6 leading-relaxed">
              Připoj se k lidem na stejné cestě. Sdílej své pokroky a vzájemně se podporujme v naší komunitě na platformě Skool.
            </p>
            <a
              href="https://www.skool.com/smysluziti-9755"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-full hover:bg-primary-700 transition-all"
            >
              <span>Vstoupit do komunity</span>
              <ArrowRight size={18} />
            </a>
          </div>

          {/* Right: Newsletter */}
          <div className="bg-white rounded-lg p-8 md:p-12 border border-primary-100 shadow-lg animate-fade-in-up">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
              Newsletter
            </h2>
            <p className="text-lg text-text-secondary mb-6 leading-relaxed">
              Každý čtvrtek posílám jeden report z mých experimentů, který ti pomůže se zastavit.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
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
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-full hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
      </div>
    </section>
  )
}
