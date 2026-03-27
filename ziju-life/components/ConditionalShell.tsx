"use client";

import { usePathname } from "next/navigation";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { BookingPopupProvider } from "@/components/BookingPopup";

export default function ConditionalShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isFunnel = pathname?.startsWith("/form");
  const isLinks = pathname === "/links";

  return (
    <BookingPopupProvider>
      {!isFunnel && !isLinks && <Navigation />}
      {children}
      {!isFunnel && !isLinks && <Footer />}
    </BookingPopupProvider>
  );
}
