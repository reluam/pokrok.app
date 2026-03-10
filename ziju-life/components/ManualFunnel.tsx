"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useBookingPopup } from "@/components/BookingPopup";
import {
  Circle,
  ChevronDown,
  Clock,
  Brain,
  BatteryFull,
  Shield,
  AlertTriangle,
  Flame,
  HelpCircle,
  Leaf,
  CheckCircle2,
  Smile,
  MessageCircle,
  TrendingDown,
  ThumbsUp,
  Eye,
  Sparkles,
  Book,
  Video,
  FileText,
  type LucideIcon,
} from "lucide-react";
import type { InspirationData, InspirationItem } from "@/lib/inspiration";

function FunnelSectionDivider({ number }: { number: number }) {
  return (
    <div className="flex items-center justify-center gap-3 w-full py-6 sm:py-8">
      <div className="flex-1 h-px bg-black/15" />
      <span className="flex items-center justify-center w-10 h-10 rounded-full bg-accent text-white font-bold text-lg shrink-0">
        {number}
      </span>
      <div className="flex-1 h-px bg-black/15" />
    </div>
  );
}

const STEPS = [
  {
    id: "welcome",
    type: "welcome" as const,
    title: "Život ti proklouzává mezi prsty.\nA ty to cítíš.",
    subtitle:
      "Není to krize. Je to signál. Čas přestat žít podle cizích pravidel — a začít podle svých.",
  },
  {
    id: "q1",
    type: "question" as const,
    question: "Když se ráno probudíš a pomyslíš na nadcházející den, tvá první reakce je...",
    options: [
      "Těším se — dělám věci, které mají pro mě smysl.",
      "Je to různé — některé dny ano, jiné ne.",
      "Spíše únava nebo lhostejnost. Jedeme zase dokola.",
    ],
    icons: [Smile, Clock, TrendingDown],
  },
  {
    id: "q2",
    type: "question" as const,
    question: "Kdy jsi naposledy udělal něco čistě pro sebe — bez výčitek, bez pocitu, že bys měl dělat něco jiného?",
    options: [
      "Celkem pravidelně — to mám dobře nastavené.",
      "Párkrát do měsíce, ale rád bych víc.",
      "Skoro si nevzpomínám.",
    ],
    icons: [CheckCircle2, Clock, HelpCircle],
  },
  {
    id: "q3",
    type: "question" as const,
    question: "Kdybys měl popsat, jak moc tvůj současný život odpovídá tomu, co vlastně chceš...",
    options: [
      "Celkem jo — žiju dost podle sebe.",
      "Zhruba z poloviny. Část je moje, část je pro ostatní.",
      "Většinou dělám, co se ode mě čeká — ne co chci já.",
    ],
    icons: [ThumbsUp, Eye, AlertTriangle],
  },
  {
    id: "q4",
    type: "question" as const,
    question: "Jak moc víš, co od života vlastně chceš?",
    options: [
      "Celkem jasno mám — vím, kam mířím.",
      "Tuším to, ale není to úplně definované.",
      "Upřímně nevím. A to mě trochu děsí.",
    ],
    icons: [Brain, Leaf, HelpCircle],
  },
  {
    id: "q5",
    type: "question" as const,
    question: "Když si představíš, že za 5 let žiješ stejně jako dnes, jak se cítíš?",
    options: [
      "V pohodě — mám život nastavený dobře.",
      "Trochu nesvůj — něco by se změnit mělo.",
      "To nechci. Tohle není život, který chci žít.",
    ],
    icons: [Shield, MessageCircle, Flame],
  },
  {
    id: "q6",
    type: "question" as const,
    question: "Co by se ve tvém životě změnilo, kdybys každý den dělal aspoň pár věcí čistě pro sebe a podle svých hodnot?",
    options: [
      "Asi moc ne — to už celkem dělám.",
      "Cítil bych se lehčeji a víc sám sebou.",
      "Úplně všechno. Byl bych jiný člověk.",
    ],
    icons: [ThumbsUp, Sparkles, BatteryFull],
  },
  {
    id: "result",
    type: "result" as const,
  },
  {
    id: "contact",
    type: "contact" as const,
  },
];

