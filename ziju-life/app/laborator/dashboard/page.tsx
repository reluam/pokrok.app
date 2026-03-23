"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Tool {
  id: string;
  name: string;
  desc: string;
  href: string;
  available: boolean;
  tag: string;
  emoji: string;
}

const tools: Tool[] = [
  {
    id: "nastav-si-den",
    name: "Nastav si den",
    desc: "Sestav si vlastní denní rutinu z rituálů s vědeckým základem. Na konci si stáhneš personalizované PDF kartičky.",
    href: "/nastav-si-den",
    available: true,
    tag: "ADHD & fokus",
    emoji: "🗓️",
  },
  {
    id: "tvuj-kompas",
    name: "Tvůj kompas",
    desc: "Interaktivní cvičení pro nalezení životního směru a hodnot.",
    href: "/laborator/tvuj-kompas",
    available: false,
    tag: "Smysl & hodnoty",
    emoji: "🧭",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    fetch("/api/laborator/check")
      .then((r) => r.json())
      .then((d) => {
        if (!d.valid) {
          router.replace("/laborator");
        } else {
          setEmail(d.email ?? "");
          setChecked(true);
        }
      })
      .catch(() => router.replace("/laborator"));
  }, [router]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFDF7]">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#FDFDF7]">
      <div className="max-w-3xl mx-auto px-5 pt-16 pb-24">
        {/* Header */}
        <div className="mb-12">
          <p className="text-xs font-bold text-accent uppercase tracking-widest mb-3">
            Laboratoř
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-2">
            Vítej zpátky
          </h1>
          {email && (
            <p className="text-sm text-foreground/40">{email}</p>
          )}
        </div>

        {/* Tools grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tools.map((tool) =>
            tool.available ? (
              <Link
                key={tool.id}
                href={tool.href}
                className="paper-card paper-hover rounded-[28px] px-7 py-7 flex flex-col
                  gap-4 group transition-all"
              >
                <div className="flex items-start justify-between">
                  <span className="text-3xl">{tool.emoji}</span>
                  <span className="text-xs font-semibold text-foreground/35 uppercase tracking-wider">
                    {tool.tag}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-lg text-foreground mb-1 group-hover:text-accent transition-colors">
                    {tool.name}
                  </p>
                  <p className="text-sm text-foreground/55 leading-relaxed">
                    {tool.desc}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-accent text-sm font-semibold">
                  Otevřít
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </Link>
            ) : (
              <div
                key={tool.id}
                className="paper-card rounded-[28px] px-7 py-7 flex flex-col gap-4 opacity-50"
              >
                <div className="flex items-start justify-between">
                  <span className="text-3xl">{tool.emoji}</span>
                  <span className="text-xs font-bold px-2 py-1 bg-foreground/8 text-foreground/50 rounded-full">
                    Brzy
                  </span>
                </div>
                <div>
                  <p className="font-bold text-lg text-foreground mb-1">
                    {tool.name}
                  </p>
                  <p className="text-sm text-foreground/55 leading-relaxed">
                    {tool.desc}
                  </p>
                </div>
              </div>
            )
          )}
        </div>

        {/* Footer note */}
        <p className="text-xs text-foreground/30 text-center mt-10">
          Nové nástroje přibývají průběžně — dostaneš je automaticky.
        </p>
      </div>
    </main>
  );
}
