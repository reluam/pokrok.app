import type { Metadata } from "next";
import Link from "next/link";
import { getLang, type Lang } from "@/lib/lang";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Lab — experimenty",
  description: "Interaktivní experimenty: cesta po zvukové vlně, hudební studio a další. Jednodušší projekty žijí přímo tady, ty větší odkazujeme.",
};

type Card = {
  emoji: string; color: string; href: string; external?: boolean;
  title: { cs: string; en: string }; desc: { cs: string; en: string };
};

// Jednodušší projekty žijí přímo tady (stejné okno);
// větší jsou odkazy a otevírají se v novém okně.
const CARDS: Card[] = [
  {
    emoji: "🔊", color: "#E0E7FF", href: "/sound",
    title: { cs: "Cesta po zvukové vlně", en: "A journey along a sound wave" },
    desc: { cs: "Tvůj kurzor je ucho. Scrolluj zvukem od chvění po ozvěnu — a všechno si poslechni.", en: "Your cursor is an ear. Scroll through sound from a tremble to an echo — and hear it all." },
  },
  {
    emoji: "🎶", color: "#efe9fb", href: "/music",
    title: { cs: "Jak vzniká hudba", en: "How music is made" },
    desc: { cs: "Poskládej skladbu po vrstvách: beat, basa, akordy, melodie. Mřížky, fadery, efekty.", en: "Build a track layer by layer: beat, bass, chords, melody. Grids, faders, effects." },
  },
  {
    emoji: "🍝", color: "#FEF3C7", href: "https://spaghetti.ltd", external: true,
    title: { cs: "Spaghetti.ltd", en: "Spaghetti.ltd" },
    desc: { cs: "Interaktivní encyklopedie propojená nudlemi poznání. Vesmír, zvuk, Stopařův průvodce a další.", en: "An interactive encyclopedia connected by knowledge noodles. Space, sound, the Hitchhiker's Guide and more." },
  },
  {
    emoji: "📻", color: "#DCFCE7", href: "/radio",
    title: { cs: "Rádio", en: "The Radio" },
    desc: { cs: "Nekonečné generativní rádio — hlasuj o jednotlivých buňkách a nalaď, co poletí éterem dál.", en: "An endless generative radio — vote on the cells and tune what plays next." },
  },
];

const UI = {
  cs: { eyebrow: "Laboratoř Matěje Maulera", tagline: "Experimenty, prototypy a špatné nápady uvedené v život.", sub: "Jednodušší věci žijí přímo tady. Ty větší mají vlastní adresu a otevřou se v novém okně ↗.", new: "↗ otevře se v novém okně" },
  en: { eyebrow: "Matěj Mauler's laboratory", tagline: "Experiments, prototypes and bad ideas brought to life.", sub: "Smaller things live right here. Bigger ones have their own address and open in a new window ↗.", new: "↗ opens in a new window" },
} as const;

export default async function Home() {
  const lang: Lang = await getLang();
  const u = UI[lang];
  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: "72px 24px 80px" }}>
      <header style={{ marginBottom: 40 }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.28em", color: "var(--text-muted)", margin: 0 }}>{u.eyebrow}</p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(40px,8vw,64px)", fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.02, margin: "10px 0 14px" }}>The Lab 🧪</h1>
        <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 19, margin: "0 0 8px", color: "var(--text-primary)" }}>{u.tagline}</p>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-muted)", margin: 0, maxWidth: 520 }}>{u.sub}</p>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 }}>
        {CARDS.map((c) => {
          const inner = (
            <>
              <span style={{ fontSize: 34, lineHeight: 1 }}>{c.emoji}</span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                {c.title[lang]}{c.external && <span style={{ fontWeight: 400, opacity: 0.55 }}> ↗</span>}
              </span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.55 }}>{c.desc[lang]}</span>
              {c.external && <span style={{ fontFamily: "var(--font-sans)", fontSize: 10.5, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{u.new}</span>}
            </>
          );
          const style: React.CSSProperties = {
            display: "flex", flexDirection: "column", gap: 10,
            background: c.color, border: "2.5px solid var(--border)", borderRadius: 20,
            boxShadow: "5px 5px 0 var(--shadow)", padding: "26px 26px 22px",
            textDecoration: "none", color: "var(--text-primary)",
            transition: "transform 140ms ease, box-shadow 140ms ease",
          };
          return c.external ? (
            <a key={c.href} href={c.href} target="_blank" rel="noopener noreferrer" className="lab-card" style={style}>{inner}</a>
          ) : (
            <Link key={c.href} href={c.href} className="lab-card" style={style}>{inner}</Link>
          );
        })}
      </section>

      <footer style={{ marginTop: 56, paddingTop: 20, borderTop: "1.5px solid rgba(26,22,20,0.1)", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", display: "flex", gap: 16, flexWrap: "wrap" }}>
        <span>© {new Date().getFullYear()} The Lab</span>
        <a href="https://spaghetti.ltd" target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-secondary)" }}>Spaghetti.ltd ↗</a>
      </footer>

      <style>{`.lab-card:hover { transform: translate(-2px,-2px); box-shadow: 7px 7px 0 var(--shadow); }`}</style>
    </main>
  );
}