const ANSWER_SCORES: Record<string, Record<string, number>> = {
  q1: {
    "Těším se — dělám věci, které mají pro mě smysl.": 1,
    "Je to různé — některé dny ano, jiné ne.": 2,
    "Spíše únava nebo lhostejnost. Jedeme zase dokola.": 3,
  },
  q2: {
    "Celkem pravidelně — to mám dobře nastavené.": 1,
    "Párkrát do měsíce, ale rád bych víc.": 2,
    "Skoro si nevzpomínám.": 3,
  },
  q3: {
    "Celkem jo — žiju dost podle sebe.": 1,
    "Zhruba z poloviny. Část je moje, část je pro ostatní.": 2,
    "Většinou dělám, co se ode mě čeká — ne co chci já.": 3,
  },
  q4: {
    "Celkem jasno mám — vím, kam mířím.": 1,
    "Tuším to, ale není to úplně definované.": 2,
    "Upřímně nevím. A to mě trochu děsí.": 3,
  },
  q5: {
    "V pohodě — mám život nastavený dobře.": 1,
    "Trochu nesvůj — něco by se změnit mělo.": 2,
    "To nechci. Tohle není život, který chci žít.": 3,
  },
  q6: {
    "Asi moc ne — to už celkem dělám.": 1,
    "Cítil bych se lehčeji a víc sám sebou.": 2,
    "Úplně všechno. Byl bych jiný člověk.": 3,
  },
};

const getTypeIcon = (type: string): LucideIcon => {
  switch (type) {
    case "video": return Video;
    case "book": return Book;
    case "article": return FileText;
    default: return HelpCircle;
  }
};

