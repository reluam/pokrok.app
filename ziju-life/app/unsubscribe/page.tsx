"use client";

import { useState } from "react";
import DecorativeShapes from "@/components/DecorativeShapes";

export default function UnsubscribePage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    
    try {
      const res = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
    } catch (err) {
      setError("Něco se pokazilo. Zkus to prosím znovu.");
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen">
      <section className="relative min-h-[50vh] flex items-center justify-center pt-20 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden paper-texture">
        <DecorativeShapes variant="hero" />
        <div className="max-w-2xl mx-auto text-center space-y-8 relative z-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl leading-tight text-foreground">
            Odhlásit se z newsletteru
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-foreground/80 leading-relaxed">
            Pokud už nechceš dostávat emaily, můžeš se kdykoliv odhlásit.
          </p>
        </div>
      </section>

      <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {isSubmitted ? (
            <div className="bg-white rounded-2xl p-8 md:p-10 border-2 border-black/10 text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Odhlášení proběhlo úspěšně
              </h2>
              <p className="text-lg text-foreground/70">
                Už ti nebudeme posílat žádné emaily. Pokud se změníš názor, můžeš se kdykoliv znovu přihlásit.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 md:p-8 border-2 border-black/10">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-2">
                    Emailová adresa
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-black/10 rounded-lg focus:border-accent focus:ring-accent focus:outline-none text-base"
                    placeholder="tvoje@email.cz"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-3 bg-accent text-white rounded-full font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Odhlašuji..." : "Odhlásit se"}
                </button>
              </form>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
