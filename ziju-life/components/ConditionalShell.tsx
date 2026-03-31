"use client";

import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { BookingPopupProvider } from "@/components/BookingPopup";

const FloatingAIHelper = dynamic(() => import("@/components/FloatingAIHelper"), { ssr: false });

export default function ConditionalShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isFunnel = pathname?.startsWith("/form");
  const isLinks = pathname === "/links";
  const isAdmin = pathname?.startsWith("/admin");
  const showShell = !isFunnel && !isLinks && !isAdmin;

  return (
    <BookingPopupProvider>
      {showShell && <Navigation />}
      {showShell && <div className="h-20" />}
      {children}
      {showShell && <Footer />}
      {showShell && <FloatingAIHelper />}
    </BookingPopupProvider>
  );
}
