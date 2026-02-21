"use client";

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ProjectBar } from "./ProjectBar";

type Props = {
  children: ReactNode;
};

const TOP_ITEMS = [
  { href: "/overview", label: "Přehled" },
  { href: "/crm", label: "CRM" },
  { href: "/clients", label: "Klient management" },
  { href: "/calendar", label: "Kalendář" },
  { href: "/settings", label: "Nastavení" }
];

export function AppShell({ children }: Props) {
  const pathname = usePathname();

  const activeTop =
    TOP_ITEMS.find((item) => pathname.startsWith(item.href)) ?? TOP_ITEMS[0];

  let sidebarItems: { href: string; label: string }[] = [];
  if (pathname.startsWith("/overview")) {
    sidebarItems = [
      { href: "/overview", label: "Dnes" },
      { href: "/overview/week", label: "Týden" },
      { href: "/overview/month", label: "Měsíc" }
    ];
  } else if (pathname.startsWith("/crm")) {
    sidebarItems = [
      { href: "/crm", label: "Board leadů" },
      { href: "/crm/archiv", label: "Archiv leadů" },
      { href: "/crm/imports", label: "Importy (brzy)" }
    ];
  } else if (pathname.startsWith("/clients")) {
    sidebarItems = [
      { href: "/clients", label: "Klienti" },
      { href: "/clients/templates", label: "Šablony schůzek" },
      { href: "/clients/payments", label: "Platby" }
    ];
  } else if (pathname.startsWith("/calendar")) {
    sidebarItems = [
      { href: "/calendar", label: "Kalendář" },
      { href: "/calendar/events", label: "Eventy" },
      { href: "/calendar/week", label: "Týdenní přehled" },
      { href: "/calendar/month", label: "Měsíční přehled" }
    ];
  } else if (pathname.startsWith("/settings")) {
    sidebarItems = [
      { href: "/settings", label: "Obecné" },
      { href: "/settings/calendar", label: "Kalendář" },
      { href: "/settings/integrations", label: "Integrace" }
    ];
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
              CC
            </div>
            <div>
              <div className="text-xs font-semibold tracking-tight text-slate-900">
                Coach CRM
              </div>
              <div className="text-[11px] text-slate-500">
                Leady, klienti a schůzky
              </div>
            </div>
          </div>
          <nav className="flex items-center gap-4 text-xs">
            {TOP_ITEMS.map((item) => {
              const active = item.href === activeTop.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3 py-1 font-medium transition ${
                    active
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            <SignedOut>
              <div className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-500">
                Nepřihlášený
              </div>
            </SignedOut>
          </nav>
        </div>
      </header>

      <ProjectBar />

      <div className="flex gap-6 px-4 py-6 lg:px-6">
        <aside className="w-56 shrink-0">
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Navigace
            </div>
            <div className="space-y-1 text-xs">
              {sidebarItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-lg px-2 py-1.5 transition ${
                      active
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>

        <main className="flex-1 pb-8">{children}</main>
      </div>
    </div>
  );
}

