"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const CoachingChat = dynamic(() => import("@/components/laborator/CoachingChat"), { ssr: false });

export default function KoucinkPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          setAuthed(true);
        } else {
          router.replace("/laborator");
        }
      } catch {
        router.replace("/laborator");
      }
    })();
  }, [router]);

  if (authed === null) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <div className="w-8 h-8 border-3 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return <CoachingChat />;
}
