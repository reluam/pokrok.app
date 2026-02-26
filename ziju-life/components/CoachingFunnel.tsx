"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useBookingPopup } from "@/components/BookingPopup";
import {
  Circle,
  ChevronDown,
  Clock,
  Scale,
  CalendarCheck,
  Users,
  Wallet,
  Compass,
  Zap,
  Heart,
  Sun,
  Coffee,
  Rocket,
  Book,
  Video,
  FileText,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import type { InspirationData, InspirationItem } from "@/lib/inspiration";

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
    title: "Začni žít life podle sebe.",
    subtitle:
      "Většinu dne neřídíš ty, ale tvoje podvědomí. Ukážu ti, jak převzít řízení a nastavit mysl, aby tě vedla, kam chceš ty. Jsi připraven/a?",
    cta: "Chci převzít řízení",
  },
  {
    id: "q1",
    type: "question" as const,
    question: "Jakou část dne dnes trávíš tím, co opravdu chceš?",
    options: [
      "Většinu. Jsem pánem svého času.",
      "Půl na půl. Často bojuji s tím, co po mně chtějí ostatní.",
      "Skoro žádnou. Dělám jen to, co se ode mě očekává.",
    ],
    icons: [Clock, Scale, CalendarCheck],
  },
  {
    id: "q2",
    type: "question" as const,
    question:
      "Co tě nejvíce brzdí v tom, abys udělal zásadní změnu (kariéra, byznys, životní styl)?",
    options: [
      "Strach z toho, co si o mně pomyslí rodina a okolí.",
      "Nedostatek peněz nebo prostředků.",
      "Vůbec nevím, kde začít.",
    ],
    icons: [Users, Wallet, Compass],
  },
  {
    id: "q3",
    type: "question" as const,
    question:
      "Představ si, že za 3 měsíce žiješ život stoprocentně podle svých pravidel. Co je pro tebe největší odměna?",
    options: [
      "Svoboda. Dělám jen to, co mi dává smysl.",
      "Klid. Už mě netrápí, co si myslí okolí.",
      "Energie. Konečně se ráno těším na to, co vytvořím.",
    ],
    icons: [Zap, Heart, Sun],
  },
  {
    id: "q4",
    type: "question" as const,
    question: "Kolik času můžeš svým cílům věnovat?",
    options: [
      "Pár hodin týdně. Víc teď nevyčaruju.",
      "Mám své povinnosti, ale zbytek volného času investuju do změny.",
      "Jdu do toho naplno. Chci výsledky co nejrychleji.",
    ],
    icons: [Clock, Coffee, Rocket],
  },
  {
    id: "contact",
    type: "contact" as const,
  },
];

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
  const [latestInspirace, setLatestInspirace] = useState<InspirationItem[]>([]);
  const [showPostBookingMessage, setShowPostBookingMessage] = useState(false);
  const poznavasSeRef = useRef<HTMLDivElement | null>(null);

  const step = STEPS[stepIndex];

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
        setShowPostBookingMessage(true);
        openBookingPopup({
          email: email.trim().toLowerCase(),
          name: name.trim() || undefined,
          note: message?.trim() || undefined,
          leadId: data.leadId,
          source: "funnel",
        });
      }
    } catch {
      setError("Nepodařilo se odeslat. Zkuste to prosím znovu.");
      setLoading(false);
    }
  };

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
            <div className="pt-4">
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

            <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
              <button
                type="button"
                onClick={() => setStepIndex(1)}
                className="flex flex-col rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all border-0 text-left w-full bg-accent hover:bg-accent-hover"
              >
                <FunnelCtaImage src="/form/btn-prevzit-rizeni.png" wrapperClassName="bg-white/20" />
                <span className="w-full py-3 px-3 bg-accent text-white font-bold text-center text-base sm:text-lg rounded-b-2xl">
                  Chci převzít řízení
                </span>
              </button>
              <button
                type="button"
                onClick={() =>
                  poznavasSeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
                className="flex flex-col rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all text-left w-full bg-white"
              >
                <FunnelCtaImage src="/form/btn-rozmyslim.png" />
                <span className="w-full py-3 px-3 bg-accent/10 text-foreground font-bold text-center text-base sm:text-lg rounded-b-2xl border-b-2 border-accent/10">
                  Ještě se rozmýšlím
                </span>
              </button>
            </div>

            <p className="pt-3 text-sm text-foreground/70 max-w-xl mx-auto">
              Pro prvních 15 lidí nabízím zvýhodněnou cenu <strong>500 Kč za sezení</strong> na první 3 měsíce.
            </p>

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
                  "Připadáš si, že ses do tohoto světa narodil omylem.",
                  "Tvůj den neřídíš ty, ale požadavky ostatních a skryté strachy.",
                  "Máš všechno, co bys „měl\" mít, ale cítíš, že ti život protéká mezi prsty.",
                  "Vidíš, jak reaguješ, ale neumíš to změnit.",
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
                Co s koučingem můžeš získat
              </h2>
              <ul className="space-y-2 text-foreground/85 leading-relaxed text-sm sm:text-base">
                <li className="flex gap-2">
                  <span className="text-accent shrink-0">•</span>
                  <span><strong className="text-foreground">Jasno v tom, co chceš a proč</strong> – místo „mělo by se" přijdeme na to, co je opravdu tvoje.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent shrink-0">•</span>
                  <span><strong className="text-foreground">Fokus na akci</strong> – Najdeme konkrétní kroky, jak vzít život zpátky do tvých rukou.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent shrink-0">•</span>
                  <span><strong className="text-foreground">Žádné manuály</strong> – Budeme spolu řešit tvoji unikátní situaci.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent shrink-0">•</span>
                  <span><strong className="text-foreground">Hravost i v těžkých věcech</strong> – I vážná témata se dají probrat bez toho, abychom ztratili radost ze života.</span>
                </li>
              </ul>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setStepIndex(1)}
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
                  Tenhle kousek internetu jsem vytvořil, abys nemusel/a začínat od nuly – inspirace v textech, podpora v komunitě a individuální koučink, pokud to chceš vzít od podlahy.
                </p>
              </div>
            </section>

            {/* Jak převzít řízení – 5 na mobilu, 6 na PC + tlačítko */}
            <section className="max-w-lg mx-auto space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center">
                Jak převzít řízení?
              </h2>
              {latestInspirace.length > 0 && (
                <>
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
                </>
              )}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setStepIndex(1)}
                  className="w-full px-6 py-3 bg-accent text-white rounded-xl font-bold text-base hover:bg-accent-hover transition-colors"
                >
                  Převzít řízení
                </button>
              </div>
            </section>
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
            <div className="grid grid-cols-2 gap-3">
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
                    className={`aspect-square rounded-2xl border-2 transition-all font-medium flex flex-col items-center justify-center gap-2 p-3 text-center ${
                      isSelected
                        ? "border-accent bg-accent text-white"
                        : "border-black/10 bg-white hover:border-accent hover:bg-accent/5 text-foreground"
                    }`}
                  >
                    {IconComponent ? (
                      <IconComponent
                        size={28}
                        className={isSelected ? "text-white" : "text-accent"}
                        strokeWidth={1.5}
                      />
                    ) : (
                      <Circle
                        size={24}
                        className={isSelected ? "text-white fill-white" : "text-accent"}
                        strokeWidth={isSelected ? 0 : 2}
                      />
                    )}
                    <span className="text-xs sm:text-sm leading-tight line-clamp-4">{opt}</span>
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
              Vyplňte údaje a hned poté si vyberte termín 30min sezení zdarma.
            </p>
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label htmlFor="funnel-name" className="block text-sm font-medium text-foreground mb-1">
                  Jméno
                </label>
                <input
                  id="funnel-name"
                  type="text"
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
                Pro prvních 15 lidí nabízím zvýhodněnou cenu <strong>500 Kč za sezení</strong> na první 3 měsíce.
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
