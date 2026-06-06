import Link from "next/link";
import { getLang } from "@/lib/getLang";
import { getPublicSongs, songsUi } from "@/lib/songsDb";
import { TrackPlayer } from "@/components/TrackPlayer";

export const dynamic = "force-dynamic";
export const metadata = { title: "Songs — Spaghetti.ltd" };

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };

export default async function SongsPage() {
  const lang = await getLang();
  const t = songsUi[lang];
  const songs = await getPublicSongs(lang);
  const homeHref = lang === "cs" ? "/cs" : "/";

  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "clamp(24px,5vw,48px) clamp(16px,4vw,32px) 80px" }}>
        <Link href={homeHref} style={{ fontFamily: "var(--font-sans)", fontSize: "12px", letterSpacing: "0.04em", color: "var(--text-muted)", textDecoration: "none" }}>{t.back}</Link>

        <header style={{ margin: "32px 0 28px" }}>
          <h1 style={{ ...display, fontSize: "clamp(36px,8vw,60px)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1 }}>{t.title}</h1>
          <p style={{ ...display, fontStyle: "italic", fontSize: "clamp(16px,3vw,20px)", color: "var(--text-secondary)", marginTop: "10px" }}>{t.subtitle}</p>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "14px", color: "var(--text-muted)", marginTop: "8px", maxWidth: "460px", lineHeight: 1.6 }}>{t.intro}</p>
        </header>

        {songs.length === 0 ? (
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "15px", color: "var(--text-muted)" }}>{t.empty}</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {songs.map((s) => <TrackPlayer key={s.slug} song={s} lang={lang} />)}
          </div>
        )}
      </div>
    </main>
  );
}
