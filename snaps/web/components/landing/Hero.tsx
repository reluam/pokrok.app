'use client';

import Link from 'next/link';
import { ArrowRight, Smartphone } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Calibrate } from '@web/components/mascot/Calibrate';

const easeOutExpo = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const reduced = useReducedMotion();

  return (
    <section className="relative pt-xl md:pt-2xl">
      <div className="container-lg">
        <div className="relative mx-auto max-w-[860px] text-center">
          {/* Tag */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOutExpo }}
            className="inline-flex items-center gap-sm rounded-full border border-primary/20 bg-primary/8 px-md py-xs"
          >
            <motion.span
              className="h-[6px] w-[6px] rounded-full bg-primary"
              animate={reduced ? undefined : { scale: [1, 1.4, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: [0.42, 0, 0.58, 1] }}
            />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Denně 5 minut · Věci, na kterých záleží
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: easeOutExpo }}
            className="mt-md text-4xl font-extrabold leading-[1.05] tracking-tight text-ink-primary md:text-5xl"
          >
            Život potřebuje{' '}
            <span className="text-primary">jiné lekce</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: easeOutExpo }}
            className="mx-auto mt-md max-w-[620px] text-lg text-ink-secondary md:text-xl"
          >
            Rozhodování, pozornost, peníze, psychologie, zdraví. Každý den
            jeden krátký koncept — a postupně se ti složí obraz, který se do
            učebnic nevešel.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: easeOutExpo }}
            className="mt-lg flex flex-col items-center justify-center gap-md md:flex-row"
          >
            <Link
              href="/login"
              className="group inline-flex items-center gap-sm rounded-full bg-primary px-lg py-md text-md font-bold text-white shadow-card transition-all hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-cardLg active:translate-y-0"
            >
              Začít zdarma
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <a
              href="#download"
              className="inline-flex items-center gap-sm rounded-full border-2 border-border-light bg-card px-lg py-md text-md font-bold text-ink-primary transition-colors hover:border-primary"
            >
              <Smartphone className="h-4 w-4" />
              Stáhnout do mobilu
            </a>
          </motion.div>

          {/* Trust row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-lg flex flex-wrap items-center justify-center gap-md text-xs font-semibold text-ink-muted"
          >
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success" />
              175+ konceptů
            </span>
            <span className="hidden md:inline">·</span>
            <span>Bez reklam</span>
            <span className="hidden md:inline">·</span>
            <span>Synchronizace napříč zařízeními</span>
          </motion.div>
        </div>

        {/* Decorative hero graphic */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4, ease: easeOutExpo }}
          className="relative mt-2xl"
        >
          <HeroGraphic />
        </motion.div>
      </div>
    </section>
  );
}

function HeroGraphic() {
  return (
    <div className="relative mx-auto flex w-full max-w-[960px] flex-col items-center justify-center gap-lg pb-lg pt-xl md:flex-row md:items-center md:gap-md md:pb-2xl md:pt-[72px]">
      {/* ── LEFT: Calibrate mascot ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6, rotate: -12 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex-shrink-0"
      >
        <Calibrate size={220} mood="happy" trackCursor />
      </motion.div>

      {/* ── RIGHT: Card deck ──
          All three cards stack on the exact same position. Only Z-order and
          rotation differ — front card sits flat, two back cards lean left
          and right so their corners peek out behind the front card. */}
      <div className="relative h-[220px] w-[380px] md:h-[280px] md:w-[460px]">
        {/* Back card — Psychologie, leans right */}
        <motion.div
          initial={{ opacity: 0, rotate: 0 }}
          animate={{ opacity: 1, rotate: 7 }}
          transition={{ duration: 0.8, delay: 1.0, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 z-10 flex flex-col rounded-2xl border-2 border-border-subtle bg-card p-lg shadow-card md:p-xl"
        >
          <div className="flex items-center gap-sm">
            <div className="h-2 w-2 rounded-full bg-teal" />
            <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Koncept 03 · Psychologie
            </span>
          </div>
          <h3 className="mt-sm text-xl font-extrabold leading-tight text-ink-primary md:text-2xl">
            Konfirmační zkreslení
          </h3>
          <p className="mt-xs text-sm text-ink-secondary">
            Nehledáme pravdu — hledáme důkazy, že máme pravdu. A mozek ti je
            rád podstrčí.
          </p>
        </motion.div>

        {/* Middle card — Produktivita, leans left */}
        <motion.div
          initial={{ opacity: 0, rotate: 0 }}
          animate={{ opacity: 1, rotate: -6 }}
          transition={{ duration: 0.8, delay: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 z-20 flex flex-col rounded-2xl border-2 border-border-light bg-card p-lg shadow-card md:p-xl"
        >
          <div className="flex items-center gap-sm">
            <div className="h-2 w-2 rounded-full bg-purple" />
            <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Koncept 02 · Produktivita
            </span>
          </div>
          <h3 className="mt-sm text-xl font-extrabold leading-tight text-ink-primary md:text-2xl">
            Paretův princip
          </h3>
          <p className="mt-xs text-sm text-ink-secondary">
            Dvacet procent toho, co děláš, přináší osmdesát procent
            výsledků. Najdi si těch dvacet.
          </p>
        </motion.div>

        {/* Front card — Opportunity Cost (hero card) */}
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 z-30 flex flex-col rounded-2xl border-2 border-primary bg-card p-lg shadow-cardLg md:p-xl"
        >
          <div className="flex items-center gap-sm">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Koncept 01 · Rozhodování
            </span>
          </div>
          <h3 className="mt-sm text-xl font-extrabold leading-tight text-ink-primary md:text-2xl">
            Opportunity Cost
          </h3>
          <p className="mt-xs text-sm text-ink-secondary">
            Každé „ano“ je někde jinde „ne“. Otázka zní, čeho se pro tohle
            rozhodnutí vzdáváš.
          </p>
          <div className="mt-auto flex items-center justify-between pt-md">
            <div className="flex items-center gap-xs">
              <div className="h-2 w-[60px] overflow-hidden rounded-full bg-surface">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '70%' }}
                  transition={{ duration: 1.2, delay: 1.3, ease: easeOutExpo }}
                  className="h-full rounded-full bg-primary"
                />
              </div>
              <span className="text-xs font-bold text-ink-muted">3/4</span>
            </div>
            <div className="rounded-full bg-primary px-sm py-xs text-xs font-bold text-white">
              Pokračovat
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
