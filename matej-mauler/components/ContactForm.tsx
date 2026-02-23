"use client";

import { useState } from "react";

type Status = "idle" | "sending" | "success" | "error";

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = (formData.get("name") as string)?.trim() ?? "";
    const email = (formData.get("email") as string)?.trim() ?? "";
    const phone = (formData.get("phone") as string)?.trim() ?? "";
    const message = (formData.get("message") as string)?.trim() ?? "";

    if (!email) {
      setStatus("error");
      setErrorMessage("E-mail je povinný.");
      return;
    }

    setStatus("sending");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error ?? "Nepodařilo se odeslat.");
        return;
      }
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
      setErrorMessage("Nepodařilo se odeslat. Zkuste to znovu.");
    }
  }

  if (status === "success") {
    return (
      <div className="contact-success text-center">
        <div className="contact-success__icon">
          <svg
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <circle cx="32" cy="32" r="32" fill="var(--accent)" fillOpacity="0.15" />
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="var(--accent)"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="contact-success__circle"
            />
            <path
              d="M20 32l8 8 16-16"
              stroke="var(--accent)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              className="contact-success__check"
            />
          </svg>
        </div>
        <h3 className="contact-success__title">Díky!</h3>
        <p className="contact-success__text">
          Tvá poptávka byla úspěšně odeslaná. Ozvu se ti co nejdříve budu moct, nejpozději do 48 hodin.
          Zatím měj fajn den!
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-xl space-y-5"
    >
      <div>
        <label htmlFor="contact-name" className="mb-1.5 block text-sm font-500 text-[var(--fg)]">
          Jméno
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          autoComplete="name"
          className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-[var(--fg)] placeholder-[var(--fg-muted)]/60 outline-none transition focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent)]/30"
          placeholder="Vaše jméno"
          disabled={status === "sending"}
        />
      </div>
      <div>
        <label htmlFor="contact-email" className="mb-1.5 block text-sm font-500 text-[var(--fg)]">
          E-mail <span className="text-[var(--accent)]">*</span>
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-[var(--fg)] placeholder-[var(--fg-muted)]/60 outline-none transition focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent)]/30"
          placeholder="vas@email.cz"
          disabled={status === "sending"}
        />
      </div>
      <div>
        <label htmlFor="contact-phone" className="mb-1.5 block text-sm font-500 text-[var(--fg)]">
          Telefon
        </label>
        <input
          id="contact-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-[var(--fg)] placeholder-[var(--fg-muted)]/60 outline-none transition focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent)]/30"
          placeholder="+420 123 456 789"
          disabled={status === "sending"}
        />
      </div>
      <div>
        <label htmlFor="contact-message" className="mb-1.5 block text-sm font-500 text-[var(--fg)]">
          Zpráva
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={4}
          className="w-full resize-y rounded-xl border border-black/15 bg-white px-4 py-3 text-[var(--fg)] placeholder-[var(--fg-muted)]/60 outline-none transition focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent)]/30"
          placeholder="Napište, s čím vám mohu pomoci…"
          disabled={status === "sending"}
        />
      </div>
      {status === "error" && errorMessage && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-xl border-2 border-[var(--accent)] bg-[var(--accent)] py-3.5 font-600 text-white shadow-md transition hover:bg-[#0e7490] hover:border-[#0e7490] disabled:opacity-60"
      >
        {status === "sending" ? "Odesílám…" : "Odeslat zprávu"}
      </button>
    </form>
  );
}
