import type { Metadata } from "next";
import Link from "next/link";
import { CONTACTS, EMAIL, PERSON_NAME, PERSON_URL } from "@/lib/about";

/**
 * Osobní stránka. Jedna stránka, jeden sloupec, žádná historie ani projekty —
 * ty mluví samy za sebe na „/". Hlas je Spaghetti hlas (lowercase, casual),
 * protože tohle je podstránka Spaghetti.ltd, ne samostatný web.
 *
 * Styluje se inline přes stejné tokeny jako /me, aby nepotřebovala vlastní CSS.
 */

const description =
  "matěj mauler — sales by day, music as matt mauler at night, and small web experiments in between.";

export const metadata: Metadata = {
  title: "matěj — Spaghetti.ltd",
  description,
  alternates: { canonical: "/matej" },
  openGraph: {
    type: "profile",
    title: `${PERSON_NAME} — Spaghetti.ltd`,
    description,
    url: "/matej",
    siteName: "Spaghetti.ltd",
    images: [{ url: "/logo.svg" }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: PERSON_NAME,
  url: PERSON_URL,
  email: `mailto:${EMAIL}`,
  description,
  sameAs: CONTACTS.filter((c) => c.external).map((c) => c.href),
};

const para: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: 16.5,
  lineHeight: 1.75,
  color: "var(--text-secondary)",
  margin: "0 0 18px",
};

export default function MatejPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main style={{ background: "var(--bg)", minHeight: "100dvh" }}>
        <div className="max-w-[680px] mx-auto px-5 md:px-8 py-16 md:py-20">
          <Link
            href="/"
            style={{ display: "inline-block", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)", textDecoration: "none", marginBottom: 28 }}
          >
            ← Spaghetti.ltd
          </Link>

          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 34, letterSpacing: "-0.03em", lineHeight: 1.05, marginBottom: 22 }}>
            matěj mauler
          </h1>

          <p style={para}>
            hi, i&apos;m matěj. i&apos;m of the human species. life, and being human, is a fascinating
            and humbling experience for me — one that regularly takes my breath away.
          </p>
          <p style={para}>
            i have far too many interests to keep in one lane. sales by day, music as matt mauler at
            night, small web experiments in between.
          </p>
          <p style={para}>
            my head works a lot like this place: a pile of random neurons wired to each other, firing
            off connections nobody asked for. that&apos;s where the odd stuff comes from — a game about
            noticing rules, an encyclopedia of fictional worlds, a radio that renders on a server.
            none of it planned. all of it connected to something else.
          </p>
          <p style={{ ...para, marginBottom: 40 }}>
            i keep learning — about the world, about people, about myself. whatever i&apos;m doing,
            that&apos;s the point of it.
          </p>

          <p style={{ fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10 }}>
            say hi
          </p>
          <ul style={{ listStyle: "none", display: "flex", flexWrap: "wrap", gap: "8px 20px", margin: 0, padding: 0 }}>
            {CONTACTS.map((c) => (
              <li key={c.id}>
                <a
                  href={c.href}
                  {...(c.external ? { target: "_blank", rel: "me noopener noreferrer" } : {})}
                  style={{ fontFamily: "var(--font-sans)", fontSize: 15.5, color: "var(--text-primary)", textDecoration: "underline", textUnderlineOffset: 4 }}
                >
                  {c.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </>
  );
}
