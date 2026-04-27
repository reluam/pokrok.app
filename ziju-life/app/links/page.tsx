import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { listCuratedPosts } from "@/lib/curated-posts-db";
import HandDrawnIcon from "@/components/HandDrawnIcon";

export const metadata: Metadata = {
  title: "Žiju life | Rozcestník",
  description:
    "Vnitřní klid v hlučném světě. Poslední článek, Substack a konzultace zdarma.",
};

const SUBSTACK_URL =
  "https://zijulife.substack.com/?r=86mho4&utm_campaign=pub-share-checklist";

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

interface FeaturedPost {
  slug: string;
  title: string;
  subtitle: string | null;
  cover_image_url: string | null;
  source_url: string | null;
}

async function getFeaturedSubstackPost(): Promise<FeaturedPost | null> {
  try {
    const { posts } = await listCuratedPosts({
      status: "published",
      tag: "substack",
      page: 1,
      limit: 1,
    });
    const post = posts[0] as FeaturedPost | undefined;
    return post ?? null;
  } catch {
    return null;
  }
}

export default async function LinksPage() {
  const featured = await getFeaturedSubstackPost();
  const featuredHref = featured?.source_url ?? SUBSTACK_URL;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg
          aria-hidden="true"
          className="absolute -top-10 -right-16 w-72 h-72 opacity-[0.18]"
          viewBox="0 0 200 200"
          style={{ transform: "rotate(12deg)" }}
        >
          <path
            fill="#FFD966"
            d="M94,4 C142,-2 180,18 194,62 C206,100 198,138 186,172 C172,206 148,232 116,238 C88,244 58,232 34,212 C12,192 -2,160 4,120 C8,82 16,44 42,20 C58,8 74,4 94,4 Z"
          />
        </svg>
        <svg
          aria-hidden="true"
          className="absolute top-1/2 -left-20 w-56 h-56 opacity-[0.16]"
          viewBox="0 0 200 200"
          style={{ transform: "rotate(-18deg)" }}
        >
          <path
            fill="#B0A7F5"
            d="M94,4 C142,-2 180,18 194,62 C206,100 198,138 186,172 C172,206 148,232 116,238 C88,244 58,232 34,212 C12,192 -2,160 4,120 C8,82 16,44 42,20 C58,8 74,4 94,4 Z"
          />
        </svg>
        <svg
          aria-hidden="true"
          className="absolute bottom-20 right-4 w-40 h-40 opacity-[0.14]"
          viewBox="0 0 200 200"
          style={{ transform: "rotate(6deg)" }}
        >
          <path
            fill="#4ECDC4"
            d="M94,4 C142,-2 180,18 194,62 C206,100 198,138 186,172 C172,206 148,232 116,238 C88,244 58,232 34,212 C12,192 -2,160 4,120 C8,82 16,44 42,20 C58,8 74,4 94,4 Z"
          />
        </svg>
      </div>

      <main className="relative z-10 flex flex-col items-center px-4 pt-10 pb-14 sm:pt-14 sm:pb-16 max-w-md mx-auto">
        {/* Profile photo */}
        <Link href="/" className="group mb-2">
          <div
            className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:-translate-y-0.5"
            style={{ border: "3px solid #171717" }}
          >
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

        {/* Logo */}
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
        <p className="font-display text-foreground/70 text-center mt-2 text-sm sm:text-base max-w-xs leading-relaxed">
          Vnitřní <span className="underline-playful">klid</span> v hlučném světě.
        </p>

        {/* Socials */}
        <div className="flex items-center gap-1 mt-4">
          {socials.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-foreground/40 hover:text-[var(--accent-primary)] hover:scale-110 hover:-rotate-3 transition-all duration-200"
              aria-label={social.label}
            >
              {social.icon}
            </a>
          ))}
        </div>

        {/* === HLAVNÍ 3 CTA === */}
        <div className="w-full mt-8 flex flex-col gap-5">
          {/* 1. Featured — nejčtenější článek ze Substacku */}
          {featured && (
            <a
              href={featuredHref}
              target="_blank"
              rel="noopener noreferrer"
              className="group block hover:-translate-y-1 transition-all duration-200"
            >
              <div className="relative">
                {/* Shadow plate */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{
                    transform: "translate(6px, 6px)",
                    background: "#171717",
                  }}
                />
                <div
                  className="relative rounded-3xl overflow-hidden"
                  style={{
                    background: "#FDFBF7",
                    border: "3px solid #171717",
                  }}
                >
                  {/* Cover image */}
                  <div className="relative w-full aspect-[16/10] overflow-hidden" style={{ borderBottom: "3px solid #171717" }}>
                    {featured.cover_image_url ? (
                      <Image
                        src={featured.cover_image_url}
                        alt={featured.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        sizes="(max-width: 768px) 100vw, 448px"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{
                          background:
                            "linear-gradient(135deg, #ffe4cc 0%, #dfd8fa 100%)",
                        }}
                      >
                        <span className="text-6xl">✨</span>
                      </div>
                    )}
                    {/* Badge */}
                    <div
                      className="absolute top-3 left-3 px-3 py-1 rounded-full font-display text-[11px] font-extrabold uppercase tracking-[0.14em] text-foreground"
                      style={{
                        background: "#FFD966",
                        border: "2px solid #171717",
                      }}
                    >
                      Nejčtenější článek
                    </div>
                  </div>
                  {/* Body */}
                  <div className="p-5 sm:p-6">
                    <h2 className="font-display font-extrabold text-xl sm:text-2xl text-foreground tracking-tight leading-tight mb-2">
                      {featured.title}
                    </h2>
                    {featured.subtitle && (
                      <p className="text-sm sm:text-base text-foreground/65 leading-snug line-clamp-3 mb-4">
                        {featured.subtitle}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                        Číst na Substacku
                      </span>
                      <span
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm transition-transform duration-200 group-hover:translate-x-0.5"
                        style={{
                          background: "#FF8C42",
                          border: "2px solid #171717",
                        }}
                      >
                        &rarr;
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </a>
          )}

          {/* 2. Substack — Čti další články */}
          <a
            href={SUBSTACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group block hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{
                  transform: "translate(5px, 5px)",
                  background: "#171717",
                }}
              />
              <div
                className="relative rounded-2xl px-5 py-4 sm:py-5 flex items-center gap-4"
                style={{
                  background: "#FDFBF7",
                  border: "2.5px solid #171717",
                }}
              >
                <HandDrawnIcon bg="#ffe4cc" variant={0} size={56}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-6 h-6"
                    style={{ color: "#FF8C42" }}
                  >
                    <path d="M4 7h16" />
                    <path d="M4 11h16" />
                    <path d="M4 15l8 5 8-5" />
                  </svg>
                </HandDrawnIcon>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-extrabold text-foreground text-lg sm:text-xl tracking-tight leading-tight">
                    Čti další články
                  </div>
                  <div className="text-xs sm:text-sm text-foreground/60 mt-0.5 leading-snug">
                    Newsletter Žiju life na Substacku
                  </div>
                </div>
                <span
                  className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm transition-transform duration-200 group-hover:translate-x-0.5"
                  style={{
                    background: "#FF8C42",
                    border: "2px solid #171717",
                  }}
                >
                  &rarr;
                </span>
              </div>
            </div>
          </a>

          {/* 3. Koučink — Zarezervuj konzultaci zdarma */}
          <Link
            href="/koucing#rezervace"
            className="group block hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{
                  transform: "translate(5px, 5px)",
                  background: "#171717",
                }}
              />
              <div
                className="relative rounded-2xl px-5 py-4 sm:py-5 flex items-center gap-4"
                style={{
                  background: "#FDFBF7",
                  border: "2.5px solid #171717",
                }}
              >
                <HandDrawnIcon bg="#c6f1ec" variant={1} size={56}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-6 h-6"
                    style={{ color: "#2a9d95" }}
                  >
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    <path d="M8 9h8M8 13h4" opacity="0.55" />
                  </svg>
                </HandDrawnIcon>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-extrabold text-foreground text-lg sm:text-xl tracking-tight leading-tight">
                    Koučink
                  </div>
                  <div className="text-xs sm:text-sm text-foreground/60 mt-0.5 leading-snug">
                    Zarezervuj konzultaci zdarma
                  </div>
                </div>
                <span
                  className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm transition-transform duration-200 group-hover:translate-x-0.5"
                  style={{
                    background: "#4ECDC4",
                    border: "2px solid #171717",
                  }}
                >
                  &rarr;
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Socials — bottom */}
        <div className="flex items-center gap-1 mt-10">
          {socials.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 text-foreground/40 hover:text-[var(--accent-primary)] hover:scale-110 hover:-rotate-3 transition-all duration-200"
              aria-label={social.label}
            >
              {social.icon}
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
