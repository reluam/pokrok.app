"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef, useLayoutEffect } from "react";
import type React from "react";
import { Lock, LockOpen, ChevronDown } from "lucide-react";

const SVEPOMOCI_ITEMS = [
  { href: "/audit-zivota", label: "Audit života" },
  { href: "/navod-na-zivot", label: "Návod na život" },
];

export default function Navigation() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileSubOpen, setMobileSubOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownPanelRef = useRef<HTMLDivElement>(null);
  const [ddPos, setDdPos] = useState({ top: 0, left: 0 });

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

  useEffect(() => {
    // Zavři dropdown při kliknutí mimo (trigger i panel)
    const handleClickOutside = (e: MouseEvent) => {
      const inTrigger = triggerRef.current?.contains(e.target as Node);
      const inPanel = dropdownPanelRef.current?.contains(e.target as Node);
      if (!inTrigger && !inPanel) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Zavři mobile menu při změně route
  useEffect(() => {
    setIsMenuOpen(false);
    setMobileSubOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  // Vypočítej pozici dropdownu podle triggeru
  useLayoutEffect(() => {
    if (dropdownOpen && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setDdPos({ top: r.bottom + 12, left: r.left + r.width / 2 });
    }
  }, [dropdownOpen]);

  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setIsUserLoggedIn(!!d.loggedIn))
      .catch(() => {});
  }, [pathname]);

  const navItems: Array<{ href: string; label: string; external?: boolean }> = [
    { href: "/inspirace", label: "Inspirace" },
    { href: "/koucing", label: "Koučink" },
    { href: "/o-mne", label: "O mně" },
  ];

  const isSvepomociActive = SVEPOMOCI_ITEMS.some(
    (i) => pathname === i.href || pathname?.startsWith(i.href)
  );

  const handleChciZmenuClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === "/koucing") {
      e.preventDefault();
      const el = document.getElementById("rezervace");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      <nav className="sticky top-3 md:top-5 z-50">
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
              {/* Svépomocí trigger – bez dropdown panelu (je mimo pill) */}
              <button
                ref={triggerRef}
                onClick={() => setDropdownOpen((v) => !v)}
                onMouseEnter={() => setDropdownOpen(true)}
                className={`flex items-center gap-1 text-base transition-colors ${
                  isSvepomociActive
                    ? "text-accent font-medium"
                    : "text-foreground/70 hover:text-foreground"
                }`}
              >
                Svépomocí
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Ostatní položky */}
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-base transition-colors ${
                      isActive ? "text-accent font-medium" : "text-foreground/70 hover:text-foreground"
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

              <Link
                href="/ucet"
                aria-label="Můj účet"
                className={`p-2 rounded-full transition-colors ${
                  pathname === "/ucet" ? "text-accent" : "text-foreground/50 hover:text-foreground"
                }`}
              >
                {isUserLoggedIn ? <LockOpen className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </Link>
            </div>

            {/* Mobile: account + hamburger */}
            <div className="md:hidden flex items-center gap-1">
              <Link
                href="/ucet"
                aria-label="Můj účet"
                onClick={() => setIsMenuOpen(false)}
                className={`p-2 rounded-full transition-colors ${
                  pathname === "/ucet" ? "text-accent" : "text-foreground/50 hover:text-foreground"
                }`}
              >
                <Lock className="w-5 h-5" />
              </Link>
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
            <div className="md:hidden mt-3 py-4 px-4 space-y-1 text-center rounded-3xl border border-white/60 bg-white/90 shadow-lg backdrop-blur-xl glass-grain">
              {/* Svépomocí */}
              <div>
                <button
                  onClick={() => setMobileSubOpen((v) => !v)}
                  className={`w-full flex items-center justify-center gap-1.5 py-2.5 text-base transition-colors ${
                    isSvepomociActive ? "text-accent font-medium" : "text-foreground/70"
                  }`}
                >
                  Svépomocí
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${mobileSubOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {mobileSubOpen && (
                  <div className="mt-1 mb-2 mx-4 py-2 rounded-2xl bg-accent/5 border border-accent/10">
                    {SVEPOMOCI_ITEMS.map((item) => {
                      const isActive = pathname === item.href || pathname?.startsWith(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className={`block py-2 text-sm transition-colors ${
                            isActive ? "text-accent font-semibold" : "text-foreground/70 hover:text-foreground"
                          }`}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Ostatní položky */}
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`block py-2.5 text-base transition-colors ${
                      isActive ? "text-accent font-medium" : "text-foreground/70 hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <div className="pt-2">
                <Link
                  href="/koucing#rezervace"
                  onClick={(e) => { handleChciZmenuClick(e); setIsMenuOpen(false); }}
                  className="block px-4 py-2 bg-accent text-white rounded-full text-base font-semibold hover:bg-accent-hover transition-colors text-center"
                >
                  Chci změnu
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Desktop dropdown – mimo pill (glass-grain má overflow:hidden), renderuje se fixed */}
      {dropdownOpen && (
        <div
          ref={dropdownPanelRef}
          onMouseLeave={() => setDropdownOpen(false)}
          style={{ position: "fixed", top: ddPos.top, left: ddPos.left, transform: "translateX(-50%)", zIndex: 9999 }}
          className="hidden md:block py-2 min-w-[180px] rounded-2xl border border-white/60 bg-white/95 shadow-xl backdrop-blur-xl glass-grain"
        >
          {/* Šipka nahoru */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 rounded-sm border-l border-t border-white/60 bg-white/95" />
          {SVEPOMOCI_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-5 py-2.5 text-sm transition-colors hover:bg-accent/5 ${
                  isActive ? "text-accent font-semibold" : "text-foreground/80 hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
