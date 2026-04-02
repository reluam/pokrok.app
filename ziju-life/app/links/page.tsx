import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import LinksNewsletterForm from "@/components/LinksNewsletterForm";

export const metadata: Metadata = {
  title: "Žiju life | Rozcestník",
  description:
    "Všechny důležité linky na jednom místě. Žiju life — místo, kde se učíme žít život podle sebe.",
};

const socials = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/zijulife/",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/zijulife/",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@zijulife",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@ziju.life",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.3 6.3 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.78a4.85 4.85 0 0 1-1.01-.09z" />
      </svg>
    ),
  },
];

const navItems = [
  { label: "Manuál", href: "/manual", icon: "📖" },
  { label: "Koučing", href: "/koucing", icon: "🎯" },
  { label: "Knihovna", href: "/knihovna", icon: "✨" },
  { label: "O mně", href: "/o-mne", icon: "👋" },
];

const YOUTUBE_CHANNEL_ID = "UCXVKWfPc3cv67mY5V40AMCg";

async function getLatestYouTubeVideoId(): Promise<string | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const xml = await res.text();
    const match = xml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export default async function LinksPage() {
  const latestVideoId = await getLatestYouTubeVideoId();
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
      </div>

      <main className="relative z-10 flex flex-col items-center px-4 pt-10 pb-10 sm:pt-14 sm:pb-14 max-w-md mx-auto">
        {/* Profile photo */}
        <Link href="/" className="group mb-2">
          <div className="relative w-22 h-22 sm:w-26 sm:h-26 rounded-full overflow-hidden border-[3px] border-white shadow-lg group-hover:shadow-xl transition-shadow duration-300">
            <Image
              src="/o-mne-moment.jpg"
              alt="Žiju life"
              fill
              className="object-cover"
              sizes="104px"
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

        {/* === BENTO GRID === */}
        <div className="w-full mt-8 flex flex-col gap-3">
          {/* 1. Manuál — full width hero card */}
          <Link href="/manual" className="group block">
            <div
              className="relative bg-gradient-to-br from-[#FF8C42]/10 to-[#FDFDF7] rounded-3xl p-5 sm:p-6 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border border-[#FF8C42]/12"
              style={{ borderBottom: "3px solid #FF8C42" }}
            >
              {/* Background SVG illustration — manual/guide */}
              <svg viewBox="0 0 200 200" fill="none" className="absolute top-0 right-0 w-28 h-28 sm:w-36 sm:h-36 text-[#FF8C42] opacity-[0.12]" aria-hidden="true">
                {/* Otevřená kniha */}
                <path d="M60 40c20-6 35-1 45 4v65c-10-5-25-10-45-4z" stroke="currentColor" strokeWidth="2" fill="none" />
                <path d="M150 40c-20-6-35-1-45 4v65c10-5 25-10 45-4z" stroke="currentColor" strokeWidth="2" fill="none" />
                <path d="M105 44v65" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
                {/* Záložka */}
                <path d="M140 35v20l-6-5-6 5V35z" fill="currentColor" opacity="0.15" />
                {/* Checklist */}
                <path d="M70 125l4 4 8-8M70 142l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
                <path d="M88 128h20M88 145h16" stroke="currentColor" strokeWidth="1.5" opacity="0.2" strokeLinecap="round" />
              </svg>
              <div className="flex items-center gap-4 relative z-10">
                {/* Manual/book icon */}
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#FF8C42]/12 flex items-center justify-center shrink-0">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 text-[#FF8C42]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#FF8C42] mb-0.5">
                    Interaktivní nástroje
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-foreground group-hover:text-foreground/80 transition-colors">
                    Manuál
                  </div>
                  <div className="text-sm text-foreground/45 mt-0.5">
                    Poskládej si život podle sebe.
                  </div>
                </div>
                <svg
                  className="w-5 h-5 text-foreground/20 group-hover:text-foreground/40 shrink-0 transition-all duration-300 group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </div>
          </Link>

          {/* 2. Koučing + Knihovna — two squares */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/koucing" className="group block">
              <div
                className="relative bg-gradient-to-br from-[#4ECDC4]/10 to-[#FDFDF7] rounded-3xl p-4 sm:p-5 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between border border-[#4ECDC4]/12"
                style={{ borderBottom: "3px solid #4ECDC4" }}
              >
                {/* Background SVG — top right */}
                <svg viewBox="0 0 200 200" fill="none" className="absolute -top-3 -right-3 w-28 h-28 text-[#4ECDC4] opacity-[0.12]" aria-hidden="true">
                  <rect x="30" y="50" width="70" height="40" rx="12" stroke="currentColor" strokeWidth="2.5" fill="none" />
                  <path d="M50 90l-8 12 15-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="100" y="80" width="70" height="40" rx="12" stroke="currentColor" strokeWidth="2.5" fill="none" />
                  <circle cx="35" cy="35" r="8" stroke="currentColor" strokeWidth="2.5" fill="none" />
                  <circle cx="165" cy="65" r="8" stroke="currentColor" strokeWidth="2.5" fill="none" />
                </svg>
                {/* Chat bubbles icon */}
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#4ECDC4]/12 flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#4ECDC4]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    <path d="M8 9h8M8 13h4" opacity="0.5" />
                  </svg>
                </div>
                <div className="relative z-10">
                  <div className="font-bold text-foreground group-hover:text-foreground/80 transition-colors text-base sm:text-lg">
                    Koučing
                  </div>
                  <div className="text-xs text-foreground/40 mt-0.5 leading-snug">
                    Osobní průvodce na cestě životem
                  </div>
                </div>
                <svg
                  className="absolute bottom-3 right-3 w-4 h-4 text-foreground/15 group-hover:text-foreground/35 transition-all duration-300 group-hover:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                </svg>
              </div>
            </Link>

            <Link href="/knihovna" className="group block">
              <div
                className="relative bg-gradient-to-br from-[#B0A7F5]/10 to-[#FDFDF7] rounded-3xl p-4 sm:p-5 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between border border-[#B0A7F5]/12"
                style={{ borderBottom: "3px solid #B0A7F5" }}
              >
                {/* Background SVG — top right */}
                <svg viewBox="0 0 200 200" fill="none" className="absolute -top-3 -right-3 w-28 h-28 text-[#B0A7F5] opacity-[0.12]" aria-hidden="true">
                  <rect x="40" y="40" width="50" height="65" rx="4" stroke="currentColor" strokeWidth="2.5" fill="none" />
                  <rect x="55" y="35" width="50" height="65" rx="4" stroke="currentColor" strokeWidth="2.5" fill="none" />
                  <rect x="70" y="30" width="50" height="65" rx="4" stroke="currentColor" strokeWidth="2.5" fill="none" />
                  <line x1="80" y1="48" x2="110" y2="48" stroke="currentColor" strokeWidth="2" opacity="0.4" />
                  <line x1="80" y1="56" x2="105" y2="56" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                  <line x1="80" y1="64" x2="100" y2="64" stroke="currentColor" strokeWidth="2" opacity="0.2" />
                </svg>
                {/* Book icon */}
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#B0A7F5]/12 flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#B0A7F5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                    <path d="M8 7h8M8 11h5" opacity="0.5" />
                  </svg>
                </div>
                <div className="relative z-10">
                  <div className="font-bold text-foreground group-hover:text-foreground/80 transition-colors text-base sm:text-lg">
                    Knihovna
                  </div>
                  <div className="text-xs text-foreground/40 mt-0.5 leading-snug">
                    Tipy, novinky, myšlenky a mnoho dalšího
                  </div>
                </div>
                <svg
                  className="absolute bottom-3 right-3 w-4 h-4 text-foreground/15 group-hover:text-foreground/35 transition-all duration-300 group-hover:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                </svg>
              </div>
            </Link>
          </div>

          {/* 3. Aktuální video — YouTube embed (auto-fetched latest) */}
          {latestVideoId && (
            <div className="rounded-3xl overflow-hidden bg-black/[0.03] border border-black/5">
              <div className="aspect-[9/16] max-h-[480px] w-full">
                <iframe
                  src={`https://www.youtube.com/embed/${latestVideoId}?rel=0&modestbranding=1`}
                  className="w-full h-full"
                  title="Aktuální video — Žiju life"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* 4. Newsletter / sběr emailů */}
          <div className="bg-gradient-to-br from-[#FF8C42]/8 to-[#B0A7F5]/8 rounded-3xl p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">📬</span>
              <span className="text-xs font-bold uppercase tracking-wider text-foreground/40">
                Newsletter
              </span>
            </div>
            <div className="font-bold text-lg sm:text-xl text-foreground mb-1">
              Připoj se k Žiju.life
            </div>
            <p className="text-sm text-foreground/50 mb-4 leading-snug">
              Jednou za 14 dní ti pošlu shrnutí toho, co jsem zjistil, co testuju a co mě baví. Bez spamu.
            </p>
            <LinksNewsletterForm />
          </div>
        </div>

        {/* Social icons */}
        <div className="flex items-center gap-1 mt-8">
          {socials.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 text-foreground/30 hover:text-[var(--accent-primary)] hover:scale-110 transition-all duration-200"
              aria-label={social.label}
            >
              {social.icon}
            </a>
          ))}
        </div>
      </main>

      {/* Bottom navigation bar */}
      <nav className="bg-white/90 backdrop-blur-md border-t border-black/5">
        <div className="max-w-md mx-auto flex justify-around items-center py-2.5 px-2">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center gap-0.5 px-3 py-1 text-foreground/40 hover:text-[var(--accent-primary)] transition-colors"
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] font-bold uppercase tracking-wide">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
