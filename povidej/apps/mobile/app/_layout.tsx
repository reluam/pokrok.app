import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import type { Session } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import { colors } from "../lib/theme";
import { USER_PROFILE_KEY } from "@repo/types";

export default function RootLayout() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [hasProfile, setHasProfile] = useState<boolean | undefined>(undefined);
  const router = useRouter();
  const segments = useSegments();

  // Sleduj auth stav
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    );

    return () => subscription.unsubscribe();
  }, []);

  // Zkontroluj onboarding
  useEffect(() => {
    if (session === null) { setHasProfile(false); return; }
    if (!session) return;

    AsyncStorage.getItem(USER_PROFILE_KEY).then((val) => {
      if (val) { setHasProfile(true); return; }

      supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", session.user.id)
        .single()
        .then(({ data }) => setHasProfile(data?.onboarding_completed ?? false));
    });
  }, [session]);

  // Guard
  useEffect(() => {
    if (session === undefined || hasProfile === undefined) return;

    const inAuth = segments[0] === "login" || segments[0] === "auth";
    const inOnboarding = segments[0] === "onboarding";

    if (!session && !inAuth) {
      router.replace("/login");
    } else if (session && !hasProfile && !inOnboarding) {
      router.replace("/onboarding");
    } else if (session && hasProfile && (inAuth || inOnboarding)) {
      router.replace("/");
    }
  }, [session, hasProfile, segments]);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: "700", color: colors.foreground },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
