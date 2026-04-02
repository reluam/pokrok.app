import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { checkManualAccess } from "@/lib/manual-auth";
import {
  verifyUserSession,
  getUserPurchases,
  getJourneyData,
  createFreePurchase,
} from "@/lib/user-auth";
import JourneyFlow, { type JourneyState } from "@/components/JourneyFlow";

export const metadata: Metadata = {
  title: "Kompas | Manuál | Žiju life",
  description:
    "Projdi životní cestu zastávku po zastávce. Sedm kroků, cvičení, šablony a materiály — vše v jednom průvodci.",
};

export default async function ManualTvujKompasPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  // Manuál access check — no subscription → redirect to sales page
  const hasAccess = await checkManualAccess();
  if (!hasAccess) redirect("/manual");

  const params = await searchParams;
  const paymentSuccess = params.payment === "success";

  // Try to load saved journey data (works for users with DB session)
  const user = await verifyUserSession();

  let purchaseId = "";
  let initialData: JourneyState | null = null;

  if (user) {
    const purchases = await getUserPurchases(user.id);
    const activePurchase = purchases.find(
      (p) => p.product_slug === "audit-zivota" && !p.completed_at
    );

    if (activePurchase) {
      purchaseId = activePurchase.id;
    } else {
      purchaseId = await createFreePurchase(user.id);
    }

    const journeyResult = await getJourneyData(user.id);
    initialData = journeyResult?.data as JourneyState | null;
    if (journeyResult?.purchaseId) purchaseId = journeyResult.purchaseId;
  }

  return (
    <main className="min-h-screen">
      {paymentSuccess && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-3 text-center text-sm text-green-800">
          Vítej v Manuálu!
        </div>
      )}

      <section className="pt-10 pb-2 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-2">
          <p className="text-xs font-bold text-accent uppercase tracking-widest mb-1">
            Manuál
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Kompas
          </h1>
          <p className="text-base text-foreground/55 max-w-xl mx-auto">
            Sedm zastávek od „kde jsem" po „žiju podle sebe". Ke každé najdeš
            cvičení, šablony a materiály.
          </p>
        </div>
      </section>

      {user && (
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
      )}

      <section className="relative py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <JourneyFlow initialData={initialData} purchaseId={purchaseId} />
        </div>
      </section>
    </main>
  );
}
