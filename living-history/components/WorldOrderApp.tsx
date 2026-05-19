"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import SideMenu, { type View } from "./SideMenu";
import BigCycleChart from "./BigCycleChart";
import EmpireDetail from "./EmpireDetail";
import IndicatorDetail from "./IndicatorDetail";
import SourcesPage from "./SourcesPage";
import {
  currentPhaseIndicators,
  empireInfo,
  indicatorInfo,
} from "@/lib/bigCycleData";

const RecaptchaGate = dynamic(() => import("./RecaptchaGate"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <span
        style={{
          fontFamily: "var(--font-playfair), Georgia, serif",
          color: "#8b7355",
          letterSpacing: "0.15em",
          fontSize: "0.8rem",
        }}
      >
        Loading…
      </span>
    </div>
  ),
});

const STATUS_COLORS = { positive: "#2e6b4f", warning: "#c87941", critical: "#8b1a1a" };
const STATUS_LABELS = { positive: "Stable", warning: "Caution", critical: "Stress" };

// ---------------------------------------------------------------------------
// The inner app (shown after verification)
// ---------------------------------------------------------------------------
function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [view, setView] = useState<View>({ type: "overview" });

  const headerTitle =
    view.type === "overview"
      ? "The Changing World Order"
      : view.type === "empire"
      ? view.key.charAt(0).toUpperCase() + view.key.slice(1)
      : view.type === "sources"
      ? "Sources"
      : "Key Indicator";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sliding side menu */}
      <SideMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        view={view}
        onNavigate={setView}
      />

      {/* Header */}
      <header
        className="flex items-center gap-4 px-4 sm:px-6 py-3 border-b sticky top-0 z-30"
        style={{
          borderColor: "#8b7355",
          background: "rgba(232,223,200,0.95)",
          backdropFilter: "blur(4px)",
        }}
      >
        {/* Hamburger */}
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="flex flex-col justify-center items-center gap-1.5 flex-shrink-0 rounded-sm p-1 transition-opacity hover:opacity-60"
          style={{ width: 32, height: 32 }}
        >
          <span
            className="block rounded-full"
            style={{ width: 20, height: 1.5, background: "#2c1810" }}
          />
          <span
            className="block rounded-full"
            style={{ width: 20, height: 1.5, background: "#2c1810" }}
          />
          <span
            className="block rounded-full"
            style={{ width: 14, height: 1.5, background: "#2c1810" }}
          />
        </button>

        {/* Breadcrumb / title */}
        <div className="flex items-baseline gap-2 min-w-0">
          {view.type !== "overview" && (
            <>
              <button
                onClick={() => setView({ type: "overview" })}
                className="text-xs opacity-50 hover:opacity-80 transition-opacity flex-shrink-0"
                style={{
                  fontFamily: "var(--font-playfair), Georgia, serif",
                  color: "#5c3a1e",
                  letterSpacing: "0.05em",
                }}
              >
                Overview
              </button>
              <span className="opacity-30 text-xs" style={{ color: "#5c3a1e" }}>
                /
              </span>
            </>
          )}
          <h1
            className="text-base sm:text-lg leading-tight truncate"
            style={{
              fontFamily: "var(--font-playfair), Georgia, serif",
              color: "#2c1810",
            }}
          >
            {view.type === "overview"
              ? "The Changing World Order"
              : view.type === "empire"
              ? empireInfo[view.key].label
              : view.type === "sources"
              ? "Sources & Methodology"
              : indicatorInfo[view.key].label}
          </h1>
        </div>

        <div className="ml-auto hidden sm:block">
          <span
            className="text-xs opacity-40"
            style={{
              fontFamily: "var(--font-crimson), Georgia, serif",
              color: "#5c3a1e",
            }}
          >
            Ray Dalio · Big Cycle · 1500–2100
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {view.type === "overview" && <OverviewContent />}
        {view.type === "empire" && <EmpireDetail empireKey={view.key} />}
        {view.type === "indicator" && <IndicatorDetail indicatorKey={view.key} />}
        {view.type === "sources" && <SourcesPage />}
      </main>

      {/* Footer */}
      <footer
        className="border-t px-6 py-3 text-xs opacity-40 flex gap-4 flex-wrap"
        style={{
          borderColor: "#8b7355",
          fontFamily: "var(--font-crimson), Georgia, serif",
          color: "#5c3a1e",
        }}
      >
        <span>
          Based on <em>Principles for Dealing with the Changing World Order</em> by Ray Dalio.
          Educational use only — all data synthesized from public research.
        </span>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview (the Big Cycle chart + phase indicators)
// ---------------------------------------------------------------------------
function OverviewContent() {
  return (
    <div className="fade-in px-4 sm:px-8 py-6">
      <BigCycleChart />

      <section className="mt-10">
        <div className="ornament-rule mb-5" style={{ color: "#8b7355" }}>
          <span
            style={{
              fontFamily: "var(--font-playfair), Georgia, serif",
              fontSize: "0.68rem",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
            }}
          >
            Current Phase · Late Cycle Transition
          </span>
        </div>

        <p
          className="text-sm sm:text-base leading-relaxed mb-6 max-w-3xl"
          style={{ fontFamily: "var(--font-crimson), Georgia, serif", color: "#4a2e1c" }}
        >
          Dalio identifies several indicators that historically signal the late stage of the Big
          Cycle — the period before a major transition in world order. Use the menu to explore
          each empire or indicator in depth.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentPhaseIndicators.map((ind) => (
            <div
              key={ind.label}
              className="border rounded-sm px-4 py-3"
              style={{ borderColor: "#c4b896", background: "rgba(255,255,255,0.18)" }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className="text-xs font-semibold"
                  style={{
                    fontFamily: "var(--font-playfair), Georgia, serif",
                    color: "#2c1810",
                    letterSpacing: "0.04em",
                  }}
                >
                  {ind.label}
                </span>
                <span
                  className="text-xs px-1.5 py-0.5 rounded-sm"
                  style={{
                    fontFamily: "var(--font-playfair), Georgia, serif",
                    fontSize: "0.62rem",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    background: STATUS_COLORS[ind.status] + "18",
                    color: STATUS_COLORS[ind.status],
                    border: `1px solid ${STATUS_COLORS[ind.status]}44`,
                  }}
                >
                  {STATUS_LABELS[ind.status]}
                </span>
              </div>
              <p
                className="text-xs leading-relaxed"
                style={{
                  fontFamily: "var(--font-crimson), Georgia, serif",
                  color: "#5c3a1e",
                  fontSize: "0.85rem",
                }}
              >
                {ind.detail}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root export — wraps everything in the reCAPTCHA v3 provider
// ---------------------------------------------------------------------------
export default function WorldOrderApp() {
  const [verified, setVerified] = useState(false);

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? ""}
    >
      {verified ? (
        <AppShell />
      ) : (
        <RecaptchaGate onVerify={() => setVerified(true)} />
      )}
    </GoogleReCaptchaProvider>
  );
}
