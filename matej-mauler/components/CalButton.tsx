"use client";

import { useEffect } from "react";

export function CalButton({
  label,
  icon,
}: {
  label: string;
  icon?: React.ReactNode;
}) {
  useEffect(() => {
    if (typeof window === "undefined" || (window as any).Cal) return;
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.innerHTML = `
      (function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if(typeof namespace === "string"){cal.ns[namespace] = cal.ns[namespace] || api;p(cal.ns[namespace], ar);p(cal, ["initNamespace", namespace]);} else p(cal, ar); return;} p(cal, ar); }; })(window, "https://app.cal.eu/embed/embed.js", "init");
      Cal("init", "30min", {origin:"https://app.cal.eu"});
      Cal.ns["30min"]("ui", {"cssVarsPerTheme":{"light":{"cal-brand":"#2C2620"},"dark":{"cal-brand":"#F5EFE6"}},"hideEventTypeDetails":false,"layout":"month_view"});
    `;
    document.head.appendChild(script);
  }, []);

  return (
    <button
      type="button"
      data-cal-namespace="30min"
      data-cal-link="matejmauler/30min"
      data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true","theme":"auto"}'
      className="btn-secondary inline-flex items-center gap-2"
    >
      {icon}
      {label}
    </button>
  );
}
