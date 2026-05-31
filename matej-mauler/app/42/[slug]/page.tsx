import Link from "next/link";
import { notFound } from "next/navigation";
import { getTermBySlug, hhggTerms } from "@/lib/hhgg";
import { CommunitySection } from "@/components/CommunitySection";
import { UnofficialTermDetail } from "@/components/UnofficialTermDetail";

export async function generateStaticParams() {
  return hhggTerms.map((t) => ({ slug: t.slug }));
}

export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const term = getTermBySlug(slug);
  return { title: term ? `${term.name} — 42` : "42" };
}

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const serifItalic: React.CSSProperties = { fontFamily: "var(--font-display)", fontStyle: "italic" };

export default async function TermPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const officialTerm = getTermBySlug(slug);

  // Unofficial term detail
  if (!officialTerm) {
    return <UnofficialTermDetail slug={slug} />;
  }

  // Official term detail
  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <div style={{ position: "fixed", top: "24px", left: "24px", zIndex: 10 }}>
        <Link href="/42" style={{
          fontFamily: "var(--font-sans)", fontSize: "12px",
          letterSpacing: "0.04em", color: "var(--text-muted)", textDecoration: "none",
        }}>
          ← 42
        </Link>
      </div>

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "80px 24px 80px" }}>
        {officialTerm.book && (
          <p style={{
            fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase",
            letterSpacing: "0.18em", color: "var(--text-muted)", marginBottom: "20px",
          }}>
            {officialTerm.book}
          </p>
        )}

        <h1 style={{
          ...display, fontSize: "clamp(36px, 7vw, 60px)", fontWeight: 900,
          lineHeight: 1.1, letterSpacing: "-0.02em",
          color: "var(--text-primary)", marginBottom: "32px",
        }}>
          {officialTerm.name}
        </h1>

        <div style={{
          background: "#fff",
          border: "2.5px solid var(--border)",
          borderRadius: "20px",
          boxShadow: "5px 5px 0 var(--border)",
          padding: "32px",
          marginBottom: "40px",
        }}>
          <p style={{
            fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase",
            letterSpacing: "0.15em", color: "var(--text-muted)", marginBottom: "16px",
          }}>
            Průvodce říká
          </p>
          <p style={{ ...serifItalic, fontSize: "20px", lineHeight: 1.65, color: "var(--text-primary)" }}>
            {officialTerm.description}
          </p>
        </div>

        <div style={{ borderTop: "1.5px dashed rgba(26,22,20,0.12)", marginBottom: "40px" }} />

        <CommunitySection termSlug={officialTerm.slug} />
      </div>
    </div>
  );
}
