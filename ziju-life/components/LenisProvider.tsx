"use client";

import { useEffect } from "react";
import Lenis from "lenis";

type Props = {
  children: React.ReactNode;
};

export default function LenisProvider({ children }: Props) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 0.5, // kratší, svižnější dojezd
      easing: (t: number) => 1 - Math.pow(1 - t, 3), // jemný ease-out
      smoothWheel: true,
      wheelMultiplier: 0.6, // menší vzdálenost na jedno „odscrollování“
      touchMultiplier: 1.0,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}

