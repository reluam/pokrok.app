import { SignUp } from '@clerk/nextjs'
import { getTranslations } from 'next-intl/server'

export default async function SignUpPage() {
  const t = await getTranslations()

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-orange-600 mb-2">
            {t('app.name')}
          </h1>
          <p className="text-gray-600">
            Zaregistrujte se a začněte plánovat svůj život
          </p>
        </div>
        <SignUp
          appearance={{
            elements: {
              formButtonPrimary: 'bg-orange-500 hover:bg-orange-600 text-white text-sm normal-case',
              card: 'shadow-xl border border-orange-100',
              headerTitle: 'text-gray-900',
              headerSubtitle: 'text-gray-600',
              identityPreviewText: 'text-gray-600',
              formFieldLabel: 'text-gray-700',
              formFieldInput: 'border-gray-300 focus:border-orange-500 focus:ring-orange-500',
              footerActionLink: 'text-orange-600 hover:text-orange-700',
              socialButtonsBlockButton: 'border-gray-300 hover:bg-orange-50',
            }
          }}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/planner"
        />
      </div>
    </div>
  )
}

