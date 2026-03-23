"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { USER_PROFILE_KEY, type UserProfile } from "@repo/types";
import { createClient } from "../lib/supabase/client";
import styles from "./HomeGuard.module.css";

export function HomeGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      // Zkontroluj onboarding — nejdřív localStorage (rychlé), pak Supabase
      const local = localStorage.getItem(USER_PROFILE_KEY);
      if (local) {
        setReady(true);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select(
          "onboarding_completed, name, age, gender, life_areas, happiest_moment, what_friends_say, what_parents_say"
        )
        .eq("id", user.id)
        .single();

      if (!profile?.onboarding_completed) {
        router.replace("/onboarding");
        return;
      }

      // Sync Supabase profilu do localStorage
      const userProfile: UserProfile = {
        name: profile.name,
        age: profile.age as UserProfile["age"],
        gender: profile.gender as UserProfile["gender"],
        lifeAreas: profile.life_areas as unknown as UserProfile["lifeAreas"],
        happiestMoment: profile.happiest_moment,
        whatFriendsSay: profile.what_friends_say,
        whatParentsSay: profile.what_parents_say,
        completedAt: Date.now(),
      };
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(userProfile));
      setReady(true);
    }

    check();
  }, [router]);

  if (!ready) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return <>{children}</>;
}
