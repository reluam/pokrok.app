'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Newspaper, KanbanSquare, BarChart3, Rss, ArrowLeft } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin/pipeline', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/pipeline/feed', label: 'Feed', icon: Newspaper },
  { href: '/admin/pipeline/kanban', label: 'Pipeline', icon: KanbanSquare },
  { href: '/admin/pipeline/stats', label: 'Statistiky', icon: BarChart3 },
  { href: '/admin/pipeline/sources', label: 'Zdroje', icon: Rss },
]

export default function PipelineLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a', color: '#e5e5e5' }}>
      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b" style={{ background: '#0a0a0a', borderColor: '#2a2a2a' }}>
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center gap-6">
          <Link href="/admin" className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity" style={{ color: '#888' }}>
            <ArrowLeft size={16} />
            Admin
          </Link>
          <div className="h-5 w-px" style={{ background: '#2a2a2a' }} />
          <span className="font-semibold text-sm">Knowledge Pipeline</span>
          <nav className="flex items-center gap-1 ml-6">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                  style={{
                    background: isActive ? '#1a1a1a' : 'transparent',
                    color: isActive ? '#e5e5e5' : '#888',
                  }}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[1400px] mx-auto px-6 py-6">
        {children}
      </main>
    </div>
  )
}
