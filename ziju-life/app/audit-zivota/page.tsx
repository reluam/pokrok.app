import type { Metadata } from "next";
import { verifyUserSession, getUserPurchases, getJourneyData } from "@/lib/user-auth";
import JourneyFlow, { type JourneyState } from "@/components/JourneyFlow";
import AuditCheckoutButton from "./AuditCheckoutButton";

export const metadata: Metadata = {
  title: "Audit života | Žiju life",
  description:
    "Projdi životní cestu zastávku po zastávce. Sedm kroků, cvičení, šablony a materiály — vše v jednom průvodci.",
};

const STEPS = [
  { icon: "📍", label: "Kde teď jsi?", desc: "Kolo života — upřímný pohled na všechny oblasti" },
  { icon: "🔋", label: "Energie & únava", desc: "Co tě dobíjí a co vysává" },
  { icon: "🧭", label: "Hodnoty & priority", desc: "Co je pro tebe skutečně důležité" },
  { icon: "🎯", label: "Co chceš", desc: "Vize a konkrétní cíle do budoucna" },
  { icon: "🚧", label: "Co tě brzdí", desc: "Přesvědčení a vzorce, které stojí v cestě" },
  { icon: "🗺️", label: "Plán", desc: "Konkrétní kroky a závazky" },
  { icon: "✅", label: "Závěr & dokument", desc: "Osobní shrnutí celé cesty" },
];

