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

  // Hand-drawn pill paths — three slight variants for visual variety
  const PILL_PATHS = [
    "M 14 8 Q 60 4 100 6 Q 146 8 186 10 Q 196 30 184 50 Q 140 54 100 52 Q 60 54 14 52 Q 4 30 14 8 Z",
    "M 12 10 Q 60 6 100 8 Q 144 10 188 8 Q 198 30 186 52 Q 140 56 100 54 Q 56 52 12 54 Q 4 30 12 10 Z",
    "M 16 6 Q 60 10 100 8 Q 140 6 184 12 Q 196 30 186 48 Q 140 54 100 52 Q 56 56 14 50 Q 6 30 16 6 Z",
  ];

  const NavPill = ({
    label,
    isActive,
    variant,
  }: { label: string; isActive: boolean; variant: number }) => {
    const path = PILL_PATHS[variant % 3];
    return (
      <span className="relative inline-flex items-center justify-center px-4 py-1.5">
        <svg
          aria-hidden="true"
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 200 60"
          preserveAspectRatio="none"
        >
          <path
            d={path}
            fill={isActive ? "#FFE4CC" : "transparent"}
            stroke={isActive ? "#171717" : "rgba(23,23,23,0.35)"}
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
        <span
          className={`relative text-sm font-display font-bold ${
            isActive ? "text-foreground" : "text-foreground/75 group-hover:text-foreground"
          }`}
        >
          {label}
        </span>
      </span>
    );
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-2">
        <div
          className={`max-w-5xl mx-auto flex items-center justify-between h-16 md:h-[76px] px-5 md:px-6 transition-all duration-500 ease-out relative ${
            showSolid ? "" : "bg-transparent"
          }`}
        >
          {/* Hand-drawn SVG navigation shell (only when scrolled) */}
          {showSolid && (
            <>
              <svg
                aria-hidden="true"
                className="absolute inset-0 w-full h-full pointer-events-none translate-x-1 translate-y-1"
                viewBox="0 0 1200 80"
                preserveAspectRatio="none"
              >
                <path
                  d="M 30 10 Q 320 4 600 12 Q 880 8 1170 10 Q 1188 40 1170 72 Q 880 76 600 70 Q 320 74 30 72 Q 12 40 30 10 Z"
                  fill="rgba(23,23,23,0.9)"
                />
              </svg>
              <svg
                aria-hidden="true"
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 1200 80"
                preserveAspectRatio="none"
              >
                <path
                  d="M 30 10 Q 320 4 600 12 Q 880 8 1170 10 Q 1188 40 1170 72 Q 880 76 600 70 Q 320 74 30 72 Q 12 40 30 10 Z"
                  fill="#ffffff"
                />
              </svg>
              <svg
                aria-hidden="true"
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 1200 80"
                preserveAspectRatio="none"
              >
                <path
                  d="M 30 10 Q 320 4 600 12 Q 880 8 1170 10 Q 1188 40 1170 72 Q 880 76 600 70 Q 320 74 30 72 Q 12 40 30 10 Z"
                  fill="none"
                  stroke="#171717"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
            </>
          )}
          <Link href="/" className="relative z-10 flex items-center h-10 md:h-12">
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
          <div className="hidden md:flex items-center gap-2 lg:gap-3 absolute left-1/2 -translate-x-1/2 z-10">
            {navItems.map((item, i) => {
              const isActive = item.href.startsWith("/#")
                ? false
                : pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group transition-transform hover:-translate-y-0.5"
                >
                  <NavPill label={item.label} isActive={isActive} variant={i} />
                </Link>
              );
            })}
          </div>

          {/* Desktop right side — CTA */}
          <div className="hidden md:flex items-center relative z-10">
            <Link
              href="/koucing#rezervace"
              className="btn-playful !px-5 !py-2 text-sm"
              data-shape="4"
            >
              Chci změnu &rarr;
            </Link>
          </div>

          {/* Mobile: hamburger */}
          <div className="md:hidden flex items-center relative z-10">
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
          <div className="md:hidden mt-3 relative">
            {/* Hand-drawn SVG shell — shadow */}
            <svg
              aria-hidden="true"
              className="absolute inset-0 w-full h-full pointer-events-none translate-x-1 translate-y-1"
              viewBox="0 0 300 200"
              preserveAspectRatio="none"
            >
              <path
                d="M 14 10 Q 80 6 150 8 T 288 14 Q 296 80 294 140 T 286 192 Q 220 196 150 194 T 10 188 Q 6 120 8 70 T 14 10 Z"
                fill="rgba(23,23,23,0.9)"
              />
            </svg>
            <svg
              aria-hidden="true"
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 300 200"
              preserveAspectRatio="none"
            >
              <path
                d="M 14 10 Q 80 6 150 8 T 288 14 Q 296 80 294 140 T 286 192 Q 220 196 150 194 T 10 188 Q 6 120 8 70 T 14 10 Z"
                fill="#ffffff"
              />
            </svg>
            <div className="relative z-10 py-4 px-4 space-y-2 flex flex-col items-center">
            {navItems.map((item, i) => {
              const isActive = item.href.startsWith("/#")
                ? false
                : pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="group inline-block"
                >
                  <NavPill label={item.label} isActive={isActive} variant={i} />
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
            <svg
              aria-hidden="true"
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 300 200"
              preserveAspectRatio="none"
            >
              <path
                d="M 14 10 Q 80 6 150 8 T 288 14 Q 296 80 294 140 T 286 192 Q 220 196 150 194 T 10 188 Q 6 120 8 70 T 14 10 Z"
                fill="none"
                stroke="#171717"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          </div>
        )}
      </div>
    </nav>
  );
}
