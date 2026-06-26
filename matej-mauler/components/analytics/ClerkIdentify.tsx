"use client";
import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import posthog from "posthog-js";

// Volná vazba na Spaghetti účet: po souhlasu spáruje chování přihlášeného uživatele
// přes Clerk user id. Renderuje se JEN když je Clerk zapnutý (gate v PostHogProvider),
// takže useUser je vždy uvnitř ClerkProvideru. Žádné PII — jen id.
export function ClerkIdentify() {
  const { isSignedIn, user } = useUser();
  useEffect(() => {
    if (!posthog.__loaded || posthog.has_opted_out_capturing()) return;
    if (isSignedIn && user) posthog.identify(user.id);
  }, [isSignedIn, user]);
  return null;
}