export default function ManualFunnel() {
  const { openBookingPopup } = useBookingPopup() ?? {};
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [multiSelection, setMultiSelection] = useState<string[]>([]);
  const [latestInspirace, setLatestInspirace] = useState<InspirationItem[]>([]);
  const [showPostBookingMessage, setShowPostBookingMessage] = useState(false);
  const choiceSectionRef = useRef<HTMLDivElement | null>(null);

  const step = STEPS[stepIndex];
  const contactStepIndex = STEPS.findIndex((s) => s.id === "contact");

  useEffect(() => {
    fetch("/api/inspiration")
      .then((res) => res.json())
      .then((d: InspirationData) => {
        const items = [
          ...(d.videos || []),
          ...(d.books || []),
          ...(d.articles || []),
          ...(d.other || []),
        ].filter((i: InspirationItem) => i.isActive !== false);
        const sorted = items
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 6);
        setLatestInspirace(sorted);
      })
      .catch(() => {});
  }, []);

  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  useEffect(() => {
    if (step?.type === "question" && !(step as { multi?: boolean }).multi) {
      setMultiSelection([]);
    }
  }, [stepIndex]);

  const handleAnswer = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setStepIndex((i) => i + 1);
    setMultiSelection([]);
  };

  const toggleMultiOption = (opt: string) => {
    setMultiSelection((prev) =>
      prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt],
    );
  };

  const handleMultiNext = (key: string) => {
    if (!multiSelection.length) return;
    handleAnswer(key, multiSelection.join(" | "));
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Vyplňte prosím jméno.");
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Vyplňte prosím platný e-mail.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: name.trim() || undefined,
          message: message.trim()
            ? `${message.trim()}\n\n--- Odpovědi z funnelu ---\n${JSON.stringify(answers, null, 0)}`
            : `Odpovědi z funnelu: ${JSON.stringify(answers)}`,
          source: "funnel_manual",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Něco se pokazilo.");
        setLoading(false);
        return;
      }
      setLoading(false);
      if (openBookingPopup) {
        openBookingPopup({
          email: email.trim().toLowerCase(),
          name: name.trim() || undefined,
          note: message?.trim() || undefined,
          leadId: data.leadId,
          source: "funnel_manual",
          preferredKind: "free",
          preferredMeetingTypeId: "intro_free",
          lockMeetingType: true,
          onSuccess: () => {
            setShowPostBookingMessage(true);
          },
        });
      }
    } catch {
      setError("Nepodařilo se odeslat. Zkuste to prosím znovu.");
      setLoading(false);
    }
  };

  const totalScore = Object.entries(answers).reduce((sum, [questionId, answer]) => {
    const mapping = ANSWER_SCORES[questionId];
    if (!mapping) return sum;
    const score = mapping[answer];
    return sum + (score || 0);
  }, 0);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-20 h-1 bg-black/5">
        <div
          className="h-full bg-accent transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <main
        className={`flex-1 flex flex-col px-4 py-8 sm:py-12 pt-12 max-w-lg mx-auto w-full ${
          step?.type === "welcome" ? "min-h-0 overflow-y-auto" : "justify-center"
        }`}
      >
        {step?.type === "welcome" && (
          <div className="text-center pb-16 space-y-14">
            <div ref={choiceSectionRef} className="pt-4">
              <Image
                src="/ziju-life-logo.png"
                alt="Žiju life"
                width={212}
                height={84}
                sizes="(max-width: 640px) 141px, 160px"
                className="h-14 w-auto sm:h-16 mx-auto"
                priority
              />
              <h1 className="mt-8 text-3xl sm:text-4xl md:text-5xl font-bold text-foreground leading-tight whitespace-pre-line">
                {step.title}
              </h1>
              <p className="mt-4 text-lg sm:text-xl text-foreground/80 leading-relaxed max-w-xl mx-auto">
                {step.subtitle}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
              <button
                type="button"
                onClick={() => setStepIndex(1)}
                className="flex-1 px-6 py-4 bg-accent text-white rounded-2xl shadow-lg hover:bg-accent-hover transition-all font-bold text-base sm:text-lg"
              >
                Chci žít podle sebe →
              </button>
              <button
                type="button"
                onClick={() => setStepIndex(1)}
                className="flex-1 px-6 py-4 bg-white text-foreground rounded-2xl shadow-md hover:shadow-lg transition-all font-bold text-base sm:text-lg border-2 border-black/10"
              >
                Ještě o tom přemýšlím
              </button>
            </div>

            <div className="flex justify-center pt-2">
              <ChevronDown className="text-foreground/50 w-8 h-8 animate-bounce" aria-hidden />
            </div>

            {/* Poznáváš se v tom? */}
            <section className="text-left max-w-lg mx-auto space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center">
                Poznáváš se v tom?
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { emoji: "😶", text: "Navenek máš všechno — a přesto něco chybí. Jen nevíš co." },
                  { emoji: "🔁", text: "Děláš věci, protože se dělat mají. Ne proto, že je chceš." },
                  { emoji: "⏳", text: "Uvědomuješ si, že máš před sebou třeba 40 let — a chceš je prožít jinak než dosud." },
                  { emoji: "🧭", text: "Nevíš přesně, co chceš. Ale víš, že tohle není ono." },
                  { emoji: "🎭", text: "Hraješ roli, kterou sis nevybral — a čím dál víc tě to stojí energii." },
                ].map(({ emoji, text }, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl p-4 border-2 border-accent/20 flex items-center gap-3"
                  >
                    <span className="flex-shrink-0 w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center text-xl">
                      {emoji}
                    </span>
                    <p className="text-foreground font-medium text-sm sm:text-base">{text}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-foreground/65 text-center pt-1">
                Pokud ses v aspoň dvou z těchto situací poznal, tenhle kvíz je pro tebe.
              </p>
            </section>

            {/* Co z konzultace odneseš */}
            <section className="text-left max-w-lg mx-auto space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center">
                Co z konzultace odneseš
              </h2>
              <div className="space-y-5">
                {[
                  {
                    num: "01",
                    title: "Jasno v tom, co je skutečně tvoje.",
                    desc: "Poprvé si pojmenujeme, co chceš ty — ne co chtějí ostatní. Bez škatulek, bez očekávání.",
                  },
                  {
                    num: "02",
                    title: "Pochopíš, proč se cítíš zaseknutý.",
                    desc: "Zaseknutost není tvoje chyba. Je to přirozený výsledek toho, když žiješ podle cizího scénáře. Na konzultaci pojmenujeme, kde ten scénář vznikl.",
                  },
                  {
                    num: "03",
                    title: "První obrysy tvého vlastního manuálu.",
                    desc: "Odejdeš s konkrétní představou, jak by mohl vypadat život podle tebe. Ne jako velký plán — ale jako první pevný bod, od kterého se dá odrazit.",
                  },
                ].map(({ num, title, desc }) => (
                  <div key={num} className="flex gap-4">
                    <span className="flex-shrink-0 text-2xl font-extrabold text-accent/30 leading-none pt-0.5">
                      {num}
                    </span>
                    <div>
                      <h3 className="font-bold text-foreground mb-1 text-sm sm:text-base">{title}</h3>
                      <p className="text-foreground/70 text-sm leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() =>
                    choiceSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                  className="w-full px-6 py-3 bg-accent text-white rounded-xl font-bold text-base hover:bg-accent-hover transition-colors"
                >
                  Chci začít →
                </button>
              </div>
            </section>

            {/* Ahoj, jsem Matěj */}
            <section className="max-w-lg mx-auto space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center">
                Ahoj, jsem Matěj
              </h2>
              <div className="flex justify-center">
                <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden bg-gray-100">
                  <Image
                    src="/matej-photo.jpg"
                    alt="Matěj"
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 192px, 248px"
                  />
                </div>
              </div>
              <div className="space-y-2 text-foreground/85 text-sm sm:text-base text-center">
                <p>
                  Většinu života jsem strávil snahou pochopit, jak se tenhle život hraje. Experimentuji s vědou, technologiemi, biorytmy i meditací.
                </p>
                <p>
                  Tenhle kousek internetu jsem vytvořil, abys nemusel/a začínat od nuly – inspirace v textech, podpora v komunitě a individuální koučink, pokud to chceš vzít od podlahy.
                </p>
              </div>
            </section>

            {/* Inspirace */}
            {latestInspirace.length > 0 && (
              <section className="max-w-lg mx-auto space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center">
                  Inspirace na cestu
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {latestInspirace.map((item, index) => {
                    const Icon = getTypeIcon(item.type);
                    const isSixthOnMobile = index === 5;
                    return (
                      <Link
                        key={item.id}
                        href={`/inspirace/${item.id}`}
                        className={`block text-left bg-white rounded-xl p-4 border-2 border-black/5 hover:border-accent/40 transition-all ${isSixthOnMobile ? "hidden sm:block" : ""}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="text-accent shrink-0" size={18} />
                          <span className="text-xs font-medium text-foreground/70 uppercase">{item.type}</span>
                        </div>
                        <h3 className="font-semibold text-foreground line-clamp-2 text-sm">{item.title}</h3>
                        <p className="text-foreground/70 text-xs line-clamp-2 mt-1">{item.description}</p>
                      </Link>
                    );
                  })}
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      choiceSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
                    }
                    className="w-full px-6 py-3 bg-accent text-white rounded-xl font-bold text-base hover:bg-accent-hover transition-colors"
                  >
                    Chci žít podle sebe →
                  </button>
                </div>
              </section>
            )}
          </div>
        )}

        {step?.type === "result" && (
          <div className="space-y-6 w-full">
            <FunnelSectionDivider number={STEPS.findIndex((s) => s.id === "result") + 1} />
            <div className="bg-white rounded-3xl border-2 border-accent/15 shadow-lg px-6 py-6 sm:px-8 sm:py-8 space-y-4">
              <p className="text-sm text-foreground/60 uppercase tracking-[0.18em]">
                Výsledek kvízu
              </p>
              <p className="text-3xl sm:text-4xl font-extrabold text-foreground">
                {totalScore} / 18
              </p>
              {totalScore <= 10 && (
                <>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    Dobrý základ. Ale je tu prostor pro víc.
                  </h2>
                  <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
                    Žiješ celkem podle sebe — a to není málo. Ale tady buď upřímný: je to opravdu tvůj život, nebo jen dobře fungující autopilot? 30 minut spolu může odhalit věci, které ani nevíš, že ti chybí.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (contactStepIndex !== -1) setStepIndex(contactStepIndex);
                    }}
                    className="w-full px-6 py-3 bg-accent text-white rounded-xl font-bold text-base hover:bg-accent-hover transition-colors"
                  >
                    Rezervovat konzultaci zdarma →
                  </button>
                </>
              )}
              {totalScore >= 11 && totalScore <= 15 && (
                <>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    Tušíš, že něco není v pořádku. A máš pravdu.
                  </h2>
                  <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
                    Část tebe žije podle sebe. Ale druhá část stále hraje hry, které sis nevybral. Cítíš to jako mírný diskomfort, který nikdy úplně nezmizí. Na konzultaci to spolu pojmenujeme a najdeme, kde začít.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (contactStepIndex !== -1) setStepIndex(contactStepIndex);
                    }}
                    className="w-full px-6 py-3 bg-accent text-white rounded-xl font-bold text-base hover:bg-accent-hover transition-colors"
                  >
                    Chci vědět, co za tím je →
                  </button>
                </>
              )}
              {totalScore >= 16 && (
                <>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    Je čas začít žít podle sebe.
                  </h2>
                  <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
                    Dřeš. Plníš. Zvládáš. Ale pro koho? Tohle není výčitka — je to otázka, kterou si spousta lidí bojí položit nahlas. Ty ses právě odvážil. A to je první krok. Pojďme ho spolu dotáhnout dál.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (contactStepIndex !== -1) setStepIndex(contactStepIndex);
                    }}
                    className="w-full px-6 py-3 bg-accent text-white rounded-xl font-bold text-base hover:bg-accent-hover transition-colors"
                  >
                    Chci začít žít podle sebe →
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {step?.type === "question" && (
          <div className="space-y-4 w-full">
            <div className="flex flex-col items-center gap-2 pb-2">
              <Image
                src="/ziju-life-logo.png"
                alt="Žiju life"
                width={80}
                height={32}
                sizes="80px"
                className="h-8 w-auto"
              />
              <h2 className="text-lg sm:text-xl font-bold text-foreground text-center leading-tight">
                {step.question}
              </h2>
            </div>
            <div className="flex flex-col gap-3">
              {step.options.map((opt, idx) => {
                const stepWithIcons = step as { multi?: boolean; icons?: LucideIcon[] };
                const isMulti = stepWithIcons.multi;
                const isSelected = isMulti && multiSelection.includes(opt);
                const IconComponent = stepWithIcons.icons?.[idx];
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() =>
                      isMulti ? toggleMultiOption(opt) : handleAnswer(step.id, opt)
                    }
                    className={`w-full rounded-2xl border-2 transition-all font-medium flex items-center gap-3 px-4 py-3 text-left ${
                      isSelected
                        ? "border-accent bg-accent text-white"
                        : "border-black/10 bg-white hover:border-accent hover:bg-accent/5 text-foreground"
                    }`}
                  >
                    <span className="flex-shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full bg-accent/10">
                      {IconComponent ? (
                        <IconComponent
                          size={20}
                          className={isSelected ? "text-white" : "text-accent"}
                          strokeWidth={1.6}
                        />
                      ) : (
                        <Circle
                          size={18}
                          className={isSelected ? "text-white fill-white" : "text-accent"}
                          strokeWidth={isSelected ? 0 : 2}
                        />
                      )}
                    </span>
                    <span className="text-sm sm:text-base leading-snug">{opt}</span>
                  </button>
                );
              })}
            </div>
            {(step as { multi?: boolean }).multi && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleMultiNext(step.id)}
                  disabled={multiSelection.length === 0}
                  className="w-full px-6 py-3 bg-accent text-white rounded-xl font-bold hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Další
                </button>
              </div>
            )}
          </div>
        )}

        {step?.type === "contact" && (
          <div className="space-y-6">
            <FunnelSectionDivider number={STEPS.length} />
            {showPostBookingMessage ? (
              <div className="text-center space-y-5 max-w-lg mx-auto">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                  Díky za rezervaci a těším se na náš hovor!
                </h2>
                <div className="text-foreground/85 text-center space-y-4 text-sm sm:text-base leading-relaxed">
                  <p>
                    V mezičase můžeš kouknout na různé inspirace na linku níže.
                  </p>
                  <p>
                    Měj pěkný den,<br />Matěj
                  </p>
                </div>
                <Link
                  href="/inspirace"
                  className="inline-block px-6 py-3 bg-accent text-white rounded-xl font-bold hover:bg-accent-hover transition-colors"
                >
                  Přejít na inspirace
                </Link>
              </div>
            ) : (
              <>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center">
                  Ještě krátce o vás
                </h2>
                <p className="text-foreground/70 text-center">
                  Vyplňte údaje a hned poté si vyberte termín 20min konzultace zdarma, kde zjistíme, jak vytvořit váš osobní manuál.
                </p>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="funnel-name" className="block text-sm font-medium text-foreground mb-1">
                      Jméno
                    </label>
                    <input
                      id="funnel-name"
                      type="text"
                      inputMode="text"
                      autoComplete="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white"
                      placeholder="Vaše jméno"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label htmlFor="funnel-email" className="block text-sm font-medium text-foreground mb-1">
                      E-mail *
                    </label>
                    <input
                      id="funnel-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white"
                      placeholder="vas@email.cz"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label htmlFor="funnel-msg" className="block text-sm font-medium text-foreground mb-1">
                      S čím vám můžu pomoct? (nepovinné)
                    </label>
                    <textarea
                      id="funnel-msg"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-3 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white resize-none"
                      placeholder="Stručně..."
                      disabled={loading}
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-red-600" role="alert">
                      {error}
                    </p>
                  )}
                  <p className="text-xs text-foreground/60">
                    Odesláním souhlasíte se zpracováním údajů.{" "}
                    <a href="/gdpr" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">
                      Zásady ochrany údajů
                    </a>
                  </p>
                  <p className="text-sm text-foreground/80">
                    20 minutová konzultace zdarma, kde zjistíme, jak vytvořit tvůj osobní manuál.
                  </p>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-4 bg-accent text-white rounded-xl font-bold hover:bg-accent-hover transition-colors disabled:opacity-70"
                  >
                    {loading ? "Odesílám…" : "Pokračovat k výběru termínu"}
                  </button>
                </form>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
