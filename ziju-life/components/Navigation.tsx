"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Navigation() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems: Array<{ href: string; label: string; external?: boolean }> = [
    { href: "/inspirace", label: "Inspirace" },
    { href: "https://www.skool.com/ziju-life-9405", label: "Komunita", external: true },
    { href: "/o-mne", label: "O mně" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[#FFFAF5]/95 backdrop-blur-sm border-b border-black/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="text-xl md:text-2xl font-semibold text-foreground hover:text-accent transition-colors">
            Žiju life
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
                        ? "text-accent font-medium"
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
            
            <a
              href="https://www.skool.com/ziju-life-9405"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-accent text-white rounded-full text-base font-medium hover:bg-accent-hover transition-colors whitespace-nowrap"
            >
              Vstoupit do komunity
            </a>
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
                        ? "text-accent font-medium"
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
            <a
              href="https://www.skool.com/ziju-life-9405"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMenuOpen(false)}
              className="block px-4 py-2 bg-accent text-white rounded-full text-base font-medium hover:bg-accent-hover transition-colors text-center"
            >
              Vstoupit do komunity
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}
