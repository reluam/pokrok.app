'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  FileText, 
  Package, 
  Grid3X3, 
  Video, 
  LogOut, 
  Menu,
  X,
  Users,
  Settings,
  Home
} from 'lucide-react'

const adminSections = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Přehled administrace',
    icon: Home,
    href: '/admin',
    color: 'bg-primary-500',
    lightColor: 'bg-primary-50',
    textColor: 'text-primary-700'
  },
  {
    id: 'articles',
    title: 'Inspirace',
    description: 'Spravovat články a inspirace',
    icon: FileText,
    href: '/admin/articles',
    color: 'bg-primary-500',
    lightColor: 'bg-primary-50',
    textColor: 'text-primary-700'
  },
  {
    id: 'coaching-packages',
    title: 'Koučovací balíčky',
    description: 'Spravovat koučovací služby a balíčky',
    icon: Package,
    href: '/admin/coaching-packages',
    color: 'bg-primary-600',
    lightColor: 'bg-primary-100',
    textColor: 'text-primary-800'
  },
  {
    id: 'workshops',
    title: 'Workshopy',
    description: 'Spravovat workshopy a jejich obsah',
    icon: Users,
    href: '/admin/workshops',
    color: 'bg-purple-500',
    lightColor: 'bg-purple-50',
    textColor: 'text-purple-700'
  },
  {
    id: 'offer-sections',
    title: 'Nabídka služeb',
    description: 'Spravovat sekce nabídky (Inspirace, Zdroje, Koučing)',
    icon: Grid3X3,
    href: '/admin/offer-sections',
    color: 'bg-primary-700',
    lightColor: 'bg-primary-200',
    textColor: 'text-primary-900'
  },
  {
    id: 'video-content',
    title: 'Video obsah',
    description: 'Spravovat video na hlavní stránce',
    icon: Video,
    href: '/admin/video-content',
    color: 'bg-primary-400',
    lightColor: 'bg-primary-50',
    textColor: 'text-primary-600'
  },
  {
    id: 'settings',
    title: 'Nastavení',
    description: 'Spravovat nastavení webu a navigace',
    icon: Settings,
    href: '/admin/settings',
    color: 'bg-gray-500',
    lightColor: 'bg-gray-50',
    textColor: 'text-gray-700'
  }
]

interface AdminLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
}

export default function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST'
      })
      router.push('/admin/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const isActiveRoute = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-primary-100 bg-gradient-to-r from-primary-50 to-primary-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary-900 font-poppins">Admin Panel</h1>
              <p className="text-sm text-primary-600 font-asul">Smysluplné žití</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-primary-400 hover:text-primary-600 hover:bg-primary-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-4 flex-1">
          <div className="space-y-2">
            {adminSections.map((section) => {
              const isActive = isActiveRoute(section.href)
              return (
                <Link
                  key={section.id}
                  href={section.href}
                  className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group border ${
                    isActive 
                      ? `${section.lightColor} ${section.textColor} border-primary-200 shadow-sm` 
                      : 'hover:bg-gray-50 border-transparent hover:border-gray-200'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className={`p-2 rounded-lg mr-3 ${
                    isActive ? section.color : 'bg-gray-100 group-hover:bg-gray-200'
                  } text-white transition-all`}>
                    <section.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium font-poppins ${
                      isActive ? section.textColor : 'text-gray-900 group-hover:text-gray-700'
                    }`}>
                      {section.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 font-asul">
                      {section.description}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Logout Button */}
          <div className="mt-8 pt-6 border-t border-primary-100">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-gray-600 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors border border-transparent hover:border-red-200"
            >
              <LogOut className="w-5 h-5 mr-3" />
              <span className="font-medium">Odhlásit se</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar for mobile */}
        <div className="bg-white shadow-sm border-b border-primary-100 lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-primary-400 hover:text-primary-600 hover:bg-primary-50"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-primary-900 font-poppins">
              {title || 'Admin Panel'}
            </h1>
            <div className="w-10" /> {/* Spacer */}
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          {title && (
            <div className="hidden lg:block bg-white border-b border-gray-200 px-8 py-6">
              <div className="flex items-center space-x-4">
                <div>
                  <h1 className="text-h2 text-text-primary font-poppins">{title}</h1>
                  {description && (
                    <p className="text-asul16 text-gray-600 mt-1">{description}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}


