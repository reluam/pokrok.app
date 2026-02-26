"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    calendar?: {
      schedulingButton: {
        load: (options: {
          url: string;
          color?: string;
          label?: string;
          target: HTMLElement | null;
        }) => void;
      };
    };
  }
}

export default function CalendarBookingButton() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [nativeButton, setNativeButton] = useState<HTMLButtonElement | null>(null);

  useEffect(() => {
    const ensureButton = () => {
      if (!window.calendar?.schedulingButton || !containerRef.current) return;

      // vyčisti případný předchozí obsah, ať se netvoří víc tlačítek
      containerRef.current.innerHTML = "";

      window.calendar.schedulingButton.load({
        url: "https://calendar.google.com/calendar/appointments/schedules/AcZssZ2m2-T0uZMzdZfrZqvHrcnO3QHGthBGk3uPBJgkUfOnJXuuFM6rKEIip2tQn5sxztKw98Ceffut?gv=true",
        color: "#039BE5",
        label: "Rezervovat 30 min konzultaci zdarma",
        target: containerRef.current,
      });

      // malá prodleva, než Google button skutečně vloží
      setTimeout(() => {
        if (!containerRef.current) return;
        const btn = containerRef.current.querySelector("button");
        if (btn) {
          btn.style.display = "none";
          setNativeButton(btn as HTMLButtonElement);
        }
      }, 50);
    };

    // přidej CSS pro tlačítko (pokud ještě není)
    if (!document.querySelector('link[data-calendar-style="true"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://calendar.google.com/calendar/scheduling-button-script.css";
      link.dataset.calendarStyle = "true";
      document.head.appendChild(link);
    }

    // přidej script pro Google Calendar scheduling (pokud ještě není)
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-calendar-script="true"]',
    );

    if (existingScript) {
      if (existingScript.dataset.loaded === "true") {
        ensureButton();
      } else {
        existingScript.addEventListener("load", ensureButton, { once: true });
      }
      return;
    }

    const script = document.createElement("script");
    script.src = "https://calendar.google.com/calendar/scheduling-button-script.js";
    script.async = true;
    script.dataset.calendarScript = "true";
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      ensureButton();
    });
    document.body.appendChild(script);

    return () => {
      script.removeEventListener("load", ensureButton);
    };
  }, []);

  const handleClick = () => {
    if (nativeButton) {
      nativeButton.click();
    }
  };

  return (
    <>
      {/* Kontejner pro Google tlačítko – skrytý, bez rozměrů, aby se nikde nevykreslilo */}
      <div
        ref={containerRef}
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 overflow-hidden opacity-0 pointer-events-none"
      />
      {/* Jediné viditelné tlačítko – naše */}
      <button
        type="button"
        onClick={handleClick}
        data-booking-button
        className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-600 text-white shadow-md transition hover:bg-[#0e7490] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60"
      >
        Rezervovat 30 min konzultaci zdarma
      </button>
    </>
  );
}


