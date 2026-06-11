import type { Metadata } from "next";
import Link from "next/link";
import { getLang, type Lang } from "@/lib/lang";
import { getPublicExperiments } from "@/lib/experimentsDb";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Lab — experimenty",
  description: "Mám blbé nápady a hromadu umělé vůle je uskutečnit. 9 z 10 experimentů je ztráta času. Tady jsou všechny. / I have bad ideas and plenty of artificial willpower to build them.",
};

// Původní texty ze Spaghetti.ltd (před pivotem na encyklopedii).
const TXT = {
  cs: {
    eyebrow: "Laboratoř Matěje Maulera",
    tagline: "Mám blbé nápady a hromadu umělé vůle je uskutečnit.",
    sub: "9 z 10 experimentů je ztráta času. Tady jsou všechny.",
    expTitle: "Experimenty",
    expSub: "Každý vypadal jako skvělý nápad. Většina pořád vypadá. To je ten problém.",
    aboutHeading: "O projektu",
    p1: "Ahoj, jsem Matěj. Posedne mě nějaká věc, něco postavím a jdu dál. Pokaždé jsem přesvědčený, že je to ten nejlepší nápad, co jsem kdy měl. Většinou není.",
    p2: "The Lab je místo, kde ty nápady žijí. Některé jsou užitečné. Některé jsou jen zajímavé. Většina není ani jedno.",
    p3a: "Jestli tě tu něco zaujme — nebo potřebuješ někoho, kdo vymyslí 9 špatných nápadů, abys našel ten jeden dobrý — ",
    writeMe: "napiš mi",
    p3b: ".",
    rewardA: "Díky, žes to dočetl až sem, a za odměnu se můžeš kouknout, ",
    rewardLink: "co tě v životě nejspíš nepotká.",
    newWindow: "↗ otevře se v novém okně",
  },
  en: {
    eyebrow: "Matěj Mauler's laboratory",
    tagline: "I have bad ideas and plenty of artificial willpower to build them.",
    sub: "9 out of 10 experiments are a waste of time. This is all of them.",
    expTitle: "Experiments",
    expSub: "Each one seemed like a great idea. Most still do. That's the problem.",
    aboutHeading: "About",
    p1: "Hi, I'm Matěj. I get obsessed with things, build something, and move on. Every time I'm convinced it's the best idea I've ever had. Usually it isn't.",
    p2: "The Lab is where those ideas live. Some are useful. Some are just interesting. Most are neither.",
    p3a: "If something here catches your eye — or you need someone to come up with 9 bad ideas so you can find the one good one — ",
    writeMe: "write to me",
    p3b: ".",
    rewardA: "Thanks for reading this far — as a reward, you can check out ",
    rewardLink: "what probably won't happen to you in life.",
    newWindow: "↗ opens in a new window",
  },
} as const;

function fmtDate(iso: string, lang: Lang): string {
  const d = new Date(iso + "T00:00:00");
  return lang === "cs"
    ? d.toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" })
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function Home() {
  const lang: Lang = await getLang();
  const u = TXT[lang];
  const items = await getPublicExperiments(lang);

  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: "72px 24px 80px" }}>
      <LanguageSwitcher lang={lang} />

      <header style={{ marginBottom: 40 }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.28em", color: "var(--text-muted)", margin: 0 }}>{u.eyebrow}</p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(40px,8vw,64px)", fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.02, margin: "10px 0 14px" }}>The Lab 🧪</h1>
        <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 19, margin: "0 0 8px", color: "var(--text-primary)" }}>{u.tagline}</p>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-muted)", margin: 0, maxWidth: 520 }}>{u.sub}</p>
      </header>

      <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap", marginBottom: 18 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>{u.expTitle}</h2>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>{u.expSub}</span>
      </div>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 }}>
        {items.map((c) => {
          const inner = (
            <>
              <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontSize: 34, lineHeight: 1 }}>{c.emoji}</span>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 10.5, color: "var(--text-muted)", letterSpacing: "0.06em" }}>
                  #{String(c.number).padStart(2, "0")} · {fmtDate(c.date, lang)}
                </span>
              </span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                {c.title}{c.external && <span style={{ fontWeight: 400, opacity: 0.55 }}> ↗</span>}
              </span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.55 }}>{c.description}</span>
              {c.external && <span style={{ fontFamily: "var(--font-sans)", fontSize: 10.5, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{u.newWindow}</span>}
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
            <a key={c.slug} href={c.href} target="_blank" rel="noopener noreferrer" className="lab-card" style={style}>{inner}</a>
          ) : (
            <Link key={c.slug} href={c.href} className="lab-card" style={style}>{inner}</Link>
          );
        })}
      </section>

      <section style={{ marginTop: 56, paddingTop: 28, borderTop: "1.5px solid rgba(26,22,20,0.1)" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 16px" }}>{u.aboutHeading}</h2>
        <div style={{ maxWidth: 620, fontFamily: "var(--font-sans)", fontSize: 15, lineHeight: 1.7, color: "var(--text-secondary)" }}>
          <p style={{ margin: "0 0 16px" }}>{u.p1}</p>
          <p style={{ margin: "0 0 16px", fontWeight: 600, color: "var(--text-primary)" }}>{u.p2}</p>
          <p style={{ margin: "0 0 16px" }}>
            {u.p3a}
            <a href="mailto:matej@matejmauler.com" style={{ color: "var(--text-primary)", textDecoration: "underline", textUnderlineOffset: "3px", fontWeight: 600 }}>{u.writeMe}</a>
            {u.p3b}
          </p>
          <p style={{ margin: 0 }}>
            {u.rewardA}
            <a href="https://spaghetti.ltd/what-are-the-odds" target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-primary)", textDecoration: "underline", textUnderlineOffset: "3px", fontWeight: 600 }}>{u.rewardLink}</a>
          </p>
        </div>
      </section>

      <footer style={{ marginTop: 56, paddingTop: 20, borderTop: "1.5px solid rgba(26,22,20,0.1)", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", display: "flex", gap: 16, flexWrap: "wrap" }}>
        <span>© {new Date().getFullYear()} The Lab</span>
        <a href="https://spaghetti.ltd" target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-secondary)" }}>Spaghetti.ltd ↗</a>
      </footer>

      <style>{`.lab-card:hover { transform: translate(-2px,-2px); box-shadow: 7px 7px 0 var(--shadow); }`}</style>
    </main>
  );
}
