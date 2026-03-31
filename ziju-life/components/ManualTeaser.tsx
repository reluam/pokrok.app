"use client";

import Link from "next/link";

const tools = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    name: "Přehled & AI průvodce",
    desc: "Přehled a AI průvodce.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    name: "Kompas",
    desc: "Sestavte si inspirativní směr.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    name: "Hodnoty",
    desc: "Poznejte své priority a hodnoty.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    name: "Nastav si den",
    desc: "Nastav si den, jaký chceš mít.",
  },
];

function LabIllustration() {
  return (
    <svg viewBox="0 0 200 200" fill="none" className="w-full h-full opacity-20" aria-hidden="true">
      {/* Erlenmeyerova baňka */}
      <path d="M85 40h30v50l25 55H60l25-55V40z" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M85 40h30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="100" cy="130" rx="12" ry="4" fill="currentColor" opacity="0.15" />
      {/* Zkumavka */}
      <rect x="140" y="55" width="14" height="60" rx="7" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M142 85h10" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <path d="M142 78h10" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      {/* Bubliny */}
      <circle cx="97" cy="115" r="3" fill="currentColor" opacity="0.2" />
      <circle cx="103" cy="108" r="2" fill="currentColor" opacity="0.15" />
      <circle cx="95" cy="105" r="2.5" fill="currentColor" opacity="0.18" />
      {/* Mikroskop */}
      <path d="M45 145h30M60 145v-25l-8-15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="48" cy="103" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
      {/* Atom */}
      <circle cx="160" cy="45" r="3" fill="currentColor" opacity="0.3" />
      <ellipse cx="160" cy="45" rx="18" ry="7" stroke="currentColor" strokeWidth="1.2" opacity="0.25" transform="rotate(-30 160 45)" />
      <ellipse cx="160" cy="45" rx="18" ry="7" stroke="currentColor" strokeWidth="1.2" opacity="0.25" transform="rotate(30 160 45)" />
      <ellipse cx="160" cy="45" rx="18" ry="7" stroke="currentColor" strokeWidth="1.2" opacity="0.25" />
    </svg>
  );
}

export default function ManualTeaser() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-10 md:py-14">
      <div className="max-w-7xl mx-auto">
        <div className="relative rounded-[32px] border border-white/40 shadow-lg overflow-hidden bg-[#fdf0e6]/50 backdrop-blur">

          {/* Ilustrace v pozadí vpravo nahoře */}
          <div className="absolute top-0 right-0 w-72 h-72 text-foreground/70 pointer-events-none">
            <LabIllustration />
          </div>

          {/* Nadpis + kartičky */}
          <div className="relative flex flex-col gap-8 px-8 py-10 md:px-12 md:py-14">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight">
              Laboratoř:<br />
              Tvoje vědomá cesta
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {tools.map((t) => (
                <div
                  key={t.name}
                  className="flex flex-col gap-3 rounded-2xl px-5 py-6 bg-white/80 border border-white/60 shadow-sm"
                >
                  <div className="text-foreground/60">
                    {t.icon}
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-base leading-snug">{t.name}</p>
                    <p className="text-sm text-foreground/55 leading-relaxed mt-1">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA tlačítko uprostřed */}
            <div className="flex justify-center pt-2">
              <Link
                href="/laborator"
                className="btn-playful inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-base font-bold bg-accent text-white hover:bg-accent-hover transition-colors shadow-md hover:shadow-lg"
              >
                Vstup do laboratoře &rarr;
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
