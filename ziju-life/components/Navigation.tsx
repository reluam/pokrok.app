"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Navigation() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const transparentNavPrefixes = ["/koucing", "/knihovna", "/o-mne"];
  const hasTransparentNav = pathname === "/" || transparentNavPrefixes.some(p => pathname?.startsWith(p));

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleSmoothScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      if (link && link.getAttribute('href')?.startsWith('#')) {
        const SCROLL_OFFSET = 120;
        e.preventDefault();
        e.stopPropagation();
        const targetId = link.getAttribute('href')?.substring(1);
        const targetElement = document.getElementById(targetId || '');
        if (targetElement) {
          const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
          if (prefersReducedMotion) {
            const y = targetElement.getBoundingClientRect().top + window.pageYOffset - SCROLL_OFFSET;
            window.scrollTo(0, y);
            return;
          }
          const startPosition = window.pageYOffset;
          const targetPosition = targetElement.getBoundingClientRect().top + startPosition - SCROLL_OFFSET;
          const distance = targetPosition - startPosition;
          const baseDuration = 650;
          const extraDuration = 350;
          const distanceFactor = Math.min(Math.abs(distance) / 1200, 1);
          const duration = baseDuration + extraDuration * distanceFactor;
          let start: number | null = null;
          const easeInOutCubic = (t: number): number =>
            t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          const animateScroll = (currentTime: number) => {
            if (start === null) start = currentTime;
            const timeElapsed = currentTime - start;
            const progress = Math.min(timeElapsed / duration, 1);
            window.scrollTo(0, startPosition + distance * easeInOutCubic(progress));
            if (progress < 1) requestAnimationFrame(animateScroll);
          };
          requestAnimationFrame(animateScroll);
        }
      }
    };
    document.addEventListener('click', handleSmoothScroll, true);
    return () => document.removeEventListener('click', handleSmoothScroll, true);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const navItems: Array<{ href: string; label: string }> = [
    { href: "/koucing", label: "Koučing" },
    { href: "/knihovna", label: "Knihovna" },
    { href: "/o-mne", label: "O mně" },
  ];

  const showSolid = !hasTransparentNav || isScrolled;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-2">
        <div
          className={`max-w-5xl mx-auto flex items-center justify-between h-14 md:h-16 rounded-full px-5 md:px-6 transition-all duration-500 ease-out relative ${
            showSolid
              ? "bg-white/95 backdrop-blur-md shadow-lg shadow-black/[0.06] border border-outline/60"
              : "bg-transparent"
          }`}
        >
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

          {/* Desktop Navigation — centered links */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8 absolute left-1/2 -translate-x-1/2">
            {navItems.map((item) => {
              const isActive = item.href.startsWith("/#")
                ? false
                : pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-display font-bold transition-colors ${
                    isActive ? "text-primary" : "text-foreground/70 hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Desktop right side — CTA */}
          <div className="hidden md:flex items-center">
            <Link
              href="/koucing#rezervace"
              className="btn-playful !px-5 !py-2 text-sm"
            >
              Chci změnu &rarr;
            </Link>
          </div>

          {/* Mobile: hamburger */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-foreground"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className={`md:hidden mt-3 py-4 px-4 space-y-1 text-center rounded-3xl shadow-lg backdrop-blur-xl glass-grain ${
            showSolid ? "bg-white/95 border border-outline/60" : "bg-white/90 border border-white/60"
          }`}>
            {navItems.map((item) => {
              const isActive = item.href.startsWith("/#")
                ? false
                : pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block py-2.5 text-base font-display font-bold transition-colors ${
                    isActive ? "text-primary" : "text-foreground/70 hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            <div className="pt-2">
              <Link
                href="/koucing#rezervace"
                onClick={() => setIsMenuOpen(false)}
                className="block px-4 py-2.5 bg-primary text-white rounded-full text-base font-display font-bold hover:bg-primary-dark transition-colors text-center"
              >
                Chci změnu &rarr;
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
