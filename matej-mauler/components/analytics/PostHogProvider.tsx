"use client";
import { createContext, useContext, useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { POSTHOG_KEY, POSTHOG_HOST, posthogEnabled } from "@/lib/analytics/posthog";
import { ConsentBanner } from "./ConsentBanner";
import { ClerkIdentify } from "./ClerkIdentify";

// Plný režim s consent bannerem: v EU trackujeme až po souhlasu.
// Před souhlasem běží PostHog v memory + opted-out (žádné cookies) → bez banneru nic neukládá.
export type Consent = "granted" | "denied" | "unset";
const CONSENT_KEY = "sp_analytics_consent";
const clerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

type Ctx = { consent: Consent; accept: () => void; decline: () => void };
const ConsentContext = createContext<Ctx>({ consent: "unset", accept: () => {}, decline: () => {} });
export const useAnalyticsConsent = () => useContext(ConsentContext);

function readConsent(): Consent {
  if (typeof window === "undefined") return "unset";
  const v = window.localStorage.getItem(CONSENT_KEY);
  return v === "granted" || v === "denied" ? v : "unset";
}

// Next App Router neposílá pageviews sám → posíláme je ručně při změně routy.
// useSearchParams si žádá Suspense boundary (jinak deoptne celý strom na CSR) → izolováno níž.
function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    if (!posthog.__loaded || posthog.has_opted_out_capturing()) return;
    let url = window.location.origin + pathname;
    const qs = searchParams?.toString();
    if (qs) url += "?" + qs;
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);
  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<Consent>("unset");

  useEffect(() => {
    if (!posthogEnabled || posthog.__loaded) return;
    const initial = readConsent();
    // localStorage čteme až v efektu (ne v useState initializeru) → žádný hydration mismatch banneru.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConsent(initial);
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: "identified_only", // profil jen pro přihlášené; anonymní zůstanou anonymní
      capture_pageview: false, // posíláme ručně (viz PageviewTracker)
      capture_pageleave: true, // jinak by se s vypnutým pageview vypnul i pageleave → nepřesný bounce rate / délka session
      autocapture: true,
      persistence: initial === "granted" ? "localStorage+cookie" : "memory",
      opt_out_capturing_by_default: initial !== "granted",
    });
  }, []);

  const accept = () => {
    window.localStorage.setItem(CONSENT_KEY, "granted");
    setConsent("granted");
    if (posthog.__loaded) {
      posthog.set_config({ persistence: "localStorage+cookie" });
      posthog.opt_in_capturing(); // zapne capture i session replay
      posthog.capture("$pageview");
    }
  };

  const decline = () => {
    window.localStorage.setItem(CONSENT_KEY, "denied");
    setConsent("denied");
    if (posthog.__loaded) {
      posthog.opt_out_capturing();
      posthog.set_config({ persistence: "memory" });
    }
  };

  return (
    <ConsentContext.Provider value={{ consent, accept, decline }}>
      {children}
      {posthogEnabled && (
        <>
          <Suspense fallback={null}>
            <PageviewTracker />
          </Suspense>
          {clerkEnabled && <ClerkIdentify />}
          <ConsentBanner />
        </>
      )}
    </ConsentContext.Provider>
  );
}
