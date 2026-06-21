import type { Metadata } from "next";
import { SignInButton } from "@clerk/nextjs";
import { syncAuthedUser } from "@/lib/account/session";
import { getProfile } from "@/lib/accountsDb";
import { EXPERIENCES } from "@/lib/experiencePanel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "You — Spaghetti.ltd",
  description: "Your mind across the experiments.",
  alternates: { canonical: "/me" },
  robots: { index: false },
};

const clerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const titleForSlug = (slug: string) => EXPERIENCES.find((e) => e.slug === slug)?.title ?? slug;

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ background: "var(--bg)", minHeight: "100dvh" }}>
      <div className="max-w-[680px] mx-auto px-5 md:px-8 py-16 md:py-20">{children}</div>
    </main>
  );
}

function SignedOut({ note }: { note?: string }) {
  return (
    <Shell>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 30, letterSpacing: "-0.02em", marginBottom: 10 }}>your mind across the experiments</h1>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: 15.5, lineHeight: 1.6, color: "var(--text-secondary)", marginBottom: 20 }}>
        {note ?? "sign in to keep your results and watch how your mind changes as new experiments drop. no passwords — just a magic link."}
      </p>
      {clerkEnabled && (
        <SignInButton mode="modal">
          <button className="sbtn" style={{ fontSize: 14, padding: "10px 20px" }}>sign in</button>
        </SignInButton>
      )}
    </Shell>
  );
}

export default async function MePage() {
  if (!clerkEnabled) return <SignedOut note="accounts are coming soon." />;

  const synced = await syncAuthedUser();
  if (!synced) return <SignedOut />;

  const profile = await getProfile(synced.clerkId);
  if (!profile) return <SignedOut />;

  const { user, badges, experiments } = profile;
  const name = user.display_name || "you";

  return (
    <Shell>
      <header style={{ marginBottom: 28 }}>
        <p style={{ fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>your mind across the experiments</p>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 34, letterSpacing: "-0.03em", lineHeight: 1.05 }}>{name}</h1>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 14.5, color: "var(--text-secondary)", marginTop: 6 }}>
          {user.total_xp} XP · {badges.length} {badges.length === 1 ? "badge" : "badges"} · {experiments.length} {experiments.length === 1 ? "experiment" : "experiments"}
        </p>
      </header>

      <section style={{ marginBottom: 30 }}>
        <h2 className="me-h">badges</h2>
        {badges.length === 0 ? (
          <p className="me-empty">none yet — they appear when you discover something about yourself, not for showing up.</p>
        ) : (
          <ul className="me-badges">
            {badges.map((b) => (
              <li key={b.slug} className="me-badge">
                <span className="me-badge-name">{b.name}</span>
                <span className="me-badge-desc">{b.description}</span>
                <span className="me-badge-meta">
                  {b.experimentSlug ? titleForSlug(b.experimentSlug) : "across the series"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="me-h">experiments</h2>
        {experiments.length === 0 ? (
          <p className="me-empty">nothing saved yet. go try one — you don&apos;t need an account to play.</p>
        ) : (
          <ul className="me-exps">
            {experiments.map((slug) => (
              <li key={slug} className="me-exp">{titleForSlug(slug)}</li>
            ))}
          </ul>
        )}
      </section>
    </Shell>
  );
}
