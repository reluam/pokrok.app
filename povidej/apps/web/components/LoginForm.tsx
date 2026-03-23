"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "../lib/supabase/client";
import styles from "./LoginForm.module.css";

type Step = "idle" | "loading" | "email-sent";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState("");

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStep("loading");
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError("Něco se pokazilo. Zkus to prosím znovu.");
      setStep("idle");
    } else {
      setStep("email-sent");
    }
  }

  async function handleGoogle() {
    setError("");
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  async function handleApple() {
    setError("");
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  if (step === "email-sent") {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.icon}>📬</div>
          <h1 className={styles.heading}>Zkontroluj e-mail</h1>
          <p className={styles.text}>
            Poslali jsme odkaz na <strong>{email}</strong>. Kliknutím na něj se
            přihlásíš.
          </p>
          <button
            className={styles.backBtn}
            onClick={() => setStep("idle")}
            type="button"
          >
            ← Zpět
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <Image src="/pokrok-logo.png" alt="Pokrok" width={120} height={26} priority />
        </div>
        <p className={styles.subheading}>Přihlas se a začni pracovat na sobě</p>

        {/* OAuth tlačítka */}
        <div className={styles.oauthGroup}>
          <button
            className={styles.oauthBtn}
            onClick={handleGoogle}
            type="button"
          >
            <GoogleIcon />
            Pokračovat s Google
          </button>
          <button
            className={`${styles.oauthBtn} ${styles.appleBtn}`}
            onClick={handleApple}
            type="button"
          >
            <AppleIcon />
            Pokračovat s Apple
          </button>
        </div>

        <div className={styles.divider}>
          <span>nebo</span>
        </div>

        {/* Magic link */}
        <form onSubmit={handleMagicLink} className={styles.form}>
          <input
            type="email"
            placeholder="tvuj@email.cz"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            required
            autoComplete="email"
          />
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={step === "loading" || !email.trim()}
          >
            {step === "loading" ? "Odesílám…" : "Přihlásit se e-mailem"}
          </button>
        </form>

        {error && <p className={styles.error}>{error}</p>}

        <p className={styles.terms}>
          Přihlášením souhlasíš s podmínkami použití a zpracováním osobních
          údajů.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
      <path d="M12.752 9.45c-.014-1.503.682-2.64 2.088-3.476-.785-1.123-1.97-1.742-3.534-1.867-1.49-.12-3.115.873-3.71.873-.628 0-2.072-.832-3.175-.832C2.526 4.187 0 6.2 0 10.347c0 1.258.23 2.556.69 3.89.614 1.758 2.83 6.066 5.14 5.995 1.025-.025 1.748-.73 3.084-.73 1.295 0 1.963.73 3.103.73 2.332-.034 4.34-3.948 4.924-5.712-3.13-1.48-3.189-4.99-3.189-5.07zM10.17 2.97C11.093 1.87 11.02.498 10.993 0 9.949.063 8.736.718 8.028 1.55 7.25 2.453 7.11 3.81 7.14 4.23c1.11.085 2.12-.514 3.03-1.26z" />
    </svg>
  );
}
