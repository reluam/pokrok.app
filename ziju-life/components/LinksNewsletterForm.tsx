"use client";

import { useState } from "react";

export default function LinksNewsletterForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Něco se pokazilo. Zkus to prosím znovu.");
        setIsSubmitting(false);
        return;
      }

      setIsSubmitted(true);
      setEmail("");
      setIsSubmitting(false);
    } catch {
      setError("Něco se pokazilo. Zkus to prosím znovu.");
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="px-4 py-3 bg-[#4ECDC4]/10 text-[#4ECDC4] rounded-xl text-sm text-center font-medium">
        Hotovo! Potvrď odběr v mailu.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5">
      <input
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setError("");
        }}
        placeholder="email@example.com"
        required
        className="w-full px-4 py-3 rounded-xl border-2 border-black/8 focus:border-[var(--accent-primary)] focus:outline-none text-sm bg-white/60"
      />
      {error && (
        <div className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-4 py-3 bg-foreground text-white rounded-xl text-sm font-bold hover:bg-foreground/85 transition-colors disabled:opacity-50"
      >
        {isSubmitting ? "Odesílám..." : "Přihlásit se"}
      </button>
    </form>
  );
}
