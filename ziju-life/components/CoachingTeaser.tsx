"use client";

import Link from "next/link";

const benefits = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    name: "Nový pohled",
    desc: "Uvidíš věci, které sám nevidíš.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    name: "Jasný směr",
    desc: "Pojmenujeme kam chceš a uděláme první krok.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    name: "Průvodce, ne rádce",
    desc: "Podpořím tě na tvé vlastní cestě.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    name: "Bezpečný prostor",
    desc: "Místo, kde můžeš být upřímný sám k sobě.",
  },
];

function CoachIllustration() {
  return (
    <svg viewBox="0 0 200 200" fill="none" className="w-full h-full opacity-20" aria-hidden="true">
      {/* Chat bubliny */}
      <rect x="30" y="50" width="70" height="40" rx="12" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M50 90l-8 12 15-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="45" y1="63" x2="85" y2="63" stroke="currentColor" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
      <line x1="45" y1="70" x2="75" y2="70" stroke="currentColor" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
      <line x1="45" y1="77" x2="65" y2="77" stroke="currentColor" strokeWidth="1.5" opacity="0.2" strokeLinecap="round" />

      <rect x="100" y="80" width="70" height="40" rx="12" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M150 120l8 12-15-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="115" y1="93" x2="155" y2="93" stroke="currentColor" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
      <line x1="115" y1="100" x2="145" y2="100" stroke="currentColor" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
      <line x1="115" y1="107" x2="135" y2="107" stroke="currentColor" strokeWidth="1.5" opacity="0.2" strokeLinecap="round" />

      {/* Spojovací linka */}
      <path d="M95 70c20 0 20 25 40 25" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.3" />

      {/* Osoby */}
      <circle cx="35" cy="35" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M25 55a10 10 0 0120 0" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />

      <circle cx="165" cy="65" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M155 85a10 10 0 0120 0" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />

      {/* Srdce */}
      <path d="M100 155c0-5 4-9 8-9 3 0 5 2 6 4 1-2 3-4 6-4 4 0 8 4 8 9 0 8-14 15-14 15s-14-7-14-15z" fill="currentColor" opacity="0.12" />

      {/* Hvězdičky */}
      <circle cx="50" cy="145" r="2" fill="currentColor" opacity="0.15" />
      <circle cx="155" cy="150" r="1.5" fill="currentColor" opacity="0.12" />
      <circle cx="80" cy="160" r="1.5" fill="currentColor" opacity="0.1" />
    </svg>
  );
}

export default function CoachingTeaser() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-10 md:py-14">
      <div className="max-w-7xl mx-auto">
        <div className="relative rounded-[32px] border border-white/40 shadow-lg overflow-hidden bg-[#FDFDF7]/80 backdrop-blur">

          {/* Ilustrace v pozadí vpravo nahoře */}
          <div className="absolute top-0 right-0 w-72 h-72 text-foreground/70 pointer-events-none">
            <CoachIllustration />
          </div>

          {/* Nadpis + kartičky */}
          <div className="relative flex flex-col gap-8 px-8 py-10 md:px-12 md:py-14">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight">
              Koučing:<br />
              Tvůj parťák na cestě
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {benefits.map((b) => (
                <div
                  key={b.name}
                  className="flex flex-col gap-3 rounded-2xl px-5 py-6 bg-white/80 border border-white/60 shadow-sm"
                >
                  <div className="text-foreground/60">
                    {b.icon}
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-base leading-snug">{b.name}</p>
                    <p className="text-sm text-foreground/55 leading-relaxed mt-1">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA tlačítko uprostřed */}
            <div className="flex justify-center pt-2">
              <Link
                href="/koucing"
                className="btn-playful inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-base font-bold bg-accent text-white hover:bg-accent-hover transition-colors shadow-md hover:shadow-lg"
              >
                Zjistit víc o koučingu &rarr;
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
