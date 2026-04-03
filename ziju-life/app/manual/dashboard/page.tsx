"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Settings } from "lucide-react";
import type { KompasData } from "@/components/KompasFlow";
import type { HodnotyData } from "@/components/HodnotyFlow";
import { PrintDayOverviewButton } from "@/components/NastavSiDenWizard";
import { DnesTab } from "@/components/manual/DnesTab";
import { ManualHub } from "@/components/manual/ManualHub";
import { ToolTopBar } from "@/components/manual/ToolTopBar";
import type { CheckinEntry } from "@/components/manual/shared";
import dynamic from "next/dynamic";

const CoachingChatPanel = dynamic(() => import("@/components/manual/CoachingChatPanel"), { ssr: false });
const NastavSiDenTab = dynamic(() => import("@/components/manual/NastavSiDenTab").then((m) => ({ default: m.NastavSiDenTab })), { ssr: false });

// ── Constants ──────────────────────────────────────────────────────────────────

type RitualSelection = { morning: string[]; daily: string[]; evening: string[]; durationOverrides?: Record<string, number> };
const LS_KEY = "nastav-si-den-selection";

// ── DashboardContent ───────────────────────────────────────────────────────────

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checked, setChecked] = useState(false);
  const [email, setEmail] = useState("");

  // All context from API
  const [context, setContext] = useState<Record<string, unknown>>({});
  const [contextLoaded, setContextLoaded] = useState(false);

  // Check-in state
  const [checkins, setCheckins] = useState<CheckinEntry[]>([]);
  const [thisWeekDone, setThisWeekDone] = useState(false);
  const [reflectionDone, setReflectionDone] = useState(false);

  const activeTab = searchParams.get("tab") ?? "dnes";
  const [dnesSettings, setDnesSettings] = useState(false);

  // Auth check
  useEffect(() => {
    fetch("/api/manual/check")
      .then((r) => r.json())
      .then((d) => {
        if (!d.valid) { router.replace("/manual"); } else {
          setEmail(d.email ?? "");
          setChecked(true);
        }
      })
      .catch(() => router.replace("/manual"));
  }, [router]);

  // Load all context from API
  const loadContext = useCallback(async () => {
    try {
      const res = await fetch("/api/manual/user-context");
      if (res.ok) {
        const { context: ctx } = await res.json();
        if (ctx) {
          setContext(ctx);

          // Backwards compat: also mirror to localStorage for components that still use it
          if (ctx.compass && typeof ctx.compass === "object" && "currentVals" in ctx.compass) {
            try { localStorage.setItem("kompas-data", JSON.stringify(ctx.compass)); } catch {}
          }
          if (ctx.values && typeof ctx.values === "object" && "finalValues" in ctx.values) {
            try { localStorage.setItem("hodnoty-data", JSON.stringify(ctx.values)); } catch {}
          } else if (ctx.values && Array.isArray(ctx.values)) {
            // Old flat format
            const vals = ctx.values as { name: string; alignment: number }[];
            const finalValues = vals.map(v => v.name);
            const alignmentScores: Record<string, number> = {};
            for (const v of vals) { if (v.alignment) alignmentScores[v.name] = v.alignment; }
            const data: HodnotyData = { finalValues, alignmentScores: Object.keys(alignmentScores).length > 0 ? alignmentScores : undefined, savedAt: "" };
            setContext(prev => ({ ...prev, values: data }));
            try { localStorage.setItem("hodnoty-data", JSON.stringify(data)); } catch {}
          }
          if (ctx.rituals && typeof ctx.rituals === "object" && "morning" in ctx.rituals) {
            try { localStorage.setItem(LS_KEY, JSON.stringify(ctx.rituals)); } catch {}
          }
        }
      }
    } catch {}

    // Fallback: load from localStorage for any missing context
    setContext(prev => {
      const next = { ...prev };
      if (!next.compass) {
        try { const k = localStorage.getItem("kompas-data"); if (k) next.compass = JSON.parse(k); } catch {}
      }
      if (!next.values) {
        try { const h = localStorage.getItem("hodnoty-data"); if (h) next.values = JSON.parse(h); } catch {}
      }
      if (!next.rituals) {
        try { const s = localStorage.getItem(LS_KEY); if (s) next.rituals = JSON.parse(s); } catch {}
      }
      return next;
    });

    setContextLoaded(true);
  }, []);

  useEffect(() => {
    if (checked) loadContext();
  }, [checked, loadContext]);

  // Load check-ins
  useEffect(() => {
    if (!checked) return;
    fetch("/api/manual/checkin")
      .then((r) => r.json())
      .then((d) => {
        setCheckins(d.checkins ?? []);
        setThisWeekDone(d.thisWeekDone ?? false);
        setReflectionDone(d.reflectionDone ?? false);
      })
      .catch(() => {});
  }, [checked]);

  const goToTab = useCallback((tab: string) => {
    if (tab === "dnes") loadContext();
    setDnesSettings(false);
    const query = tab !== "dnes" ? `?tab=${tab}` : "";
    router.push(`/manual/dashboard${query}`, { scroll: false });
  }, [router, loadContext]);

  const handleCheckinSave = useCallback(async (
    { valueScores, areaScores }: { valueScores: Record<string, number>; areaScores: Record<string, number> }
  ) => {
    try {
      const res = await fetch("/api/manual/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valueScores, areaScores }),
      });
      const data = await res.json();
      if (data.ok) {
        const week = data.week;
        setCheckins((prev) => {
          const filtered = prev.filter((c) => !c.week_start_date.startsWith(week));
          return [...filtered, { score: data.avgScore ?? null, week_start_date: week, value_scores: valueScores, area_scores: areaScores }];
        });
        setThisWeekDone(true);
        setReflectionDone(true);
      }
    } catch {}
  }, []);

  if (!checked || !contextLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFDF7]">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  // Derived data for tabs
  const kompasData = context.compass as KompasData | null ?? null;
  const hodnotyData = context.values as HodnotyData | null ?? null;
  const ritualSelection = context.rituals as RitualSelection | null ?? null;

  const hasRituals = (ritualSelection?.morning?.length ?? 0) + (ritualSelection?.daily?.length ?? 0) + (ritualSelection?.evening?.length ?? 0) > 0;

  // ── Tabs ──
  const tabs = [
    { id: "dnes",     label: "Dnes",     emoji: "📊" },
    { id: "pruvodce", label: "Průvodce", emoji: "✨" },
    { id: "manual",   label: "Manuál",   emoji: "📖" },
  ];

  function renderTab() {
    if (activeTab === "dnes" && dnesSettings) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">Nastavení — Dnes</h2>
              <p className="text-base text-foreground/50 mt-1">Uprav si rituály a denní systém</p>
            </div>
            <button
              onClick={() => { setDnesSettings(false); loadContext(); }}
              className="px-4 py-2 rounded-full border border-foreground/15 text-base font-semibold text-foreground/50 hover:border-foreground/30 hover:text-foreground/70 transition-colors"
            >
              ← Zpět na Dnes
            </button>
          </div>

          {/* Rituály */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">⏱️ Rituály</h3>
              {hasRituals && ritualSelection && (
                <ToolTopBar
                  onReset={async () => {
                    try { localStorage.removeItem(LS_KEY); } catch {}
                    await fetch("/api/manual/user-context", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "rituals", data: {} }) });
                    loadContext();
                  }}
                />
              )}
            </div>
            <NastavSiDenTab
              selection={ritualSelection}
              onSave={(sel) => {
                try { localStorage.setItem(LS_KEY, JSON.stringify(sel)); } catch {}
                fetch("/api/manual/user-context", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "rituals", data: sel }) });
              }}
              onComplete={async (sel) => {
                try { localStorage.setItem(LS_KEY, JSON.stringify(sel)); } catch {}
                await fetch("/api/manual/user-context", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "rituals", data: sel }) });
                loadContext();
              }}
              onReset={async () => {
                try { localStorage.removeItem(LS_KEY); } catch {}
                await fetch("/api/manual/user-context", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "rituals", data: {} }) });
                loadContext();
              }}
            />
          </div>
        </div>
      );
    }

    if (activeTab === "dnes") {
      return (
        <DnesTab
          ritualSelection={ritualSelection}
          kompasData={kompasData}
          hodnotyData={hodnotyData}
          checkins={checkins}
          thisWeekDone={thisWeekDone}
          reflectionDone={reflectionDone}
          onTabChange={goToTab}
          onCheckinSave={handleCheckinSave}
        />
      );
    }

    if (activeTab === "pruvodce") {
      return <CoachingChatPanel />;
    }

    if (activeTab === "manual") {
      return (
        <ManualHub
          context={context}
          onContextChanged={loadContext}
        />
      );
    }

    // Backwards compat: redirect old tab IDs
    if (["prehled", "moje-hodnoty", "tvuj-kompas", "nastav-si-den", "ai-pruvodce"].includes(activeTab)) {
      const redirectMap: Record<string, string> = {
        "prehled": "dnes",
        "moje-hodnoty": "manual",
        "tvuj-kompas": "manual",
        "nastav-si-den": "manual",
        "ai-pruvodce": "pruvodce",
      };
      goToTab(redirectMap[activeTab] ?? "dnes");
      return null;
    }

    return null;
  }

  return (
    <main className="min-h-screen py-16 md:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* 3 Tabs + per-tab actions */}
        <div className="flex items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => goToTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-base font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-accent text-white shadow-md"
                  : "bg-white/85 border border-white/60 shadow-sm hover:shadow-md hover:border-accent/30 hover:text-accent backdrop-blur"
              }`}
            >
              <span>{tab.emoji}</span>
              {tab.label}
            </button>
          ))}

          {/* Dnes tab actions: print + settings — pushed right */}
          {activeTab === "dnes" && (
            <div className="flex items-center gap-1 ml-auto">
              <div className="w-px h-6 bg-foreground/15 mr-1" />
              {hasRituals && ritualSelection && (
                <PrintDayOverviewButton
                  selection={ritualSelection}
                  className="p-2 rounded-full text-foreground/40 hover:text-accent hover:bg-accent/5 transition-colors"
                  iconOnly
                />
              )}
              <button
                onClick={() => setDnesSettings((v) => !v)}
                className={`p-2 rounded-full transition-colors ${dnesSettings ? "text-accent bg-accent/10" : "text-foreground/40 hover:text-accent hover:bg-accent/5"}`}
                title="Nastavení"
              >
                <Settings size={18} />
              </button>
            </div>
          )}
        </div>

        <div>{renderTab()}</div>

        {email && <p className="text-sm text-foreground/30 text-center">{email}</p>}
      </div>
    </main>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FDFDF7]">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
