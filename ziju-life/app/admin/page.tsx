"use client";

import { useRouter } from "next/navigation";
import { PenTool, Mail, LogOut, ArrowRight } from "lucide-react";

export default function AdminPage() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const adminSections = [
    {
      title: "Inspirace",
      description: "Správa článků, videí, knih a dalších inspirací",
      href: "/admin/inspirace",
      icon: PenTool,
      color: "bg-accent",
    },
    {
      title: "Newsletter",
      description: "Přehled emailů z newsletteru a jejich export",
      href: "/admin/newsletter",
      icon: Mail,
      color: "bg-accent-secondary",
    },
  ];

  return (
    <div className="min-h-screen bg-white/50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
              Admin Dashboard
            </h1>
            <p className="text-foreground/70">
              Správa obsahu a newsletteru
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 border-2 border-black/10 rounded-full font-semibold hover:border-accent hover:text-accent transition-colors"
          >
            <LogOut size={18} />
            Odhlásit se
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {adminSections.map((section) => {
            const Icon = section.icon;
            return (
              <a
                key={section.href}
                href={section.href}
                className="group bg-white rounded-2xl p-8 border-2 border-black/5 hover:border-accent/30 transition-all hover:shadow-xl hover:-translate-y-1 transform"
                style={{ transform: 'rotate(-0.5deg)' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`${section.color} p-4 rounded-2xl text-white`}>
                    <Icon size={32} />
                  </div>
                  <ArrowRight 
                    size={24} 
                    className="text-foreground/30 group-hover:text-accent group-hover:translate-x-1 transition-all" 
                  />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  {section.title}
                </h2>
                <p className="text-foreground/70 leading-relaxed">
                  {section.description}
                </p>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
