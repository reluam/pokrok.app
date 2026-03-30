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

  return (
    <BookingPopupProvider>
      {!isFunnel && !isLinks && !isAdmin && <Navigation />}
      {children}
      {!isFunnel && !isLinks && !isAdmin && <Footer />}
      {!isFunnel && !isLinks && !isAdmin && <FloatingAIHelper />}
    </BookingPopupProvider>
  );
}
