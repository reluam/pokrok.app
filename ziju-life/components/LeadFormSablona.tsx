"use client";

import LeadForm from "@/components/LeadForm";

export default function LeadFormSablona() {
  return (
    <LeadForm
      source="manual_sablona"
      compact
      skipBooking
      submitLabel="Poslat šablonu zdarma"
      successMessage="Šablona je na cestě! Zkontroluj svůj email."
      consentText="Odesláním souhlasíte se zpracováním údajů a zasíláním šablony a případných aktualizací."
    />
  );
}
