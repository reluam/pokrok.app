"use client";

import { useEffect, useState } from "react";

interface UserStat {
  userId: string;
  email: string;
  interactions: number;
  inputTokens: number;
  outputTokens: number;
  costCzk: number;
  firstInteraction: string;
  lastInteraction: string;
}

interface MonthlyStat {
  month: string;
  interactions: number;
  uniqueUsers: number;
  costCzk: number;
}

interface Stats {
  totals: {
    users: number;
    interactions: number;
    inputTokens: number;
    outputTokens: number;
    costCzk: number;
    avgCostPerUser: number;
    avgCostPerInteraction: number;
  };
  revenue: {
    subscriptionCzk: number;
    topupCzk: number;
    totalCzk: number;
    profitCzk: number;
  };
  users: UserStat[];
  monthly: MonthlyStat[];
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-black/10 p-4">
      <p className="text-xs font-medium text-foreground/50 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
      {sub && <p className="text-xs text-foreground/40 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AIStatsContent() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/ai-stats");
        if (!res.ok) throw new Error("Failed to load");
        setStats(await res.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Chyba");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p className="text-foreground/60 py-8">Načítání statistik...</p>;
  if (error) return <p className="text-red-600 py-8">{error}</p>;
  if (!stats) return null;

  const { totals, revenue, users, monthly } = stats;
  const isProfitable = revenue.profitCzk >= 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground">AI Statistiky</h2>
        <p className="text-sm text-foreground/60 mt-1">Přehled nákladů a výnosů z AI doporučení</p>
      </div>

      {/* Profit/Loss banner */}
      <div className={`rounded-2xl p-5 ${isProfitable ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-semibold ${isProfitable ? "text-emerald-700" : "text-red-700"}`}>
              {isProfitable ? "Ziskové" : "Ztrátové"} — {isProfitable ? "+" : ""}{revenue.profitCzk.toFixed(2)} Kč
            </p>
            <p className="text-xs text-foreground/50 mt-0.5">
              Příjmy {revenue.totalCzk.toFixed(0)} Kč − Náklady {totals.costCzk.toFixed(2)} Kč
            </p>
          </div>
          <div className={`text-3xl font-bold ${isProfitable ? "text-emerald-600" : "text-red-600"}`}>
            {isProfitable ? "✓" : "!"}
          </div>
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Příjmy celkem"
          value={`${revenue.totalCzk.toFixed(0)} Kč`}
          sub={`Předplatné: ${revenue.subscriptionCzk} Kč · Dokoupení: ${revenue.topupCzk} Kč`}
        />
        <StatCard
          label="Náklady celkem"
          value={`${totals.costCzk.toFixed(2)} Kč`}
          sub={`${(totals.inputTokens / 1000).toFixed(0)}K in · ${(totals.outputTokens / 1000).toFixed(0)}K out tokenů`}
        />
        <StatCard
          label="Ø náklad / uživatel"
          value={`${totals.avgCostPerUser.toFixed(2)} Kč`}
          sub={`${totals.users} uživatelů celkem`}
        />
        <StatCard
          label="Ø náklad / interakce"
          value={`${totals.avgCostPerInteraction.toFixed(2)} Kč`}
          sub={`${totals.interactions} interakcí celkem`}
        />
      </div>

      {/* Monthly breakdown */}
      {monthly.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-foreground mb-3">Po měsících</h3>
          <div className="bg-white rounded-xl border border-black/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/10 bg-black/[0.02]">
                  <th className="text-left px-4 py-3 font-semibold text-foreground/60">Měsíc</th>
                  <th className="text-right px-4 py-3 font-semibold text-foreground/60">Interakce</th>
                  <th className="text-right px-4 py-3 font-semibold text-foreground/60">Uživatelé</th>
                  <th className="text-right px-4 py-3 font-semibold text-foreground/60">Náklady</th>
                </tr>
              </thead>
              <tbody>
                {monthly.map((m) => (
                  <tr key={m.month} className="border-b border-black/5 last:border-0">
                    <td className="px-4 py-2.5 font-medium">{m.month}</td>
                    <td className="px-4 py-2.5 text-right text-foreground/70">{m.interactions}</td>
                    <td className="px-4 py-2.5 text-right text-foreground/70">{m.uniqueUsers}</td>
                    <td className="px-4 py-2.5 text-right font-medium">{m.costCzk.toFixed(2)} Kč</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Per-user breakdown */}
      <div>
        <h3 className="text-lg font-bold text-foreground mb-3">
          Uživatelé ({users.length})
        </h3>
        <div className="bg-white rounded-xl border border-black/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 bg-black/[0.02]">
                <th className="text-left px-4 py-3 font-semibold text-foreground/60">Email</th>
                <th className="text-right px-4 py-3 font-semibold text-foreground/60">Interakce</th>
                <th className="text-right px-4 py-3 font-semibold text-foreground/60">Input tok.</th>
                <th className="text-right px-4 py-3 font-semibold text-foreground/60">Output tok.</th>
                <th className="text-right px-4 py-3 font-semibold text-foreground/60">Náklady</th>
                <th className="text-right px-4 py-3 font-semibold text-foreground/60">Poslední</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.userId} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-2.5 font-medium truncate max-w-[200px]">{u.email}</td>
                  <td className="px-4 py-2.5 text-right text-foreground/70">{u.interactions}</td>
                  <td className="px-4 py-2.5 text-right text-foreground/50">{(u.inputTokens / 1000).toFixed(1)}K</td>
                  <td className="px-4 py-2.5 text-right text-foreground/50">{(u.outputTokens / 1000).toFixed(1)}K</td>
                  <td className="px-4 py-2.5 text-right font-medium">{u.costCzk.toFixed(2)} Kč</td>
                  <td className="px-4 py-2.5 text-right text-foreground/50 text-xs">
                    {new Date(u.lastInteraction).toLocaleDateString("cs-CZ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
