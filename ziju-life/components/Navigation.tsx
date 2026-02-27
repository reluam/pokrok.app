"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import type React from "react";

export default function Navigation() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // Smooth scroll s easing funkcí pro anchor odkazy
    const handleSmoothScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.getAttribute('href')?.startsWith('#')) {
        e.preventDefault();
        e.stopPropagation(); // Zastaví další event handlery
        
        const targetId = link.getAttribute('href')?.substring(1);
        const targetElement = document.getElementById(targetId || '');
        
        if (targetElement) {
          const prefersReducedMotion = window.matchMedia?.(
            "(prefers-reduced-motion: reduce)"
          ).matches;

          // Uživatelé s reduced motion – okamžitý skok bez animace
          if (prefersReducedMotion) {
            const y =
              targetElement.getBoundingClientRect().top +
              window.pageYOffset -
              80;
            window.scrollTo(0, y);
            return;
          }

          const startPosition = window.pageYOffset;
          const targetPosition =
            targetElement.getBoundingClientRect().top + startPosition - 80; // Offset pro sticky header
          const distance = targetPosition - startPosition;

          // Jemnější časování (podobně plynulé jako na designingyour.life)
          const baseDuration = 650;
          const extraDuration = 350;
          const distanceFactor = Math.min(Math.abs(distance) / 1200, 1); // 0–1
          const duration = baseDuration + extraDuration * distanceFactor;

          let start: number | null = null;

          // Ease-in-out cubic pro ladný náběh i doběh
          const easeInOutCubic = (t: number): number =>
            t < 0.5
              ? 4 * t * t * t
              : 1 - Math.pow(-2 * t + 2, 3) / 2;

          const animateScroll = (currentTime: number) => {
            if (start === null) start = currentTime;
            const timeElapsed = currentTime - start;
            const progress = Math.min(timeElapsed / duration, 1);
            const easedProgress = easeInOutCubic(progress);

            window.scrollTo(0, startPosition + distance * easedProgress);

            if (progress < 1) {
              requestAnimationFrame(animateScroll);
            }
          };

          requestAnimationFrame(animateScroll);
        }
      }
    };

    // Použij capture phase pro okamžité zachycení
    document.addEventListener('click', handleSmoothScroll, true);
    return () => document.removeEventListener('click', handleSmoothScroll, true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY || window.pageYOffset;
      setIsScrolled(offset > 10);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems: Array<{ href: string; label: string; external?: boolean }> = [
    { href: "/inspirace", label: "Inspirace" },
    { href: "/koucing", label: "Koučing" },
    { href: "/o-mne", label: "O mně" },
  ];

  const isHome = pathname === "/";
  const navBase = "sticky top-3 md:top-5 z-50";
  const navSurface = "";

  const handleChciZmenuClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === "/koucing") {
      e.preventDefault();
      const targetElement = document.getElementById("rezervace");
      if (targetElement) {
        const prefersReducedMotion = window.matchMedia?.(
          "(prefers-reduced-motion: reduce)"
        ).matches;

        if (prefersReducedMotion) {
          targetElement.scrollIntoView({ behavior: "auto", block: "start" });
        } else {
          targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    }
  };

  return (
    <nav className={`${navBase} ${navSurface}`}>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14 md:h-16 rounded-[32px] border border-white/40 bg-white/60 shadow-lg backdrop-blur-xl backdrop-saturate-150 px-4 md:px-6 glass-grain">
          <Link href="/" className="flex items-center h-10 md:h-12">
            <Image
              src="/ziju-life-logo.png"
              alt="Žiju life"
              width={160}
              height={64}
              sizes="(max-width: 768px) 120px, 140px"
              className="h-10 md:h-12 w-auto"
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
              href="/koucing#rezervace"
              onClick={handleChciZmenuClick}
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
          <div className="md:hidden py-4 space-y-4 border-t border-black/5 text-center">
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
              href="/koucing#rezervace"
              onClick={(e) => {
                handleChciZmenuClick(e);
                setIsMenuOpen(false);
              }}
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
