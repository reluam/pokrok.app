"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

type Props = {
  children: React.ReactNode;
};

export default function LenisProvider({ children }: Props) {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 0.5, // kratší, svižnější dojezd
      easing: (t: number) => 1 - Math.pow(1 - t, 3), // jemný ease-out
      smoothWheel: true,
      wheelMultiplier: 0.6, // menší vzdálenost na jedno „odscrollování“
      touchMultiplier: 1.0,
    });

    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Po každé změně stránky vyřeš hash (např. #rezervace), jinak vrať scroll na začátek
  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";

    if (hash && hash.length > 1) {
      const targetId = hash.substring(1);
      const el = document.getElementById(targetId);

      if (el) {
        if (lenisRef.current) {
          lenisRef.current.scrollTo(el, { immediate: true });
        } else {
          el.scrollIntoView({ behavior: "instant", block: "start" as ScrollLogicalPosition });
        }
        return;
      }
    }

    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return <>{children}</>;
}


