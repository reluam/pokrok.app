import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Žiju life | Rozcestník",
  description:
    "Všechny důležité linky na jednom místě. Žiju life — místo, kde se učíme žít život podle sebe.",
};

const links = [
  {
    label: "Laboratoř",
    description: "Interaktivní nástroje pro lepší život",
    href: "/laborator",
    icon: "🧪",
    color: "var(--accent-secondary)",
  },
  {
    label: "Průvodce",
    description: "Osobní průvodce na cestě životem",
    href: "/koucing",
    icon: "🎯",
    color: "var(--accent-primary)",
  },
  {
    label: "Inspirace",
    description: "Články, principy a myšlenky",
    href: "/inspirace",
    icon: "✨",
    color: "var(--accent-tertiary)",
  },
  {
    label: "O mně",
    description: "Kdo za tím vším stojí",
    href: "/o-mne",
    icon: "👋",
    color: "var(--accent-yellow)",
  },
  {
    label: "Kontakt",
    description: "Ozvi se mi",
    href: "/kontakt",
    icon: "📬",
    color: "var(--accent-tertiary)",
  },
];

const socials = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/zijulife/",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/zijulife/",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@zijulife",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@ziju.life",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.3 6.3 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.78a4.85 4.85 0 0 1-1.01-.09z" />
      </svg>
    ),
  },
];

export default function LinksPage() {
  return (
    <div className="min-h-screen bg-[#FDFDF7] relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-[0.07]"
          style={{ background: "var(--accent-primary)" }}
        />
        <div
          className="absolute top-1/3 -left-16 w-48 h-48 rounded-full opacity-[0.06]"
          style={{ background: "var(--accent-secondary)" }}
        />
        <div
          className="absolute bottom-20 right-10 w-32 h-32 rounded-full opacity-[0.05]"
          style={{ background: "var(--accent-tertiary)" }}
        />
        {/* Wavy SVG decoration */}
        <svg
          className="absolute top-0 left-0 w-full h-32 opacity-[0.04]"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,30 1440,60"
            stroke="var(--accent-primary)"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M0,80 C360,20 720,100 1080,40 C1260,20 1380,80 1440,50"
            stroke="var(--accent-secondary)"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      </div>

      <main className="relative z-10 flex flex-col items-center px-4 py-12 sm:py-16 max-w-md mx-auto">
        {/* Profile photo */}
        <Link href="/" className="group mb-2">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-[3px] border-white shadow-lg group-hover:shadow-xl transition-shadow duration-300">
            <Image
              src="/o-mne-moment.jpg"
              alt="Žiju life"
              fill
              className="object-cover"
              sizes="112px"
              priority
            />
          </div>
        </Link>

        {/* Logo as title */}
        <Link href="/" className="mt-3">
          <Image
            src="/ziju-life-logo.png"
            alt="Žiju life"
            width={140}
            height={56}
            className="h-10 sm:h-12 w-auto"
            sizes="140px"
          />
        </Link>
        <p className="text-foreground/60 text-center mt-2 text-sm sm:text-base max-w-xs leading-relaxed">
          Učím se žít life podle sebe. A za pochodu.
        </p>

        {/* Social icons row */}
        <div className="flex items-center gap-1 mt-5">
          {socials.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 text-foreground/50 hover:text-[var(--accent-primary)] transition-colors duration-200"
              aria-label={social.label}
            >
              {social.icon}
            </a>
          ))}
        </div>

        {/* Links */}
        <div className="w-full mt-8 space-y-3">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="group block w-full"
            >
              <div className="relative bg-white/80 backdrop-blur-sm border border-black/[0.06] rounded-2xl px-5 py-4 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 overflow-hidden">
                {/* Accent left border */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl transition-all duration-300 group-hover:w-1.5"
                  style={{ backgroundColor: link.color }}
                />
                <div className="flex items-center gap-4">
                  <span className="text-2xl shrink-0" role="img">
                    {link.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="font-bold text-foreground group-hover:text-[var(--accent-primary)] transition-colors duration-200">
                      {link.label}
                    </div>
                    <div className="text-sm text-foreground/50 truncate">
                      {link.description}
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-foreground/20 group-hover:text-foreground/40 shrink-0 ml-auto transition-all duration-200 group-hover:translate-x-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-10 text-center">
          <Link
            href="/"
            className="text-xs text-foreground/30 hover:text-foreground/50 transition-colors"
          >
            ziju.life
          </Link>
        </div>
      </main>
    </div>
  );
}
