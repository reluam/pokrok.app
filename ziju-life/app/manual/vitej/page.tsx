"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function VitejContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id") ?? "";

  useEffect(() => {
    if (!sessionId) {
      router.replace("/manual");
      return;
    }

    fetch(`/api/manual/verify?session_id=${sessionId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.valid) {
          router.replace("/manual/dashboard");
        } else {
          router.replace("/manual");
        }
      })
      .catch(() => router.replace("/manual"));
  }, [sessionId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFDF7]">
      <div className="flex flex-col items-center gap-5 text-center px-5">
        <div className="w-10 h-10 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        <p className="font-bold text-lg">Platba proběhla, nastavuji přístup…</p>
        <p className="text-base text-foreground/50">Za chvíli tě přesměrujeme.</p>
      </div>
    </div>
  );
}

export default function VitejPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FDFDF7]">
          <div className="w-10 h-10 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      }
    >
      <VitejContent />
    </Suspense>
  );
}
