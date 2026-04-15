import { Compass, Sparkles, LineChart } from 'lucide-react';
import {
  AnimateOnScroll,
  AnimateOnScrollItem,
} from '@web/components/ui/AnimateOnScroll';

const steps = [
  {
    icon: Compass,
    number: '01',
    title: 'Vyber si oblast',
    description:
      'Rozhodování, psychologie, produktivita, mindfulness, zdraví, peníze. 8 oblastí, 175+ konceptů — každý o tom, co ti chybí pro život, ne pro zkoušku.',
  },
  {
    icon: Sparkles,
    number: '02',
    title: 'Denně 5 minut',
    description:
      'Krátká lekce se scénářem z reálného života. Žádná teorie pro teorii — každý koncept se učíš rovnou na konkrétní situaci, kterou znáš.',
  },
  {
    icon: LineChart,
    number: '03',
    title: 'Drž se toho',
    description:
      'Spaced repetition, streaky, XP. Aby ses k tomu vracel a postupně si to uložil natrvalo — ať už jsi na telefonu, nebo u počítače.',
  },
] as const;

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-2xl md:py-[96px]">
      <div className="container-lg">
        <AnimateOnScroll preset="fadeUp" className="mx-auto max-w-[720px] text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Jak to funguje
          </span>
          <h2 className="mt-sm text-2xl font-extrabold tracking-tight text-ink-primary md:text-3xl">
            Z nápadu v návyk. Ve třech krocích.
          </h2>
          <p className="mt-md text-md text-ink-secondary md:text-lg">
            Krátké denní lekce, založené na tom, jak mozek skutečně funguje.
            Jeden koncept, 5 minut — a za pár týdnů ti bude přijít samozřejmé,
            že takhle teď přemýšlíš.
          </p>
        </AnimateOnScroll>

        <AnimateOnScroll
          stagger
          staggerDelay={0.12}
          delay={0.1}
          className="mt-xl grid gap-lg md:mt-2xl md:grid-cols-3"
        >
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <AnimateOnScrollItem
                key={step.number}
                className="relative rounded-2xl border-2 border-border-subtle bg-card p-lg shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-cardLg md:p-xl"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-3xl font-extrabold text-border-light">
                    {step.number}
                  </span>
                </div>
                <h3 className="mt-md text-lg font-extrabold text-ink-primary">
                  {step.title}
                </h3>
                <p className="mt-xs text-sm text-ink-secondary">
                  {step.description}
                </p>
              </AnimateOnScrollItem>
            );
          })}
        </AnimateOnScroll>
      </div>
    </section>
  );
}
