"use client";

import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";

export type RegistrationTrigger = "on_result" | "on_explore" | "on_return" | "manual";

export type PromptRegistrationProps = {
  /** When this prompt is being shown — informs default copy; the experiment controls mounting. */
  trigger?: RegistrationTrigger;
  /** What the user KEEPS or UNLOCKS — required, dynamic per experiment. Never "create an account". */
  headline: string;
  /** Optional second line. */
  sub?: string;
  /** Primary CTA label. Defaults per trigger ("keep this" / "unlock this"). */
  cta?: string;
};

const clerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const DEFAULT_CTA: Record<RegistrationTrigger, string> = {
  on_result: "keep this",
  on_explore: "unlock this",
  on_return: "pick up where you left off",
  manual: "keep this",
};

// Calm, single-screen "keep what you earned" moment. Anonymous-first: if accounts are off or
// the user already has one, it renders nothing — the experiment stays fully usable without it.
export function PromptRegistration(props: PromptRegistrationProps) {
  if (!clerkEnabled) return null;
  return <Prompt {...props} />;
}

function Prompt({ trigger = "on_result", headline, sub, cta }: PromptRegistrationProps) {
  const { isSignedIn, isLoaded } = useUser();
  if (!isLoaded || isSignedIn) return null;

  return (
    <div className="pr-card" data-noodle="eat">
      <p className="pr-headline">{headline}</p>
      {sub && <p className="pr-sub">{sub}</p>}
      <div className="pr-actions">
        <SignUpButton mode="modal">
          <button className="sbtn pr-primary">{cta ?? DEFAULT_CTA[trigger]}</button>
        </SignUpButton>
        <SignInButton mode="modal">
          <button className="pr-link">already have an account?</button>
        </SignInButton>
      </div>
      <p className="pr-note">no passwords — a magic link, and your stuff is saved across every experiment.</p>
    </div>
  );
}
