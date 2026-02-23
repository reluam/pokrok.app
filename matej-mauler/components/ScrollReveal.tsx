"use client";

import { useEffect } from "react";

export default function ScrollReveal() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const cards = Array.from(
      document.querySelectorAll<HTMLElement>(".portfolio-card")
    );
    if (!("IntersectionObserver" in window)) {
      // Fallback: bez IO jen rovnou označíme boxy jako zobrazené
      cards.forEach((card) => card.setAttribute("data-revealed", "true"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).setAttribute("data-revealed", "true");
            obs.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.3 }
    );

    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  return null;
}

