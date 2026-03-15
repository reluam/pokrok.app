import type { Metadata } from "next";
import Link from "next/link";
import JourneyFlow from "@/components/JourneyFlow";

export const metadata: Metadata = {
  title: "Audit života | Žiju life",
  description:
    "Projdi životní cestu zastávku po zastávce. Ke každé najdeš cvičení, šablony a materiály.",
};

export default function ManualPage() {
  return (
    <main className="min-h-screen">

      {/* Nadpis */}
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

      {/* Info banner */}
      <section className="px-4 sm:px-6 lg:px-8 pb-2">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-sm text-amber-800">
            <span className="flex-shrink-0 mt-0.5">💾</span>
            <p>
              <strong>Data se nikam neukládají.</strong>{" "}
              Vše co vyplníš slouží jen k vygenerování dokumentu na konci průvodce.
              Po obnovení stránky přijdeš o všechna zapsaná data.
            </p>
          </div>
        </div>
      </section>

      {/* CESTA */}
      <section className="relative py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <JourneyFlow />
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <p className="text-base text-foreground/55">
            Chceš projít cestou se mnou? Místo šablony dostaneš průvodce.
          </p>
          <Link
            href="/koucing#rezervace"
            className="inline-block px-6 py-3 bg-accent text-white rounded-full font-semibold hover:bg-accent-hover transition-colors shadow-md"
          >
            Zjistit více o koučingu →
          </Link>
        </div>
      </section>

    </main>
  );
}
