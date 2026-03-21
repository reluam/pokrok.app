import type { Metadata } from "next";
import { verifyUserSession, getUserPurchases, getJourneyData, createFreePurchase } from "@/lib/user-auth";
import JourneyFlow, { type JourneyState } from "@/components/JourneyFlow";
import AuditIntroCard from "./AuditIntroCard";

export const metadata: Metadata = {
  title: "Tvoje mapa | Žiju life",
  description:
    "Interaktivní průvodce, který ti pomůže zmapovat kde jsi a naplánovat kam chceš. Zdarma.",
};

export default async function AuditZivotaPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  const params = await searchParams;
  const paymentSuccess = params.payment === "success";

  const user = await verifyUserSession();

  // Nepřihlášen → úvodní karta
  if (!user) {
    return <AuditIntroCard />;
  }

  const purchases = await getUserPurchases(user.id);
  const auditPurchases = purchases.filter((p) => p.product_slug === "audit-zivota");
  const activePurchase = auditPurchases.find((p) => !p.completed_at);

  // Přihlášen, ale žádná aktivní licence → vytvoř automaticky zdarma
  let purchaseId: string;
  if (activePurchase) {
    purchaseId = activePurchase.id;
  } else {
    purchaseId = await createFreePurchase(user.id);
  }

  // Načti uložená data pro aktivní licenci
  const journeyResult = await getJourneyData(user.id);
  const initialData = journeyResult?.data as JourneyState | null;
  const resolvedPurchaseId = journeyResult?.purchaseId ?? purchaseId;

  return (
    <main className="min-h-screen">
      {paymentSuccess && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-3 text-center text-sm text-green-800">
          Vítej v Tvoje mapa!
        </div>
      )}

      <section className="pt-10 pb-2 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Tvoje mapa</h1>
          <p className="text-base text-foreground/55 max-w-xl mx-auto">
            Sedm zastávek od „kde jsem" po „žiju podle sebe". Ke každé najdeš cvičení, šablony a materiály.
          </p>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 pb-2">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-green-50 border border-green-200/80 text-sm text-green-800">
            <span className="flex-shrink-0 mt-0.5">💾</span>
            <p>
              <strong>Tvůj postup se průběžně ukládá.</strong>{" "}
              Kdykoli se můžeš vrátit a pokračovat tam, kde jsi skončil/a.
            </p>
          </div>
        </div>
      </section>

      <section className="relative py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <JourneyFlow initialData={initialData} purchaseId={resolvedPurchaseId} />
        </div>
      </section>
    </main>
  );
}
