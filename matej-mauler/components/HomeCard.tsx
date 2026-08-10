import { CONTACTS, SPAGHETTI_BLURB } from "@/lib/about";
import type { Dictionary, Lang } from "@/lib/dictionaries";

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const sans = "var(--font-sans)";
const rule = "1.5px solid rgba(26,22,20,0.1)";

/**
 * Homepage = vizitka. Krátké bio + kontakty (Discord první, pak mail, pak Facebook).
 * Žádné experimenty, žádný stav → čistě serverová komponenta.
 */
export function HomeCard({ dict, lang }: { dict: Dictionary; lang: Lang }) {
  const a = dict.about;
  const notes: Record<string, string> = {
    discord: a.discordNote,
    email: a.emailNote,
    facebook: a.facebookNote,
  };

  return (
    <main style={{ background: "var(--bg)", minHeight: "100dvh" }}>
      <div className="max-w-[720px] mx-auto px-5 md:px-8">
        <header className="pt-16 md:pt-24 pb-10 animate-fade-up">
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Spaghetti.ltd" width={70} height={70} style={{ display: "block", flexShrink: 0 }} />
            <span style={{ ...display, fontSize: 40, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1 }}>
              Spaghetti<span style={{ color: "var(--text-muted)" }}>.ltd</span>
            </span>
          </div>
          <p className="text-[18px] md:text-[22px] max-w-[620px]" style={{ ...display, fontStyle: "italic", color: "var(--text-primary)", lineHeight: 1.4 }}>
            {SPAGHETTI_BLURB[lang]}
          </p>
        </header>

        <section
          className="pb-12 animate-fade-up max-w-[620px]"
          style={{ animationDelay: "40ms", color: "var(--text-secondary)", fontFamily: sans, fontSize: 16, lineHeight: 1.7 }}
        >
          <p className="mb-4">{a.p1}</p>
          <p className="mb-4" style={{ fontWeight: 600, color: "var(--text-primary)" }}>{a.p2}</p>
          <p className="mb-4">{a.p3}</p>
          <p style={{ fontWeight: 600, color: "var(--text-primary)" }}>{a.p4}</p>
        </section>

        <section className="py-10 animate-fade-up" style={{ borderTop: rule, animationDelay: "80ms" }}>
          <h2 className="text-[20px] md:text-[24px]" style={{ ...display, fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 6 }}>
            {a.contactHeading}
          </h2>
          <p className="max-w-[620px]" style={{ fontFamily: sans, fontSize: 15, lineHeight: 1.6, color: "var(--text-secondary)", marginBottom: 20 }}>
            {a.contactLead}
          </p>
          <ul className="hcontacts">
            {CONTACTS.map((c, i) => (
              <li key={c.id}>
                <a
                  href={c.href}
                  className={`hcontact${i === 0 ? " primary" : ""}`}
                  {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  <span className="hcontact-label">{c.label}</span>
                  <span className="hcontact-note">{notes[c.id]}</span>
                  <span className="zarrow" aria-hidden="true">→</span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <footer className="py-8" style={{ borderTop: rule, color: "var(--text-muted)", fontFamily: sans, fontSize: 12 }}>
          © {new Date().getFullYear()} Spaghetti.ltd
        </footer>
      </div>
    </main>
  );
}
