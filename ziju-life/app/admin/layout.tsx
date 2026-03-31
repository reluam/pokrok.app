import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { verifySession } from '@/lib/auth'
import AdminShell from '@/components/admin/AdminShell'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''

  // Don't redirect if we're already on the login page
  const isLoginPage = pathname === '/admin/login'

  if (!isLoginPage) {
    const isAuthenticated = await verifySession()

    if (!isAuthenticated) {
      redirect('/admin/login')
    }
  }

  return <AdminShell>{children}</AdminShell>
}
