"use client";

import { useEffect } from "react";
import { empireInfo, indicatorInfo, type EmpireKey, type IndicatorKey } from "@/lib/bigCycleData";

export type View =
  | { type: "overview" }
  | { type: "empire"; key: EmpireKey }
  | { type: "indicator"; key: IndicatorKey }
  | { type: "sources" };

interface Props {
  isOpen: boolean;
  onClose: () => void;
  view: View;
  onNavigate: (v: View) => void;
}

const SECTION_LABEL =
  "text-xs tracking-widest uppercase opacity-50 px-5 py-2 mt-3 select-none";

const ITEM_BASE =
  "flex items-center gap-3 px-5 py-2.5 w-full text-left transition-colors duration-150 cursor-pointer text-sm";

export default function SideMenu({ isOpen, onClose, view, onNavigate }: Props) {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  function navigate(v: View) {
    onNavigate(v);
    onClose();
  }

  function isActive(v: View): boolean {
    if (v.type !== view.type) return false;
    if (v.type === "empire" && view.type === "empire") return v.key === view.key;
    if (v.type === "indicator" && view.type === "indicator") return v.key === view.key;
    return v.type === view.type;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{
          background: "rgba(44,24,16,0.45)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
        }}
      />

      {/* Drawer */}
      <nav
        aria-label="Side menu"
        className="fixed top-0 left-0 h-full z-50 flex flex-col overflow-y-auto"
        style={{
          width: 288,
          background: "#1e1208",
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: isOpen ? "4px 0 24px rgba(0,0,0,0.4)" : "none",
          borderRight: "1px solid #3a2010",
        }}
      >
        {/* Drawer header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "#3a2010" }}
        >
          <span
            className="text-xs tracking-widest uppercase"
            style={{
              fontFamily: "var(--font-playfair), Georgia, serif",
              color: "#b09878",
              letterSpacing: "0.22em",
            }}
          >
            Navigation
          </span>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="flex items-center justify-center rounded-sm transition-opacity hover:opacity-70"
            style={{ color: "#b09878", width: 28, height: 28 }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="14" y1="2" x2="2" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Overview link */}
        <button
          onClick={() => navigate({ type: "overview" })}
          className={ITEM_BASE}
          style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            color: isActive({ type: "overview" }) ? "#e8dfc8" : "#8b7355",
            background: isActive({ type: "overview" }) ? "rgba(200,165,76,0.12)" : "transparent",
            borderLeft: isActive({ type: "overview" }) ? "2px solid #c9a84c" : "2px solid transparent",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          Big Cycle Overview
        </button>

        {/* Empires section */}
        <div
          className={SECTION_LABEL}
          style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "#6b5040" }}
        >
          Empires
        </div>

        {(Object.values(empireInfo) as typeof empireInfo[EmpireKey][]).map((e) => {
          const v: View = { type: "empire", key: e.key };
          const active = isActive(v);
          return (
            <button
              key={e.key}
              onClick={() => navigate(v)}
              className={ITEM_BASE}
              style={{
                fontFamily: "var(--font-playfair), Georgia, serif",
                color: active ? "#e8dfc8" : "#8b7355",
                background: active ? "rgba(200,165,76,0.1)" : "transparent",
                borderLeft: active ? `2px solid ${e.color}` : "2px solid transparent",
              }}
            >
              <span
                className="rounded-full flex-shrink-0"
                style={{ width: 8, height: 8, background: e.color }}
              />
              {e.label}
            </button>
          );
        })}

        {/* Key Indicators section */}
        <div
          className={SECTION_LABEL}
          style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "#6b5040", marginTop: "0.75rem" }}
        >
          Key Indicators
        </div>

        {(Object.values(indicatorInfo) as typeof indicatorInfo[IndicatorKey][]).map((ind) => {
          const v: View = { type: "indicator", key: ind.key };
          const active = isActive(v);
          return (
            <button
              key={ind.key}
              onClick={() => navigate(v)}
              className={ITEM_BASE}
              style={{
                fontFamily: "var(--font-crimson), Georgia, serif",
                fontSize: "0.85rem",
                color: active ? "#e8dfc8" : "#8b7355",
                background: active ? "rgba(200,165,76,0.1)" : "transparent",
                borderLeft: active ? "2px solid #c9a84c" : "2px solid transparent",
              }}
            >
              <span
                className="flex-shrink-0 opacity-60 text-xs"
                style={{ color: "#c9a84c", fontFamily: "monospace", width: 14 }}
              >
                —
              </span>
              {ind.label}
            </button>
          );
        })}

        <div className="flex-1" />

        {/* Sources link */}
        <div className="border-t" style={{ borderColor: "#3a2010" }}>
          <button
            onClick={() => navigate({ type: "sources" })}
            className={ITEM_BASE}
            style={{
              fontFamily: "var(--font-playfair), Georgia, serif",
              fontSize: "0.78rem",
              color: isActive({ type: "sources" }) ? "#e8dfc8" : "#6b5040",
              background: isActive({ type: "sources" }) ? "rgba(200,165,76,0.1)" : "transparent",
              borderLeft: isActive({ type: "sources" }) ? "2px solid #c9a84c" : "2px solid transparent",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0, opacity: 0.7 }}>
              <rect x="1" y="1" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.1" />
              <line x1="3.5" y1="4.5" x2="9.5" y2="4.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              <line x1="3.5" y1="6.5" x2="9.5" y2="6.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              <line x1="3.5" y1="8.5" x2="7" y2="8.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            </svg>
            Sources & Methodology
          </button>
        </div>

        <div
          className="px-5 py-3 text-xs opacity-30"
          style={{
            fontFamily: "var(--font-crimson), Georgia, serif",
            color: "#b09878",
          }}
        >
          Based on Ray Dalio · Big Cycle
        </div>
      </nav>
    </>
  );
}
