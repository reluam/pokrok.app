// Import from the index file explicitly — data/ has both models.ts (legacy)
// and models/index.ts (current). Next resolves bare "@/data/models" to the file.
import { allModels } from '@/data/models/index';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/lib/constants';
import {
  Brain,
  Shuffle,
  Search,
  Scale,
  BarChart3,
  Anchor,
  type LucideIcon,
} from 'lucide-react';
import {
  AnimateOnScroll,
  AnimateOnScrollItem,
} from '@web/components/ui/AnimateOnScroll';

// Hand-picked concepts that feel directly useful — mix of thinking, money,
// psychology and decision-making. Verified to exist in data/models/mental-models.ts.
const FEATURED_IDS = [
  'mm-12', // Opportunity Cost          → peníze / rozhodování
  'mm-08', // Confirmation Bias         → psychologie
  'mm-01', // First Principles Thinking → myšlení
  'mm-10', // Sunk Cost Fallacy         → rozhodování
  'mm-09', // Pareto Principle (80/20)  → produktivita
  'mm-04', // Inversion                 → problem solving
] as const;

const ICON_MAP: Record<string, LucideIcon> = {
  'mm-12': Scale,
  'mm-08': Search,
  'mm-01': Brain,
  'mm-10': Anchor,
  'mm-09': BarChart3,
  'mm-04': Shuffle,
};

export function ModelShowcase() {
  const featured = FEATURED_IDS.map((id) =>
    allModels.find((m) => m.id === id)
  ).filter((m): m is (typeof allModels)[number] => m !== undefined);

  return (
    <section id="concepts" className="py-2xl md:py-[96px]">
      <div className="container-lg">
        <AnimateOnScroll preset="fadeUp" className="mx-auto max-w-[720px] text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Co se naučíš
          </span>
          <h2 className="mt-sm text-2xl font-extrabold tracking-tight text-ink-primary md:text-3xl">
            Věci, na kterých opravdu záleží
          </h2>
          <p className="mt-md text-md text-ink-secondary md:text-lg">
            Malá ochutnávka z knihovny 175+ konceptů — od toho, jak se
            rozhodovat, přes peníze a psychologii, až po zdraví a pozornost.
            Každý koncept má příběh z reálného života a interaktivní scénář.
          </p>
        </AnimateOnScroll>

        <AnimateOnScroll
          stagger
          staggerDelay={0.08}
          delay={0.1}
          className="mt-xl grid gap-md md:mt-2xl md:grid-cols-2 lg:grid-cols-3"
        >
          {featured.map((model) => {
            const Icon = ICON_MAP[model.id] ?? Brain;
            const accent = CATEGORY_COLORS[model.category] ?? '#FF8C42';
            const categoryLabel = CATEGORY_LABELS[model.category] ?? model.category;

            return (
              <AnimateOnScrollItem
                key={model.id}
                className="group relative flex flex-col rounded-2xl border-2 border-border-subtle bg-card p-lg shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-cardLg"
              >
                <div className="flex items-center gap-sm">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${accent}15` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: accent }} />
                  </div>
                  <span
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: accent }}
                  >
                    {categoryLabel}
                  </span>
                </div>

                <h3 className="mt-md text-lg font-extrabold leading-snug text-ink-primary">
                  {model.name_cz}
                </h3>
                <p className="mt-xs text-sm text-ink-secondary">
                  {model.short_description}
                </p>

                <div className="mt-md flex items-center gap-xs pt-sm">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-1.5 w-6 rounded-full"
                      style={{
                        backgroundColor:
                          i < model.difficulty ? accent : 'rgba(0,0,0,0.06)',
                      }}
                    />
                  ))}
                  <span className="ml-xs text-xs font-bold text-ink-muted">
                    Obtížnost {model.difficulty}/5
                  </span>
                </div>
              </AnimateOnScrollItem>
            );
          })}
        </AnimateOnScroll>

        <AnimateOnScroll preset="fadeIn" delay={0.2} className="mt-xl flex justify-center">
          <div className="inline-flex items-center gap-sm rounded-full border border-border-light bg-surface px-lg py-sm">
            <span className="text-sm font-semibold text-ink-secondary">
              A dalších 170+ konceptů o myšlení, penězích, zdraví a životě
            </span>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
