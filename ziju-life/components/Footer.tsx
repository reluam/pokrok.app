import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-outline/40 bg-transparent py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
          <div className="text-center md:text-left space-y-2">
            <div>
              <Image
                src="/ziju-life-logo.png"
                alt="Žiju life"
                width={120}
                height={48}
                sizes="(max-width: 768px) 100px, 120px"
                className="h-10 md:h-12 w-auto mx-auto md:mx-0"
              />
            </div>
            <p className="text-sm text-muted">
              Manuál pro život v 21. století.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6">
            <Link
              href="/koucing"
              className="text-sm font-display font-bold text-foreground/70 hover:text-primary transition-colors"
            >
              Koučing
            </Link>
            <Link
              href="/knihovna"
              className="text-sm font-display font-bold text-foreground/70 hover:text-primary transition-colors"
            >
              Knihovna
            </Link>
            <Link
              href="/o-mne"
              className="text-sm font-display font-bold text-foreground/70 hover:text-primary transition-colors"
            >
              O mně
            </Link>
            <div className="h-6 w-px bg-outline hidden md:block" />
            <div className="flex items-center gap-1">
              {/* Instagram */}
              <a href="https://www.instagram.com/zijulife/" target="_blank" rel="noopener noreferrer" className="p-2 text-muted hover:text-primary transition-colors" aria-label="Instagram">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              {/* Facebook */}
              <a href="https://www.facebook.com/zijulife/" target="_blank" rel="noopener noreferrer" className="p-2 text-muted hover:text-primary transition-colors" aria-label="Facebook">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              {/* YouTube */}
              <a href="https://www.youtube.com/@zijulife" target="_blank" rel="noopener noreferrer" className="p-2 text-muted hover:text-primary transition-colors" aria-label="YouTube">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              {/* TikTok */}
              <a href="https://www.tiktok.com/@ziju.life" target="_blank" rel="noopener noreferrer" className="p-2 text-muted hover:text-primary transition-colors" aria-label="TikTok">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.3 6.3 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.78a4.85 4.85 0 0 1-1.01-.09z"/>
                </svg>
              </a>
              {/* Substack */}
              <a href="https://zijulife.substack.com/?r=86mho4&utm_campaign=pub-share-checklist" target="_blank" rel="noopener noreferrer" className="p-2 text-muted hover:text-primary transition-colors" aria-label="Substack">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24l9.56-5.26L20.539 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-outline/30 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex flex-wrap justify-center md:justify-start items-center gap-4">
            <Link
              href="/gdpr"
              className="text-muted hover:text-primary transition-colors font-display text-xs"
            >
              Cookies & GDPR
            </Link>
            <span className="hidden sm:inline text-foreground/30">&bull;</span>
            <Link
              href="/unsubscribe"
              className="text-muted hover:text-primary transition-colors font-display text-xs"
            >
              Odhlásit se z newsletteru
            </Link>
          </div>
          <p className="text-xs text-muted/60 font-display">
            &copy; {new Date().getFullYear()} Žiju life
          </p>
        </div>
      </div>
    </footer>
  );
}
