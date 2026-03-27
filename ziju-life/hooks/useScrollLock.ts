"use client";

import { useEffect } from "react";
import { useLenis } from "@/components/LenisProvider";

/**
 * Zamkne scroll stránky na pozadí, když je modal otevřený.
 * Pozastaví Lenis smooth scroll a nastaví body overflow na hidden.
 */
export function useScrollLock(isLocked: boolean) {
  const lenisRef = useLenis();

  useEffect(() => {
    if (!isLocked) return;

    // Pozastav Lenis
    lenisRef?.current?.stop();

    // Zamkni nativní scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      lenisRef?.current?.start();
      document.body.style.overflow = prev;
    };
  }, [isLocked, lenisRef]);
}
