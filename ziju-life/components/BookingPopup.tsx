"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

/** CCCP base URL (např. https://cccp.example.com/book). Nastav v .env.local: NEXT_PUBLIC_CCCP_BOOKING_URL */
const CCCP_BOOKING_URL = process.env.NEXT_PUBLIC_CCCP_BOOKING_URL || null;

/** Coach user ID (Clerk) pro rezervace z Žiju life. Nastav v .env.local: NEXT_PUBLIC_CCCP_COACH_ID */
const CCCP_COACH_ID = process.env.NEXT_PUBLIC_CCCP_COACH_ID || "";

/** Zdroj leadu (např. ziju-life). Volitelně v .env.local: NEXT_PUBLIC_CCCP_BOOKING_SOURCE */
const CCCP_BOOKING_SOURCE = process.env.NEXT_PUBLIC_CCCP_BOOKING_SOURCE || "ziju-life";

/** Fallback: Cal.eu booking link: "username/event-slug". Nastav v .env.local: NEXT_PUBLIC_CAL_LINK */
const CAL_LINK = process.env.NEXT_PUBLIC_CAL_LINK || "matej-mauler/30min";
const CAL_EU_BASE_URL = "https://cal.eu";

type BookingPopupContextValue = {
  openBookingPopup: () => void;
  closeBookingPopup: () => void;
};

const BookingPopupContext = createContext<BookingPopupContextValue | null>(null);

export function useBookingPopup() {
  return useContext(BookingPopupContext);
}

export function BookingPopupProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openBookingPopup = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeBookingPopup = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <BookingPopupContext.Provider value={{ openBookingPopup, closeBookingPopup }}>
      {children}
      <BookingModal
        isOpen={isOpen}
        onClose={closeBookingPopup}
        bookingLink={CAL_LINK}
      />
    </BookingPopupContext.Provider>
  );
}

function BookingModal({
  isOpen,
  onClose,
  bookingLink,
}: {
  isOpen: boolean;
  onClose: () => void;
  bookingLink: string;
}) {
  if (!isOpen) return null;

  // Use CCCP booking if configured (with coach and source for multi-user and lead source), otherwise fallback to Cal.eu
  const useCccp = CCCP_BOOKING_URL !== null && CCCP_COACH_ID !== "";
  const bookingUrl = useCccp
    ? (() => {
        const url = new URL(CCCP_BOOKING_URL!);
        url.searchParams.set("coach", CCCP_COACH_ID);
        if (CCCP_BOOKING_SOURCE) url.searchParams.set("source", CCCP_BOOKING_SOURCE);
        return url.toString();
      })()
    : `${CAL_EU_BASE_URL}/${bookingLink}?embed=true&layout=month_view`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-label="Rezervace termínu"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-4xl h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between shrink-0 px-4 py-3 border-b border-black/10">
          <span className="font-semibold text-foreground">Vyber si termín</span>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 transition-colors"
            aria-label="Zavřít"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div className="flex-1 min-h-0 relative">
          <iframe
            src={bookingUrl}
            title={useCccp ? "Rezervace termínu – Coach CRM" : "Rezervace termínu – cal.eu"}
            className="absolute inset-0 w-full h-full border-0"
            allow="camera; microphone; geolocation"
          />
        </div>
      </div>
    </div>
  );
}
