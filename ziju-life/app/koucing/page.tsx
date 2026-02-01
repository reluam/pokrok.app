"use client";

import { useState } from "react";
import DecorativeShapes from "@/components/DecorativeShapes";
import Link from "next/link";

function ContactForm() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.email) {
      alert("Prosím vyplňte povinná pole (Jméno a Email)");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSubmitStatus("success");
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          message: "",
        });
      } else {
        setSubmitStatus("error");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-semibold text-foreground mb-2">
            Jméno <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="firstName"
            required
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className="w-full px-4 py-3 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white"
            placeholder="Jméno"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-semibold text-foreground mb-2">
            Příjmení
          </label>
          <input
            type="text"
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            className="w-full px-4 py-3 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white"
            placeholder="Příjmení"
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-2">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-3 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white"
          placeholder="email@priklad.cz"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-semibold text-foreground mb-2">
          Telefon
        </label>
        <input
          type="tel"
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full px-4 py-3 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white"
          placeholder="+420 123 456 789"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-semibold text-foreground mb-2">
          Zpráva
        </label>
        <textarea
          id="message"
          rows={4}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full px-4 py-3 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white resize-none"
          placeholder="Napiš mi, o čem bys chtěl/a mluvit..."
        />
      </div>

      {submitStatus === "success" && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl">
          Děkuji za zprávu! Brzy se ti ozvu.
        </div>
      )}

      {submitStatus === "error" && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
          Omlouvám se, něco se pokazilo. Zkus to prosím znovu nebo mi napiš přímo na Skoolu.
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-8 py-4 bg-accent text-white rounded-full text-lg font-semibold hover:bg-accent-hover transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Odesílám..." : "Odeslat"}
      </button>
    </form>
  );
}

export default function KoucingPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Sekce */}
      <section className="relative min-h-[70vh] flex items-center justify-center pt-20 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden paper-texture">
        <DecorativeShapes variant="hero" />
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl leading-tight text-foreground">
            Přepni na manuál a vezmi si <span className="hand-drawn-underline">svůj život</span> zpět.
          </h1>
          
          <p className="text-lg md:text-xl lg:text-2xl text-foreground/80 leading-relaxed max-w-3xl mx-auto">
            Nebudu tě učit, jak máš žít. Pomůžu ti rozklíčovat tvé automatické reakce a najít cestu, jak vědomě přepsat programy, které tě doposud řídily.
          </p>
          
          <button
            onClick={() => {
              const element = document.getElementById('rezervace');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className="px-8 py-4 bg-accent text-white rounded-full text-lg font-semibold hover:bg-accent-hover transition-colors shadow-lg hover:shadow-xl"
          >
            Chci změnu
          </button>
        </div>
      </section>

      {/* Pro koho to je? - Prominentní sekce */}
      <section className="relative py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-white/50">
        <DecorativeShapes position="left" />
        <div className="max-w-6xl mx-auto space-y-12 relative z-10">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-8">
              Poznáváš se v tom?
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-stretch">
            {/* Box 1 */}
            <div className="bg-white rounded-2xl p-8 md:p-10 border-2 border-accent/20 hover:border-accent/40 transition-all shadow-lg hover:shadow-xl flex flex-col h-full">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <span className="text-accent font-bold text-xl">✓</span>
                </div>
              </div>
              <p className="text-xl md:text-2xl text-foreground leading-relaxed font-medium flex-1">
                Tvůj den neřídíš ty, ale požadavky ostatních a skryté strachy.
              </p>
            </div>

            {/* Box 2 */}
            <div className="bg-white rounded-2xl p-8 md:p-10 border-2 border-accent/20 hover:border-accent/40 transition-all shadow-lg hover:shadow-xl flex flex-col h-full">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <span className="text-accent font-bold text-xl">✓</span>
                </div>
              </div>
              <p className="text-xl md:text-2xl text-foreground leading-relaxed font-medium flex-1">
                Máš všechno, co bys „měl" mít, ale cítíš, že ti život protéká mezi prsty.
              </p>
            </div>

            {/* Box 3 */}
            <div className="bg-white rounded-2xl p-8 md:p-10 border-2 border-accent/20 hover:border-accent/40 transition-all shadow-lg hover:shadow-xl flex flex-col h-full">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <span className="text-accent font-bold text-xl">✓</span>
                </div>
              </div>
              <p className="text-xl md:text-2xl text-foreground leading-relaxed font-medium flex-1">
                Tvá vlastní mysl je tvůj největší kritik, ne spojenec.
              </p>
            </div>

            {/* Box 4 */}
            <div className="bg-white rounded-2xl p-8 md:p-10 border-2 border-accent/20 hover:border-accent/40 transition-all shadow-lg hover:shadow-xl flex flex-col h-full">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <span className="text-accent font-bold text-xl">✓</span>
                </div>
              </div>
              <p className="text-xl md:text-2xl text-foreground leading-relaxed font-medium flex-1">
                Vidíš, jak reaguješ, ale neumíš to změnit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Jak to u mě vypadá? */}
      <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Jak to u mě vypadá?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-8 border-2 border-black/5 hover:border-accent/30 transition-all">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Žádné manuály
              </h3>
              <p className="text-lg text-foreground/80 leading-relaxed">
                Budeme spolu řešit tvoji unikátní situaci.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border-2 border-black/5 hover:border-accent/30 transition-all">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Fokus na akci
              </h3>
              <p className="text-lg text-foreground/80 leading-relaxed">
                Najdeme konkrétní kroky, jak vzít život zpátky do tvých rukou.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border-2 border-black/5 hover:border-accent/30 transition-all">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Hravost i v těžkých věcech
              </h3>
              <p className="text-lg text-foreground/80 leading-relaxed">
                I vážná témata se dají probrat bez toho, abychom ztratili radost ze života.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cena */}
      <section id="rezervace" className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-8">
              Jaká je cena?
            </h2>
            <div className="space-y-4 max-w-2xl mx-auto">
              <p className="text-lg text-foreground/80 leading-relaxed text-center font-semibold">
                Aktuálně hledám lidi, kteří chtějí jít do hloubky a prozkoumat svůj autopilot společně se mnou.
              </p>
              <p className="text-lg text-foreground/80 leading-relaxed text-center">
                Pomůžeš mi tak ověřit, jak můj přístup funguje v praxi, a ty získáš prostor pro svou změnu. Pokud máš chuť se do toho pustit, rezervuj si sezení zdarma.
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            {/* Levý sloupec - Google Calendar */}
            <div className="bg-white rounded-2xl p-6 md:p-8 border-2 border-black/10">
              <h3 className="text-2xl font-bold text-foreground mb-4 text-center">
                Rezervuj si sezení
              </h3>
              <div className="rounded-lg overflow-hidden">
                <iframe 
                  src="https://calendar.google.com/calendar/appointments/schedules/AcZssZ09WuK7w9SPU0bBC_TuRCmstTwkzazkPtq65gVaPDejfHspyAXwj1RKisdDRFE_Q2PF6a6iZviE?gv=true" 
                  style={{ border: 0 }} 
                  width="100%" 
                  height="600" 
                  frameBorder="0"
                  className="w-full"
                />
              </div>
            </div>

            {/* Pravý sloupec - Formulář */}
            <div className="bg-white rounded-2xl p-6 md:p-8 border-2 border-black/10">
              <h3 className="text-2xl font-bold text-foreground mb-6 text-center">
                Nebo mi zanech zprávu
              </h3>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
