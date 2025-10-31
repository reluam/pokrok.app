'use client'

import { usePathname } from 'next/navigation'
import { CestaLayout } from './CestaLayout'
import { PageProvider, usePageContext } from './PageContext'

interface DynamicCestaLayoutProps {
  children: React.ReactNode
}

function DynamicCestaLayoutContent({ children }: DynamicCestaLayoutProps) {
  const pathname = usePathname()
  const { title, subtitle } = usePageContext()

  // Don't show layout for game pages
  if (pathname.includes('/muj/game')) {
    return <>{children}</>
  }

  return (
    <CestaLayout 
      title={title}
      subtitle={subtitle}
      currentPage={pathname}
    >
      {children}
    </CestaLayout>
  )
}

export function DynamicCestaLayout({ children }: DynamicCestaLayoutProps) {
  return (
    <PageProvider>
      <DynamicCestaLayoutContent>
        {children}
      </DynamicCestaLayoutContent>
    </PageProvider>
  )
}
