import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { verifySession } from '@/lib/auth'
import AdminNavigation from '@/components/admin/AdminNavigation'

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

  // If on login page, render without navigation (login has its own layout)
  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen bg-[#FFFAF5]">
      <AdminNavigation />
      <main className="flex-1 ml-64 p-8 min-h-screen">
        {children}
      </main>
    </div>
  )
}
