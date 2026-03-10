import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function ManualTeaser() {
  return (
    <section className="relative py-6 md:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">

        {/* Stoh stránek pod dokumentem */}
        <div className="relative paper-hover cursor-pointer">
          <div
            className="absolute inset-x-3 bottom-0 top-3 rounded-[26px]"
            style={{ background: "#E8DDB8", opacity: 0.7 }}
            aria-hidden
          />
          <div
            className="absolute inset-x-6 bottom-0 top-6 rounded-[24px]"
            style={{ background: "#DDD4A8", opacity: 0.5 }}
            aria-hidden
          />

          {/* Hlavní papírová stránka */}
          <div
            className="relative rounded-[28px] overflow-hidden"
            style={{
              background: "#FFFFFF",
              boxShadow: "0 4px 32px rgba(0,0,0,0.06), 0 1px 8px rgba(0,0,0,0.04)",
            }}
          >
            {/* Perforace – dělicí čára */}
            <div
              className="absolute left-16 top-0 bottom-0 w-0 border-l-2 border-dashed"
              style={{ borderColor: "rgba(239, 68, 68, 0.28)" }}
              aria-hidden
            />
            {/* Dírky */}
            <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col items-center justify-around py-8" aria-hidden>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full"
                  style={{
                    background: "#FDFDF7",
                    boxShadow: "inset 0 2px 5px rgba(0,0,0,0.18), inset 0 -1px 2px rgba(0,0,0,0.06)",
                  }}
                />
              ))}
            </div>

            {/* Obsah */}
            <div className="pl-20 pr-7 py-7 md:pl-24 md:pr-10 md:py-8 flex items-center justify-between gap-8">
              <div className="space-y-1.5">
                <div
                  className="text-[10px] font-bold uppercase tracking-[0.22em]"
                  style={{ color: "rgba(239, 68, 68, 0.5)", fontFamily: "monospace" }}
                >
                  Tahák
                </div>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                  Jak žít?
                </h2>
                <p className="text-sm md:text-base text-foreground/55">
                  Návod k použití člověka v moderní době, který bych si přál dostat k narození.
                </p>
              </div>

              <Link
                href="/manual"
                className="hidden sm:inline-flex shrink-0 items-center gap-2 text-base font-semibold text-foreground/70 hover:text-accent transition-colors"
              >
                Přečíst manuál
                <ArrowRight size={18} />
              </Link>
            </div>

            {/* Mobilní link */}
            <div className="sm:hidden pl-20 pr-7 pb-6 md:pl-24">
              <Link
                href="/manual"
                className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/70 hover:text-accent transition-colors"
              >
                Přečíst manuál
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
