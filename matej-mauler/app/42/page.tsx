import Link from "next/link";
import { hhggTerms, searchTerms } from "@/lib/hhgg";
import { UnofficialSection } from "@/components/UnofficialSection";

export const metadata = { title: "42 — Průvodce galaxií" };

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const terms = searchTerms(q ?? "");
  const sorted = [...terms].sort((a, b) => a.name.localeCompare(b.name, "cs"));

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      {/* Back */}
      <div style={{ position: "fixed", top: "24px", left: "24px", zIndex: 10 }}>
        <Link href="/" style={{
          fontFamily: "var(--font-sans)", fontSize: "12px",
          letterSpacing: "0.04em", color: "var(--text-muted)", textDecoration: "none",
        }}>
          ← matěj.mauler
        </Link>
      </div>

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "80px 24px 80px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <p style={{
            fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase",
            letterSpacing: "0.22em", color: "var(--text-muted)", marginBottom: "16px",
          }}>
            Encyklopedie vesmíru
          </p>
          <h1 style={{
            ...display, fontSize: "clamp(64px, 15vw, 112px)", fontWeight: 900,
            lineHeight: 1, letterSpacing: "-0.03em", color: "var(--text-primary)",
            marginBottom: "16px",
          }}>
            42
          </h1>
          <p style={{
            fontFamily: "var(--font-display)", fontStyle: "italic",
            fontSize: "18px", color: "var(--text-secondary)", lineHeight: 1.5,
          }}>
            Stopařův průvodce po galaxii — kompletní encyklopedie.
          </p>
        </div>

        {/* Search */}
        <form method="GET" style={{ marginBottom: "40px" }}>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Hledat termín..."
            autoComplete="off"
            style={{
              width: "100%",
              background: "#fff",
              border: "2.5px solid var(--border)",
              borderRadius: "14px",
              boxShadow: "4px 4px 0 var(--border)",
              padding: "14px 20px",
              fontFamily: "var(--font-sans)",
              fontSize: "15px",
              color: "var(--text-primary)",
              outline: "none",
            }}
          />
        </form>

        {/* Term count */}
        <p style={{
          fontFamily: "var(--font-sans)", fontSize: "12px",
          color: "var(--text-muted)", marginBottom: "20px",
          letterSpacing: "0.04em",
        }}>
          {sorted.length} {sorted.length === 1 ? "termín" : sorted.length < 5 ? "termíny" : "termínů"}
          {q ? ` pro "${q}"` : ` z ${hhggTerms.length} celkem`}
        </p>

        {/* Term list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {sorted.map((term) => (
            <Link
              key={term.slug}
              href={`/42/${term.slug}`}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  background: "#fff",
                  border: "2.5px solid var(--border)",
                  borderRadius: "16px",
                  boxShadow: "4px 4px 0 var(--border)",
                  padding: "20px 24px",
                  transition: "transform 140ms ease, box-shadow 140ms ease",
                  cursor: "pointer",
                }}
                className="term-card"
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "16px" }}>
                  <h2 style={{
                    ...display, fontSize: "20px", fontWeight: 800,
                    color: "var(--text-primary)", flexShrink: 0,
                  }}>
                    {term.name}
                  </h2>
                  {term.book && (
                    <span style={{
                      fontFamily: "var(--font-sans)", fontSize: "11px",
                      color: "var(--text-muted)", letterSpacing: "0.04em",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      maxWidth: "200px",
                    }}>
                      {term.book}
                    </span>
                  )}
                </div>
                <p style={{
                  fontFamily: "var(--font-sans)", fontSize: "13px",
                  color: "var(--text-secondary)", marginTop: "6px", lineHeight: 1.5,
                  display: "-webkit-box", WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical", overflow: "hidden",
                }}>
                  {term.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Unofficial section */}
        <div style={{
          marginTop: "48px",
          paddingTop: "32px",
          borderTop: "1.5px dashed rgba(26,22,20,0.12)",
        }}>
          <UnofficialSection />
        </div>

      </div>

      <style>{`
        .term-card:hover {
          transform: translate(-2px, -2px);
          box-shadow: 6px 6px 0 var(--border) !important;
        }
      `}</style>
    </div>
  );
}
