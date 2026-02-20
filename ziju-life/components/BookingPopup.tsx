"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const DEFAULT_BOOKING_URL =
  "https://talentino.app/book/matej/30-minutova-konzultace-zdarma?embed=1";

type BookingPopupParams = { email?: string; name?: string; note?: string };

type BookingPopupContextValue = {
  openBookingPopup: (params?: BookingPopupParams) => void;
  closeBookingPopup: () => void;
};

const BookingPopupContext = createContext<BookingPopupContextValue | null>(null);

export function useBookingPopup() {
  return useContext(BookingPopupContext);
}

export function BookingPopupProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [bookingUrl, setBookingUrl] = useState(DEFAULT_BOOKING_URL);
  const [prefill, setPrefill] = useState<BookingPopupParams>({});

  useEffect(() => {
    fetch("/api/settings/booking-url")
      .then((res) => res.json())
      .then((data) => {
        if (data?.bookingEmbedUrl?.trim()) setBookingUrl(data.bookingEmbedUrl.trim());
      })
      .catch(() => {});
  }, []);

  const openBookingPopup = useCallback((params?: BookingPopupParams) => {
    setPrefill(params ?? {});
    setIsOpen(true);
  }, []);

  const closeBookingPopup = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <BookingPopupContext.Provider value={{ openBookingPopup, closeBookingPopup }}>
      {children}
      <BookingModal isOpen={isOpen} onClose={closeBookingPopup} bookingUrl={bookingUrl} prefill={prefill} />
    </BookingPopupContext.Provider>
  );
}

function BookingModal({
  isOpen,
  onClose,
  bookingUrl,
  prefill,
}: {
  isOpen: boolean;
  onClose: () => void;
  bookingUrl: string;
  prefill: { email?: string; name?: string; note?: string };
}) {
  if (!isOpen) return null;

  const iframeSrc = (() => {
    try {
      const u = new URL(bookingUrl);
      u.searchParams.set("embed", "1");
      if (prefill.email?.trim()) u.searchParams.set("email", prefill.email.trim());
      if (prefill.name?.trim()) u.searchParams.set("name", prefill.name.trim());
      if (prefill.note?.trim()) u.searchParams.set("note", prefill.note.trim());
      return u.toString();
    } catch {
      return bookingUrl;
    }
  })();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-label="Rezervace termínu"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-5xl h-[88vh] min-h-[400px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
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
            src={iframeSrc}
            title="Rezervace"
            className="absolute inset-0 w-full h-full border-0"
            allow="camera; microphone; geolocation"
          />
        </div>
      </div>
    </div>
  );
}
