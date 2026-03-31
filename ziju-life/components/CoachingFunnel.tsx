"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useBookingPopup } from "@/components/BookingPopup";
import {
  Circle,
  ChevronDown,
  Clock,
  Coffee,
  Brain,
  BatteryFull,
  BatteryMedium,
  BatteryLow,
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

/** Oddělovač sekce ve stylu Perspective: čára – kroužek s číslem – čára */
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

/** Obrázek v CTA – Next/Image s rozumnými rozměry (2 sloupce, ~50vw na mobilu). */
function FunnelCtaImage({
  src,
  wrapperClassName = "bg-black/5",
}: {
  src: string;
  wrapperClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <span
      className={`relative block w-full aspect-[4/3] overflow-hidden shrink-0 ${wrapperClassName}`}
    >
      {!failed && (
        <Image
          src={src}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, 280px"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}

const STEPS = [
  {
    id: "welcome",
    type: "welcome" as const,
    title: "Klid, který nezávisí na okolnostech.",
    subtitle:
      "Vědecky ověřená cesta k vnitřní stabilitě — pro lidi, kteří toho zvládají hodně, ale cítí, že to takhle nejde dál.",
    cta: "Chci získat klid →",
  },
  {
    id: "q1",
    type: "question" as const,
    question: "Jak vypadá tvůj typický večer po práci?",
    options: [
      "Dokážu se relativně rychle přepnout a v klidu odpočívat.",
      "Chvíli to trvá, ale nakonec se uklidním.",
      "Myšlenky na práci mi krouží hlavou ještě dlouho do noci.",
    ],
    icons: [Coffee, Clock, Brain],
  },
  {
    id: "q2",
    type: "question" as const,
    question: "Kolik hodin týdně věnuješ věcem, které tě skutečně dobíjejí?",
    options: [
      "Víc než 5 hodin — to mám dobře nastavené.",
      "Tak 2–5 hodin, ale rád bych víc.",
      "Sotva pár hodin, nebo vůbec.",
    ],
    icons: [BatteryFull, BatteryMedium, BatteryLow],
  },
  {
    id: "q3",
    type: "question" as const,
    question: "Když přijde nečekaná komplikace, tvá první reakce je...",
    options: [
      "Klid — vyřeším to, jak vždy.",
      "Frustrace, ale nakonec to zvládnu.",
      "Přetečení — tohle už je opravdu moc.",
    ],
    icons: [Shield, AlertTriangle, Flame],
  },
  {
    id: "q4",
    type: "question" as const,
    question: "Zkoušel jsi už něco se stresem dělat?",
    options: [
      "Zatím ne — hledám první řešení.",
      "Ano — meditace, sport nebo podobně. Pomohlo to, ale jen chvíli.",
      "Mám zavedené návyky a celkem mi fungují.",
    ],
    icons: [HelpCircle, Leaf, CheckCircle2],
  },
  {
    id: "q5",
    type: "question" as const,
    question: "Jak dlouho cítíš, že tohle není udržitelné?",
    options: [
      "Moc ne — celkem to zvládám.",
      "Párkrát jsem o tom přemýšlel, ale zase to přešlo.",
      "Tohle cítím už delší dobu a je to čím dál silnější.",
    ],
    icons: [Smile, MessageCircle, TrendingDown],
  },
  {
    id: "q6",
    type: "question" as const,
    question: "Kdybys měl vnitřní klid za každých okolností, co by se změnilo?",
    options: [
      "Asi moc ne — jsem celkem spokojený.",
      "Byl bych víc přítomný a méně reaktivní.",
      "Úplně všechno — energie, rozhodování, vztahy, zdraví.",
    ],
    icons: [ThumbsUp, Eye, Sparkles],
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
    "Dokážu se relativně rychle přepnout a v klidu odpočívat.": 1,
    "Chvíli to trvá, ale nakonec se uklidním.": 2,
    "Myšlenky na práci mi krouží hlavou ještě dlouho do noci.": 3,
  },
  q2: {
    "Víc než 5 hodin — to mám dobře nastavené.": 1,
    "Tak 2–5 hodin, ale rád bych víc.": 2,
    "Sotva pár hodin, nebo vůbec.": 3,
  },
  q3: {
    "Klid — vyřeším to, jak vždy.": 1,
    "Frustrace, ale nakonec to zvládnu.": 2,
    "Přetečení — tohle už je opravdu moc.": 3,
  },
  q4: {
    "Mám zavedené návyky a celkem mi fungují.": 1,
    "Zatím ne — hledám první řešení.": 2,
    "Ano — meditace, sport nebo podobně. Pomohlo to, ale jen chvíli.": 3,
  },
  q5: {
    "Moc ne — celkem to zvládám.": 1,
    "Párkrát jsem o tom přemýšlel, ale zase to přešlo.": 2,
    "Tohle cítím už delší dobu a je to čím dál silnější.": 3,
  },
  q6: {
    "Asi moc ne — jsem celkem spokojený.": 1,
    "Byl bych víc přítomný a méně reaktivní.": 2,
    "Úplně všechno — energie, rozhodování, vztahy, zdraví.": 3,
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

export default function CoachingFunnel() {
  const { openBookingPopup } = useBookingPopup() ?? {};
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [multiSelection, setMultiSelection] = useState<string[]>([]);
  const [showPostBookingMessage, setShowPostBookingMessage] = useState(false);
  const [pathChoice, setPathChoice] = useState<"audit" | "free" | null>(null);
  const [auditPromoRemaining, setAuditPromoRemaining] = useState<number | null>(null);
  const auditPromoTotal = 20;
  const poznavasSeRef = useRef<HTMLDivElement | null>(null);
  const choiceSectionRef = useRef<HTMLDivElement | null>(null);

  const step = STEPS[stepIndex];
  const contactStepIndex = STEPS.findIndex((s) => s.id === "contact");

  useEffect(() => {
    const fetchPromo = async () => {
      try {
        const res = await fetch("/api/booking/audit-promo-stats");
        if (!res.ok) return;
        const data = await res.json();
        if (typeof data.remaining === "number") {
          setAuditPromoRemaining(data.remaining);
        }
      } catch {
        // ignore
      }
    };
    fetchPromo();
  }, []);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  // Reset multi-selection když přejdeme na non-multi otázku
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
          source: "funnel",
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
          const choice = "free";
        openBookingPopup({
          email: email.trim().toLowerCase(),
          name: name.trim() || undefined,
          note: message?.trim() || undefined,
          leadId: data.leadId,
            source: "funnel",
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
              <h1 className="mt-8 text-3xl sm:text-4xl md:text-5xl font-bold text-foreground leading-tight">
                {step.title}
              </h1>
              <p className="mt-4 text-lg sm:text-xl text-foreground/80 leading-relaxed max-w-xl mx-auto">
                {step.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPathChoice("audit");
                    setStepIndex(1);
                  }}
                  className="flex flex-col rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all border-0 text-left w-full bg-accent hover:bg-accent-hover"
                >
                  <FunnelCtaImage src="/form/btn-prevzit-rizeni.png" wrapperClassName="bg-white/20" />
                  <span className="w-full py-3 px-3 bg-accent text-white font-bold text-center text-base sm:text-lg rounded-b-2xl">
                    Chci získat klid
                  </span>
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPathChoice("free");
                    setStepIndex(1);
                  }}
                  className="flex flex-col rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all text-left w-full bg-white"
                >
                  <FunnelCtaImage src="/form/btn-rozmyslim.png" />
                  <span className="w-full py-3 px-3 bg-accent/10 text-foreground font-bold text-center text-base sm:text-lg rounded-b-2xl border-b-2 border-accent/10">
                    Ještě se rozmýšlím
                  </span>
                </button>
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <ChevronDown className="text-foreground/50 w-8 h-8 animate-bounce" aria-hidden />
            </div>

            {/* Poznáváš se v tom? */}
            <section ref={poznavasSeRef} className="text-left max-w-lg mx-auto space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center">
                Poznáváš se v tom?
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {[
                  "Snažíš se zvládat všechno — a přitom máš pocit, že pořádně nezvládáš nic.",
                  "Večer nedokážeš vypnout. Myšlenky jedou dál, i když ty chceš odpočívat.",
                  "Výkon máš. Ale energie, klid a radost se někam vytrácejí.",
                  "Žiješ od úkolu k úkolu. Přítomný okamžik skoro neexistuje.",
                  "Zkoušel jsi meditaci, sport, více spánku. Pomohlo to — ale jen na chvíli.",
                ].map((text, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl p-4 border-2 border-accent/20 flex items-center gap-3"
                  >
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                      ✓
                    </span>
                    <p className="text-foreground font-medium text-sm sm:text-base">{text}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Co s koučingem můžeš získat */}
            <section className="text-left max-w-lg mx-auto space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center">
                Co získáš?
              </h2>
              <ul className="space-y-2 text-foreground/85 leading-relaxed text-sm sm:text-base">
                <li className="flex gap-2">
                  <span className="text-accent shrink-0">•</span>
                  <span><strong className="text-foreground">Konkrétní nástroje. </strong>Za 30 minut odejdeš s praktickými technikami, které můžeš použít ještě ten den.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent shrink-0">•</span>
                  <span><strong className="text-foreground">Pochopíš, proč dosavadní řešení fungovala jen napůl. </strong>Meditace, sport, produktivita — to jsou nástroje. Ale bez správného základu řeší jen příznaky. Na konzultaci pojmenujeme, co ti skutečně chybí.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent shrink-0">•</span>
                  <span><strong className="text-foreground">Odejdeš s jasným směrem, ne s dalším seznamem úkolů. </strong> Žádné obecné rady. Žádné přetížení informacemi. Jeden jasný směr, který dává smysl právě tobě.</span>
                </li>
              </ul>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() =>
                    choiceSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                  className="w-full px-6 py-3 bg-accent text-white rounded-xl font-bold text-base hover:bg-accent-hover transition-colors"
                >
                  Chci změnu
                </button>
              </div>
            </section>

            {/* 3 kroky k úspěchu: – nad Ahoj, jsem Matěj */}
            <section className="text-left max-w-lg mx-auto space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center">
                3 kroky k úspěchu:
              </h2>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">1</span>
                  <div>
                    <h3 className="font-bold text-foreground mb-0.5">Přijetí reality</h3>
                    <p className="text-foreground/85 text-sm">Pro smysluplnou změnu musíme znát naši výchozí pozici. A náš mozek má tendenci nám realitu zkreslovat.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">2</span>
                  <div>
                    <h3 className="font-bold text-foreground mb-0.5">Hledání cesty</h3>
                    <p className="text-foreground/85 text-sm">Každý si musíme najít tu svou cestu. Což znamená sjet z té hlavní dálnice, po které jdou všichni.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">3</span>
                  <div>
                    <h3 className="font-bold text-foreground mb-0.5">Žijem life</h3>
                    <p className="text-foreground/85 text-sm">Když už víme kudy, tak se můžeme vydat na cestu. Místy to bude těžké, ale věřím, že ty výhledy stojí za to.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Ahoj, jsem Matěj – nadpis, pak foto (později video), pak text */}
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
                  Tenhle kousek internetu jsem vytvořil, abys nemusel/a začínat od nuly – inspirace v textech, podpora v komunitě a individuální koučing, pokud to chceš vzít od podlahy.
                </p>
              </div>
            </section>

            {/* Jak převzít řízení – 5 na mobilu, 6 na PC + tlačítko */}
            <section className="max-w-lg mx-auto space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center">
                Jak převzít řízení?
              </h2>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() =>
                    choiceSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                  className="w-full px-6 py-3 bg-accent text-white rounded-xl font-bold text-base hover:bg-accent-hover transition-colors"
                >
                  Převzít řízení
                </button>
              </div>
            </section>
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
              {totalScore <= 5 && (
                <>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    Máš to dobře nastavené.
                  </h2>
                  <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
                  Zvládáš to dobře — a je vidět, že o sobě přemýšlíš. Pokud máš pocit, že je ještě co vylepšit, zarezervuj si 30 minutovou konzultaci zdarma na tlačítku níže. Jinak se neboj tuhle stránku zavřít. A třeba se k ní někdy v budoucnu vrátit.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setPathChoice("free");
                      if (contactStepIndex !== -1) {
                        setStepIndex(contactStepIndex);
                      }
                    }}
                    className="w-full px-6 py-3 bg-accent text-white rounded-xl font-bold text-base hover:bg-accent-hover transition-colors"
                  >
                    Rezervovat konzultaci zdarma →
                  </button>
                </>
              )}
              {totalScore >= 6 && totalScore <= 12 && (
                <>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    Zvládáš to. Ale za jakou cenu?
                  </h2>
                  <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
                    Navenek funguje všechno dobře. Ale uvnitř cítíš, že ta energie a lehkost, kterou jsi
                    míval, se někam vytrácí. Tohle není slabost — je to signál. A ten signál má konkrétní
                    příčinu, kterou spolu pojmenujeme.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setPathChoice("free");
                      if (contactStepIndex !== -1) {
                        setStepIndex(contactStepIndex);
                      }
                    }}
                    className="w-full px-6 py-3 bg-accent text-white rounded-xl font-bold text-base hover:bg-accent-hover transition-colors"
                  >
                    Chci vědět, co za tím je →
                  </button>
                </>
              )}
              {totalScore >= 13 && (
                <>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    Tvůj systém tě dožene dřív, než čekáš.
                  </h2>
                  <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
                    Jsi výkonný člověk, který si zvykl tlačit dál. Ale tělo i mysl mají hranici — a ty ji
                    pravděpodobně už cítíš. Přesně tady jsem byl já před dvěma lety. A přesně proto vím,
                    kudy vede cesta ven.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setPathChoice("free");
                      if (contactStepIndex !== -1) {
                        setStepIndex(contactStepIndex);
                      }
                    }}
                    className="w-full px-6 py-3 bg-accent text-white rounded-xl font-bold text-base hover:bg-accent-hover transition-colors"
                  >
                    Zarezervovat konzultaci teď →
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
                  href="/knihovna"
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
              {pathChoice === "audit"
                ? "Vyplňte údaje a hned poté si vyberte termín 90min auditu života."
                : "Vyplňte údaje a hned poté si vyberte termín 20min konzultace zdarma, kde zjistíme, jestli ti koučing může pomoct."}
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
                {pathChoice === "audit"
                  ? <>
                      Pro prvních {auditPromoTotal} lidí nabízím zvýhodněnou cenu{" "}
                      <strong>900 Kč za 90 minut auditu života</strong>.
                      <br />
                      Zbývá:{" "}
                      <strong>
                        {auditPromoRemaining !== null
                          ? Math.max(auditPromoRemaining, 0)
                          : auditPromoTotal}{" "}
                        / {auditPromoTotal}
                      </strong>{" "}
                      míst.
                    </>
                  : <>20 minutová konzultace zdarma, kde zjistíme, jestli ti koučing může pomoct.</>}
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
