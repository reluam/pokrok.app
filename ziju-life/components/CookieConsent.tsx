"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Zkontroluj, jestli uživatel už dal souhlas
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      // Zobraz lištu po malém zpoždění, aby stránka stihla načíst
      setTimeout(() => setIsVisible(true), 500);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    localStorage.setItem("cookie-consent-date", new Date().toISOString());
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie-consent", "declined");
    localStorage.setItem("cookie-consent-date", new Date().toISOString());
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-black/10 shadow-lg p-4 md:p-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
        <div className="flex-1">
          <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
            Tento web používá cookies pro zlepšení uživatelského zážitku a analýzu návštěvnosti. 
            Pokračováním v prohlížení souhlasíš s používáním cookies.{" "}
            <a 
              href="/gdpr" 
              className="text-accent hover:text-accent-hover underline"
            >
              Více informací
            </a>
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={handleDecline}
            className="px-4 py-2 text-sm font-semibold text-foreground/70 hover:text-foreground transition-colors"
          >
            Odmítnout
          </button>
          <button
            onClick={handleAccept}
            className="px-6 py-2 bg-accent text-white rounded-full text-sm font-semibold hover:bg-accent-hover transition-colors shadow-md hover:shadow-lg"
          >
            Přijmout
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="p-2 text-foreground/50 hover:text-foreground transition-colors"
            aria-label="Zavřít"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
