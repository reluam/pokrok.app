import Link from "next/link";
import Image from "next/image";
import Certificates from "./Certificates";

export default function Footer() {
  return (
    <>
      <footer className="border-t-2 border-black/10 bg-white/50 py-12 px-4 sm:px-6 lg:px-8 paper-texture">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <div className="mb-2">
                <Image
                  src="/ziju-life-logo.png"
                  alt="Žiju life"
                  width={120}
                  height={48}
                  sizes="(max-width: 768px) 100px, 120px"
                  className="h-10 md:h-12 w-auto mx-auto md:mx-0"
                />
              </div>
              <p className="text-sm text-foreground/60">
                A učím se to za pochodu.
              </p>
            </div>
            
            {/* Certifikáty mezi nadpisem a odkazy */}
            <div className="w-full md:w-auto">
              <Certificates />
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Link href="/inspirace" className="text-sm text-foreground/70 hover:text-accent transition-colors">
                Inspirace
              </Link>
              <Link href="/o-mne" className="text-sm text-foreground/70 hover:text-accent transition-colors">
                O mně
              </Link>
              <Link href="/kontakt" className="text-sm text-foreground/70 hover:text-accent transition-colors">
                Kontakt
              </Link>
              <div className="h-6 w-px bg-black/20 hidden md:block" />
              <div className="flex items-center gap-4">
                <a
                  href="https://www.instagram.com/ziju.life/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-foreground/60 hover:opacity-80 transition-opacity"
                  aria-label="Instagram"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient id="instagram-gradient-footer" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#833AB4" />
                        <stop offset="50%" stopColor="#FD1D1D" />
                        <stop offset="100%" stopColor="#FCB045" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
                      fill="url(#instagram-gradient-footer)"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-black/5 text-center space-y-4">
            <div className="flex flex-wrap justify-center items-center gap-4 text-sm">
              <Link href="/gdpr" className="text-foreground/60 hover:text-accent transition-colors">
                Cookies & GDPR
              </Link>
              <span className="text-foreground/30">•</span>
              <Link href="/unsubscribe" className="text-foreground/60 hover:text-accent transition-colors">
                Odhlásit se z newsletteru
              </Link>
            </div>
            <p className="text-sm text-foreground/60">
              © {new Date().getFullYear()} Žiju life. Všechna práva vyhrazena.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
