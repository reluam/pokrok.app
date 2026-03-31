"use client";

import { usePathname } from "next/navigation";
import AdminNavigation from "./AdminNavigation";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#FFFAF5]">
      <AdminNavigation />
      <main className="flex-1 min-w-0 p-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}