export default async function AuditZivotaPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  const params = await searchParams;
  const paymentSuccess = params.payment === "success";
  const paymentPending = params.payment === "pending";

  const user = await verifyUserSession();
  const purchases = user ? await getUserPurchases(user.id) : [];
  const auditPurchases = purchases.filter((p) => p.product_slug === "audit-zivota");
  const activePurchases = auditPurchases.filter((p) => !p.completed_at);
  const activeCount = activePurchases.length;
  const hasActivePurchase = activeCount > 0;
  const hasAnyPurchase = auditPurchases.length > 0;
  // Cenu určuje checkout route dle emailu; tato hodnota ovlivňuje jen UI tlačítka
  const isReturning = hasAnyPurchase;

  // Přihlášen + všechny licence dokončeny → zobraz stav "dokončeno, koupit znovu"
  if (hasAnyPurchase && !hasActivePurchase) {
    return (
      <main className="min-h-screen">
        <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto text-center space-y-6">
            <p className="text-4xl">✅</p>
            <h1 className="text-2xl font-bold text-foreground">Audit dokončen</h1>
            <p className="text-sm text-foreground/60 leading-relaxed">
              Tvůj audit života je dokončen a přístup byl uzavřen. Chceš ho zopakovat?
              Koupíš znovu za zvýhodněnou cenu 100 Kč.
            </p>
            <AuditCheckoutButton isReturning={true} userEmail={user?.email} />
          </div>
        </section>
      </main>
    );
  }

  // Přihlášen + aktivní licence → načti uložená data a zobraz průvodce
  if (hasActivePurchase) {
    const journeyResult = user ? await getJourneyData(user.id) : null;
    const initialData = journeyResult?.data as JourneyState | null;
    const purchaseId = journeyResult?.purchaseId ?? activePurchases[0]?.id ?? "";

    return (
      <main className="min-h-screen">
        {paymentSuccess && (
          <div className="bg-green-50 border-b border-green-200 px-4 py-3 text-center text-sm text-green-800">
            Platba proběhla úspěšně — vítej v Auditu života!
          </div>
        )}
        {paymentPending && (
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-3 text-center text-sm text-blue-800">
            Platba proběhla! Přístupový odkaz ti dorazí na e-mail za chvíli.
          </div>
        )}

        <section className="pt-10 pb-2 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Audit života
            </h1>
            <p className="text-base text-foreground/55 max-w-xl mx-auto">
              Sedm zastávek od „kde jsem" po „žiju podle sebe". Ke každé najdeš cvičení, šablony a materiály.
            </p>
          </div>
        </section>

        <section className="px-4 sm:px-6 lg:px-8 pb-2">
          <div className="max-w-4xl mx-auto space-y-2">
            <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-green-50 border border-green-200/80 text-sm text-green-800">
              <span className="flex-shrink-0 mt-0.5">💾</span>
              <p>
                <strong>Tvůj postup se průběžně ukládá.</strong>{" "}
                Kdykoli se můžeš vrátit a pokračovat tam, kde jsi skončil/a.
              </p>
            </div>
            {activeCount > 1 && (
              <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-blue-50 border border-blue-200/80 text-sm text-blue-800">
                <span className="flex-shrink-0 mt-0.5">🎟️</span>
                <p>
                  Máš celkem <strong>{activeCount} volné {activeCount === 2 ? "licence" : activeCount <= 4 ? "licence" : "licencí"}</strong>.
                  Po dokončení tohoto auditu ti zbyde ještě {activeCount - 1} {activeCount - 1 === 1 ? "volná" : activeCount - 1 <= 4 ? "volné" : "volných"}.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="relative py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <JourneyFlow initialData={initialData} purchaseId={purchaseId} />
          </div>
        </section>
      </main>
    );
  }

  // Nepřihlášen nebo bez nákupu → prodejní stránka
  return (
    <main className="min-h-screen">

      {/* Hero */}
      <section className="pt-14 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <div className="inline-block text-xs font-bold uppercase tracking-widest text-accent/80 bg-accent/8 px-3 py-1 rounded-full">
            Digitální průvodce
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground leading-tight">
            Audit života
          </h1>
          <p className="text-lg text-foreground/65 max-w-2xl mx-auto leading-relaxed">
            Sedm řízených kroků, které ti pomohou upřímně zmapovat život, pojmenovat co tě brzdí a sestavit plán, jak žít víc podle sebe.
          </p>
          <div className="pt-2">
            <AuditCheckoutButton isReturning={isReturning} userEmail={user?.email} />
          </div>
          <p className="text-xs text-foreground/40">
            Platba kartou přes Stripe · Okamžitý přístup po zaplacení
          </p>
        </div>
      </section>

      {/* Co získáš */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-foreground/[0.02]">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-2xl font-bold text-foreground text-center">Co v průvodci najdeš</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {STEPS.map((step) => (
              <div
                key={step.label}
                className="flex items-start gap-4 bg-white rounded-2xl px-5 py-4 border border-black/8 shadow-sm"
              >
                <span className="text-2xl shrink-0 mt-0.5">{step.icon}</span>
                <div>
                  <p className="font-semibold text-foreground text-sm">{step.label}</p>
                  <p className="text-xs text-foreground/55 mt-0.5 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefity */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-2xl font-bold text-foreground text-center">Jak to funguje</h2>
          <div className="space-y-5">
            {[
              {
                icon: "🖥️",
                title: "Interaktivní online průvodce",
                text: "Každý krok se otevírá postupně. Vyplňuješ přímo v prohlížeči — žádná instalace, žádné přihlášení navíc.",
              },
              {
                icon: "📋",
                title: "Cvičení a šablony ke každé zastávce",
                text: "Kolo života, hodnotový filtr, analýza přesvědčení — strukturované nástroje, které tě provedou každým krokem.",
              },
              {
                icon: "📄",
                title: "Osobní dokument na konci",
                text: "Po dokončení průvodce vygeneruješ vlastní shrnutí — plán v PDF, který si odnesěš.",
              },
              {
                icon: "🔄",
                title: "Jednorázové vyplnění, možnost opakovat",
                text: "Data se neukládají — každé otevření je čistý list. Chceš audit za rok zopakovat? Koupíš znovu za zvýhodněnou cenu 100 Kč.",
              },
            ].map((b) => (
              <div key={b.title} className="flex gap-4 items-start">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-xl">
                  {b.icon}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{b.title}</p>
                  <p className="text-sm text-foreground/60 mt-0.5 leading-relaxed">{b.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cena + CTA */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 bg-foreground/[0.02]">
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="bg-white rounded-3xl border border-black/10 shadow-sm px-8 py-8 space-y-5">
            <p className="text-sm font-bold uppercase tracking-widest text-foreground/40">Cena</p>
            <div className="space-y-1">
              <p className="text-5xl font-extrabold text-foreground">250 Kč</p>
              <p className="text-sm text-foreground/50">jednorázová platba · bez předplatného</p>
            </div>
            <div className="text-xs text-foreground/40 bg-black/4 rounded-xl px-4 py-2">
              Opakovaný nákup (pro vracející se zákazníky): <strong>100 Kč</strong>
            </div>
            <AuditCheckoutButton isReturning={isReturning} userEmail={user?.email} />
            <p className="text-xs text-foreground/35">
              Okamžitý přístup po zaplacení · Platba kartou přes Stripe
            </p>
          </div>
        </div>
      </section>

      {/* Pro koho to je */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto space-y-5">
          <h2 className="text-2xl font-bold text-foreground text-center">Pro koho je Audit života</h2>
          <ul className="space-y-3">
            {[
              'Cítíš, že žiješ „na autopilotu" a chceš se zastavit a zhodnotit, kde jsi',
              'Stojíš před změnou — práce, vztahu, směru — a nevíš, od čeho začít',
              'Máš spoustu myšlenek v hlavě a chceš je dostat na papír do struktury',
              'Chceš si jednou za rok sednout a upřímně si zmapovat svůj život',
            ].map((item) => (
              <li key={item} className="flex gap-3 items-start text-sm text-foreground/70">
                <span className="text-accent mt-0.5 shrink-0">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

    </main>
  );
}
