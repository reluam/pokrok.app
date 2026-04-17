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
  const isAdmin = pathname?.startsWith("/admin");
  const hasFullBleedHero = pathname === "/" || pathname === "/koucing";
  const showShell = !isFunnel && !isLinks && !isAdmin;

  return (
    <BookingPopupProvider>
      {showShell && <Navigation />}
      {showShell && !hasFullBleedHero && <div className="h-20" />}
      {children}
      {showShell && <Footer />}
    </BookingPopupProvider>
  );
}
