'use client'

import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/80 backdrop-blur-md shadow-lg border-b border-primary-100' 
        : 'bg-white/60 backdrop-blur-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex-shrink-0">
            <Link 
              href="/" 
              className="block relative h-12 w-auto hover:opacity-80 transition-opacity"
            >
              <Image
                src="/logo.png"
                alt="Smyslužití"
                width={200}
                height={48}
                className="object-contain h-12 w-auto"
                priority
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-1">
              {[
                { href: '/knihovna', label: 'Knihovna' },
                { href: '/aplikace', label: 'Aplikace Pokrok' },
                { href: '/coaching', label: 'Koučing' },
                { href: '/o-projektu', label: 'O smyslužití' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative px-4 py-2 text-sm font-medium text-text-primary hover:text-primary-600 transition-colors group"
                >
                  {item.label}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 transition-all group-hover:w-full"></span>
                </Link>
              ))}
            </div>
            <Link
              href="#newsletter"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-full transition-colors"
            >
              Připojit se ke komunitě
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-text-primary hover:text-primary-600 hover:bg-primary-50 focus:outline-none transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={`md:hidden transition-all duration-300 overflow-hidden ${
        isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="px-4 pt-2 pb-4 space-y-1 bg-white/95 backdrop-blur-md border-t border-primary-100">
          {[
            { href: '/knihovna', label: 'Knihovna' },
            { href: '/aplikace', label: 'Aplikace Pokrok' },
            { href: '/coaching', label: 'Koučing' },
            { href: '/o-projektu', label: 'O smyslužití' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-3 text-base font-medium text-text-primary hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
