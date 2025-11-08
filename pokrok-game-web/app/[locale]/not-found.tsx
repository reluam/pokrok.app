import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

export default async function NotFound() {
  const t = await getTranslations()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h2 className="text-2xl font-bold mb-4">{t('common.notFound') || 'Not Found'}</h2>
      <p className="mb-4">{t('common.pageNotFound') || 'Could not find requested resource'}</p>
      <Link
        href="/"
        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
      >
        {t('common.backToHome') || 'Return Home'}
      </Link>
    </div>
  )
}

