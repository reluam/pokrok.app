'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { X, Mail, Send, CheckCircle, AlertCircle } from 'lucide-react'

interface ContactModalProps {
  show: boolean
  onClose: () => void
}

type ContactType = 'bug' | 'request' | 'other'

export function ContactModal({
  show,
  onClose,
}: ContactModalProps) {
  const t = useTranslations('contact')
  const tCommon = useTranslations('common')
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [type, setType] = useState<ContactType>('other')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  if (!show || typeof window === 'undefined') return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMessage(t('validation.allFieldsRequired') || 'Všechna pole jsou povinná')
      setSubmitStatus('error')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setErrorMessage(t('validation.invalidEmail') || 'Neplatná e-mailová adresa')
      setSubmitStatus('error')
      return
    }

    setIsSubmitting(true)
    setSubmitStatus(null)
    setErrorMessage('')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          type,
          message: message.trim(),
        }),
      })

      if (response.ok) {
        setSubmitStatus('success')
        // Reset form
        setName('')
        setEmail('')
        setType('other')
        setMessage('')
      } else {
        const data = await response.json().catch(() => ({}))
        setErrorMessage(data.error || t('error.submitFailed') || 'Nepodařilo se odeslat zprávu')
        setSubmitStatus('error')
      }
    } catch (error) {
      console.error('Error submitting contact form:', error)
      setErrorMessage(t('error.submitFailed') || 'Nepodařilo se odeslat zprávu')
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setSubmitStatus(null)
      setErrorMessage('')
      setName('')
      setEmail('')
      setType('other')
      setMessage('')
      onClose()
    }
  }

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-[100]"
        onClick={handleClose}
      />
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b-2 border-primary-500 bg-primary-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-6 h-6 text-primary-600" />
                <h2 className="text-2xl font-bold text-black font-playful">
                  {t('title') || 'Kontakt'}
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-primary-100 transition-colors"
                disabled={isSubmitting}
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {submitStatus === 'success' ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                <h3 className="text-xl font-bold text-black font-playful mb-2">
                  {t('success.title') || 'Zpráva odeslána!'}
                </h3>
                <p className="text-gray-600 font-playful">
                  {t('success.message') || 'Děkujeme za vaši zprávu. Odpovíme vám co nejdříve.'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-black font-playful mb-2">
                    {t('form.name') || 'Jméno'} *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-primary-300 rounded-playful-md focus:outline-none focus:border-primary-500 font-playful"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-black font-playful mb-2">
                    {t('form.email') || 'E-mail'} *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-primary-300 rounded-playful-md focus:outline-none focus:border-primary-500 font-playful"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-semibold text-black font-playful mb-2">
                    {t('form.type') || 'Typ'} *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as ContactType)}
                    className="w-full px-4 py-2 border-2 border-primary-300 rounded-playful-md focus:outline-none focus:border-primary-500 font-playful bg-white"
                    required
                    disabled={isSubmitting}
                  >
                    <option value="bug">{t('form.typeBug') || 'Bug'}</option>
                    <option value="request">{t('form.typeRequest') || 'Požadavek'}</option>
                    <option value="other">{t('form.typeOther') || 'Jiné'}</option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-semibold text-black font-playful mb-2">
                    {t('form.message') || 'Zpráva'} *
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-2 border-2 border-primary-300 rounded-playful-md focus:outline-none focus:border-primary-500 font-playful resize-none"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {/* Error message */}
                {submitStatus === 'error' && errorMessage && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border-2 border-red-200 rounded-playful-md">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-700 font-playful">{errorMessage}</p>
                  </div>
                )}

                {/* Submit button */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-playful-md hover:bg-gray-200 transition-colors font-playful font-semibold"
                    disabled={isSubmitting}
                  >
                    {tCommon('cancel') || 'Zrušit'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-6 py-2 rounded-playful-md font-playful font-semibold flex items-center gap-2 transition-colors ${
                      isSubmitting
                        ? 'bg-primary-300 cursor-not-allowed text-white'
                        : 'bg-primary-500 text-black hover:bg-primary-600'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        {t('form.sending') || 'Odesílám...'}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        {t('form.send') || 'Odeslat'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

