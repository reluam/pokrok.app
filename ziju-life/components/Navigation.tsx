"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Navigation() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // Smooth scroll s easing funkcí pro anchor odkazy
    const handleSmoothScroll = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.getAttribute('href')?.startsWith('#')) {
        e.preventDefault();
        e.stopPropagation(); // Zastaví další event handlery
        
        const targetId = link.getAttribute('href')?.substring(1);
        const targetElement = document.getElementById(targetId || '');
        
        if (targetElement) {
          // Začni scroll okamžitě, bez čekání
          const startPosition = window.pageYOffset;
          const targetPosition = targetElement.getBoundingClientRect().top + startPosition - 80; // Offset pro sticky header
          const distance = targetPosition - startPosition;
          const duration = Math.min(Math.abs(distance) * 0.5, 600); // Jednodušší timing
          let start: number | null = null;

          // Jednoduchá ease-out funkce pro plynulost
          const easeOut = (t: number): number => {
            return 1 - Math.pow(1 - t, 2); // Jednoduchá kvadratická ease-out
          };

          const animateScroll = (currentTime: number) => {
            if (start === null) start = currentTime;
            const timeElapsed = currentTime - start;
            const progress = Math.min(timeElapsed / duration, 1);
            const easedProgress = easeOut(progress);
            
            window.scrollTo(0, startPosition + distance * easedProgress);
            
            if (progress < 1) {
              requestAnimationFrame(animateScroll);
            }
          };

          // Spusť animaci okamžitě
          requestAnimationFrame(animateScroll);
        }
      }
    };

    // Použij capture phase pro okamžité zachycení
    document.addEventListener('click', handleSmoothScroll, true);
    return () => document.removeEventListener('click', handleSmoothScroll, true);
  }, []);

  const navItems: Array<{ href: string; label: string; external?: boolean }> = [
    { href: "/blog", label: "Blog" },
    { href: "/komunita", label: "Komunita" },
    { href: "/koucing", label: "Koučing" },
    { href: "/o-mne", label: "O mně" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/50 backdrop-blur-sm border-b-2 border-black/10 paper-texture">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center h-12 md:h-16">
            <Image
              src="/ziju-life-logo.png"
              alt="Žiju life"
              width={160}
              height={64}
              className="h-12 md:h-14 w-auto"
              priority
            />
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {navItems.map((item) => {
              const isActive = !item.external && (pathname === item.href || 
                (item.href !== "/" && pathname?.startsWith(item.href)));
              
              if (item.external) {
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-base transition-colors ${
                      isActive
                        ? "text-accent font-semibold"
                        : "text-foreground/70 hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </a>
                );
              }
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-base transition-colors ${
                    isActive
                      ? "text-accent font-medium"
                      : "text-foreground/70 hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            
            <Link
              href="/koucing"
              className="btn-playful px-4 py-2 bg-accent text-white rounded-full text-base font-semibold hover:bg-accent-hover transition-colors whitespace-nowrap shadow-md hover:shadow-lg"
            >
              Chci změnu
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-foreground"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-4 border-t border-black/5">
            {navItems.map((item) => {
              const isActive = !item.external && (pathname === item.href || 
                (item.href !== "/" && pathname?.startsWith(item.href)));
              
              if (item.external) {
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMenuOpen(false)}
                    className={`block py-2 text-base transition-colors ${
                      isActive
                        ? "text-accent font-semibold"
                        : "text-foreground/70 hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </a>
                );
              }
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block py-2 text-base transition-colors ${
                    isActive
                      ? "text-accent font-medium"
                      : "text-foreground/70 hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/koucing"
              onClick={() => setIsMenuOpen(false)}
              className="block px-4 py-2 bg-accent text-white rounded-full text-base font-semibold hover:bg-accent-hover transition-colors text-center"
            >
              Chci změnu
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
