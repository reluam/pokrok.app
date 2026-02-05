"use client";

import { useState } from "react";

interface StayInContactProps {
  showTitle?: boolean;
  showCommunity?: boolean;
  showDescription?: boolean;
}

export default function StayInContact({ showTitle = true, showCommunity = true, showDescription = false }: StayInContactProps) {
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
    <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
        {showTitle && (
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-3xl md:text-4xl lg:text-5xl text-foreground" style={{ fontWeight: 600 }}>
              <span className="hand-drawn-underline">Stay in kontakt</span>
            </h2>
            {showDescription && (
              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed max-w-3xl mx-auto">
                Zatím jen sonduješ? Nech mi mail a budeme v kontaktu. Každý týden ti pošlu, co je u mě nového, a až budeš připraven převzít řízení naplno, víš, kde mě najít.
              </p>
            )}
          </div>
        )}

        <div className={`grid grid-cols-1 ${showCommunity ? 'md:grid-cols-2' : 'md:grid-cols-1 max-w-2xl mx-auto'} gap-8 md:gap-12`}>
          {/* Vlevo - Komunita */}
          {showCommunity && (
            <div 
              className="bg-white/50 rounded-2xl p-8 md:p-10 border-2 border-black/5 hover:border-accent/30 transition-all transform hover:-translate-y-1"
              style={{ transform: 'rotate(-0.5deg)' }}
            >
              <h3 className="text-2xl md:text-3xl text-foreground mb-4" style={{ fontWeight: 600 }}>
                Připoj se do komunity
              </h3>
              <p className="text-lg text-foreground/80 leading-relaxed mb-6">
                V naší free komunitě na Skoolu najdeš lidi na stejné vlně, společné výzvy a prostor, kde je upřímnost víc než dokonalost.
              </p>
              <a
                href="https://www.skool.com/zijem-life-3913"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-playful inline-block px-8 py-4 bg-accent text-white rounded-full text-lg font-semibold hover:bg-accent-hover transition-colors shadow-lg hover:shadow-xl"
              >
                Nakouknout dovnitř →
              </a>
            </div>
          )}

          {/* Vpravo - Newsletter */}
          <div 
            className="bg-white/50 rounded-2xl p-8 md:p-10 border-2 border-black/5 hover:border-accent/30 transition-all transform hover:-translate-y-1"
            style={{ transform: showCommunity ? 'rotate(0.5deg)' : 'none' }}
          >
            <h3 className="text-2xl md:text-3xl text-foreground mb-4" style={{ fontWeight: 600 }}>
              Newsletter
            </h3>
            <p className="text-lg text-foreground/80 leading-relaxed mb-6">
              Jednou týdně ti pošlu shrnutí toho, co jsem zjistil, co testuju a co mě baví. Bez spamu, jenom to dobrý.
            </p>
            
            {isSubmitted ? (
              <div className="px-8 py-4 bg-accent-secondary/10 text-accent-secondary rounded-full text-center">
                ✓ Díky! Brzy ti přijde první email.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="Tvůj email"
                  required
                  className="w-full px-6 py-4 rounded-full border-2 border-black/10 focus:border-accent focus:outline-none text-lg"
                />
                {error && (
                  <div className="px-4 py-2 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-playful w-full px-8 py-4 bg-accent text-white rounded-full text-lg font-medium hover:bg-accent-hover transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Odesílám..." : "Přihlásit se →"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
