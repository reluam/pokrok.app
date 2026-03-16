"use client";

import { useState } from "react";

interface Props {
  isReturning: boolean;
  userEmail?: string;
}

export default function AuditCheckoutButton({ isReturning, userEmail }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    const resolved = (userEmail ?? email).trim().toLowerCase();
    if (!resolved || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resolved)) {
      setError("Zadej prosím platný e-mail.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/products/audit-zivota/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resolved }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Něco se nepovedlo, zkus to prosím znovu.");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Chyba připojení, zkus to prosím znovu.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleBuy} className="space-y-3">
      <div className={`flex flex-col sm:flex-row gap-2 max-w-sm mx-auto${userEmail ? " justify-center" : ""}`}>
        {!userEmail && (
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tvuj@email.cz"
            required
            className="flex-1 px-4 py-3 rounded-full border-2 border-black/15 bg-white text-foreground placeholder:text-foreground/35 focus:outline-none focus:border-accent text-sm"
          />
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-accent text-white rounded-full font-semibold hover:bg-accent-hover transition-colors shadow-md text-sm whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading
            ? "Připravuji…"
            : isReturning
            ? "Koupit znovu za 100 Kč →"
            : "Koupit za 250 Kč →"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
      {!userEmail && (
        <p className="text-xs text-foreground/40 text-center">
          Na tento e-mail ti přijde odkaz pro přístup ihned po zaplacení
        </p>
      )}
    </form>
  );
}
