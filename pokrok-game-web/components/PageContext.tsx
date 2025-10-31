'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface PageContextType {
  title: string
  subtitle: string
  setTitle: (title: string) => void
  setSubtitle: (subtitle: string) => void
}

const PageContext = createContext<PageContextType | undefined>(undefined)

export function PageProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState('Hlavní panel')
  const [subtitle, setSubtitle] = useState('Načítání...')

  return (
    <PageContext.Provider value={{ title, subtitle, setTitle, setSubtitle }}>
      {children}
    </PageContext.Provider>
  )
}

export function usePageContext() {
  const context = useContext(PageContext)
  if (context === undefined) {
    throw new Error('usePageContext must be used within a PageProvider')
  }
  return context
}
