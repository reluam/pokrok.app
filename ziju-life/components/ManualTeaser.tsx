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
      {/* Kladivo */}
      <path d="M55 50l25-15 10 18-25 15z" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M70 60l-15 55" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Ozubené kolo */}
      <circle cx="145" cy="55" r="18" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="145" cy="55" r="8" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M145 35v-4M145 75v4M125 55h-4M165 55h4M131 41l-3-3M159 69l3 3M131 69l-3 3M159 41l3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      {/* Puzzle dílek */}
      <path d="M80 130h25v-8a7 7 0 0114 0v8h25v25h-8a7 7 0 000 14h8v25H80v-25h8a7 7 0 000-14h-8z" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.3" />
      {/* Kompas */}
      <circle cx="160" cy="145" r="15" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M160 133v5M160 152v5M148 145h5M167 145h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      <path d="M160 140l4 5-4 5-4-5z" fill="currentColor" opacity="0.2" />
      {/* Tužka */}
      <path d="M40 155l5-35 8 1-5 35z" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.25" />
      <path d="M42.5 155l1.5-5 5 0.7z" fill="currentColor" opacity="0.15" />
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
              Manuál:<br />
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
                href="/manual"
                className="btn-playful inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-base font-bold bg-accent text-white hover:bg-accent-hover transition-colors shadow-md hover:shadow-lg"
              >
                Vstup do Manuálu &rarr;
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
