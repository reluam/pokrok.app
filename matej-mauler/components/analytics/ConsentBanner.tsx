"use client";
import { useAnalyticsConsent } from "./PostHogProvider";

// Lehký consent banner ve spaghetti hlasu (lowercase, „a curious friend").
// Ukáže se jen dokud není rozhodnuto; volba se respektuje napříč webem.
export function ConsentBanner() {
  const { consent, accept, decline } = useAnalyticsConsent();
  if (consent !== "unset") return null;

  return (
    <div
      role="dialog"
      aria-label="analytics consent"
      style={{
        position: "fixed",
        left: 12,
        right: 12,
        bottom: 12,
        zIndex: 70,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          pointerEvents: "auto",
          maxWidth: 560,
          width: "100%",
          background: "var(--bg)",
          color: "var(--text-primary)",
          border: "1px solid rgba(26,22,20,0.14)",
          boxShadow: "0 12px 40px -24px rgba(26,22,20,0.35)",
          padding: "16px 18px",
        }}
      >
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, lineHeight: 1.55, margin: 0, color: "#3a342f" }}>
          we use posthog (eu-hosted) to see which experiments land and where things feel off — so we
          can make them better. nothing creepy, no ad-selling. opt out anytime.
        </p>
        <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
          <button
            onClick={accept}
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 13,
              color: "#FAFAF7",
              background: "var(--text-primary)",
              border: "1px solid var(--text-primary)",
              padding: "8px 16px",
              cursor: "pointer",
            }}
          >
            sure, help out
          </button>
          <button
            onClick={decline}
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 13,
              color: "var(--text-primary)",
              background: "transparent",
              border: "1px solid rgba(26,22,20,0.2)",
              padding: "8px 16px",
              cursor: "pointer",
            }}
          >
            no thanks
          </button>
        </div>
      </div>
    </div>
  );
}
