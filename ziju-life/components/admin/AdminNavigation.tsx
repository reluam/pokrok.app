"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { PenTool, Book, Mail, LogOut, Settings, Users } from "lucide-react";

type AdminSection = "blog" | "inspirace" | "newsletter" | "newsletter-campaigns" | "settings" | "crm";

interface NavItem {
  id: AdminSection;
  label: string;
  icon: typeof PenTool;
}

export default function AdminNavigation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSection = (searchParams.get("section") || "blog") as AdminSection;

  const navItems: NavItem[] = [
    {
      id: "blog",
      label: "Blog",
      icon: PenTool,
    },
    {
      id: "inspirace",
      label: "Inspirace",
      icon: Book,
    },
    {
      id: "newsletter",
      label: "Newsletter",
      icon: Mail,
    },
    {
      id: "newsletter-campaigns",
      label: "Newsletter Campaigns",
      icon: Mail,
    },
    {
      id: "crm",
      label: "CRM / Klienti",
      icon: Users,
    },
    {
      id: "settings",
      label: "Nastavení",
      icon: Settings,
    },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const navigateToSection = (section: AdminSection) => {
    router.push(`/admin?section=${section}`);
  };

  return (
    <div className="w-64 bg-white border-r border-black/10 flex flex-col h-screen fixed left-0 top-0">
      {/* Header */}
      <div className="p-6 border-b border-black/10">
        <h1 className="text-2xl font-bold text-foreground">Admin</h1>
        <p className="text-sm text-foreground/60 mt-1">Správa obsahu</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => navigateToSection(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${
                    isActive
                      ? "bg-accent text-white"
                      : "text-foreground/70 hover:bg-black/5 hover:text-foreground"
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-black/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-foreground/70 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={20} />
          <span>Odhlásit se</span>
        </button>
      </div>
    </div>
  );
}
