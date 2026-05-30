"use client";

import { useState, useEffect, useCallback } from "react";
import type { Theme } from "./theme";

// Theme persists across pages via localStorage. SSR renders "cosmic";
// the stored value is applied on mount.
export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>("cosmic");

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "hhgttg" || stored === "cosmic") setTheme(stored);
  }, []);

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next = t === "cosmic" ? "hhgttg" : "cosmic";
      localStorage.setItem("theme", next);
      return next;
    });
  }, []);

  return [theme, toggle];
}
